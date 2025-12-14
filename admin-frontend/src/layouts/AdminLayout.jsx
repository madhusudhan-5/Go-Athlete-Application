import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme as useMuiTheme,
  Tooltip,
  InputBase,
  alpha,
  Badge,
  Collapse,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Store as StoreIcon,
  VerifiedUser as KycIcon,
  Event as BookingsIcon,
  CardMembership as MembershipIcon,
  Payment as PayoutIcon,
  LocalOffer as OfferIcon,
  Inventory as ProductIcon,
  Sports as CoachIcon,
  SupportAgent as TicketIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  ChevronLeft as ChevronLeftIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const DRAWER_WIDTH = 260;
const MINI_DRAWER_WIDTH = 72;

const navItems = [
  { title: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
  { title: 'Vendors', icon: <StoreIcon />, path: '/admin/vendors' },
  { title: 'KYC', icon: <KycIcon />, path: '/admin/kyc' },
  { title: 'Bookings', icon: <BookingsIcon />, path: '/admin/bookings' },
  { title: 'Memberships', icon: <MembershipIcon />, path: '/admin/memberships' },
  { title: 'Payouts', icon: <PayoutIcon />, path: '/admin/payouts' },
  { title: 'Offers & Promotions', icon: <OfferIcon />, path: '/admin/offers' },
  { title: 'Products', icon: <ProductIcon />, path: '/admin/products' },
  { title: 'Coaches', icon: <CoachIcon />, path: '/admin/coaches' },
  { title: 'Tickets', icon: <TicketIcon />, path: '/admin/tickets' },
  { title: 'Reports & Analytics', icon: <AnalyticsIcon />, path: '/admin/reports' },
  { title: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
];

export default function AdminLayout() {
  const muiTheme = useMuiTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const isDesktop = useMediaQuery(muiTheme.breakpoints.up('lg'));
  const isTablet = useMediaQuery(muiTheme.breakpoints.between('md', 'lg'));
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [miniDrawer, setMiniDrawer] = useState(isTablet);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setMiniDrawer(!miniDrawer);
    }
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    navigate('/admin/login');
  };

  const handleNavClick = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: miniDrawer && !isMobile ? 'center' : 'space-between',
          px: 2,
        }}
      >
        {(!miniDrawer || isMobile) && (
          <Typography variant="h6" noWrap sx={{ fontWeight: 700, color: 'primary.main' }}>
            Admin Console
          </Typography>
        )}
        {!isMobile && (
          <IconButton onClick={handleDrawerToggle} size="small">
            <ChevronLeftIcon sx={{ transform: miniDrawer ? 'rotate(180deg)' : 'none' }} />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, px: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <ListItem key={item.title} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={miniDrawer && !isMobile ? item.title : ''} placement="right">
                <ListItemButton
                  onClick={() => handleNavClick(item.path)}
                  sx={{
                    minHeight: 48,
                    borderRadius: 2,
                    justifyContent: miniDrawer && !isMobile ? 'center' : 'flex-start',
                    px: 2.5,
                    bgcolor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'primary.contrastText' : 'text.primary',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.dark' : alpha(muiTheme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: miniDrawer && !isMobile ? 0 : 2,
                      justifyContent: 'center',
                      color: isActive ? 'primary.contrastText' : 'text.secondary',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {(!miniDrawer || isMobile) && <ListItemText primary={item.title} />}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  const drawerWidth = miniDrawer && !isMobile ? MINI_DRAWER_WIDTH : DRAWER_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: alpha(muiTheme.palette.primary.main, 0.05),
              borderRadius: 2,
              px: 2,
              py: 0.5,
              flex: 1,
              maxWidth: 400,
            }}
          >
            <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            <InputBase
              placeholder="Search vendors, bookings, tickets..."
              sx={{ flex: 1 }}
              onClick={() => navigate('/admin/search')}
            />
          </Box>

          <Box sx={{ flex: 1 }} />

          <IconButton onClick={toggleTheme} color="inherit" sx={{ ml: 1 }}>
            {isDark ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>

          <IconButton color="inherit" sx={{ ml: 1 }}>
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton
            onClick={handleProfileMenuOpen}
            sx={{ ml: 2 }}
          >
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
              {user?.name?.charAt(0) || 'A'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/admin/settings/profile'); }}>
              <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/admin/settings'); }}>
              <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              transition: muiTheme.transitions.create('width', {
                easing: muiTheme.transitions.easing.sharp,
                duration: muiTheme.transitions.duration.enteringScreen,
              }),
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
