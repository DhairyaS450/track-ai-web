import api from './api';
import { Task, TimeSlot } from '@/types';

// Helper functions for local storage
const getLocalTasks = (): Task[] => {
  const tasks = localStorage.getItem('tasks');
  return tasks ? JSON.parse(tasks) : [];
};

const saveLocalTasks = (tasks: Task[]) => {
  localStorage.setItem('tasks', JSON.stringify(tasks));
};

// Get Tasks
// GET /tasks
// Response: { tasks: Task[] }
export const getTasks = (includeCompleted: boolean = false) => {
  return new Promise<{ tasks: Task[] }>((resolve) => {
    setTimeout(() => {
      const localTasks = getLocalTasks();

      if (localTasks.length > 0) {
        resolve({
          tasks: localTasks.filter(task =>
            includeCompleted ||
            new Date(task.deadline) > new Date()
          )
        });
        return;
      }

      const mockTasks = [
        {
          id: '1',
          title: 'Math Assignment',
          description: 'Complete calculus homework',
          priority: 'High' as const,
          deadline: '2024-03-20T23:59:59',
          timeSlots: [
            {
              startDate: '2024-03-20T10:00:00',
              endDate: '2024-03-20T12:00:00'
            },
            {
              startDate: '2024-03-20T14:00:00',
              endDate: '2024-03-20T16:00:00'
            }
          ],
          status: 'completed' as const,
          subject: 'Mathematics',
          resources: 'https://example.com/math-resources',
          completion: 100
        },
        {
          id: '2',
          title: 'Physics Lab Report',
          description: 'Write up experiment results',
          priority: 'Medium' as const,
          deadline: '2024-03-21T23:59:59',
          timeSlots: [
            {
              startDate: '2024-03-21T14:00:00',
              endDate: '2024-03-21T16:00:00'
            }
          ],
          status: 'completed' as const,
          subject: 'Physics',
          resources: 'https://example.com/physics-resources',
          completion: 100
        },
        {
          id: '3',
          title: 'Literature Essay',
          description: 'Write analysis of Shakespeare',
          priority: 'Low' as const,
          deadline: '2024-05-22T23:59:59',
          timeSlots: [
            {
              startDate: '2024-05-22T09:00:00',
              endDate: '2024-05-22T11:00:00'
            }
          ],
          status: 'todo' as const,
          subject: 'English',
          resources: 'https://example.com/literature-resources',
          completion: 0
        }
      ];

      resolve({
        tasks: mockTasks.filter(task =>
          includeCompleted ||
          new Date(task.deadline) > new Date()
        )
      });
    }, 500);
  });
};

// Add Task
// POST /tasks
// Request: Omit<Task, 'id'>
// Response: { task: Task }
export const addTask = (task: Omit<Task, 'id'>) => {
  return new Promise<{ task: Task }>((resolve) => {
    setTimeout(() => {
      const newTask: Task = {
        ...task,
        id: Math.random().toString(36).substring(7),
        completion: task.completion || 0,
        status: task.completion === 100 ? 'completed' : task.status || 'todo'
      };

      // Save to local storage
      const tasks = getLocalTasks();
      tasks.push(newTask);
      saveLocalTasks(tasks);

      resolve({ task: newTask });
    }, 500);
  });
};

// Update Task
// PUT /tasks/:id
// Request: Partial<Task>
// Response: { task: Task }
export const updateTask = (id: string, updates: Partial<Task>) => {
  return new Promise<{ task: Task }>((resolve) => {
    setTimeout(() => {
      const tasks = getLocalTasks();
      const taskIndex = tasks.findIndex(t => t.id === id);

      if (taskIndex !== -1) {
        // Update task and automatically set status to completed if completion is 100%
        const updatedTask = {
          ...tasks[taskIndex],
          ...updates,
          completion: updates.completion ?? tasks[taskIndex].completion,
          status: updates.completion === 100 ? 'completed' : (updates.status ?? tasks[taskIndex].status)
        };
        tasks[taskIndex] = updatedTask;
        saveLocalTasks(tasks);
        resolve({ task: updatedTask });
      } else {
        const newTask: Task = {
          id,
          title: 'Updated Task',
          description: 'Updated description',
          priority: 'Medium' as const,
          deadline: '2024-03-20T23:59:59',
          timeSlots: [
            {
              startDate: '2024-03-20T10:00:00',
              endDate: '2024-03-20T12:00:00'
            }
          ],
          status: updates.completion === 100 ? 'completed' : 'in-progress',
          subject: 'Mathematics',
          resources: '',
          completion: 0,
          ...updates
        };
        resolve({ task: newTask });
      }
    }, 500);
  });
};

// Delete Task
// DELETE /tasks/:id
// Response: { success: boolean }
export const deleteTask = (id: string) => {
  return new Promise<{ success: boolean }>((resolve) => {
    setTimeout(() => {
      const tasks = getLocalTasks();
      const filteredTasks = tasks.filter(t => t.id !== id);
      saveLocalTasks(filteredTasks);
      resolve({ success: true });
    }, 500);
  });
};