import { Alert } from 'react-native';
import * as Network from 'expo-network';
import { router } from 'expo-router';

interface ErrorResponse {
  response?: {
    status?: number;
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
      code?: string;
    };
  };
  message?: string;
  code?: string;
}

export class ApiError extends Error {
  status?: number;
  code?: string;
  errors?: Record<string, string[]>;

  constructor(error: ErrorResponse) {
    super(error.message);
    this.status = error.response?.status;
    this.code = error.response?.data?.code || error.code;
    this.errors = error.response?.data?.errors;
  }
}

export const useErrorHandler = () => {
  const checkNetworkConnection = async () => {
    const networkState = await Network.getNetworkStateAsync();
    return networkState.isConnected && networkState.isInternetReachable;
  };

  const handleAuthError = (error: ApiError) => {
    if (error.status === 401) {
      Alert.alert(
        'Session Expired',
        'Please log in again to continue.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/login'),
          },
        ]
      );
      return true;
    }
    return false;
  };

  const handleNetworkError = async () => {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again.',
        [
          {
            text: 'Retry',
            onPress: () => checkNetworkConnection(),
          },
        ]
      );
      return true;
    }
    return false;
  };

  const handleValidationErrors = (error: ApiError) => {
    if (error.errors) {
      const errorMessages = Object.entries(error.errors)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('\n');
      
      Alert.alert('Validation Error', errorMessages);
      return true;
    }
    return false;
  };

  const handleApiError = async (error: any, customHandler?: (error: ApiError) => boolean) => {
    const apiError = new ApiError(error);

    // Check network connection first
    if (await handleNetworkError()) return;

    // Try custom handler if provided
    if (customHandler && customHandler(apiError)) return;

    // Handle authentication errors
    if (handleAuthError(apiError)) return;

    // Handle validation errors
    if (handleValidationErrors(apiError)) return;

    // Handle specific error codes
    switch (apiError.code) {
      case 'RATE_LIMIT_EXCEEDED':
        Alert.alert(
          'Too Many Attempts',
          'Please wait a few minutes before trying again.'
        );
        break;

      case 'MAINTENANCE_MODE':
        Alert.alert(
          'Maintenance in Progress',
          'Our service is currently undergoing maintenance. Please try again later.'
        );
        break;

      case 'VERSION_DEPRECATED':
        Alert.alert(
          'Update Required',
          'Please update your app to the latest version to continue.'
        );
        break;

      default:
        // Generic error message for unhandled cases
        Alert.alert(
          'Error',
          apiError.message || 'An unexpected error occurred. Please try again.'
        );
    }
  };

  return {
    handleApiError,
    checkNetworkConnection,
  };
};