import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region, Marker } from 'react-native-maps';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BuyerStackParamList, Participant, Event } from '../../types';
import { MapMarker } from '../../components/MapMarker';
import { participantsService } from '../../services/firebase/participants.service';
import { eventsService } from '../../services/firebase';
import { theme } from '../../styles/theme';
import { formatDateRange } from '../../utils/helpers';

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

  useEffect(() => {
    loadEventAndParticipants();
  }, [eventId]);

  const loadEventAndParticipants = async () => {
    try {
      setLoading(true);

      // Fetch event details
      const eventData = await eventsService.getEventById(eventId);
      console.log('Loaded event:', eventData);
      console.log('Event coordinates:', eventData?.coordinates);
      setEvent(eventData);

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

      // Fetch participants from Firebase
      const participantsData = await participantsService.getEventParticipants(eventId);
      console.log(`Loaded ${participantsData.length} participants for event ${eventId}`);
      setParticipants(participantsData);

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
        <Text style={styles.emptyText}>Evenemang hittades inte</Text>
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
        {/* Show event location marker */}
        {event.coordinates && (
          <Marker
            coordinate={{
              latitude: event.coordinates.lat,
              longitude: event.coordinates.lng,
            }}
            pinColor={theme.colors.secondary}
            title={event.name}
            description={`${event.area} • ${participants.length} säljare`}
          />
        )}

        {/* Show seller markers (always visible if participants exist) */}
        {participants.map((participant) => (
          <MapMarker
            key={participant.id}
            participant={participant}
            onPress={handleMarkerPress}
          />
        ))}
      </MapView>

      {/* Info box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          📍 {event.name}
        </Text>
        <Text style={styles.infoSubtext}>
          {participants.length} {participants.length === 1 ? 'säljare' : 'säljare'} • Tryck på markörerna för mer info
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
    backgroundColor: theme.colors.white,
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
  backLink: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    fontWeight: '600',
  },
  callout: {
    width: 250,
  },
  calloutContent: {
    padding: theme.spacing.sm,
    width: 240,
  },
  calloutTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  calloutArea: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  calloutDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  calloutParticipants: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  calloutButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  calloutButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
});
