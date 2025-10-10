import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { theme } from '../../styles/theme';

export default function AddItemScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [errors, setErrors] = useState({ title: '', description: '', price: '' });
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = { title: '', description: '', price: '' };
    let isValid = true;

    if (!title.trim()) {
      newErrors.title = 'Title is required';
      isValid = false;
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    }

    if (price && isNaN(Number(price))) {
      newErrors.price = 'Price must be a number';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handlePickImage = async () => {
    try {
      // TODO: Implement image picker with expo-image-picker
      // const result = await ImagePicker.launchImageLibraryAsync({
      //   mediaTypes: ImagePicker.MediaTypeOptions.Images,
      //   allowsEditing: true,
      //   aspect: [4, 3],
      //   quality: 0.8,
      // });
      // if (!result.canceled) {
      //   setImageUri(result.assets[0].uri);
      // }

      Alert.alert('Coming soon', 'Image picker will be implemented soon');
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleTakePhoto = async () => {
    try {
      // TODO: Implement camera with expo-camera
      // const result = await ImagePicker.launchCameraAsync({
      //   allowsEditing: true,
      //   aspect: [4, 3],
      //   quality: 0.8,
      // });
      // if (!result.canceled) {
      //   setImageUri(result.assets[0].uri);
      // }

      Alert.alert('Coming soon', 'Camera will be implemented soon');
    } catch (err) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleAddItem = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // TODO: Implement actual item creation logic with Firebase
      // const itemData = {
      //   title,
      //   description,
      //   suggestedPrice: price ? Number(price) : undefined,
      //   category: category || undefined,
      //   imageUrl: imageUri || undefined,
      // };
      // await itemsService.createItem(itemData);

      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        'Success!',
        'Your item has been added.',
        [{ text: 'OK', onPress: () => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        }}]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to add item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.title}>Lägg till föremål</Text>
          <Text style={styles.subtitle}>
            Lägg till ett föremål du vill sälja på loppisen
          </Text>

          <View style={styles.form}>
            {imageUri ? (
              <TouchableOpacity onPress={handlePickImage} style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.image} />
                <Text style={styles.changeImageText}>Tryck för att ändra bild</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>Ingen bild vald</Text>
                <View style={styles.imageButtons}>
                  <Button
                    title="Välj bild"
                    onPress={handlePickImage}
                    variant="outline"
                    style={styles.imageButton}
                  />
                  <Button
                    title="Ta foto"
                    onPress={handleTakePhoto}
                    variant="outline"
                    style={styles.imageButton}
                  />
                </View>
              </View>
            )}

            <Input
              label="Titel"
              placeholder="T.ex. Vintage stol"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                setErrors({ ...errors, title: '' });
              }}
              error={errors.title}
            />

            <Input
              label="Beskrivning"
              placeholder="Beskriv föremålet..."
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                setErrors({ ...errors, description: '' });
              }}
              error={errors.description}
              multiline
              numberOfLines={4}
            />

            <Input
              label="Pris (kr) - Valfritt"
              placeholder="T.ex. 150"
              value={price}
              onChangeText={(text) => {
                setPrice(text);
                setErrors({ ...errors, price: '' });
              }}
              error={errors.price}
              keyboardType="numeric"
            />

            <Input
              label="Kategori - Valfritt"
              placeholder="T.ex. Möbler, Kläder, Leksaker"
              value={category}
              onChangeText={setCategory}
            />

            <Button
              title="Lägg till föremål"
              onPress={handleAddItem}
              loading={loading}
              disabled={loading}
              style={styles.addButton}
            />

            <Button
              title="Avbryt"
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                }
              }}
              variant="outline"
              disabled={loading}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  imageContainer: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background,
  },
  changeImageText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
  },
  imagePlaceholder: {
    height: 200,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  imagePlaceholderText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  imageButton: {
    minWidth: 120,
  },
  addButton: {
    marginBottom: theme.spacing.md,
  },
});
