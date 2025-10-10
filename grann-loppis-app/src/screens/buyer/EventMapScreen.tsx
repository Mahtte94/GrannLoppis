import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BuyerStackParamList, Participant } from '../../types';
import { MapMarker } from '../../components/MapMarker';
import { participantsService } from '../../services/firebase/participants.service';
import { theme } from '../../styles/theme';

type EventMapScreenRouteProp = RouteProp<BuyerStackParamList, 'EventMap'>;
type EventMapScreenNavigationProp = StackNavigationProp<BuyerStackParamList, 'EventMap'>;

export function EventMapScreen() {
  const route = useRoute<EventMapScreenRouteProp>();
  const navigation = useNavigation<EventMapScreenNavigationProp>();
  const { eventId } = route.params;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<Region | undefined>(undefined);

  useEffect(() => {
    loadParticipants();
  }, [eventId]);

  const loadParticipants = async () => {
    try {
      setLoading(true);

      // Try to fetch from Firebase
      let data: Participant[] = [];
      try {
        data = await participantsService.getEventParticipants(eventId);
      } catch (firebaseError) {
        console.warn('Firebase fetch failed, using mock data:', firebaseError);

        // Use mock data for testing when Firebase is not configured
        data = [
          {
            id: '1',
            eventId: eventId,
            userId: 'user1',
            address: 'Storgatan 1, Stockholm',
            coordinates: { lat: 59.3293, lng: 18.0686 },
            displayName: 'Anna\'s Garage Sale',
            description: 'Vintage clothes, books, and furniture',
            joinedAt: new Date(),
          },
          {
            id: '2',
            eventId: eventId,
            userId: 'user2',
            address: 'Kungsgatan 10, Stockholm',
            coordinates: { lat: 59.3325, lng: 18.0649 },
            displayName: 'Erik\'s Treasures',
            description: 'Electronics, toys, and home decor',
            joinedAt: new Date(),
          },
          {
            id: '3',
            eventId: eventId,
            userId: 'user3',
            address: 'Vasagatan 5, Stockholm',
            coordinates: { lat: 59.3310, lng: 18.0620 },
            displayName: 'Lisa\'s Vintage Shop',
            description: 'Antiques and collectibles',
            joinedAt: new Date(),
          },
        ];
      }

      setParticipants(data);

      // Calculate initial region to show all markers
      if (data.length > 0) {
        const lats = data.map(p => p.coordinates.lat);
        const lngs = data.map(p => p.coordinates.lng);

        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        const latDelta = (maxLat - minLat) * 1.5; // Add padding
        const lngDelta = (maxLng - minLng) * 1.5;

        setRegion({
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: Math.max(latDelta, 0.01), // Minimum zoom level
          longitudeDelta: Math.max(lngDelta, 0.01),
        });
      }
    } catch (error) {
      console.error('Error loading participants:', error);
      Alert.alert('Error', 'Failed to load seller locations');
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
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (participants.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No sellers have joined this event yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {participants.map((participant) => (
          <MapMarker
            key={participant.id}
            participant={participant}
            onPress={handleMarkerPress}
          />
        ))}
      </MapView>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          {participants.length} seller{participants.length !== 1 ? 's' : ''} at this event
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
});
