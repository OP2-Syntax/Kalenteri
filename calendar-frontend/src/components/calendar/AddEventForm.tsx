import React from 'react';
import { createEvent } from './calendarApi';
import type { SchedulerEvent } from '@mui/x-scheduler/models';
import { Box, Button, TextField } from '@mui/material';

interface AddEventFormProps {
    onCreated: (event: SchedulerEvent) => void;
    onCancel: () => void;
}

function AddEventForm({ onCreated, onCancel }: AddEventFormProps) {

    const [title, setTitle] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [startTime, setStartTime] = React.useState('');
    const [endTime, setEndTime] = React.useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newEvent = await createEvent({
                title,
                description,
                startTime,
                endTime
            });
            onCreated(newEvent);

            setTitle("");
            setDescription("");
            setStartTime("");
            setEndTime("");
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
                <label style={{width:150}}>Start Time:</label>
                <TextField
                    type="datetime-local"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    required
                    fullWidth
                />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <label style={{width:150}}>End Time:</label>
                <TextField
                    type="datetime-local"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    required
                    fullWidth
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