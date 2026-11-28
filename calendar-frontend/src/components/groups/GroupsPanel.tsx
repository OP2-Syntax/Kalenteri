import { useEffect, useState, type FormEvent } from 'react';
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  getFriends,
  getOutgoingRequests,
  sendRequest,
  type Friend,
  type FriendRequest,
} from '../friends/friendsApi';
import { getUsername } from '../../authApi';
import {
  createGroup,
  getGroups,
  joinGroup,
  inviteFriendToGroup,
  removeGroupMember,
  type CalendarGroup,
} from './groupsApi';

export default function GroupsPanel() {
  const [groups, setGroups] = useState<CalendarGroup[]>([]);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<CalendarGroup | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [sentFriendRequestIds, setSentFriendRequestIds] = useState<number[]>([]);

  const refresh = () =>
    getGroups()
      .then(setGroups)
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Loading groups failed'));

  useEffect(() => {
    refresh();
    Promise.all([getFriends(), getOutgoingRequests()])
      .then(([loadedFriends, requests]) => {
        setFriends(loadedFriends);
        setOutgoingRequests(requests);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Loading friends failed'));
  }, []);

  const refreshSelectedGroup = async (groupId: number) => {
    const updated = await getGroups();
    setGroups(updated);
    setSelectedGroup(updated.find((group) => group.id === groupId) ?? null);
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    try {
      await createGroup(groupName);
      setGroupName('');
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Creating group failed');
    }
  };

  const handleJoin = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    try {
      await joinGroup(inviteCode);
      setInviteCode('');
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Joining group failed');
    }
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard?.writeText(code);
    setCopiedCode(code);
  };

  const handleInviteFriend = async (friendId: number) => {
    if (!selectedGroup) return;
    setMessage(null);
    try {
      await inviteFriendToGroup(selectedGroup.id, friendId);
      setMessage('Group invitation sent');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Group invitation failed');
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!selectedGroup) return;
    setMessage(null);
    try {
      await removeGroupMember(selectedGroup.id, memberId);
      await refreshSelectedGroup(selectedGroup.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Removing member failed');
    }
  };

  const handleLeaveGroup = async () => {
    if (!selectedGroup) return;
    setMessage(null);
    try {
      const currentMember = selectedGroup.members.find(
        (member) => member.username === (getUsername() ?? '')
      );
      if (!currentMember) {
        throw new Error('You are not a member of this group');
      }
      await removeGroupMember(selectedGroup.id, currentMember.id);
      setSelectedGroup(null);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Leaving group failed');
    }
  };

  const handleAddFriend = async (member: Friend) => {
    setMessage(null);
    try {
      await sendRequest(member.id);
      setSentFriendRequestIds((current) => [...current, member.id]);
      setMessage(`Friend request sent to ${member.username}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Friend request failed');
    }
  };

  if (selectedGroup) {
    const isOwner = selectedGroup.ownerUsername === (getUsername() ?? '');

    return (
      <Box sx={{ minWidth: 340 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton aria-label="Back to groups" onClick={() => setSelectedGroup(null)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">{selectedGroup.name}</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Invite code: {selectedGroup.inviteCode}
        </Typography>

        {message && <Typography color={message === 'Group invitation sent' || message.startsWith('Friend request sent') ? 'primary' : 'error'} sx={{ mt: 1 }}>{message}</Typography>}

        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Participants ({selectedGroup.members.length})
        </Typography>
        <List dense>
          {selectedGroup.members.map((member) => (
            <ListItem
              key={member.id}
              secondaryAction={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {member.username !== (getUsername() ?? '') && (
                    friends.some((friend) => friend.id === member.id) ? (
                      <Button size="small" disabled>Friend</Button>
                    ) : outgoingRequests.some((request) => request.user.id === member.id)
                      || sentFriendRequestIds.includes(member.id) ? (
                        <Button size="small" disabled>Request sent</Button>
                      ) : (
                        <Button size="small" onClick={() => handleAddFriend(member)}>
                          Add friend
                        </Button>
                      )
                  )}
                  {isOwner && member.username !== selectedGroup.ownerUsername && (
                    <IconButton
                      edge="end"
                      aria-label={`Remove ${member.username} from ${selectedGroup.name}`}
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              }
            >
              <ListItemText
                primary={member.username}
                secondary={member.username === selectedGroup.ownerUsername ? 'Owner' : 'Member'}
              />
            </ListItem>
          ))}
        </List>

        {!isOwner && (
          <Button
            variant="outlined"
            color="error"
            onClick={() => void handleLeaveGroup()}
            sx={{ mt: 1 }}
          >
            Leave group
          </Button>
        )}

        {isOwner && (
          <>
            <Typography variant="subtitle1" sx={{ mt: 2 }}>
              Invite friends
            </Typography>
            <List dense>
              {friends
                .filter((friend) => !selectedGroup.members.some((member) => member.id === friend.id))
                .map((friend) => (
                  <ListItem
                    key={friend.id}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label={`Invite ${friend.username} to ${selectedGroup.name}`}
                        onClick={() => handleInviteFriend(friend.id)}
                      >
                        <PersonAddIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText primary={friend.username} />
                  </ListItem>
                ))}
              {friends.filter((friend) => !selectedGroup.members.some((member) => member.id === friend.id)).length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  All friends are already in this group
                </Typography>
              )}
            </List>
          </>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 340 }}>
      <Typography variant="subtitle1">Create group</Typography>
      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <TextField
          label="Group name"
          size="small"
          fullWidth
          value={groupName}
          onChange={(event) => setGroupName(event.target.value)}
          required
        />
        <Button type="submit" variant="contained">Create</Button>
      </form>

      <Typography variant="subtitle1" sx={{ mt: 3 }}>Join with code</Typography>
      <form onSubmit={handleJoin} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <TextField
          label="Invite code"
          size="small"
          fullWidth
          value={inviteCode}
          onChange={(event) => setInviteCode(event.target.value)}
          required
        />
        <Button type="submit" variant="outlined">Join</Button>
      </form>

      {message && (
        <Typography color="error" sx={{ mt: 1 }}>{message}</Typography>
      )}

      <Typography variant="subtitle1" sx={{ mt: 3 }}>
        My groups ({groups.length})
      </Typography>
      <List dense>
        {groups.map((group) => (
          <ListItem
            key={group.id}
            onClick={() => setSelectedGroup(group)}
            sx={{ cursor: 'pointer' }}
            secondaryAction={
              <IconButton
                edge="end"
                aria-label={`Copy invite code for ${group.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  void copyCode(group.inviteCode);
                }}
              >
                <ContentCopyIcon />
              </IconButton>
            }
          >
            <ListItemText
              primary={group.name}
              secondary={`${group.inviteCode} · ${group.members.length} members${copiedCode === group.inviteCode ? ' · Copied' : ''}`}
            />
          </ListItem>
        ))}
        {groups.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No groups yet
          </Typography>
        )}
      </List>
    </Box>
  );
}
