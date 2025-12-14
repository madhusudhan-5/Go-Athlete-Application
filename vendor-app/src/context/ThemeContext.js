import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

const lightColors = {
  primary: '#0A1F35',
  primaryLight: '#1A3A5C',
  primaryDark: '#051018',
  secondary: '#F4A261',
  secondaryLight: '#F9C784',
  secondaryDark: '#E76F51',
  accent: '#E9C46A',
  accentLight: '#F4E285',
  onPrimary: '#FFFFFF',
  onSecondary: '#0A1F35',
  onAccent: '#0A1F35',
  surface: '#FFFFFF',
  surfaceVariant: '#F8F9FA',
  surfaceContainer: '#FFFFFF',
  surfaceContainerLow: '#F8F9FA',
  surfaceContainerHigh: '#F1F3F5',
  background: '#F5F7FA',
  onSurface: '#0A1F35',
  onSurfaceVariant: '#4A5568',
  outline: '#95A5A6',
  outlineVariant: '#E2E8F0',
  error: '#D32F2F',
  onError: '#FFFFFF',
  success: '#2E7D32',
  successLight: '#81C784',
  warning: '#F4A261',
  warningLight: '#FFCC80',
  info: '#1976D2',
  inverseSurface: '#1A2A3A',
  inverseOnSurface: '#F5F7FA',
  inversePrimary: '#90CAF9',
  scrim: '#000000',
  shadow: '#000000',
  card: '#FFFFFF',
  cardHighlight: '#FEF9E7',
  cardSuccess: '#E8F5E9',
  cardWarning: '#FFF8E1',
  cardAccent: '#FCF3CF',
  divider: '#E2E8F0',
  overlay: 'rgba(0, 0, 0, 0.5)',
  tabBar: '#0A1F35',
  statusBar: 'light',
};

const darkColors = {
  primary: '#90CAF9',
  primaryLight: '#BBDEFB',
  primaryDark: '#64B5F6',
  secondary: '#F9C784',
  secondaryLight: '#FBDA9F',
  secondaryDark: '#F4A261',
  accent: '#F4E285',
  accentLight: '#F9EDA8',
  onPrimary: '#0A1F35',
  onSecondary: '#0A1F35',
  onAccent: '#0A1F35',
  surface: '#1A2535',
  surfaceVariant: '#243447',
  surfaceContainer: '#1A2535',
  surfaceContainerLow: '#141C28',
  surfaceContainerHigh: '#2D3E52',
  background: '#0F1620',
  onSurface: '#E8EEF5',
  onSurfaceVariant: '#A8B8C8',
  outline: '#5A7A8F',
  outlineVariant: '#2D3E52',
  error: '#FF8A80',
  onError: '#690005',
  success: '#81C784',
  successLight: '#A5D6A7',
  warning: '#F9C784',
  warningLight: '#FFCC80',
  info: '#64B5F6',
  inverseSurface: '#E8EEF5',
  inverseOnSurface: '#1A2535',
  inversePrimary: '#0A1F35',
  scrim: '#000000',
  shadow: '#000000',
  card: '#1E2A3A',
  cardHighlight: '#2D3E52',
  cardSuccess: '#1E3A2A',
  cardWarning: '#3A3020',
  cardAccent: '#3A3520',
  divider: '#2D3E52',
  overlay: 'rgba(0, 0, 0, 0.7)',
  tabBar: '#1A2535',
  statusBar: 'light',
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState('system');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_mode');
      if (savedTheme) {
        setThemeModeState(savedTheme);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode) => {
    try {
      await AsyncStorage.setItem('theme_mode', mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    const newMode = themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'system' : 'light';
    await setThemeMode(newMode);
  };

  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;

  const theme = {
    dark: isDark,
    colors,
    themeMode,
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      colors,
      isDark,
      themeMode,
      setThemeMode,
      toggleTheme,
      isLoading,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { lightColors, darkColors };
