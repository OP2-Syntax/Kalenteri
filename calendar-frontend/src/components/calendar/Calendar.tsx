import { EventCalendar } from '@mui/x-scheduler/event-calendar';
//import type { SchedulerEvent } from '@mui/x-scheduler/models';
import { useCallback, useEffect, useState } from 'react';
import { getEvents, createEvent, deleteEvent, updateEvent, type CalendarEvent } from './calendarApi';
import { defaultPreferences, preferencesMenuConfig } from './calendarPreferences';
import { type ComponentProps, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';

import AddEventForm from './AddEventForm';
import EventParticipantsDialog from './EventParticipantsDialog';
import VotingDialog from './VotingDialog';
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

function Calendar({ headerActions }: { headerActions?: ReactNode }) {
  const apiRef = useEventCalendarApiRef();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [eventFormKey, setEventFormKey] = useState(0);
  const [initialEventTimes, setInitialEventTimes] = useState<{
    startTime?: string;
    endTime?: string;
  }>({});
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [votingOpen, setVotingOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );
  const [view, setView] = useState<ComponentProps<typeof EventCalendar>['view']>('month');

  // Etsii kuukausiotsikon ("October 2026") klikatusta kohdasta
  const findMonthTitle = (start: HTMLElement): HTMLElement | null => {
    const monthTitleRegex = new RegExp(`^(${MONTHS.join('|')}) \\d{4}$`);
    let el: HTMLElement | null = start;

    for (let i = 0; i < 3 && el; i++) {
      const ownText = Array.from(el.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent ?? '')
        .join('')
        .trim();

      const fullText = el.textContent?.trim() ?? '';

      if (monthTitleRegex.test(ownText) || monthTitleRegex.test(fullText)) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  };

  const handleCalendarClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (findMonthTitle(e.target as HTMLElement)) {
      setView('month');
    }
  };

  const handleCalendarMouseOver = (e: ReactMouseEvent<HTMLDivElement>) => {
    const title = findMonthTitle(e.target as HTMLElement);
    if (title) {
      title.style.cursor = 'pointer';
      title.style.textDecoration = 'underline';
    }
  };

  const handleCalendarMouseOut = (e: ReactMouseEvent<HTMLDivElement>) => {
    const title = findMonthTitle(e.target as HTMLElement);
    if (title) {
      title.style.textDecoration = '';
    }
  };

  const handleEventCreated = (newEvent: CalendarEvent) => {
    setEvents((prev) => [...prev, newEvent]);
    setOpen(false);
  };

  const openAddEventForm = (startTime?: string, endTime?: string) => {
    setInitialEventTimes({ startTime, endTime });
    setEventFormKey((key) => key + 1);
    setOpen(true);
  };

  const handleEventEditingStart: NonNullable<
    ComponentProps<typeof EventCalendar>['onEventEditingStart']
  > = (occurrence, details) => {
    if (details.reason !== 'creation') {
      return;
    }

    details.cancel();
    const start = new Date(occurrence.displayTimezone.start.timestamp);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(10, 0, 0, 0);
    openAddEventForm(
      toLocalDateTime(start).slice(0, 16),
      toLocalDateTime(end).slice(0, 16),
    );
  };

  const handleParticipantsChanged = (changed: CalendarEvent) => {
    setEvents((prev) =>
      prev.map((event) => (event.id === changed.id ? { ...event, participants: changed.participants } : event))
    );
  };

  // omistaja vahvisti ajan: päivitetään tapahtuman aika ja äänestyksen tila kalenteriin
  const handleVotingConfirmed = useCallback((changed: CalendarEvent) => {
    setEvents((prev) => prev.map((event) => (event.id === changed.id ? { ...event, ...changed } : event)));
  }, []);

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
          ...(addedEvent.color ? {color: String(addedEvent.color) } : {})
        });

        setEvents((prev) => [
          ...prev.filter((event) => event.id !== addedEvent.id),
          savedEvent,
        ]);
        setParticipantsOpen(true);
      } catch (error) {
        console.error('Event save failed: ', error)
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
        console.error('Event deletion failed: ', error);
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
        oldEvent.end !== newEvent.end ||
        oldEvent.color !== newEvent.color
      );
    });

    if (changedEvent) {
      try {
        await updateEvent(Number(changedEvent.id), {
          title: changedEvent.title,
          description: changedEvent.description ?? "",
          startTime: String(changedEvent.start),
          endTime: String(changedEvent.end),
          ...(changedEvent.color ? {color: String(changedEvent.color)} : {})
        });
        setEvents(newEvents);
      } catch (error) {
        console.error('Event update failed: ', error);
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
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 56,
        }}
      >
        <Typography variant="h4" component="h1">
          Calendar
        </Typography>
        {headerActions && (
          <Box sx={{ position: 'absolute', right: 0, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {headerActions}
          </Box>
        )}
      </Box>

      {/*Avaa addEventFormin*/}
      <Box sx={{ display: 'flex', gap: 1, my: 2 }}>
        <Button
          variant="contained"
          onClick={() => openAddEventForm()}
        >
          Add Event
        </Button>

        <Button
          variant="outlined"
          onClick={handleOpenMonthPicker}
        >
          Choose Month
        </Button>
        <Button
          variant="outlined"
          onClick={() => setParticipantsOpen(true)}
        >
          Friends in Events
        </Button>
        <Button
          variant="outlined"
          onClick={() => setVotingOpen(true)}
        >
          Voting
        </Button>
      </Box>

      <VotingDialog
        open={votingOpen}
        onClose={() => setVotingOpen(false)}
        events={events.filter((event) => event.votingStatus === 'OPEN')}
        onEventChanged={handleVotingConfirmed}
      />

      <EventParticipantsDialog
        open={participantsOpen}
        onClose={() => setParticipantsOpen(false)}
        events={events.filter((event) => event.mine ?? true)}
        onEventChanged={handleParticipantsChanged}
      />

      {/* mui scheduler */}

      <div
        onClick={handleCalendarClick}
        onMouseOver={handleCalendarMouseOver}
        onMouseOut={handleCalendarMouseOut}
      >
        <EventCalendar
          apiRef={apiRef}
          events={events}
          onEventsChange={handleEventsChange}
          sx={{
            '& .MuiEventCalendar-miniCalendarDayCell': {
              aspectRatio: '0.88',
            },
          }}
          defaultView='month'
          view={view}
          onViewChange={setView}
          areEventsDraggable={false}
          defaultPreferences={defaultPreferences}
          preferencesMenuConfig={preferencesMenuConfig}
          eventCreation={{ interaction: "double-click", duration: 60 }}
          onEventEditingStart={handleEventEditingStart}
        />
      </div>

      <Dialog
        maxWidth={'lg'}
        open={open}
        onClose={() => setOpen(false)}
      >
        <DialogTitle>Add New Event to Calendar</DialogTitle>
        <AddEventForm
          key={eventFormKey}
          onCreated={handleEventCreated}
          onCancel={() => setOpen(false)}
          initialStartTime={initialEventTimes.startTime}
          initialEndTime={initialEventTimes.endTime}
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