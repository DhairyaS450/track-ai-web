(async () => {
  try {
    // Import libraries dynamically
    const { OpenAI } = await import('openai');
    const { Anthropic } = await import('@anthropic-ai/sdk');
    const dotenv = await import('dotenv');

    // Load environment variables
    dotenv.config();

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize Anthropic client
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Export initialized clients
    module.exports = { openai, anthropic };

  } catch (error) {
    console.error('Error initializing libraries:', error);
    process.exit(1); // Exit the process with an error code
  }
})();

const openai = module.exports.openai;
const anthropic = module.exports.anthropic;

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendRequestToOpenAI(model, message) {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: message }],
        max_tokens: 1024,
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.error(`Error sending request to OpenAI (attempt ${i + 1}):`, error.message, error.stack);
      if (i === MAX_RETRIES - 1) throw error;
      await sleep(RETRY_DELAY);
    }
  }
}

async function sendRequestToAnthropic(model, message) {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      console.log(`Sending request to Anthropic with model: ${model} and message: ${message}`);
      const response = await anthropic.messages.create({
        model: model,
        messages: [{ role: 'user', content: message }],
        max_tokens: 1024,
      });
      console.log(`Received response from Anthropic: ${JSON.stringify(response.content)}`);
      return response.content[0].text;
    } catch (error) {
      console.error(`Error sending request to Anthropic (attempt ${i + 1}):`, error.message, error.stack);
      if (i === MAX_RETRIES - 1) throw error;
      await sleep(RETRY_DELAY);
    }
  }
}

async function sendLLMRequest(provider, model, message) {
  console.log('sendLLMRequest called with:', { provider, model, message });
  console.log('Environment variables:', {
    OPENAI_KEY: !!process.env.OPENAI_API_KEY,
    ANTHROPIC_KEY: !!process.env.ANTHROPIC_API_KEY
  });

  switch (provider.toLowerCase()) {
    case 'openai':
      return sendRequestToOpenAI(model, message);
    case 'anthropic':
      return sendRequestToAnthropic(model, message);
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

module.exports = {
  sendLLMRequest
};