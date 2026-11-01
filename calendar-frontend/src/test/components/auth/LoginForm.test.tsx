import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginForm from '../../../components/auth/LoginForm';
import { login, register } from '../../../authApi';

// mockataan vain backend-kutsut, tokenin tallennus toimii oikeasti
vi.mock('../../../authApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../authApi')>()),
  login: vi.fn(),
  register: vi.fn(),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.mocked(login).mockReset();
    vi.mocked(register).mockReset();
  });

  it('kirjautuu sisään, tallentaa tokenin ja kutsuu onLoggedIn', async () => {
    vi.mocked(login).mockResolvedValue('token123');
    const onLoggedIn = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm onLoggedIn={onLoggedIn} />);

    await user.type(screen.getByLabelText(/Käyttäjätunnus/), 'testi');
    await user.type(screen.getByLabelText(/Salasana/), 'salasana');
    await user.click(screen.getByRole('button', { name: 'Kirjaudu' }));

    expect(login).toHaveBeenCalledWith('testi', 'salasana');
    expect(onLoggedIn).toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBe('token123');
  });

  it('näyttää virheilmoituksen, jos kirjautuminen epäonnistuu', async () => {
    vi.mocked(login).mockRejectedValue(new Error('fail'));
    const onLoggedIn = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm onLoggedIn={onLoggedIn} />);

    await user.type(screen.getByLabelText(/Käyttäjätunnus/), 'testi');
    await user.type(screen.getByLabelText(/Salasana/), 'vaara');
    await user.click(screen.getByRole('button', { name: 'Kirjaudu' }));

    expect(await screen.findByText('Väärä käyttäjätunnus tai salasana')).toBeInTheDocument();
    expect(onLoggedIn).not.toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('sähköpostikenttä näkyy vain rekisteröitymisessä', async () => {
    const user = userEvent.setup();
    render(<LoginForm onLoggedIn={vi.fn()} />);

    expect(screen.queryByLabelText(/Sähköposti/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Rekisteröidy' }));
    expect(screen.getByLabelText(/Sähköposti/)).toBeInTheDocument();
  });

  it('rekisteröi uuden käyttäjän', async () => {
    vi.mocked(register).mockResolvedValue('uusitoken');
    const onLoggedIn = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm onLoggedIn={onLoggedIn} />);

    await user.click(screen.getByRole('tab', { name: 'Rekisteröidy' }));
    await user.type(screen.getByLabelText(/Käyttäjätunnus/), 'uusi');
    await user.type(screen.getByLabelText(/Sähköposti/), 'uusi@example.com');
    await user.type(screen.getByLabelText(/Salasana/), 'salasana');
    await user.click(screen.getByRole('button', { name: 'Rekisteröidy' }));

    expect(register).toHaveBeenCalledWith('uusi', 'uusi@example.com', 'salasana');
    expect(onLoggedIn).toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBe('uusitoken');
  });

  it('näyttää virheilmoituksen, jos rekisteröinti epäonnistuu', async () => {
    vi.mocked(register).mockRejectedValue(new Error('fail'));
    const user = userEvent.setup();
    render(<LoginForm onLoggedIn={vi.fn()} />);

    await user.click(screen.getByRole('tab', { name: 'Rekisteröidy' }));
    await user.type(screen.getByLabelText(/Käyttäjätunnus/), 'uusi');
    await user.type(screen.getByLabelText(/Sähköposti/), 'uusi@example.com');
    await user.type(screen.getByLabelText(/Salasana/), 'salasana');
    await user.click(screen.getByRole('button', { name: 'Rekisteröidy' }));

    expect(await screen.findByText('Rekisteröinti epäonnistui')).toBeInTheDocument();
  });
});
