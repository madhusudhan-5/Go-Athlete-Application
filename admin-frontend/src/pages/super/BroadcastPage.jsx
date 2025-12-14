import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { broadcastService } from '../../services/superApi';

const targetLabels = {
  ALL_VENDORS: 'All Vendors',
  ALL_ADMINS: 'All Admins',
  ALL: 'Everyone',
};

const priorityColors = {
  LOW: 'default',
  NORMAL: 'primary',
  HIGH: 'warning',
  URGENT: 'error',
};

export default function BroadcastPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    target: 'ALL',
    priority: 'NORMAL',
  });

  const fetchMessages = async () => {
    try {
      const data = await broadcastService.getAll();
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSend = async () => {
    if (!formData.title || !formData.body) {
      setError('Please fill in title and message body');
      return;
    }

    setSending(true);
    try {
      await broadcastService.create(formData);
      setSuccess(true);
      setFormData({ title: '', body: '', target: 'ALL', priority: 'NORMAL' });
      fetchMessages();
    } catch (err) {
      setError('Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Broadcast Messenger
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Create Broadcast
              </Typography>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Message Body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                margin="normal"
                multiline
                rows={4}
              />
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Target Audience</InputLabel>
                    <Select
                      value={formData.target}
                      label="Target Audience"
                      onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    >
                      <MenuItem value="ALL">Everyone</MenuItem>
                      <MenuItem value="ALL_VENDORS">All Vendors</MenuItem>
                      <MenuItem value="ALL_ADMINS">All Admins</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={formData.priority}
                      label="Priority"
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <MenuItem value="LOW">Low</MenuItem>
                      <MenuItem value="NORMAL">Normal</MenuItem>
                      <MenuItem value="HIGH">High</MenuItem>
                      <MenuItem value="URGENT">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SendIcon />}
                onClick={handleSend}
                disabled={sending}
                sx={{ mt: 3, bgcolor: 'warning.main', '&:hover': { bgcolor: 'warning.dark' } }}
              >
                {sending ? <CircularProgress size={24} /> : 'Send Broadcast'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Broadcasts
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Target</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Sent By</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {messages.map((msg) => (
                        <TableRow key={msg.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {msg.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                              {msg.body}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={targetLabels[msg.target] || msg.target} size="small" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={msg.priority}
                              size="small"
                              color={priorityColors[msg.priority] || 'default'}
                            />
                          </TableCell>
                          <TableCell>{msg.created_by_name || '-'}</TableCell>
                          <TableCell>
                            {new Date(msg.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {messages.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography color="text.secondary" py={4}>
                              No broadcasts sent yet
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        message="Broadcast sent successfully"
      />
    </Box>
  );
}
