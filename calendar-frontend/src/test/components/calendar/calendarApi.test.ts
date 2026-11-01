import { describe, expect, it, vi } from 'vitest';
import { createEvent, deleteEvent, getEvents, updateEvent } from '../../../components/calendar/calendarApi';
import { saveToken } from '../../../authApi';

const backendEvent = {
  id: 1,
  title: 'Palaveri',
  description: 'Viikkopalaveri',
  startTime: '2026-11-02T10:00:00',
  endTime: '2026-11-02T11:00:00',
};

const calendarEvent = {
  id: 1,
  title: 'Palaveri',
  description: 'Viikkopalaveri',
  start: '2026-11-02T10:00:00',
  end: '2026-11-02T11:00:00',
};

const eventData = {
  title: 'Palaveri',
  description: 'Viikkopalaveri',
  startTime: '2026-11-02T10:00:00',
  endTime: '2026-11-02T11:00:00',
};

function mockFetch(ok: boolean, body: unknown = {}, status = ok ? 200 : 500) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('calendarApi', () => {
  it('getEvents muuntaa backendin tapahtumat kalenterin muotoon', async () => {
    mockFetch(true, [backendEvent]);
    await expect(getEvents()).resolves.toEqual([calendarEvent]);
  });

  it('getEvents lisää Authorization-headerin, kun token on tallessa', async () => {
    saveToken('jwt-token');
    const fetchMock = mockFetch(true, []);

    await getEvents();

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/events$/);
    expect(options.headers).toEqual({ Authorization: 'Bearer jwt-token' });
  });

  it('getEvents ei lisää Authorization-headeria ilman tokenia', async () => {
    const fetchMock = mockFetch(true, []);
    await getEvents();
    expect(fetchMock.mock.calls[0][1].headers).toEqual({});
  });

  it('getEvents heittää virheen statuskoodin kanssa', async () => {
    mockFetch(false, {}, 403);
    await expect(getEvents()).rejects.toThrow('403');
  });

  it('createEvent lähettää POST-pyynnön ja palauttaa luodun tapahtuman', async () => {
    saveToken('jwt-token');
    const fetchMock = mockFetch(true, backendEvent);

    const result = await createEvent(eventData);

    expect(result).toEqual(calendarEvent);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/events$/);
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt-token',
    });
    expect(JSON.parse(options.body)).toEqual(eventData);
  });

  it('createEvent heittää virheen, jos tallennus epäonnistuu', async () => {
    mockFetch(false, {}, 400);
    await expect(createEvent(eventData)).rejects.toThrow('400');
  });

  it('updateEvent lähettää PUT-pyynnön oikeaan osoitteeseen', async () => {
    const fetchMock = mockFetch(true, { ...backendEvent, title: 'Muutettu' });

    const result = await updateEvent(1, { ...eventData, title: 'Muutettu' });

    expect(result.title).toBe('Muutettu');
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/events\/1$/);
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body).title).toBe('Muutettu');
  });

  it('updateEvent heittää virheen, jos päivitys epäonnistuu', async () => {
    mockFetch(false, {}, 404);
    await expect(updateEvent(99, eventData)).rejects.toThrow('404');
  });

  it('deleteEvent lähettää DELETE-pyynnön oikeaan osoitteeseen', async () => {
    const fetchMock = mockFetch(true);

    await deleteEvent(5);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/events\/5$/);
    expect(options.method).toBe('DELETE');
  });

  it('deleteEvent heittää virheen, jos poisto epäonnistuu', async () => {
    mockFetch(false, {}, 404);
    await expect(deleteEvent(5)).rejects.toThrow('404');
  });
});
