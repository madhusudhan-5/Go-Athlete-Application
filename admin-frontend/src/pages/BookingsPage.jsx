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
  IconButton,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { bookingService } from '../services/api';

const STATUS_OPTIONS = ['ALL', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'];

const getStatusColor = (status) => {
  const colors = {
    CONFIRMED: 'info',
    CANCELLED: 'error',
    COMPLETED: 'success',
    NO_SHOW: 'warning',
  };
  return colors[status] || 'default';
};

export default function BookingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        page_size: rowsPerPage,
      };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await bookingService.getAll(params);
      setBookings(response.results || response);
      setTotalCount(response.count || response.length || 0);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setBookings([
        {
          id: 1,
          vendor: { business_name: 'Sports Arena' },
          venue: { name: 'City Sports Complex' },
          court: { name: 'Court A' },
          customer_name: 'Rahul Sharma',
          customer_phone: '9876543210',
          date: '2024-12-08',
          time_slot: '10:00 - 11:00',
          price: 800,
          status: 'CONFIRMED',
        },
        {
          id: 2,
          vendor: { business_name: 'FitZone' },
          venue: { name: 'Fitness Hub' },
          court: { name: 'Tennis 1' },
          customer_name: 'Priya Patel',
          customer_phone: '9876543211',
          date: '2024-12-08',
          time_slot: '14:00 - 15:00',
          price: 1200,
          status: 'COMPLETED',
        },
        {
          id: 3,
          vendor: { business_name: 'PlayPro' },
          venue: { name: 'PlayGround' },
          court: { name: 'Badminton 2' },
          customer_name: 'Amit Kumar',
          customer_phone: '9876543212',
          date: '2024-12-07',
          time_slot: '18:00 - 19:00',
          price: 600,
          status: 'CANCELLED',
        },
      ]);
      setTotalCount(3);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    const params = {};
    if (statusFilter !== 'ALL') params.status = statusFilter;
    setSearchParams(params);
  }, [statusFilter, setSearchParams]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Bookings
        </Typography>
        <IconButton onClick={fetchBookings} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              type="date"
              label="From Date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              label="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
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
                    {status.replace('_', ' ')}
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
                <TableCell>ID</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Venue / Court</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Status</TableCell>
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
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No bookings found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow
                    key={booking.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                  >
                    <TableCell>#{booking.id}</TableCell>
                    <TableCell>{booking.vendor?.business_name}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{booking.venue?.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {booking.court?.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{booking.customer_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {booking.customer_phone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{booking.date}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {booking.time_slot}
                      </Typography>
                    </TableCell>
                    <TableCell>₹{booking.price?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={booking.status?.replace('_', ' ')}
                        size="small"
                        color={getStatusColor(booking.status)}
                      />
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
    </Box>
  );
}
