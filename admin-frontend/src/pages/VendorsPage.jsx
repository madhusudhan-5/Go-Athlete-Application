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
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Menu,
  MenuItem,
  ListItemIcon,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Block as SuspendIcon,
  PlayArrow as ActivateIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { vendorService } from '../services/api';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];
const ROLE_OPTIONS = ['ALL', 'VENUE', 'COACH', 'ECOM'];

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

export default function VendorsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || 'ALL');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        page_size: rowsPerPage,
      };
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (roleFilter !== 'ALL') params.role = roleFilter;

      const response = await vendorService.getAll(params);
      setVendors(response.results || response);
      setTotalCount(response.count || response.length || 0);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
      setVendors([
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          business_name: 'Sports Arena Pro',
          roles: ['VENUE'],
          email: 'john@sportsarena.com',
          phone: '9876543210',
          city: 'Mumbai',
          status: 'PENDING',
        },
        {
          id: 2,
          first_name: 'Jane',
          last_name: 'Smith',
          business_name: 'FitCoach Academy',
          roles: ['COACH'],
          email: 'jane@fitcoach.com',
          phone: '9876543211',
          city: 'Delhi',
          status: 'APPROVED',
        },
        {
          id: 3,
          first_name: 'Mike',
          last_name: 'Johnson',
          business_name: 'SportGear Store',
          roles: ['ECOM'],
          email: 'mike@sportgear.com',
          phone: '9876543212',
          city: 'Bangalore',
          status: 'REJECTED',
        },
      ]);
      setTotalCount(3);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [page, statusFilter, roleFilter]);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (statusFilter !== 'ALL') params.status = statusFilter;
    if (roleFilter !== 'ALL') params.role = roleFilter;
    setSearchParams(params);
  }, [search, statusFilter, roleFilter, setSearchParams]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setPage(0);
      fetchVendors();
    }
  };

  const handleMenuOpen = (event, vendor) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedVendor(vendor);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVendor(null);
  };

  const handleAction = async (action) => {
    if (!selectedVendor) return;
    handleMenuClose();
    navigate(`/admin/vendors/${selectedVendor.id}?action=${action}`);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Vendors
        </Typography>
        <IconButton onClick={fetchVendors} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleSearch}
              size="small"
              sx={{ minWidth: 280 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

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

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center', mr: 1 }}>
                Role:
              </Typography>
              <ToggleButtonGroup
                value={roleFilter}
                exclusive
                onChange={(e, val) => val && setRoleFilter(val)}
                size="small"
              >
                {ROLE_OPTIONS.map((role) => (
                  <ToggleButton key={role} value={role}>
                    {role}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Business Name</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Roles</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : vendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No vendors found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                vendors.map((vendor) => (
                  <TableRow
                    key={vendor.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/vendors/${vendor.id}`)}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {vendor.business_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {vendor.first_name} {vendor.last_name}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{vendor.email}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {vendor.phone}
                      </Typography>
                    </TableCell>
                    <TableCell>{vendor.city}</TableCell>
                    <TableCell>
                      {vendor.roles?.map((role) => (
                        <Chip
                          key={role}
                          label={role}
                          size="small"
                          color={getRoleColor(role)}
                          sx={{ mr: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={vendor.status}
                        size="small"
                        color={getStatusColor(vendor.status)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, vendor)}
                      >
                        <MoreIcon />
                      </IconButton>
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

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleAction('view')}>
          <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
          View Details
        </MenuItem>
        {selectedVendor?.status === 'PENDING' && (
          <MenuItem onClick={() => handleAction('approve')}>
            <ListItemIcon><ApproveIcon fontSize="small" color="success" /></ListItemIcon>
            Approve
          </MenuItem>
        )}
        {(selectedVendor?.status === 'PENDING' || selectedVendor?.status === 'APPROVED') && (
          <MenuItem onClick={() => handleAction('reject')}>
            <ListItemIcon><RejectIcon fontSize="small" color="error" /></ListItemIcon>
            Reject
          </MenuItem>
        )}
        {selectedVendor?.status === 'APPROVED' && (
          <MenuItem onClick={() => handleAction('suspend')}>
            <ListItemIcon><SuspendIcon fontSize="small" /></ListItemIcon>
            Suspend
          </MenuItem>
        )}
        {(selectedVendor?.status === 'SUSPENDED' || selectedVendor?.status === 'REJECTED') && (
          <MenuItem onClick={() => handleAction('activate')}>
            <ListItemIcon><ActivateIcon fontSize="small" color="success" /></ListItemIcon>
            Activate
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
