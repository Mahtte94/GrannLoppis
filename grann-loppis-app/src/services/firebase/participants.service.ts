import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  increment,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../firebase.config';
import { Participant, ParticipantStatus, User } from '../../types';

const PARTICIPANTS_COLLECTION = 'participants';
const EVENTS_COLLECTION = 'events';
const USERS_COLLECTION = 'users';

/**
 * Apply to join an event as a seller (creates a pending application)
 * The seller's address and coordinates are taken from their user profile
 */
export async function applyToEvent(
  eventId: string,
  userId: string,
  description?: string
): Promise<Participant> {
  try {
    // Fetch the user's profile to get their seller information
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User not found');
    }

    const userData = userSnap.data() as User;

    if (!userData.sellerProfile) {
      throw new Error('Seller profile not found. Please complete your profile first.');
    }

    // Check if user already has an application for this event
    const existingApplicationQuery = query(
      collection(db, PARTICIPANTS_COLLECTION),
      where('eventId', '==', eventId),
      where('userId', '==', userId)
    );
    const existingApplications = await getDocs(existingApplicationQuery);

    if (!existingApplications.empty) {
      throw new Error('Du har redan ansökt om att gå med i detta evenemang');
    }

    const participantData = {
      eventId,
      userId,
      displayName: userData.displayName,
      address: userData.sellerProfile.address,
      coordinates: userData.sellerProfile.coordinates,
      phoneNumber: userData.sellerProfile.phoneNumber || '',
      description: description || '',
      status: ParticipantStatus.PENDING,
      appliedAt: Timestamp.now(),
    };

    console.log('Saving application to Firestore:', participantData);

    // Add participant application to the participants collection
    const docRef = await addDoc(collection(db, PARTICIPANTS_COLLECTION), participantData);

    console.log('Application saved with ID:', docRef.id);

    return {
      id: docRef.id,
      ...participantData,
      appliedAt: new Date(),
    };
  } catch (error) {
    console.error('Error applying to event:', error);
    throw error;
  }
}

/**
 * Approve a pending application
 */
export async function approveApplication(
  participantId: string,
  organizerId: string
): Promise<void> {
  try {
    const participantRef = doc(db, PARTICIPANTS_COLLECTION, participantId);
    const participantSnap = await getDoc(participantRef);

    if (!participantSnap.exists()) {
      throw new Error('Application not found');
    }

    const participantData = participantSnap.data();

    await updateDoc(participantRef, {
      status: ParticipantStatus.APPROVED,
      reviewedAt: Timestamp.now(),
      reviewedBy: organizerId,
      joinedAt: Timestamp.now(),
    });

    // Increment the approved participants count on the event
    const eventRef = doc(db, EVENTS_COLLECTION, participantData.eventId);
    await updateDoc(eventRef, {
      participants: increment(1),
    });

    console.log('Application approved:', participantId);
  } catch (error) {
    console.error('Error approving application:', error);
    throw new Error('Failed to approve application');
  }
}

/**
 * Reject a pending application
 */
export async function rejectApplication(
  participantId: string,
  organizerId: string
): Promise<void> {
  try {
    const participantRef = doc(db, PARTICIPANTS_COLLECTION, participantId);

    await updateDoc(participantRef, {
      status: ParticipantStatus.REJECTED,
      reviewedAt: Timestamp.now(),
      reviewedBy: organizerId,
    });

    console.log('Application rejected:', participantId);
  } catch (error) {
    console.error('Error rejecting application:', error);
    throw new Error('Failed to reject application');
  }
}

/**
 * Get all participants for a specific event (approved only by default)
 */
export async function getEventParticipants(
  eventId: string,
  statusFilter: ParticipantStatus = ParticipantStatus.APPROVED
): Promise<Array<Participant>> {
  try {
    const q = query(
      collection(db, PARTICIPANTS_COLLECTION),
      where('eventId', '==', eventId),
      where('status', '==', statusFilter)
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
        phoneNumber: data.phoneNumber,
        description: data.description,
        status: data.status as ParticipantStatus,
        appliedAt: data.appliedAt.toDate(),
        ...(data.reviewedAt && { reviewedAt: data.reviewedAt.toDate() }),
        ...(data.reviewedBy && { reviewedBy: data.reviewedBy }),
        ...(data.joinedAt && { joinedAt: data.joinedAt.toDate() }),
      };
    });
  } catch (error) {
    console.error('Error fetching event participants:', error);
    throw new Error('Failed to load participants');
  }
}

/**
 * Get all applications (pending, approved, rejected) for a specific event
 */
export async function getEventApplications(eventId: string): Promise<Array<Participant>> {
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
        phoneNumber: data.phoneNumber,
        description: data.description,
        status: data.status as ParticipantStatus,
        appliedAt: data.appliedAt.toDate(),
        ...(data.reviewedAt && { reviewedAt: data.reviewedAt.toDate() }),
        ...(data.reviewedBy && { reviewedBy: data.reviewedBy }),
        ...(data.joinedAt && { joinedAt: data.joinedAt.toDate() }),
      };
    });
  } catch (error) {
    console.error('Error fetching event applications:', error);
    throw new Error('Failed to load applications');
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
      phoneNumber: data.phoneNumber,
      description: data.description,
      status: data.status as ParticipantStatus,
      appliedAt: data.appliedAt.toDate(),
      ...(data.reviewedAt && { reviewedAt: data.reviewedAt.toDate() }),
      ...(data.reviewedBy && { reviewedBy: data.reviewedBy }),
      ...(data.joinedAt && { joinedAt: data.joinedAt.toDate() }),
    };
  } catch (error) {
    console.error('Error fetching participant:', error);
    throw new Error('Failed to load participant');
  }
}

/**
 * Get participants for a specific user (all events they've joined/applied to)
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
        phoneNumber: data.phoneNumber,
        description: data.description,
        status: data.status as ParticipantStatus,
        appliedAt: data.appliedAt.toDate(),
        ...(data.reviewedAt && { reviewedAt: data.reviewedAt.toDate() }),
        ...(data.reviewedBy && { reviewedBy: data.reviewedBy }),
        ...(data.joinedAt && { joinedAt: data.joinedAt.toDate() }),
      };
    });
  } catch (error) {
    console.error('Error fetching user participations:', error);
    throw new Error('Failed to load your participations');
  }
}

export const participantsService = {
  applyToEvent,
  approveApplication,
  rejectApplication,
  getEventParticipants,
  getEventApplications,
  getParticipantById,
  getUserParticipations,
};
