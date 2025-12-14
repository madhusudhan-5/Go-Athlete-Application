import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { superAdminService } from '../../services/superApi';

const permissionLabels = {
  can_manage_vendors: 'Manage Vendors',
  can_manage_bookings: 'Manage Bookings',
  can_manage_commissions: 'Manage Commissions',
  can_manage_offers: 'Manage Offers',
  can_manage_tickets: 'Manage Tickets',
  can_manage_reports: 'Manage Reports',
  can_view_reports: 'View Reports',
  can_manage_memberships: 'Manage Memberships',
  can_manage_payouts: 'Manage Payouts',
};

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    can_manage_vendors: true,
    can_manage_bookings: true,
    can_manage_commissions: false,
    can_manage_offers: true,
    can_manage_tickets: true,
    can_manage_reports: false,
    can_view_reports: true,
    can_manage_memberships: true,
    can_manage_payouts: false,
  });
  const [saving, setSaving] = useState(false);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const data = await superAdminService.getAdmins();
      setAdmins(data);
      setError(null);
    } catch (err) {
      setError('Failed to load admins');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleOpenDialog = (admin = null) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({
        ...admin,
        email: admin.email || '',
        password: '',
        full_name: admin.full_name || '',
        phone: admin.phone || '',
      });
    } else {
      setEditingAdmin(null);
      setFormData({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        can_manage_vendors: true,
        can_manage_bookings: true,
        can_manage_commissions: false,
        can_manage_offers: true,
        can_manage_tickets: true,
        can_manage_reports: false,
        can_view_reports: true,
        can_manage_memberships: true,
        can_manage_payouts: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAdmin(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingAdmin) {
        const permissions = {};
        Object.keys(permissionLabels).forEach((key) => {
          permissions[key] = formData[key];
        });
        await superAdminService.updateAdmin(editingAdmin.id, permissions);
      } else {
        await superAdminService.createAdmin(formData);
      }
      handleCloseDialog();
      fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save admin');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (admin) => {
    try {
      if (admin.is_suspended) {
        await superAdminService.enableAdmin(admin.id);
      } else {
        await superAdminService.disableAdmin(admin.id);
      }
      fetchAdmins();
    } catch (err) {
      setError('Failed to update admin status');
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
          Admin Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ bgcolor: 'warning.main', '&:hover': { bgcolor: 'warning.dark' } }}
        >
          Add Admin
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
              <TableCell>Admin</TableCell>
              <TableCell>Permissions</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell>
                  <Typography fontWeight={600}>{admin.full_name || admin.username}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {admin.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {Object.entries(permissionLabels).map(([key, label]) => (
                      admin[key] && (
                        <Chip
                          key={key}
                          label={label}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      )
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={admin.is_suspended ? 'Suspended' : 'Active'}
                    color={admin.is_suspended ? 'error' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(admin.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit Permissions">
                    <IconButton onClick={() => handleOpenDialog(admin)} size="small">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={admin.is_suspended ? 'Enable' : 'Disable'}>
                    <IconButton
                      onClick={() => handleToggleStatus(admin)}
                      size="small"
                      color={admin.is_suspended ? 'success' : 'error'}
                    >
                      {admin.is_suspended ? <CheckCircleIcon /> : <BlockIcon />}
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {admins.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary" py={4}>
                    No admins found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAdmin ? 'Edit Admin Permissions' : 'Add New Admin'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {!editingAdmin && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    helperText="Minimum 8 characters"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                Permissions
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={1}>
                  {Object.entries(permissionLabels).map(([key, label]) => (
                    <Grid item xs={12} sm={6} md={4} key={key}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData[key] || false}
                            onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                            color="warning"
                          />
                        }
                        label={label}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ bgcolor: 'warning.main', '&:hover': { bgcolor: 'warning.dark' } }}
          >
            {saving ? <CircularProgress size={24} /> : editingAdmin ? 'Save Changes' : 'Create Admin'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
