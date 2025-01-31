/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { db, auth } from '@/config/firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { Reminder } from '@/types';

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setReminders([]);
      setLoading(false);
      return;
    }

    const remindersRef = collection(db, 'reminders');
    const q = query(
      remindersRef,
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const remindersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Reminder[];

        setReminders(remindersData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error fetching reminders:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth.currentUser]);

  const addReminder = async (reminderData: Omit<Reminder, 'id' | 'userId' | 'createdAt'>) => {
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
    //   await updateDoc(reminderRef, {
    //     status: 'dismissed',
    //     dismissedAt: now,
    //     updatedAt: now
    //   });
    await deleteDoc(reminderRef);

      return { success: true };
    } catch (error: any) {
      console.error('Error dismissing reminder:', error);
      throw new Error(`Failed to dismiss reminder: ${error.message}`);
    }
  };

  return {
    reminders,
    loading,
    error,
    addReminder,
    updateReminder,
    deleteReminder,
    dismissReminder
  };
} 