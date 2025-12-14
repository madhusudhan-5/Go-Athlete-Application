import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getApiBaseUrl } from '../config/api';

const API_BASE = getApiBaseUrl();

export const fileUploadService = {
  requestCameraPermissions: async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      if (Platform.OS === 'web') {
        return { granted: false, message: 'Camera permission is required' };
      }
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return { granted: false };
    }
    return { granted: true };
  },

  requestMediaLibraryPermissions: async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      if (Platform.OS === 'web') {
        return { granted: false, message: 'Media library permission is required' };
      }
      Alert.alert('Permission Required', 'Media library permission is required to select photos');
      return { granted: false };
    }
    return { granted: true };
  },

  pickImage: async (options = {}) => {
    const permission = await fileUploadService.requestMediaLibraryPermissions();
    if (!permission.granted) {
      return { cancelled: true, error: permission.message };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect ?? [4, 3],
      quality: options.quality ?? 0.8,
      base64: options.includeBase64 ?? false,
    });

    if (result.canceled) {
      return { cancelled: true };
    }

    const asset = result.assets[0];
    return {
      cancelled: false,
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: asset.type || 'image',
      fileName: asset.fileName || `image_${Date.now()}.jpg`,
      fileSize: asset.fileSize,
      base64: asset.base64,
    };
  },

  takePhoto: async (options = {}) => {
    const permission = await fileUploadService.requestCameraPermissions();
    if (!permission.granted) {
      return { cancelled: true, error: permission.message };
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect ?? [4, 3],
      quality: options.quality ?? 0.8,
      base64: options.includeBase64 ?? false,
    });

    if (result.canceled) {
      return { cancelled: true };
    }

    const asset = result.assets[0];
    return {
      cancelled: false,
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: 'image',
      fileName: `photo_${Date.now()}.jpg`,
      fileSize: asset.fileSize,
      base64: asset.base64,
    };
  },

  pickDocument: async (options = {}) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: options.type ?? '*/*',
        copyToCacheDirectory: true,
        multiple: options.multiple ?? false,
      });

      if (result.canceled) {
        return { cancelled: true };
      }

      const asset = result.assets[0];
      return {
        cancelled: false,
        uri: asset.uri,
        name: asset.name,
        size: asset.size,
        mimeType: asset.mimeType,
      };
    } catch (error) {
      return { cancelled: true, error: error.message };
    }
  },

  pickPDF: async () => {
    return fileUploadService.pickDocument({
      type: 'application/pdf',
    });
  },

  pickVideo: async (options = {}) => {
    const permission = await fileUploadService.requestMediaLibraryPermissions();
    if (!permission.granted) {
      return { cancelled: true, error: permission.message };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: options.allowsEditing ?? false,
      quality: options.quality ?? 0.8,
    });

    if (result.canceled) {
      return { cancelled: true };
    }

    const asset = result.assets[0];
    return {
      cancelled: false,
      uri: asset.uri,
      duration: asset.duration,
      width: asset.width,
      height: asset.height,
      type: 'video',
      name: asset.fileName || `video_${Date.now()}.mp4`,
      fileSize: asset.fileSize,
    };
  },

  pickMultipleImages: async (options = {}) => {
    const permission = await fileUploadService.requestMediaLibraryPermissions();
    if (!permission.granted) {
      return { cancelled: true, error: permission.message };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: options.limit ?? 10,
      quality: options.quality ?? 0.8,
    });

    if (result.canceled) {
      return { cancelled: true };
    }

    const images = result.assets.map((asset, index) => ({
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: 'image',
      fileName: asset.fileName || `image_${Date.now()}_${index}.jpg`,
      fileSize: asset.fileSize,
    }));

    return { cancelled: false, images };
  },

  uploadFile: async (uri, endpoint, fieldName = 'file', additionalData = {}) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      const formData = new FormData();
      
      const uriParts = uri.split('.');
      const fileExtension = uriParts[uriParts.length - 1];
      const fileName = `upload_${Date.now()}.${fileExtension}`;
      
      let mimeType = 'application/octet-stream';
      if (['jpg', 'jpeg'].includes(fileExtension.toLowerCase())) {
        mimeType = 'image/jpeg';
      } else if (fileExtension.toLowerCase() === 'png') {
        mimeType = 'image/png';
      } else if (fileExtension.toLowerCase() === 'pdf') {
        mimeType = 'application/pdf';
      } else if (fileExtension.toLowerCase() === 'gif') {
        mimeType = 'image/gif';
      }

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append(fieldName, blob, fileName);
      } else {
        formData.append(fieldName, {
          uri,
          name: fileName,
          type: mimeType,
        });
      }

      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  getFileInfo: async (uri) => {
    if (Platform.OS === 'web') {
      return { exists: true };
    }
    
    try {
      const info = await FileSystem.getInfoAsync(uri);
      return info;
    } catch (error) {
      return { exists: false, error: error.message };
    }
  },

  deleteLocalFile: async (uri) => {
    if (Platform.OS === 'web') {
      return { success: true };
    }
    
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  resizeImage: async (uri, maxWidth = 1024, maxHeight = 1024) => {
    return { uri, resized: false };
  },
};

export default fileUploadService;
