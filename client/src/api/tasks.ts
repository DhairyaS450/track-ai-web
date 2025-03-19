/* eslint-disable @typescript-eslint/no-explicit-any */
import { db, auth } from '@/config/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Task } from '@/types/index';
import { isSameDay, parseISO } from 'date-fns';
import { createDeadline } from '@/api/deadlines';

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
      task.timeSlots?.some(slot => isSameDay(parseISO(slot.startDate), today))
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

// Get Task by ID
// GET /tasks/:id
// Response: { task: Task }
export const getTaskById = async (id: string) => {
  try {
    console.log('Fetching task by ID:', id);
    const taskRef = doc(db, 'tasks', id);
    const taskSnapshot = await getDoc(taskRef);
    const task = taskSnapshot.data() as Task;
    console.log('Successfully fetched task by ID:', id);
    return { task };
  } catch (error: any) {
    console.error('Error fetching task by ID:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Failed to fetch task by ID: ${error.message}`);
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

    const taskWithMetadata = {
      ...taskData,
      recurrence: taskData.recurrence || '',
      createdAt: serverTimestamp(),
      userId: auth.currentUser?.uid,
    };

    const docRef = await addDoc(tasksRef, taskWithMetadata);

    // Create corresponding deadline
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

    return { 
      task: {
        id: docRef.id,
        ...taskData
      }
    };
  } catch (error: any) {
    console.error('Error adding task:', error);
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

// Update Task in Google Calendar/Tasks
// PUT /api/calendar/tasks/:taskListId/:taskId
// or PUT /api/calendar/events/:calendarId/:eventId
export const updateExternalTask = async (task: Task) => {
  try {
    console.log('Updating external task:', task);
    
    if (!task.id) {
      throw new Error('Task ID is required');
    }
    
    // Determine if it's a Google Calendar event or Google Tasks task
    if (task.source === 'google_calendar') {
      if (!task.calendarId) {
        throw new Error('Calendar ID is required for Google Calendar tasks');
      }
      
      // Format the task data for Google Calendar
      const eventUpdates = {
        updates: {
          summary: task.title,
          description: task.description,
          start: {
            dateTime: new Date(task.deadline).toISOString(),
          },
          end: {
            dateTime: new Date(new Date(task.deadline).getTime() + 30 * 60000).toISOString(), // Add 30 minutes
          }
        }
      };
      
      // Call the API to update the Google Calendar event
      const response = await fetch(`/api/calendar/events/${task.calendarId}/${task.googleEventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventUpdates),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update Google Calendar event: ${errorData.error || response.statusText}`);
      }
      
      return await response.json();
    } 
    else if (task.source === 'google_tasks') {
      if (!task.taskListId) {
        throw new Error('Task List ID is required for Google Tasks');
      }
      
      // Format the task data for Google Tasks
      const taskUpdates = {
        title: task.title,
        notes: task.description,
        status: task.status === 'completed' ? 'completed' : 'needsAction',
        due: task.deadline ? new Date(task.deadline).toISOString() : undefined
      };
      
      // Call the API to update the Google Tasks task
      const response = await fetch(`/api/calendar/tasks/${task.taskListId}/${task.googleEventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskUpdates),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update Google Tasks task: ${errorData.error || response.statusText}`);
      }
      
      return await response.json();
    }
    
    throw new Error('Unsupported external task source');
  } catch (error: any) {
    console.error('Error updating external task:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Failed to update external task: ${error.message}`);
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