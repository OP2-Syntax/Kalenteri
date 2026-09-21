import type { SchedulerEvent } from '@mui/x-scheduler/models';

// Backendin palauttaman tapahtuman muoto (Event.java:n kentät)
interface BackendEvent {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

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

// export async function createEvent() {}
//POST

//export async function updateEvent() {}
//PUT

//export async function deleteEvent() {}
//DELETE