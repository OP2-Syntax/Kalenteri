import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Notifications from '../../components/Notifications';
import { getEvents } from '../../components/calendar/calendarApi';
import { getIncomingRequests } from '../../components/friends/friendsApi';
import { getIncomingGroupInvitations } from '../../components/groups/groupsApi';

vi.mock('../../components/authApi', () => ({ getUsername: () => 'tester' }));
vi.mock('../../components/calendar/calendarApi', () => ({ getEvents: vi.fn() }));
vi.mock('../../components/friends/friendsApi', () => ({ getIncomingRequests: vi.fn() }));
vi.mock('../../components/groups/groupsApi', () => ({
  getIncomingGroupInvitations: vi.fn(),
  acceptGroupInvitation: vi.fn(),
  declineGroupInvitation: vi.fn(),
}));

describe('Notifications', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(getEvents).mockResolvedValue([{
      id: 8,
      title: 'Movie night',
      description: '',
      start: '2030-02-01T18:00:00',
      end: '2030-02-01T20:00:00',
      mine: false,
      votingStatus: 'CLOSED',
    }]);
    vi.mocked(getIncomingRequests).mockResolvedValue([]);
    vi.mocked(getIncomingGroupInvitations).mockResolvedValue([]);
  });

  it('notifies event participants when a time vote has ended', async () => {
    const user = userEvent.setup();
    render(<Notifications onOpenFriends={vi.fn()} onOpenGroups={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /notifications/i }));

    expect(await screen.findByText('Voting ended')).toBeInTheDocument();
    expect(screen.getByText('The time voting for "Movie night" has ended')).toBeInTheDocument();
  });
});
