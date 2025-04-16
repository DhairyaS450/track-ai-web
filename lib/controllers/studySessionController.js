const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();
const { defaultLogger } = require('../utils/log');
const { sendLLMRequest } = require('../services/llm');

/**
 * Cleans a JSON string by removing markdown code block syntax and other formatting
 * @param {string} jsonStr - The JSON string to clean
 * @returns {string} - The cleaned JSON string
 */
const cleanJsonString = (jsonStr) => {
  // Remove markdown code block markers at the beginning (```json, ```, etc.)
  let cleaned = jsonStr.replace(/^```(\w+)?\s*/, '');
  
  // Remove trailing code block markers
  cleaned = cleaned.replace(/\s*```$/, '');
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
};

/**
 * Parse the LLM response to extract actions
 * @param {string} response - Raw response from LLM
 * @returns {Object} - Parsed response with actions
 */
const parseAutoScheduleResponse = (response) => {
  try {
    if (!response || typeof response !== 'string') {
      defaultLogger.error(`Invalid response format: ${JSON.stringify(response)}`);
      return {
        text: "Could not process the auto-schedule request.",
        actions: []
      };
    }

    // Split response to extract the message part and actions part
    const parts = response.split(/Action[s]?:\s*/);
    
    // If there's no action part, return an empty array
    if (parts.length === 1) {
      return {
        text: parts[0].trim(),
        actions: []
      };
    }
    
    // Parse the actions
    const actionsPart = parts.slice(1).join('Action: ');
    const actions = [];
    
    // Split by CREATE_SESSION to identify different sessions
    const actionBlocks = actionsPart.split(/\n(?=CREATE_SESSION\n)/);
    
    for (const block of actionBlocks) {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) continue;
      
      // Split by first newline to separate action type from data
      const firstNewlineIndex = trimmedBlock.indexOf('\n');
      if (firstNewlineIndex === -1) continue;
      
      const actionType = trimmedBlock.substring(0, firstNewlineIndex).trim();
      let jsonStr = trimmedBlock.substring(firstNewlineIndex).trim();
      
      if (!actionType || !jsonStr) continue;
      
      try {
        // Clean the JSON string before parsing
        jsonStr = cleanJsonString(jsonStr);
        
        // Log the cleaned JSON string for debugging
        defaultLogger.info(`Attempting to parse cleaned JSON: ${jsonStr}`);
        
        const data = JSON.parse(jsonStr);
        actions.push({
          type: actionType,
          data
        });
      } catch (e) {
        defaultLogger.error(`Error parsing JSON data for action ${actionType}: ${e}`);
        defaultLogger.error(`JSON string was: ${jsonStr}`);
      }
    }
    
    return {
      text: parts[0].trim() || "Auto-scheduling completed.",
      actions: actions
    };
  } catch (error) {
    defaultLogger.error(`Error parsing response: ${error}. The response was: ${response}`);
    return {
      text: response || "Error in auto-scheduling.",
      actions: []
    };
  }
};

/**
 * Auto-schedules study sessions based on user's request
 * 
 * @param {object} req - Express request object
 */
exports.autoScheduleStudySessions = async (req, res) => {
  try {
    // Extract user information from request
    // During development, use a test user ID if authentication isn't available
    const uid = req.user ? req.user.uid : (process.env.NODE_ENV === 'development' ? 'test-user-id' : null);
    
    if (!uid) {
      defaultLogger.error('User authentication required for auto-scheduling');
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to auto-schedule study sessions.'
      });
    }

    // Extract request parameters and context data passed from frontend
    const { 
      itemData,
      userProfile,
      events,
      studySessions,
      duration,
      autoSchedule = true 
    } = req.body;

    defaultLogger.info(`Auto-scheduling study sessions for user ${uid}`);
    defaultLogger.info(`Request data: ${JSON.stringify(req.body)}`);

    // Use data from itemData instead of separate parameters
    const subject = itemData.subject || itemData.title;
    const description = itemData.description || '';
    const totalDurationRequired = itemData.duration || 60;
    const deadline = itemData.deadline || itemData.startTime;
    const priority = itemData.priority || 'Medium';

    // Input validation
    if (!subject || !totalDurationRequired || !deadline) {
      defaultLogger.error(`Missing required parameters for auto-scheduling: ${JSON.stringify({ subject, totalDurationRequired, deadline })}`);
      return res.status(400).json({ 
        error: 'Missing required parameters', 
        requiredParams: ['subject', 'totalDurationRequired', 'deadline'] 
      });
    }

    if (!autoSchedule) {
      defaultLogger.error(`Auto-schedule flag is set to false`);
      return res.status(400).json({ error: 'Auto-schedule flag is set to false' });
    }

    const currentTime = new Date().toLocaleString();
    const deadlineDate = new Date(deadline);

    // Check if deadline is in the past
    if (deadlineDate <= new Date()) {
      defaultLogger.error(`Deadline ${deadline} is in the past`);
      return res.status(400).json({ error: 'Deadline must be in the future' });
    }

    // Extract user preferences from the passed userProfile
    const userPreferences = userProfile?.preferences || {
      studyPreferences: {},
      sleepSchedule: {}
    };
    
    // Get school hours
    const schoolStartTime = userProfile?.schoolStartTime || '08:00';
    const schoolEndTime = userProfile?.schoolEndTime || '15:00';

    // Construct a prompt for the Gemini API
    const AUTOSCHEDULE_PROMPT = `You are an AI assistant helping a student to auto-schedule their study sessions efficiently.
    
Current Time: ${currentTime}

User's Study Request:
- Subject: ${subject}
- Description: ${description || 'N/A'}
- Total Duration Required: ${totalDurationRequired} minutes
- Deadline: ${deadline}
- Priority: ${priority || 'Medium'}

User's Profile:
- School Hours: ${schoolStartTime} to ${schoolEndTime}
- Sleep Schedule: ${JSON.stringify(userPreferences.sleepSchedule)}
- Study Preferences: ${JSON.stringify(userPreferences.studyPreferences)}

User's Calendar:
${JSON.stringify(events, null, 2)}

Existing Study Sessions:
${JSON.stringify(studySessions, null, 2)}

Your Task:
1. Analyze available time slots between now and the deadline.
2. Consider the user's calendar events, existing study sessions, school hours, sleep schedule, and study preferences.
3. Break down the total duration (${totalDurationRequired} minutes) into manageable chunks (recommended 60-90 minutes per session).
4. Allocate these chunks to available time slots, prioritizing the user's preferred study times.
5. Ensure even distribution of study sessions leading up to the deadline. Don't cram everything at the start or end.
6. Only generate CREATE_SESSION actions as a response.

IMPORTANT GUIDELINES:
- Each study session should have a reasonable duration (ideally 45-90 minutes unless user preferences specify otherwise).
- Schedule sessions during user's preferred study times when possible.
- Avoid scheduling during school hours (${schoolStartTime} to ${schoolEndTime}).
- Respect the user's sleep schedule, but only if necessary, this is the one exception you can make if there is no other time to schedule.
- Avoid conflicts with existing calendar events.
- Distribute sessions across days based on deadline proximity and priority.

Your response must STRICTLY follow this format:

Actions:
CREATE_SESSION
{
  "subject": "Subject Name",
  "description": "Session description",
  "scheduledFor": "YYYY-MM-DDThh:mm:ss",
  "duration": 60,
  "priority": "Medium",
  "status": "scheduled",
  "parentRequestId": "originalRequestId"
}
CREATE_SESSION
{
  "subject": "Subject Name",
  "description": "Session description",
  "scheduledFor": "YYYY-MM-DDThh:mm:ss",
  "duration": 60,
  "priority": "Medium",
  "status": "scheduled",
  "parentRequestId": "originalRequestId"
}

Provide your reasoning briefly first, then list the sessions. But ALWAYS use the exact CREATE_SESSION format for actions.
`;

    // Make a request to the Gemini API
    const llmResponse = await sendLLMRequest('gemini', 'gemini-2.0-flash', AUTOSCHEDULE_PROMPT);
    defaultLogger.info(`Received response from Gemini API: ${llmResponse.substring(0, 200)}...`);

    // Parse the response to extract actions
    const parsedResult = parseAutoScheduleResponse(llmResponse);
    defaultLogger.info(`Parsed actions: ${JSON.stringify(parsedResult.actions.length)}`);

    if (!parsedResult) {
      defaultLogger.error(`Failed to parse response from Gemini API`);
      return res.status(500).json({ 
        error: 'Failed to parse AI response',
        message: 'Could not understand the response from the AI service. Please try again.' 
      });
    }

    const { actions } = parsedResult;

    if (!actions || actions.length === 0) {
      defaultLogger.error(`No valid actions returned from Gemini API`);
      return res.status(500).json({ 
        error: 'Failed to generate study sessions',
        message: 'The AI could not generate a suitable schedule. Please try again or create sessions manually.'
      });
    }

    // Filter to only include CREATE_SESSION actions
    const createSessionActions = actions.filter(action => action.type === 'CREATE_SESSION');
    
    if (createSessionActions.length === 0) {
      defaultLogger.error(`No CREATE_SESSION actions found in response`);
      return res.status(500).json({ 
        error: 'No study sessions were generated',
        message: 'The AI did not create any study sessions. Please try again or create sessions manually.'
      });
    }

    // Create the study sessions in Firestore
    const createdSessions = [];
    for (const action of createSessionActions) {
      try {
        const sessionData = {
          name: action.data.subject,
          description: action.data.description,
          startTime: action.data.scheduledFor,
          duration: action.data.duration,
          priority: action.data.priority,
          status: action.data.status,
          userId: uid,
          category: 'studysession',
          autoScheduled: true,
          parentRequestId: action.data.parentRequestId,
          createdAt: new Date(),
          updatedAt: new Date(),
          source: 'auto-scheduler'
        };

        // Calculate end time for the session
        const startDateTime = new Date(action.data.scheduledFor);
        
        // Preserve the original timezone information to prevent timezone shifting issues
        // This follows the fix for timezone issues mentioned in previous calendar work
        const scheduledFor = action.data.scheduledFor;
        sessionData.startTime = scheduledFor;
        
        // Calculate the end time while preserving timezone format
        const endDateTime = new Date(startDateTime.getTime() + action.data.duration * 60000);
        const endTimeIso = endDateTime.toISOString();
        
        // If the original time has timezone information (like -04:00), preserve that format
        if (scheduledFor.includes('+') || scheduledFor.includes('-')) {
          // Extract timezone part like "-04:00" from original time
          const timezonePart = scheduledFor.substring(scheduledFor.length - 6);
          // Replace Z in ISO string with the extracted timezone
          sessionData.endTime = endTimeIso.replace('Z', timezonePart);
        } else {
          sessionData.endTime = endTimeIso;
        }

        // Save to Firestore
        const docRef = await db.collection('events').add(sessionData);
        createdSessions.push({ 
          id: docRef.id,
          ...sessionData
        });

        defaultLogger.info(`Created study session with ID: ${docRef.id}`);
      } catch (error) {
        defaultLogger.error(`Error creating study session: ${error.message}`);
        // Continue with other sessions even if one fails
      }
    }

    // Return success response with created sessions
    defaultLogger.info(`Successfully created ${createdSessions.length} study sessions for user ${uid}`);
    return res.status(200).json({
      success: true,
      message: `Created ${createdSessions.length} study sessions`,
      sessions: createdSessions
    });

  } catch (error) {
    defaultLogger.error(`Error in autoScheduleStudySessions: ${error.message}\n${error.stack}`);
    // Ensure we always return a properly formatted error response
    return res.status(500).json({ 
      error: error.message || 'Unknown error occurred',
      message: 'An error occurred while auto-scheduling study sessions. Please try again.' 
    });
  }
};
