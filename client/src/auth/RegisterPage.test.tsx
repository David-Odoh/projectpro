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

describe('RegisterPage', () => {
  beforeEach(() => signUpEmail.mockReset());

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

  it('shows the server error when registration fails', async () => {
    signUpEmail.mockResolvedValue({
      data: null,
      error: { message: 'User already exists. Use another email.' },
    });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Name'), 'Ada');
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct horse');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('User already exists. Use another email.')).toBeInTheDocument();
  });
});
