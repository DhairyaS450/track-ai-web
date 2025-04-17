import { useState, useEffect, ReactNode, useRef, useContext } from 'react';
import { db, auth } from '@/config/firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc, addDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Task, Event, StudySession, Reminder } from '@/types';
import { format } from 'date-fns';
import { createContext } from 'react';
import { DataContextType } from '@/types';

// Define the context with an initial value of null
const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const providerRef = useRef<boolean>(false);

  console.log('DataProvider', providerRef.current);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (providerRef.current) return;
    providerRef.current = true;

    if (!auth.currentUser) {
      setTasks([]);
      setEvents([]);
      setSessions([]);
      setReminders([]);
      setLoading(false);
      return;
    }

    const unsubscribers: (() => void)[] = [];

    try {
      // Tasks subscription
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('userId', '==', auth.currentUser.uid)
      );
      unsubscribers.push(
        onSnapshot(tasksQuery, (snapshot) => {
          const tasksData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data() as Record<string, any>
          })) as Task[];
          setTasks(tasksData);
        })
      );

      // Events subscription (only regular events, not study sessions)
      const eventsQuery = query(
        collection(db, 'events'),
        where('userId', '==', auth.currentUser.uid),
      );
      unsubscribers.push(
        onSnapshot(eventsQuery, (snapshot) => {
          const eventsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data() as Record<string, any>
          })) as Event[];
          setEvents(eventsData);
        })
      );

      // Study sessions subscription from studySessions collection
      const studySessionsQuery = query(
        collection(db, 'studySessions'),
        where('userId', '==', auth.currentUser.uid)
      );
      unsubscribers.push(
        onSnapshot(studySessionsQuery, (snapshot) => {
          const sessionsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data() as Record<string, any>
          })) as StudySession[];
          setSessions(sessionsData);
        })
      );

      // Reminders subscription
      const remindersQuery = query(
        collection(db, 'reminders'),
        where('userId', '==', auth.currentUser.uid)
      );
      unsubscribers.push(
        onSnapshot(remindersQuery, (snapshot) => {
          const remindersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data() as Record<string, any>
          })) as Reminder[];
          setReminders(remindersData);
        })
      );

      setLoading(false);
    } catch (err) {
      console.error('Error setting up subscriptions:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  // Task functions
  const addTask = async (taskData: Omit<Task, 'id' | 'userId' | 'createdAt'>) => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');

      const taskWithMeta = {
        ...taskData,
        recurrence: taskData.recurrence || 'none',
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'tasks'), taskWithMeta);

      return { task: { id: docRef.id, ...taskWithMeta } as Task };
    } catch (error: any) {
      console.error('Error adding task:', error);
      throw new Error(`Failed to add task: ${error.message}`);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');

      const taskRef = doc(db, 'tasks', id);
      await updateDoc(taskRef, updates);

      return { task: { id, ...updates } as Task };
    } catch (error: any) {
      console.error('Error updating task:', error);
      throw new Error(`Failed to update task: ${error.message}`);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');

      const taskRef = doc(db, 'tasks', id);
      await deleteDoc(taskRef);

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting task:', error);
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  };

  // Event functions
  const addEvent = async (eventData: Omit<Event, 'id' | 'userId' | 'createdAt'>) => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');

      const eventWithMeta = {
        ...eventData,
        recurrence: eventData.recurrence || '',
        createdAt: serverTimestamp(),
        userId: auth.currentUser?.uid,
        calendarId: eventData.calendarId || '',
        isAllDay: eventData.isAllDay || false,
        isFlexible: eventData.isFlexible || false,
        priority: eventData.priority || 'Low'
      };

      const docRef = await addDoc(collection(db, 'events'), eventWithMeta);

      // Create reminders if specified
      if (eventData.reminders?.length) {
        for (const reminder of eventData.reminders) {
          const reminderTime = new Date(new Date(eventData.startTime).getTime() - 
            (reminder.amount * (reminder.type === 'days' ? 86400000 : 
                              reminder.type === 'hours' ? 3600000 : 60000)));
          
          await addReminder({
            title: `Reminder: ${eventData.name}`,
            reminderTime: format(reminderTime, 'yyyy-MM-dd HH:mm:ss'),
            notificationMessage: `Upcoming event: ${eventData.name}`,
            status: 'Active',
            type: 'Quick Reminder',
            linkedEventId: docRef.id
          });
        }
      }

      return { event: { id: docRef.id, ...eventWithMeta } as Event };
    } catch (error: any) {
      console.error('Error adding event:', error);
      throw new Error(`Failed to add event: ${error.message}`);
    }
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');

      const updatedData = {
        ...updates,
        isAllDay: updates.isAllDay || false,
        isFlexible: updates.isFlexible || false,
        priority: updates.priority || 'Low',
        recurrence: updates.recurrence || '',
      };
      const eventRef = doc(db, 'events', id);
      await updateDoc(eventRef, updatedData);

      return { event: { id, ...updates } as Event };
    } catch (error: any) {
      console.error('Error updating event:', error);
      throw new Error(`Failed to update event: ${error.message}`);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');

      const eventRef = doc(db, 'events', id);
      await deleteDoc(eventRef);

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting event:', error);
      throw new Error(`Failed to delete event: ${error.message}`);
    }
  };

  // Session functions
  const addSession = async (sessionData: Omit<StudySession, 'id' | 'userId' | 'createdAt'>) => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');

      // Add default values for any missing fields
      const sessionWithMeta: any = {
        ...sessionData,
        completion: 0,
        notes: sessionData.notes || '',
        createdAt: serverTimestamp(),
        userId: auth.currentUser.uid,
        // Add support for sections
        sessionMode: sessionData.sessionMode || 'basic',
        sections: sessionData.sections || []
      };

      const docRef = await addDoc(collection(db, 'studySessions'), sessionWithMeta);
      return { session: { id: docRef.id, ...sessionWithMeta } as StudySession };
    } catch (error: any) {
      console.error('Error adding session:', error);
      throw new Error(`Failed to add session: ${error.message}`);
    }
  };

  const updateSession = async (id: string, updates: Partial<StudySession>) => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');

      const sessionRef = doc(db, 'studySessions', id);
      const updatedData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(sessionRef, updatedData);
      return { session: { id, ...updates } as StudySession };
    } catch (error: any) {
      console.error('Error updating session:', error);
      throw new Error(`Failed to update session: ${error.message}`);
    }
  };

  const deleteSession = async (id: string) => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');

      try {
        // Only use the studySessions collection
        const sessionRef = doc(db, 'studySessions', id);
        await deleteDoc(sessionRef);
      } catch (err) {
        console.error('Error deleting study session:', err);
        throw new Error(`Failed to delete study session: ${(err as Error).message}`);
      }

      // Remove from local state
      setSessions(prevSessions => prevSessions.filter(s => s.id !== id));

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting session:', error);
      throw new Error(`Failed to delete session: ${error.message}`);
    }
  };

  const startSession = async (id: string) => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');

      const sessionRef = doc(db, 'studySessions', id);
      
      // Get the current session data
      const sessionSnapshot = await getDoc(sessionRef);
      if (!sessionSnapshot.exists()) {
        throw new Error('Session not found');
      }
      
      const sessionData = sessionSnapshot.data() as StudySession;
      
      const updates: any = {
        status: 'in-progress',
        startTime: new Date().toISOString(),
        completion: 0,
      };
      
      // Add currentSectionIndex only if using sections mode
      if (sessionData.sessionMode === 'sections') {
        updates.currentSectionIndex = 0;
      }
      
      // If we have sections, update the first section to in-progress
      if (sessionData.sections && sessionData.sections.length > 0) {
        const updatedSections = [...sessionData.sections];
        updatedSections[0] = { ...updatedSections[0], status: 'in-progress' };
        updates.sections = updatedSections;
      }
      
      await updateDoc(sessionRef, updates);
      
      return { session: { id, ...updates } as StudySession };
    } catch (error: any) {
      console.error('Error starting session:', error);
      throw new Error(`Failed to start session: ${error.message}`);
    }
  };

  const endSession = async (id: string, notes?: string) => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');

      const sessionRef = doc(db, 'studySessions', id);
      const endTime = new Date();
      await updateDoc(sessionRef, {
        status: 'completed',
        endTime: endTime.toISOString(),
        completion: 100,
        notes: notes || '',
        updatedAt: serverTimestamp()
      });

      const sessionSnapshot = await getDoc(sessionRef);
      return {
        session: {
          id: sessionSnapshot.id,
          ...sessionSnapshot.data() as Record<string, any>
        } as StudySession
      };
    } catch (error: any) {
      console.error('Error ending session:', error);
      throw new Error(`Failed to end session: ${error.message}`);
    }
  };

  // Reminder functions
  const addReminder = async (reminderData: Omit<Reminder, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');

      const now = new Date().toISOString();
      const reminderWithMeta = {
        ...reminderData,
        userId: auth.currentUser.uid,
        createdAt: now,
        updatedAt: now,
        status: 'pending'
      };

      if (!reminderWithMeta.recurring) {
        delete reminderWithMeta.recurring;
      }

      const docRef = await addDoc(collection(db, 'reminders'), reminderWithMeta);
      return { reminder: { id: docRef.id, ...reminderWithMeta } as Reminder };
    } catch (error: any) {
      console.error('Error adding reminder:', error);
      throw new Error(`Failed to add reminder: ${error.message}`);
    }
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');
      const now = new Date().toISOString();
      const reminderRef = doc(db, 'reminders', id);
      await updateDoc(reminderRef, {
        ...updates,
        updatedAt: now
      });

      return { reminder: { id, ...updates } as Reminder };
    } catch (error: any) {
      console.error('Error updating reminder:', error);
      throw new Error(`Failed to update reminder: ${error.message}`);
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');

      const reminderRef = doc(db, 'reminders', id);
      await deleteDoc(reminderRef);

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting reminder:', error);
      throw new Error(`Failed to delete reminder: ${error.message}`);
    }
  };

  const dismissReminder = async (id: string) => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');
      const reminderRef = doc(db, 'reminders', id);
    await deleteDoc(reminderRef);

      return { success: true };
    } catch (error: any) {
      console.error('Error dismissing reminder:', error);
      throw new Error(`Failed to dismiss reminder: ${error.message}`);
    }
  };

  // Add a function to handle completing a task with a deadline
  const markTaskComplete = async (taskId: string) => {
    try {
      await updateTask(taskId, { 
        status: 'completed',
        completion: 100
      });

      return { success: true };
    } catch (error) {
      console.error("Error completing task:", error);
      throw error;
    }
  };

  // Add a new function to update a session's current section
  const updateSessionSection = async (id: string, sectionIndex: number) => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');
      
      const sessionRef = doc(db, 'studySessions', id);
      
      // Get the current session data
      const sessionSnapshot = await getDoc(sessionRef);
      if (!sessionSnapshot.exists()) {
        throw new Error('Session not found');
      }
      
      const sessionData = sessionSnapshot.data() as StudySession;
      
      // Validate section index
      if (!sessionData.sections || sectionIndex < 0 || sectionIndex >= sessionData.sections.length) {
        throw new Error('Invalid section index');
      }
      
      // Update sections status
      const updatedSections = [...sessionData.sections];
      
      // Mark previous sections as completed
      for (let i = 0; i < sectionIndex; i++) {
        updatedSections[i] = { ...updatedSections[i], status: 'completed', completion: 100 };
      }
      
      // Mark current section as in-progress
      updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], status: 'in-progress', completion: 0 };
      
      // Mark future sections as pending
      for (let i = sectionIndex + 1; i < updatedSections.length; i++) {
        updatedSections[i] = { ...updatedSections[i], status: 'pending', completion: 0 };
      }
      
      // Calculate overall completion based on completed sections
      const sectionsCount = updatedSections.length;
      const completedCount = sectionIndex;
      const overallCompletion = Math.round((completedCount / sectionsCount) * 100);
      
      await updateDoc(sessionRef, {
        currentSectionIndex: sectionIndex,
        sections: updatedSections,
        completion: overallCompletion
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating session section:', error);
      throw new Error(`Failed to update session section: ${error.message}`);
    }
  };

  return (
    <DataContext.Provider value={{
      tasks,
      events,
      sessions,
      reminders,
      loading,
      error,

      addTask,
      updateTask,
      deleteTask,
      addEvent,
      updateEvent,
      deleteEvent,
      addSession,
      updateSession,
      deleteSession,
      startSession,
      endSession,
      addReminder,
      updateReminder,
      deleteReminder,
      dismissReminder,
      markTaskComplete,
      updateSessionSection,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}