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
          status: 'in-progress' as const,
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
          linkedEventIds: ['1'],
          startTime: new Date(Date.now() - 1800000).toISOString(), // Started 30 minutes ago
          endTime: new Date(Date.now() + 1800000).toISOString(), // Will end in 30 minutes
          completion: 50,
          notes: ''
        },
        {
          id: '2',
          subject: 'Physics',
          goal: 'Review quantum mechanics concepts',
          duration: 45,
          technique: 'deepwork',
          status: 'scheduled' as const,
          scheduledFor: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          priority: 'Medium' as const,
          isFlexible: true,
          materials: 'https://example.com/physics-materials',
          isAIRecommended: true,
          aiReason: 'Based on your past performance and upcoming test schedule',
          startTime: undefined,
          endTime: undefined,
          completion: 0,
          notes: ''
        }
      ];

      resolve({ sessions: mockSessions });
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
      
      if (storedSessions.length > 0) {
        resolve({ sessions: storedSessions });
        return;
      }

      // Mock data for different session states
      const mockSessions = [
        {
          id: '1',
          subject: 'Mathematics',
          goal: 'Master integration by parts',
          duration: 60,
          technique: 'pomodoro',
          status: 'in-progress' as const,
          scheduledFor: new Date().toISOString(),
          breakInterval: 25,
          breakDuration: 5,
          materials: 'https://example.com/math-materials',
          priority: 'High' as const,
          startTime: new Date(Date.now() - 1800000).toISOString(),
          endTime: new Date(Date.now() + 1800000).toISOString(),
          completion: 50,
          notes: ''
        },
        {
          id: '2',
          subject: 'Physics',
          goal: 'Review quantum mechanics concepts',
          duration: 45,
          technique: 'deepwork',
          status: 'scheduled' as const,
          scheduledFor: new Date(Date.now() + 3600000).toISOString(),
          priority: 'Medium' as const,
          startTime: undefined,
          endTime: undefined,
          completion: 0,
          notes: ''
        },
        {
          id: '3',
          subject: 'Chemistry',
          goal: 'Practice organic chemistry problems',
          duration: 90,
          technique: 'pomodoro',
          status: 'completed' as const,
          scheduledFor: new Date(Date.now() - 86400000).toISOString(),
          priority: 'High' as const,
          startTime: new Date(Date.now() - 86400000).toISOString(),
          endTime: new Date(Date.now() - 86400000 + 5400000).toISOString(),
          completion: 100,
          notes: 'Successfully completed all practice problems. Need to review stereochemistry concepts.'
        }
      ];

      resolve({ sessions: mockSessions });
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
          completion: updates.completion || 0,
          notes: updates.notes || '',
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
          status: 'in-progress' as const,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + sessions[sessionIndex].duration * 60000).toISOString()
        };
        sessions[sessionIndex] = updatedSession;
        saveLocalSessions(sessions);
        resolve({ session: updatedSession });
      }
    }, 500);
  });
};

// End Study Session
// POST /sessions/:id/end
// Request: { notes?: string }
// Response: { session: StudySession }
export const endStudySession = (id: string, notes?: string) => {
  return new Promise<{ session: StudySession }>((resolve) => {
    setTimeout(() => {
      const sessions = getLocalSessions();
      const sessionIndex = sessions.findIndex(s => s.id === id);

      if (sessionIndex !== -1) {
        const updatedSession = {
          ...sessions[sessionIndex],
          status: 'completed' as const,
          endTime: new Date().toISOString(),
          completion: 100,
          notes: notes || sessions[sessionIndex].notes
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

// Update Session Progress
// POST /sessions/:id/progress
// Request: { completion: number }
// Response: { session: StudySession }
export const updateSessionProgress = (id: string, completion: number) => {
  return new Promise<{ session: StudySession }>((resolve) => {
    setTimeout(() => {
      const sessions = getLocalSessions();
      const sessionIndex = sessions.findIndex(s => s.id === id);

      if (sessionIndex !== -1) {
        const updatedSession = {
          ...sessions[sessionIndex],
          completion: Math.min(100, Math.max(0, completion))
        };
        sessions[sessionIndex] = updatedSession;
        saveLocalSessions(sessions);
        resolve({ session: updatedSession });
      }
    }, 500);
  });
};