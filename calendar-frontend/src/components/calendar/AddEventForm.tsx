import React, { useEffect, useState } from 'react';
import { createEvent } from './calendarApi';
//import type { SchedulerEvent } from '@mui/x-scheduler/models';
import { Alert, Autocomplete, Box, Button, FormControlLabel, Switch, TextField } from '@mui/material';
import { amber, blue, green, grey, indigo, lime, orange, pink, purple, red, teal } from '@mui/material/colors';
import type { SchedulerEventColor } from '@mui/x-scheduler/models';
import type { CalendarEvent } from './calendarApi';
import { getFriends, type Friend } from '../friends/friendsApi';
import { setVoting } from './votingApi';
import { getGroups, type CalendarGroup } from '../groups/groupsApi';

// yksi äänestettävä ajankohta lomakkeella (datetime-local-muodossa)
interface OptionRow {
    start: string;
    end: string;
}

const emptyOption = (): OptionRow => ({ start: '', end: '' });

const EVENT_COLORS: { value: SchedulerEventColor; swatch: string }[] = [
    { value: 'red', swatch: red[500] },
    { value: 'pink', swatch: pink[500] },
    { value: 'purple', swatch: purple[500] },
    { value: 'indigo', swatch: indigo[500] },
    { value: 'blue', swatch: blue[500] },
    { value: 'teal', swatch: teal[500] },
    { value: 'green', swatch: green[500] },
    { value: 'lime', swatch: lime[500] },
    { value: 'amber', swatch: amber[500] },
    { value: 'orange', swatch: orange[500] },
    { value: 'grey', swatch: grey[500] },
];

interface AddEventFormProps {
    onCreated: (event: CalendarEvent) => void;
    onCancel: () => void;
    initialStartTime?: string;
    initialEndTime?: string;
}

function AddEventForm({
    onCreated,
    onCancel,
    initialStartTime,
    initialEndTime,
}: AddEventFormProps) {

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState<SchedulerEventColor | ''>('');
    const [startDate, setStartDate] = useState(initialStartTime?.slice(0, 10) ?? '')
    const [startTime, setStartTime] = useState(initialStartTime?.slice(11, 16) ?? '');
    const [endDate, setEndDate] = useState(initialEndTime?.slice(0, 10) ?? '')
    const [endTime, setEndTime] = useState(initialEndTime?.slice(11, 16) ?? '');
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
    const [groups, setGroups] = useState<CalendarGroup[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<CalendarGroup[]>([]);
    // äänestystila: kiinteän ajan sijaan annetaan vaihtoehdot
    const [voteMode, setVoteMode] = useState(false);
    const [durationHours, setDurationHours] = useState('24');
    const [options, setOptions] = useState<OptionRow[]>([
        initialStartTime && initialEndTime
            ? { start: initialStartTime, end: initialEndTime }
            : emptyOption(),
        emptyOption(),
    ]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        getFriends()
            .then(setFriends)
            .catch((error) => console.error('Friend list loading failed: ', error));
        getGroups()
            .then(setGroups)
            .catch((error) => console.error('Group list loading failed: ', error));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {

        e.preventDefault();

        setErrorMessage(null);

        // tarkistetaan äänestyksen tiedot ennen tapahtuman luontia, ettei tapahtuma jää ilman äänestystä
        if (voteMode) {
            const parsedDuration = Number(durationHours);
            if (!Number.isInteger(parsedDuration) || parsedDuration < 1 || parsedDuration > 8760) {
                setErrorMessage('Voting duration must be between 1 hour and 1 year');
                return;
            }
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
                ...(color ? { color } : {}),
                ...(selectedFriends.length > 0
                    ? { participantIds: selectedFriends.map((friend) => friend.id) }
                    : {}),
                ...(selectedGroups.length > 0
                    ? { groupIds: selectedGroups.map((group) => group.id) }
                    : {}),
            });

            if (voteMode) {
                try {
                    await setVoting(
                        Number(newEvent.id),
                        options.map((option) => ({ startTime: option.start, endTime: option.end })),
                        Number(durationHours),
                    );
                    newEvent = { ...newEvent, votingStatus: 'OPEN' };
                } catch (votingError) {
                    // tapahtuma luotiin, mutta äänestys ei: kerrotaan käyttäjälle
                    onCreated(newEvent);
                    console.error("Create voting failed: ", votingError);
                    return;
                }
            }
            onCreated(newEvent);

            setTitle("");
            setDescription("");
            setColor('');
            setStartTime("");
            setStartDate("")
            setEndTime("");
            setEndDate("");
            setSelectedFriends([]);
            setSelectedGroups([]);
            setVoteMode(false);
            setDurationHours('24');
            setOptions([emptyOption(), emptyOption()]);
        } catch (error) {
            console.error("Add event failed: ", error);
            setErrorMessage(error instanceof Error ? error.message : 'Adding event failed');
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

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <label style={{ width: 150 }}>Event color:</label>
                <Box role="group" aria-label="Event color" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {EVENT_COLORS.map(({ value, swatch }) => {
                        const selected = color === value;
                        return (
                            <Box
                                key={value}
                                component="button"
                                type="button"
                                aria-label={`${value} event color`}
                                aria-pressed={selected}
                                onClick={() => setColor((current) => current === value ? '' : value)}
                                sx={{
                                    width: 28,
                                    height: 28,
                                    p: 0,
                                    borderRadius: '50%',
                                    border: selected ? '2px solid' : '1px solid',
                                    borderColor: selected ? 'text.primary' : 'divider',
                                    bgcolor: swatch,
                                    cursor: 'pointer',
                                    appearance: 'none',
                                    '&:focus-visible': {
                                        outline: '2px solid',
                                        outlineColor: 'text.primary',
                                        outlineOffset: 2,
                                    },
                                }}
                            />
                        );
                    })}
                </Box>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <label htmlFor="voting-duration-hours" style={{ width: 150 }}>
                            Voting duration (hours):
                        </label>
                        <TextField
                            id="voting-duration-hours"
                            type="number"
                            value={durationHours}
                            onChange={(event) => setDurationHours(event.target.value)}
                            required
                            slotProps={{ htmlInput: { min: 1, max: 8760, step: 1 } }}
                        />
                    </Box>
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

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <label style={{width:150}}>Groups:</label>
                <Autocomplete
                    multiple
                    fullWidth
                    options={groups}
                    value={selectedGroups}
                    onChange={(_event, value) => setSelectedGroups(value)}
                    getOptionLabel={(group) => group.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    noOptionsText="No groups"
                    renderInput={(params) => (
                        <TextField {...params} placeholder="Invite a group (optional)" />
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
