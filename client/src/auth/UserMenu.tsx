import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { signOut, useSession } from './auth-client';

const LOG_OUT_ERROR = 'Could not log out. Please try again.';

export default function UserMenu() {
  const { data: session, refetch } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function logOut() {
    setIsLoggingOut(true);
    setErrorMessage(null);
    try {
      const { error } = await signOut();
      if (error) {
        setErrorMessage(LOG_OUT_ERROR);
        return;
      }
      // Better Auth only refreshes the session shortly after sign-out resolves. Navigating before
      // the session clears would let RequireGuest send the user straight back to /projects.
      await refetch();
    } catch {
      // The client only rejects when the request itself fails, such as when the network is down.
      setErrorMessage(LOG_OUT_ERROR);
      return;
    } finally {
      setIsLoggingOut(false);
    }
    // Cleared so the next user on this browser never sees this user's data.
    queryClient.clear();
    void navigate('/login', { replace: true });
  }

  if (!session) return null;

  return (
    <>
      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
      <span className="max-w-48 truncate text-sm" title={session.user.name}>
        {session.user.name}
      </span>
      <Button variant="outline" size="sm" disabled={isLoggingOut} onClick={() => void logOut()}>
        Log out
      </Button>
    </>
  );
}
