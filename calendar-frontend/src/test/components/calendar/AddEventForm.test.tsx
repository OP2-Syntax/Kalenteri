import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AddEventForm from '../../../components/calendar/AddEventForm';
import { createEvent } from '../../../components/calendar/calendarApi';
import { getFriends } from '../../../components/friends/friendsApi';
import { setVoting } from '../../../components/calendar/votingApi';
import { getGroups } from '../../../components/groups/groupsApi';

vi.mock('../../../components/calendar/calendarApi', () => ({ createEvent: vi.fn() }));
vi.mock('../../../components/friends/friendsApi', () => ({ getFriends: vi.fn() }));
vi.mock('../../../components/calendar/votingApi', () => ({ setVoting: vi.fn() }));
vi.mock('../../../components/groups/groupsApi', () => ({ getGroups: vi.fn() }));

// kentillä ei ole label-yhteyttä, joten haetaan ne tyypin perusteella
function fillForm(container: HTMLElement) {
  const [title, description] = container.querySelectorAll('input[type="text"]');
  const [startDate, endDate] = container.querySelectorAll('input[type="date"]');
  const [startTime, endTime] = container.querySelectorAll('input[type="time"]');

  fireEvent.change(title, { target: { value: 'Palaveri' } });
  fireEvent.change(description, { target: { value: 'Viikkopalaveri' } });
  fireEvent.change(startDate, { target: { value: '2026-11-02' } });
  fireEvent.change(startTime, { target: { value: '10:00' } });
  fireEvent.change(endDate, { target: { value: '2026-11-02' } });
  fireEvent.change(endTime, { target: { value: '11:00' } });
}

describe('AddEventForm', () => {
  beforeEach(() => {
    vi.mocked(createEvent).mockReset();
    vi.mocked(getFriends).mockReset();
    vi.mocked(getFriends).mockResolvedValue([]);
    vi.mocked(setVoting).mockReset();
    vi.mocked(getGroups).mockReset();
    vi.mocked(getGroups).mockResolvedValue([]);
  });

  it('prefills the event and voting option times when supplied', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AddEventForm
        onCreated={vi.fn()}
        onCancel={vi.fn()}
        initialStartTime="2026-11-02T09:00"
        initialEndTime="2026-11-02T10:00"
      />,
    );

    const dates = container.querySelectorAll<HTMLInputElement>('input[type="date"]');
    const times = container.querySelectorAll<HTMLInputElement>('input[type="time"]');
    expect(dates[0].value).toBe('2026-11-02');
    expect(times[0].value).toBe('09:00');
    expect(dates[1].value).toBe('2026-11-02');
    expect(times[1].value).toBe('10:00');

    await user.click(screen.getByRole('switch', { name: /vote on the time/i }));

    expect(screen.getByLabelText<HTMLInputElement>('Option 1 start').value).toBe('2026-11-02T09:00');
    expect(screen.getByLabelText<HTMLInputElement>('Option 1 end').value).toBe('2026-11-02T10:00');
  });

  it('lähettää tapahtuman yhdistetyillä päivämäärillä ja kellonajoilla', async () => {
    const created = {
      id: 1,
      title: 'Palaveri',
      description: 'Viikkopalaveri',
      start: '2026-11-02T10:00',
      end: '2026-11-02T11:00',
    };
    vi.mocked(createEvent).mockResolvedValue(created);
    const onCreated = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<AddEventForm onCreated={onCreated} onCancel={vi.fn()} />);

    fillForm(container);
    await user.click(screen.getByRole('button', { name: 'Add Event' }));

    expect(createEvent).toHaveBeenCalledWith({
      title: 'Palaveri',
      description: 'Viikkopalaveri',
      startTime: '2026-11-02T10:00',
      endTime: '2026-11-02T11:00',
    });
    expect(onCreated).toHaveBeenCalledWith(created);
    // lomake tyhjennetään onnistuneen lisäyksen jälkeen
    expect(container.querySelector<HTMLInputElement>('input[type="text"]')?.value).toBe('');
  });

  it('lähettää valitun värin tapahtuman mukana', async () => {
    vi.mocked(createEvent).mockResolvedValue({
      id: 1,
      title: 'Palaveri',
      description: 'Viikkopalaveri',
      start: '2026-11-02T10:00',
      end: '2026-11-02T11:00',
      color: 'blue',
    });
    const user = userEvent.setup();
    const { container } = render(<AddEventForm onCreated={vi.fn()} onCancel={vi.fn()} />);

    fillForm(container);
    await user.click(screen.getByRole('button', { name: 'blue event color' }));
    await user.click(screen.getByRole('button', { name: 'Add Event' }));

    expect(createEvent).toHaveBeenCalledWith({
      title: 'Palaveri',
      description: 'Viikkopalaveri',
      startTime: '2026-11-02T10:00',
      endTime: '2026-11-02T11:00',
      color: 'blue',
    });
  });

  it('ei kutsu onCreated, jos tallennus epäonnistuu', async () => {
    vi.mocked(createEvent).mockRejectedValue(new Error('fail'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onCreated = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<AddEventForm onCreated={onCreated} onCancel={vi.fn()} />);

    fillForm(container);
    await user.click(screen.getByRole('button', { name: 'Add Event' }));

    expect(createEvent).toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it('lähettää valitut kaverit participantIds-kentässä', async () => {
    vi.mocked(getFriends).mockResolvedValue([{ id: 7, username: 'kaveri' }]);
    vi.mocked(createEvent).mockResolvedValue({
      id: 1,
      title: 'Palaveri',
      description: 'Viikkopalaveri',
      start: '2026-11-02T10:00',
      end: '2026-11-02T11:00',
    });
    const user = userEvent.setup();
    const { container } = render(<AddEventForm onCreated={vi.fn()} onCancel={vi.fn()} />);

    fillForm(container);
    await user.click(screen.getByPlaceholderText('Invite friends (optional)'));
    await user.click(await screen.findByRole('option', { name: 'kaveri' }));
    await user.click(screen.getByRole('button', { name: 'Add Event' }));

    expect(createEvent).toHaveBeenCalledWith({
      title: 'Palaveri',
      description: 'Viikkopalaveri',
      startTime: '2026-11-02T10:00',
      endTime: '2026-11-02T11:00',
      participantIds: [7],
    });
  });

  it('lähettää valitun ryhmän groupIds-kentässä', async () => {
    vi.mocked(getGroups).mockResolvedValue([{
      id: 9,
      name: 'Jengi',
      inviteCode: 'JENGI123',
      ownerId: 1,
      ownerUsername: 'oma',
      members: [{ id: 1, username: 'oma' }],
    }]);
    vi.mocked(createEvent).mockResolvedValue({
      id: 1,
      title: 'Palaveri',
      description: 'Viikkopalaveri',
      start: '2026-11-02T10:00',
      end: '2026-11-02T11:00',
    });
    const user = userEvent.setup();
    const { container } = render(<AddEventForm onCreated={vi.fn()} onCancel={vi.fn()} />);

    fillForm(container);
    await user.click(screen.getByPlaceholderText('Invite a group (optional)'));
    await user.click(await screen.findByRole('option', { name: 'Jengi' }));
    await user.click(screen.getByRole('button', { name: 'Add Event' }));

    expect(createEvent).toHaveBeenCalledWith({
      title: 'Palaveri',
      description: 'Viikkopalaveri',
      startTime: '2026-11-02T10:00',
      endTime: '2026-11-02T11:00',
      groupIds: [9],
    });
  });

  it('ei lähetä lomaketta, jos pakollisia kenttiä puuttuu', async () => {
    const user = userEvent.setup();
    render(<AddEventForm onCreated={vi.fn()} onCancel={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Add Event' }));

    expect(createEvent).not.toHaveBeenCalled();
  });

  it('Cancel-painike kutsuu onCancel', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<AddEventForm onCreated={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalled();
  });

  it('äänestystilassa luo tapahtuman ensimmäisellä vaihtoehdolla ja asettaa äänestyksen', async () => {
    vi.mocked(createEvent).mockResolvedValue({
      id: 9,
      title: 'Elokuvat',
      description: '',
      start: '2030-02-01T18:00',
      end: '2030-02-01T20:00',
    });
    vi.mocked(setVoting).mockResolvedValue({
      status: 'OPEN',
      canVote: true,
      myVoteOptionId: null,
      winnerOptionId: null,
      deadline: '2030-02-02T18:00:00',
      options: [],
    });
    const onCreated = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<AddEventForm onCreated={onCreated} onCancel={vi.fn()} />);

    fireEvent.change(container.querySelector('input[type="text"]')!, { target: { value: 'Elokuvat' } });
    await user.click(screen.getByRole('switch', { name: /vote on the time/i }));
    expect(screen.getByLabelText('Voting duration (hours):')).toHaveValue(24);
    fireEvent.change(screen.getByLabelText('Voting duration (hours):'), { target: { value: '36' } });
    fireEvent.change(screen.getByLabelText('Option 1 start'), { target: { value: '2030-02-01T18:00' } });
    fireEvent.change(screen.getByLabelText('Option 1 end'), { target: { value: '2030-02-01T20:00' } });
    fireEvent.change(screen.getByLabelText('Option 2 start'), { target: { value: '2030-02-02T18:00' } });
    fireEvent.change(screen.getByLabelText('Option 2 end'), { target: { value: '2030-02-02T20:00' } });
    await user.click(screen.getByRole('button', { name: 'Add Event' }));

    expect(createEvent).toHaveBeenCalledWith({
      title: 'Elokuvat',
      description: '',
      startTime: '2030-02-01T18:00',
      endTime: '2030-02-01T20:00',
    });
    expect(setVoting).toHaveBeenCalledWith(9, [
      { startTime: '2030-02-01T18:00', endTime: '2030-02-01T20:00' },
      { startTime: '2030-02-02T18:00', endTime: '2030-02-02T20:00' },
    ], 36);
    expect(onCreated).toHaveBeenCalledWith(expect.objectContaining({ id: 9, votingStatus: 'OPEN' }));
  });
  it('äänestystilassa ei luo tapahtumaa, jos vaihtoehdon loppu on ennen alkua', async () => {
    const user = userEvent.setup();
    const { container } = render(<AddEventForm onCreated={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(container.querySelector('input[type="text"]')!, { target: { value: 'Elokuvat' } });
    await user.click(screen.getByRole('switch', { name: /vote on the time/i }));
    fireEvent.change(screen.getByLabelText('Option 1 start'), { target: { value: '2030-02-01T18:00' } });
    fireEvent.change(screen.getByLabelText('Option 1 end'), { target: { value: '2030-02-01T17:00' } });
    fireEvent.change(screen.getByLabelText('Option 2 start'), { target: { value: '2030-02-02T18:00' } });
    fireEvent.change(screen.getByLabelText('Option 2 end'), { target: { value: '2030-02-02T20:00' } });
    await user.click(screen.getByRole('button', { name: 'Add Event' }));

    expect(await screen.findByText('Each option must end after it starts')).toBeInTheDocument();
    expect(createEvent).not.toHaveBeenCalled();
  });
});
