import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegisterPage from './RegisterPage';
import { signUp } from './auth-client';
import { PASSWORD_MAX, PASSWORD_MIN } from './schemas';

const refetch = vi.hoisted(() => vi.fn());

vi.mock('./auth-client', () => ({
  signUp: { email: vi.fn() },
  useSession: () => ({ refetch }),
}));

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
    refetch.mockReset();
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

  // One broken rule per case: with several, any one working rule would block the request alone.
  it.each([
    ['a blank name', 'Name', '   ', 'Name is required'],
    ['an empty email', 'Email', '', 'Email is required'],
    ['a malformed email', 'Email', 'not-an-email', 'Enter a valid email address'],
    [
      'a password below the minimum',
      'Password',
      'x'.repeat(PASSWORD_MIN - 1),
      `Password must be at least ${PASSWORD_MIN} characters`,
    ],
    [
      'a password above the maximum',
      'Password',
      'x'.repeat(PASSWORD_MAX + 1),
      `Password must be at most ${PASSWORD_MAX} characters`,
    ],
  ])('does not call the API for %s', async (_case, invalidField, invalidValue, message) => {
    const user = userEvent.setup();
    renderPage();
    const fields = {
      Name: 'Ada',
      Email: 'ada@example.com',
      Password: 'correct horse',
      [invalidField]: invalidValue,
    };

    for (const [label, value] of Object.entries(fields)) {
      if (value) await user.type(screen.getByLabelText(label), value);
    }
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    for (const label of Object.keys(fields)) {
      const expectation = expect(screen.getByLabelText(label));
      if (label === invalidField) expectation.toHaveAttribute('aria-invalid', 'true');
      else expectation.not.toHaveAttribute('aria-invalid', 'true');
    }
    expect(signUpEmail).not.toHaveBeenCalled();
  });

  it('clears the message and submits once the invalid field is corrected', async () => {
    signUpEmail.mockResolvedValue({ data: {}, error: null });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Name'), 'Ada');
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'correct horse');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    await screen.findByText('Enter a valid email address');
    expect(signUpEmail).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText('Email'));
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    expect(screen.queryByText('Enter a valid email address')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    expect(signUpEmail).toHaveBeenCalledOnce();
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

  it('starts the session fetch before navigating to /projects', async () => {
    signUpEmail.mockResolvedValue({ data: {}, error: null });
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
