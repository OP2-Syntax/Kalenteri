import { EventCalendar } from '@mui/x-scheduler/event-calendar';
//import type { SchedulerEvent } from '@mui/x-scheduler/models';
import { useEffect, useState } from 'react';
import { getEvents, createEvent, deleteEvent, updateEvent, type CalendarEvent } from './calendarApi';
import { defaultPreferences, preferencesMenuConfig } from './calendarPreferences';

import AddEventForm from './AddEventForm';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import { useEventCalendarApiRef } from '@mui/x-scheduler/use-event-calendar-api-ref';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
// korjaa kellonajan tapahtumaa luodessa kalenteria klikkaamalla
function toLocalDateTime(value: Date | string): string {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function Calendar() {
  const apiRef = useEventCalendarApiRef();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );

  const handleEventCreated = (newEvent: CalendarEvent) => {
    setEvents((prev) => [...prev, newEvent]);
    setOpen(false);
  };

  const handleEventsChange = async (newEvents: CalendarEvent[]) => {
    // Uusi tapahtuma lisätään
    const addedEvent = newEvents.find(
      (newEvent) =>
        !events.some((oldEvent) => oldEvent.id === newEvent.id)
    );

    if (addedEvent) {
      try {
        const savedEvent = await createEvent({
          title: addedEvent.title,
          description: addedEvent.description ?? '',
          startTime: toLocalDateTime(addedEvent.start),
          endTime: toLocalDateTime(addedEvent.end),
        });

        setEvents((prev) => [
          ...prev.filter((event) => event.id !== addedEvent.id),
          savedEvent,
        ]);
      } catch (error) {
        console.error("Tapahtuman tallennus epäonnistui: ", error)
      }
      return;
    }

    // Tapahtuman poiston tarkistus
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

    // Muuttuneen tapahtuman tarkistus
    const changedEvent = newEvents.find((newEvent) => {
      const oldEvent = events.find(
        (event) => event.id === newEvent.id
      );

      if (!oldEvent) {
        return false;
      }

      return (
        oldEvent.title !== newEvent.title ||
        oldEvent.description !== newEvent.description ||
        oldEvent.start !== newEvent.start ||
        oldEvent.end !== newEvent.end
      );
    });

    if (changedEvent) {
      try {
        await updateEvent(Number(changedEvent.id), {
          title: changedEvent.title,
          description: changedEvent.description ?? "",
          startTime: String(changedEvent.start),
          endTime: String(changedEvent.end)
        });
        setEvents(newEvents);
      } catch (error) {
        console.error("Tapahtuman muokkaaminen epäonnistui: ", error);
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

  // Kuukausivalitsimen avaaminen
  const handleOpenMonthPicker = () => {
    setSelectedYear(new Date().getFullYear());
    setMonthPickerOpen(true);
  };

  // Siirrytään valittuun kuukauteen
  const handleMonthSelect = (monthIndex: number) => {
    apiRef.current?.setVisibleDate({
      visibleDate: new Date(selectedYear, monthIndex, 1),
    });

    setMonthPickerOpen(false);
  };

  // latausviesti
  if (loading) return <p>Loading events...</p>;
  if (error) return <p>Error loading events: {error}</p>;

  return (
    <Box sx={{ height: 850, width: '100%' }}>
      <Typography variant="h4" component="h1">
        Calendar
      </Typography>

      {/*Avaa addEventFormin*/}
      <Box sx={{ display: 'flex', gap: 1, my: 2 }}>
        <Button
          variant="contained"
          onClick={() => setOpen(true)}
        >
          Add Event
        </Button>

        <Button
          variant="outlined"
          onClick={handleOpenMonthPicker}
        >
          Choose Month
        </Button>
      </Box>

      {/* mui scheduler */}
      <EventCalendar
        apiRef={apiRef}
        events={events}
        onEventsChange={handleEventsChange}
        defaultView='month'
        areEventsDraggable={false}
        defaultPreferences={defaultPreferences}
        preferencesMenuConfig={preferencesMenuConfig}
        eventCreation={{ interaction: "double-click", duration: 60 }}
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

      {/* Kuukauden valinta */}
      <Dialog
        open={monthPickerOpen}
        onClose={() => setMonthPickerOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Choose a month</DialogTitle>

        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <IconButton
              aria-label="Previous year"
              onClick={() =>
                setSelectedYear((year) => year - 1)
              }
            >
              ‹
            </IconButton>

            <Typography variant="h6">
              {selectedYear}
            </Typography>

            <IconButton
              aria-label="Next year"
              onClick={() =>
                setSelectedYear((year) => year + 1)
              }
            >
              ›
            </IconButton>
          </Box>

          <Grid container spacing={1}>
            {MONTHS.map((month, index) => (
              <Grid key={month} size={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleMonthSelect(index)}
                  sx={{ minHeight: 40 }}
                >
                  {month}
                </Button>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Calendar;