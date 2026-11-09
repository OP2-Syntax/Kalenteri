import type { SchedulerEvent } from '@mui/x-scheduler/models';
import { BACKEND_URL, getToken } from '../../authApi';
import type { Friend } from '../friends/friendsApi';

// Backendin palauttaman tapahtuman muoto (Event.java:n kentät)
interface BackendEvent {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  ownerUsername?: string;
  mine?: boolean;
  participants?: Friend[];
}

interface CreateEventData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  participantIds?: number[];
}

export interface CalendarEvent extends SchedulerEvent {
  description: string;
  ownerUsername?: string;
  mine?: boolean;
  participants?: Friend[];
}
  
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

   return data.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    start: event.startTime,
    end: event.endTime,
    ...(event.ownerUsername !== undefined ? { ownerUsername: event.ownerUsername } : {}),
    ...(event.mine !== undefined ? { mine: event.mine } : {}),
    ...(event.participants !== undefined ? { participants: event.participants } : {}),
  }));
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

  return {
    id: createdEvent.id,
    title: createdEvent.title,
    description: createdEvent.description,
    start: createdEvent.startTime,
    end: createdEvent.endTime,
    ...(createdEvent.ownerUsername !== undefined ? { ownerUsername: createdEvent.ownerUsername } : {}),
    ...(createdEvent.mine !== undefined ? { mine: createdEvent.mine } : {}),
    ...(createdEvent.participants !== undefined ? { participants: createdEvent.participants } : {}),
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

  return {
    id: updatedEvent.id,
    title: updatedEvent.title,
    description: updatedEvent.description,
    start: updatedEvent.startTime,
    end: updatedEvent.endTime,
    ...(updatedEvent.ownerUsername !== undefined ? { ownerUsername: updatedEvent.ownerUsername } : {}),
    ...(updatedEvent.mine !== undefined ? { mine: updatedEvent.mine } : {}),
    ...(updatedEvent.participants !== undefined ? { participants: updatedEvent.participants } : {}),
  };
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
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    start: event.startTime,
    end: event.endTime,
    ownerUsername: event.ownerUsername,
    mine: event.mine,
    participants: event.participants,
  };
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