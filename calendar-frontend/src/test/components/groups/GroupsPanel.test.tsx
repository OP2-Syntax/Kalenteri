import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GroupsPanel from '../../../components/groups/GroupsPanel';
import { getFriends, getOutgoingRequests, sendRequest } from '../../../components/friends/friendsApi';
import { getGroups, removeGroupMember } from '../../../components/groups/groupsApi';

vi.mock('../../../components/friends/friendsApi', () => ({
  getFriends: vi.fn(),
  getOutgoingRequests: vi.fn(),
  sendRequest: vi.fn(),
}));

vi.mock('../../../components/groups/groupsApi', () => ({
  createGroup: vi.fn(),
  getGroups: vi.fn(),
  joinGroup: vi.fn(),
  inviteFriendToGroup: vi.fn(),
  removeGroupMember: vi.fn(),
}));

vi.mock('../../../authApi', () => ({
  getUsername: () => localStorage.getItem('username'),
}));

const group = {
  id: 3,
  name: 'Squad',
  inviteCode: 'SQUAD123',
  ownerId: 2,
  ownerUsername: 'owner',
  members: [
    { id: 2, username: 'owner' },
    { id: 5, username: 'member' },
  ],
};

describe('GroupsPanel member actions', () => {
  beforeEach(() => {
    localStorage.setItem('username', 'owner');
    vi.mocked(getGroups).mockReset();
    vi.mocked(getGroups).mockResolvedValue([group]);
    vi.mocked(getFriends).mockReset();
    vi.mocked(getFriends).mockResolvedValue([]);
    vi.mocked(getOutgoingRequests).mockReset();
    vi.mocked(getOutgoingRequests).mockResolvedValue([]);
    vi.mocked(sendRequest).mockReset();
    vi.mocked(removeGroupMember).mockReset();
    vi.mocked(removeGroupMember).mockResolvedValue();
  });

  it('lets a user send a friend request to a group member', async () => {
    const user = userEvent.setup();
    render(<GroupsPanel />);

    await user.click(await screen.findByText('Squad'));
    await user.click(screen.getByRole('button', { name: 'Add friend' }));

    expect(sendRequest).toHaveBeenCalledWith(5);
    expect(await screen.findByText('Friend request sent to member')).toBeInTheDocument();
  });

  it('shows a dedicated leave action for a non-owner and removes only the current user', async () => {
    localStorage.setItem('username', 'member');
    const user = userEvent.setup();
    render(<GroupsPanel />);

    await user.click(await screen.findByText('Squad'));
    await user.click(screen.getByRole('button', { name: 'Leave group' }));

    expect(removeGroupMember).toHaveBeenCalledWith(3, 5);
  });
});
