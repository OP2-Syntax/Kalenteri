import { EventCalendar } from '@mui/x-scheduler/event-calendar';
import type { SchedulerEvent } from '@mui/x-scheduler/models';
import { useEffect, useState } from 'react';
import { getEvents, deleteEvent } from './calendarApi';
import { defaultPreferences, preferencesMenuConfig } from './calendarPreferences';

import AddEventForm from './AddEventForm';
import { Button, Dialog, DialogTitle } from '@mui/material';




function Calendar() {
  const [events, setEvents] = useState<SchedulerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false)

  const handleEventCreated = (newEvent: SchedulerEvent) => {
    setEvents((prev) => [...prev, newEvent]);
    setOpen(false)
  }

  const handleEventsChange = async (newEvents: SchedulerEvent[]) => {
    const deletedEvent = events.find(
      (oldEvent) => 
        !newEvents.some((newEvent) => newEvent.id === oldEvent.id)
    );

    if (deletedEvent) {
      try {
        await deleteEvent(Number(deletedEvent.id));
        setEvents(newEvents);
      } catch (error) {
        console.error("Tapahtuman poisto epäonnistui: ", error);
      }
      return;
    }
    setEvents(newEvents);
  };

  // Haetaan tapahtumat backendistä komponentin latautuessa
  useEffect(() => {
    getEvents()
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // latausviesti
  if (loading) return <p>Ladataan tapahtumia...</p>;
  if (error) return <p>Virhe tapahtumien haussa: {error}</p>;

  return (
    <div style={{ height: 600, width: '100%' }}>
      <h1>Kalenteri</h1>

      {/*Avaa addEventFormin*/}
      <Button
        variant="contained"
        onClick={() => setOpen(true)}
      >
        Add Event
      </Button>

      {/* mui scheduler */}
      <EventCalendar
        events={events}
        onEventsChange={handleEventsChange}
        defaultView='month'
        areEventsDraggable={false}
        defaultPreferences={defaultPreferences}
        preferencesMenuConfig={preferencesMenuConfig}
        eventCreation={false}
      />

      <Dialog
        maxWidth={'lg'}
        open={open}
        onClose={() => setOpen(false)}
      >
        <DialogTitle>Add New Event to Calendar</DialogTitle>
        <AddEventForm
          onCreated={handleEventCreated}
          onCancel={() => setOpen(false)}
        />
      </Dialog>
    </div>
  )
}

export default Calendar