import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import App from '@/App';
import { useSession } from '@/auth/auth-client';

vi.mock('@/auth/auth-client', () => ({
  signIn: { email: vi.fn() },
  signUp: { email: vi.fn() },
  useSession: vi.fn(),
}));

function setSignedIn(signedIn: boolean) {
  vi.mocked(useSession).mockReturnValue({
    data: signedIn ? { user: { name: 'Ada' } } : null,
    isPending: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useSession>);
}

function renderApp(path: string) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function expectLoginPage() {
  expect(screen.getByText('Log in', { selector: '[data-slot="card-title"]' })).toBeInTheDocument();
}

describe('App', () => {
  it('renders the shell with the app name', () => {
    setSignedIn(true);
    renderApp('/projects');

    expect(screen.getByRole('link', { name: 'ProjectPro' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
  });

  it('navigates between the login and register routes when signed out', async () => {
    setSignedIn(false);
    const user = userEvent.setup();
    renderApp('/login');
    expectLoginPage();

    await user.click(screen.getByRole('link', { name: 'Register' }));
    expect(screen.getByText('Create an account')).toBeInTheDocument();
  });

  it('sends the header link back to /login when signed out', async () => {
    setSignedIn(false);
    const user = userEvent.setup();
    renderApp('/register');

    await user.click(screen.getByRole('link', { name: 'ProjectPro' }));

    expectLoginPage();
  });

  it('redirects a signed-out visit to /projects to /login', () => {
    setSignedIn(false);
    renderApp('/projects');

    expectLoginPage();
    expect(screen.queryByRole('heading', { name: 'Projects' })).not.toBeInTheDocument();
  });

  it.each(['/login', '/register'])('redirects a signed-in visit to %s to /projects', (path) => {
    setSignedIn(true);
    renderApp(path);

    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
  });

  it('redirects unknown paths to /projects when signed in', () => {
    setSignedIn(true);
    renderApp('/nowhere');

    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
  });

  it('redirects unknown paths to /login when signed out', () => {
    setSignedIn(false);
    renderApp('/nowhere');

    expectLoginPage();
  });
});
