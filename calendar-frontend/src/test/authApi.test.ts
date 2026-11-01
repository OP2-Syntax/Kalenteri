import { describe, expect, it, vi } from 'vitest';
import { getToken, login, logout, register, saveToken } from '../authApi';

function mockFetch(ok: boolean, body: unknown = {}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 401,
    json: () => Promise.resolve(body),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('authApi', () => {
  it('login palauttaa tokenin ja lähettää tunnukset', async () => {
    const fetchMock = mockFetch(true, { token: 'abc123' });

    const token = await login('testi', 'salasana');

    expect(token).toBe('abc123');
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/auth\/login$/);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ username: 'testi', password: 'salasana' });
  });

  it('login heittää virheen, jos vastaus ei ole ok', async () => {
    mockFetch(false);
    await expect(login('testi', 'vaara')).rejects.toThrow('Kirjautuminen epäonnistui');
  });

  it('register palauttaa tokenin ja lähettää sähköpostin', async () => {
    const fetchMock = mockFetch(true, { token: 'uusi' });

    const token = await register('testi', 'testi@example.com', 'salasana');

    expect(token).toBe('uusi');
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/auth\/register$/);
    expect(JSON.parse(options.body)).toEqual({
      username: 'testi',
      email: 'testi@example.com',
      password: 'salasana',
    });
  });

  it('register heittää virheen, jos vastaus ei ole ok', async () => {
    mockFetch(false);
    await expect(register('a', 'b@c.fi', 'd')).rejects.toThrow('Rekisteröinti epäonnistui');
  });

  it('token tallennetaan, haetaan ja poistetaan localStoragesta', () => {
    expect(getToken()).toBeNull();
    saveToken('token1');
    expect(getToken()).toBe('token1');
    logout();
    expect(getToken()).toBeNull();
  });
});
