import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserMenu from './UserMenu';
import { signOut, useSession } from './auth-client';

vi.mock('./auth-client', () => ({ signOut: vi.fn(), useSession: vi.fn() }));

const refetch = vi.fn();
const projectsKey = ['projects'];

function setSession(data: object | null) {
  vi.mocked(useSession).mockReturnValue({
    data,
    isPending: false,
    refetch,
  } as unknown as ReturnType<typeof useSession>);
}

function renderMenu() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(projectsKey, [{ id: 1 }]);
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/projects']}>
        <UserMenu />
        <Routes>
          <Route path="/projects" element={<h1>Projects page</h1>} />
          <Route path="/login" element={<h1>Login page</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return queryClient;
}

function logOutButton() {
  return screen.getByRole('button', { name: 'Log out' });
}

describe('UserMenu', () => {
  beforeEach(() => {
    vi.mocked(signOut).mockReset();
    refetch.mockReset();
    setSession({ user: { name: 'Ada Lovelace' } });
  });

  it("shows the user's name and a log-out button when signed in", () => {
    renderMenu();

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(logOutButton()).toBeInTheDocument();
  });

  it('renders nothing when signed out', () => {
    setSession(null);
    renderMenu();

    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument();
  });

  it('refreshes the session, clears the cache and goes to /login after logging out', async () => {
    vi.mocked(signOut).mockResolvedValue({ data: { success: true }, error: null });
    refetch.mockResolvedValue(undefined);
    const user = userEvent.setup();
    const queryClient = renderMenu();

    await user.click(logOutButton());

    expect(await screen.findByRole('heading', { name: 'Login page' })).toBeInTheDocument();
    expect(refetch).toHaveBeenCalledOnce();
    expect(vi.mocked(signOut).mock.invocationCallOrder[0]).toBeLessThan(
      refetch.mock.invocationCallOrder[0],
    );
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it('waits for the session refresh before clearing the cache and redirecting', async () => {
    vi.mocked(signOut).mockResolvedValue({ data: { success: true }, error: null });
    let finishRefetch = () => {};
    refetch.mockReturnValue(new Promise<void>((resolve) => (finishRefetch = resolve)));
    const user = userEvent.setup();
    const queryClient = renderMenu();

    await user.click(logOutButton());
    await waitFor(() => expect(refetch).toHaveBeenCalled());

    expect(screen.getByRole('heading', { name: 'Projects page' })).toBeInTheDocument();
    expect(queryClient.getQueryData(projectsKey)).toBeDefined();

    finishRefetch();

    expect(await screen.findByRole('heading', { name: 'Login page' })).toBeInTheDocument();
    expect(queryClient.getQueryData(projectsKey)).toBeUndefined();
  });

  it.each([
    [
      'the server returns an error',
      () => vi.mocked(signOut).mockResolvedValue({ data: null, error: { status: 500 } }),
    ],
    ['the request fails', () => vi.mocked(signOut).mockRejectedValue(new Error('offline'))],
  ])('keeps the user and the cache in place when %s', async (_name, arrange) => {
    arrange();
    const user = userEvent.setup();
    const queryClient = renderMenu();

    await user.click(logOutButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not log out');
    expect(screen.getByRole('heading', { name: 'Projects page' })).toBeInTheDocument();
    expect(queryClient.getQueryData(projectsKey)).toBeDefined();
    expect(refetch).not.toHaveBeenCalled();
    expect(logOutButton()).toBeEnabled();
  });

  it('disables the button while the request is pending', async () => {
    vi.mocked(signOut).mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderMenu();

    await user.click(logOutButton());

    expect(logOutButton()).toBeDisabled();
  });
});
