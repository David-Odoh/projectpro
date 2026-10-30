import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './LoginPage';
import { signIn } from './auth-client';

vi.mock('./auth-client', () => ({ signIn: { email: vi.fn() } }));

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
