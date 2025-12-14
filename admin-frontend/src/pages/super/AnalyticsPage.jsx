import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { analyticsService } from '../../services/superApi';

function ChartCard({ title, data, color = '#DA6F2B', type = 'bar' }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="subtitle2" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 160, mt: 2 }}>
        {data.slice(-14).map((item, index) => (
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
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontSize: 9 }}>
              {item.date?.slice(5)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await analyticsService.getSummary(dateRange);
      setData(result);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = () => {
    if (!data) return;
    
    const csv = [
      ['Metric', 'Value'],
      ['Total Vendors', data.summary.total_vendors],
      ['Active Vendors', data.summary.active_vendors],
      ['Total Admins', data.summary.total_admins],
      ['Revenue (Period)', data.summary.daily_revenue],
      ['Commission Collected', data.summary.platform_commission_collected],
      ['Payouts Paid', data.summary.payouts_paid],
      ['Payouts Pending', data.summary.payouts_pending],
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateRange.from}-to-${dateRange.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          Platform Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            type="date"
            size="small"
            label="From"
            InputLabelProps={{ shrink: true }}
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
          />
          <TextField
            type="date"
            size="small"
            label="To"
            InputLabelProps={{ shrink: true }}
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
          />
          <Button variant="outlined" onClick={fetchData}>
            Apply
          </Button>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExport}>
            Export CSV
          </Button>
        </Box>
      </Box>

      {data && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Summary for {dateRange.from} to {dateRange.to}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
                {[
                  { label: 'Total Vendors', value: data.summary.total_vendors },
                  { label: 'Active Vendors', value: data.summary.active_vendors },
                  { label: 'Total Admins', value: data.summary.total_admins },
                  { label: 'Revenue', value: `₹${data.summary.daily_revenue?.toLocaleString()}` },
                  { label: 'Commission', value: `₹${data.summary.platform_commission_collected?.toLocaleString()}` },
                  { label: 'Payouts Paid', value: `₹${data.summary.payouts_paid?.toLocaleString()}` },
                  { label: 'Payouts Pending', value: `₹${data.summary.payouts_pending?.toLocaleString()}` },
                ].map((item) => (
                  <Box key={item.label}>
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <ChartCard
              title="Revenue Trend"
              data={data.trends?.revenue || []}
              color="#4CAF50"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <ChartCard
              title="Bookings Trend"
              data={data.trends?.bookings || []}
              color="#2196F3"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Vendor Distribution by Type
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {data.vendor_distribution?.by_type?.map((item) => (
                  <Chip
                    key={item.vendor_type}
                    label={`${item.vendor_type}: ${item.count}`}
                    color="primary"
                    variant="outlined"
                  />
                ))}
                {(!data.vendor_distribution?.by_type || data.vendor_distribution.by_type.length === 0) && (
                  <Typography color="text.secondary">No data available</Typography>
                )}
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Vendor Distribution by Status
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {data.vendor_distribution?.by_status?.map((item) => (
                  <Chip
                    key={item.status}
                    label={`${item.status}: ${item.count}`}
                    color={item.status === 'APPROVED' ? 'success' : item.status === 'PENDING' ? 'warning' : 'default'}
                    variant="outlined"
                  />
                ))}
                {(!data.vendor_distribution?.by_status || data.vendor_distribution.by_status.length === 0) && (
                  <Typography color="text.secondary">No data available</Typography>
                )}
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Top Vendors by Bookings
              </Typography>
              <Box sx={{ mt: 2 }}>
                {data.top_vendors?.map((vendor, index) => (
                  <Box
                    key={vendor.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1,
                      borderBottom: index < data.top_vendors.length - 1 ? 1 : 0,
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
                {(!data.top_vendors || data.top_vendors.length === 0) && (
                  <Typography color="text.secondary" textAlign="center" py={2}>
                    No vendor data available
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
