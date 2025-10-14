import { Coordinates } from './participant.types';

export enum EventStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed'
}

export interface Event {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  area: string;
  coordinates: Coordinates;
  organizerId: string;
  createdAt: Date;
  status: EventStatus;
  participants: number;
}

export interface CreateEventInput {
  name: string;
  startDate: Date;
  endDate: Date;
  area: string;
  coordinates: Coordinates;
}