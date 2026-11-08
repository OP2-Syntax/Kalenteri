import './App.css'
import { useState, type MouseEvent } from 'react';
import Calendar from './components/calendar/Calendar';
import LoginForm from './components/auth/LoginForm';
import FriendsPanel from './components/friends/FriendsPanel';
import { getToken, getUsername, logout } from './authApi';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Typography,
} from '@mui/material';

function App() {
  const [loggedIn, setLoggedIn] = useState(!!getToken());
  const [displayName, setDisplayName] = useState(
    () => getUsername() ?? 'User'
  );
  const [darkMode, setDarkMode] = useState(false);
  const [showFriends, setShowFriends] = useState(false);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);


  const handleLoggedIn = (username: string) => {
    setDisplayName(username);
    setLoggedIn(true);
  };

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    setDisplayName('User');
    setLoggedIn(false);
  }

  const handleDarkMode = () => {
    setDarkMode((prev) => !prev);
    handleMenuClose();
  }

  const handleFriends = () => {
    setShowFriends(true);
    handleMenuClose();
  }

  const avatarLetter = displayName.trim().charAt(0).toUpperCase() || 'U';

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  if (!loggedIn) {
    return <LoginForm onLoggedIn={handleLoggedIn} />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Profile avatar and account menu */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: 1.5,
        }}
      >
        <IconButton
          onClick={handleMenuOpen}
          size="large"
          aria-label="Open account menu"
          aria-haspopup="true"
          aria-expanded={menuOpen ? 'true' : undefined}
        >
          <Avatar
            sx={{
              width: 42,
              height: 42,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              fontWeight: 600,
            }}
          >
            {avatarLetter}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          slotProps={{
            paper: {
              sx: {
                minWidth: 210,
                mt: 1,
                borderRadius: 2,
                boxShadow: 4,
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600 }}
            >
              {displayName}
            </Typography>

          </Box>

          <Divider />

          <MenuItem onClick={handleFriends}>
            Kaverit
          </MenuItem>

          <MenuItem onClick={handleDarkMode}>
            {darkMode ? 'Light mode' : 'Dark mode'}
          </MenuItem>

          <Divider />

          <MenuItem
            onClick={handleLogout}
            sx={{ color: 'error.main' }}
          >
            Kirjaudu ulos
          </MenuItem>
        </Menu>
      </Box>
      <Calendar />
      <Dialog
        open={showFriends}
        onClose={() => setShowFriends(false)}
      >
        <DialogTitle>Kaverit</DialogTitle>
        <DialogContent>
          <FriendsPanel />
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  )
}

export default App