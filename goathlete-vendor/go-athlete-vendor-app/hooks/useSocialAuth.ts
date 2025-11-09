import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { AppleAuthenticationScope, signInAsync } from 'expo-apple-authentication';
import { Alert } from 'react-native';
import { useApi } from '../services/api.ts';
import { useAuth } from './useAuth.tsx';

// Initialize Google Sign-In
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID', // Get this from Google Cloud Console
  iosClientId: 'YOUR_IOS_CLIENT_ID', // Get this from Google Cloud Console
});

export const useSocialAuth = () => {
  const { api } = useApi();
  const { login } = useAuth();

  const handleSocialAuthResponse = async (
    socialType: 'google' | 'apple',
    socialToken: string
  ) => {
    try {
      const response = await api.post('/auth/social-login/', {
        provider: socialType,
        token: socialToken,
      });

      if (response.data.token) {
        await login(response.data.token);
        return true;
      }
      return false;
    } catch (error: any) {
      Alert.alert(
        'Authentication Failed',
        error.response?.data?.message || 'Please try again later'
      );
      return false;
    }
  };

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
  const signInResult: any = await GoogleSignin.signIn();
  const idToken = signInResult?.idToken || signInResult?.id_token;
  return await handleSocialAuthResponse('google', idToken);
    } catch (error: any) {
      if (error.code === 'SIGN_IN_CANCELLED') {
        // User cancelled the login flow
        return false;
      }
      Alert.alert(
        'Google Sign-In Error',
        'An error occurred while signing in with Google'
      );
      return false;
    }
  };

  const signInWithApple = async () => {
    try {
      const credential = await signInAsync({
        requestedScopes: [
          AppleAuthenticationScope.FULL_NAME,
          AppleAuthenticationScope.EMAIL,
        ],
      });

      // Get Firebase credential
      const { identityToken } = credential;
      if (identityToken) {
        return await handleSocialAuthResponse('apple', identityToken);
      }
      return false;
    } catch (error: any) {
      if (error.code === 'ERR_CANCELED') {
        // User cancelled the login flow
        return false;
      }
      Alert.alert(
        'Apple Sign-In Error',
        'An error occurred while signing in with Apple'
      );
      return false;
    }
  };

  const signOut = async () => {
    try {
      const google: any = GoogleSignin as any;
      const isSignedInWithGoogle = typeof google.isSignedIn === 'function' ? await google.isSignedIn() : false;
      if (isSignedInWithGoogle) {
        await google.signOut();
      }
  await (auth as any).signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    signInWithGoogle,
    signInWithApple,
    signOut,
  };
};