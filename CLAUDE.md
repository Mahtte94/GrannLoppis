# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GrannLoppis (Loppis Rundan) is a React Native mobile application built with Expo for organizing and participating in community yard sales (flea markets). The app connects three user types: organizers who create events, sellers who join events to sell items at their homes, and buyers who browse events and navigate between seller locations.

## Technology Stack

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript with strict mode
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Maps**: React Native Maps + Google Maps API
- **State Management**: React Context API (AuthContext)
- **Styling**: React Native StyleSheet with custom theme

## Development Commands

All commands are run from the `grann-loppis-app/` directory:

```bash
npm start              # Start Expo development server
npm run android        # Run on Android emulator/device
npm run ios           # Run on iOS simulator/device
npm run web           # Run in web browser
```

## Environment Configuration

Copy `.env.example` to `.env` and configure:

**Firebase**: Get credentials from Firebase Console and configure the following variables:
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`

**Google Maps**: Enable Places API, Maps SDK (Android/iOS), and Directions API:
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

## Project Structure

```
grann-loppis-app/
├── src/
│   ├── components/        # Reusable UI components
│   │   └── common/       # Generic components (Card, LocationInput, NotificationBadge)
│   ├── context/          # React Context providers (AuthContext)
│   ├── hooks/            # Custom React hooks
│   ├── navigation/       # Navigation setup (AppNavigator, MainNavigator, AuthNavigator)
│   ├── screens/          # Screen components organized by user role
│   │   ├── auth/        # Login, Register
│   │   ├── buyer/       # Browse events, event details, maps, seller details
│   │   ├── organizer/   # Create event, manage event, participants list
│   │   └── seller/      # Join event, add address
│   ├── services/         # Business logic layer
│   │   ├── firebase/    # Firestore operations (auth, events, participants, items, user)
│   │   └── routing/     # Google Maps integration (route optimization, turn-by-turn)
│   ├── styles/          # Global theme configuration
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Helper functions
├── App.tsx              # Root component with AuthProvider
├── firebase.config.ts   # Firebase initialization
└── app.config.js        # Expo configuration
```

## Architecture

### User Roles & Navigation

The app uses role-based navigation with dynamic tab bars:

- **Buyer** (default/unauthenticated): Browse events, view maps, search for events
- **Seller**: Join events, manage address/profile, track application status
- **Organizer**: Create events, approve/reject seller applications, view participant lists

Navigation structure:
- Unauthenticated users see: Home (Hem), Map (Karta), Account (Konto)
- Sellers see: Home, Map, Sell (Sälj)
- Organizers see: Home, Map, My Event (Min Loppis)

Implemented in `src/navigation/MainNavigator.tsx` using conditional rendering based on `user.role`.

### Authentication Flow

1. Firebase Auth handles authentication with email/password
2. `AuthContext` (src/context/AuthContext.tsx) listens to auth state changes
3. On auth state change, fetches full user profile from Firestore `users` collection
4. User profile includes role and seller-specific data (address, coordinates)
5. Retry logic (up to 3 attempts) handles race conditions during registration

### Event Lifecycle

Events have three states (EventStatus enum):
- **UPCOMING**: Before start date
- **ACTIVE**: Between start and end dates
- **COMPLETED**: After end date

Events are automatically removed 3 days after end date (enforced in `events.service.ts`).

### Participant Application Flow

1. Seller applies to event via `applyToEvent()` in `participants.service.ts`
2. Application created with `ParticipantStatus.PENDING`
3. Organizer sees pending count in tab bar notification badge
4. Organizer approves/rejects from ParticipantsList screen
5. On approval: status → APPROVED, event participant count increments
6. On rejection: status → REJECTED, seller can reapply
7. Sellers see real-time status updates via Firestore listeners

### Firebase Data Model

**Collections:**
- `users`: User profiles with role and optional sellerProfile
- `events`: Event details with organizerId, coordinates, status, participant count
- `participants`: Seller applications/memberships with status, coordinates, eventId, userId
- `items`: Items for sale (linked to participants)

**Important patterns:**
- All dates stored as Firestore Timestamps
- Coordinates stored as `{ lat: number, lng: number }`
- Status fields use enums (EventStatus, ParticipantStatus, UserRole)
- Real-time updates via `onSnapshot()` listeners

### Routing & Maps

**Route Optimization** (src/services/routing/googlemaps.service.ts):
- Uses Google Directions API with waypoint optimization
- Supports multiple transportation modes (driving, walking, cycling)
- Can include user's current location as start point
- Handles round-trip routing

**Turn-by-Turn Navigation** (src/services/routing/navigation.service.ts):
- Opens native navigation apps (Google Maps, Apple Maps, Waze)
- Falls back gracefully if preferred app not installed
- Passes all approved participant waypoints in order

**Map Views:**
- AllEventsMapScreen: Shows all active events with location search
- EventMapScreen: Shows sellers within a specific event with route planning

## Key TypeScript Types

Navigation types in `src/types/navigation.types.ts` define stack parameters for each navigator (OrganizerStackParamList, SellerStackParamList, BuyerStackParamList, MapStackParamList).

Core domain types:
- **User**: role, sellerProfile (address, coordinates)
- **Event**: name, dates, area, coordinates, organizerId, status, participant count
- **Participant**: eventId, userId, address, coordinates, status, appliedAt, participationDates
- **Route**: coordinates array, distance, duration, waypoints, segments

## Firebase Services

All Firebase operations are abstracted into service modules in `src/services/firebase/`:

- **auth.service.ts**: Registration, login, logout
- **events.service.ts**: CRUD for events, status calculation, participant count
- **participants.service.ts**: Apply, approve, reject, update, delete with event counter updates
- **items.service.ts**: CRUD for seller items
- **user.service.ts**: User profile management

Services handle Firestore Timestamp conversions and maintain data consistency (e.g., updating event participant counts when participants are approved/removed).

## Theme & Styling

Global theme defined in `src/styles/theme.ts` provides:
- Color palette (primary, background, surface, text colors)
- Spacing scale (xs, sm, md, lg, xl)
- Font sizes (xs, sm, md, lg, xl, xxl)
- Border radius values

All screens use theme constants for consistency.

## Real-time Features

**Participant Status Updates**: Sellers see real-time application status changes using Firestore `onSnapshot()` listeners in screens.

**Notification Badge**: Organizers see real-time count of pending applications via nested `onSnapshot()` listeners in MainNavigator (listens to events → participants).

## Common Patterns

**Location Input**: Use `LocationInput` component (wraps Google Places Autocomplete) for address entry with coordinate extraction.

**Error Handling**: Services throw errors with descriptive messages. Screens catch and display via Alert.

**Date Handling**:
- UI displays dates in Swedish format
- Firestore stores as Timestamps
- Convert with `Timestamp.fromDate()` / `.toDate()`

**Navigation**: Use typed navigation props from `navigation.types.ts` for type-safe route params.
