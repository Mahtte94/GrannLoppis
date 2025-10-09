export enum EventStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed'
}

export interface Event {
  id: string;
  name: string;
  date: Date;
  area: string;
  eventCode: string;
  organizerId: string;
  createdAt: Date;
  status: EventStatus;
  participants: number;
}

export interface CreateEventInput {
  name: string;
  date: Date;
  area: string;
}