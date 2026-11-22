import { BACKEND_URL, getToken } from '../../authApi';
import { toCalendarEvent, type BackendEvent, type CalendarEvent } from './eventMapper';

interface CreateEventData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  color?: string;
  participantIds?: number[];
}

export type { CalendarEvent } from './eventMapper';
  
// lisää Authorization-headerin, jos token löytyy
function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

//GET
export async function getEvents(): Promise<CalendarEvent[]> {
  const response = await fetch(`${BACKEND_URL}/api/events/shared`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      'Palvelin vastasi virheellä: ' + response.status
    );
  }

   const data: BackendEvent[] = await response.json();

  return data.map(toCalendarEvent);
}

//POST
export async function createEvent(event: CreateEventData): Promise<CalendarEvent> {
  const response = await fetch(`${BACKEND_URL}/api/events/shared`, {
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

  return toCalendarEvent(createdEvent);
}

//PUT
export async function updateEvent(
  id: number,
  event: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    color?: string;
  }
): Promise<CalendarEvent> {
  const response = await fetch(`${BACKEND_URL}/api/events/shared/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
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

  return toCalendarEvent(updatedEvent);
}

//DELETE
export async function deleteEvent(id:number): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/events/${id}`,
    {
      method: "DELETE",
      headers: {
        ...authHeaders(),
      }
    }
  );
  if (!response.ok) {
    throw new Error(
      "Tapahtuman poisto epäonnistui: " + response.status 
    );
  }
}

export async function addParticipant(eventId: number, userId: number): Promise<CalendarEvent> {
  const response = await fetch(`${BACKEND_URL}/api/events/${eventId}/participants/${userId}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error("Kaverin lisäys tapahtumaan epäonnistui: " + response.status);
  }
  const event: BackendEvent = await response.json();
  return toCalendarEvent(event);
}

export async function removeParticipant(eventId: number, userId: number): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/events/${eventId}/participants/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error("Osallistujan poisto epäonnistui: " + response.status);
  }
}