import api from './Api';
import { MoodEntry } from '@/types';

// Get Mood Entries
// GET /mood
// Response: { entries: MoodEntry[] }
export const getMoodEntries = () => {
  return new Promise<{ entries: MoodEntry[] }>((resolve) => {
    setTimeout(() => {
      resolve({
        entries: [
          {
            id: '1',
            rating: 4,
            timestamp: '2024-03-20T10:00:00',
            sessionId: '1'
          },
          {
            id: '2',
            rating: 5,
            timestamp: '2024-03-20T12:00:00',
            sessionId: '1'
          }
        ]
      });
    }, 500);
  });
};

// Add Mood Entry
// POST /mood
// Request: MoodEntry
// Response: { entry: MoodEntry }
export const addMoodEntry = (entry: Omit<MoodEntry, 'id'>) => {
  return new Promise<{ entry: MoodEntry }>((resolve) => {
    setTimeout(() => {
      resolve({
        entry: {
          ...entry,
          id: Math.random().toString(36).substring(7)
        }
      });
    }, 500);
  });
};