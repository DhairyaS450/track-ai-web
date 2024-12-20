import api from './api';

export interface ProductivityStats {
  daily: Array<{
    date: string;
    score: number;
    completedTasks: number;
    studyMinutes: number;
  }>;
  weekly: Array<{
    weekStart: string;
    weekEnd: string;
    score: number;
    completedTasks: number;
    studyMinutes: number;
  }>;
}

// Get Productivity Statistics
// GET /api/analytics/productivity
// Response: ProductivityStats
export const getProductivityStats = async (): Promise<ProductivityStats> => {
  try {
    console.log('Fetching productivity statistics');
    const response = await api.get('/api/analytics/productivity');
    console.log('Successfully fetched productivity statistics', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching productivity statistics:', {
      message: error?.response?.data?.error || error.message,
      status: error?.response?.status,
      stack: error?.stack
    });
    throw new Error(error?.response?.data?.error || error.message);
  }
}