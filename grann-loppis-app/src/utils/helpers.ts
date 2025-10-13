import { EventStatus, Coordinates } from '../types';
import * as Location from 'expo-location';

/**
 * Calculate the current status of an event based on its date range
 * An event is:
 * - ACTIVE if today is between startDate and endDate (inclusive)
 * - COMPLETED if today is after endDate
 * - UPCOMING if today is before startDate
 */
export function getEventStatus(startDate: Date, endDate: Date): EventStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  if (today.getTime() >= start.getTime() && today.getTime() <= end.getTime()) {
    return EventStatus.ACTIVE;
  } else if (today.getTime() > end.getTime()) {
    return EventStatus.COMPLETED;
  } else {
    return EventStatus.UPCOMING;
  }
}

/**
 * Get a user-friendly status text in Swedish
 */
export function getStatusText(status: EventStatus): string {
  switch (status) {
    case EventStatus.ACTIVE:
      return 'Pågår nu';
    case EventStatus.UPCOMING:
      return 'Kommande';
    case EventStatus.COMPLETED:
      return 'Avslutad';
    default:
      return status;
  }
}

/**
 * Format a date to Swedish locale
 */
export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  };

  return new Date(date).toLocaleDateString('sv-SE', options || defaultOptions);
}

/**
 * Format a date range to Swedish locale
 * Examples:
 * - Same day: "12 oktober 2025"
 * - Same month: "12-15 oktober 2025"
 * - Different months: "30 september - 3 oktober 2025"
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Same day
  if (start.toDateString() === end.toDateString()) {
    return formatDate(start, { day: 'numeric', month: 'long', year: 'numeric' });
  }

  // Same month
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    const startDay = start.getDate();
    const endDay = end.getDate();
    const month = start.toLocaleDateString('sv-SE', { month: 'long' });
    const year = start.getFullYear();
    return `${startDay}-${endDay} ${month} ${year}`;
  }

  // Different months
  const startStr = formatDate(start, { day: 'numeric', month: 'long' });
  const endStr = formatDate(end, { day: 'numeric', month: 'long', year: 'numeric' });
  return `${startStr} - ${endStr}`;
}

/**
 * Calculate the number of days between two dates
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays + 1; // +1 to include both start and end days
}

/**
 * Geocode an address string to coordinates using expo-location
 * Returns coordinates if the address is valid, null otherwise
 * @param address - The address string to geocode (e.g., "Vasastan, Stockholm")
 * @returns Coordinates object with lat and lng, or null if geocoding fails
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    // Request location permissions first
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Location permission not granted');
      return null;
    }

    // Geocode the address
    console.log('🗺️ Geocoding address:', address);
    const results = await Location.geocodeAsync(address);
    console.log('🗺️ Geocoding results:', results.length, 'results found');

    if (results.length === 0) {
      console.warn('🗺️ No geocoding results found for:', address);
      return null;
    }

    // Log all results for debugging
    results.forEach((result, index) => {
      console.log(`🗺️ Result ${index}:`, {
        lat: result.latitude,
        lng: result.longitude,
        accuracy: result.accuracy,
      });
    });

    // Return the first result
    const location = results[0];
    const coordinates = {
      lat: location.latitude,
      lng: location.longitude,
    };

    console.log('🗺️ Using coordinates:', coordinates);

    // Reverse geocode to verify what location this actually is
    try {
      const reverseResults = await Location.reverseGeocodeAsync({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      if (reverseResults.length > 0) {
        const loc = reverseResults[0];
        console.log('🗺️ Reverse geocoded to:', {
          city: loc.city,
          district: loc.district,
          region: loc.region,
          country: loc.country,
        });
      }
    } catch (reverseError) {
      console.warn('🗺️ Reverse geocoding failed:', reverseError);
    }

    return coordinates;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

/**
 * Validate that an area string corresponds to a real location
 * @param area - The area string to validate (e.g., "Vasastan, Stockholm")
 * @returns true if the area is valid (can be geocoded), false otherwise
 */
export async function validateArea(area: string): Promise<boolean> {
  const coordinates = await geocodeAddress(area);
  return coordinates !== null;
}

/**
 * Reverse geocode coordinates to get an address
 * @param coordinates - The coordinates to reverse geocode
 * @returns Address string or null if reverse geocoding fails
 */
export async function reverseGeocode(coordinates: Coordinates): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: coordinates.lat,
      longitude: coordinates.lng,
    });

    if (results.length === 0) {
      return null;
    }

    const location = results[0];
    // Build a readable address from the components
    const parts = [
      location.district || location.subregion,
      location.city,
      location.region,
      location.country,
    ].filter(Boolean);

    return parts.join(', ');
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}
