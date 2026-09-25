import type { SchedulerEvent } from '@mui/x-scheduler/models';

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

//GET
export async function getEvents(): Promise<SchedulerEvent[]> {
  const response = await fetch('http://localhost:8080/api/events');

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
  const response = await fetch('http://localhost:8080/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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