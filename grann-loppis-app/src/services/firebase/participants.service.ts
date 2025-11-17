import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
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
  description?: string,
  participationDates?: string[]
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

    // Check if user already has an active (pending or approved) application for this event
    // Allow reapplication if previous application was rejected
    const existingApplicationQuery = query(
      collection(db, PARTICIPANTS_COLLECTION),
      where('eventId', '==', eventId),
      where('userId', '==', userId),
      where('status', 'in', [ParticipantStatus.PENDING, ParticipantStatus.APPROVED])
    );
    const existingApplications = await getDocs(existingApplicationQuery);

    if (!existingApplications.empty) {
      const status = existingApplications.docs[0].data().status;
      if (status === ParticipantStatus.PENDING) {
        throw new Error('Du har redan en pågående ansökan för detta evenemang');
      } else {
        throw new Error('Du är redan godkänd för detta evenemang');
      }
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
      ...(participationDates && participationDates.length > 0 && { participationDates }),
    };

    // Add participant application to the participants collection
    const docRef = await addDoc(collection(db, PARTICIPANTS_COLLECTION), participantData);

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
        ...(data.participationDates && { participationDates: data.participationDates }),
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
        ...(data.participationDates && { participationDates: data.participationDates }),
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
      ...(data.participationDates && { participationDates: data.participationDates }),
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
        ...(data.participationDates && { participationDates: data.participationDates }),
      };
    });
  } catch (error) {
    console.error('Error fetching user participations:', error);
    throw new Error('Failed to load your participations');
  }
}

/**
 * Remove a participant from an event (organizer can remove sellers)
 */
export async function removeParticipant(participantId: string): Promise<void> {
  try {
    const participantRef = doc(db, PARTICIPANTS_COLLECTION, participantId);
    const participantSnap = await getDoc(participantRef);

    if (!participantSnap.exists()) {
      throw new Error('Participant not found');
    }

    const participantData = participantSnap.data();

    // If the participant was approved, decrement the event's participant count
    if (participantData.status === ParticipantStatus.APPROVED) {
      const eventRef = doc(db, EVENTS_COLLECTION, participantData.eventId);
      await updateDoc(eventRef, {
        participants: increment(-1),
      });
    }

    // Delete the participant
    await deleteDoc(participantRef);

  } catch (error) {
    console.error('Error removing participant:', error);
    throw new Error('Failed to remove participant');
  }
}

/**
 * Check if a user has any active participations (approved or pending status)
 * Returns the list of active participations and events
 */
export async function getActiveParticipations(userId: string): Promise<{
  hasActiveParticipations: boolean;
  participations: Array<Participant>;
}> {
  try {
    const q = query(
      collection(db, PARTICIPANTS_COLLECTION),
      where('userId', '==', userId),
      where('status', 'in', [ParticipantStatus.APPROVED, ParticipantStatus.PENDING])
    );

    const querySnapshot = await getDocs(q);

    const participations = querySnapshot.docs.map((doc) => {
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
        ...(data.participationDates && { participationDates: data.participationDates }),
      };
    });

    return {
      hasActiveParticipations: participations.length > 0,
      participations,
    };
  } catch (error) {
    console.error('Error checking active participations:', error);
    throw new Error('Failed to check active participations');
  }
}

/**
 * Count pending applications across all events for a specific organizer
 * Returns the total number of pending applications that need review
 */
export async function getPendingApplicationsCountForOrganizer(organizerId: string): Promise<number> {
  try {
    // First, get all events organized by this user
    const eventsQuery = query(
      collection(db, EVENTS_COLLECTION),
      where('organizerId', '==', organizerId)
    );
    const eventsSnapshot = await getDocs(eventsQuery);

    if (eventsSnapshot.empty) {
      return 0;
    }

    // Get all event IDs
    const eventIds = eventsSnapshot.docs.map(doc => doc.id);

    // Count pending applications across all these events
    // Note: Firestore 'in' queries support up to 30 items
    // For production with many events, consider batching or alternative approaches
    if (eventIds.length === 0) {
      return 0;
    }

    // If organizer has more than 30 events, we need to batch the queries
    const batchSize = 30;
    let totalCount = 0;

    for (let i = 0; i < eventIds.length; i += batchSize) {
      const batch = eventIds.slice(i, i + batchSize);
      const participantsQuery = query(
        collection(db, PARTICIPANTS_COLLECTION),
        where('eventId', 'in', batch),
        where('status', '==', ParticipantStatus.PENDING)
      );
      const participantsSnapshot = await getDocs(participantsQuery);
      totalCount += participantsSnapshot.size;
    }

    return totalCount;
  } catch (error) {
    console.error('Error counting pending applications for organizer:', error);
    return 0; // Return 0 on error to avoid breaking the UI
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
  removeParticipant,
  getActiveParticipations,
  getPendingApplicationsCountForOrganizer,
};
