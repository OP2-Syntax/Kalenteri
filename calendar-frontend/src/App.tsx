import './App.css'
import { EventCalendar } from '@mui/x-scheduler/event-calendar';
import type { SchedulerEvent } from '@mui/x-scheduler/models';
import React from 'react';

const defaultPreferences = {
  ampm: false,
  toggleAmpm: false,
  showWeekNumber: true,
  weekStartsOn: 1,
  showEmptyDaysInAgenda: false,
}

// Backendin palauttaman tapahtuman muoto (Event.java:n kentät)
interface BackendEvent {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

function App() {
  const [events, setEvents] = React.useState<SchedulerEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Haetaan tapahtumat backendistä komponentin latautuessa
  React.useEffect(() => {
    fetch('http://localhost:8080/api/events')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Palvelin vastasi virheellä: ' + response.status);
        }
        return response.json();
      })
      .then((data: BackendEvent[]) => {
        // muunnetaan backendin muoto SchedulerEventiksi
        const mapped: SchedulerEvent[] = data.map((e) => ({
          id: e.id,
          title: e.title,
          start: e.startTime,
          end: e.endTime,
        }));
        setEvents(mapped);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Ladataan tapahtumia...</p>;
  if (error) return <p>Virhe tapahtumien haussa: {error}</p>;

  return (
    <div style={{ height: 600, width: '100%' }}>
      <h1>Kalenteri</h1>

      {/* mui scheduler */}
      <EventCalendar
        events={events}
        onEventsChange={setEvents}
        defaultVisibleDate={new Date(2026, 8, 15)}
        defaultView='month'
        preferencesMenuConfig={{
          toggleAmpm: false,
          toggleEmptyDaysInAgenda: true,
          toggleWeekendVisibility: false,
          toggleWeekNumberVisibility: false,
        }}
      />
    </div>
  )
}

export default App