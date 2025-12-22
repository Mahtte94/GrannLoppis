export interface Item {
  id: string;
  participantId: string;
  eventId: string;
  title: string;
  description: string;
  imageUrls: string[];
  category?: string;
  createdAt: Date;
}

export interface CreateItemInput {
  title: string;
  description: string;
  imageUrls?: string[];
  category?: string;
}