import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebase.config';
import { Item, CreateItemInput } from '../../types';

const ITEMS_COLLECTION = 'items';

export interface UpdateItemInput {
  title?: string;
  description?: string;
  imageUrl?: string;
  suggestedPrice?: number;
  category?: string;
}

/**
 * Create a new item for sale
 */
export async function createItem(
  participantId: string,
  eventId: string,
  input: CreateItemInput
): Promise<Item> {
  try {
    const itemData = {
      participantId,
      eventId,
      title: input.title,
      description: input.description,
      imageUrl: input.imageUrl,
      category: input.category,
      suggestedPrice: 0, // Default to 0, can be updated later
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, ITEMS_COLLECTION), itemData);

    return {
      id: docRef.id,
      participantId,
      eventId,
      title: input.title,
      description: input.description,
      imageUrl: input.imageUrl,
      category: input.category,
      suggestedPrice: 0,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Error creating item:', error);
    throw new Error('Failed to create item');
  }
}

/**
 * Upload item image to Firebase Storage
 */
export async function uploadItemImage(
  itemId: string,
  imageUri: string
): Promise<string> {
  try {
    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Create storage reference
    const storageRef = ref(storage, `items/${itemId}/${Date.now()}.jpg`);

    // Upload image
    await uploadBytes(storageRef, blob);

    // Get download URL
    const downloadUrl = await getDownloadURL(storageRef);

    return downloadUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * Get a single item by ID
 */
export async function getItemById(itemId: string): Promise<Item | null> {
  try {
    const docRef = doc(db, ITEMS_COLLECTION, itemId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      participantId: data.participantId,
      eventId: data.eventId,
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
      suggestedPrice: data.suggestedPrice,
      category: data.category,
      createdAt: data.createdAt.toDate(),
    };
  } catch (error) {
    console.error('Error fetching item:', error);
    throw new Error('Failed to load item');
  }
}

/**
 * Get all items for a specific event
 */
export async function getEventItems(eventId: string): Promise<Item[]> {
  try {
    const q = query(
      collection(db, ITEMS_COLLECTION),
      where('eventId', '==', eventId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        participantId: data.participantId,
        eventId: data.eventId,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        suggestedPrice: data.suggestedPrice,
        category: data.category,
        createdAt: data.createdAt.toDate(),
      };
    });
  } catch (error) {
    console.error('Error fetching event items:', error);
    throw new Error('Failed to load items');
  }
}

/**
 * Get all items for a specific participant/seller
 */
export async function getParticipantItems(participantId: string): Promise<Item[]> {
  try {
    const q = query(
      collection(db, ITEMS_COLLECTION),
      where('participantId', '==', participantId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        participantId: data.participantId,
        eventId: data.eventId,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        suggestedPrice: data.suggestedPrice,
        category: data.category,
        createdAt: data.createdAt.toDate(),
      };
    });
  } catch (error) {
    console.error('Error fetching participant items:', error);
    throw new Error('Failed to load your items');
  }
}

/**
 * Update an existing item
 */
export async function updateItem(
  itemId: string,
  input: UpdateItemInput
): Promise<void> {
  try {
    const docRef = doc(db, ITEMS_COLLECTION, itemId);

    const updateData: any = {};

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.imageUrl !== undefined) {
      updateData.imageUrl = input.imageUrl;
    }
    if (input.suggestedPrice !== undefined) {
      updateData.suggestedPrice = input.suggestedPrice;
    }
    if (input.category !== undefined) {
      updateData.category = input.category;
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating item:', error);
    throw new Error('Failed to update item');
  }
}

/**
 * Delete an item
 */
export async function deleteItem(itemId: string): Promise<void> {
  try {
    const docRef = doc(db, ITEMS_COLLECTION, itemId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting item:', error);
    throw new Error('Failed to delete item');
  }
}

/**
 * Search items by title or category within an event
 */
export async function searchItemsInEvent(
  eventId: string,
  searchTerm: string
): Promise<Item[]> {
  try {
    const items = await getEventItems(eventId);

    const lowerSearchTerm = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerSearchTerm) ||
        (item.category && item.category.toLowerCase().includes(lowerSearchTerm))
    );
  } catch (error) {
    console.error('Error searching items:', error);
    throw new Error('Failed to search items');
  }
}

export const itemsService = {
  createItem,
  uploadItemImage,
  getItemById,
  getEventItems,
  getParticipantItems,
  updateItem,
  deleteItem,
  searchItemsInEvent,
};
