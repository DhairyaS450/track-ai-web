import api from './api';
import { StudySession } from '@/types';
import { isToday } from 'date-fns';

// Helper functions for local storage
const getLocalSessions = (): StudySession[] => {
  const sessions = localStorage.getItem('study_sessions');
  return sessions ? JSON.parse(sessions) : [];
};

const saveLocalSessions = (sessions: StudySession[]) => {
  localStorage.setItem('study_sessions', JSON.stringify(sessions));
};

// Get Today's Study Sessions
// GET /sessions/today
// Response: { sessions: StudySession[] }
export const getTodayStudySessions = () => {
  return new Promise<{ sessions: StudySession[] }>((resolve) => {
    setTimeout(() => {
      const storedSessions = getLocalSessions();

      // If there are stored sessions, filter them for today
      if (storedSessions.length > 0) {
        const todaySessions = storedSessions.filter(session =>
          isToday(new Date(session.scheduledFor))
        );
        resolve({ sessions: todaySessions });
        return;
      }

      // Mock data including AI recommendations
      const mockSessions = [
        {
          id: '1',
          subject: 'Mathematics',
          goal: 'Master integration by parts',
          duration: 60,
          technique: 'pomodoro',
          status: 'scheduled',
          scheduledFor: new Date().toISOString(),
          breakInterval: 25,
          breakDuration: 5,
          materials: 'https://example.com/math-materials',
          priority: 'High' as const,
          isFlexible: false,
          reminders: [
            { type: 'minutes' as const, amount: 15 },
            { type: 'hours' as const, amount: 1 }
          ],
          linkedTaskIds: ['1'],
          linkedEventIds: ['1']
        },
        {
          id: '2',
          subject: 'Physics',
          goal: 'Review quantum mechanics concepts',
          duration: 45,
          technique: 'deepwork',
          status: 'scheduled',
          scheduledFor: new Date().toISOString(),
          priority: 'Medium' as const,
          isFlexible: true,
          materials: 'https://example.com/physics-materials',
          isAIRecommended: true,
          aiReason: 'Based on your past performance and upcoming test schedule'
        }
      ];

      resolve({ sessions: [] });
    }, 500);
  });
};

// Get Study Sessions
// GET /sessions
// Response: { sessions: StudySession[] }
export const getStudySessions = () => {
  return new Promise<{ sessions: StudySession[] }>((resolve) => {
    setTimeout(() => {
      const storedSessions = getLocalSessions();
      resolve({ sessions: storedSessions.length > 0 ? storedSessions : [] });
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
      const newSession: StudySession = {
        ...session,
        id: Math.random().toString(36).substring(7)
      };

      // Save to local storage
      const sessions = getLocalSessions();
      sessions.push(newSession);
      saveLocalSessions(sessions);

      resolve({ session: newSession });
    }, 500);
  });
};

// Update Study Session
// PUT /sessions/:id
// Request: Partial<StudySession>
// Response: { session: StudySession }
export const updateStudySession = (id: string, updates: Partial<StudySession>) => {
  return new Promise<{ session: StudySession }>((resolve) => {
    setTimeout(() => {
      const sessions = getLocalSessions();
      const sessionIndex = sessions.findIndex(s => s.id === id);

      if (sessionIndex !== -1) {
        const updatedSession = {
          ...sessions[sessionIndex],
          ...updates
        };
        sessions[sessionIndex] = updatedSession;
        saveLocalSessions(sessions);
        resolve({ session: updatedSession });
      } else {
        const newSession: StudySession = {
          id,
          subject: updates.subject || 'Updated Session',
          goal: updates.goal || 'Updated goal',
          duration: updates.duration || 60,
          technique: updates.technique || 'pomodoro',
          status: updates.status || 'scheduled',
          scheduledFor: updates.scheduledFor || new Date().toISOString(),
          ...updates
        };
        resolve({ session: newSession });
      }
    }, 500);
  });
};

// Delete Study Session
// DELETE /sessions/:id
// Response: { success: boolean }
export const deleteStudySession = (id: string) => {
  return new Promise<{ success: boolean }>((resolve) => {
    setTimeout(() => {
      const sessions = getLocalSessions();
      const filteredSessions = sessions.filter(s => s.id !== id);
      saveLocalSessions(filteredSessions);
      resolve({ success: true });
    }, 500);
  });
};

// Start Study Session
// POST /sessions/:id/start
// Response: { session: StudySession }
export const startStudySession = (id: string) => {
  return new Promise<{ session: StudySession }>((resolve) => {
    setTimeout(() => {
      const sessions = getLocalSessions();
      const sessionIndex = sessions.findIndex(s => s.id === id);

      if (sessionIndex !== -1) {
        const updatedSession = {
          ...sessions[sessionIndex],
          status: 'in-progress' as const
        };
        sessions[sessionIndex] = updatedSession;
        saveLocalSessions(sessions);
        resolve({ session: updatedSession });
      }
    }, 500);
  });
};

// Postpone Study Session
// POST /sessions/:id/postpone
// Request: { minutes?: number, hours?: number, days?: number }
// Response: { session: StudySession }
export const postponeStudySession = (
  id: string,
  postponeData: { minutes?: number; hours?: number; days?: number }
) => {
  return new Promise<{ session: StudySession }>((resolve) => {
    setTimeout(() => {
      const sessions = getLocalSessions();
      const sessionIndex = sessions.findIndex(s => s.id === id);

      if (sessionIndex !== -1) {
        const currentDate = new Date(sessions[sessionIndex].scheduledFor);
        const minutes = (postponeData.minutes || 0) + 
                       ((postponeData.hours || 0) * 60) + 
                       ((postponeData.days || 0) * 24 * 60);
        
        const newDate = new Date(currentDate.getTime() + minutes * 60000);
        
        const updatedSession = {
          ...sessions[sessionIndex],
          scheduledFor: newDate.toISOString()
        };
        sessions[sessionIndex] = updatedSession;
        saveLocalSessions(sessions);
        resolve({ session: updatedSession });
      }
    }, 500);
  });
};