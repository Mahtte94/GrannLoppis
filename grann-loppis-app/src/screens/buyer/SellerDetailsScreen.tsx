import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { BuyerStackParamList, Participant } from '../../types';
import { participantsService } from '../../services/firebase/participants.service';
import { theme } from '../../styles/theme';

type SellerDetailsScreenRouteProp = RouteProp<BuyerStackParamList, 'SellerDetails'>;

export default function SellerDetailsScreen() {
  const route = useRoute<SellerDetailsScreenRouteProp>();
  const { participantId } = route.params;
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParticipant();
  }, [participantId]);

  const loadParticipant = async () => {
    try {
      setLoading(true);
      const data = await participantsService.getParticipantById(participantId);
      console.log('Loaded participant:', data);
      setParticipant(data);
    } catch (error) {
      console.error('Error loading participant:', error);
      Alert.alert('Fel', 'Kunde inte ladda säljarens information.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Laddar säljare...</Text>
      </View>
    );
  }

  if (!participant) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Säljare hittades inte</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{participant.displayName}</Text>
        <Text style={styles.address}>{participant.address}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Om säljaren</Text>
          <Text style={styles.description}>{participant.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kontaktinformation</Text>
          <Text style={styles.infoText}>Adress: {participant.address}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Föremål till salu</Text>
          <Text style={styles.placeholder}>
            Föremål kommer snart att listas här...
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  errorText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.error,
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
    marginBottom: theme.spacing.sm,
  },
  address: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
  },
  content: {
    padding: theme.spacing.xl,
  },
  section: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 22,
  },
  infoText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 22,
  },
  placeholder: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
