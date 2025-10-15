import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { OrganizerStackParamList, Participant, ParticipantStatus } from '../../types';
import { ParticipantCard } from '../../components/ParticipantCard';
import { Loading } from '../../components/common/Loading';
import { Button } from '../../components/common/Button';
import { theme } from '../../styles/theme';
import { participantsService } from '../../services/firebase/participants.service';
import { useAuth } from '../../context/AuthContext';

type ParticipantsListScreenRouteProp = RouteProp<OrganizerStackParamList, 'ParticipantsList'>;

type TabType = 'pending' | 'approved' | 'rejected';

export default function ParticipantsListScreen() {
  const route = useRoute<ParticipantsListScreenRouteProp>();
  const { eventId } = route.params;
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadParticipants();
  }, [eventId, activeTab]);

  const loadParticipants = async () => {
    try {
      setLoading(true);

      let statusFilter: ParticipantStatus;
      if (activeTab === 'pending') {
        statusFilter = ParticipantStatus.PENDING;
      } else if (activeTab === 'approved') {
        statusFilter = ParticipantStatus.APPROVED;
      } else {
        statusFilter = ParticipantStatus.REJECTED;
      }

      // Fetch participants filtered by status
      const fetchedParticipants = await participantsService.getEventParticipants(eventId, statusFilter);
      setParticipants(fetchedParticipants);

    } catch (error) {
      console.error('Error loading participants:', error);
      Alert.alert('Fel', 'Kunde inte ladda ansökningar. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (participant: Participant) => {
    if (!user) return;

    Alert.alert(
      'Godkänn ansökan',
      `Vill du godkänna ${participant.displayName}?\n\nAdress: ${participant.address}`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Godkänn',
          onPress: async () => {
            try {
              setActionLoading(participant.id);
              await participantsService.approveApplication(participant.id, user.id);
              Alert.alert('Godkänd!', `${participant.displayName} har godkänts och kan nu delta i evenemanget.`);
              loadParticipants();
            } catch (error) {
              console.error('Error approving application:', error);
              Alert.alert('Fel', 'Kunde inte godkänna ansökan. Försök igen.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (participant: Participant) => {
    if (!user) return;

    Alert.alert(
      'Avslå ansökan',
      `Vill du avslå ${participant.displayName}s ansökan?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Avslå',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(participant.id);
              await participantsService.rejectApplication(participant.id, user.id);
              Alert.alert('Avslagen', `${participant.displayName}s ansökan har avslagits.`);
              loadParticipants();
            } catch (error) {
              console.error('Error rejecting application:', error);
              Alert.alert('Fel', 'Kunde inte avslå ansökan. Försök igen.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleRemove = async (participant: Participant) => {
    if (!user) return;

    Alert.alert(
      'Ta bort säljare',
      `Är du säker på att du vill ta bort ${participant.displayName} från evenemanget?\n\nDetta går inte att ångra.`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(participant.id);
              await participantsService.removeParticipant(participant.id);
              Alert.alert('Borttagen', `${participant.displayName} har tagits bort från evenemanget.`);
              loadParticipants();
            } catch (error) {
              console.error('Error removing participant:', error);
              Alert.alert('Fel', 'Kunde inte ta bort säljare. Försök igen.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const renderApplicationCard = (participant: Participant) => {
    const isProcessing = actionLoading === participant.id;

    return (
      <View style={styles.applicationCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.participantName}>{participant.displayName}</Text>
          <Text style={styles.appliedDate}>
            Ansökt: {new Date(participant.appliedAt).toLocaleDateString('sv-SE')}
          </Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.infoLabel}>Adress:</Text>
          <Text style={styles.infoText}>{participant.address}</Text>

          {participant.phoneNumber && (
            <>
              <Text style={styles.infoLabel}>Telefon:</Text>
              <Text style={styles.infoText}>{participant.phoneNumber}</Text>
            </>
          )}

          {participant.description && (
            <>
              <Text style={styles.infoLabel}>Meddelande:</Text>
              <Text style={styles.infoText}>{participant.description}</Text>
            </>
          )}
        </View>

        {activeTab === 'pending' && (
          <View style={styles.actionButtons}>
            <Button
              title="Godkänn"
              onPress={() => handleApprove(participant)}
              disabled={isProcessing}
              loading={isProcessing}
              style={styles.approveButton}
            />
            <Button
              title="Avslå"
              onPress={() => handleReject(participant)}
              disabled={isProcessing}
              variant="outline"
              style={styles.rejectButton}
            />
          </View>
        )}

        {activeTab === 'approved' && (
          <View style={styles.approvedFooter}>
            {participant.joinedAt && (
              <Text style={styles.statusText}>
                Godkänd: {new Date(participant.joinedAt).toLocaleDateString('sv-SE')}
              </Text>
            )}
            <TouchableOpacity
              onPress={() => handleRemove(participant)}
              disabled={isProcessing}
              style={styles.removeButton}
            >
              <Text style={styles.removeButtonText}>Ta bort</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'rejected' && participant.reviewedAt && (
          <Text style={styles.statusTextRejected}>
            Avslagen: {new Date(participant.reviewedAt).toLocaleDateString('sv-SE')}
          </Text>
        )}
      </View>
    );
  };

  if (loading) {
    return <Loading message="Laddar ansökningar..." fullScreen />;
  }

  const getEmptyMessage = () => {
    if (activeTab === 'pending') return 'Inga väntande ansökningar';
    if (activeTab === 'approved') return 'Inga godkända säljare ännu';
    return 'Inga avslagna ansökningar';
  };

  const getEmptyDescription = () => {
    if (activeTab === 'pending') return 'Ansökningar från säljare kommer att visas här';
    if (activeTab === 'approved') return 'Godkända säljare kommer att visas här';
    return 'Avslagna ansökningar kommer att visas här';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ansökningar</Text>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
              Väntande
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'approved' && styles.activeTab]}
            onPress={() => setActiveTab('approved')}
          >
            <Text style={[styles.tabText, activeTab === 'approved' && styles.activeTabText]}>
              Godkända
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'rejected' && styles.activeTab]}
            onPress={() => setActiveTab('rejected')}
          >
            <Text style={[styles.tabText, activeTab === 'rejected' && styles.activeTabText]}>
              Avslagna
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={participants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderApplicationCard(item)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>{getEmptyMessage()}</Text>
            <Text style={styles.emptyText}>{getEmptyDescription()}</Text>
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
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textLight,
  },
  activeTabText: {
    color: theme.colors.white,
  },
  listContent: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  applicationCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    marginBottom: theme.spacing.sm,
  },
  participantName: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  appliedDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  cardContent: {
    marginBottom: theme.spacing.md,
  },
  infoLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  approveButton: {
    flex: 1,
  },
  rejectButton: {
    flex: 1,
  },
  statusText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
  },
  statusTextRejected: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    fontStyle: 'italic',
    marginTop: theme.spacing.sm,
  },
  approvedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  removeButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.error || '#ff4444',
  },
  removeButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.white,
    fontWeight: '600',
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
