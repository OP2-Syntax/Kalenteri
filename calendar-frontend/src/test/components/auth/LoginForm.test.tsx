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

    await user.type(screen.getByLabelText(/User name/), 'testi');
    await user.type(screen.getByLabelText(/Password/), 'salasana');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(login).toHaveBeenCalledWith('testi', 'salasana');
    expect(onLoggedIn).toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBe('token123');
  });

  it('näyttää virheilmoituksen, jos kirjautuminen epäonnistuu', async () => {
    vi.mocked(login).mockRejectedValue(new Error('fail'));
    const onLoggedIn = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm onLoggedIn={onLoggedIn} />);

    await user.type(screen.getByLabelText(/User name/), 'testi');
    await user.type(screen.getByLabelText(/Password/), 'vaara');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Wrong user name or password')).toBeInTheDocument();
    expect(onLoggedIn).not.toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('sähköpostikenttä näkyy vain rekisteröitymisessä', async () => {
    const user = userEvent.setup();
    render(<LoginForm onLoggedIn={vi.fn()} />);

    expect(screen.queryByLabelText(/E-mail/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Register' }));
    expect(screen.getByLabelText(/E-mail/)).toBeInTheDocument();
  });

  it('rekisteröi uuden käyttäjän', async () => {
    vi.mocked(register).mockResolvedValue('uusitoken');
    const onLoggedIn = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm onLoggedIn={onLoggedIn} />);

    await user.click(screen.getByRole('tab', { name: 'Register' }));
    await user.type(screen.getByLabelText(/User name/), 'uusi');
    await user.type(screen.getByLabelText(/E-mail/), 'uusi@example.com');
    await user.type(screen.getByLabelText(/Password/), 'salasana');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(register).toHaveBeenCalledWith('uusi', 'uusi@example.com', 'salasana');
    expect(onLoggedIn).toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBe('uusitoken');
  });

  it('näyttää virheilmoituksen, jos rekisteröinti epäonnistuu', async () => {
    vi.mocked(register).mockRejectedValue(new Error('fail'));
    const user = userEvent.setup();
    render(<LoginForm onLoggedIn={vi.fn()} />);

    await user.click(screen.getByRole('tab', { name: 'Register' }));
    await user.type(screen.getByLabelText(/User name/), 'uusi');
    await user.type(screen.getByLabelText(/E-mail/), 'uusi@example.com');
    await user.type(screen.getByLabelText(/Password/), 'salasana');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Registering failed')).toBeInTheDocument();
  });
});
