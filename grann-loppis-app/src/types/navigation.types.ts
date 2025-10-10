import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  RoleSelection: undefined;
};

export type OrganizerStackParamList = {
  ManageEvent: undefined;
  CreateEvent: undefined;
  ParticipantsList: { eventId: string };
};

export type SellerStackParamList = {
  JoinEvent: undefined;
  AddAddress: { eventId: string };
  MyItems: { participantId: string };
  AddItem: { participantId: string };
};

export type BuyerStackParamList = {
  BrowseEvents: undefined;
  EventDetails: { eventId: string };
  EventMap: { eventId: string };
  SellerDetails: { participantId: string };
};

// Navigation props för screens
export type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;
export type ManageEventScreenNavigationProp = StackNavigationProp<OrganizerStackParamList, 'ManageEvent'>;
export type ManageEventScreenRouteProp = RouteProp<OrganizerStackParamList, 'ManageEvent'>;
// ... lägg till fler efter behov