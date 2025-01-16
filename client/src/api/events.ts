/* eslint-disable @typescript-eslint/no-explicit-any */
import { db, auth } from '@/config/firebase';
import { Event } from '@/types';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc } from '@firebase/firestore';

// Helper functions for local storage
// const getLocalEvents = (): Event[] => {
//   const events = localStorage.getItem('events');
//   return events ? JSON.parse(events) : [];
// };

// const saveLocalEvents = (events: Event[]) => {
//   localStorage.setItem('events', JSON.stringify(events));
// };

// Get Events
// GET /events
// Response: { events: Event[] }

export const getEvents = async () => {
  try {
    console.log('Fetching events from Firestore');
    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('userId', '==', auth.currentUser?.uid)
    );

    const querySnapshot = await getDocs(q);
    const events = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Event[];

    console.log(`Successfully fetched ${events.length} events from Firestore`);

    return {
      events: events
    };
  } catch (error: any) {
    console.error('Error fetching events from Firestore:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Failed to fetch events: ${error.message}`);
  }
};

// Get Event by ID
// GET /events/:id
// Response: { event: Event }
export const getEventById = async (id: string) => {
  try {
    console.log('Fetching event by ID:', id);
    const eventRef = doc(db, 'events', id);
    const eventSnapshot = await getDoc(eventRef);
    const event = eventSnapshot.data() as Event;
    console.log('Successfully fetched event by ID:', id);
    return { event };
  } catch (error: any) {
    console.error('Error fetching event by ID:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Failed to fetch event by ID: ${error.message}`);
  }
};

// Add Event
// POST /events
// Request: Event
// Response: { event: Event }
export const addEvent = async (eventData: Omit<Event, 'id'>) => {
  try {
    console.log('Adding new event:', eventData);
    const eventsRef = collection(db, 'events');

    // Add created timestamp and user ID
    const eventWithMetadata = {
      ...eventData,
      recurrence: eventData.recurrence || '',
      createdAt: serverTimestamp(),
      userId: auth.currentUser?.uid,
      calendarId: eventData.calendarId || '',
      isAllDay: eventData.isAllDay || false,
      isFlexible: eventData.isFlexible || false,
      priority: eventData.priority || 'Low'
    };

    const docRef = await addDoc(eventsRef, eventWithMetadata);
    console.log('Event added successfully with ID:', docRef.id);

    // Return the created event with its ID
    const event: Event = {
      id: docRef.id,
      ...eventData
    };

    return { event };
  } catch (error: any) {
    console.error('Error adding event:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Failed to create event: ${error.message}`);
  }
};

// Update Event
// PUT /events/:id
// Request: Partial<Event>
// Response: { event: Event }
// export const updateEvent = (id: string, updates: Partial<Event>) => {
//   return new Promise<{ event: Event }>((resolve) => {
//     setTimeout(() => {
//       const events = getLocalEvents();
//       const eventIndex = events.findIndex(e => e.id === id);

//       if (eventIndex !== -1) {
//         const updatedEvent = {
//           ...events[eventIndex],
//           ...updates,
//         };
//         events[eventIndex] = updatedEvent;
//         saveLocalEvents(events);
//         resolve({ event: updatedEvent });
//       } else {
//         const newEvent: Event = {
//           id,
//           name: 'Updated Event',
//           startTime: '2024-03-20T10:00:00',
//           endTime: '2024-03-20T11:00:00',
//           isAllDay: false,
//           isFlexible: false,
//           ...updates
//         };
//         resolve({ event: newEvent });
//       }
//     }, 500);
//   });
// };
export const updateEvent = async (id: string, updates: Partial<Event>) => {
  try {
    console.log('Updating event:', id, updates);
    const eventRef = doc(db, 'events', id);

    const updatedData = {
      ...updates,
      isAllDay: updates.isAllDay || false,
      isFlexible: updates.isFlexible || false,
      priority: updates.priority || 'Low',
      recurrence: updates.recurrence || '',
    };

    await updateDoc(eventRef, updatedData);
    console.log('Event updated successfully:', id);

    // Return the updated event
    return { event: { id, ...updatedData } as Event };
  } catch (error: any) {
    console.error('Error updating event:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Failed to update event: ${error.message}`);
  }
};

// Delete Event
// DELETE /events/:id
// Response: { success: boolean }
export const deleteEvent = async (id: string) => {
  try {
    console.log('Deleting event:', id);
    const eventRef = doc(db, 'events', id);
    await deleteDoc(eventRef);
    console.log('Event deleted successfully:', id);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting event:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Failed to delete event: ${error.message}`);
  }
};