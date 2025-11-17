import { Coordinates } from './user.types';

export enum EventStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed'
}

export interface Event {
  id: string;
  name: string;
  description?: string;
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
  description?: string;
  startDate: Date;
  endDate: Date;
  area: string;
  coordinates: Coordinates;
}