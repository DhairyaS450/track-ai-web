/* eslint-disable @typescript-eslint/no-explicit-any */
import api from './Api';

export const processChatMessage = async (message: string) => {
  try {
    console.log('Processing chat message:', message);
    const response = await api.post('/api/chatbot', { message });
    console.log('Received chat response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error processing chat message:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};