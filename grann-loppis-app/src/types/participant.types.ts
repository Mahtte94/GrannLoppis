export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Participant {
  id: string;
  eventId: string;
  userId: string;
  address: string;
  coordinates: Coordinates;
  displayName: string;
  description: string;
  joinedAt: Date;
}

export interface JoinEventInput {
  eventCode: string;
  address: string;
  coordinates: Coordinates;
  description: string;
}