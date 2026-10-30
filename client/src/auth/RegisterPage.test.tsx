import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegisterPage from './RegisterPage';
import { signUp } from './auth-client';

vi.mock('./auth-client', () => ({ signUp: { email: vi.fn() } }));

const signUpEmail = vi.mocked(signUp.email);

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/projects" element={<h1>Projects</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function submitValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Name'), 'Ada');
  await user.type(screen.getByLabelText('Email'), 'ada@example.com');
  await user.type(screen.getByLabelText('Password'), 'correct horse');
  await user.click(screen.getByRole('button', { name: 'Create account' }));
}

function expectValuesKept() {
  expect(screen.getByLabelText('Name')).toHaveValue('Ada');
  expect(screen.getByLabelText('Email')).toHaveValue('ada@example.com');
  expect(screen.getByLabelText('Password')).toHaveValue('correct horse');
}

describe('RegisterPage', () => {
  // Braces matter: Vitest would run a returned function, here the mock itself, as test cleanup.
  beforeEach(() => {
    signUpEmail.mockReset();
  });

  it('shows a message under each invalid field and does not call the API', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
    expect(signUpEmail).not.toHaveBeenCalled();
  });

  it('submits trimmed values and navigates to /projects', async () => {
    signUpEmail.mockResolvedValue({ data: {}, error: null });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Name'), '  Ada  ');
    await user.type(screen.getByLabelText('Email'), ' ada@example.com ');
    await user.type(screen.getByLabelText('Password'), 'correct horse');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    expect(signUpEmail).toHaveBeenCalledWith({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'correct horse',
    });
  });

  it('shows an already-registered email on the email field and keeps the values', async () => {
    signUpEmail.mockResolvedValue({
      data: null,
      error: {
        code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
        message: 'User already exists. Use another email.',
        status: 422,
      },
    });
    const user = userEvent.setup();
    renderPage();

    await submitValidForm(user);

    expect(
      await screen.findByText(
        'An account with this email already exists. Log in or use a different email.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expectValuesKept();
  });

  it('shows a connection message and keeps the values when the request fails', async () => {
    signUpEmail.mockRejectedValue(new TypeError('Failed to fetch'));
    const user = userEvent.setup();
    renderPage();

    await submitValidForm(user);

    expect(
      await screen.findByText('Could not reach the server. Check your connection and try again.'),
    ).toBeInTheDocument();
    expectValuesKept();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled();
  });

  it.each([
    [429, 'Too many attempts. Please wait a moment and try again.'],
    [500, 'Something went wrong on our end. Please try again.'],
  ])('shows a friendly message for a %i response', async (status, message) => {
    signUpEmail.mockResolvedValue({ data: null, error: { status, message: 'raw server text' } });
    const user = userEvent.setup();
    renderPage();

    await submitValidForm(user);

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByText('raw server text')).not.toBeInTheDocument();
    expectValuesKept();
  });

  it('shows the server message for an unrecognised error', async () => {
    signUpEmail.mockResolvedValue({
      data: null,
      error: { status: 400, message: 'Sign-ups are closed.' },
    });
    const user = userEvent.setup();
    renderPage();

    await submitValidForm(user);

    expect(await screen.findByText('Sign-ups are closed.')).toBeInTheDocument();
    expectValuesKept();
  });

  it('clears the error and navigates when a retry succeeds', async () => {
    signUpEmail.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    signUpEmail.mockResolvedValueOnce({ data: {}, error: null });
    const user = userEvent.setup();
    renderPage();

    await submitValidForm(user);
    await screen.findByText('Could not reach the server. Check your connection and try again.');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument();
  });
});
