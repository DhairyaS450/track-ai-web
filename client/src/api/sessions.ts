import api from './api';
import { StudySession } from '@/types';

// Get Study Sessions
// GET /sessions
// Response: { sessions: StudySession[] }
export const getStudySessions = () => {
  return new Promise<{ sessions: StudySession[] }>((resolve) => {
    setTimeout(() => {
      const storedSessions = localStorage.getItem('study_sessions');
      const sessions = storedSessions ? JSON.parse(storedSessions) : [
        {
          id: '1',
          subject: 'Mathematics',
          goal: 'Master integration by parts',
          duration: 60,
          technique: 'pomodoro',
          status: 'scheduled',
          scheduledFor: '2024-03-20T15:00:00',
          breakInterval: 25,
          breakDuration: 5,
          materials: 'https://example.com/math-materials',
          priority: 'High',
          isFlexible: false,
          reminders: [
            { type: 'minutes', amount: 15 },
            { type: 'hours', amount: 1 }
          ],
          linkedTaskIds: ['1'],
          linkedEventIds: ['1']
        },
        {
          id: '2',
          subject: 'Physics',
          goal: 'Review quantum mechanics',
          duration: 90,
          technique: 'deepwork',
          status: 'completed',
          scheduledFor: '2024-03-19T10:00:00',
          priority: 'Medium',
          isFlexible: true,
          materials: 'https://example.com/physics-materials'
        }
      ];

      resolve({ sessions });
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

      // Get existing sessions
      const storedSessions = localStorage.getItem('study_sessions');
      const sessions = storedSessions ? JSON.parse(storedSessions) : [];
      
      // Add new session
      sessions.push(newSession);
      
      // Save back to localStorage
      localStorage.setItem('study_sessions', JSON.stringify(sessions));

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
      // Get existing sessions
      const storedSessions = localStorage.getItem('study_sessions');
      const sessions = storedSessions ? JSON.parse(storedSessions) : [];
      
      // Find and update session
      const sessionIndex = sessions.findIndex((s: StudySession) => s.id === id);
      if (sessionIndex !== -1) {
        const updatedSession = {
          ...sessions[sessionIndex],
          ...updates
        };
        sessions[sessionIndex] = updatedSession;
        
        // Save back to localStorage
        localStorage.setItem('study_sessions', JSON.stringify(sessions));
        
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
      // Get existing sessions
      const storedSessions = localStorage.getItem('study_sessions');
      const sessions = storedSessions ? JSON.parse(storedSessions) : [];
      
      // Remove session
      const filteredSessions = sessions.filter((s: StudySession) => s.id !== id);
      
      // Save back to localStorage
      localStorage.setItem('study_sessions', JSON.stringify(filteredSessions));
      
      resolve({ success: true });
    }, 500);
  });
};