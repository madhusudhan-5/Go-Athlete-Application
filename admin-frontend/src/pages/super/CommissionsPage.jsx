import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { systemConfigService, commissionService } from '../../services/superApi';

export default function CommissionsPage() {
  const [config, setConfig] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formData, setFormData] = useState({
    court_pct: 10,
    coach_pct: 15,
    ecommerce_pct: 12,
    membership_pct: 8,
    reason: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configData, historyData] = await Promise.all([
          systemConfigService.getConfig(),
          commissionService.getHistory(),
        ]);
        setConfig(configData);
        setHistory(historyData);
        setFormData({
          court_pct: parseFloat(configData.default_commission_court) || 10,
          coach_pct: parseFloat(configData.default_commission_coach) || 15,
          ecommerce_pct: parseFloat(configData.default_commission_ecommerce) || 12,
          membership_pct: parseFloat(configData.default_commission_membership) || 8,
          reason: '',
        });
      } catch (err) {
        setError('Failed to load commission data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOverride = async () => {
    setSaving(true);
    setConfirmOpen(false);
    try {
      await commissionService.override(formData);
      setSuccess(true);
      const [configData, historyData] = await Promise.all([
        systemConfigService.getConfig(),
        commissionService.getHistory(),
      ]);
      setConfig(configData);
      setHistory(historyData);
      setFormData((prev) => ({ ...prev, reason: '' }));
    } catch (err) {
      setError('Failed to override commissions');
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
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Commission Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Commission Rates
              </Typography>
              <Box sx={{ mt: 3 }}>
                {[
                  { label: 'Court Booking', key: 'court_pct', color: '#2196F3' },
                  { label: 'Coaching', key: 'coach_pct', color: '#4CAF50' },
                  { label: 'E-commerce', key: 'ecommerce_pct', color: '#FF9800' },
                  { label: 'Membership', key: 'membership_pct', color: '#9C27B0' },
                ].map((item) => (
                  <Box key={item.key} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{item.label}</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formData[item.key]}%
                      </Typography>
                    </Box>
                    <Slider
                      value={formData[item.key]}
                      onChange={(e, value) => setFormData({ ...formData, [item.key]: value })}
                      min={0}
                      max={50}
                      step={0.5}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(v) => `${v}%`}
                      sx={{
                        color: item.color,
                        '& .MuiSlider-thumb': { bgcolor: item.color },
                      }}
                    />
                  </Box>
                ))}
              </Box>
              <TextField
                fullWidth
                label="Reason for Change"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                margin="normal"
                multiline
                rows={2}
                helperText="Optional: Document why you're making this change"
              />
              <Button
                fullWidth
                variant="contained"
                onClick={() => setConfirmOpen(true)}
                disabled={saving}
                sx={{ mt: 2, bgcolor: 'warning.main', '&:hover': { bgcolor: 'warning.dark' } }}
              >
                {saving ? <CircularProgress size={24} /> : 'Apply Override'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Commission History
              </Typography>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Changed By</TableCell>
                      <TableCell align="right">Court</TableCell>
                      <TableCell align="right">Coach</TableCell>
                      <TableCell align="right">Ecom</TableCell>
                      <TableCell align="right">Member</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {new Date(item.changed_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{item.changed_by_name}</TableCell>
                        <TableCell align="right">{item.court_pct}%</TableCell>
                        <TableCell align="right">{item.coach_pct}%</TableCell>
                        <TableCell align="right">{item.ecommerce_pct}%</TableCell>
                        <TableCell align="right">{item.membership_pct}%</TableCell>
                      </TableRow>
                    ))}
                    {history.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary" py={2}>
                            No history available
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Confirm Commission Override
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will update commission rates for the <strong>entire platform</strong>.
            All new transactions will use these rates. Are you sure you want to proceed?
          </DialogContentText>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2">
              Court: {formData.court_pct}% | Coach: {formData.coach_pct}% |
              E-commerce: {formData.ecommerce_pct}% | Membership: {formData.membership_pct}%
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleOverride}
            variant="contained"
            sx={{ bgcolor: 'warning.main', '&:hover': { bgcolor: 'warning.dark' } }}
          >
            Confirm Override
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        message="Commission rates updated successfully"
      />
    </Box>
  );
}
