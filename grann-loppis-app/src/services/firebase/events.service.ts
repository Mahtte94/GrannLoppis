import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../firebase.config';
import { Event, EventStatus, Coordinates } from '../../types';

const EVENTS_COLLECTION = 'events';
const DAYS_AFTER_END_TO_DELETE = 3;

/**
 * Check if an event should be removed (ended more than 3 days ago)
 */
function shouldRemoveEvent(endDate: Date): boolean {
  const now = new Date();
  const threeDaysAfterEnd = new Date(endDate);
  threeDaysAfterEnd.setDate(threeDaysAfterEnd.getDate() + DAYS_AFTER_END_TO_DELETE);

  return now > threeDaysAfterEnd;
}

/**
 * Calculate the current status of an event based on its dates
 */
function calculateEventStatus(startDate: Date, endDate: Date): EventStatus {
  const now = new Date();

  if (now < startDate) {
    return EventStatus.UPCOMING;
  } else if (now >= startDate && now <= endDate) {
    return EventStatus.ACTIVE;
  } else {
    return EventStatus.COMPLETED;
  }
}

export interface CreateEventInput {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  area: string;
  coordinates: Coordinates;
  organizerId: string;
}

export interface UpdateEventInput {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  area?: string;
  coordinates?: Coordinates;
  status?: EventStatus;
}

/**
 * Create a new event
 */
export async function createEvent(input: CreateEventInput): Promise<Event> {
  try {
    const eventData: any = {
      name: input.name,
      startDate: Timestamp.fromDate(input.startDate),
      endDate: Timestamp.fromDate(input.endDate),
      area: input.area,
      coordinates: input.coordinates,
      organizerId: input.organizerId,
      status: EventStatus.UPCOMING,
      participants: 0,
      createdAt: Timestamp.now(),
    };

    // Only add description if it's provided
    if (input.description) {
      eventData.description = input.description;
    }

    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), eventData);

    return {
      id: docRef.id,
      name: input.name,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      area: input.area,
      coordinates: input.coordinates,
      organizerId: input.organizerId,
      status: EventStatus.UPCOMING,
      participants: 0,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Error creating event:', error);
    throw new Error('Failed to create event');
  }
}

/**
 * Get a single event by ID
 */
export async function getEventById(eventId: string): Promise<Event | null> {
  try {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    const startDate = data.startDate.toDate();
    const endDate = data.endDate.toDate();

    return {
      id: docSnap.id,
      name: data.name,
      description: data.description,
      startDate,
      endDate,
      area: data.area,
      coordinates: data.coordinates,
      organizerId: data.organizerId,
      status: calculateEventStatus(startDate, endDate),
      participants: data.participants || 0,
      createdAt: data.createdAt.toDate(),
    };
  } catch (error) {
    console.error('Error fetching event:', error);
    throw new Error('Failed to load event');
  }
}

/**
 * Get all events (for buyers browsing)
 */
export async function getAllEvents(): Promise<Event[]> {
  try {
    const querySnapshot = await getDocs(collection(db, EVENTS_COLLECTION));

    const events = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      const startDate = data.startDate.toDate();
      const endDate = data.endDate.toDate();

      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        startDate,
        endDate,
        area: data.area,
        coordinates: data.coordinates,
        organizerId: data.organizerId,
        status: calculateEventStatus(startDate, endDate),
        participants: data.participants || 0,
        createdAt: data.createdAt.toDate(),
      };
    });

    // Filter out events that ended more than 3 days ago
    const activeEvents = events.filter((event) => !shouldRemoveEvent(event.endDate));

    // Sort client-side by start date (descending)
    return activeEvents.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  } catch (error) {
    console.error('Error fetching events:', error);
    throw new Error('Failed to load events');
  }
}

/**
 * Get events created by a specific organizer
 */
export async function getOrganizerEvents(organizerId: string): Promise<Event[]> {
  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('organizerId', '==', organizerId)
    );

    const querySnapshot = await getDocs(q);

    const events = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      const startDate = data.startDate.toDate();
      const endDate = data.endDate.toDate();

      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        startDate,
        endDate,
        area: data.area,
        coordinates: data.coordinates,
        organizerId: data.organizerId,
        status: calculateEventStatus(startDate, endDate),
        participants: data.participants || 0,
        createdAt: data.createdAt.toDate(),
      };
    });

    // Filter out events that ended more than 3 days ago
    const activeEvents = events.filter((event) => !shouldRemoveEvent(event.endDate));

    // Sort client-side by start date (descending) to avoid needing composite index
    return activeEvents.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  } catch (error) {
    console.error('Error fetching organizer events:', error);
    throw new Error('Failed to load your events');
  }
}

/**
 * Update an existing event
 */
export async function updateEvent(
  eventId: string,
  input: UpdateEventInput
): Promise<void> {
  try {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);

    const updateData: any = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.startDate !== undefined) {
      updateData.startDate = Timestamp.fromDate(input.startDate);
    }
    if (input.endDate !== undefined) {
      updateData.endDate = Timestamp.fromDate(input.endDate);
    }
    if (input.area !== undefined) {
      updateData.area = input.area;
    }
    if (input.coordinates !== undefined) {
      updateData.coordinates = input.coordinates;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating event:', error);
    throw new Error('Failed to update event');
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string): Promise<void> {
  try {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting event:', error);
    throw new Error('Failed to delete event');
  }
}

/**
 * Search events by name or area
 */
export async function searchEvents(searchTerm: string): Promise<Event[]> {
  try {
    // Note: This is a simple implementation. For better search,
    // consider using Algolia or Firebase Extensions
    const querySnapshot = await getDocs(collection(db, EVENTS_COLLECTION));

    const events = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      const startDate = data.startDate.toDate();
      const endDate = data.endDate.toDate();

      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        startDate,
        endDate,
        area: data.area,
        coordinates: data.coordinates,
        organizerId: data.organizerId,
        status: calculateEventStatus(startDate, endDate),
        participants: data.participants || 0,
        createdAt: data.createdAt.toDate(),
      };
    });

    // Filter out events that ended more than 3 days ago
    const activeEvents = events.filter((event) => !shouldRemoveEvent(event.endDate));

    // Filter client-side by search term (not ideal for large datasets)
    const lowerSearchTerm = searchTerm.toLowerCase();
    return activeEvents.filter(
      (event) =>
        event.name.toLowerCase().includes(lowerSearchTerm) ||
        event.area.toLowerCase().includes(lowerSearchTerm)
    );
  } catch (error) {
    console.error('Error searching events:', error);
    throw new Error('Failed to search events');
  }
}

/**
 * Clean up events that ended more than 3 days ago
 * This function permanently deletes expired events from Firestore
 * Returns the number of events deleted
 */
export async function cleanupExpiredEvents(): Promise<number> {
  try {
    const querySnapshot = await getDocs(collection(db, EVENTS_COLLECTION));
    let deletedCount = 0;

    // Find all expired events
    const expiredEvents = querySnapshot.docs.filter((doc) => {
      const data = doc.data();
      const endDate = data.endDate.toDate();
      return shouldRemoveEvent(endDate);
    });

    // Delete each expired event
    for (const doc of expiredEvents) {
      await deleteDoc(doc.ref);
      deletedCount++;
    }

    console.log(`Cleaned up ${deletedCount} expired events`);
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired events:', error);
    throw new Error('Failed to cleanup expired events');
  }
}

export const eventsService = {
  createEvent,
  getEventById,
  getAllEvents,
  getOrganizerEvents,
  updateEvent,
  deleteEvent,
  searchEvents,
  cleanupExpiredEvents,
};
