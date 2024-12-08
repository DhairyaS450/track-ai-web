import api from './api';
import { StudySession } from '@/types';

// Get Study Sessions
// GET /sessions
// Response: { sessions: StudySession[] }
export const getStudySessions = () => {
  return new Promise<{ sessions: StudySession[] }>((resolve) => {
    setTimeout(() => {
      resolve({
        sessions: [
          {
            id: '1',
            subject: 'Mathematics',
            goal: 'Master integration by parts',
            duration: 60,
            technique: 'Pomodoro',
            status: 'scheduled',
            scheduledFor: '2024-03-20T15:00:00'
          },
          {
            id: '2',
            subject: 'Physics',
            goal: 'Review quantum mechanics',
            duration: 90,
            technique: 'Feynman',
            status: 'completed',
            scheduledFor: '2024-03-19T10:00:00'
          }
        ]
      });
    }, 500);
  });
};

// Add Study Session
// POST /sessions
// Request: StudySession
// Response: { session: StudySession }
export const addStudySession = (session: Omit<StudySession, 'id'>) => {
  return new Promise<{ session: StudySession }>((resolve) => {
    setTimeout(() => {
      resolve({
        session: {
          ...session,
          id: Math.random().toString(36).substring(7)
        }
      });
    }, 500);
  });
};