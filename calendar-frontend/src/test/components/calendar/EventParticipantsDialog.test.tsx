import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EventParticipantsDialog from '../../../components/calendar/EventParticipantsDialog';
import { addParticipant, type CalendarEvent, removeParticipant } from '../../../components/calendar/calendarApi';
import { getFriends } from '../../../components/friends/friendsApi';

vi.mock('../../../components/calendar/calendarApi', () => ({
  addParticipant: vi.fn(),
  removeParticipant: vi.fn(),
}));
vi.mock('../../../components/friends/friendsApi', () => ({ getFriends: vi.fn() }));

const event: CalendarEvent = {
  id: 1,
  title: 'Elokuvat',
  description: '',
  start: '2026-11-10T18:00:00',
  end: '2026-11-10T20:00:00',
  participants: [{ id: 8, username: 'mukana' }],
};

describe('EventParticipantsDialog', () => {
  beforeEach(() => {
    vi.mocked(addParticipant).mockReset();
    vi.mocked(removeParticipant).mockReset();
    vi.mocked(getFriends).mockReset();
    vi.mocked(getFriends).mockResolvedValue([
      { id: 7, username: 'kaveri' },
      { id: 8, username: 'mukana' },
    ]);
  });

  it('näyttää tapahtuman ja osallistujat', async () => {
    render(<EventParticipantsDialog open onClose={vi.fn()} events={[event]} onEventChanged={vi.fn()} />);
    expect(await screen.findByText('Elokuvat')).toBeInTheDocument();
    expect(screen.getByText('mukana')).toBeInTheDocument();
  });

  it('lisää valitun kaverin tapahtumaan', async () => {
    const updated = {
      ...event,
      participants: [...(event.participants ?? []), { id: 7, username: 'kaveri' }],
    };
    vi.mocked(addParticipant).mockResolvedValue(updated);
    const onEventChanged = vi.fn();
    const user = userEvent.setup();
    render(<EventParticipantsDialog open onClose={vi.fn()} events={[event]} onEventChanged={onEventChanged} />);

    await waitFor(() => expect(getFriends).toHaveBeenCalled());
    await user.click(screen.getByRole('combobox'));
    expect(screen.queryByRole('option', { name: 'mukana' })).not.toBeInTheDocument();
    await user.click(await screen.findByRole('option', { name: 'kaveri' }));

    expect(addParticipant).toHaveBeenCalledWith(1, 7);
    await waitFor(() => expect(onEventChanged).toHaveBeenCalledWith(updated));
  });

  it('näyttää virheen, kun kutsun lisääminen epäonnistuu', async () => {
    vi.mocked(addParticipant).mockRejectedValue(new Error('Lisäys epäonnistui'));
    const user = userEvent.setup();
    render(<EventParticipantsDialog open onClose={vi.fn()} events={[event]} onEventChanged={vi.fn()} />);

    await waitFor(() => expect(getFriends).toHaveBeenCalled());
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'kaveri' }));

    expect(await screen.findByText('Lisäys epäonnistui')).toBeInTheDocument();
  });
});
