import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { Participant } from '../types';
import { theme } from '../styles/theme';

interface MapMarkerProps {
  participant: Participant;
  onPress?: (participant: Participant) => void;
}

export function MapMarker({ participant, onPress }: MapMarkerProps) {
  return (
    <Marker
      coordinate={{
        latitude: participant.coordinates.lat,
        longitude: participant.coordinates.lng,
      }}
      pinColor={theme.colors.primary}
      onPress={() => onPress?.(participant)}
    >
      <Callout>
        <View style={styles.calloutContainer}>
          <Text style={styles.calloutTitle}>{participant.displayName}</Text>
          <Text style={styles.calloutDescription} numberOfLines={2}>
            {participant.description}
          </Text>
          <Text style={styles.calloutAddress}>{participant.address}</Text>
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  calloutContainer: {
    width: 200,
    padding: theme.spacing.sm,
  },
  calloutTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  calloutDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  calloutAddress: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
    fontStyle: 'italic',
  },
});
