const { OpenAI } = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');
const dotenv = require('dotenv');

let openai;
let anthropic;

async function initializeClients() {
  try {
    // Load environment variables
    dotenv.config();

    // Initialize OpenAI client
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize Anthropic client
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  } catch (error) {
    console.error('Error initializing libraries:', error);
    process.exit(1); // Exit the process with an error code
  }
}

initializeClients();

module.exports = { openai, anthropic };
