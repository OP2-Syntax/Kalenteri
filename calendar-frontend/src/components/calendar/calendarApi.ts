import type { SchedulerEvent } from '@mui/x-scheduler/models';
import { getToken } from '../../authApi';

// Backendin palauttaman tapahtuman muoto (Event.java:n kentät)
interface BackendEvent {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

interface CreateEventData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

const BACKEND_URL = 'https://kalenteri-calendar-app-backend.2.rahtiapp.fi';

// lisää Authorization-headerin, jos token löytyy
function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

//GET
export async function getEvents(): Promise<SchedulerEvent[]> {
  const response = await fetch(`${BACKEND_URL}/api/events`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      'Palvelin vastasi virheellä: ' + response.status
    );
  }

   const data: BackendEvent[] = await response.json();

   return data.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.startTime,
    end: event.endTime,
  }));
}

//POST
export async function createEvent(event: CreateEventData): Promise<SchedulerEvent> {
  const response = await fetch(`${BACKEND_URL}/api/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error(
      "Tapahtuman lisäys epäonnistui:" + response.status
    );
  }

  const createdEvent: BackendEvent = await response.json();

  return {
    id: createdEvent.id,
    title: createdEvent.title,
    start: createdEvent.startTime,
    end: createdEvent.endTime,
  };
}

//export async function updateEvent() {}
//PUT

//export async function deleteEvent() {}
//DELETE