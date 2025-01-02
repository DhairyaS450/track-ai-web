const { sendLLMRequest } = require('../services/llm');
const { defaultLogger } = require('../utils/log')

const SYSTEM_PROMPT = `You are an AI study assistant in Track AI Web application. You help students manage their tasks, schedule study sessions, and provide academic advice. Keep responses concise and relevant to studying and task management.

Available commands:
- Create task: "Create a task for [subject] due [date]"
- Schedule study: "Schedule a study session for [subject] on [date]"
- View schedule: "Show my schedule for [date]"
- Get advice: "How can I study [subject] better?"

Respond in a helpful, encouraging tone.`;

async function processChatMessage(message, user) {
  try {
    defaultLogger.info(`Processing chat message for user ${user.uid}: ${message}`);

    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser: ${message}\nAssistant:`;

    // Use OpenAI's GPT model for processing
    const response = await sendLLMRequest(
      'openai',
      'gpt-4o-mini',
      fullPrompt
    );

    defaultLogger.info(`Generated response for user ${user.uid}: ${response}`);
    return response;
  } catch (error) {
    defaultLogger.error('Error in processChatMessage:', error);
    throw new Error(`Failed to process message: ${error.message}`);
  }
}

console.log('Exporting chatbotController:', typeof processChatMessage);
module.exports.processChatMessage = processChatMessage;
console.log('Exported chatbotController:', typeof module.exports.processChatMessage);