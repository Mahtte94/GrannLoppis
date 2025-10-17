import { Coordinates } from './user.types';

export enum ParticipantStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface Participant {
  id: string;
  eventId: string;
  userId: string;
  address: string;
  coordinates: Coordinates;
  displayName: string;
  description: string;
  status: ParticipantStatus;
  appliedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // Organizer user ID who reviewed the application
  joinedAt?: Date; // Only set when status is APPROVED
  phoneNumber?: string;
}

export interface ApplyToEventInput {
  eventId: string;
  description?: string;
}