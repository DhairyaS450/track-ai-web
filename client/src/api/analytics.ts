import api from './api';

export interface StudySessionStats {
  totalStudyTime: number;
  averageSessionDuration: number;
  subjectsByTime: Array<{
    subject: string;
    time: number;
  }>;
}

// Get Study Session Statistics
// GET /api/analytics/study-sessions
// Response: StudySessionStats
export const getStudySessionStats = async (): Promise<StudySessionStats> => {
  try {
    console.log('Fetching study session statistics');
    const response = await api.get('/api/analytics/study-sessions');
    console.log('Successfully fetched study session statistics', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching study session statistics:', {
      message: error?.response?.data?.error || error.message,
      status: error?.response?.status,
      stack: error?.stack
    });
    throw new Error(error?.response?.data?.error || error.message);
  }
};