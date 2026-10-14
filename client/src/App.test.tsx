import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import App from '@/App';

function renderApp(path: string) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('App', () => {
  it('renders the shell with the app name', () => {
    renderApp('/projects');

    expect(screen.getByRole('link', { name: 'ProjectPro' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
  });

  it('navigates between the login, register and projects routes', async () => {
    const user = userEvent.setup();
    renderApp('/login');
    expect(
      screen.getByText('Log in', { selector: '[data-slot="card-title"]' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Register' }));
    expect(screen.getByText('Create an account')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'ProjectPro' }));
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
  });

  it('redirects unknown paths to /projects', () => {
    renderApp('/nowhere');

    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
  });
});
