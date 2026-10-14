import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Placeholder until the login form is built in Phase 6.
export default function LoginPage() {
  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>Sign in to see your team's projects.</CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground">
        No account yet?{' '}
        <Link to="/register" className="text-foreground underline underline-offset-4">
          Register
        </Link>
      </CardContent>
    </Card>
  );
}
