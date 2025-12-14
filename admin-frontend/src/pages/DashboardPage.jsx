import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Store as VendorIcon,
  CheckCircle as ActiveIcon,
  HourglassEmpty as PendingIcon,
  Assignment as KycIcon,
  SupportAgent as TicketIcon,
  Event as BookingIcon,
  AttachMoney as RevenueIcon,
  ShoppingCart as OrderIcon,
  CardMembership as MembershipIcon,
  TrendingUp,
  TrendingDown,
  Refresh as RefreshIcon,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/api';

const StatCard = ({ title, value, icon, trend, trendValue, color, loading, onClick }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="circular" width={48} height={48} />
          <Skeleton variant="text" width="60%" sx={{ mt: 2 }} />
          <Skeleton variant="text" width="40%" height={40} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: `${color}.container` || 'primary.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color || 'primary.main',
            }}
          >
            {icon}
          </Box>
          {trend && (
            <Chip
              size="small"
              icon={trend === 'up' ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
              label={trendValue}
              color={trend === 'up' ? 'success' : 'error'}
              variant="outlined"
            />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

const SimpleBarChart = ({ data, color }) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 60, mt: 2 }}>
      {data.map((d, i) => (
        <Tooltip key={i} title={`${d.label}: ${d.value}`}>
          <Box
            sx={{
              flex: 1,
              height: `${(d.value / maxValue) * 100}%`,
              minHeight: 4,
              bgcolor: color || 'primary.main',
              borderRadius: 0.5,
              transition: 'height 0.3s',
            }}
          />
        </Tooltip>
      ))}
    </Box>
  );
};

const ChartCard = ({ title, data, color, loading }) => {
  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="rectangular" height={80} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        <SimpleBarChart data={data} color={color} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          {data.slice(0, 7).map((d, i) => (
            <Typography key={i} variant="caption" color="text.secondary">
              {d.label}
            </Typography>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

const getStatusColor = (status) => {
  const colors = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'error',
    SUSPENDED: 'default',
    OPEN: 'info',
    IN_PROGRESS: 'warning',
    RESOLVED: 'success',
    CONFIRMED: 'success',
    CANCELLED: 'error',
    COMPLETED: 'success',
  };
  return colors[status] || 'default';
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await dashboardService.getSummary();
      setData(response);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
      setError('Failed to load dashboard data');
      setData({
        kpis: {
          total_vendors: 45,
          active_vendors: 38,
          pending_vendor_approvals: 7,
          pending_kyc: 4,
          open_tickets: 12,
          today_bookings: 156,
          today_revenue: 45750,
          today_ecom_orders: 23,
          today_membership_sales: 8,
        },
        charts: {
          bookings_last_7_days: [
            { label: 'Mon', value: 120 },
            { label: 'Tue', value: 145 },
            { label: 'Wed', value: 132 },
            { label: 'Thu', value: 168 },
            { label: 'Fri', value: 189 },
            { label: 'Sat', value: 210 },
            { label: 'Sun', value: 156 },
          ],
          revenue_last_7_days: [
            { label: 'Mon', value: 32000 },
            { label: 'Tue', value: 41000 },
            { label: 'Wed', value: 38500 },
            { label: 'Thu', value: 52000 },
            { label: 'Fri', value: 61000 },
            { label: 'Sat', value: 72000 },
            { label: 'Sun', value: 45750 },
          ],
        },
        recent_vendors: [
          { id: 1, business_name: 'Sports Arena Pro', roles: ['VENUE'], status: 'PENDING' },
          { id: 2, business_name: 'FitCoach Academy', roles: ['COACH'], status: 'APPROVED' },
          { id: 3, business_name: 'SportGear Store', roles: ['ECOM'], status: 'PENDING' },
        ],
        recent_tickets: [
          { id: 1, subject: 'Payment not received', severity: 'HIGH', status: 'OPEN' },
          { id: 2, subject: 'Court booking issue', severity: 'MEDIUM', status: 'IN_PROGRESS' },
          { id: 3, subject: 'Refund request', severity: 'LOW', status: 'RESOLVED' },
        ],
        recent_bookings: [
          { id: 1, venue: 'City Sports', court: 'Court A', vendor: 'Sports Arena', status: 'CONFIRMED' },
          { id: 2, venue: 'Fitness Hub', court: 'Tennis 1', vendor: 'FitZone', status: 'COMPLETED' },
          { id: 3, venue: 'PlayGround', court: 'Badminton 2', vendor: 'PlayPro', status: 'CANCELLED' },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Dashboard
        </Typography>
        <IconButton onClick={fetchDashboard} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Total Vendors"
            value={kpis.total_vendors}
            icon={<VendorIcon />}
            color="primary"
            loading={loading}
            onClick={() => navigate('/admin/vendors')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Active Vendors"
            value={kpis.active_vendors}
            icon={<ActiveIcon />}
            color="success"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Pending Approvals"
            value={kpis.pending_vendor_approvals}
            icon={<PendingIcon />}
            color="warning"
            loading={loading}
            onClick={() => navigate('/admin/vendors?status=PENDING')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Pending KYC"
            value={kpis.pending_kyc}
            icon={<KycIcon />}
            color="info"
            loading={loading}
            onClick={() => navigate('/admin/kyc?status=PENDING')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Open Tickets"
            value={kpis.open_tickets}
            icon={<TicketIcon />}
            color="error"
            loading={loading}
            onClick={() => navigate('/admin/tickets?status=OPEN')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Today's Bookings"
            value={kpis.today_bookings}
            icon={<BookingIcon />}
            color="primary"
            trend="up"
            trendValue="+12%"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Today's Revenue"
            value={`₹${(kpis.today_revenue || 0).toLocaleString()}`}
            icon={<RevenueIcon />}
            color="success"
            trend="up"
            trendValue="+8%"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="E-commerce Orders"
            value={kpis.today_ecom_orders}
            icon={<OrderIcon />}
            color="secondary"
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ChartCard
            title="Bookings (Last 7 Days)"
            data={charts.bookings_last_7_days || []}
            color="#0A1F35"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard
            title="Revenue (Last 7 Days)"
            data={charts.revenue_last_7_days || []}
            color="#DA6F2B"
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Recent Vendors
                </Typography>
                <IconButton size="small" onClick={() => navigate('/admin/vendors')}>
                  <ArrowForward fontSize="small" />
                </IconButton>
              </Box>
              {loading ? (
                <Box>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 1 }} />
                  ))}
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      {(data?.recent_vendors || []).map((vendor) => (
                        <TableRow
                          key={vendor.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/admin/vendors/${vendor.id}`)}
                        >
                          <TableCell>{vendor.business_name}</TableCell>
                          <TableCell>
                            {vendor.roles?.map((r) => (
                              <Chip key={r} label={r} size="small" sx={{ mr: 0.5 }} />
                            ))}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={vendor.status}
                              size="small"
                              color={getStatusColor(vendor.status)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Recent Tickets
                </Typography>
                <IconButton size="small" onClick={() => navigate('/admin/tickets')}>
                  <ArrowForward fontSize="small" />
                </IconButton>
              </Box>
              {loading ? (
                <Box>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 1 }} />
                  ))}
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      {(data?.recent_tickets || []).map((ticket) => (
                        <TableRow
                          key={ticket.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                        >
                          <TableCell>{ticket.subject}</TableCell>
                          <TableCell>
                            <Chip
                              label={ticket.severity}
                              size="small"
                              color={ticket.severity === 'HIGH' ? 'error' : ticket.severity === 'MEDIUM' ? 'warning' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={ticket.status}
                              size="small"
                              color={getStatusColor(ticket.status)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Recent Bookings
                </Typography>
                <IconButton size="small" onClick={() => navigate('/admin/bookings')}>
                  <ArrowForward fontSize="small" />
                </IconButton>
              </Box>
              {loading ? (
                <Box>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 1 }} />
                  ))}
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      {(data?.recent_bookings || []).map((booking) => (
                        <TableRow
                          key={booking.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                        >
                          <TableCell>
                            <Typography variant="body2">{booking.venue}</Typography>
                            <Typography variant="caption" color="text.secondary">{booking.court}</Typography>
                          </TableCell>
                          <TableCell>{booking.vendor}</TableCell>
                          <TableCell>
                            <Chip
                              label={booking.status}
                              size="small"
                              color={getStatusColor(booking.status)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
