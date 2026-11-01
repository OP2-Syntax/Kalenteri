import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';

// kalenteri testataan erikseen, tässä riittää tarkistaa että se näytetään
vi.mock('../components/calendar/Calendar', () => ({
  default: () => <div>Kalenterinäkymä</div>,
}));

describe('App', () => {
  it('näyttää kirjautumislomakkeen, kun tokenia ei ole', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: 'Kirjaudu' })).toBeInTheDocument();
    expect(screen.queryByText('Kalenterinäkymä')).not.toBeInTheDocument();
  });

  it('näyttää kalenterin, kun token on tallessa', () => {
    localStorage.setItem('token', 'token123');
    render(<App />);

    expect(screen.getByText('Kalenterinäkymä')).toBeInTheDocument();
  });

  it('uloskirjautuminen poistaa tokenin ja palauttaa kirjautumissivulle', async () => {
    localStorage.setItem('token', 'token123');
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Kirjaudu ulos' }));

    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByRole('button', { name: 'Kirjaudu' })).toBeInTheDocument();
  });

  it('teemapainike vaihtaa tumman ja vaalean tilan välillä', async () => {
    localStorage.setItem('token', 'token123');
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Dark Mode' }));
    expect(screen.getByRole('button', { name: 'Light Mode' })).toBeInTheDocument();
  });
});
