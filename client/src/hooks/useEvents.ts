/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { db, auth } from '@/config/firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Event } from '@/types';
import { createReminder } from '@/api/reminders';
import { format } from 'date-fns';

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const eventsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Event[];

        setEvents(eventsData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error fetching events:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth.currentUser]);

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
          
          await createReminder({
            userId: auth.currentUser.uid,
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

  return {
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent
  };
} 