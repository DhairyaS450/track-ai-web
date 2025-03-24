const { sendLLMRequest } = require('../services/llm');
const { defaultLogger } = require('../utils/log');

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
      const jsonStr = trimmedBlock.substring(firstNewlineIndex).trim();
      
      if (!actionType || !jsonStr) continue;
      
      try {
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
  CREATE_TASK: title, description, deadline, priority, status, timeSlots
  CREATE_EVENT: name, description, startTime, endTime, isAllDay, isFlexible, priority
  CREATE_SESSION: subject, description, scheduledFor, duration, priority, status
  CREATE_REMINDER: title, description, reminderTime, priority
  UPDATE_TASK: id, title, description, deadline, priority, status, timeSlots
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
    const result = { response: text, actions };
    defaultLogger.info(`Returning response object: ${JSON.stringify(result)}`);
    return result;
  } catch (error) {
    defaultLogger.error('Error in processChatMessage:', error);
    throw new Error(`Failed to process message: ${error.message}`);
  }
}

console.log('Exporting chatbotController:', typeof processChatMessage);
module.exports.processChatMessage = processChatMessage;
console.log('Exported chatbotController:', typeof module.exports.processChatMessage);