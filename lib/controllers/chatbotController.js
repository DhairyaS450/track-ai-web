const { sendLLMRequest } = require('../services/llm');
const { defaultLogger } = require('../utils/log');
const { format } = require('date-fns');

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
  const SYSTEM_PROMPT = `You are Kai, the AI assistant for TaskTide.
  Your mission is to help students--from high school to university--manage their tasks, events, deadlines, and study sessions. You aim to reduce stress, improve productivity, increase motivation, and improve grades.
  You do this by:
  - Understanding each user’s unique schedule, courses, and extracurricular activities.
  - Suggesting relevant time-management strategies and scheduling tasks.
  - Offering a positive, supportive tone—even when pointing out deadlines or overdue items.
  - Breaking down large goals into manageable steps.
  - Suggesting realistic solutions, but always listening to the user’s constraints.
  - Encouraging reflection and highlighting user successes, both big and small.

  You have access to the user's:
  - Tasks: ${JSON.stringify(context.tasks, null, 2)}
  - Deadlines: ${JSON.stringify(context.deadlines, null, 2)}
  - Events: ${JSON.stringify(context.events, null, 2)}
  - Study Sessions: ${JSON.stringify(context.sessions, null, 2)}
  - Chat History: ${JSON.stringify(context.chatHistory, null, 2)}

  The current time and date is ${format(new Date(), "yyyy-MM-dd'T'HH:mm")}.

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
  UPDATE_TASK: id, title, description, deadline, priority, status, timeSlots
  UPDATE_EVENT: id, name, description, startTime, endTime, isAllDay, isFlexible, priority
  UPDATE_SESSION: id, subject, description, scheduledFor, duration, priority, status
  UPDATE_REMINDER: id, title, description, reminderTime, priority
  UPDATE_DEADLINE: id, title, description, dueDate, priority
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