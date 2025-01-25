import { Deadline, Reminder } from '@/types';
import { db } from '@/config/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
} from 'firebase/firestore';

// Deadlines
export async function createDeadline(deadline: Omit<Deadline, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const now = new Date().toISOString();
    const deadlineData = {
      ...deadline,
      createdAt: now,
      updatedAt: now,
    };
    
    const docRef = await addDoc(collection(db, 'deadlines'), deadlineData);
    return { id: docRef.id, ...deadlineData };
  } catch (error) {
    console.error('Error creating deadline:', error);
    throw error;
  }
}

export async function updateDeadline(id: string, deadline: Partial<Deadline>) {
  try {
    const now = new Date().toISOString();
    await updateDoc(doc(db, 'deadlines', id), {
      ...deadline,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Error updating deadline:', error);
    throw error;
  }
}

export async function deleteDeadline(id: string) {
  try {
    await deleteDoc(doc(db, 'deadlines', id));
  } catch (error) {
    console.error('Error deleting deadline:', error);
    throw error;
  }
}

export async function getDeadlines() {
  try {
    const querySnapshot = await getDocs(collection(db, 'deadlines'));
    const deadlines = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Deadline[];
    return { deadlines };
  } catch (error) {
    console.error('Error getting deadlines:', error);
    throw error;
  }
}

export async function getDeadlineById(id: string) {
  try {
    const docRef = doc(db, 'deadlines', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { deadline: docSnap.data() as Deadline };
    } else {
      throw new Error('Deadline not found');
    }
  } catch (error) {
    console.error('Error getting deadline:', error);
    throw error;
  }
}

// Reminders
export async function createReminder(reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const now = new Date().toISOString();
    const reminderData = {
      ...reminder,
      createdAt: now,
      updatedAt: now,
    };
    
    const docRef = await addDoc(collection(db, 'reminders'), reminderData);
    return { id: docRef.id, ...reminderData };
  } catch (error) {
    console.error('Error creating reminder:', error);
    throw error;
  }
}

export async function updateReminder(id: string, reminder: Partial<Reminder>) {
  try {
    const now = new Date().toISOString();
    await updateDoc(doc(db, 'reminders', id), {
      ...reminder,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Error updating reminder:', error);
    throw error;
  }
}

export async function deleteReminder(id: string) {
  try {
    await deleteDoc(doc(db, 'reminders', id));
  } catch (error) {
    console.error('Error deleting reminder:', error);
    throw error;
  }
}

export async function getReminders() {
  try {
    const querySnapshot = await getDocs(collection(db, 'reminders'));
    const reminders = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Reminder[];
    return { reminders };
  } catch (error) {
    console.error('Error getting reminders:', error);
    throw error;
  }
}

export async function markDeadlineAsComplete(id: string) {
  try {
    await deleteDoc(doc(db, 'deadlines', id));
  } catch (error) {
    console.error('Error marking deadline as complete:', error);
    throw error;
  }
}

export async function dismissReminder(id: string) {
  try {
    await updateReminder(id, { status: 'Dismissed' });
  } catch (error) {
    console.error('Error dismissing reminder:', error);
    throw error;
  }
}
