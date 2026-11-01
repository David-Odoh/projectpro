import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RequireAuth, { RequireGuest } from './RequireAuth';
import { useSession } from './auth-client';

vi.mock('./auth-client', () => ({ useSession: vi.fn() }));

type SessionState = { data: object | null; isPending: boolean; error?: object | null };

const signedIn: SessionState = { data: { user: { name: 'Ada' } }, isPending: false };
const signedOut: SessionState = { data: null, isPending: false };
const pending: SessionState = { data: null, isPending: true };

function setSession(state: SessionState) {
  vi.mocked(useSession).mockReturnValue(state as unknown as ReturnType<typeof useSession>);
}

function routes() {
  return (
    <MemoryRouter initialEntries={[currentPath]}>
      <Routes>
        <Route element={<RequireGuest />}>
          <Route path="/login" element={<input aria-label="Login field" />} />
          <Route path="/register" element={<h1>Register page</h1>} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route path="/projects" element={<h1>Projects page</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

let currentPath = '/';

function renderAt(path: string) {
  currentPath = path;
  return render(routes());
}

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.mocked(useSession).mockReset();
  });

  it('shows a loading state and hides the page while the session loads', () => {
    setSession(pending);
    renderAt('/projects');

    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(screen.queryByRole('heading', { name: 'Projects page' })).not.toBeInTheDocument();
  });

  it('redirects to /login when signed out', () => {
    setSession(signedOut);
    renderAt('/projects');

    expect(screen.getByLabelText('Login field')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Projects page' })).not.toBeInTheDocument();
  });

  it('renders the page when signed in', () => {
    setSession(signedIn);
    renderAt('/projects');

    expect(screen.getByRole('heading', { name: 'Projects page' })).toBeInTheDocument();
  });

  it('keeps a signed-in user on the page when a background refetch fails', () => {
    setSession(signedIn);
    const { rerender } = renderAt('/projects');

    setSession({ ...signedIn, error: { status: 500 } });
    rerender(routes());

    expect(screen.getByRole('heading', { name: 'Projects page' })).toBeInTheDocument();
  });
});

describe('RequireGuest', () => {
  beforeEach(() => {
    vi.mocked(useSession).mockReset();
  });

  it('shows a loading state while the first session check runs', () => {
    setSession(pending);
    renderAt('/login');

    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(screen.queryByLabelText('Login field')).not.toBeInTheDocument();
  });

  it('renders the login route when signed out', () => {
    setSession(signedOut);
    renderAt('/login');

    expect(screen.getByLabelText('Login field')).toBeInTheDocument();
  });

  it('renders the register route when signed out', () => {
    setSession(signedOut);
    renderAt('/register');

    expect(screen.getByRole('heading', { name: 'Register page' })).toBeInTheDocument();
  });

  it.each(['/login', '/register'])('redirects signed-in users away from %s', (path) => {
    setSession(signedIn);
    renderAt(path);

    expect(screen.getByRole('heading', { name: 'Projects page' })).toBeInTheDocument();
  });

  it('keeps typed input when a later refetch turns isPending back on', async () => {
    setSession(signedOut);
    const user = userEvent.setup();
    const { rerender } = renderAt('/login');
    await user.type(screen.getByLabelText('Login field'), 'ada@example.com');

    setSession(pending);
    rerender(routes());

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Login field')).toHaveValue('ada@example.com');
  });

  it('shows the form once the first check settles', () => {
    setSession(pending);
    const { rerender } = renderAt('/login');

    setSession(signedOut);
    rerender(routes());

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Login field')).toBeInTheDocument();
  });
});
