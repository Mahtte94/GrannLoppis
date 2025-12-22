import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { SellerStackParamList, Item } from '../../types';
import { itemsService } from '../../services/firebase/items.service';
import { theme } from '../../styles/theme';

type MyItemsScreenRouteProp = RouteProp<SellerStackParamList, 'MyItems'>;
type MyItemsScreenNavigationProp = StackNavigationProp<SellerStackParamList, 'MyItems'>;

export default function MyItemsScreen() {
  const route = useRoute<MyItemsScreenRouteProp>();
  const navigation = useNavigation<MyItemsScreenNavigationProp>();
  const { participantId } = route.params;
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, [participantId]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await itemsService.getParticipantItems(participantId);
      setItems(data);
    } catch (error: any) {
      console.error('Error loading items:', error);
      const errorMessage = error?.message || 'Kunde inte ladda dina varor.';
      Alert.alert('Fel', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    Alert.alert(
      'Ta bort vara',
      'Är du säker på att du vill ta bort denna vara?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: async () => {
            try {
              await itemsService.deleteItem(itemId);
              loadItems();
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Fel', 'Kunde inte ta bort varan.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Item }) => (
    <View style={styles.itemCard}>
      {item.imageUrls.length > 0 && (
        <Image source={{ uri: item.imageUrls[0] }} style={styles.itemImage} />
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
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteItem(item.id)}
      >
        <MaterialIcons name="delete" size={24} color={theme.colors.error} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Laddar varor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="inventory-2"
              size={64}
              color={theme.colors.textLight}
            />
            <Text style={styles.emptyText}>Inga varor ännu</Text>
            <Text style={styles.emptySubtext}>
              Lägg till varor du vill sälja
            </Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddItem', { participantId })}
      >
        <MaterialIcons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.xxl,
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
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.md,
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
  deleteButton: {
    padding: theme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: theme.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
  },
  emptySubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    marginTop: theme.spacing.sm,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
