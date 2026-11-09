import { useEffect, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import { addParticipant, removeParticipant, type CalendarEvent } from './calendarApi';
import { getFriends, type Friend } from '../friends/friendsApi';

interface EventParticipantsDialogProps {
  open: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  onEventChanged: (event: CalendarEvent) => void;
}

function EventParticipantsDialog({ open, onClose, events, onEventChanged }: EventParticipantsDialogProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMessage(null);
    getFriends()
      .then(setFriends)
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Tuntematon virhe'));
  }, [open]);

  const handleAdd = async (event: CalendarEvent, friend: Friend) => {
    setMessage(null);
    try {
      onEventChanged(await addParticipant(Number(event.id), friend.id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Tuntematon virhe');
    }
  };

  const handleRemove = async (event: CalendarEvent, friend: Friend) => {
    setMessage(null);
    try {
      await removeParticipant(Number(event.id), friend.id);
      onEventChanged({
        ...event,
        participants: (event.participants ?? []).filter((participant) => participant.id !== friend.id),
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Tuntematon virhe');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Friends in Events</DialogTitle>
      <DialogContent>
        {message && <Typography color="error" sx={{ mb: 1 }}>{message}</Typography>}
        {events.length === 0 && (
          <Typography variant="body2" color="text.secondary">No upcoming events</Typography>
        )}
        <List>
          {events.map((event) => {
            const participants = event.participants ?? [];
            const available = friends.filter(
              (friend) => !participants.some((participant) => participant.id === friend.id)
            );
            return (
              <ListItem key={event.id} sx={{ display: 'block', px: 0 }}>
                <ListItemText
                  primary={event.title}
                  secondary={String(event.start).replace('T', ' ').slice(0, 16)}
                />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, my: 1 }}>
                  {participants.map((friend) => (
                    <Chip key={friend.id} label={friend.username} onDelete={() => handleRemove(event, friend)} />
                  ))}
                  {participants.length === 0 && (
                    <Typography variant="body2" color="text.secondary">No participants</Typography>
                  )}
                </Box>
                <Autocomplete
                  size="small"
                  options={available}
                  value={null}
                  onChange={(_event, friend) => {
                    if (friend) void handleAdd(event, friend);
                  }}
                  getOptionLabel={(friend) => friend.username}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  noOptionsText="No friends to add"
                  renderInput={(params) => <TextField {...params} placeholder="Add Friend" />}
                />
              </ListItem>
            );
          })}
        </List>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
}

export default EventParticipantsDialog;
