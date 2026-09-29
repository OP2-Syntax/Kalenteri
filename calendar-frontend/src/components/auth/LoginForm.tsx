import { useState } from 'react';
import { Button, TextField, Box, Typography, Tabs, Tab } from '@mui/material';
import { login, register, saveToken } from '../../authApi';

interface LoginFormProps {
  onLoggedIn: () => void;
}

function LoginForm({ onLoggedIn }: LoginFormProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const token =
        mode === 'login'
          ? await login(username, password)
          : await register(username, email, password);

      saveToken(token);
      onLoggedIn();
    } catch {
      setError(mode === 'login' ? 'Väärä käyttäjätunnus tai salasana' : 'Rekisteröinti epäonnistui');
    }
  };

  return (
    <Box sx={{ maxWidth: 360, margin: '80px auto', padding: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Kalenteri</Typography>

      <Tabs value={mode} onChange={(_, value) => setMode(value)} sx={{ mb: 2 }}>
        <Tab label="Kirjaudu" value="login" />
        <Tab label="Rekisteröidy" value="register" />
      </Tabs>

      <form onSubmit={handleSubmit}>
        <TextField
          label="Käyttäjätunnus"
          fullWidth
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        {mode === 'register' && (
          <TextField
            label="Sähköposti"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        )}

        <TextField
          label="Salasana"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <Typography color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}

        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          {mode === 'login' ? 'Kirjaudu' : 'Rekisteröidy'}
        </Button>
      </form>
    </Box>
  );
}

export default LoginForm;