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

export interface CalendarEvent extends SchedulerEvent {
  description: string;
}
  
// lisää Authorization-headerin, jos token löytyy
function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

//GET
export async function getEvents(): Promise<CalendarEvent[]> {
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
    description: event.description,
    start: event.startTime,
    end: event.endTime,
  }));
}

//POST
export async function createEvent(event: CreateEventData): Promise<CalendarEvent> {
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
    description: createdEvent.description,
    start: createdEvent.startTime,
    end: createdEvent.endTime,
  };
}

//PUT
export async function updateEvent(
  id: number,
  event: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
  }
): Promise<CalendarEvent> {
  const response = await fetch(`${BACKEND_URL}/api/events/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event)
    }
  );
  if (!response.ok) {
    throw new Error(
      "Tapahtuman päivitys epäonnistui: " + response.status
    );
  }
  const updatedEvent: BackendEvent = await response.json();

  return {
    id: updatedEvent.id,
    title: updatedEvent.title,
    description: updatedEvent.description,
    start: updatedEvent.startTime,
    end: updatedEvent.endTime,
  };
}

//DELETE
export async function deleteEvent(id:number): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/events/${id}`,
    {
      method: "DELETE",
    }
  );
  if (!response.ok) {
    throw new Error(
      "Tapahtuman poisto epäonnistui: " + response.status 
    );
  }
}