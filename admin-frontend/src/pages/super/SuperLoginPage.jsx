import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuperAuth } from '../../context/SuperAuthContext';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  AdminPanelSettings as SuperAdminIcon,
} from '@mui/icons-material';

export default function SuperLoginPage() {
  const { login, error } = useSuperAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('superadmin@sportsplatform.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setLoading(true);

    if (!email || !password) {
      setLocalError('Please enter both email and password');
      setLoading(false);
      return;
    }

    const success = await login(email, password);
    setLoading(false);

    if (success) {
      navigate('/super/dashboard');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 440, width: '100%', borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                bgcolor: 'warning.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <SuperAdminIcon sx={{ fontSize: 36, color: 'warning.dark' }} />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Super Admin Console
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Platform-wide control and management
            </Typography>
          </Box>

          {(error || localError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error || localError}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              autoComplete="email"
              autoFocus
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                bgcolor: 'warning.main',
                '&:hover': { bgcolor: 'warning.dark' },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </form>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mb={1}>
              Demo Credentials
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              <strong>Super Admin:</strong> superadmin@sportsplatform.com / SuperAdmin@123
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
