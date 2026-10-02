import './App.css'
import { useState } from 'react';
import Calendar from './components/calendar/Calendar';
import LoginForm from './components/auth/LoginForm';
import { getToken, logout } from './authApi';
import { Button } from '@mui/material';

function App() {
  const [loggedIn, setLoggedIn] = useState(!!getToken());

  const handleLogout = () => {
    logout();
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return <LoginForm onLoggedIn={() => setLoggedIn(true)} />;
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 8 }}>
        <Button onClick={handleLogout}>Kirjaudu ulos</Button>
      </div>
      <Calendar />
    </>
  )
}

export default App