import { describe, expect, it, vi } from 'vitest';
import { confirmVoting, getVoting, setVoting, vote } from '../../../components/calendar/votingApi';
import { saveToken } from '../../../authApi';

function mockFetch(ok: boolean, body: unknown = {}, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({ ok, status, json: () => Promise.resolve(body) });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('votingApi', () => {
  it('getVoting hakee äänestyksen tokenilla', async () => {
    saveToken('jwt-token');
    const fetchMock = mockFetch(true, { status: 'OPEN', options: [] });

    const result = await getVoting(5);

    expect(result.status).toBe('OPEN');
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/events\/5\/voting$/);
    expect(options.headers).toEqual({ Authorization: 'Bearer jwt-token' });
  });

  it('setVoting lähettää PUT-pyynnön vaihtoehdoilla', async () => {
    const fetchMock = mockFetch(true, { status: 'OPEN', options: [] });

    await setVoting(5, [{ startTime: '2030-02-01T18:00', endTime: '2030-02-01T20:00' }], 36);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/events\/5\/voting$/);
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body)).toEqual({
      options: [{ startTime: '2030-02-01T18:00', endTime: '2030-02-01T20:00' }],
      durationHours: 36,
    });
  });

  it('vote lähettää valitun vaihtoehdon', async () => {
    const fetchMock = mockFetch(true, { status: 'OPEN', options: [] });

    await vote(5, 11);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/events\/5\/voting\/vote$/);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ optionId: 11 });
  });

  it('vote heittää backendin viestin virheenä', async () => {
    mockFetch(false, { message: 'Voting has ended' }, 409);
    await expect(vote(5, 11)).rejects.toThrow('Voting has ended');
  });

  it('virhe ilman viestiä sisältää statuskoodin', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.reject(new Error('ei jsonia')) });
    vi.stubGlobal('fetch', fetchMock);
    await expect(getVoting(5)).rejects.toThrow('500');
  });

  it('confirmVoting palauttaa voittajan ja muuntaa tapahtuman kalenterimuotoon', async () => {
    const fetchMock = mockFetch(true, {
      winnerOptionId: 12,
      voting: { status: 'CLOSED', options: [] },
      event: {
        id: 5,
        title: 'Elokuvat',
        description: '',
        startTime: '2030-02-02T18:00:00',
        endTime: '2030-02-02T20:00:00',
        votingStatus: 'CLOSED',
      },
    });

    const result = await confirmVoting(5);

    expect(result.winnerOptionId).toBe(12);
    expect(result.event.start).toBe('2030-02-02T18:00:00');
    expect(result.event.votingStatus).toBe('CLOSED');
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/events\/5\/voting\/confirm$/);
    expect(options.method).toBe('POST');
  });
});
