import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Participant } from '../../types';
import { ParticipantCard } from '../../components/ParticipantCard';
import { Loading } from '../../components/common/Loading';
import { theme } from '../../styles/theme';

export default function ParticipantsListScreen() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    try {
      setLoading(true);

      // Mock participants data - in production, fetch from Firebase
      const mockParticipants: Participant[] = [
        {
          id: 'participant-1',
          eventId: 'event-1',
          userId: 'user-1',
          address: 'Sveavägen 123, Stockholm',
          coordinates: { lat: 59.3326, lng: 18.0649 },
          displayName: "Anna's Vintage Shop",
          description: 'Vintage furniture and home decor',
          joinedAt: new Date('2025-04-01'),
        },
        {
          id: 'participant-2',
          eventId: 'event-1',
          userId: 'user-2',
          address: 'Drottninggatan 45, Stockholm',
          coordinates: { lat: 59.3311, lng: 18.0686 },
          displayName: "Erik's Books & More",
          description: 'Books, games, and electronics',
          joinedAt: new Date('2025-04-05'),
        },
        {
          id: 'participant-3',
          eventId: 'event-1',
          userId: 'user-3',
          address: 'Kungsgatan 78, Stockholm',
          coordinates: { lat: 59.3345, lng: 18.0632 },
          displayName: "Maria's Kids Corner",
          description: 'Children clothes, toys, and books',
          joinedAt: new Date('2025-04-10'),
        },
        {
          id: 'participant-4',
          eventId: 'event-1',
          userId: 'user-4',
          address: 'Birger Jarlsgatan 22, Stockholm',
          coordinates: { lat: 59.3365, lng: 18.0725 },
          displayName: "Johan's Tech Hub",
          description: 'Electronics, gadgets, and accessories',
          joinedAt: new Date('2025-04-12'),
        },
      ];

      setParticipants(mockParticipants);
    } catch (error) {
      console.error('Error loading participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleParticipantPress = (participant: Participant) => {
    // Navigate to participant details or seller profile
    console.log('Participant pressed:', participant.id);
  };

  if (loading) {
    return <Loading message="Loading participants..." fullScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Event Participants</Text>
        <Text style={styles.subtitle}>{participants.length} sellers registered</Text>
      </View>

      <FlatList
        data={participants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ParticipantCard
            participant={item}
            onPress={handleParticipantPress}
            showItemCount={true}
            itemCount={Math.floor(Math.random() * 10) + 1}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No participants yet</Text>
            <Text style={styles.emptyText}>
              Share your event code with sellers so they can join
            </Text>
          </View>
        }
      />
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
  listContent: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
});
