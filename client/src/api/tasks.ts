import api from './api';
import { Task } from '@/types';

// Get Tasks
// GET /tasks
// Response: { tasks: Task[] }
export const getTasks = () => {
  return new Promise<{ tasks: Task[] }>((resolve) => {
    setTimeout(() => {
      resolve({
        tasks: [
          {
            id: '1',
            title: 'Math Assignment',
            description: 'Complete calculus homework',
            priority: 'High',
            startDate: '2024-03-20T10:00:00',
            endDate: '2024-03-20T12:00:00',
            status: 'todo',
            subject: 'Mathematics'
          },
          {
            id: '2',
            title: 'Physics Lab Report',
            description: 'Write up experiment results',
            priority: 'Medium',
            startDate: '2024-03-21T14:00:00',
            endDate: '2024-03-21T16:00:00',
            status: 'in-progress',
            subject: 'Physics'
          }
        ]
      });
    }, 500);
  });
};

// Add Task
// POST /tasks
// Request: Task
// Response: { task: Task }
export const addTask = (task: Omit<Task, 'id'>) => {
  return new Promise<{ task: Task }>((resolve) => {
    setTimeout(() => {
      resolve({
        task: {
          ...task,
          id: Math.random().toString(36).substring(7)
        }
      });
    }, 500);
  });
};