export interface Item {
  id: string;
  participantId: string;
  eventId: string;
  title: string;
  description: string;
  imageUrl?: string;
  suggestedPrice?: number;
  category?: string;
  createdAt: Date;
}

export interface CreateItemInput {
  title: string;
  description: string;
  imageUrl?: string;
  category?: string;
}