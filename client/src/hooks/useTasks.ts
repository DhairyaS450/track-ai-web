/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { db, auth } from '@/config/firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Task } from '@/types';
import { createDeadline } from '@/api/deadlines';

export function useTasks(includeCompleted: boolean = false) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Task[];

        setTasks(tasksData.filter(task => includeCompleted || task.status !== 'completed'));
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error fetching tasks:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [includeCompleted, auth.currentUser]);

  // CRUD operations
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

      // If task has a deadline, create a deadline record
      if (taskData.deadline) {
        await createDeadline({
            title: taskData.title,
            dueDate: taskData.deadline,
            priority: taskData.priority,
            category: taskData.subject || 'General',
            associatedTaskId: docRef.id,
            status: 'Pending',
            source: 'manual'
          });
      }

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

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask
  };
} 