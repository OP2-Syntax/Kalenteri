import { BACKEND_URL, getToken } from '../../authApi';

export interface CalendarGroupMember {
  id: number;
  username: string;
}

export interface CalendarGroup {
  id: number;
  name: string;
  inviteCode: string;
  ownerId: number;
  ownerUsername: string;
  members: CalendarGroupMember[];
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getGroups(): Promise<CalendarGroup[]> {
  const response = await fetch(`${BACKEND_URL}/api/groups`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error('Loading groups failed: ' + response.status);
  }
  return response.json();
}

export async function createGroup(name: string): Promise<CalendarGroup> {
  const response = await fetch(`${BACKEND_URL}/api/groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error('Creating group failed: ' + response.status);
  }
  return response.json();
}

export async function joinGroup(inviteCode: string): Promise<CalendarGroup> {
  const response = await fetch(`${BACKEND_URL}/api/groups/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ inviteCode }),
  });
  if (response.status === 404) {
    throw new Error('Group code not found');
  }
  if (!response.ok) {
    throw new Error('Joining group failed: ' + response.status);
  }
  return response.json();
}

export interface GroupInvitation {
  id: number;
  group: CalendarGroup;
  sender: CalendarGroupMember;
  receiver: CalendarGroupMember;
}

export async function getIncomingGroupInvitations(): Promise<GroupInvitation[]> {
  const response = await fetch(`${BACKEND_URL}/api/groups/invitations/incoming`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error('Loading group invitations failed: ' + response.status);
  }
  return response.json();
}

export async function inviteFriendToGroup(groupId: number, friendId: number): Promise<GroupInvitation> {
  const response = await fetch(`${BACKEND_URL}/api/groups/${groupId}/invite/${friendId}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (response.status === 409) {
    throw new Error('Friend is already in the group or already invited');
  }
  if (!response.ok) {
    throw new Error('Group invitation failed: ' + response.status);
  }
  return response.json();
}

export async function acceptGroupInvitation(invitationId: number): Promise<CalendarGroup> {
  const response = await fetch(`${BACKEND_URL}/api/groups/invitations/${invitationId}/accept`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error('Accepting group invitation failed: ' + response.status);
  }
  return response.json();
}

export async function declineGroupInvitation(invitationId: number): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/groups/invitations/${invitationId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error('Declining group invitation failed: ' + response.status);
  }
}

export async function removeGroupMember(groupId: number, memberId: number): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/groups/${groupId}/members/${memberId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error('Removing group member failed: ' + response.status);
  }
}
