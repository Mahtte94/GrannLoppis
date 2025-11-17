import * as Location from 'expo-location';
import { Route, Coordinates } from '../../types';

/**
 * Navigation state for active GPS navigation
 */
export interface NavigationState {
  isNavigating: boolean;
  currentLocation: Coordinates | null;
  isOffRoute: boolean;
  completedCoordinates: Coordinates[]; // Route points already passed
}

/**
 * Configuration for navigation behavior
 */
interface NavigationConfig {
  offRouteThreshold: number; // meters - distance from route before recalculation
  locationUpdateInterval: number; // ms - how often to check location
}

const DEFAULT_CONFIG: NavigationConfig = {
  offRouteThreshold: 50, // 50 meters off route triggers recalculation
  locationUpdateInterval: 2000, // Check location every 2 seconds
};

/**
 * GPS Navigation Service
 * Handles real-time location tracking and route progress visualization
 */
class NavigationService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private route: Route | null = null;
  private config: NavigationConfig = DEFAULT_CONFIG;
  private navigationState: NavigationState = this.getInitialState();
  private onStateChangeCallback: ((state: NavigationState) => void) | null = null;
  private onRecalculateCallback: (() => Promise<void>) | null = null;

  /**
   * Get initial navigation state
   */
  private getInitialState(): NavigationState {
    return {
      isNavigating: false,
      currentLocation: null,
      isOffRoute: false,
      completedCoordinates: [],
    };
  }

  /**
   * Start GPS navigation with a route
   */
  async startNavigation(
    route: Route,
    onStateChange: (state: NavigationState) => void,
    onRecalculate?: () => Promise<void>
  ): Promise<boolean> {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Location permission denied');
        return false;
      }

      this.route = route;
      this.onStateChangeCallback = onStateChange;
      this.onRecalculateCallback = onRecalculate || null;

      // Initialize navigation state
      this.navigationState = {
        ...this.getInitialState(),
        isNavigating: true,
      };

      // Start location tracking
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: this.config.locationUpdateInterval,
          distanceInterval: 5, // Update every 5 meters
        },
        (location) => this.handleLocationUpdate(location)
      );

      this.notifyStateChange();
      return true;
    } catch (error) {
      console.error('Error starting navigation:', error);
      return false;
    }
  }

  /**
   * Stop GPS navigation
   */
  stopNavigation(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    this.route = null;
    this.onStateChangeCallback = null;
    this.onRecalculateCallback = null;
    this.navigationState = this.getInitialState();

  }

  /**
   * Handle location update from GPS
   */
  private handleLocationUpdate(location: Location.LocationObject): void {
    if (!this.route || !this.navigationState.isNavigating) {
      return;
    }

    const currentLocation: Coordinates = {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };

    this.navigationState.currentLocation = currentLocation;

    // Find closest point on route
    const closestPoint = this.findClosestPointOnRoute(currentLocation);
    const distanceFromRoute = this.calculateDistance(currentLocation, closestPoint.coordinate);

    // Check if off route
    if (distanceFromRoute > this.config.offRouteThreshold) {
      if (!this.navigationState.isOffRoute) {
        console.warn('⚠️ User is off route, triggering recalculation');
        this.navigationState.isOffRoute = true;
        this.notifyStateChange();

        // Trigger recalculation
        if (this.onRecalculateCallback) {
          this.onRecalculateCallback();
        }
      }
      return;
    } else {
      this.navigationState.isOffRoute = false;
    }

    // Calculate completed coordinates (all points before current position)
    this.navigationState.completedCoordinates = this.route.coordinates.slice(
      0,
      closestPoint.coordinateIndex + 1
    );

    // Notify listeners
    this.notifyStateChange();
  }

  /**
   * Find closest point on route to current location
   */
  private findClosestPointOnRoute(location: Coordinates): {
    coordinate: Coordinates;
    coordinateIndex: number;
    distance: number;
  } {
    if (!this.route) {
      return { coordinate: location, coordinateIndex: 0, distance: 0 };
    }

    let minDistance = Infinity;
    let closestIndex = 0;

    for (let i = 0; i < this.route.coordinates.length; i++) {
      const distance = this.calculateDistance(location, this.route.coordinates[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }

    return {
      coordinate: this.route.coordinates[closestIndex],
      coordinateIndex: closestIndex,
      distance: minDistance,
    };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (coord1.lat * Math.PI) / 180;
    const φ2 = (coord2.lat * Math.PI) / 180;
    const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Notify state change to listeners
   */
  private notifyStateChange(): void {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({ ...this.navigationState });
    }
  }

  /**
   * Get current navigation state
   */
  getState(): NavigationState {
    return { ...this.navigationState };
  }

  /**
   * Check if currently navigating
   */
  isNavigating(): boolean {
    return this.navigationState.isNavigating;
  }
}

export const navigationService = new NavigationService();
