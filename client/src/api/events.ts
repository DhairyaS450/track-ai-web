import api from './api';
import { Event } from '@/types';

// Helper functions for local storage
const getLocalEvents = (): Event[] => {
  const events = localStorage.getItem('events');
  return events ? JSON.parse(events) : [];
};

const saveLocalEvents = (events: Event[]) => {
  localStorage.setItem('events', JSON.stringify(events));
};

// Get Events
// GET /events
// Response: { events: Event[] }
export const getEvents = () => {
  return new Promise<{ events: Event[] }>((resolve) => {
    setTimeout(() => {
      const localEvents = getLocalEvents();

      if (localEvents.length > 0) {
        resolve({ events: localEvents });
        return;
      }

      const mockEvents = [
        {
          id: '1',
          name: 'Team Meeting',
          startTime: '2024-03-20T10:00:00',
          endTime: '2024-03-20T11:00:00',
          isAllDay: false,
          isFlexible: false,
          location: 'Room 205',
          description: 'Weekly team sync',
          category: 'work',
          reminders: [
            { type: 'minutes' as const, amount: 15 },
            { type: 'hours' as const, amount: 1 }
          ],
          priority: 'High' as const,
          recurrence: 'weekly' as const
        },
        {
          id: '2',
          name: 'Study Group',
          startTime: '2024-03-21T14:00:00',
          endTime: '2024-03-21T16:00:00',
          isAllDay: false,
          isFlexible: true,
          location: 'Library',
          description: 'Math study group',
          category: 'school',
          priority: 'Medium' as const
        }
      ];

      resolve({ events: mockEvents });
    }, 500);
  });
};

// Add Event
// POST /events
// Request: Event
// Response: { event: Event }
export const addEvent = (event: Omit<Event, 'id'>) => {
  return new Promise<{ event: Event }>((resolve) => {
    setTimeout(() => {
      const newEvent: Event = {
        ...event,
        id: Math.random().toString(36).substring(7)
      };

      // Save to local storage
      const events = getLocalEvents();
      events.push(newEvent);
      saveLocalEvents(events);

      resolve({ event: newEvent });
    }, 500);
  });
};

// Update Event
// PUT /events/:id
// Request: Partial<Event>
// Response: { event: Event }
export const updateEvent = (id: string, updates: Partial<Event>) => {
  return new Promise<{ event: Event }>((resolve) => {
    setTimeout(() => {
      const events = getLocalEvents();
      const eventIndex = events.findIndex(e => e.id === id);

      if (eventIndex !== -1) {
        const updatedEvent = {
          ...events[eventIndex],
          ...updates,
        };
        events[eventIndex] = updatedEvent;
        saveLocalEvents(events);
        resolve({ event: updatedEvent });
      } else {
        const newEvent: Event = {
          id,
          name: 'Updated Event',
          startTime: '2024-03-20T10:00:00',
          endTime: '2024-03-20T11:00:00',
          isAllDay: false,
          isFlexible: false,
          ...updates
        };
        resolve({ event: newEvent });
      }
    }, 500);
  });
};

// Delete Event
// DELETE /events/:id
// Response: { success: boolean }
export const deleteEvent = (id: string) => {
  return new Promise<{ success: boolean }>((resolve) => {
    setTimeout(() => {
      const events = getLocalEvents();
      const filteredEvents = events.filter(e => e.id !== id);
      saveLocalEvents(filteredEvents);
      resolve({ success: true });
    }, 500);
  });
};