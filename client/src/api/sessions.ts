/* eslint-disable @typescript-eslint/no-explicit-any */
import { StudySession } from '@/types';
import { isToday } from 'date-fns';
import { db } from '@/config/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { auth } from '@/config/firebase';

// Helper functions for local storage
const getLocalSessions = (): StudySession[] => {
  const sessions = localStorage.getItem('study_sessions');
  return sessions ? JSON.parse(sessions) : [];
};

const saveLocalSessions = (sessions: StudySession[]) => {
  localStorage.setItem('study_sessions', JSON.stringify(sessions));
};

// Update session statuses based on current time
const updateSessionStatuses = (sessions: StudySession[]): StudySession[] => {
  const now = new Date();
  return sessions.map(session => {
    // Skip if already completed
    if (session.status === 'completed') return session;

    // If session has an end time, use that
    const endTime = session.endTime
      ? new Date(session.endTime) 
      : session.startTime
        ? new Date(new Date(session.startTime).getTime() + session.duration * 60000)
        : null;

    // If no valid end time, keep current status
    if (!endTime) return session;

    if (now > endTime) {
      // Only update if not already completed
      const status = session.status as string;
      if (status !== 'completed') {
        updateStudySession(session.id, {
          status: 'completed',
          completion: 100,
          endTime: endTime.toISOString()
        });
      }
      return { ...session, status: 'completed' as const };
    }

    const startTime = new Date(session.scheduledFor);
    if (now >= startTime && now <= endTime) {
      // Only update if not already in progress
      const status = session.status as string;
      if (status !== 'in-progress') {
        updateStudySession(session.id, {
          status: 'in-progress'
        });
      }
      return { ...session, status: 'in-progress' as const };
    }

    return session;
  });
};

// Get Today's Study Sessions
// GET /sessions/today
// Response: { sessions: StudySession[] }
export const getTodayStudySessions = async () => {
  return new Promise<{ sessions: StudySession[] }>((resolve) => {
    setTimeout(async () => {
      const storedSessions = await getStudySessions();
      const updatedSessions = updateSessionStatuses(storedSessions.sessions);
      saveLocalSessions(updatedSessions);

      // Filter for today's sessions
      const todaySessions = updatedSessions.filter(session =>
        isToday(new Date(session.scheduledFor))
      );

      resolve({ sessions: todaySessions });
    }, 500);
  });
};

// Get Study Sessions
// GET /sessions
// Response: { sessions: StudySession[] }
export const getStudySessions = async () => {
  try {
      console.log('Fetching study sessions from Firestore');
      const studySessionsRef = collection(db, 'studySessions');
      const q = query(
        studySessionsRef,
        where('userId', '==', auth.currentUser?.uid)
      );

      const querySnapshot = await getDocs(q);
      const studySessions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudySession[];

      console.log(`Successfully fetched ${studySessions.length} study sessions from Firestore`);

      return {
        sessions: studySessions
      }
    } catch (error: any) {
      console.error('Error fetching study sessions from Firestore:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw new Error(`Failed to fetch study sessions: ${error.message}`);
    }
};

// Get Study Session by ID
// GET /sessions/:id
// Response: { session: StudySession }
export const getStudySessionById = async (id: string) => {
  try {
    console.log('Fetching study session by ID:', id);
    const studySessionRef = doc(db, 'studySessions', id);
    const studySessionSnapshot = await getDoc(studySessionRef);
    const studySession = studySessionSnapshot.data() as StudySession;
    console.log('Successfully fetched study session by ID:', id);
    return { session: studySession };
  } catch (error: any) {
    console.error('Error fetching study session by ID:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Failed to fetch study session by ID: ${error.message}`);
  }
};

// Add Study Session
// POST /sessions
// Request: StudySession
// Response: { session: StudySession }
export const addStudySession = async (session: Omit<StudySession, 'id'>) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('You must be logged in to create a study session');
    }

    const studySessionData = {
      ...session,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      priority: session.priority || 'Low',
    };

    const docRef = await addDoc(collection(db, 'studySessions'), studySessionData);
    console.log('Successful creation to firebase')

    return {
      session: {
        id: docRef.id,
        ...session
      }
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create study session');
  }
};

// Update Study Session
// PUT /sessions/:id
// Request: Partial<StudySession>
// Response: { session: StudySession }
export const updateStudySession = async (id: string, updates: Partial<StudySession>) => {
  try {
      console.log('Updating study sessionk:', id, updates);
      const studySessionRef = doc(db, 'studySessions', id);

      const updatedData = {
        ...updates,
        completion: updates.completion ?? 0,
        status: updates.status || 'scheduled',
        goal: updates.goal || '',
        notes: updates.notes || '',
        linkedTaskIds: updates.linkedTaskIds || [],
        linkedEventIds: updates.linkedEventIds || [],
        priority: updates.priority || 'Low',
        duration: updates.duration || 0,
        scheduledFor: updates.scheduledFor || new Date().toISOString(),
        startTime: updates.startTime || null,
        endTime: updates.endTime || null,
        technique: updates.technique || 'Pomodoro',
      };

      await updateDoc(studySessionRef, updatedData);
      console.log('studySession updated successfully:', id);

      // Return the updated studySession
      return { session: { id, ...updatedData } as StudySession };
    } catch (error: any) {
      console.error('Error updating studySession:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw new Error(`Failed to update studySession: ${error.message}`);
    }
};

// Delete Study Session
// DELETE /sessions/:id
// Response: { success: boolean }
export const deleteStudySession = async (id: string) => {
  try {
    console.log('Deleting study session:', id);
    const studySessionRef = doc(db, 'studySessions', id);
    await deleteDoc(studySessionRef);
    console.log('Study session deleted successfully:', id);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting study session:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Failed to delete study session: ${error.message}`);
  }
};

// Start Study Session
// POST /sessions/:id/start
// Response: { session: StudySession }
export const startStudySession = async (id: string) => {
  try {
    console.log('Starting study session:', id);
    const studySessionRef = doc(db, 'studySessions', id);

    // Get the current time to use as the actual start time
    const startTime = new Date();
    console.log('Using current time as session start time:', startTime.toISOString());
    
    const sessionData = {
      status: 'in-progress',
      startTime: startTime.toISOString(), // Use current time, not scheduled time
      updatedAt: serverTimestamp()
    };

    await updateDoc(studySessionRef, sessionData);
    console.log('Session updated with start time:', startTime.toISOString());

    // Get the updated session
    const sessionSnapshot = await getDoc(studySessionRef);
    if (!sessionSnapshot.exists()) {
      throw new Error('Session not found');
    }

    return {
      session: {
        id: sessionSnapshot.id,
        ...sessionSnapshot.data()
      } as StudySession
    };
  } catch (error: any) {
    console.error('Error starting study session:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Failed to start study session: ${error.message}`);
  }
};

// End Study Session
// POST /sessions/:id/end
// Request: { notes?: string }
// Response: { session: StudySession }
export const endStudySession = async (id: string, notes?: string) => {
  try {
    console.log('Ending study session:', id);
    const studySessionRef = doc(db, 'studySessions', id);

    const endTime = new Date();
    const sessionData = {
      status: 'completed',
      endTime: endTime.toISOString(),
      completion: 100,
      notes: notes || '',
      updatedAt: serverTimestamp()
    };

    await updateDoc(studySessionRef, sessionData);

    // Get the updated session
    const sessionSnapshot = await getDoc(studySessionRef);
    if (!sessionSnapshot.exists()) {
      throw new Error('Session not found');
    }

    return {
      session: {
        id: sessionSnapshot.id,
        ...sessionSnapshot.data()
      } as StudySession
    };
  } catch (error: any) {
    console.error('Error ending study session:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Failed to end study session: ${error.message}`);
  }
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
export const updateSessionProgress = async (id: string, completion: number) => {
  try {
    console.log('Updating session progress:', id, completion);
    const studySessionRef = doc(db, 'studySessions', id);

    // Get current session data
    const sessionSnapshot = await getDoc(studySessionRef);
    if (!sessionSnapshot.exists()) {
      throw new Error('Session not found');
    }

    const currentSession = sessionSnapshot.data() as StudySession;
    
    // Only update if completion is greater than current value
    if (completion <= (currentSession.completion || 0)) {
      console.log('New completion value not greater than current, skipping update');
      return { session: { ...currentSession, id } as StudySession };
    }

    // Ensure completion is between 0 and 100
    const normalizedCompletion = Math.min(100, Math.max(0, completion));
    
    // Define session data with appropriate typing
    const sessionData: {
      completion: number;
      updatedAt: any;
      status?: 'completed' | 'in-progress' | 'scheduled';
      endTime?: string;
    } = {
      completion: normalizedCompletion,
      updatedAt: serverTimestamp()
    };

    // Automatically set to completed if 100%
    if (normalizedCompletion >= 100) {
      sessionData.status = 'completed';
      sessionData.endTime = new Date().toISOString();
    }

    await updateDoc(studySessionRef, sessionData);
    console.log('Session progress updated successfully:', id, normalizedCompletion);

    // Get the updated session
    const updatedSnapshot = await getDoc(studySessionRef);
    if (!updatedSnapshot.exists()) {
      throw new Error('Session not found after update');
    }

    // Make sure we include the id in the returned object
    return {
      session: {
        id,
        ...updatedSnapshot.data()
      } as StudySession
    };
  } catch (error: any) {
    console.error('Error updating session progress:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Failed to update session progress: ${error.message}`);
  }
};