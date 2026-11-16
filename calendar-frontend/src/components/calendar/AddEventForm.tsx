import React, { useEffect, useState } from 'react';
import { createEvent } from './calendarApi';
//import type { SchedulerEvent } from '@mui/x-scheduler/models';
import { Autocomplete, Box, Button, TextField } from '@mui/material';
import type { CalendarEvent } from './calendarApi';
import { getFriends, type Friend } from '../friends/friendsApi';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import type { Dayjs } from 'dayjs';

interface AddEventFormProps {
    onCreated: (event: CalendarEvent) => void;
    onCancel: () => void;
}

function AddEventForm({ onCreated, onCancel }: AddEventFormProps) {

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState<Dayjs | null>(null)
    const [startTime, setStartTime] = useState<Dayjs | null>(null);
    const [endDate, setEndDate] = useState<Dayjs | null>(null)
    const [endTime, setEndTime] = useState<Dayjs | null>(null);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);

    useEffect(() => {
        getFriends()
            .then(setFriends)
            .catch((error) => console.error("Kaverilistan haku epäonnistui: ", error));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {

        e.preventDefault();

        if (!startDate || !startTime || !endDate || !endTime) return;

        const endDateTime = `${endDate.format('YYYY-MM-DD')}T${endTime.format('HH:mm')}`;
        const startDateTime = `${startDate.format('YYYY-MM-DD')}T${startTime.format('HH:mm')}`;

        try {
            const newEvent = await createEvent({
                title,
                description,
                startTime: startDateTime,
                endTime: endDateTime,
                ...(selectedFriends.length > 0
                    ? { participantIds: selectedFriends.map((friend) => friend.id) }
                    : {}),
            });
            onCreated(newEvent);

            setTitle("");
            setDescription("");
            setStartTime(null);
            setStartDate(null)
            setEndTime(null);
            setEndDate(null);
            setSelectedFriends([]);
        } catch (error) {
            console.error("Tapahtuman lisääminen epöonnistui: ", error);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}> 
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
                <label style={{width:110}}>Start Time:</label>
                <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(value) => setStartDate(value)}
                    sx={{ width: 150}}
                />

                <TimePicker
                    label="Start Time"
                    value={startTime}
                    onChange={(value) => setStartTime(value)}
                    sx= {{ width:120}}
                />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <label style={{width:110}}>End Time:</label>
                <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(value) => setEndDate(value)}
                    sx= {{ width: 150}}
                />

                <TimePicker
                    label="End Time"
                    value={endTime}
                    onChange={(value) => setEndTime(value)}
                    sx= {{width: 120}}
                />
            </Box>

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

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button type="button" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" variant="contained">
                    Add Event
                </Button>

            </Box>
        </Box>
        </LocalizationProvider>
    );
}

export default AddEventForm;
