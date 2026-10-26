import { useEffect, useRef, useState } from 'react';
import { Button, TextField, Box, Typography, Tabs, Tab, Divider } from '@mui/material';
import { login, loginWithGoogle, register, saveToken } from '../../authApi';

interface LoginFormProps {
  onLoggedIn: () => void;
}

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (
        element: HTMLElement,
        options: {
          theme: string;
          size: string;
          text: string;
          shape: string;
          width: number;
        }
      ) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

function LoginForm({ onLoggedIn }: LoginFormProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== 'login') {
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setError('Google sign-in is not configured.');
      return;
    }

    let cancelled = false;

    const initializeGoogleSignIn = () => {
      if (cancelled || !window.google || !googleButtonRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: GoogleCredentialResponse) => {
          setError(null);

          try {
            const token = await loginWithGoogle(response.credential);
            saveToken(token);
            onLoggedIn();
          } catch {
            setError('Google sign-in failed. Please try again.');
          }
        },
      });

      googleButtonRef.current.innerHTML = '';

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: 300,
      });
    };

    if (window.google) {
      initializeGoogleSignIn();
    } else {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://accounts.google.com/gsi/client"]'
      );

      const script =
        existingScript ?? document.createElement('script');

      if (!existingScript) {
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      script.addEventListener('load', initializeGoogleSignIn);
    }

    return () => {
      cancelled = true;
      const script = document.querySelector<HTMLScriptElement>(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      script?.removeEventListener('load', initializeGoogleSignIn);
    };
  }, [mode, onLoggedIn]);


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

{mode === 'login' && (
        <>
          <Divider sx={{ my: 3 }}>OR</Divider>

       <Box
            ref={googleButtonRef}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              minHeight: 40,
            }}
          />
        </>
      )}
    </Box>
  );
}

export default LoginForm;