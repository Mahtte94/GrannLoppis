import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region, Marker } from 'react-native-maps';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MapStackParamList, Event } from '../../types';
import { eventsService } from '../../services/firebase';
import { theme } from '../../styles/theme';
import { getUserLocation } from '../../utils/helpers';

type AllEventsMapScreenNavigationProp = StackNavigationProp<MapStackParamList, 'AllEventsMap'>;
type AllEventsMapScreenRouteProp = RouteProp<MapStackParamList, 'AllEventsMap'>;

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export function AllEventsMapScreen() {
  const navigation = useNavigation<AllEventsMapScreenNavigationProp>();
  const route = useRoute<AllEventsMapScreenRouteProp>();
  const mapRef = useRef<MapView>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  const [region, setRegion] = useState<Region>({
    latitude: 59.3293, // Stockholm default
    longitude: 18.0686,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  // Extract location from route params if provided
  const searchLocation = route.params?.location;
  const searchLocationName = route.params?.locationName;

  const loadEvents = useCallback(async (forceRefresh = false) => {
    try {
      // Check if cache is still valid
      const now = Date.now();
      const isCacheValid = events.length > 0 && now - lastLoadTime < CACHE_DURATION;

      if (isCacheValid && !forceRefresh) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // Fetch location and events in parallel for better performance
      const [userLocation, eventsData] = await Promise.all([
        getUserLocation().catch(err => {
          return null;
        }),
        eventsService.getAllEvents()
      ]);

      // Filter events that have coordinates
      const eventsWithCoordinates = eventsData.filter(e => e.coordinates);
      setEvents(eventsWithCoordinates);
      setLastLoadTime(Date.now());

      // Determine the region to show
      let targetRegion: Region;

      if (searchLocation) {
        // If a search location was provided, zoom to that location
        // latitudeDelta/longitudeDelta of ~0.05 shows about 5km radius
        targetRegion = {
          latitude: searchLocation.lat,
          longitude: searchLocation.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
      } else if (userLocation) {
        // If we have user location, zoom in on the user's location
        // latitudeDelta/longitudeDelta of ~0.05 shows about 5km radius
        targetRegion = {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
      } else if (eventsWithCoordinates.length > 0) {
        // If no user location but we have events, show all events
        const allLats = eventsWithCoordinates.map(e => e.coordinates!.lat);
        const allLngs = eventsWithCoordinates.map(e => e.coordinates!.lng);

        const minLat = Math.min(...allLats);
        const maxLat = Math.max(...allLats);
        const minLng = Math.min(...allLngs);
        const maxLng = Math.max(...allLngs);

        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        const latDelta = Math.max((maxLat - minLat) * 1.5, 0.1);
        const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.1);

        targetRegion = {
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        };
      } else {
        // Default to Stockholm if nothing else available
        targetRegion = {
          latitude: 59.3293,
          longitude: 18.0686,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        };
      }

      setRegion(targetRegion);

      // Animate to the target region
      setTimeout(() => {
        mapRef.current?.animateToRegion(targetRegion, 1000);
      }, 500);

    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Fel', 'Kunde inte ladda loppis. Försök igen.');
    } finally {
      setLoading(false);
    }
  }, [searchLocation]);

  // Reload map when screen comes into focus, but respect cache
  // Force refresh if search location changes
  const prevSearchLocationRef = useRef(searchLocation);

  useFocusEffect(
    useCallback(() => {

      // Check if search location changed - if so, force refresh
      const locationChanged =
        JSON.stringify(prevSearchLocationRef.current) !== JSON.stringify(searchLocation);

      if (locationChanged) {
        prevSearchLocationRef.current = searchLocation;
        loadEvents(true);
      } else {
        // Use cached data if available
        loadEvents(false);
      }
    }, [loadEvents, searchLocation])
  );

  const handleMarkerPress = (event: Event) => {
    navigation.navigate('EventDetails', { eventId: event.id });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Laddar karta...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider= {PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {events.map((event) => (
          <Marker
            key={event.id}
            coordinate={{
              latitude: event.coordinates!.lat,
              longitude: event.coordinates!.lng,
            }}
            pinColor={theme.colors.primary}
            onPress={() => handleMarkerPress(event)}
          />
        ))}
      </MapView>

      {/* Info box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          {searchLocationName ? `${searchLocationName}` : 'Alla loppmarknader'}
        </Text>
        <Text style={styles.infoSubtext}>
          {events.length} {events.length === 1 ? 'loppis' : 'loppisar'} • Tryck på markörerna för mer info
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
  },
  infoBox: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.surfaceLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  infoText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  infoSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
});
