import { EventCalendar } from '@mui/x-scheduler/event-calendar';
import type { SchedulerEvent } from '@mui/x-scheduler/models';
import React, { useState } from 'react';
import { getEvents } from './calendarApi';
import { defaultPreferences, preferencesMenuConfig } from './calendarPreferences';

import AddEventForm from './AddEventForm';
import { Button, Dialog, DialogTitle } from '@mui/material';




function Calendar() {
  const [events, setEvents] = React.useState<SchedulerEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [open, setOpen] = React.useState(false)

  const handleEventCreated = (newEvent: SchedulerEvent) => {
    setEvents((prev) => [...prev, newEvent]);
    setOpen(false)
  }

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
      
      <Button
        variant="contained"
        onClick={() => setOpen(true)}
        >
          Add Event
        </Button>

      {/* mui scheduler */}
      <EventCalendar
        events={events}
        onEventsChange={setEvents}
        defaultView='month'
        areEventsDraggable={false}
        defaultPreferences={defaultPreferences}
        preferencesMenuConfig={preferencesMenuConfig}
      />

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
      >
        <DialogTitle>Lisää tapahtuma</DialogTitle>
        <AddEventForm
          onCreated={handleEventCreated}
          onCancel={() => setOpen(false)}
        />
      </Dialog>
    </div>
  )
}

export default Calendar