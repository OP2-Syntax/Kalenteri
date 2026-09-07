import './App.css'
import { EventCalendar } from '@mui/x-scheduler/event-calendar';
import type { SchedulerEvent } from '@mui/x-scheduler/models';
import React from 'react';

//testidata kalenteriin
const initialEvents: SchedulerEvent[] = [
  {
    id: 1,
    title: 'Team Meeting',
    start: '2026-09-15T10:00:00',
    end: '2026-09-15T11:00:00',
  },
  {
    id: 2,
    title: 'Project Review',
    start: '2026-09-16T14:00:00',
    end: '2026-09-16T15:30:00',
  },
    {
    id: 3,
    title: 'Daily Scrum',
    start: '2026-09-23T09:00:00',
    end: '2026-09-23T09:30:00',
  }
];

const defaultPreferences = {
  ampm: false,
  toggleAmpm: false,
  showWeekNumber: true,
  weekStartsOn: 1,
  showEmptyDaysInAgenda: false,
}


function App() {
  const [events, setEvents] = React.useState<SchedulerEvent[]>(initialEvents);


  return (
    <div style={{ height: 600, width: '100%' }}>
      <h1>Kalenteri</h1>

      {/*mui scheduler*/}
      <EventCalendar 
        events={events}
        onEventsChange={setEvents}
        defaultVisibleDate={new Date(2026, 8, 15)}
        defaultView='month'
        defaultPreferences={defaultPreferences}
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
