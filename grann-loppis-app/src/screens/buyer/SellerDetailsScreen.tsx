import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { BuyerStackParamList } from '../../types';
import { theme } from '../../styles/theme';

type SellerDetailsScreenRouteProp = RouteProp<BuyerStackParamList, 'SellerDetails'>;

export default function SellerDetailsScreen() {
  const route = useRoute<SellerDetailsScreenRouteProp>();
  const { participantId } = route.params;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Seller Details</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Participant ID:</Text>
        <Text style={styles.value}>{participantId}</Text>

        <Text style={styles.placeholder}>
          Full seller details and items list coming soon...
        </Text>
      </View>
    </ScrollView>
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
  },
  content: {
    padding: theme.spacing.xl,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  value: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  placeholder: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});
