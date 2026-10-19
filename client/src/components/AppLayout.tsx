import type { ReactNode } from 'react';
import { Link, Outlet } from 'react-router';

type AppLayoutProps = {
  /** Rendered at the right of the header; filled with the user's name and log-out in Phase 8. */
  userMenu?: ReactNode;
};

export default function AppLayout({ userMenu }: AppLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <Link to="/projects" className="font-heading text-lg font-semibold tracking-tight">
            ProjectPro
          </Link>
          <div className="flex items-center gap-3">{userMenu}</div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
