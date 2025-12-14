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
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Tooltip,
} from '@mui/material';
import {
  Block as BlockIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { vendorService } from '../../services/superApi';

const statusColors = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  SUSPENDED: 'default',
};

export default function VendorOversightPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', vendor: null });
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const data = await vendorService.getAll();
      setVendors(data.results || data);
    } catch (err) {
      setError('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleAction = async () => {
    setProcessing(true);
    const { type, vendor } = actionDialog;
    try {
      switch (type) {
        case 'deactivate':
          await vendorService.forceDeactivate(vendor.id, reason);
          break;
        case 'reset':
          await vendorService.forceReset(vendor.id);
          break;
        case 'delete':
          await vendorService.hardDelete(vendor.id);
          break;
      }
      setActionDialog({ open: false, type: '', vendor: null });
      setReason('');
      fetchVendors();
    } catch (err) {
      setError(`Failed to ${type} vendor`);
    } finally {
      setProcessing(false);
    }
  };

  const openDialog = (type, vendor) => {
    setActionDialog({ open: true, type, vendor });
    setReason('');
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
          Vendor Oversight
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchVendors}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Business Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>KYC</TableCell>
              <TableCell align="right">Force Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vendors.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell>{vendor.id}</TableCell>
                <TableCell>
                  <Typography fontWeight={600}>{vendor.business_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {vendor.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={vendor.vendor_type} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{vendor.email}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {vendor.phone}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={vendor.status}
                    size="small"
                    color={statusColors[vendor.status] || 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={vendor.kyc_status}
                    size="small"
                    variant="outlined"
                    color={vendor.kyc_verified ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Force Deactivate">
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => openDialog('deactivate', vendor)}
                      disabled={vendor.status === 'SUSPENDED'}
                    >
                      <BlockIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Force Reset to Pending">
                    <IconButton
                      size="small"
                      color="info"
                      onClick={() => openDialog('reset', vendor)}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Hard Delete (Permanent)">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => openDialog('delete', vendor)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {vendors.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary" py={4}>
                    No vendors found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, type: '', vendor: null })}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          Confirm {actionDialog.type === 'deactivate' ? 'Force Deactivate' : actionDialog.type === 'reset' ? 'Force Reset' : 'Hard Delete'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {actionDialog.type === 'deactivate' && (
              <>
                This will immediately suspend vendor <strong>{actionDialog.vendor?.business_name}</strong>.
                They will lose access to all features.
              </>
            )}
            {actionDialog.type === 'reset' && (
              <>
                This will reset vendor <strong>{actionDialog.vendor?.business_name}</strong> to pending status.
                Their KYC will need to be re-submitted.
              </>
            )}
            {actionDialog.type === 'delete' && (
              <>
                <strong>WARNING: This action is permanent!</strong> Vendor <strong>{actionDialog.vendor?.business_name}</strong>
                and all associated data will be permanently deleted. This cannot be undone.
              </>
            )}
          </DialogContentText>
          {actionDialog.type === 'deactivate' && (
            <TextField
              fullWidth
              label="Reason for Deactivation"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              margin="normal"
              multiline
              rows={2}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog({ open: false, type: '', vendor: null })}>
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            variant="contained"
            color="error"
            disabled={processing}
          >
            {processing ? <CircularProgress size={24} /> : `Confirm ${actionDialog.type}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
