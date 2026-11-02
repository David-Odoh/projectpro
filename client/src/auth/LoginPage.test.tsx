import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './LoginPage';
import { signIn } from './auth-client';

const refetch = vi.hoisted(() => vi.fn());

vi.mock('./auth-client', () => ({
  signIn: { email: vi.fn() },
  useSession: () => ({ refetch }),
}));

const signInEmail = vi.mocked(signIn.email);

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/projects" element={<h1>Projects</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function submitValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Email'), ' ada@example.com ');
  await user.type(screen.getByLabelText('Password'), 'correct horse');
  await user.click(screen.getByRole('button', { name: 'Log in' }));
}

function expectValuesKept() {
  expect(screen.getByLabelText('Email')).toHaveValue('ada@example.com');
  expect(screen.getByLabelText('Password')).toHaveValue('correct horse');
}

describe('LoginPage', () => {
  // Braces matter: Vitest would run a returned function, here the mock itself, as test cleanup.
  beforeEach(() => {
    signInEmail.mockReset();
    refetch.mockReset();
  });

  it('shows a message under each invalid field and does not call the API', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(signInEmail).not.toHaveBeenCalled();
  });

  it('shows a message for a malformed email and does not call the API', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'correct horse');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Password')).not.toHaveAttribute('aria-invalid', 'true');
    expect(signInEmail).not.toHaveBeenCalled();
  });

  it('shows a message for an empty password and does not call the API', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Password is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid', 'true');
    expect(signInEmail).not.toHaveBeenCalled();
  });

  it('sends a short password to the API without revealing the length rules', async () => {
    signInEmail.mockResolvedValue({ data: {}, error: null });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    expect(signInEmail).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'short' });
  });

  it('clears the message and submits once the invalid field is corrected', async () => {
    signInEmail.mockResolvedValue({ data: {}, error: null });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'correct horse');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await screen.findByText('Enter a valid email address');
    expect(signInEmail).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText('Email'));
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    expect(screen.queryByText('Enter a valid email address')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    expect(signInEmail).toHaveBeenCalledOnce();
  });

  it('submits trimmed values and navigates to /projects', async () => {
    signInEmail.mockResolvedValue({ data: {}, error: null });
    const user = userEvent.setup();
    renderPage();

    await submitValidForm(user);

    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    expect(signInEmail).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'correct horse',
    });
  });

  it('starts the session fetch before navigating to /projects', async () => {
    signInEmail.mockResolvedValue({ data: {}, error: null });
    let finishRefetch = () => {};
    refetch.mockReturnValue(new Promise<void>((resolve) => (finishRefetch = resolve)));
    const user = userEvent.setup();
    renderPage();

    await submitValidForm(user);

    expect(refetch).toHaveBeenCalledOnce();
    expect(screen.queryByRole('heading', { name: 'Projects' })).not.toBeInTheDocument();

    finishRefetch();
    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument();
  });

  it('shows a single message for rejected credentials and keeps the values', async () => {
    signInEmail.mockResolvedValue({
      data: null,
      error: { status: 401, code: 'INVALID_EMAIL_OR_PASSWORD', message: 'raw server text' },
    });
    const user = userEvent.setup();
    renderPage();

    await submitValidForm(user);

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(screen.queryByText('raw server text')).not.toBeInTheDocument();
    expectValuesKept();
  });

  it.each([
    [429, 'Too many attempts. Please wait a moment and try again.'],
    [500, 'Something went wrong on our end. Please try again.'],
  ])('does not blame the credentials for a %i response', async (status, message) => {
    signInEmail.mockResolvedValue({ data: null, error: { status } });
    const user = userEvent.setup();
    renderPage();

    await submitValidForm(user);

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByText('Invalid email or password')).not.toBeInTheDocument();
  });

  it('shows a connection message and re-enables the button when the request fails', async () => {
    signInEmail.mockRejectedValue(new TypeError('Failed to fetch'));
    const user = userEvent.setup();
    renderPage();

    await submitValidForm(user);

    expect(
      await screen.findByText('Could not reach the server. Check your connection and try again.'),
    ).toBeInTheDocument();
    expectValuesKept();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled();
  });
});
