import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../firebase.config';
import { Participant, JoinEventInput } from '../../types';

const PARTICIPANTS_COLLECTION = 'participants';

/**
 * Join an event as a seller/participant
 */
export async function joinEvent(
  userId: string,
  displayName: string,
  input: JoinEventInput
): Promise<Participant> {
  try {
    const participantData = {
      eventId: input.eventCode, // In production, resolve eventCode to eventId
      userId,
      displayName,
      address: input.address,
      coordinates: input.coordinates,
      description: input.description,
      joinedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, PARTICIPANTS_COLLECTION), participantData);

    return {
      id: docRef.id,
      ...participantData,
      joinedAt: new Date(),
    };
  } catch (error) {
    console.error('Error joining event:', error);
    throw new Error('Failed to join event');
  }
}

/**
 * Get all participants for a specific event
 */
export async function getEventParticipants(eventId: string): Promise<Array<Participant>> {
  try {
    const q = query(
      collection(db, PARTICIPANTS_COLLECTION),
      where('eventId', '==', eventId)
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        eventId: data.eventId,
        userId: data.userId,
        displayName: data.displayName,
        address: data.address,
        coordinates: data.coordinates,
        description: data.description,
        joinedAt: data.joinedAt.toDate(),
      };
    });
  } catch (error) {
    console.error('Error fetching event participants:', error);
    throw new Error('Failed to load participants');
  }
}

/**
 * Get a single participant by ID
 */
export async function getParticipantById(participantId: string): Promise<Participant | null> {
  try {
    const docRef = doc(db, PARTICIPANTS_COLLECTION, participantId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      eventId: data.eventId,
      userId: data.userId,
      displayName: data.displayName,
      address: data.address,
      coordinates: data.coordinates,
      description: data.description,
      joinedAt: data.joinedAt.toDate(),
    };
  } catch (error) {
    console.error('Error fetching participant:', error);
    throw new Error('Failed to load participant');
  }
}

/**
 * Get participants for a specific user (all events they've joined)
 */
export async function getUserParticipations(userId: string): Promise<Array<Participant>> {
  try {
    const q = query(
      collection(db, PARTICIPANTS_COLLECTION),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        eventId: data.eventId,
        userId: data.userId,
        displayName: data.displayName,
        address: data.address,
        coordinates: data.coordinates,
        description: data.description,
        joinedAt: data.joinedAt.toDate(),
      };
    });
  } catch (error) {
    console.error('Error fetching user participations:', error);
    throw new Error('Failed to load your participations');
  }
}

export const participantsService = {
  joinEvent,
  getEventParticipants,
  getParticipantById,
  getUserParticipations,
};
