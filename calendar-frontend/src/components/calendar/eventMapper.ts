import type { SchedulerEvent } from '@mui/x-scheduler/models';
import type { Friend } from '../friends/friendsApi';

// Backendin palauttaman tapahtuman muoto (EventResponse)
export interface BackendEvent {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  color?: string | null;
  ownerUsername?: string;
  mine?: boolean;
  participants?: Friend[];
  votingStatus?: VotingStatus;
}

// NONE = ei äänestystä, OPEN = käynnissä, CLOSED = aika vahvistettu
export type VotingStatus = 'NONE' | 'OPEN' | 'CLOSED';

export interface CalendarEvent extends SchedulerEvent {
  description: string;
  ownerUsername?: string;
  mine?: boolean;
  participants?: Friend[];
  votingStatus?: VotingStatus;
}

// muuntaa backendin tapahtuman kalenterin ymmärtämään muotoon
export function toCalendarEvent(event: BackendEvent): CalendarEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    start: event.startTime,
    end: event.endTime,
    ...(event.color ? { color: event.color as CalendarEvent['color'] } : {}),
    ...(event.ownerUsername !== undefined ? { ownerUsername: event.ownerUsername } : {}),
    ...(event.mine !== undefined ? { mine: event.mine } : {}),
    ...(event.participants !== undefined ? { participants: event.participants } : {}),
    ...(event.votingStatus !== undefined ? { votingStatus: event.votingStatus } : {}),
  };
}
