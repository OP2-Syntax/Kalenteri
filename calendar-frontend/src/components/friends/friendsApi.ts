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
    throw new Error('Friend or request already exists');
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
  checkOk(response, 'Search failed');
  return response.json();
}

// kaverilista (vain hyväksytyt)
export async function getFriends(): Promise<Friend[]> {
  const response = await fetch(`${BACKEND_URL}/api/friends`, { headers: authHeaders() });
  checkOk(response, 'Friend list loading failed');
  return response.json();
}

// minulle saapuneet pyynnöt
export async function getIncomingRequests(): Promise<FriendRequest[]> {
  const response = await fetch(`${BACKEND_URL}/api/friends/requests/incoming`, { headers: authHeaders() });
  checkOk(response, 'Incoming requests loading failed');
  return response.json();
}

// minun lähettämäni pyynnöt
export async function getOutgoingRequests(): Promise<FriendRequest[]> {
  const response = await fetch(`${BACKEND_URL}/api/friends/requests/outgoing`, { headers: authHeaders() });
  checkOk(response, 'Sent requests loading failed');
  return response.json();
}

// kaveripyynnön lähetys käyttäjälle
export async function sendRequest(userId: number): Promise<FriendRequest> {
  const response = await fetch(`${BACKEND_URL}/api/friends/requests/${userId}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  checkOk(response, 'Friend request could not be sent');
  return response.json();
}

// saapuneen pyynnön hyväksyminen
export async function acceptRequest(requestId: number): Promise<Friend> {
  const response = await fetch(`${BACKEND_URL}/api/friends/requests/${requestId}/accept`, {
    method: 'POST',
    headers: authHeaders(),
  });
  checkOk(response, 'Friend request could not be accepted');
  return response.json();
}

// pyynnön poisto: lähettäjä peruu oman pyyntönsä, vastaanottaja hylkää saapuneen
export async function deleteRequest(requestId: number): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/friends/requests/${requestId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  checkOk(response, 'Friend request could not be deleted');
}

// kaverin poisto kaverilistalta (poistaa kaveruuden molemmilta osapuolilta)
export async function removeFriend(friendId: number): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/friends/${friendId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  checkOk(response, 'Friend could not be removed');
}