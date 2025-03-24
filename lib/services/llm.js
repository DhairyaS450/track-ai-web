const { initializeClients, openai, anthropic, gemini } = require('./clients');

const MAX_RETRIES = 1;
const RETRY_DELAY = 1000;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
      const response = await anthropic.messages.create({
        model: model,
        messages: [{ role: 'user', content: message }],
        max_tokens: 1024,
      });
      return response.content[0].text;
    } catch (error) {
      console.error(`Error sending request to Anthropic (attempt ${i + 1}):`, error.message, error.stack);
      if (i === MAX_RETRIES - 1) throw error;
      await sleep(RETRY_DELAY);
    }
  }
}

async function sendRequestToGemini(model, message) {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      // Split message into parts if it's too long
      const MAX_CHARS = 100000;
      if (message.length > MAX_CHARS) {
        console.warn(`Message length ${message.length} exceeds Gemini's limit. Truncating...`);
        message = message.slice(0, MAX_CHARS);
      }

      // Generate content with safety settings and proper configuration
      const result = await gemini.generateContent({
        contents: [{ role: 'user', parts: [{ text: message }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      });

      // Check if response was blocked by safety settings
      if (result.promptFeedback?.blockReason) {
        throw new Error(`Content blocked: ${result.promptFeedback.blockReason}`);
      }

      // Handle empty or invalid responses
      if (!result.response) {
        throw new Error('Empty response from Gemini');
      }

      const response = await result.response.text();
      if (!response || response.trim().length === 0) {
        throw new Error('Empty or invalid response text from Gemini');
      }

      return response;

    } catch (error) {
      console.error(`Error sending request to Gemini (attempt ${i + 1}):`, error.message, error.stack);
      
      // Check for specific error types and handle accordingly
      if (error.message.includes('INVALID_ARGUMENT')) {
        throw new Error('Invalid input provided to Gemini');
      }
      if (error.message.includes('PERMISSION_DENIED')) {
        throw new Error('API key or permissions issue with Gemini');
      }
      if (error.message.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('Gemini API quota exceeded');
      }

      // On last retry, throw the error
      if (i === MAX_RETRIES - 1) throw error;
      
      // Otherwise, wait and retry
      await sleep(RETRY_DELAY * (i + 1)); // Exponential backoff
    }
  }
}

async function sendLLMRequest(provider, model, message) {
  switch (provider.toLowerCase()) {
    case 'openai':
      return sendRequestToOpenAI(model, message);
    case 'anthropic':
      return sendRequestToAnthropic(model, message);
    case 'gemini':
      return sendRequestToGemini(model, message);
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

module.exports = { sendLLMRequest };
