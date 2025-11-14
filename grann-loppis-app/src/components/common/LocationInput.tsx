import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Keyboard } from 'react-native';
import { theme } from '../../styles/theme';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface LocationInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onLocationSelect?: (location: { description: string; lat: number; lng: number }) => void;
  error?: string;
}

interface Prediction {
  place_id: string;
  description: string;
}

export function LocationInput({
  label,
  placeholder = 'Ange plats',
  value,
  onChangeText,
  onLocationSelect,
  error,
}: LocationInputProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const fetchPredictions = async () => {
      if (value.length < 2 || !isFocused) {
        setPredictions([]);
        setShowPredictions(false);
        return;
      }

      setLoading(true);
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(value)}&key=${GOOGLE_MAPS_API_KEY}&language=sv&components=country:se`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.predictions && Array.isArray(data.predictions)) {
          setPredictions(data.predictions);
          setShowPredictions(true);
        } else {
          setPredictions([]);
          setShowPredictions(false);
        }
      } catch (error) {
        console.error('Error fetching predictions:', error);
        setPredictions([]);
        setShowPredictions(false);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchPredictions, 300);
    return () => clearTimeout(timeoutId);
  }, [value, isFocused]);

  const closePredictions = () => {
    setShowPredictions(false);
    setPredictions([]);
    Keyboard.dismiss();
  };

  const handleSelectPrediction = async (prediction: Prediction) => {
    // Remove ", Sverige" suffix from description
    const cleanDescription = prediction.description.replace(/, Sverige$/, '');
    onChangeText(cleanDescription);
    closePredictions();

    // Fetch place details to get coordinates
    if (onLocationSelect) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&key=${GOOGLE_MAPS_API_KEY}&fields=geometry`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.result?.geometry?.location) {
          onLocationSelect({
            description: cleanDescription,
            lat: data.result.geometry.location.lat,
            lng: data.result.geometry.location.lng,
          });
        }
      } catch (error) {
        console.error('Error fetching place details:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.textInput, error ? styles.textInputError : null]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textLight}
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
          setShowPredictions(true);
        }}
        onFocus={() => {
          setIsFocused(true);
        }}
        onBlur={() => {
          // Delay closing to allow tap on prediction to register
          setTimeout(() => {
            setIsFocused(false);
            closePredictions();
          }, 150);
        }}
        autoCapitalize="words"
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      )}

      {showPredictions && predictions.length > 0 && (
        <View style={styles.predictionsContainer}>
          {predictions.map((item, index) => (
            <React.Fragment key={item.place_id}>
              <TouchableOpacity
                style={styles.predictionItem}
                onPress={() => handleSelectPrediction(item)}
              >
                <Text style={styles.predictionText}>{item.description.replace(/, Sverige$/, '')}</Text>
              </TouchableOpacity>
              {index < predictions.length - 1 && <View style={styles.separator} />}
            </React.Fragment>
          ))}
        </View>
      )}

      <Text style={styles.hintText}>
        Exempel: "Vasastan, Stockholm" eller "Göteborg"
      </Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    width: '100%',
    zIndex: 1,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  textInput: {
    height: 48,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  textInputError: {
    borderColor: theme.colors.error,
  },
  loadingContainer: {
    position: 'absolute',
    right: theme.spacing.md,
    top: 42,
  },
  predictionsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 4,
  },
  predictionItem: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  predictionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  hintText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
});
