export enum UserRole {
  ORGANIZER = 'organizer',
  SELLER = 'seller',
  BUYER = 'buyer'
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
}