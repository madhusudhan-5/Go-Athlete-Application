import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme as useMuiTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Person as ProfileIcon,
  Palette as ThemeIcon,
  Notifications as NotificationsIcon,
  Lock as PasswordIcon,
  Percent as CommissionIcon,
} from '@mui/icons-material';

const menuItems = [
  { label: 'Profile', icon: <ProfileIcon />, path: '/admin/settings/profile' },
  { label: 'Appearance', icon: <ThemeIcon />, path: '/admin/settings/appearance' },
  { label: 'Notifications', icon: <NotificationsIcon />, path: '/admin/settings/notifications' },
  { label: 'Change Password', icon: <PasswordIcon />, path: '/admin/settings/password' },
  { label: 'Commission Config', icon: <CommissionIcon />, path: '/admin/settings/commissions' },
];

export default function SettingsPage() {
  const muiTheme = useMuiTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const showContent = location.pathname !== '/admin/settings' || !isMobile;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Settings
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: isMobile ? 'column' : 'row' }}>
        <Card sx={{ minWidth: 240, height: 'fit-content' }}>
          <List>
            {menuItems.map((item, index) => (
              <ListItem key={item.label} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    my: 0.5,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Card>

        {showContent && (
          <Box sx={{ flex: 1 }}>
            <Outlet />
          </Box>
        )}
      </Box>
    </Box>
  );
}
