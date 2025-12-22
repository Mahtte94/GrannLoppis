import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Image, FlatList } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { BuyerStackParamList, Participant, Item } from '../../types';
import { participantsService } from '../../services/firebase/participants.service';
import { itemsService } from '../../services/firebase/items.service';
import { theme } from '../../styles/theme';
import { useAnimatedHeader } from '../../hooks/useAnimatedHeader';

type SellerDetailsScreenRouteProp = RouteProp<BuyerStackParamList, 'SellerDetails'>;

export default function SellerDetailsScreen() {
  const route = useRoute<SellerDetailsScreenRouteProp>();
  const { participantId } = route.params;
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const { handleScroll } = useAnimatedHeader({
    startFadeAt: 20,
    endFadeAt: 100,
    backgroundColor: theme.colors.surface,
  });

  useEffect(() => {
    loadData();
  }, [participantId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [participantData, itemsData] = await Promise.all([
        participantsService.getParticipantById(participantId),
        itemsService.getParticipantItems(participantId),
      ]);
      setParticipant(participantData);
      setItems(itemsData);
    } catch (error) {
      console.error('Error loading data:', error);
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

  const renderItem = ({ item }: { item: Item }) => (
    <View style={styles.itemCard}>
      {item.imageUrls.length > 0 ? (
        <Image source={{ uri: item.imageUrls[0] }} style={styles.itemImage} />
      ) : (
        <View style={styles.itemImagePlaceholder}>
          <MaterialIcons name="image" size={40} color={theme.colors.textLight} />
        </View>
      )}
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.description}
        </Text>
        {item.category && (
          <Text style={styles.itemCategory}>{item.category}</Text>
        )}
      </View>
    </View>
  );

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Varor till salu ({items.length})</Text>
          {items.length > 0 ? (
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyItems}>
              <MaterialIcons
                name="inventory-2"
                size={48}
                color={theme.colors.textLight}
              />
              <Text style={styles.placeholder}>Inga varor ännu</Text>
            </View>
          )}
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
    marginTop: theme.spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.md,
  },
  itemImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  itemDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  itemCategory: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  emptyItems: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
});
