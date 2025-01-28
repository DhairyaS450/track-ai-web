const { sendLLMRequest } = require('../services/llm');
const { defaultLogger } = require('../utils/log');

const parseResponse = (response) => {
  try {
    const [message, actionPart] = response.split(/Action:\s*/);
    
    if (actionPart) {
      const [actionType, jsonStr] = actionPart.split(/\n(.+)/s);
      try {
        const data = JSON.parse(jsonStr);
        return {
          text: message.trim(),
          action: {
            type: actionType.trim(),
            data
          }
        };
      } catch (e) {
        defaultLogger.error('Error parsing JSON data:', e);
      }
    }

    return {
      text: message.trim(),
      action: null
    };
  } catch (error) {
    defaultLogger.error('Error parsing response:', error);
    return {
      text: response,
      action: null
    };
  }
};

async function processChatMessage(message, user, context) {
  const SYSTEM_PROMPT = `You are an AI study assistant in TaskTide AI application. You help students manage their tasks, schedule study sessions, and provide academic advice.

  You have access to the user's:
  - Tasks: ${JSON.stringify(context.tasks, null, 2)}
  - Events: ${JSON.stringify(context.events, null, 2)}
  - Study Sessions: ${JSON.stringify(context.sessions, null, 2)}
  - Chat History: ${JSON.stringify(context.chatHistory, null, 2)}

  When performing actions, format your response like this:
  1. Write your response message to the user
  2. On a new line, write "Action:" followed by the action type and JSON data in this format:

  Action: CREATE_TASK
  {
    "title": "Task title",
    "description": "Task description",
    "deadline": "2025-03-25T23:59",
    "priority": "High",
    "status": "todo",
    "timeSlots": [{"startDate": "2025-03-25T10:00", "endDate": "2025-03-25T11:00"}]
  }

  Note: It is important that any time/date is in the format YYYY-MM-DDTHH:MM as shown in the example above. If the user does not provide a time/date, you should use the current time/date.

  Available actions and their required/optional fields:
  CREATE_TASK: title, description, deadline, priority, status, timeSlots
  CREATE_EVENT: name, description, startTime, endTime, isAllDay, isFlexible, priority
  CREATE_SESSION: subject, description, scheduledFor, duration, priority, status
  CREATE_REMINDER: title, description, reminderTime, priority
  CREATE_DEADLINE: title, description, dueDate, priority
  UPDATE_TASK: title, description, deadline, priority, status, timeSlots
  UPDATE_EVENT: name, description, startTime, endTime, isAllDay, isFlexible, priority
  UPDATE_SESSION: subject, description, scheduledFor, duration, priority, status
  UPDATE_REMINDER: title, description, reminderTime, priority
  UPDATE_DEADLINE: title, description, dueDate, priority
  DELETE_TASK: id
  DELETE_EVENT: id
  DELETE_SESSION: id
  DELETE_REMINDER: id
  DELETE_DEADLINE: id
  SYNC_CALENDAR: none

  Keep responses concise and relevant.`;

  try {
    defaultLogger.info(`Processing chat message for user ${user.uid}: ${message}`);

    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser: ${message}\nAssistant:`;

    // Use OpenAI's GPT model for processing
    const response = await sendLLMRequest(
      'openai',
      'gpt-4o-mini',
      fullPrompt
    );

    // Parse the response to extract any actions
    const { text, action } = parseResponse(response);

    defaultLogger.info(`Generated response for user ${user.uid}: ${text}`);
    return { response: text, action };
  } catch (error) {
    defaultLogger.error('Error in processChatMessage:', error);
    throw new Error(`Failed to process message: ${error.message}`);
  }
}

console.log('Exporting chatbotController:', typeof processChatMessage);
module.exports.processChatMessage = processChatMessage;
console.log('Exported chatbotController:', typeof module.exports.processChatMessage);