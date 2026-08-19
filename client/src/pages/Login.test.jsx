import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const login = vi.fn();
const loginAsDemo = vi.fn();
const navigate = vi.fn();

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({ login, loginAsDemo }),
}));

vi.mock('react-router', async importOriginal => ({
  ...(await importOriginal()),
  useNavigate: () => navigate,
}));

const { default: Login } = await import('./Login.jsx');

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  login.mockReset().mockResolvedValue({});
  loginAsDemo.mockReset().mockResolvedValue({});
  navigate.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('signing in', () => {
  it('will not call the server with an obviously wrong email', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.type(screen.getByLabelText(/password/i), 'correct-horse');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(
      await screen.findByText(/please enter a valid email address/i),
    ).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('says when a field is empty', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('sends the normalised email, not what was typed', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(
      screen.getByLabelText(/email/i),
      '  Jordan.Blake@Example.Test ',
    );
    await user.type(screen.getByLabelText(/password/i), 'correct-horse');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(login).toHaveBeenCalledWith({
      email: 'jordan.blake@example.test',
      password: 'correct-horse',
    });
  });

  it('goes to the app once it works', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(
      screen.getByLabelText(/email/i),
      'jordan.blake@example.test',
    );
    await user.type(screen.getByLabelText(/password/i), 'correct-horse');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(navigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('shows what the server said when the details are wrong', async () => {
    login.mockRejectedValue(
      Object.assign(new Error('Email or password is incorrect.'), {
        errors: {},
      }),
    );

    const user = userEvent.setup();
    renderLogin();

    await user.type(
      screen.getByLabelText(/email/i),
      'jordan.blake@example.test',
    );
    await user.type(screen.getByLabelText(/password/i), 'wrong-horse');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /email or password is incorrect/i,
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it('puts a field error from the server next to its field', async () => {
    login.mockRejectedValue(
      Object.assign(new Error('Please check the details you entered.'), {
        errors: { email: 'That email is already registered.' },
      }),
    );

    const user = userEvent.setup();
    renderLogin();

    await user.type(
      screen.getByLabelText(/email/i),
      'jordan.blake@example.test',
    );
    await user.type(screen.getByLabelText(/password/i), 'correct-horse');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(
      await screen.findByText(/that email is already registered/i),
    ).toBeInTheDocument();
  });
});

describe('the demo account', () => {
  it('signs in with one click and needs nothing typed', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /try the demo/i }));

    expect(loginAsDemo).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('says so when the demo is not set up on the server', async () => {
    loginAsDemo.mockRejectedValue(
      new Error('The demo account is not set up on this server.'),
    );

    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /try the demo/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /demo account is not set up/i,
    );
  });
});
