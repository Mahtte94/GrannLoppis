import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BuyerStackParamList, Event, EventStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../styles/theme';

type BrowseEventsScreenNavigationProp = StackNavigationProp<BuyerStackParamList, 'BrowseEvents'>;

export default function BrowseEventsScreen() {
  const navigation = useNavigation<BrowseEventsScreenNavigationProp>();
  const { setUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [region] = useState<Region>({
    latitude: 59.3293,
    longitude: 18.0686,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  const handleLogout = () => {
    setUser(null);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);

      // Mock events data for testing
      const mockEvents: Event[] = [
        {
          id: 'event-1',
          name: 'Södermalm Spring Market',
          date: new Date('2025-05-15'),
          area: 'Södermalm, Stockholm',
          eventCode: 'SPRING2025',
          organizerId: 'org-1',
          createdAt: new Date(),
          status: EventStatus.UPCOMING,
          participants: 12,
        },
        {
          id: 'event-2',
          name: 'Vasastan Garage Sale',
          date: new Date('2025-05-20'),
          area: 'Vasastan, Stockholm',
          eventCode: 'VASA2025',
          organizerId: 'org-2',
          createdAt: new Date(),
          status: EventStatus.UPCOMING,
          participants: 8,
        },
        {
          id: 'event-3',
          name: 'Östermalm Flea Market',
          date: new Date('2025-05-18'),
          area: 'Östermalm, Stockholm',
          eventCode: 'OSTER2025',
          organizerId: 'org-3',
          createdAt: new Date(),
          status: EventStatus.ACTIVE,
          participants: 15,
        },
      ];

      setEvents(mockEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventPress = (event: Event) => {
    navigation.navigate('EventDetails', { eventId: event.id });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Browse Events</Text>
            <Text style={styles.subtitle}>{events.length} events near you</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Change Role</Text>
          </TouchableOpacity>
        </View>
      </View>

      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation={true}
      >
        {events.map((event, index) => {
          // Spread events around Stockholm for demo
          const lat = 59.3293 + (index - 1) * 0.015;
          const lng = 18.0686 + (index - 1) * 0.02;

          return (
            <Marker
              key={event.id}
              coordinate={{ latitude: lat, longitude: lng }}
              pinColor={event.status === EventStatus.ACTIVE ? theme.colors.success : theme.colors.secondary}
              onPress={() => handleEventPress(event)}
              title={event.name}
              description={`${event.participants} sellers • ${event.area}`}
            />
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
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
  header: {
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
  },
  logoutButton: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  logoutText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
});
