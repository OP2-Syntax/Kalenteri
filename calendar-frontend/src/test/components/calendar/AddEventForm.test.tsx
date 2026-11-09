import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AddEventForm from '../../../components/calendar/AddEventForm';
import { createEvent } from '../../../components/calendar/calendarApi';
import { getFriends } from '../../../components/friends/friendsApi';

vi.mock('../../../components/calendar/calendarApi', () => ({ createEvent: vi.fn() }));
vi.mock('../../../components/friends/friendsApi', () => ({ getFriends: vi.fn() }));

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
    await user.click(screen.getByRole('combobox'));
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
});
