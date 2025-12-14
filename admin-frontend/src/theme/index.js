import { createTheme, alpha } from '@mui/material/styles';

const palette = {
  primary: '#0A1F35',
  secondary: '#DA6F2B',
  darkPrimary: '#030929',
};

const lightPalette = {
  mode: 'light',
  primary: {
    main: palette.primary,
    light: alpha(palette.primary, 0.7),
    dark: palette.darkPrimary,
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: palette.secondary,
    light: alpha(palette.secondary, 0.7),
    dark: '#B85A1F',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#F5F6F7',
    paper: '#FFFFFF',
  },
  surface: {
    main: '#FFFFFF',
    variant: '#F5F6F7',
  },
  text: {
    primary: '#1C1B1F',
    secondary: '#49454F',
    disabled: '#1C1B1F61',
  },
  divider: '#CAC4D0',
  error: {
    main: '#B3261E',
    light: '#F2B8B5',
    container: '#F9DEDC',
  },
  warning: {
    main: '#7D5700',
    container: '#FFDDB3',
  },
  success: {
    main: '#1B6B2A',
    container: '#B7F1C4',
  },
  info: {
    main: '#0061A4',
    container: '#D1E4FF',
  },
};

const darkPalette = {
  mode: 'dark',
  primary: {
    main: '#A8C8FF',
    light: '#D1E4FF',
    dark: '#003063',
    contrastText: '#003063',
  },
  secondary: {
    main: '#FFB68B',
    light: '#FFDCC8',
    dark: '#7A3300',
    contrastText: '#4E2600',
  },
  background: {
    default: '#1C1B1F',
    paper: '#2B2930',
  },
  surface: {
    main: '#2B2930',
    variant: '#49454F',
  },
  text: {
    primary: '#E6E1E5',
    secondary: '#CAC4D0',
    disabled: '#E6E1E561',
  },
  divider: '#49454F',
  error: {
    main: '#F2B8B5',
    light: '#F9DEDC',
    container: '#8C1D18',
  },
  warning: {
    main: '#FFDDB3',
    container: '#4A3800',
  },
  success: {
    main: '#B7F1C4',
    container: '#0E4918',
  },
  info: {
    main: '#D1E4FF',
    container: '#004A77',
  },
};

const getDesignTokens = (mode) => ({
  palette: mode === 'light' ? lightPalette : darkPalette,
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.4,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24)',
    '0px 3px 6px rgba(0, 0, 0, 0.16), 0px 3px 6px rgba(0, 0, 0, 0.23)',
    '0px 10px 20px rgba(0, 0, 0, 0.19), 0px 6px 6px rgba(0, 0, 0, 0.23)',
    '0px 14px 28px rgba(0, 0, 0, 0.25), 0px 10px 10px rgba(0, 0, 0, 0.22)',
    '0px 19px 38px rgba(0, 0, 0, 0.30), 0px 15px 12px rgba(0, 0, 0, 0.22)',
    ...Array(19).fill('0px 19px 38px rgba(0, 0, 0, 0.30), 0px 15px 12px rgba(0, 0, 0, 0.22)'),
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.16)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 28,
          boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.19), 0px 6px 6px rgba(0, 0, 0, 0.23)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)',
        },
      },
    },
  },
});

export const createAppTheme = (mode) => createTheme(getDesignTokens(mode));

export default createAppTheme;
