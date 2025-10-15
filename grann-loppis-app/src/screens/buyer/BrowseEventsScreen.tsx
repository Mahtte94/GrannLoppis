import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BuyerStackParamList, Event, EventStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { EventCard } from '../../components/EventCard';
import { Loading } from '../../components/common/Loading';
import { eventsService } from '../../services/firebase';
import { theme } from '../../styles/theme';

type BrowseEventsScreenNavigationProp = StackNavigationProp<BuyerStackParamList, 'BrowseEvents'>;

export default function BrowseEventsScreen() {
  const navigation = useNavigation<BrowseEventsScreenNavigationProp>();
  const { user, setUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const [region, setRegion] = useState<Region>({
    latitude: 59.3293, // Default to Stockholm
    longitude: 18.0686,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  const handleAuthAction = () => {
    if (user) {
      // User is logged in, so log them out
      setUser(null);
    } else {
      // User is not logged in, navigate to login
      // Note: The navigation structure will automatically show the Auth tab
      setUser(null); // This will trigger the navigation to show Auth tab
    }
  };

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch real events from Firebase
      const fetchedEvents = await eventsService.getAllEvents();
      console.log('Fetched events:', fetchedEvents);

      setEvents(fetchedEvents);

      // Calculate region to show all events
      if (fetchedEvents.length > 0) {
        const validEvents = fetchedEvents.filter(
          (e) => e.coordinates && e.coordinates.lat && e.coordinates.lng
        );

        if (validEvents.length > 0) {
          const lats = validEvents.map((e) => e.coordinates.lat);
          const lngs = validEvents.map((e) => e.coordinates.lng);

          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);

          const centerLat = (minLat + maxLat) / 2;
          const centerLng = (minLng + maxLng) / 2;
          const latDelta = (maxLat - minLat) * 1.5 || 0.1; // Add padding, or use default
          const lngDelta = (maxLng - minLng) * 1.5 || 0.1;

          setRegion({
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: Math.max(latDelta, 0.05), // Minimum zoom level
            longitudeDelta: Math.max(lngDelta, 0.05),
          });
        }
      }
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload events whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('BrowseEventsScreen focused, reloading events...');
      loadEvents();
    }, [loadEvents])
  );

  const handleEventPress = (event: Event) => {
    navigation.navigate('EventDetails', { eventId: event.id });
  };

  if (loading) {
    return <Loading message="Laddar evenemang..." fullScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Bläddra evenemang</Text>
            <Text style={styles.subtitle}>{events.length} evenemang nära dig</Text>
          </View>
          <TouchableOpacity style={styles.authButton} onPress={handleAuthAction}>
            <Text style={styles.authText}>{user ? 'Logga ut' : 'Logga in'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
              Lista
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'list' ? (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard event={item} onPress={handleEventPress} />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Inga evenemang hittades</Text>
            </View>
          }
        />
      ) : (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          showsUserLocation={true}
        >
          {events.map((event) => {
            // Skip events without valid coordinates
            if (!event.coordinates || !event.coordinates.lat || !event.coordinates.lng) {
              console.warn(`Event ${event.id} missing coordinates`);
              return null;
            }

            return (
              <Marker
                key={event.id}
                coordinate={{
                  latitude: event.coordinates.lat,
                  longitude: event.coordinates.lng
                }}
                pinColor={event.status === EventStatus.ACTIVE ? theme.colors.success : theme.colors.secondary}
                onPress={() => handleEventPress(event)}
                title={event.name}
                description={`${event.participants} sellers • ${event.area}`}
              />
            );
          })}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    marginBottom: theme.spacing.md,
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
  authButton: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  authText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textLight,
  },
  toggleTextActive: {
    color: theme.colors.white,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
  },
  map: {
    flex: 1,
  },
});
