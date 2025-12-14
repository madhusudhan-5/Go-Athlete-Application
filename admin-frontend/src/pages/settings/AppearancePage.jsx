import {
  Card,
  CardContent,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  Divider,
} from '@mui/material';
import {
  LightMode as LightIcon,
  DarkMode as DarkIcon,
  SettingsBrightness as SystemIcon,
} from '@mui/icons-material';
import { useTheme } from '../../context/ThemeContext';

export default function AppearancePage() {
  const { mode, isDark, toggleTheme, setTheme } = useTheme();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Appearance
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Theme Mode
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box
              onClick={() => setTheme('light')}
              sx={{
                p: 3,
                border: 2,
                borderColor: mode === 'light' ? 'primary.main' : 'divider',
                borderRadius: 2,
                cursor: 'pointer',
                textAlign: 'center',
                flex: 1,
                '&:hover': { borderColor: 'primary.light' },
              }}
            >
              <LightIcon sx={{ fontSize: 40, color: mode === 'light' ? 'primary.main' : 'text.secondary' }} />
              <Typography variant="body2" sx={{ mt: 1 }}>Light</Typography>
            </Box>
            <Box
              onClick={() => setTheme('dark')}
              sx={{
                p: 3,
                border: 2,
                borderColor: mode === 'dark' ? 'primary.main' : 'divider',
                borderRadius: 2,
                cursor: 'pointer',
                textAlign: 'center',
                flex: 1,
                '&:hover': { borderColor: 'primary.light' },
              }}
            >
              <DarkIcon sx={{ fontSize: 40, color: mode === 'dark' ? 'primary.main' : 'text.secondary' }} />
              <Typography variant="body2" sx={{ mt: 1 }}>Dark</Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={isDark}
                onChange={toggleTheme}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1">Dark Mode</Typography>
                <Typography variant="caption" color="text.secondary">
                  {isDark ? 'Dark theme is currently enabled' : 'Light theme is currently enabled'}
                </Typography>
              </Box>
            }
          />
        </Box>
      </CardContent>
    </Card>
  );
}
