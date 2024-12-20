import api from './api';

export interface StudySessionStats {
  totalStudyTime: number;
  averageSessionDuration: number;
  subjectsByTime: Array<{
    subject: string;
    time: number;
  }>;
}

export interface TaskAnalytics {
  completedTasks: number;
  overdueTasks: number;
  totalTasks: number;
  completionRates: Array<{
    date: string;
    rate: number;
    completed: number;
    total: number;
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
}
// Get Task Analytics
// GET /api/analytics/tasks
// Response: TaskAnalytics 
export const getTaskAnalytics = async (): Promise<TaskAnalytics> => {
  try {
    console.log('Fetching task analytics');
    const response = await api.get('/api/analytics/tasks');
    console.log('Successfully fetched task analytics', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching task analytics:', {
      message: error?.response?.data?.error || error.message,
      status: error?.response?.status,
      stack: error?.stack
    });
    throw new Error(error?.response?.data?.error || error.message);
  }
}