import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SellerStackParamList } from '../../types';
import { itemsService } from '../../services/firebase/items.service';
import { participantsService } from '../../services/firebase/participants.service';
import { theme } from '../../styles/theme';

type AddItemScreenRouteProp = RouteProp<SellerStackParamList, 'AddItem'>;
type AddItemScreenNavigationProp = StackNavigationProp<SellerStackParamList, 'AddItem'>;

export default function AddItemScreen() {
  const route = useRoute<AddItemScreenRouteProp>();
  const navigation = useNavigation<AddItemScreenNavigationProp>();
  const { participantId } = route.params;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    if (imageUris.length >= 5) {
      Alert.alert('Max bilder', 'Du kan ladda upp max 5 bilder per vara.');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Behörighet krävs', 'Du behöver ge tillgång till dina bilder.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUris([...imageUris, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImageUris(imageUris.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Titel saknas', 'Ange en titel för varan.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Beskrivning saknas', 'Ange en beskrivning för varan.');
      return;
    }

    try {
      setLoading(true);

      const participant = await participantsService.getParticipantById(participantId);
      if (!participant) {
        throw new Error('Participant not found');
      }

      const item = await itemsService.createItem(participantId, participant.eventId, {
        title: title.trim(),
        description: description.trim(),
        category: category.trim() || undefined,
        imageUrls: [],
      });

      if (imageUris.length > 0) {
        const uploadedUrls = await itemsService.uploadItemImages(item.id, imageUris);
        await itemsService.updateItem(item.id, { imageUrls: uploadedUrls });
      }

      Alert.alert('Lyckades!', 'Varan har lagts till.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating item:', error);
      const errorMessage = error?.message || 'Kunde inte lägga till varan. Försök igen.';
      Alert.alert('Fel', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Lägg till vara</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Titel *</Text>
        <TextInput
          style={styles.input}
          placeholder="T.ex. Vintage lampa"
          placeholderTextColor={theme.colors.textLight}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Beskrivning *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Beskriv varan..."
          placeholderTextColor={theme.colors.textLight}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Kategori</Text>
        <TextInput
          style={styles.input}
          placeholder="T.ex. Möbler, Kläder, Leksaker"
          placeholderTextColor={theme.colors.textLight}
          value={category}
          onChangeText={setCategory}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Bilder ({imageUris.length}/5)</Text>
        <View style={styles.imageGrid}>
          {imageUris.map((uri, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <MaterialIcons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          {imageUris.length < 5 && (
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <MaterialIcons name="add-a-photo" size={32} color={theme.colors.primary} />
              <Text style={styles.addImageText}>Lägg till bild</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Lägg till vara</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.xl,
    paddingTop: 100,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
  },
});
