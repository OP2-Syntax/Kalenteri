import './App.css'
import { useState } from 'react';
import Calendar from './components/calendar/Calendar';
import LoginForm from './components/auth/LoginForm';
import { getToken, logout } from './authApi';
import {  Button,  ThemeProvider,  createTheme,  CssBaseline } from '@mui/material';

function App() {
  const [loggedIn, setLoggedIn] = useState(!!getToken());
  const [darkMode, setDarkMode] =useState (false);

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
        onClick={() => setDarkMode((prev)=>(!prev))}
        >
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </Button>
        <Button onClick={handleLogout}>Kirjaudu ulos</Button>
      </div>
      <Calendar />
      </ThemeProvider>
    
  )
}

export default App