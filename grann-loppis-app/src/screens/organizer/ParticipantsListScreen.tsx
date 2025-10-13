import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { OrganizerStackParamList, Participant } from '../../types';
import { ParticipantCard } from '../../components/ParticipantCard';
import { Loading } from '../../components/common/Loading';
import { theme } from '../../styles/theme';
import { participantsService } from '../../services/firebase/participants.service';

type ParticipantsListScreenRouteProp = RouteProp<OrganizerStackParamList, 'ParticipantsList'>;

export default function ParticipantsListScreen() {
  const route = useRoute<ParticipantsListScreenRouteProp>();
  const { eventId } = route.params;
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParticipants();
  }, [eventId]);

  const loadParticipants = async () => {
    try {
      setLoading(true);

      // Fetch real participants from Firebase
      const fetchedParticipants = await participantsService.getEventParticipants(eventId);
      setParticipants(fetchedParticipants);

    } catch (error) {
      console.error('Error loading participants:', error);
      Alert.alert('Fel', 'Kunde inte ladda deltagare. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  const handleParticipantPress = (participant: Participant) => {
    // Navigate to participant details or seller profile
    console.log('Participant pressed:', participant.id);
  };

  if (loading) {
    return <Loading message="Laddar deltagare..." fullScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Deltagare</Text>
        <Text style={styles.subtitle}>
          {participants.length} {participants.length === 1 ? 'säljare' : 'säljare'} anslutna
        </Text>
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
            <Text style={styles.emptyTitle}>Inga säljare ännu</Text>
            <Text style={styles.emptyText}>
              Dela din evenemangskod med säljare så att de kan ansluta sig
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
