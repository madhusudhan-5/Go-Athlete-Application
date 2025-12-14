import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { systemConfigService } from '../../services/superApi';

export default function SystemConfigPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await systemConfigService.getConfig();
        setConfig(data);
      } catch (err) {
        setError('Failed to load configuration');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleChange = (field, value) => {
    setConfig({ ...config, [field]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await systemConfigService.updateConfig(config);
      setSuccess(true);
    } catch (err) {
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          System Configuration
        </Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{ bgcolor: 'warning.main', '&:hover': { bgcolor: 'warning.dark' } }}
        >
          {saving ? <CircularProgress size={24} /> : 'Save Changes'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Platform Branding
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TextField
                fullWidth
                label="Platform Name"
                value={config?.platform_name || ''}
                onChange={(e) => handleChange('platform_name', e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Logo URL"
                value={config?.logo_url || ''}
                onChange={(e) => handleChange('logo_url', e.target.value)}
                margin="normal"
                helperText="URL to platform logo image"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Support Contact
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TextField
                fullWidth
                label="Support Email"
                type="email"
                value={config?.support_email || ''}
                onChange={(e) => handleChange('support_email', e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Support Phone"
                value={config?.support_phone || ''}
                onChange={(e) => handleChange('support_phone', e.target.value)}
                margin="normal"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <FormControlLabel
                control={
                  <Switch
                    checked={config?.maintenance_mode || false}
                    onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                    color="warning"
                  />
                }
                label="Maintenance Mode"
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 6, mt: -1 }}>
                When enabled, users will see a maintenance message
              </Typography>
              <TextField
                fullWidth
                label="Login Banner Message"
                value={config?.login_banner_message || ''}
                onChange={(e) => handleChange('login_banner_message', e.target.value)}
                margin="normal"
                multiline
                rows={2}
                helperText="Optional message shown on login page"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Legal & Policies
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TextField
                fullWidth
                label="Terms & Conditions URL"
                value={config?.global_terms_url || ''}
                onChange={(e) => handleChange('global_terms_url', e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Privacy Policy URL"
                value={config?.privacy_policy_url || ''}
                onChange={(e) => handleChange('privacy_policy_url', e.target.value)}
                margin="normal"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TextField
                label="Max Upload Size (MB)"
                type="number"
                value={config?.max_upload_size_mb || 10}
                onChange={(e) => handleChange('max_upload_size_mb', parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 1, max: 100 } }}
                sx={{ width: 200 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        message="Configuration saved successfully"
      />
    </Box>
  );
}
