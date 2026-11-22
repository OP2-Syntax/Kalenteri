import React, { useEffect, useState } from 'react';
import { createEvent } from './calendarApi';
//import type { SchedulerEvent } from '@mui/x-scheduler/models';
import { Alert, Autocomplete, Box, Button, FormControlLabel, Switch, TextField } from '@mui/material';
import type { CalendarEvent } from './calendarApi';
import { getFriends, type Friend } from '../friends/friendsApi';
import { setVoting } from './votingApi';

// yksi äänestettävä ajankohta lomakkeella (datetime-local-muodossa)
interface OptionRow {
    start: string;
    end: string;
}

const emptyOption = (): OptionRow => ({ start: '', end: '' });

interface AddEventFormProps {
    onCreated: (event: CalendarEvent) => void;
    onCancel: () => void;
}

function AddEventForm({ onCreated, onCancel }: AddEventFormProps) {

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('')
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState('')
    const [endTime, setEndTime] = useState('');
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
    // äänestystila: kiinteän ajan sijaan annetaan vaihtoehdot
    const [voteMode, setVoteMode] = useState(false);
    const [options, setOptions] = useState<OptionRow[]>([emptyOption(), emptyOption()]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        getFriends()
            .then(setFriends)
            .catch((error) => console.error("Kaverilistan haku epäonnistui: ", error));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {

        e.preventDefault();

        setErrorMessage(null);

        // tarkistetaan äänestyksen tiedot ennen tapahtuman luontia, ettei tapahtuma jää ilman äänestystä
        if (voteMode) {
            if (options.some((option) => option.end <= option.start)) {
                setErrorMessage('Each option must end after it starts');
                return;
            }
            if (new Set(options.map((option) => `${option.start}|${option.end}`)).size !== options.length) {
                setErrorMessage('Options must be different from each other');
                return;
            }
        }

        // äänestystilassa tapahtuman alustava aika on ensimmäinen vaihtoehto
        const startDateTime = voteMode ? options[0].start : `${startDate}T${startTime}`;
        const endDateTime = voteMode ? options[0].end : `${endDate}T${endTime}`;

        try {
            let newEvent = await createEvent({
                title,
                description,
                startTime: startDateTime,
                endTime: endDateTime,
                ...(selectedFriends.length > 0
                    ? { participantIds: selectedFriends.map((friend) => friend.id) }
                    : {}),
            });

            if (voteMode) {
                try {
                    await setVoting(
                        Number(newEvent.id),
                        options.map((option) => ({ startTime: option.start, endTime: option.end }))
                    );
                    newEvent = { ...newEvent, votingStatus: 'OPEN' };
                } catch (votingError) {
                    // tapahtuma luotiin, mutta äänestys ei: kerrotaan käyttäjälle
                    onCreated(newEvent);
                    console.error("Äänestyksen luominen epäonnistui: ", votingError);
                    return;
                }
            }
            onCreated(newEvent);

            setTitle("");
            setDescription("");
            setStartTime("");
            setStartDate("")
            setEndTime("");
            setEndDate("");
            setSelectedFriends([]);
            setVoteMode(false);
            setOptions([emptyOption(), emptyOption()]);
        } catch (error) {
            console.error("Tapahtuman lisääminen epöonnistui: ", error);
            setErrorMessage(error instanceof Error ? error.message : 'Tapahtuman lisääminen epäonnistui');
        }
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                p: 3,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <label style={{width:150}}>Title:</label>
                <TextField
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    fullWidth
                />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <label style={{width:150}}>Description:</label>
                <TextField
                    type="text"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    fullWidth
                />
            </Box>

            {!voteMode && (
                <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <label style={{width:110}}>Start Time:</label>
                <TextField
                    style={{width:150}}
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    required
                    fullWidth
                />

                <TextField
                    style={{width:120}}
                    type='time'
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    required
                />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <label style={{width:110}}>End Time:</label>
                <TextField
                    style={{width:150}}
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    required
                    fullWidth
                />

                <TextField
                    style={{width:120}}
                    type='time'
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    required
                />
            </Box>

                </>
            )}

            <FormControlLabel
                control={
                    <Switch
                        checked={voteMode}
                        onChange={(event) => setVoteMode(event.target.checked)}
                    />
                }
                label="Let friends vote on the time"
            />

            {voteMode && (
                <>
                    {options.map((option, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <label style={{width:110}}>Option {index + 1}:</label>
                            <TextField
                                type="datetime-local"
                                value={option.start}
                                onChange={(event) =>
                                    setOptions((prev) => prev.map((row, i) => (i === index ? { ...row, start: event.target.value } : row)))
                                }
                                required
                                slotProps={{ htmlInput: { 'aria-label': `Option ${index + 1} start` } }}
                            />
                            <TextField
                                type="datetime-local"
                                value={option.end}
                                onChange={(event) =>
                                    setOptions((prev) => prev.map((row, i) => (i === index ? { ...row, end: event.target.value } : row)))
                                }
                                required
                                slotProps={{ htmlInput: { 'aria-label': `Option ${index + 1} end` } }}
                            />
                            <Button
                                type="button"
                                disabled={options.length <= 2}
                                onClick={() => setOptions((prev) => prev.filter((_row, i) => i !== index))}
                            >
                                Remove
                            </Button>
                        </Box>
                    ))}
                    <Box>
                        <Button
                            type="button"
                            disabled={options.length >= 10}
                            onClick={() => setOptions((prev) => [...prev, emptyOption()])}
                        >
                            Add option
                        </Button>
                    </Box>
                </>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <label style={{width:150}}>Friends:</label>
                <Autocomplete
                    multiple
                    fullWidth
                    options={friends}
                    value={selectedFriends}
                    onChange={(_event, value) => setSelectedFriends(value)}
                    getOptionLabel={(friend) => friend.username}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    noOptionsText="No friends"
                    renderInput={(params) => (
                        <TextField {...params} placeholder="Invite friends (optional)" /> 
                    )}
                />
            </Box>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button type="button" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" variant="contained">
                    Add Event
                </Button>

            </Box>
        </Box>
    );
}

export default AddEventForm;
