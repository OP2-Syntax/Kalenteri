import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VotingDialog from '../../../components/calendar/VotingDialog';
import type { CalendarEvent } from '../../../components/calendar/eventMapper';
import { confirmVoting, getVoting, vote, type Voting } from '../../../components/calendar/votingApi';

vi.mock('../../../components/calendar/votingApi', () => ({
  getVoting: vi.fn(),
  vote: vi.fn(),
  confirmVoting: vi.fn(),
}));

const event: CalendarEvent = {
  id: 1,
  title: 'Elokuvat',
  description: '',
  start: '2030-02-01T18:00:00',
  end: '2030-02-01T20:00:00',
  mine: true,
  votingStatus: 'OPEN',
};

const openVoting: Voting = {
  status: 'OPEN',
  canVote: true,
  myVoteOptionId: null,
  winnerOptionId: null,
  options: [
    { id: 11, startTime: '2030-02-01T18:00:00', endTime: '2030-02-01T20:00:00', votes: 1, voters: [{ id: 7, username: 'kaveri' }] },
    { id: 12, startTime: '2030-02-02T18:00:00', endTime: '2030-02-02T20:00:00', votes: 0, voters: [] },
  ],
};

describe('VotingDialog', () => {
  beforeEach(() => {
    vi.mocked(getVoting).mockReset();
    vi.mocked(vote).mockReset();
    vi.mocked(confirmVoting).mockReset();
    vi.mocked(getVoting).mockResolvedValue(openVoting);
  });

  it('näyttää vaihtoehdot, äänet ja äänestäjät', async () => {
    render(<VotingDialog open onClose={vi.fn()} events={[event]} onEventChanged={vi.fn()} />);

    expect(await screen.findByText('Elokuvat')).toBeInTheDocument();
    expect(await screen.findByText(/1 vote: kaveri/)).toBeInTheDocument();
    expect(screen.getByText(/0 votes/)).toBeInTheDocument();
  });

  it('äänestää valittua vaihtoehtoa ja päivittää tuloksen', async () => {
    const updated: Voting = {
      ...openVoting,
      myVoteOptionId: 12,
      options: [openVoting.options[0], { ...openVoting.options[1], votes: 1, voters: [{ id: 3, username: 'minä' }] }],
    };
    vi.mocked(vote).mockResolvedValue(updated);
    const user = userEvent.setup();
    render(<VotingDialog open onClose={vi.fn()} events={[event]} onEventChanged={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: /Vote 2030-02-02 18:00/ }));

    expect(vote).toHaveBeenCalledWith(1, 12);
    expect(await screen.findByText(/1 vote: minä/)).toBeInTheDocument();
  });

  it('estää äänestämisen, kun äänestys ei ole auki', async () => {
    vi.mocked(getVoting).mockResolvedValue({ ...openVoting, status: 'CLOSED', canVote: false });
    render(<VotingDialog open onClose={vi.fn()} events={[event]} onEventChanged={vi.fn()} />);

    expect(await screen.findByRole('button', { name: /Vote 2030-02-01 18:00/ })).toBeDisabled();
  });

  it('omistaja vahvistaa ajan ja tapahtuma päivittyy', async () => {
    const closed: Voting = { ...openVoting, status: 'CLOSED', canVote: false, winnerOptionId: 11 };
    const changed: CalendarEvent = { ...event, votingStatus: 'CLOSED' };
    vi.mocked(confirmVoting).mockResolvedValue({ winnerOptionId: 11, voting: closed, event: changed });
    const onEventChanged = vi.fn();
    const user = userEvent.setup();
    render(<VotingDialog open onClose={vi.fn()} events={[event]} onEventChanged={onEventChanged} />);

    await user.click(await screen.findByRole('button', { name: 'Choose time' }));

    await waitFor(() => expect(onEventChanged).toHaveBeenCalledWith(changed));
    expect(await screen.findByText('Chosen time')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Choose time' })).not.toBeInTheDocument();
  });

  it('osallistuja ei näe Choose time -painiketta', async () => {
    render(<VotingDialog open onClose={vi.fn()} events={[{ ...event, mine: false }]} onEventChanged={vi.fn()} />);

    await screen.findByText(/1 vote: kaveri/);
    expect(screen.queryByRole('button', { name: 'Choose time' })).not.toBeInTheDocument();
  });

  it('näyttää virheen, kun vahvistus epäonnistuu', async () => {
    vi.mocked(confirmVoting).mockRejectedValue(new Error('No votes, the time cannot be confirmed'));
    const user = userEvent.setup();
    render(<VotingDialog open onClose={vi.fn()} events={[event]} onEventChanged={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Choose time' }));

    expect(await screen.findByText('No votes, the time cannot be confirmed')).toBeInTheDocument();
  });
});
