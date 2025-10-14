export enum UserRole {
  ORGANIZER = 'organizer',
  SELLER = 'seller',
  BUYER = 'buyer'
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface SellerProfile {
  address: string;
  coordinates: Coordinates;
  phoneNumber?: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
  sellerProfile?: SellerProfile; // Only for sellers
}