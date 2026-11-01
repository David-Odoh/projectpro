import { useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useSession } from './auth-client';

function SessionLoading() {
  return (
    <p role="status" className="text-muted-foreground">
      Loading…
    </p>
  );
}

export default function RequireAuth() {
  const { data: session, isPending } = useSession();

  if (session) return <Outlet />;
  if (isPending) return <SessionLoading />;
  return <Navigate to="/login" replace />;
}

export function RequireGuest() {
  const { data: session, isPending } = useSession();
  // isPending turns true again on every refetch while signed out, including on window focus.
  // Only the first check may show the loader, as swapping out the form later would lose its input.
  const [firstCheckDone, setFirstCheckDone] = useState(!isPending);
  if (!isPending && !firstCheckDone) setFirstCheckDone(true);

  if (session) return <Navigate to="/projects" replace />;
  if (!firstCheckDone) return <SessionLoading />;
  return <Outlet />;
}
