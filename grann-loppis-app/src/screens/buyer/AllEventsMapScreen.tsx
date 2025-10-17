import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region, Marker } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MapStackParamList, Event } from '../../types';
import { eventsService } from '../../services/firebase';
import { theme } from '../../styles/theme';

type AllEventsMapScreenNavigationProp = StackNavigationProp<MapStackParamList, 'AllEventsMap'>;

export function AllEventsMapScreen() {
  const navigation = useNavigation<AllEventsMapScreenNavigationProp>();
  const mapRef = useRef<MapView>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<Region>({
    latitude: 59.3293, // Stockholm default
    longitude: 18.0686,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);

      // Fetch all events
      const eventsData = await eventsService.getAllEvents();
      console.log(`Loaded ${eventsData.length} events for map`);

      // Filter events that have coordinates
      const eventsWithCoordinates = eventsData.filter(e => e.coordinates);
      setEvents(eventsWithCoordinates);

      // If there are events, adjust region to show all markers
      if (eventsWithCoordinates.length > 0) {
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

        const allEventsRegion = {
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        };

        setRegion(allEventsRegion);

        // Animate to show all events
        setTimeout(() => {
          mapRef.current?.animateToRegion(allEventsRegion, 1000);
        }, 500);
      }

    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Fel', 'Kunde inte ladda loppis. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (event: Event) => {
    console.log('Marker pressed for event:', event.name);
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
        provider={PROVIDER_GOOGLE}
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
          Alla loppmarknader
        </Text>
        <Text style={styles.infoSubtext}>
          {events.length} {events.length === 1 ? 'evenemang' : 'evenemang'} • Tryck på markörerna för mer info
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
