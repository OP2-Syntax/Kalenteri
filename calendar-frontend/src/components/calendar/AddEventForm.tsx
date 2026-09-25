import React from 'react';
import { createEvent } from './calendarApi';
import type { SchedulerEvent } from '@mui/x-scheduler/models';
import { Button } from '@mui/material';

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
        <form onSubmit={handleSubmit}>
            <div>
                <label>Title</label>
                <input
                    type='text'
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                />
            </div>
            <div>
                <label>Description</label>
                <input 
                    type="text"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                />
            </div>
            <div>
                <label>Start Time</label>
                <input 
                    type='datetime-local'
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    required
                />
            </div>
            <div>
                <label>End Time</label>
                <input 
                    type='datetime-local'
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    required
                />
            </div>
            <Button type="submit">
                Add Event
            </Button>

            <Button
                type="button"
                onClick={onCancel}
            >
                Cancel
            </Button>

        </form>
    );
}

export default AddEventForm;