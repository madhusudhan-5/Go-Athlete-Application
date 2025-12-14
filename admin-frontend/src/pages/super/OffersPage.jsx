import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Tooltip,
} from '@mui/material';
import {
  Block as BlockIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { offerService } from '../../services/superApi';

const statusColors = {
  DRAFT: 'default',
  ACTIVE: 'success',
  EXPIRED: 'warning',
  DISABLED: 'error',
};

export default function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', offer: null });
  const [overrideData, setOverrideData] = useState({});
  const [processing, setProcessing] = useState(false);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const data = await offerService.getAll();
      setOffers(data.results || data);
    } catch (err) {
      setError('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleAction = async () => {
    setProcessing(true);
    const { type, offer } = actionDialog;
    try {
      switch (type) {
        case 'override':
          await offerService.override(offer.id, overrideData);
          break;
        case 'deactivate':
          await offerService.deactivate(offer.id);
          break;
        case 'delete':
          await offerService.delete(offer.id);
          break;
      }
      setActionDialog({ open: false, type: '', offer: null });
      setOverrideData({});
      fetchOffers();
    } catch (err) {
      setError(`Failed to ${type} offer`);
    } finally {
      setProcessing(false);
    }
  };

  const openDialog = (type, offer) => {
    setActionDialog({ open: true, type, offer });
    if (type === 'override') {
      setOverrideData({
        value: offer.value,
        visibility_percentage: offer.visibility_percentage,
        max_usage_count: offer.max_usage_count,
      });
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
        Offers Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Usage</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {offers.map((offer) => (
              <TableRow key={offer.id}>
                <TableCell>
                  <Typography fontWeight={600}>{offer.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {offer.offer_category}
                  </Typography>
                </TableCell>
                <TableCell>
                  {offer.code ? (
                    <Chip label={offer.code} size="small" variant="outlined" />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>{offer.offer_type}</TableCell>
                <TableCell>
                  {offer.offer_type === 'PERCENT' ? `${offer.value}%` : `₹${offer.value}`}
                </TableCell>
                <TableCell>
                  <Chip
                    label={offer.status}
                    size="small"
                    color={statusColors[offer.status] || 'default'}
                  />
                </TableCell>
                <TableCell>
                  {offer.max_usage_count > 0
                    ? `${offer.usage_count}/${offer.max_usage_count}`
                    : `${offer.usage_count}/∞`}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Override Values">
                    <IconButton size="small" onClick={() => openDialog('override', offer)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Deactivate">
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => openDialog('deactivate', offer)}
                      disabled={offer.status === 'DISABLED'}
                    >
                      <BlockIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => openDialog('delete', offer)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {offers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary" py={4}>
                    No offers found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={actionDialog.open}
        onClose={() => setActionDialog({ open: false, type: '', offer: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {actionDialog.type === 'delete' && <WarningIcon color="error" />}
          {actionDialog.type === 'override' && 'Override Offer Values'}
          {actionDialog.type === 'deactivate' && 'Deactivate Offer'}
          {actionDialog.type === 'delete' && 'Delete Offer'}
        </DialogTitle>
        <DialogContent>
          {actionDialog.type === 'override' && (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Discount Value"
                type="number"
                value={overrideData.value || ''}
                onChange={(e) => setOverrideData({ ...overrideData, value: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Visibility Percentage"
                type="number"
                value={overrideData.visibility_percentage || ''}
                onChange={(e) => setOverrideData({ ...overrideData, visibility_percentage: e.target.value })}
                margin="normal"
                inputProps={{ min: 0, max: 100 }}
              />
              <TextField
                fullWidth
                label="Max Usage Count (0 = unlimited)"
                type="number"
                value={overrideData.max_usage_count || ''}
                onChange={(e) => setOverrideData({ ...overrideData, max_usage_count: e.target.value })}
                margin="normal"
                inputProps={{ min: 0 }}
              />
            </Box>
          )}
          {actionDialog.type === 'deactivate' && (
            <Typography>
              Are you sure you want to deactivate offer <strong>{actionDialog.offer?.title}</strong>?
              It will no longer be usable.
            </Typography>
          )}
          {actionDialog.type === 'delete' && (
            <Typography>
              <strong>WARNING:</strong> This will permanently delete offer <strong>{actionDialog.offer?.title}</strong>.
              This action cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog({ open: false, type: '', offer: null })}>
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            variant="contained"
            color={actionDialog.type === 'delete' ? 'error' : 'warning'}
            disabled={processing}
          >
            {processing ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
