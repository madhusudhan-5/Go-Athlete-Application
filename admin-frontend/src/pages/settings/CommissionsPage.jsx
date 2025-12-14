import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Slider,
  TextField,
  Grid,
  Button,
  Divider,
  Alert,
  Snackbar,
  Skeleton,
  Paper,
} from '@mui/material';
import {
  Sports as CourtIcon,
  School as CoachIcon,
  ShoppingCart as EcomIcon,
  CardMembership as MembershipIcon,
} from '@mui/icons-material';
import { commissionService } from '../../services/api';

const commissionFields = [
  { key: 'court_pct', label: 'Court Bookings', icon: <CourtIcon /> },
  { key: 'coach_pct', label: 'Coaching Sessions', icon: <CoachIcon /> },
  { key: 'ecommerce_pct', label: 'E-commerce Sales', icon: <EcomIcon /> },
  { key: 'membership_pct', label: 'Membership Sales', icon: <MembershipIcon /> },
];

export default function CommissionsPage() {
  const [config, setConfig] = useState({
    court_pct: 10,
    coach_pct: 15,
    ecommerce_pct: 12,
    membership_pct: 8,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await commissionService.getConfig();
      setConfig(response);
    } catch (err) {
      console.error('Failed to fetch commission config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    const numValue = Math.min(100, Math.max(0, Number(value)));
    setConfig((prev) => ({ ...prev, [key]: numValue }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await commissionService.updateConfig(config);
      setSnackbar({ open: true, message: 'Commission configuration saved', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save configuration', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const sampleAmount = 10000;

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="40%" height={40} />
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rectangular" height={80} sx={{ my: 2, borderRadius: 1 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Commission Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Set platform commission percentages for different transaction types
        </Typography>

        <Grid container spacing={3}>
          {commissionFields.map((field) => (
            <Grid item xs={12} key={field.key}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ color: 'primary.main' }}>{field.icon}</Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {field.label}
                  </Typography>
                  <Box sx={{ flex: 1 }} />
                  <TextField
                    type="number"
                    value={config[field.key]}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    size="small"
                    sx={{ width: 80 }}
                    InputProps={{
                      endAdornment: <Typography variant="caption">%</Typography>,
                    }}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Box>
                <Slider
                  value={config[field.key]}
                  onChange={(e, val) => handleChange(field.key, val)}
                  min={0}
                  max={100}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => `${v}%`}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    On ₹{sampleAmount.toLocaleString()} transaction:
                  </Typography>
                  <Box>
                    <Typography variant="caption" color="success.main" sx={{ mr: 2 }}>
                      Vendor: ₹{((sampleAmount * (100 - config[field.key])) / 100).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="primary.main">
                      Platform: ₹{((sampleAmount * config[field.key]) / 100).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            size="large"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Box>
      </CardContent>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Card>
  );
}
