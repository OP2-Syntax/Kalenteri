import { BACKEND_URL, getToken } from '../../authApi';

// Backendin palauttama käyttäjä (UserDto: vain id ja käyttäjänimi)
export interface Friend {
  id: number;
  username: string;
}

// Kaveripyyntö: pyynnön id ja toinen osapuoli
// (saapuneissa lähettäjä, lähetetyissä vastaanottaja)
export interface FriendRequest {
  id: number;
  user: Friend;
}

// lisää Authorization-headerin, jos token löytyy
function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// yhteinen virheenkäsittely
function checkOk(response: Response, errorMessage: string) {
  if (response.status === 409) {
    throw new Error('Kaveri tai pyyntö on jo olemassa');
  }
  if (!response.ok) {
    throw new Error(errorMessage + ' (' + response.status + ')');
  }
}

// käyttäjien haku käyttäjänimellä
export async function searchUsers(query: string): Promise<Friend[]> {
  const response = await fetch(
    `${BACKEND_URL}/api/users/search?q=${encodeURIComponent(query)}`,
    { headers: authHeaders() }
  );
  checkOk(response, 'Haku epäonnistui');
  return response.json();
}

// kaverilista (vain hyväksytyt)
export async function getFriends(): Promise<Friend[]> {
  const response = await fetch(`${BACKEND_URL}/api/friends`, { headers: authHeaders() });
  checkOk(response, 'Kaverilistan haku epäonnistui');
  return response.json();
}

// minulle saapuneet pyynnöt
export async function getIncomingRequests(): Promise<FriendRequest[]> {
  const response = await fetch(`${BACKEND_URL}/api/friends/requests/incoming`, { headers: authHeaders() });
  checkOk(response, 'Saapuneiden pyyntöjen haku epäonnistui');
  return response.json();
}

// minun lähettämäni pyynnöt
export async function getOutgoingRequests(): Promise<FriendRequest[]> {
  const response = await fetch(`${BACKEND_URL}/api/friends/requests/outgoing`, { headers: authHeaders() });
  checkOk(response, 'Lähetettyjen pyyntöjen haku epäonnistui');
  return response.json();
}

// kaveripyynnön lähetys käyttäjälle
export async function sendRequest(userId: number): Promise<FriendRequest> {
  const response = await fetch(`${BACKEND_URL}/api/friends/requests/${userId}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  checkOk(response, 'Pyynnön lähetys epäonnistui');
  return response.json();
}

// saapuneen pyynnön hyväksyminen
export async function acceptRequest(requestId: number): Promise<Friend> {
  const response = await fetch(`${BACKEND_URL}/api/friends/requests/${requestId}/accept`, {
    method: 'POST',
    headers: authHeaders(),
  });
  checkOk(response, 'Pyynnön hyväksyminen epäonnistui');
  return response.json();
}

// pyynnön poisto: lähettäjä peruu oman pyyntönsä, vastaanottaja hylkää saapuneen
export async function deleteRequest(requestId: number): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/friends/requests/${requestId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  checkOk(response, 'Pyynnön poisto epäonnistui');
}