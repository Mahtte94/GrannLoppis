import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region, Marker, Polyline } from 'react-native-maps';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BuyerStackParamList, Participant, Event, Route, RouteWaypoint } from '../../types';
import { MapMarker } from '../../components/MapMarker';
import { participantsService } from '../../services/firebase/participants.service';
import { eventsService } from '../../services/firebase';
import { googleMapsService, navigationService, NavigationState } from '../../services/routing';
import { theme } from '../../styles/theme';

type EventMapScreenRouteProp = RouteProp<BuyerStackParamList, 'EventMap'>;
type EventMapScreenNavigationProp = StackNavigationProp<BuyerStackParamList, 'EventMap'>;

export function EventMapScreen() {
  const route = useRoute<EventMapScreenRouteProp>();
  const navigation = useNavigation<EventMapScreenNavigationProp>();
  const { eventId } = route.params;

  const mapRef = useRef<MapView>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [optimizedRoute, setOptimizedRoute] = useState<Route | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [navigationState, setNavigationState] = useState<NavigationState | null>(null);
  const [isNavigationMode, setIsNavigationMode] = useState(false);

  useEffect(() => {
    loadEventAndParticipants();
  }, [eventId]);

  // Cleanup navigation on unmount
  useEffect(() => {
    return () => {
      if (navigationService.isNavigating()) {
        navigationService.stopNavigation();
      }
    };
  }, []);

  // Auto-center camera on user location during navigation
  useEffect(() => {
    if (isNavigationMode && navigationState?.currentLocation && mapRef.current) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: navigationState.currentLocation.lat,
            longitude: navigationState.currentLocation.lng,
          },
          heading: 0, // Can be updated based on user's heading
          altitude: 500,
          zoom: 16, // Closer zoom for navigation
        },
        { duration: 500 }
      );
    }
  }, [navigationState?.currentLocation, isNavigationMode]);

  const loadEventAndParticipants = async () => {
    try {
      setLoading(true);

      // Fetch event and participants in parallel for better performance
      const [eventData, participantsData] = await Promise.all([
        eventsService.getEventById(eventId),
        participantsService.getEventParticipants(eventId)
      ]);

      console.log('Loaded event:', eventData);
      console.log('Event coordinates:', eventData?.coordinates);
      console.log(`Loaded ${participantsData.length} participants for event ${eventId}`);

      setEvent(eventData);
      setParticipants(participantsData);

      // Set initial region to event location
      if (eventData?.coordinates) {
        const eventRegion = {
          latitude: eventData.coordinates.lat,
          longitude: eventData.coordinates.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        console.log('Setting map region to:', eventRegion);
        setRegion(eventRegion);

        // Animate to event location after a short delay to ensure map is ready
        setTimeout(() => {
          mapRef.current?.animateToRegion(eventRegion, 1000);
        }, 500);
      }

      // If there are participants, adjust region to show all markers
      if (participantsData.length > 0 && eventData?.coordinates) {
        const allLats = [eventData.coordinates.lat, ...participantsData.map(p => p.coordinates.lat)];
        const allLngs = [eventData.coordinates.lng, ...participantsData.map(p => p.coordinates.lng)];

        const minLat = Math.min(...allLats);
        const maxLat = Math.max(...allLats);
        const minLng = Math.min(...allLngs);
        const maxLng = Math.max(...allLngs);

        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        const latDelta = Math.max((maxLat - minLat) * 1.5, 0.01);
        const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.01);

        const allMarkersRegion = {
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        };

        setRegion(allMarkersRegion);

        setTimeout(() => {
          mapRef.current?.animateToRegion(allMarkersRegion, 1000);
        }, 500);
      }

    } catch (error) {
      console.error('Error loading event and participants:', error);
      Alert.alert('Fel', 'Kunde inte ladda evenemang. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (participant: Participant) => {
    navigation.navigate('SellerDetails', { participantId: participant.id });
  };

  const handleToggleRoute = async () => {
    if (isNavigationMode) {
      // Stop navigation
      handleStopNavigation();
      return;
    }

    // Start navigation - generate route and begin GPS tracking
    await startNavigation();
  };

  const startNavigation = async () => {
    const route = await generateRoute();
    if (route) {
      // Start GPS navigation service
      const started = await navigationService.startNavigation(
        route,
        handleNavigationStateChange,
        handleRecalculateRoute
      );

      if (started) {
        setIsNavigationMode(true);
        setShowRoute(true);
      } else {
        Alert.alert('Kunde inte starta navigering', 'Kontrollera att du har gett appen åtkomst till din plats.');
      }
    }
  };

  const handleStopNavigation = () => {
    navigationService.stopNavigation();
    setIsNavigationMode(false);
    setNavigationState(null);
    setShowRoute(false);
  };

  const handleNavigationStateChange = (state: NavigationState) => {
    setNavigationState(state);
  };

  const handleRecalculateRoute = async () => {
    console.log('🔄 Recalculating route due to off-route detection...');

    // Generate new route from current location
    const newRoute = await generateRoute();
    if (newRoute) {
      // Restart navigation with new route
      navigationService.stopNavigation();
      const started = await navigationService.startNavigation(
        newRoute,
        handleNavigationStateChange,
        handleRecalculateRoute
      );

      if (started) {
        Alert.alert('Rutt uppdaterad', 'En ny rutt har skapats från din nuvarande plats.');
      }
    }
  };

  const generateRoute = async (): Promise<Route | null> => {
    try {
      if (participants.length < 2) {
        Alert.alert(
          'Inte tillräckligt med säljare',
          'Du behöver minst 2 säljare för att generera en rutt.'
        );
        return null;
      }

      setLoadingRoute(true);

      // Get user's current location first
      const { getUserLocation } = require('../../utils/helpers');
      const userLocation = await getUserLocation();

      if (!userLocation) {
        Alert.alert(
          'Kunde inte hämta din plats',
          'Vi behöver din plats för att skapa en rutt. Kontrollera att du har gett appen åtkomst till din plats.'
        );
        setLoadingRoute(false);
        return null;
      }


      // Convert participants to waypoints
      const waypoints: RouteWaypoint[] = participants.map(participant => ({
        coordinates: participant.coordinates,
        name: participant.address,
        participantId: participant.id,
      }));

      // Get optimized route from Google Maps
      const generatedRoute = await googleMapsService.getOptimizedRoute(waypoints, {
        includeUserLocation: true,
        profile: 'foot-walking',
      });

      if (generatedRoute) {
        setOptimizedRoute(generatedRoute);
        return generatedRoute;
      } else {
        Alert.alert(
          'Kunde inte skapa rutt',
          'Det gick inte att generera en rutt. Kontrollera att du har en internetanslutning och försök igen.'
        );
        return null;
      }
    } catch (error) {
      console.error('Error generating route:', error);
      Alert.alert('Fel', 'Ett fel uppstod när rutten skulle skapas.');
      return null;
    } finally {
      setLoadingRoute(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Laddar karta...</Text>
      </View>
    );
  }

  if (!event || !region) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Loppmarknader hittades inte</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={!isNavigationMode}
        pitchEnabled={true}
        rotateEnabled={isNavigationMode}
      >
        {/* Show event location marker only when no participants */}
        {participants.length === 0 && event.coordinates && (
          <Marker
            coordinate={{
              latitude: event.coordinates.lat,
              longitude: event.coordinates.lng,
            }}
            pinColor={theme.colors.secondary}
            title={event.name}
            description={`${event.area} • Inga säljare än`}
          />
        )}

        {/* Show seller markers when participants exist */}
        {participants.map((participant) => (
          <MapMarker
            key={participant.id}
            participant={participant}
            onPress={handleMarkerPress}
          />
        ))}

        {/* Show route polylines when enabled */}
        {showRoute && optimizedRoute && (
          <>
            {/* Remaining route (full route or uncompleted portion) */}
            <Polyline
              coordinates={optimizedRoute.coordinates.map(coord => ({
                latitude: coord.lat,
                longitude: coord.lng,
              }))}
              strokeColor={theme.colors.primary}
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />

            {/* Completed route portion (shown during navigation) */}
            {isNavigationMode && navigationState?.completedCoordinates && navigationState.completedCoordinates.length > 1 && (
              <Polyline
                coordinates={navigationState.completedCoordinates.map(coord => ({
                  latitude: coord.lat,
                  longitude: coord.lng,
                }))}
                strokeColor="#34C759" // Green color for completed portion
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />
            )}
          </>
        )}
      </MapView>

      {/* Info box - hidden during navigation mode */}
      {!isNavigationMode && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
             {event.name}
          </Text>
          <Text style={styles.infoSubtext}>
            {participants.length} {participants.length === 1 ? 'säljare' : 'säljare'} • Tryck på markörerna för mer info
          </Text>
        </View>
      )}

      {/* Navigation toggle button */}
      {participants.length >= 2 && !isNavigationMode && (
        <TouchableOpacity
          style={[
            styles.routeButton,
            loadingRoute && styles.routeButtonLoading,
          ]}
          onPress={handleToggleRoute}
          disabled={loadingRoute}
        >
          {loadingRoute ? (
            <>
              <ActivityIndicator size="small" color={theme.colors.white} />
            </>
          ) : (
            <>
              <Text style={styles.routeButtonText}>GPS</Text>
            </>
          )}
        </TouchableOpacity>
      )}
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
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  infoBox: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  routeButton: {
    position: 'absolute',
    bottom: theme.spacing.xxxl,
    left: theme.spacing.xxxl,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  routeButtonLoading: {
    opacity: 0.7,
  },
  routeButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: '700',
  }
});
