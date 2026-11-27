
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Badge,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';

import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

import { getUsername } from '../authApi';

import {
  getIncomingRequests,
  type FriendRequest,
} from './friends/friendsApi';

import {
  getEvents,
  type CalendarEvent,
} from './calendar/calendarApi';


type NotificationItem = {
  id: string;
  kind: 'friend-request' | 'event-invitation';
  title: string;
  description: string;
};

type Props = {
  onOpenFriends: () => void;
};


// Get the user's read notification IDs from localStorage
function getReadNotificationIds(): string[] {
  try {
    const stored = localStorage.getItem(
      `readNotifications:${getUsername() ?? 'user'}`
    );

    return stored ? JSON.parse(stored) as string[] : [];
  } catch {
    return [];
  }
}


function Notifications({ onOpenFriends }: Props) {

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const [friendRequests, setFriendRequests] =
    useState<FriendRequest[]>([]);

  const [events, setEvents] =
    useState<CalendarEvent[]>([]);

  const [readNotificationIds, setReadNotificationIds] =
    useState<string[]>(getReadNotificationIds);

  const [loadError, setLoadError] = useState(false);


  // Fetch friend requests and calendar events
  const refresh = useCallback(async () => {
    try {
      const [requests, calendarEvents] = await Promise.all([
        getIncomingRequests(),
        getEvents(),
      ]);

      setFriendRequests(requests);
      setEvents(calendarEvents);
      setLoadError(false);

    } catch {
      setLoadError(true);
    }
  }, []);


  // Fetch notifications immediately and refresh every 30 seconds
  useEffect(() => {

    void refresh();

    const interval = window.setInterval(
      () => void refresh(),
      30_000
    );

    return () => window.clearInterval(interval);

  }, [refresh]);


  // Build the notification list
  const notifications = useMemo<NotificationItem[]>(() => {

    // Friend request notifications
    const friendItems = friendRequests.map((request) => ({
      id: `friend-${request.id}`,
      kind: 'friend-request' as const,
      title: 'New Friend Request',
      description: `${request.user.username} wants to be your friend`,
    }));


    // Calendar invitation notifications
    const eventItems = events
      .filter((event) => event.mine === false)
      .map((event) => ({
        id: `event-${event.id}`,
        kind: 'event-invitation' as const,
        title: 'Calendar Invitation',
        description: `You have been invited to "${event.title}"`,
      }));


    return [...friendItems, ...eventItems];

  }, [friendRequests, events]);


  // Calculate the number of unread notifications
  const unreadCount = notifications.filter(
    (notification) =>
      !readNotificationIds.includes(notification.id)
  ).length;


  // Mark a single notification as read
  const markAsRead = (id: string) => {

    setReadNotificationIds((current) => {

      const next = current.includes(id)
        ? current
        : [...current, id];

      localStorage.setItem(
        `readNotifications:${getUsername() ?? 'user'}`,
        JSON.stringify(next)
      );

      return next;
    });
  };


  // Mark all notifications as read
  const markAllAsRead = () => {

    setReadNotificationIds((current) => {

      const next = [
        ...new Set([
          ...current,
          ...notifications.map((item) => item.id),
        ]),
      ];

      localStorage.setItem(
        `readNotifications:${getUsername() ?? 'user'}`,
        JSON.stringify(next)
      );

      return next;
    });
  };


  const closeMenu = () => {
    setAnchorEl(null);
  };


  const handleNotificationClick = (
    notification: NotificationItem
  ) => {

    markAsRead(notification.id);

    closeMenu();

    if (notification.kind === 'friend-request') {
      onOpenFriends();
    }
  };


  return (
    <>

      <IconButton
        aria-label={`Notifications, ${unreadCount} unread`}
        onClick={(event) => {
          setAnchorEl(event.currentTarget);
          void refresh();
        }}
        size="large"
      >

        <Badge
          badgeContent={unreadCount}
          color="error"
          max={99}
        >
          <NotificationsNoneIcon />
        </Badge>

      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              width: 360,
              maxWidth: 'calc(100vw - 24px)',
              maxHeight: 460,
              mt: 1,
              borderRadius: 2,
            },
          },
        }}
      >

        <Typography
          sx={{
            px: 2,
            py: 1.5,
            fontWeight: 700,
          }}
        >
          Notifications
        </Typography>

        <Divider />


        {notifications.length === 0 ? (

          <MenuItem disabled>
            <ListItemText
              primary={
                loadError
                  ? 'Failed to load notifications'
                  : 'No notifications'
              }
            />
          </MenuItem>

        ) : (

          notifications.map((notification) => {

            const isRead = readNotificationIds.includes(
              notification.id
            );

            return (

              <MenuItem
                key={notification.id}
                onClick={() =>
                  handleNotificationClick(notification)
                }
                sx={{
                  alignItems: 'flex-start',
                  whiteSpace: 'normal',
                  py: 1.25,
                  bgcolor: isRead
                    ? 'transparent'
                    : 'action.hover',
                }}
              >

                <ListItemIcon
                  sx={{
                    mt: 0.5,
                    minWidth: 36,
                  }}
                >

                  {notification.kind === 'friend-request'
                    ? (
                      <PersonAddAlt1Icon
                        color="primary"
                        fontSize="small"
                      />
                    )
                    : (
                      <EventAvailableIcon
                        color="primary"
                        fontSize="small"
                      />
                    )}

                </ListItemIcon>

                <ListItemText
                  primary={notification.title}
                  secondary={notification.description}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontWeight: isRead ? 400 : 700,
                    },
                    '& .MuiListItemText-secondary': {
                      whiteSpace: 'normal',
                    },
                  }}
                />

                {!isRead && (
                  <Typography
                    variant="caption"
                    color="primary"
                    sx={{ ml: 1 }}
                  >
                    New
                  </Typography>
                )}

              </MenuItem>

            );
          })

        )}


        // Mark all notifications as read
        {notifications.length > 0 && (

          <>
            <Divider />

            <MenuItem
              onClick={markAllAsRead}
              dense
            >
              <ListItemText
                primary="Mark all as read"
                sx={{
                  textAlign: 'center',
                  color: 'primary.main',
                }}
              />
            </MenuItem>
          </>

        )}

      </Menu>

    </>
  );
}


export default Notifications;

