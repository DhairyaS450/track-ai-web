/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { db, auth } from '@/config/firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { Deadline } from '@/types';

export function useDeadlines() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setDeadlines([]);
      setLoading(false);
      return;
    }

    const deadlinesRef = collection(db, 'deadlines');
    const q = query(
      deadlinesRef,
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const deadlinesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Deadline[];

        setDeadlines(deadlinesData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error fetching deadlines:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth.currentUser]);

  const addDeadline = async (deadlineData: Omit<Deadline, 'id' | 'userId' | 'createdAt'>) => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');

      const now = new Date().toISOString();
      const deadlineWithMeta = {
        ...deadlineData,
        userId: auth.currentUser.uid,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, 'deadlines'), deadlineWithMeta);
      return { deadline: { id: docRef.id, ...deadlineWithMeta } as Deadline };
    } catch (error: any) {
      console.error('Error adding deadline:', error);
      throw new Error(`Failed to add deadline: ${error.message}`);
    }
  };

  const updateDeadline = async (id: string, updates: Partial<Deadline>) => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');

      const now = new Date().toISOString();
      const deadlineRef = doc(db, 'deadlines', id);
      await updateDoc(deadlineRef, {
        ...updates,
        updatedAt: now
      });

      return { deadline: { id, ...updates } as Deadline };
    } catch (error: any) {
      console.error('Error updating deadline:', error);
      throw new Error(`Failed to update deadline: ${error.message}`);
    }
  };

  const deleteDeadline = async (id: string) => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');

      const deadlineRef = doc(db, 'deadlines', id);
      await deleteDoc(deadlineRef);

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting deadline:', error);
      throw new Error(`Failed to delete deadline: ${error.message}`);
    }
  };

  const markAsComplete = async (id: string) => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');

      const deadlineRef = doc(db, 'deadlines', id);
    //   await updateDoc(deadlineRef, {
    //     status: 'completed',
    //     completedAt: now,
    //     updatedAt: now
    //   });

    await deleteDoc(deadlineRef);

      return { success: true };
    } catch (error: any) {
      console.error('Error marking deadline as complete:', error);
      throw new Error(`Failed to mark deadline as complete: ${error.message}`);
    }
  };

  return {
    deadlines,
    loading,
    error,
    addDeadline,
    updateDeadline,
    deleteDeadline,
    markAsComplete
  };
} 