import React from 'react';
import { Marker } from 'react-native-maps';
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
    />
  );
}
