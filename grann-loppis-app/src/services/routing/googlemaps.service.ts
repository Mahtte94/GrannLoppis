import {
  Route,
  RouteWaypoint,
  RouteOptimizationOptions,
  Coordinates,
} from '../../types';
import { getUserLocation } from '../../utils/helpers';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';

/**
 * Google Maps Directions API response types
 */
interface GoogleMapsDirectionsResponse {
  routes: Array<{
    legs: Array<{
      distance: { value: number }; // meters
      duration: { value: number }; // seconds
      steps: Array<{
        distance: { value: number };
        duration: { value: number };
        html_instructions: string;
        maneuver?: string;
        start_location: { lat: number; lng: number };
        end_location: { lat: number; lng: number };
      }>;
    }>;
    overview_polyline: {
      points: string; // Encoded polyline
    };
    waypoint_order?: number[]; // Optimized waypoint order (if optimization enabled)
  }>;
  status: string;
  error_message?: string;
}

/**
 * Google Maps API service for route optimization and directions
 */
class GoogleMapsService {
  /**
   * Decode Google Maps encoded polyline to coordinates array
   * @param encoded - Encoded polyline string
   * @returns Array of coordinates
   */
  private decodePolyline(encoded: string): Coordinates[] {
    const coordinates: Coordinates[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      coordinates.push({
        lat: lat / 1e5,
        lng: lng / 1e5,
      });
    }

    return coordinates;
  }

  /**
   * Get an optimized route through multiple waypoints using Google Maps Directions API
   *
   * @param waypoints - Array of waypoints (seller locations) to visit
   * @param options - Route optimization options
   * @returns Optimized route with coordinates and metadata
   */
  async getOptimizedRoute(
    waypoints: RouteWaypoint[],
    options: RouteOptimizationOptions = {}
  ): Promise<Route | null> {
    try {
      if (!GOOGLE_MAPS_API_KEY) {
        console.error('❌ Google Maps API key is not configured in .env file');
        console.error('❌ Please ensure EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is set in your .env file');
        return null;
      }

      console.log('✅ Google Maps API key is configured');

      if (waypoints.length < 2) {
        console.warn('⚠️ Need at least 2 waypoints to create a route');
        return null;
      }

      if (waypoints.length > 25) {
        console.warn('⚠️ Google Maps supports up to 25 waypoints. Using first 25.');
        waypoints = waypoints.slice(0, 25);
      }

      const {
        includeUserLocation = true,
        profile = 'foot-walking',
      } = options;

      // Get user location if needed
      let userLocation: Coordinates | null = null;
      if (includeUserLocation) {
        userLocation = await getUserLocation();
        if (!userLocation) {
          console.warn('Could not get user location, starting from first waypoint');
        }
      }

      // Build origin and destination
      const origin = userLocation
        ? `${userLocation.lat},${userLocation.lng}`
        : `${waypoints[0].coordinates.lat},${waypoints[0].coordinates.lng}`;

      const destination = `${waypoints[waypoints.length - 1].coordinates.lat},${waypoints[waypoints.length - 1].coordinates.lng}`;

      // Build waypoints (exclude first and last if user location is not used)
      const waypointStart = userLocation ? 0 : 1;
      const waypointEnd = userLocation ? waypoints.length : waypoints.length - 1;
      const intermediateWaypoints = waypoints.slice(waypointStart, waypointEnd);

      const waypointsParam = intermediateWaypoints
        .map(wp => `${wp.coordinates.lat},${wp.coordinates.lng}`)
        .join('|');

      // Map profile to Google Maps travel mode
      let travelMode = 'walking';
      if (profile === 'driving-car') {
        travelMode = 'driving';
      } else if (profile === 'cycling-regular') {
        travelMode = 'bicycling';
      }

      // Build API URL with parameters
      const url = new URL(GOOGLE_MAPS_DIRECTIONS_URL);
      url.searchParams.append('origin', origin);
      url.searchParams.append('destination', destination);
      if (waypointsParam) {
        url.searchParams.append('waypoints', `optimize:true|${waypointsParam}`);
      }
      url.searchParams.append('mode', travelMode);
      url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

      console.log(`🗺️ Requesting route for ${waypoints.length} waypoints`);
      console.log(`🗺️ Travel mode: ${travelMode}`);
      console.log(`🗺️ Optimization: enabled`);

      const response = await fetch(url.toString());

      console.log(`🗺️ Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Google Maps API error:', response.status, errorText);
        return null;
      }

      const data: GoogleMapsDirectionsResponse = await response.json();

      if (data.status !== 'OK') {
        console.error('❌ Google Maps API error:', data.status, data.error_message || 'Unknown error');
        return null;
      }

      if (!data.routes || data.routes.length === 0) {
        console.warn('⚠️ No routes found in response');
        return null;
      }

      const route = data.routes[0];

      // Decode polyline to get route coordinates
      const routeCoordinates = this.decodePolyline(route.overview_polyline.points);

      // Calculate total distance and duration from all legs
      let totalDistance = 0;
      let totalDuration = 0;

      const segments = route.legs.map(leg => {
        totalDistance += leg.distance.value;
        totalDuration += leg.duration.value;

        return {
          distance: leg.distance.value,
          duration: leg.duration.value,
          steps: leg.steps?.map(step => ({
            distance: step.distance.value,
            duration: step.duration.value,
            instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
            name: step.maneuver || '',
          })),
        };
      });

      // Reorder waypoints if optimization was applied
      let optimizedWaypoints = [...waypoints];
      if (route.waypoint_order && route.waypoint_order.length > 0) {
        console.log('✅ Waypoints optimized by Google Maps');
        console.log(`   Order: ${route.waypoint_order.join(' → ')}`);

        // Reorder waypoints based on optimized order
        const reordered: RouteWaypoint[] = [];
        route.waypoint_order.forEach(index => {
          if (index < intermediateWaypoints.length) {
            reordered.push(intermediateWaypoints[index]);
          }
        });
        optimizedWaypoints = reordered;
      }

      const finalRoute: Route = {
        coordinates: routeCoordinates,
        distance: totalDistance,
        duration: totalDuration,
        waypoints: optimizedWaypoints,
        segments,
      };

      console.log(`✅ Route generated: ${(totalDistance / 1000).toFixed(2)} km, ${Math.round(totalDuration / 60)} min`);

      return finalRoute;
    } catch (error) {
      console.error('Error getting optimized route:', error);
      return null;
    }
  }

  /**
   * Get route distance and duration between two points
   * Useful for preview or simple distance calculations
   *
   * @param start - Starting coordinates
   * @param end - Ending coordinates
   * @param profile - Transportation mode (default: foot-walking)
   * @returns Route information or null if failed
   */
  async getRouteInfo(
    start: Coordinates,
    end: Coordinates,
    profile: 'driving-car' | 'foot-walking' | 'cycling-regular' = 'foot-walking'
  ): Promise<{ distance: number; duration: number } | null> {
    try {
      if (!GOOGLE_MAPS_API_KEY) {
        console.error('Google Maps API key is not configured');
        return null;
      }

      // Map profile to Google Maps travel mode
      let travelMode = 'walking';
      if (profile === 'driving-car') {
        travelMode = 'driving';
      } else if (profile === 'cycling-regular') {
        travelMode = 'bicycling';
      }

      const url = new URL(GOOGLE_MAPS_DIRECTIONS_URL);
      url.searchParams.append('origin', `${start.lat},${start.lng}`);
      url.searchParams.append('destination', `${end.lat},${end.lng}`);
      url.searchParams.append('mode', travelMode);
      url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

      const response = await fetch(url.toString());

      if (!response.ok) {
        console.error('Google Maps API error:', response.status);
        return null;
      }

      const data: GoogleMapsDirectionsResponse = await response.json();

      if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
        return null;
      }

      const leg = data.routes[0].legs[0];

      return {
        distance: leg.distance.value,
        duration: leg.duration.value,
      };
    } catch (error) {
      console.error('Error getting route info:', error);
      return null;
    }
  }

  /**
   * Format route duration in a human-readable way
   * @param seconds - Duration in seconds
   * @returns Formatted duration string (e.g., "1 h 30 min" or "45 min")
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours} h ${minutes} min`;
    } else {
      return `${minutes} min`;
    }
  }

  /**
   * Format route distance in a human-readable way
   * @param meters - Distance in meters
   * @returns Formatted distance string (e.g., "2.5 km" or "500 m")
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  }
}

export const googleMapsService = new GoogleMapsService();
