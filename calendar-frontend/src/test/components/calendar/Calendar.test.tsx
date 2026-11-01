import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Calendar from '../../../components/calendar/Calendar';
import { createEvent, deleteEvent, getEvents, updateEvent, type CalendarEvent } from '../../../components/calendar/calendarApi';

vi.mock('../../../components/calendar/calendarApi', () => ({
  getEvents: vi.fn(),
  createEvent: vi.fn(),
  deleteEvent: vi.fn(),
  updateEvent: vi.fn(),
}));

// MUI:n EventCalendar korvataan kevyellä mockilla, joka tallentaa saamansa propsit,
// jotta onEventsChange-käsittelijää voi kutsua suoraan testeistä
interface MockCalendarProps {
  events: CalendarEvent[];
  onEventsChange: (events: CalendarEvent[]) => Promise<void>;
  view: string;
  onViewChange: (view: string) => void;
}
const calendarProps: { current: MockCalendarProps | null } = { current: null };
const setVisibleDate = vi.fn();

vi.mock('@mui/x-scheduler/event-calendar', () => ({
  EventCalendar: (props: MockCalendarProps) => {
    calendarProps.current = props;
    return (
      <div data-testid="event-calendar" data-view={props.view}>
        {props.events.map((event) => (
          <span key={event.id}>{event.title}</span>
        ))}
        <span>November 2026</span>
      </div>
    );
  },
}));

vi.mock('@mui/x-scheduler/use-event-calendar-api-ref', () => ({
  useEventCalendarApiRef: () => ({ current: { setVisibleDate } }),
}));

const existingEvent: CalendarEvent = {
  id: 1,
  title: 'Palaveri',
  description: 'Viikkopalaveri',
  start: '2026-11-02T10:00:00',
  end: '2026-11-02T11:00:00',
};

async function renderCalendar(events: CalendarEvent[] = [existingEvent]) {
  vi.mocked(getEvents).mockResolvedValue(events);
  render(<Calendar />);
  await screen.findByTestId('event-calendar');
}

function triggerEventsChange(events: CalendarEvent[]) {
  return act(() => calendarProps.current!.onEventsChange(events));
}

describe('Calendar', () => {
  beforeEach(() => {
    vi.mocked(getEvents).mockReset();
    vi.mocked(createEvent).mockReset();
    vi.mocked(deleteEvent).mockReset();
    vi.mocked(updateEvent).mockReset();
    setVisibleDate.mockReset();
    calendarProps.current = null;
  });

  it('näyttää latausviestin ja sen jälkeen haetut tapahtumat', async () => {
    vi.mocked(getEvents).mockResolvedValue([existingEvent]);
    render(<Calendar />);

    expect(screen.getByText('Loading events...')).toBeInTheDocument();
    expect(await screen.findByText('Palaveri')).toBeInTheDocument();
  });

  it('näyttää virheilmoituksen, jos tapahtumien haku epäonnistuu', async () => {
    vi.mocked(getEvents).mockRejectedValue(new Error('Palvelin vastasi virheellä: 500'));
    render(<Calendar />);

    expect(
      await screen.findByText('Error loading events: Palvelin vastasi virheellä: 500')
    ).toBeInTheDocument();
  });

  it('tallentaa kalenterista luodun tapahtuman backendiin', async () => {
    await renderCalendar();
    const saved = { ...existingEvent, id: 2, title: 'Uusi' };
    vi.mocked(createEvent).mockResolvedValue(saved);

    await triggerEventsChange([
      existingEvent,
      {
        id: 'temp-id',
        title: 'Uusi',
        description: '',
        start: '2026-11-03T09:00',
        end: '2026-11-03T10:00',
      },
    ]);

    // aika lähetetään paikallisena aikana ilman aikavyöhykettä
    expect(createEvent).toHaveBeenCalledWith({
      title: 'Uusi',
      description: '',
      startTime: '2026-11-03T09:00:00',
      endTime: '2026-11-03T10:00:00',
    });
    expect(screen.getByText('Uusi')).toBeInTheDocument();
  });

  it('poistaa tapahtuman backendistä', async () => {
    await renderCalendar();
    vi.mocked(deleteEvent).mockResolvedValue();

    await triggerEventsChange([]);

    expect(deleteEvent).toHaveBeenCalledWith(1);
    expect(screen.queryByText('Palaveri')).not.toBeInTheDocument();
  });

  it('säilyttää tapahtuman, jos poisto epäonnistuu', async () => {
    await renderCalendar();
    vi.mocked(deleteEvent).mockRejectedValue(new Error('fail'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await triggerEventsChange([]);

    expect(screen.getByText('Palaveri')).toBeInTheDocument();
  });

  it('päivittää muokatun tapahtuman backendiin', async () => {
    await renderCalendar();
    const changed = { ...existingEvent, title: 'Muutettu' };
    vi.mocked(updateEvent).mockResolvedValue(changed);

    await triggerEventsChange([changed]);

    expect(updateEvent).toHaveBeenCalledWith(1, {
      title: 'Muutettu',
      description: 'Viikkopalaveri',
      startTime: '2026-11-02T10:00:00',
      endTime: '2026-11-02T11:00:00',
    });
    expect(screen.getByText('Muutettu')).toBeInTheDocument();
  });

  it('Add Event -painike avaa lomakkeen', async () => {
    await renderCalendar();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Add Event' }));

    expect(screen.getByText('Add New Event to Calendar')).toBeInTheDocument();
  });

  it('kuukausivalitsimella siirrytään valittuun kuukauteen', async () => {
    await renderCalendar();
    const user = userEvent.setup();
    const currentYear = new Date().getFullYear();

    await user.click(screen.getByRole('button', { name: 'Choose Month' }));
    expect(screen.getByText(String(currentYear))).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next year' }));
    await user.click(screen.getByRole('button', { name: 'March' }));

    expect(setVisibleDate).toHaveBeenCalledWith({
      visibleDate: new Date(currentYear + 1, 2, 1),
    });
    await waitFor(() => expect(screen.queryByText('Choose a month')).not.toBeInTheDocument());
  });

  it('kuukausiotsikon klikkaus palauttaa kuukausinäkymään', async () => {
    await renderCalendar();
    const user = userEvent.setup();

    act(() => {
      calendarProps.current!.onViewChange('week');
    });
    expect(screen.getByTestId('event-calendar')).toHaveAttribute('data-view', 'week');

    await user.click(screen.getByText('November 2026'));

    expect(screen.getByTestId('event-calendar')).toHaveAttribute('data-view', 'month');
  });
});
