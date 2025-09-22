import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Cross-platform secure storage utility
 * Uses SecureStore on mobile (iOS/Android) and AsyncStorage on web
 */
const storage = {
  /**
   * Store a key-value pair
   */
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
      throw error;
    }
  },

  /**
   * Retrieve a value by key
   */
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  },

  /**
   * Remove a key-value pair
   */
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  },

  /**
   * Get multiple items at once
   */
  getMultipleItems: async (keys: string[]): Promise<Record<string, string | null>> => {
    const result: Record<string, string | null> = {};
    
    try {
      if (Platform.OS === 'web') {
        const items = await AsyncStorage.multiGet(keys);
        items.forEach(([key, value]) => {
          result[key] = value;
        });
      } else {
        for (const key of keys) {
          result[key] = await SecureStore.getItemAsync(key);
        }
      }
    } catch (error) {
      console.error('Error retrieving multiple items:', error);
    }
    
    return result;
  },

  /**
   * Set multiple items at once
   */
  setMultipleItems: async (items: Array<[string, string]>): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.multiSet(items);
      } else {
        for (const [key, value] of items) {
          await SecureStore.setItemAsync(key, value);
        }
      }
    } catch (error) {
      console.error('Error storing multiple items:', error);
      throw error;
    }
  },

  /**
   * Clear all stored data
   */
  clear: async (): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.clear();
      } else {
        // For SecureStore, we need to remove items individually
        // This is a limitation of SecureStore - no clear all method
        console.warn('SecureStore does not support clearing all items. Remove items individually.');
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }
};

export default storage;