import { db, auth } from '@/config/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Task, TimeSlot } from '@/types';
import { isSameDay, parseISO } from 'date-fns';

// Get Tasks
// GET /tasks
// Response: { tasks: Task[] }
export const getTasks = async (includeCompleted: boolean = false) => {
  try {
    console.log('Fetching tasks from Firestore');
    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('userId', '==', auth.currentUser?.uid)
    );

    const querySnapshot = await getDocs(q);
    const tasks = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Task[];

    console.log(`Successfully fetched ${tasks.length} tasks from Firestore`);

    return {
      tasks: tasks.filter(task => includeCompleted || task.status !== 'completed')
    };
  } catch (error: any) {
    console.error('Error fetching tasks from Firestore:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }
};

export const getTodayTasks = async () => {
  try {
    console.log('Fetching today\'s tasks from Firestore');
    const { tasks } = await getTasks();
    const today = new Date();

    const todayTasks = tasks.filter(task =>
      task.timeSlots.some(slot => isSameDay(parseISO(slot.startDate), today))
    ).sort((a, b) => {
      const aTime = new Date(a.timeSlots[0].startDate).getTime();
      const bTime = new Date(b.timeSlots[0].startDate).getTime();
      return aTime - bTime;
    });

    console.log(`Successfully filtered ${todayTasks.length} tasks for today`);
    return { tasks: todayTasks };
  } catch (error: any) {
    console.error('Error fetching today\'s tasks:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Failed to fetch today's tasks: ${error.message}`);
  }
};

// Add Task
// POST /tasks
// Request: Omit<Task, 'id'>
// Response: { task: Task }
export const addTask = async (taskData: Omit<Task, 'id'>) => {
  try {
    console.log('Adding new task:', taskData);
    const tasksRef = collection(db, 'tasks');

    // Add created timestamp and user ID
    const taskWithMetadata = {
      ...taskData,
      recurrence: taskData.recurrence || '',
      createdAt: serverTimestamp(),
      userId: auth.currentUser?.uid,
    };

    const docRef = await addDoc(tasksRef, taskWithMetadata);
    console.log('Task added successfully with ID:', docRef.id);

    // Return the created task with its ID
    const task: Task = {
      id: docRef.id,
      ...taskData
    };

    return { task };
  } catch (error: any) {
    console.error('Error adding task:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Failed to create task: ${error.message}`);
  }
};

// Update Task
// PUT /tasks/:id
// Request: Partial<Task>
// Response: { task: Task }
export const updateTask = async (id: string, updates: Partial<Task>) => {
  try {
    console.log('Updating task:', id, updates);
    const taskRef = doc(db, 'tasks', id);

    const updatedData = {
      ...updates,
      recurrence: updates.recurrence || '',
      priority: updates.priority ?? 'Low',
      completion: updates.completion ?? 0,
      status: updates.completion === 100 ? 'completed' : (updates.status ?? 'in-progress')
    };

    await updateDoc(taskRef, updatedData);
    console.log('Task updated successfully:', id);

    // Return the updated task
    return { task: { id, ...updatedData } as Task };
  } catch (error: any) {
    console.error('Error updating task:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Failed to update task: ${error.message}`);
  }
};

// Delete Task
// DELETE /tasks/:id
// Response: { success: boolean }
export const deleteTask = async (id: string) => {
  try {
    console.log('Deleting task:', id);
    const taskRef = doc(db, 'tasks', id);
    await deleteDoc(taskRef);
    console.log('Task deleted successfully:', id);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting task:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Failed to delete task: ${error.message}`);
  }
};