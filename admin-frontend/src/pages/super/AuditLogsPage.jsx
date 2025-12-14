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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Pagination,
} from '@mui/material';
import { Visibility as ViewIcon, Close as CloseIcon } from '@mui/icons-material';
import { auditLogService } from '../../services/superApi';

const actorColors = {
  SUPERADMIN: 'warning',
  ADMIN: 'primary',
  VENDOR: 'success',
  SYSTEM: 'default',
};

const actionColors = {
  create: 'success',
  update: 'info',
  delete: 'error',
  login: 'primary',
  logout: 'default',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    actor_type: '',
    entity_type: '',
    date: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (filters.actor_type) params.actor_type = filters.actor_type;
      if (filters.entity_type) params.entity_type = filters.entity_type;
      if (filters.date) params.date = filters.date;

      const data = await auditLogService.getAll(params);
      setLogs(data.results || data);
      setTotalPages(Math.ceil((data.count || data.length) / 10));
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
    setPage(1);
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Audit Logs
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Actor Type</InputLabel>
            <Select
              value={filters.actor_type}
              label="Actor Type"
              onChange={(e) => handleFilterChange('actor_type', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="SUPERADMIN">Super Admin</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
              <MenuItem value="VENDOR">Vendor</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Entity Type</InputLabel>
            <Select
              value={filters.entity_type}
              label="Entity Type"
              onChange={(e) => handleFilterChange('entity_type', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Vendor">Vendor</MenuItem>
              <MenuItem value="AdminUser">Admin User</MenuItem>
              <MenuItem value="Booking">Booking</MenuItem>
              <MenuItem value="Offer">Offer</MenuItem>
              <MenuItem value="SystemConfig">System Config</MenuItem>
              <MenuItem value="CommissionOverride">Commission</MenuItem>
            </Select>
          </FormControl>
          <TextField
            type="date"
            size="small"
            label="Date"
            InputLabelProps={{ shrink: true }}
            value={filters.date}
            onChange={(e) => handleFilterChange('date', e.target.value)}
          />
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Resource ID</TableCell>
                  <TableCell align="right">Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(log.created_at).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.action}
                        size="small"
                        color={actionColors[log.action] || 'default'}
                      />
                    </TableCell>
                    <TableCell>{log.resource}</TableCell>
                    <TableCell>{log.resource_id || '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => setSelectedLog(log)}>
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary" py={4}>
                        No audit logs found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, v) => setPage(v)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      <Dialog open={!!selectedLog} onClose={() => setSelectedLog(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Audit Log Details
          <IconButton onClick={() => setSelectedLog(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Timestamp</Typography>
                  <Typography>{new Date(selectedLog.created_at).toLocaleString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">User</Typography>
                  <Typography>{selectedLog.user}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Action</Typography>
                  <Typography>{selectedLog.action}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Resource</Typography>
                  <Typography>{selectedLog.resource} {selectedLog.resource_id && `#${selectedLog.resource_id}`}</Typography>
                </Box>
                {selectedLog.ip_address && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">IP Address</Typography>
                    <Typography>{selectedLog.ip_address}</Typography>
                  </Box>
                )}
              </Box>
              
              {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Old Values</Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>
                      {JSON.stringify(selectedLog.old_values, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}
              
              {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>New Values</Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>
                      {JSON.stringify(selectedLog.new_values, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}
              
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Additional Details</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
