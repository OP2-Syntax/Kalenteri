import { EventCalendar } from '@mui/x-scheduler/event-calendar';
import type { SchedulerEvent } from '@mui/x-scheduler/models';
import React from 'react';
import { getEvents } from './calendarApi';
import { defaultPreferences, preferencesMenuConfig } from './calendarPreferences';




function Calendar() {
  const [events, setEvents] = React.useState<SchedulerEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Haetaan tapahtumat backendistä komponentin latautuessa
  React.useEffect(() => {
    getEvents()
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
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
        defaultView='month'
        areEventsDraggable={false}
        defaultPreferences={defaultPreferences}
        preferencesMenuConfig={preferencesMenuConfig}
      />
    </div>
  )
}

export default Calendar