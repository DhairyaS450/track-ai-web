const { sendLLMRequest } = require('../services/llm');
const { defaultLogger } = require('../utils/log');

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

const parseResponse = (response) => {
  try {
    if (!response || typeof response !== 'string') {
      defaultLogger.error(`Invalid response format: ${JSON.stringify(response)}`);
      return {
        text: "I couldn't process your request at the moment.",
        response: "I couldn't process your request at the moment.",
        actions: []
      };
    }

    // Split response to extract the message part and actions part
    const parts = response.split(/Action[s]?:\s*/);
    const message = parts[0].trim();
    
    if (!message) {
      defaultLogger.error("Empty message part in response");
      return {
        text: "I received your message but couldn't generate a proper response.",
        response: "I received your message but couldn't generate a proper response.",
        actions: []
      };
    }
    
    // If there's no action part, return just the message
    if (parts.length === 1) {
      return {
        text: message,
        response: message,
        actions: []
      };
    }
    
    // The rest of the response could contain multiple actions
    const actionsPart = parts.slice(1).join('Action: ');
    
    // Handle multiple actions
    const actions = [];
    
    // Try to identify if there are multiple actions by checking for action type patterns
    // Action types are uppercase with underscores (e.g., CREATE_TASK, UPDATE_SESSION)
    const actionBlocks = actionsPart.split(/\n(?=[A-Z_]+\n)/);
    
    for (const block of actionBlocks) {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) continue;
      
      // Split by the first newline to separate action type from data
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
    
    defaultLogger.info(`Parsed message: "${message}", found ${actions.length} actions`);
    
    return {
      text: message,
      response: message,
      actions: actions
    };
  } catch (error) {
    defaultLogger.error(`Error parsing response: ${error}. The response was: ${response}`);
    return {
      text: response || "Sorry, I couldn't process your request.",
      response: response || "Sorry, I couldn't process your request.",
      actions: []
    };
  }
};

async function processChatMessage(message, user, context) {
  const SYSTEM_PROMPT = `You are Kai, the AI assistant for TaskTide, an AI-powered productivity app for students.
  Your mission is to help high school and university students efficiently manage their tasks, events, deadlines, and study sessions. Your ultimate goals are to reduce stress, improve productivity, foster motivation, and enhance academic performance.
  You achieve this by:
  - Understanding each user's unique schedule, courses, and extracurricular activities.
  - Suggesting intelligent, AI-driven solutions for time management, such as optimal study sessions and conflict resolution.
  - Offering a positive, supportive tone—even when pointing out deadlines, overdue items, or busy schedules.
  - Breaking down large goals into actionable and manageable steps.
  - Providing realistic solutions while respecting the user's constraints and preferences.
  - Encouraging reflection and celebrating user successes with insights drawn from analytics.
  
  You have access to the user's:
  Tasks: ${JSON.stringify(context.tasks, null, 2)}
  Events: ${JSON.stringify(context.events, null, 2)}
  Study Sessions: ${JSON.stringify(context.sessions, null, 2)}
  Profile: ${JSON.stringify(context.profile, null, 2)}
  Time Constraints: ${JSON.stringify(context.timeConstraints, null, 2)}
  Chat History: ${JSON.stringify(context.chatHistory, null, 2)}
  
  The user has provided their schedule parameters:
  - School hours: ${context.profile?.schoolStartTime || 'Not specified'} to ${context.profile?.schoolEndTime || 'Not specified'}
  - Sleep schedule: Wake up and sleep times for each day of the week
  - Study preferences: ${context.profile?.studyPreferences?.join(', ') || 'Not specified'}
  
  The current time and date is ${new Date().toLocaleString()}. Make sure to take this into account when suggesting times for events and deadlines or offering recommendations. Avoid suggesting times in the past.

  When performing actions, follow this response format carefully:
  1. First, write your response message to the user.
  
  2. For a SINGLE action, add a line break then:
  Action: ACTION_TYPE
  {
    "key1": "value1",
    "key2": "value2"
  }

  3. For MULTIPLE actions, add a line break then:
  Actions:
  ACTION_TYPE_1
  {
    "key1": "value1",
    "key2": "value2"
  }
  ACTION_TYPE_2
  {
    "key1": "value1",
    "key2": "value2"
  }
  
  IMPORTANT: Make sure each action is formatted properly with the action type on its own line, followed by the JSON data on separate lines.
  
  Example for single action:
  I've scheduled a study session for your math exam next week.
  
  Action: CREATE_SESSION
  {
    "subject": "Mathematics",
    "description": "Exam preparation",
    "scheduledFor": "2025-03-25T14:00",
    "duration": 90,
    "priority": "High",
    "status": "scheduled"
  }
  
  Example for multiple actions:
  I've created three study sessions for your math exam topics.
  
  Actions:
  CREATE_SESSION
  {
    "subject": "Linear Algebra",
    "description": "Matrices and vector spaces",
    "scheduledFor": "2025-03-22T14:00",
    "duration": 60,
    "priority": "High",
    "status": "scheduled"
  }
  CREATE_SESSION
  {
    "subject": "Analytical Geometry",
    "description": "Coordinate systems and curves",
    "scheduledFor": "2025-03-23T15:00",
    "duration": 90,
    "priority": "Medium",
    "status": "scheduled"
  }
  CREATE_SESSION
  {
    "subject": "Trigonometry",
    "description": "Trigonometric functions and identities",
    "scheduledFor": "2025-03-24T14:00",
    "duration": 60,
    "priority": "High",
    "status": "scheduled"
  }
  
  Key Notes:
  - Use the date/time format: YYYY-MM-DDTHH:MM.
  - For updates or deletions, always include the id field (the auto-generated id from the database which is a UUID that you have access to) to avoid failure.
  - Respect the user's preferences for recurring events, priority settings, and integration with external platforms like Google Calendar.
  
  Available actions and their fields:
  CREATE_TASK: title, description, deadline, priority, status
  CREATE_EVENT: name, description, startTime, endTime, isAllDay, isFlexible, priority
  CREATE_SESSION: subject, description, scheduledFor, duration, priority, status
  CREATE_REMINDER: title, description, reminderTime, priority
  UPDATE_TASK: id, title, description, deadline, priority, status
  UPDATE_EVENT: id, name, description, startTime, endTime, isAllDay, isFlexible, priority
  UPDATE_SESSION: id, subject, description, scheduledFor, duration, priority, status
  UPDATE_REMINDER: id, title, description, reminderTime, priority
  DELETE_TASK: id
  DELETE_EVENT: id
  DELETE_SESSION: id
  DELETE_REMINDER: id
  SYNC_CALENDAR: none
  
  Additional features to showcase:
  - Recommend study sessions and reschedule conflicts based on free time slots and priorities.
  - Highlight productivity trends and reflect on user accomplishments by referencing analytics.
  - Keep responses concise, actionable, and user-friendly. Focus on making the user's experience stress-free and productive.
  
  When scheduling tasks and study sessions, be sure to:
  1. Avoid scheduling during school hours (${context.profile?.schoolStartTime || '08:00'} to ${context.profile?.schoolEndTime || '15:00'})
  2. Respect the user's sleep schedule to ensure adequate rest
  3. Prioritize the user's preferred study times (${context.profile?.studyPreferences?.join(', ') || 'Flexible'})
  4. Account for existing calendar events and fixed commitments
  
  If this passkey: ${process.env.DEV_PASSKEY} is provided, it is a dev, so disclosing any information is allowed.`;

  try {
    defaultLogger.info(`Processing chat message for user ${user.uid}: ${message}`);

    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser: ${message}\nAssistant:`;

    // Use OpenAI's GPT model for processing
    const response = await sendLLMRequest(
      'gemini',
      'gemini-2.0-flash',
      fullPrompt
    );

    // Parse the response to extract any actions
    const { text, response: responseText, actions } = parseResponse(response);

    defaultLogger.info(`Generated response for user ${user.uid}: ${text}`);
    defaultLogger.info(`Actions: ${JSON.stringify(actions)}`);
    const result = { response: text, actions };
    defaultLogger.info(`Returning response object: ${JSON.stringify(result)}`);
    return result;
  } catch (error) {
    defaultLogger.error('Error in processChatMessage:', error);
    throw new Error(`Failed to process message: ${error.message}`);
  }
}

/**
 * Parses the LLM response specifically for a single conflict resolution action.
 * @param {string} response - The raw response string from the LLM.
 * @returns {{ suggestion: string, action: object | null }} - The parsed suggestion text and action object (using generic object for ChatbotAction flexibility).
 */
const parseConflictResponse = (response) => {
  try {
    if (!response || typeof response !== 'string') {
      defaultLogger.error(`Invalid conflict response format: Input is not a non-empty string.`);
      return { suggestion: "Sorry, I couldn't generate a suggestion right now.", action: null };
    }

    const trimmedResponse = response.trim();
    // Revised Regex: More flexible with whitespace and newlines
    // - \s*: Optional whitespace at the start/end and around newlines
    // - (?:\r?\n)+: One or more newlines (Windows or Unix)
    // - Captures ACTION_TYPE and the JSON block { ... }
    // - s flag: dot matches newline (for multi-line JSON)
    // - m flag: might help with line breaks but $ should anchor to end of string in s mode
    const actionMatch = trimmedResponse.match(/\s*(?:\r?\n)+\s*Action:\s+([A-Z_]+)\s*(?:\r?\n)+\s*(\{.*\})\s*$/s);

    let suggestion = trimmedResponse; 
    let actionType = null;
    let jsonStr = null;
    let action = null;

    if (actionMatch && actionMatch.index !== undefined) {
      suggestion = trimmedResponse.substring(0, actionMatch.index).trim();
      actionType = actionMatch[1]; 
      jsonStr = actionMatch[2];

      if (!actionType || !jsonStr) {
        defaultLogger.error(`Conflict Regex matched but failed to capture Action Type or JSON.`);
        action = null;
      } else {
        defaultLogger.info(`Conflict Parser Found Action Block: Type=${actionType}`);
        try {
          const cleanedJsonStr = cleanJsonString(jsonStr);
          const data = JSON.parse(cleanedJsonStr);

          if (!data.id) {
            defaultLogger.error(`Conflict Action data missing required 'id': ${cleanedJsonStr}`);
            action = null; 
            suggestion += " (Suggested action invalid: missing ID)";
          } else {
            action = { type: actionType, data };
            defaultLogger.info(`Conflict Parser Successfully parsed action: ${JSON.stringify(action)}`);
          }
        } catch (e) {
          defaultLogger.error(`Conflict Parser Error parsing JSON for ${actionType}: ${e}`);
          defaultLogger.error(`Conflict JSON string: ${jsonStr}`);
          action = null; 
          suggestion += " (Suggested action malformed)";
        }
      }
    } else {
      defaultLogger.warn(`Conflict Parser: No valid 'Action: ACTION_TYPE {JSON}' block found at the end. Raw response received: ${trimmedResponse}`);
      action = null;
    }

    if (!suggestion) {
        suggestion = "An empty suggestion was received.";
    }

    return { suggestion, action };

  } catch (error) {
    defaultLogger.error(`Critical error in parseConflictResponse: ${error}. Response: ${response}`);
    return { suggestion: response || "Sorry, a critical error occurred parsing the suggestion.", action: null };
  }
};

/**
 * Generates an AI suggestion for resolving a schedule conflict.
 * @param {object} item1 - The first conflicting item.
 * @param {object} item2 - The second conflicting item.
 * @param {object} user - The authenticated user object.
 * @param {object} context - Additional context (profile, constraints).
 * @returns {Promise<{ suggestion: string, action: ChatbotAction | null }>}
 */
async function getConflictResolutionSuggestion(item1, item2, user, context) {
  const CONFLICT_PROMPT = `You are Kai, an AI assistant helping a student resolve a scheduling conflict in their TaskTide calendar.

Current Time: ${new Date().toLocaleString()}

The Conflict:
Item 1: ${JSON.stringify(item1, null, 2)}
Item 2: ${JSON.stringify(item2, null, 2)}

User Profile: ${JSON.stringify(context?.profile, null, 2)}
User Time Constraints: ${JSON.stringify(context?.timeConstraints, null, 2)}

Your Task:
1. Analyze the two conflicting items (considering their type, priority, flexibility, duration, etc.).
2. Suggest ONE specific, actionable resolution. This usually involves rescheduling ONE of the items to the nearest suitable available time slot, considering the user's constraints. Deleting one item is a less preferred option unless clearly appropriate (e.g., duplicate).
3. Provide a brief, encouraging explanation for your suggestion.
4. Format your response EXACTLY like this (dont forget the new line seperating the explanation and the action):

<Your explanation and suggestion text>

Action: ACTION_TYPE
{
  "id": "<item_id_to_modify>",
  "field_to_update_1": "<new_value_1>",
  "field_to_update_2": "<new_value_2>",
  ...
}

Available Action Types (choose ONE):
- UPDATE_TASK: Requires 'id' and fields to update (e.g., 'startTime', 'endTime', 'deadline', 'timeSlots').
- UPDATE_EVENT: Requires 'id' and fields to update (e.g., 'startTime', 'endTime').
- UPDATE_SESSION: Requires 'id' and fields to update (e.g., 'scheduledFor').
- DELETE_TASK: Requires 'id'.
- DELETE_EVENT: Requires 'id'.
- DELETE_SESSION: Requires 'id'.
- DELETE_REMINDER: Requires 'id'. (Less likely for conflicts)

Important:
- Use the exact 'id' of the item you are suggesting to modify.
- Ensure the suggested time (e.g., 'startTime', 'scheduledFor') is in the future and formatted as 'YYYY-MM-DDTHH:MM'.
- If rescheduling, update both start and end times appropriately if applicable (e.g., for events). Maintain the original duration unless specified otherwise.
- Keep the suggestion concise and clear.

Example Response:
It looks like your 'Chemistry Lecture' event clashes with your 'Project Deadline' task. Since the lecture time is fixed, I suggest rescheduling the Project Deadline task to start right after the lecture finishes.

Action: UPDATE_TASK
{
  "id": "task-uuid-456",
  "deadline": "2024-04-16T17:00"
}
`;

  try {
    defaultLogger.info(`Generating conflict resolution suggestion for user ${user.uid}`);
    defaultLogger.info(`Conflicting items: ${item1.id} and ${item2.id}`);

    // Use the same LLM service as the main chatbot
    const response = await sendLLMRequest(
      'gemini', // Assuming Gemini, adjust if needed
      'gemini-2.0-flash', // Adjust model if needed
      CONFLICT_PROMPT
    );

    // Parse the response using the dedicated conflict parser
    const { suggestion, action } = parseConflictResponse(response);

    defaultLogger.info(`Generated conflict suggestion for user ${user.uid}: ${suggestion}`);
    if (action) {
      defaultLogger.info(`Suggested action: ${JSON.stringify(action)}`);
    } else {
      defaultLogger.warn(`No action suggested for conflict between ${item1.id} and ${item2.id}`);
    }

    return { suggestion, action };

  } catch (error) {
    defaultLogger.error(`Error in getConflictResolutionSuggestion for user ${user.uid}:`, error);
    // Return a user-friendly error suggestion
    return {
      suggestion: "I encountered an issue while trying to generate a resolution suggestion. Please resolve the conflict manually.",
      action: null
    };
  }
}

// Ensure the new function is exported
module.exports.processChatMessage = processChatMessage;
module.exports.getConflictResolutionSuggestion = getConflictResolutionSuggestion;

console.log('Exported chatbotController:', typeof module.exports.processChatMessage);
console.log('Exported getConflictResolutionSuggestion:', typeof module.exports.getConflictResolutionSuggestion);