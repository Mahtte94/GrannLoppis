import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Item } from '../../types';
import { ItemCard } from '../../components/ItemCard';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { theme } from '../../styles/theme';

export default function MyItemsScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);

      // Mock items data - in production, fetch from Firebase
      const mockItems: Item[] = [
        {
          id: 'item-1',
          participantId: 'participant-1',
          eventId: 'event-1',
          title: 'Vintage Oak Chair',
          description: 'Beautiful vintage oak dining chair in excellent condition. Perfect for your home.',
          imageUrl: 'https://via.placeholder.com/300',
          suggestedPrice: 250,
          category: 'Furniture',
          createdAt: new Date(),
        },
        {
          id: 'item-2',
          participantId: 'participant-1',
          eventId: 'event-1',
          title: 'Designer Lamp',
          description: 'Modern designer lamp with adjustable arm.',
          imageUrl: 'https://via.placeholder.com/300',
          suggestedPrice: 150,
          category: 'Lighting',
          createdAt: new Date(),
        },
        {
          id: 'item-3',
          participantId: 'participant-1',
          eventId: 'event-1',
          title: 'Book Collection',
          description: 'Set of 10 classic novels in good condition.',
          suggestedPrice: 100,
          category: 'Books',
          createdAt: new Date(),
        },
      ];

      setItems(mockItems);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemPress = (item: Item) => {
    // Navigate to item details or edit screen
    console.log('Item pressed:', item.id);
  };

  const handleAddItem = () => {
    navigation.navigate('AddItem' as never);
  };

  if (loading) {
    return <Loading message="Loading your items..." fullScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Items</Text>
        <Text style={styles.subtitle}>{items.length} items for sale</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItemCard item={item} onPress={handleItemPress} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No items yet</Text>
            <Text style={styles.emptyText}>
              Start adding items you want to sell at the event
            </Text>
            <Button
              title="Add Your First Item"
              onPress={handleAddItem}
              style={styles.emptyButton}
            />
          </View>
        }
      />

      {items.length > 0 && (
        <View style={styles.footer}>
          <Button
            title="Add New Item"
            onPress={handleAddItem}
          />
        </View>
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
    marginBottom: theme.spacing.xl,
  },
  emptyButton: {
    minWidth: 200,
  },
  footer: {
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
