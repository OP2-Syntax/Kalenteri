import './App.css'
import { useState } from 'react';
import Calendar from './components/calendar/Calendar';
import LoginForm from './components/auth/LoginForm';
import FriendsPanel from './components/friends/FriendsPanel';
import { getToken, logout } from './authApi';
import {
  Button,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';

function App() {
  const [loggedIn, setLoggedIn] = useState(!!getToken());
  const [darkMode, setDarkMode] = useState(false);
  const [showFriends, setShowFriends] = useState(false);

  const handleLogout = () => {
    logout();
    setLoggedIn(false);
  };

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  if (!loggedIn) {
    return <LoginForm onLoggedIn={() => setLoggedIn(true)} />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          color: 'text.primary',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            padding: 8,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => setDarkMode((prev) => !prev)}
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </Button>

          {/* avaa kaverit-paneelin */}
          <Button variant="outlined" onClick={() => setShowFriends(true)}>
            Kaverit
          </Button>

          <Button onClick={handleLogout}>Kirjaudu ulos</Button>
        </div>

        <Calendar />

        <Dialog open={showFriends} onClose={() => setShowFriends(false)}>
          <DialogTitle>Kaverit</DialogTitle>
          <DialogContent>
            <FriendsPanel />
          </DialogContent>
        </Dialog>
      </Box>
    </ThemeProvider>
  )
}

export default App