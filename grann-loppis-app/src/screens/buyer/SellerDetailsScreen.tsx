import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { BuyerStackParamList, Participant } from '../../types';
import { participantsService } from '../../services/firebase/participants.service';
import { theme } from '../../styles/theme';
import { useAnimatedHeader } from '../../hooks/useAnimatedHeader';

type SellerDetailsScreenRouteProp = RouteProp<BuyerStackParamList, 'SellerDetails'>;

export default function SellerDetailsScreen() {
  const route = useRoute<SellerDetailsScreenRouteProp>();
  const { participantId } = route.params;
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);

  const { handleScroll } = useAnimatedHeader({
    startFadeAt: 20,
    endFadeAt: 100,
    backgroundColor: theme.colors.surface,
  });

  useEffect(() => {
    loadParticipant();
  }, [participantId]);

  const loadParticipant = async () => {
    try {
      setLoading(true);
      const data = await participantsService.getParticipantById(participantId);
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
    <ScrollView
      style={styles.container}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{participant.displayName}</Text>
        <Text style={styles.address}>{participant.address}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Om säljaren</Text>
          <Text style={styles.description}>{participant.description}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.xxl
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
    backgroundColor: theme.colors.surfaceLightest,
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
