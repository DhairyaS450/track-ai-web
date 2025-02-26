const { OpenAI } = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

let openai;
let anthropic;
let gemini;
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

    // Initialize Gemini client
    console.log('GEMINI_API_KEY', process.env.GEMINI_API_KEY);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    gemini = genAI.getGenerativeModel({model: 'gemini-2.0-flash'});
  } catch (error) {
    console.error('Error initializing libraries:', error);
    process.exit(1); // Exit the process with an error code
  }
}

initializeClients();

module.exports = { openai, anthropic, gemini };
