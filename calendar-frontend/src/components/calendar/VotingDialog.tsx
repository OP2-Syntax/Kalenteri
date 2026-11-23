import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  Typography,
} from '@mui/material';
import type { CalendarEvent } from './eventMapper';
import { confirmVoting, getVoting, vote, type Voting } from './votingApi';

interface VotingDialogProps {
  open: boolean;
  onClose: () => void;
  // tapahtumat, joilla on äänestys (votingStatus ei NONE)
  events: CalendarEvent[];
  // kutsutaan, kun omistaja vahvistaa ajan (tapahtuman aika muuttuu)
  onEventChanged: (event: CalendarEvent) => void;
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  CLOSED: 'Confirmed',
};

function formatTime(value: string): string {
  return value.replace('T', ' ').slice(0, 16);
}

// Yhden tapahtuman äänestys: vaihtoehdot, äänet, äänestysnapit ja omistajan "Valitse aika"
function EventVotingCard({ event, onEventChanged }: { event: CalendarEvent; onEventChanged: (event: CalendarEvent) => void }) {
  const eventId = Number(event.id);
  const [voting, setVotingState] = useState<Voting | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const showError = (error: unknown) => setMessage(error instanceof Error ? error.message : 'Unknown error');

  const load = useCallback(() => {
    getVoting(eventId)
      .then(setVotingState)
      .catch(showError);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleVote = async (optionId: number) => {
    setMessage(null);
    setBusy(true);
    try {
      setVotingState(await vote(eventId, optionId));
    } catch (error) {
      showError(error);
      load(); // tila on voinut muuttua (esim. äänestys ehti sulkeutua)
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    setMessage(null);
    setBusy(true);
    try {
      const result = await confirmVoting(eventId);
      setVotingState(result.voting);
      onEventChanged(result.event);
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  };

  const isOwner = event.mine ?? false;
  const canConfirm = isOwner && voting !== null && voting.status === 'OPEN';

  return (
    <ListItem sx={{ display: 'block', px: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="subtitle1">{event.title}</Typography>
        {voting && <Chip size="small" label={STATUS_LABELS[voting.status] ?? voting.status} />}
      </Box>
      {message && <Alert severity="error" sx={{ my: 1 }}>{message}</Alert>}

      {voting?.options.map((option) => {
        const mine = voting.myVoteOptionId === option.id;
        const winner = voting.winnerOptionId === option.id;
        return (
          <Box key={option.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant={mine ? 'contained' : 'outlined'}
              disabled={!voting.canVote || busy}
              onClick={() => handleVote(option.id)}
              aria-label={`Vote ${formatTime(option.startTime)}`}
            >
              {formatTime(option.startTime)} – {formatTime(option.endTime).slice(11)}
            </Button>
            <Typography variant="body2">
              {option.votes} {option.votes === 1 ? 'vote' : 'votes'}{option.voters.length > 0 && `: ${option.voters.map((voter) => voter.username).join(', ')}`}
            </Typography>
            {winner && <Chip size="small" color="success" label="Chosen time" />}
          </Box>
        );
      })}

      {canConfirm && (
        <Button variant="contained" color="secondary" disabled={busy} onClick={handleConfirm} sx={{ mt: 1 }}>
          Choose time
        </Button>
      )}
    </ListItem>
  );
}

function VotingDialog({ open, onClose, events, onEventChanged }: VotingDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Voting</DialogTitle>
      <DialogContent>
        {events.length === 0 && (
          <Typography variant="body2" color="text.secondary">No votings</Typography>
        )}
        <List>
          {events.map((event) => (
            <EventVotingCard key={event.id} event={event} onEventChanged={onEventChanged} />
          ))}
        </List>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
}

export default VotingDialog;
