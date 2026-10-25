import { useEffect, useState, type FormEvent } from 'react';
import { Box, Button, List, ListItem, ListItemText, TextField, Typography } from '@mui/material';
import {
  acceptRequest,
  deleteRequest,
  getFriends,
  getIncomingRequests,
  getOutgoingRequests,
  searchUsers,
  sendRequest,
  type Friend,
  type FriendRequest,
} from './friendsApi';

function FriendsPanel() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Friend[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  // haetaan kaikki listat uudelleen
  const refresh = () =>
    Promise.all([getFriends(), getIncomingRequests(), getOutgoingRequests()]).then(
      ([f, i, o]) => {
        setFriends(f);
        setIncoming(i);
        setOutgoing(o);
      }
    );

  // haetaan listat kun paneeli avataan
  useEffect(() => {
    refresh().catch((err) => setMessage(err.message));
  }, []);

  // suorittaa toiminnon, päivittää listat ja näyttää mahdollisen virheen
  const run = async (action: () => Promise<unknown>) => {
    setMessage(null);

    try {
      await action();
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Tuntematon virhe');
    }
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      setResults(await searchUsers(query));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Tuntematon virhe');
    }
  };

  // hakutuloksen painike riippuu siitä, missä tilassa käyttäjä on
  const renderAction = (user: Friend) => {
    if (friends.some((f) => f.id === user.id)) {
      return <Button size="small" disabled>Kaveri</Button>;
    }
    if (outgoing.some((r) => r.user.id === user.id)) {
      return <Button size="small" disabled>Pyyntö lähetetty</Button>;
    }
    const received = incoming.find((r) => r.user.id === user.id);
    if (received) {
      return (
        <Button size="small" onClick={() => run(() => acceptRequest(received.id))}>
          Hyväksy
        </Button>
      );
    }
    return (
      <Button size="small" onClick={() => run(() => sendRequest(user.id))}>
        Lisää
      </Button>
    );
  };

  return (
    <Box sx={{ minWidth: 340 }}>
      {/* käyttäjähaku */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
        <TextField
          label="Hae käyttäjänimellä"
          size="small"
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" variant="contained">Hae</Button>
      </form>

      {message && (
        <Typography color="error" sx={{ mt: 1 }}>
          {message}
        </Typography>
      )}

      {/* hakutulokset */}
      <List dense>
        {results.map((user) => (
          <ListItem key={user.id} secondaryAction={renderAction(user)}>
            <ListItemText primary={user.username} />
          </ListItem>
        ))}
      </List>

      {/* saapuneet pyynnöt: hyväksy tai hylkää */}
      {incoming.length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            Saapuneet pyynnöt ({incoming.length})
          </Typography>
          <List dense>
            {incoming.map((request) => (
              <ListItem
                key={request.id}
                secondaryAction={
                  <>
                    <Button size="small" onClick={() => run(() => acceptRequest(request.id))}>
                      Hyväksy
                    </Button>
                    <Button size="small" color="error" onClick={() => run(() => deleteRequest(request.id))}>
                      Hylkää
                    </Button>
                  </>
                }
              >
                <ListItemText primary={request.user.username} />
              </ListItem>
            ))}
          </List>
        </>
      )}

      {/* lähetetyt pyynnöt: peruuta */}
      {outgoing.length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            Lähetetyt pyynnöt ({outgoing.length})
          </Typography>
          <List dense>
            {outgoing.map((request) => (
              <ListItem
                key={request.id}
                secondaryAction={
                  <Button size="small" color="error" onClick={() => run(() => deleteRequest(request.id))}>
                    Peruuta
                  </Button>
                }
              >
                <ListItemText primary={request.user.username} />
              </ListItem>
            ))}
          </List>
        </>
      )}

      {/* kaverilista */}
      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        Kaverit ({friends.length})
      </Typography>
      <List dense>
        {friends.map((friend) => (
          <ListItem key={friend.id}>
            <ListItemText primary={friend.username} />
          </ListItem>
        ))}
        {friends.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Ei vielä kavereita
          </Typography>
        )}
      </List>
    </Box>
  );
}

export default FriendsPanel;