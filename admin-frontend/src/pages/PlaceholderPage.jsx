import { Box, Typography, Card, CardContent } from '@mui/material';
import { Construction as ConstructionIcon } from '@mui/icons-material';

export default function PlaceholderPage({ title }) {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        {title}
      </Typography>
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <ConstructionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This feature is under development.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
