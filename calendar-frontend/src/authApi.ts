const BACKEND_URL = 'https://kalenteri-calendar-app-backend.2.rahtiapp.fi';

interface AuthResponse {
  token: string;
}

// kirjautuminen
export async function login(username: string, password: string): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error('Kirjautuminen epäonnistui');
  }

  const data: AuthResponse = await response.json();
  return data.token;
}

// rekisteröinti
export async function register(username: string, email: string, password: string): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    throw new Error('Rekisteröinti epäonnistui');
  }

  const data: AuthResponse = await response.json();
  return data.token;
}

// token tallennetaan selaimen localStorageen, jotta kirjautuminen säilyy sivun päivityksessä
export function saveToken(token: string) {
  localStorage.setItem('token', token);
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function logout() {
  localStorage.removeItem('token');
}