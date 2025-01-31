/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { db, auth } from '@/config/firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc, addDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { StudySession } from '@/types';

export function useSessions() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setSessions([]);
      setLoading(false);
      return;
    }

    const sessionsRef = collection(db, 'studySessions');
    const q = query(
      sessionsRef,
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const sessionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as StudySession[];

        setSessions(sessionsData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error fetching sessions:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth.currentUser]);

  const addSession = async (sessionData: Omit<StudySession, 'id' | 'userId' | 'createdAt'>) => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');

      const sessionWithMeta = {
        ...sessionData,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        priority: sessionData.priority || 'Low',
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

      const sessionRef = doc(db, 'studySessions', id);
      await deleteDoc(sessionRef);

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
      const startTime = new Date();
      await updateDoc(sessionRef, {
        status: 'in-progress',
        startTime: startTime.toISOString(),
        updatedAt: serverTimestamp()
      });

      const sessionSnapshot = await getDoc(sessionRef);
      return {
        session: {
          id: sessionSnapshot.id,
          ...sessionSnapshot.data()
        } as StudySession
      };
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
          ...sessionSnapshot.data()
        } as StudySession
      };
    } catch (error: any) {
      console.error('Error ending session:', error);
      throw new Error(`Failed to end session: ${error.message}`);
    }
  };

  return {
    sessions,
    loading,
    error,
    addSession,
    updateSession,
    deleteSession,
    startSession,
    endSession
  };
} 