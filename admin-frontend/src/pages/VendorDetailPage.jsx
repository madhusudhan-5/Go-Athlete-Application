import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Divider,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Block as SuspendIcon,
  PlayArrow as ActivateIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Description as DocIcon,
  Store as VenueIcon,
  Sports as CourtIcon,
  ShoppingCart as ProductIcon,
  AttachMoney as RevenueIcon,
} from '@mui/icons-material';
import { vendorService } from '../services/api';

const getStatusColor = (status) => {
  const colors = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'error',
    SUSPENDED: 'default',
  };
  return colors[status] || 'default';
};

const getRoleColor = (role) => {
  const colors = {
    VENUE: 'primary',
    COACH: 'secondary',
    ECOM: 'info',
  };
  return colors[role] || 'default';
};

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ paddingTop: 16 }}>
      {value === index && children}
    </div>
  );
}

export default function VendorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState(null);
  const [dialogReason, setDialogReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchVendor();
    const action = searchParams.get('action');
    if (action && ['approve', 'reject', 'suspend', 'activate'].includes(action)) {
      setDialogAction(action);
      setDialogOpen(true);
    }
  }, [id, searchParams]);

  const fetchVendor = async () => {
    setLoading(true);
    try {
      const response = await vendorService.getById(id);
      setVendor(response);
    } catch (err) {
      console.error('Failed to fetch vendor:', err);
      setVendor({
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        owner_name: 'John Doe',
        business_name: 'Sports Arena Pro',
        roles: ['VENUE', 'COACH'],
        email: 'john@sportsarena.com',
        phone: '9876543210',
        address: '123 Sports Complex, MG Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        status: 'PENDING',
        created_at: '2024-12-01T10:00:00Z',
        id_proofs: ['/placeholder/id1.jpg', '/placeholder/id2.jpg'],
        license_docs: ['/placeholder/license.pdf'],
        summary: {
          venues_count: 2,
          courts_count: 8,
          products_count: 15,
          bookings_count: 342,
          total_revenue: 456000,
          commission_paid: 45600,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if ((dialogAction === 'reject' || dialogAction === 'suspend') && dialogReason.length < 10) {
      setSnackbar({ open: true, message: 'Reason must be at least 10 characters', severity: 'error' });
      return;
    }

    setActionLoading(true);
    try {
      switch (dialogAction) {
        case 'approve':
          await vendorService.approve(id);
          break;
        case 'reject':
          await vendorService.reject(id, dialogReason);
          break;
        case 'suspend':
          await vendorService.suspend(id, dialogReason);
          break;
        case 'activate':
          await vendorService.activate(id);
          break;
      }
      setSnackbar({
        open: true,
        message: `Vendor ${dialogAction}d successfully`,
        severity: 'success',
      });
      fetchVendor();
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to ${dialogAction} vendor`,
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
      setDialogOpen(false);
      setDialogReason('');
    }
  };

  const openDialog = (action) => {
    setDialogAction(action);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!vendor) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="text.secondary">Vendor not found</Typography>
        <Button onClick={() => navigate('/admin/vendors')} sx={{ mt: 2 }}>
          Back to Vendors
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/admin/vendors')}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 700, flex: 1 }}>
          Vendor Details
        </Typography>
        <Chip
          label={vendor.status}
          color={getStatusColor(vendor.status)}
          sx={{ fontWeight: 600 }}
        />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, mb: 3 }}>
                <Avatar
                  sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 32 }}
                >
                  {vendor.business_name?.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {vendor.business_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Owner: {vendor.owner_name || `${vendor.first_name} ${vendor.last_name}`}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {vendor.roles?.map((role) => (
                      <Chip key={role} label={role} size="small" color={getRoleColor(role)} />
                    ))}
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <EmailIcon color="action" />
                    <Typography>{vendor.email}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PhoneIcon color="action" />
                    <Typography>{vendor.phone}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <LocationIcon color="action" sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography>{vendor.address}</Typography>
                      <Typography color="text.secondary">
                        {vendor.city}, {vendor.state} - {vendor.pincode}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
            >
              <Tab label="Documents" />
              <Tab label="Activity" />
            </Tabs>
            <CardContent>
              <TabPanel value={tabValue} index={0}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>ID Proofs</Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {vendor.id_proofs?.map((doc, i) => (
                    <Grid item key={i}>
                      <Paper
                        sx={{
                          width: 150,
                          height: 100,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'grey.100',
                          cursor: 'pointer',
                          '&:hover': { boxShadow: 2 },
                        }}
                      >
                        <DocIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                      </Paper>
                      <Typography variant="caption" color="text.secondary">
                        ID Proof {i + 1}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>License Documents</Typography>
                <Grid container spacing={2}>
                  {vendor.license_docs?.map((doc, i) => (
                    <Grid item key={i}>
                      <Paper
                        sx={{
                          width: 150,
                          height: 100,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'grey.100',
                          cursor: 'pointer',
                          '&:hover': { boxShadow: 2 },
                        }}
                      >
                        <DocIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
                      </Paper>
                      <Typography variant="caption" color="text.secondary">
                        License {i + 1}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
                <Typography variant="body2" color="text.secondary">
                  Registered on: {new Date(vendor.created_at).toLocaleDateString()}
                </Typography>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {vendor.status === 'PENDING' && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<ApproveIcon />}
                      onClick={() => openDialog('approve')}
                      fullWidth
                    >
                      Approve Vendor
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<RejectIcon />}
                      onClick={() => openDialog('reject')}
                      fullWidth
                    >
                      Reject Vendor
                    </Button>
                  </>
                )}
                {vendor.status === 'APPROVED' && (
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<SuspendIcon />}
                    onClick={() => openDialog('suspend')}
                    fullWidth
                  >
                    Suspend Vendor
                  </Button>
                )}
                {(vendor.status === 'SUSPENDED' || vendor.status === 'REJECTED') && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<ActivateIcon />}
                    onClick={() => openDialog('activate')}
                    fullWidth
                  >
                    Activate Vendor
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Summary
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.light' }}><VenueIcon /></Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Venues" secondary={vendor.summary?.venues_count || 0} />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'secondary.light' }}><CourtIcon /></Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Courts" secondary={vendor.summary?.courts_count || 0} />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'info.light' }}><ProductIcon /></Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Products" secondary={vendor.summary?.products_count || 0} />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.light' }}><RevenueIcon /></Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Total Revenue"
                    secondary={`₹${(vendor.summary?.total_revenue || 0).toLocaleString()}`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogAction === 'approve' && 'Approve Vendor'}
          {dialogAction === 'reject' && 'Reject Vendor'}
          {dialogAction === 'suspend' && 'Suspend Vendor'}
          {dialogAction === 'activate' && 'Activate Vendor'}
        </DialogTitle>
        <DialogContent>
          {dialogAction === 'approve' && (
            <Typography>
              Are you sure you want to approve <strong>{vendor?.business_name}</strong>?
              This will allow them to start using the platform.
            </Typography>
          )}
          {dialogAction === 'activate' && (
            <Typography>
              Are you sure you want to activate <strong>{vendor?.business_name}</strong>?
            </Typography>
          )}
          {(dialogAction === 'reject' || dialogAction === 'suspend') && (
            <>
              <Typography sx={{ mb: 2 }}>
                Please provide a reason for {dialogAction}ing <strong>{vendor?.business_name}</strong>:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={dialogReason}
                onChange={(e) => setDialogReason(e.target.value)}
                placeholder="Enter reason (minimum 10 characters)..."
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
            color={dialogAction === 'approve' || dialogAction === 'activate' ? 'success' : 'error'}
            disabled={actionLoading || ((dialogAction === 'reject' || dialogAction === 'suspend') && dialogReason.length < 10)}
          >
            {actionLoading ? 'Processing...' : dialogAction?.charAt(0).toUpperCase() + dialogAction?.slice(1)}
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
