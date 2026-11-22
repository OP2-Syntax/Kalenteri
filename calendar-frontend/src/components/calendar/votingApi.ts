import { BACKEND_URL, getToken } from '../../authApi';
import type { Friend } from '../friends/friendsApi';
import { toCalendarEvent, type BackendEvent, type CalendarEvent, type VotingStatus } from './eventMapper';

// Yksi äänestettävä ajankohta tuloksineen
export interface TimeOption {
  id: number;
  startTime: string;
  endTime: string;
  votes: number;
  voters: Friend[];
}

export interface Voting {
  status: VotingStatus;
  canVote: boolean;
  myVoteOptionId: number | null;
  winnerOptionId: number | null;
  options: TimeOption[];
}

// uuden äänestyksen vaihtoehto (paikallinen aika ilman aikavyöhykettä)
export interface OptionInput {
  startTime: string;
  endTime: string;
}

export interface ConfirmResult {
  winnerOptionId: number;
  voting: Voting;
  event: CalendarEvent;
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// lukee backendin { message } -virheen, muuten käytetään yleistä viestiä
async function checkOk(response: Response, fallback: string) {
  if (response.ok) return;
  let message = `${fallback} (${response.status})`;
  try {
    const body = await response.json();
    if (body && typeof body.message === 'string') message = body.message;
  } catch {
    // vastauksessa ei ollut JSON-runkoa
  }
  throw new Error(message);
}

export async function getVoting(eventId: number): Promise<Voting> {
  const response = await fetch(`${BACKEND_URL}/api/events/${eventId}/voting`, { headers: authHeaders() });
  await checkOk(response, 'Loading the voting failed');
  return response.json();
}

// omistaja asettaa äänestettävät vaihtoehdot
export async function setVoting(eventId: number, options: OptionInput[]): Promise<Voting> {
  const response = await fetch(`${BACKEND_URL}/api/events/${eventId}/voting`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ options }),
  });
  await checkOk(response, 'Creating the voting failed');
  return response.json();
}

export async function vote(eventId: number, optionId: number): Promise<Voting> {
  const response = await fetch(`${BACKEND_URL}/api/events/${eventId}/voting/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ optionId }),
  });
  await checkOk(response, 'Voting failed');
  return response.json();
}

// omistaja vahvistaa ajan: backend valitsee eniten ääniä saaneen
export async function confirmVoting(eventId: number): Promise<ConfirmResult> {
  const response = await fetch(`${BACKEND_URL}/api/events/${eventId}/voting/confirm`, {
    method: 'POST',
    headers: authHeaders(),
  });
  await checkOk(response, 'Confirming the time failed');
  const body: { winnerOptionId: number; voting: Voting; event: BackendEvent } = await response.json();
  return { winnerOptionId: body.winnerOptionId, voting: body.voting, event: toCalendarEvent(body.event) };
}
