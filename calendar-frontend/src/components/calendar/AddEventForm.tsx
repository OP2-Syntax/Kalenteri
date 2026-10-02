import React, { useState } from 'react';
import { createEvent } from './calendarApi';
//import type { SchedulerEvent } from '@mui/x-scheduler/models';
import { Box, Button, TextField } from '@mui/material';
import type { CalendarEvent } from './calendarApi';

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

    const handleSubmit = async (e: React.FormEvent) => {

        e.preventDefault();

        const startDateTime = `${startDate}T${startTime}`;
        const endDateTime = `${endDate}T${endTime}`;

        try {
            const newEvent = await createEvent({
                title,
                description,
                startTime: startDateTime,
                endTime: endDateTime
            });
            onCreated(newEvent);

            setTitle("");
            setDescription("");
            setStartTime("");
            setStartDate("")
            setEndTime("");
            setEndDate("");
        } catch (error) {
            console.error("Tapahtuman lisääminen epöonnistui: ", error);
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