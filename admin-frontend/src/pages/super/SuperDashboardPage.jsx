import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  People as PeopleIcon,
  Store as StoreIcon,
  TrendingUp as TrendingUpIcon,
  Payments as PaymentsIcon,
  Percent as PercentIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { analyticsService } from '../../services/superApi';

function KpiCard({ title, value, icon, color = 'primary', subtitle }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: `${color}.light`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function TrendChart({ data, title, color = '#DA6F2B' }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="subtitle2" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 120, mt: 2 }}>
        {data.map((item, index) => (
          <Box
            key={index}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                width: '100%',
                height: `${(item.value / maxValue) * 100}%`,
                minHeight: 4,
                bgcolor: color,
                borderRadius: 1,
                transition: 'height 0.3s',
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {item.date?.slice(5) || item.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

export default function SuperDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const from = new Date(today);
        from.setDate(from.getDate() - parseInt(period));
        
        const result = await analyticsService.getSummary({
          from: from.toISOString().split('T')[0],
          to: today.toISOString().split('T')[0],
        });
        setData(result);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="error">Failed to load analytics data</Typography>
      </Box>
    );
  }

  const { summary, trends, top_vendors, vendor_distribution } = data;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Platform Overview
        </Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={period}
            label="Time Period"
            onChange={(e) => setPeriod(e.target.value)}
          >
            <MenuItem value="7">Last 7 days</MenuItem>
            <MenuItem value="30">Last 30 days</MenuItem>
            <MenuItem value="90">Last 90 days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <KpiCard
            title="Total Vendors"
            value={summary.total_vendors}
            icon={<StoreIcon sx={{ color: 'primary.main' }} />}
            color="primary"
            subtitle={`${summary.active_vendors} active`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KpiCard
            title="Total Admins"
            value={summary.total_admins}
            icon={<AdminIcon sx={{ color: 'warning.main' }} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KpiCard
            title="Revenue (Period)"
            value={`₹${summary.daily_revenue?.toLocaleString() || 0}`}
            icon={<TrendingUpIcon sx={{ color: 'success.main' }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KpiCard
            title="Commission Collected"
            value={`₹${summary.platform_commission_collected?.toLocaleString() || 0}`}
            icon={<PercentIcon sx={{ color: 'info.main' }} />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KpiCard
            title="Payouts Paid"
            value={`₹${summary.payouts_paid?.toLocaleString() || 0}`}
            icon={<PaymentsIcon sx={{ color: 'success.main' }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KpiCard
            title="Payouts Pending"
            value={`₹${summary.payouts_pending?.toLocaleString() || 0}`}
            icon={<PaymentsIcon sx={{ color: 'warning.main' }} />}
            color="warning"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TrendChart
            data={trends?.revenue || []}
            title="Revenue Trend"
            color="#4CAF50"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TrendChart
            data={trends?.bookings || []}
            title="Bookings Trend"
            color="#2196F3"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Vendor Distribution by Type
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {vendor_distribution?.by_type?.map((item) => (
                <Chip
                  key={item.vendor_type}
                  label={`${item.vendor_type}: ${item.count}`}
                  variant="outlined"
                  color="primary"
                />
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Vendor Distribution by Status
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {vendor_distribution?.by_status?.map((item) => (
                <Chip
                  key={item.status}
                  label={`${item.status}: ${item.count}`}
                  variant="outlined"
                  color={item.status === 'APPROVED' ? 'success' : item.status === 'PENDING' ? 'warning' : 'default'}
                />
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Top Vendors by Bookings
            </Typography>
            <Box sx={{ mt: 2 }}>
              {top_vendors?.map((vendor, index) => (
                <Box
                  key={vendor.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1,
                    borderBottom: index < top_vendors.length - 1 ? 1 : 0,
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip label={index + 1} size="small" color="warning" />
                    <Typography>{vendor.business_name}</Typography>
                  </Box>
                  <Typography color="text.secondary">
                    {vendor.total_bookings} bookings
                  </Typography>
                </Box>
              ))}
              {(!top_vendors || top_vendors.length === 0) && (
                <Typography color="text.secondary" textAlign="center" py={2}>
                  No vendor data available
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
