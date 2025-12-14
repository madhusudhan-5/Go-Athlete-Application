import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Grid,
  Paper,
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as VerifyIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Description as DocIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { kycService } from '../services/api';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'VERIFIED', 'REJECTED'];

const getStatusColor = (status) => {
  const colors = {
    PENDING: 'warning',
    VERIFIED: 'success',
    REJECTED: 'error',
  };
  return colors[status] || 'default';
};

export default function KycPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [kycList, setKycList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');

  const [selectedKyc, setSelectedKyc] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState(null);
  const [dialogReason, setDialogReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchKycList = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        page_size: rowsPerPage,
      };
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const response = await kycService.getAll(params);
      setKycList(response.results || response);
      setTotalCount(response.count || response.length || 0);
    } catch (err) {
      console.error('Failed to fetch KYC list:', err);
      setKycList([
        {
          id: 1,
          vendor: { id: 1, business_name: 'Sports Arena Pro' },
          pan_number: 'ABCDE1234F',
          gst_number: '27ABCDE1234F1Z5',
          status: 'PENDING',
          submitted_at: '2024-12-01T10:00:00Z',
          pan_doc_url: '/placeholder/pan.jpg',
          aadhaar_doc_url: '/placeholder/aadhaar.jpg',
          gst_doc_url: '/placeholder/gst.jpg',
          bank_doc_url: '/placeholder/bank.jpg',
        },
        {
          id: 2,
          vendor: { id: 2, business_name: 'FitCoach Academy' },
          pan_number: 'FGHIJ5678K',
          gst_number: '27FGHIJ5678K1Z5',
          status: 'VERIFIED',
          submitted_at: '2024-11-28T10:00:00Z',
          verified_at: '2024-11-29T10:00:00Z',
        },
        {
          id: 3,
          vendor: { id: 3, business_name: 'SportGear Store' },
          pan_number: 'KLMNO9012P',
          gst_number: null,
          status: 'REJECTED',
          submitted_at: '2024-11-25T10:00:00Z',
          rejection_reason: 'GST document missing, PAN image not clear',
        },
      ]);
      setTotalCount(3);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycList();
  }, [page, statusFilter]);

  useEffect(() => {
    const params = {};
    if (statusFilter !== 'ALL') params.status = statusFilter;
    setSearchParams(params);
  }, [statusFilter, setSearchParams]);

  const handleViewDetails = (kyc) => {
    setSelectedKyc(kyc);
    setDetailOpen(true);
  };

  const handleOpenAction = (action) => {
    setDialogAction(action);
    setDialogOpen(true);
  };

  const handleAction = async () => {
    if (dialogAction === 'reject' && dialogReason.length < 10) {
      setSnackbar({ open: true, message: 'Reason must be at least 10 characters', severity: 'error' });
      return;
    }

    setActionLoading(true);
    try {
      if (dialogAction === 'verify') {
        await kycService.verify(selectedKyc.id);
      } else {
        await kycService.reject(selectedKyc.id, dialogReason);
      }
      setSnackbar({
        open: true,
        message: `KYC ${dialogAction === 'verify' ? 'verified' : 'rejected'} successfully`,
        severity: 'success',
      });
      fetchKycList();
      setDetailOpen(false);
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to ${dialogAction} KYC`,
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
      setDialogOpen(false);
      setDialogReason('');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          KYC Verification
        </Typography>
        <IconButton onClick={fetchKycList} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center', mr: 1 }}>
              Status:
            </Typography>
            <ToggleButtonGroup
              value={statusFilter}
              exclusive
              onChange={(e, val) => val && setStatusFilter(val)}
              size="small"
            >
              {STATUS_OPTIONS.map((status) => (
                <ToggleButton key={status} value={status}>
                  {status}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vendor</TableCell>
                <TableCell>PAN Number</TableCell>
                <TableCell>GST Number</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : kycList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No KYC records found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                kycList.map((kyc) => (
                  <TableRow key={kyc.id} hover>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                        onClick={() => navigate(`/admin/vendors/${kyc.vendor.id}`)}
                      >
                        {kyc.vendor.business_name}
                      </Typography>
                    </TableCell>
                    <TableCell>{kyc.pan_number}</TableCell>
                    <TableCell>{kyc.gst_number || '-'}</TableCell>
                    <TableCell>{new Date(kyc.submitted_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={kyc.status}
                        size="small"
                        color={getStatusColor(kyc.status)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewDetails(kyc)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10]}
        />
      </Card>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => setDetailOpen(false)} size="small">
              <BackIcon />
            </IconButton>
            <Typography variant="h6">KYC Details - {selectedKyc?.vendor?.business_name}</Typography>
            <Box sx={{ flex: 1 }} />
            <Chip
              label={selectedKyc?.status}
              color={getStatusColor(selectedKyc?.status)}
            />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">PAN Number</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{selectedKyc?.pan_number}</Typography>

              <Typography variant="subtitle2" color="text.secondary">GST Number</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{selectedKyc?.gst_number || 'Not provided'}</Typography>

              <Typography variant="subtitle2" color="text.secondary">Submitted</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedKyc?.submitted_at && new Date(selectedKyc.submitted_at).toLocaleString()}
              </Typography>

              {selectedKyc?.verified_at && (
                <>
                  <Typography variant="subtitle2" color="text.secondary">Verified</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {new Date(selectedKyc.verified_at).toLocaleString()}
                  </Typography>
                </>
              )}

              {selectedKyc?.rejection_reason && (
                <>
                  <Typography variant="subtitle2" color="text.secondary">Rejection Reason</Typography>
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {selectedKyc.rejection_reason}
                  </Alert>
                </>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>Documents</Typography>
              <Grid container spacing={2}>
                {['pan_doc_url', 'aadhaar_doc_url', 'gst_doc_url', 'bank_doc_url'].map((doc) => (
                  <Grid item xs={6} key={doc}>
                    <Paper
                      sx={{
                        height: 80,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: selectedKyc?.[doc] ? 'grey.100' : 'grey.50',
                        cursor: selectedKyc?.[doc] ? 'pointer' : 'default',
                        border: selectedKyc?.[doc] ? 'none' : '1px dashed',
                        borderColor: 'grey.300',
                      }}
                    >
                      <DocIcon color={selectedKyc?.[doc] ? 'primary' : 'disabled'} />
                    </Paper>
                    <Typography variant="caption" color="text.secondary">
                      {doc.replace('_doc_url', '').replace('_', ' ').toUpperCase()}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
          {selectedKyc?.status === 'PENDING' && (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<RejectIcon />}
                onClick={() => handleOpenAction('reject')}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<VerifyIcon />}
                onClick={() => handleOpenAction('verify')}
              >
                Verify
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogAction === 'verify' ? 'Verify KYC' : 'Reject KYC'}
        </DialogTitle>
        <DialogContent>
          {dialogAction === 'verify' ? (
            <Typography>
              Are you sure you want to verify the KYC for <strong>{selectedKyc?.vendor?.business_name}</strong>?
            </Typography>
          ) : (
            <>
              <Typography sx={{ mb: 2 }}>
                Please provide a reason for rejecting the KYC:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={dialogReason}
                onChange={(e) => setDialogReason(e.target.value)}
                placeholder="Enter rejection reason (minimum 10 characters)..."
                error={dialogReason.length > 0 && dialogReason.length < 10}
                helperText={dialogReason.length > 0 && dialogReason.length < 10 ? 'Minimum 10 characters required' : ''}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            variant="contained"
            color={dialogAction === 'verify' ? 'success' : 'error'}
            disabled={actionLoading || (dialogAction === 'reject' && dialogReason.length < 10)}
          >
            {actionLoading ? 'Processing...' : dialogAction === 'verify' ? 'Verify' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
