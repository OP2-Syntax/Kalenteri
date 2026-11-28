import { describe, expect, it } from 'vitest';
import { toCalendarEvent } from '../../../components/calendar/eventMapper';

describe('toCalendarEvent', () => {
  it('marks events owned by another user as read-only', () => {
    const event = toCalendarEvent({
      id: 1,
      title: 'Shared event',
      description: '',
      startTime: '2026-11-28T10:00',
      endTime: '2026-11-28T11:00',
      ownerUsername: 'someone-else',
      mine: false,
      participants: [],
      color: null,
      votingStatus: 'NONE',
    });

    expect(event.readOnly).toBe(true);
  });

  it('keeps the creator event editable', () => {
    const event = toCalendarEvent({
      id: 2,
      title: 'My event',
      description: '',
      startTime: '2026-11-28T10:00',
      endTime: '2026-11-28T11:00',
      ownerUsername: 'me',
      mine: true,
      participants: [],
      color: null,
      votingStatus: 'NONE',
    });

    expect(event.readOnly).toBeUndefined();
  });
});
