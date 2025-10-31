import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { theme } from '../../styles/theme';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface LocationResult {
  description: string;
  placeId: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface LocationSearchBarProps {
  onLocationSelect: (location: LocationResult) => void;
  placeholder?: string;
}

export const LocationSearchBar: React.FC<LocationSearchBarProps> = ({
  onLocationSelect,
  placeholder = 'Sök plats...',
}) => {
  const [searchText, setSearchText] = useState('');
  const [predictions, setPredictions] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const searchPlaces = async (text: string) => {
    if (!text.trim()) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    try {
      setIsLoading(true);

      // Use Google Places Autocomplete API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          text
        )}&key=${GOOGLE_MAPS_API_KEY}&components=country:se&language=sv`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.predictions) {
        const results: LocationResult[] = data.predictions.map((prediction: any) => ({
          description: prediction.description.replace(/, Sverige$/, ''),
          placeId: prediction.place_id,
        }));
        setPredictions(results);
        setShowPredictions(true);
      } else {
        setPredictions([]);
        setShowPredictions(false);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      setPredictions([]);
      setShowPredictions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextChange = (text: string) => {
    setSearchText(text);

    // Debounce search requests
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(text);
    }, 800); // Wait 800ms after user stops typing
  };

  const getPlaceDetails = async (placeId: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.result?.geometry?.location) {
        return {
          lat: data.result.geometry.location.lat,
          lng: data.result.geometry.location.lng,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  };

  const handleSelectLocation = async (location: LocationResult) => {
    // Remove ", Sverige" suffix from description
    const cleanDescription = location.description.replace(/, Sverige$/, '');
    setSearchText(cleanDescription);
    setShowPredictions(false);
    Keyboard.dismiss();

    // Get coordinates for the selected place
    const coordinates = await getPlaceDetails(location.placeId);

    if (coordinates) {
      onLocationSelect({
        ...location,
        description: cleanDescription,
        coordinates,
      });
    } else {
      // If we can't get coordinates, still pass the location
      // The map screen can handle this case
      onLocationSelect({
        ...location,
        description: cleanDescription,
      });
    }
  };

  const clearSearch = () => {
    setSearchText('');
    setPredictions([]);
    setShowPredictions(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
       
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textLight}
          value={searchText}
          onChangeText={handleTextChange}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowPredictions(true);
            }
          }}
        />
        {isLoading && <ActivityIndicator size="small" color={theme.colors.primary} />}
        {searchText.length > 0 && !isLoading && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {showPredictions && predictions.length > 0 && (
        <View style={styles.predictionsContainer}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          >
            {predictions.map((item) => (
              <TouchableOpacity
                key={item.placeId}
                style={styles.predictionItem}
                onPress={() => handleSelectLocation(item)}
              >
                <Text style={styles.predictionText}>{item.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
    width: '100%',
    alignSelf: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    shadowColor: '#000',
    width: '100%',
    maxWidth: 900,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: '#000000',
    paddingVertical: theme.spacing.xs,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  clearText: {
    fontSize: 18,
    color: theme.colors.textLight,
  },
  predictionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.xs,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    zIndex: 10000,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  predictionIcon: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  predictionText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: '#000000',
    fontWeight: '500',
  },
});
