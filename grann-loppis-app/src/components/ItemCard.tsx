import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Item } from '../types';
import { Card } from './common/Card';
import { theme } from '../styles/theme';

interface ItemCardProps {
  item: Item;
  onPress?: (item: Item) => void;
  showParticipantInfo?: boolean;
}

export function ItemCard({ item, onPress, showParticipantInfo = false }: ItemCardProps) {
  const CardContent = (
    <View>
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

        {item.description && (
          <Text style={styles.description} numberOfLines={3}>
            {item.description}
          </Text>
        )}

        <View style={styles.footer}>
          {item.suggestedPrice && (
            <Text style={styles.price}>${item.suggestedPrice}</Text>
          )}

          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}
        </View>

        {showParticipantInfo && (
          <Text style={styles.participantInfo}>
            Seller ID: {item.participantId}
          </Text>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={() => onPress(item)}
        activeOpacity={0.7}
        style={styles.container}
      >
        <Card elevation="low">
          {CardContent}
        </Card>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Card elevation="low">
        {CardContent}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing.sm,
  },
  content: {
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  description: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  price: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  categoryBadge: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  categoryText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  participantInfo: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
  },
});
