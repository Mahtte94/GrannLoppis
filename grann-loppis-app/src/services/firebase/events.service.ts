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

/**
 * Generate a random 6-character event code
 */
function generateEventCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export interface CreateEventInput {
  name: string;
  startDate: Date;
  endDate: Date;
  area: string;
  coordinates: Coordinates;
  organizerId: string;
}

export interface UpdateEventInput {
  name?: string;
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
    const eventCode = generateEventCode();

    const eventData = {
      name: input.name,
      startDate: Timestamp.fromDate(input.startDate),
      endDate: Timestamp.fromDate(input.endDate),
      area: input.area,
      coordinates: input.coordinates,
      eventCode,
      organizerId: input.organizerId,
      status: EventStatus.UPCOMING,
      participants: 0,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), eventData);

    return {
      id: docRef.id,
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      area: input.area,
      coordinates: input.coordinates,
      eventCode,
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
    return {
      id: docSnap.id,
      name: data.name,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      area: data.area,
      coordinates: data.coordinates,
      eventCode: data.eventCode,
      organizerId: data.organizerId,
      status: data.status,
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
      return {
        id: doc.id,
        name: data.name,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        area: data.area,
        coordinates: data.coordinates,
        eventCode: data.eventCode,
        organizerId: data.organizerId,
        status: data.status,
        participants: data.participants || 0,
        createdAt: data.createdAt.toDate(),
      };
    });

    // Sort client-side by start date (descending)
    return events.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
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
      return {
        id: doc.id,
        name: data.name,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        area: data.area,
        coordinates: data.coordinates,
        eventCode: data.eventCode,
        organizerId: data.organizerId,
        status: data.status,
        participants: data.participants || 0,
        createdAt: data.createdAt.toDate(),
      };
    });

    // Sort client-side by start date (descending) to avoid needing composite index
    return events.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
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
      return {
        id: doc.id,
        name: data.name,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        area: data.area,
        coordinates: data.coordinates,
        eventCode: data.eventCode,
        organizerId: data.organizerId,
        status: data.status,
        participants: data.participants || 0,
        createdAt: data.createdAt.toDate(),
      };
    });

    // Filter client-side (not ideal for large datasets)
    const lowerSearchTerm = searchTerm.toLowerCase();
    return events.filter(
      (event) =>
        event.name.toLowerCase().includes(lowerSearchTerm) ||
        event.area.toLowerCase().includes(lowerSearchTerm) ||
        event.eventCode.toLowerCase().includes(lowerSearchTerm)
    );
  } catch (error) {
    console.error('Error searching events:', error);
    throw new Error('Failed to search events');
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
};
