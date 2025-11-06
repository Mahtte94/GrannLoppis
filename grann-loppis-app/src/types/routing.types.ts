import { Coordinates } from './user.types';

/**
 * Types for routing and navigation features
 */

/**
 * A waypoint in a route with coordinates and optional metadata
 */
export interface RouteWaypoint {
  coordinates: Coordinates;
  name?: string;
  participantId?: string;
}

/**
 * A route segment between two waypoints
 */
export interface RouteSegment {
  distance: number; // in meters
  duration: number; // in seconds
  steps?: RouteStep[];
}

/**
 * A step within a route segment (turn-by-turn instruction)
 */
export interface RouteStep {
  distance: number; // in meters
  duration: number; // in seconds
  instruction: string;
  name?: string;
}

/**
 * Complete route information
 */
export interface Route {
  coordinates: Coordinates[]; // Array of lat/lng points forming the route line
  distance: number; // Total distance in meters
  duration: number; // Total duration in seconds
  segments?: RouteSegment[];
  waypoints: RouteWaypoint[];
}


/**
 * Route optimization options
 */
export interface RouteOptimizationOptions {
  includeUserLocation?: boolean; // Whether to start from user's location
  roundTrip?: boolean; // Whether route should return to start
  profile?: 'driving-car' | 'foot-walking' | 'cycling-regular'; // Transportation mode
}
