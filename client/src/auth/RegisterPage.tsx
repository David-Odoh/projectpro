import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Placeholder until the register form is built in Phase 6.
export default function RegisterPage() {
  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Register to start tracking projects.</CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground">
        Already registered?{' '}
        <Link to="/login" className="text-foreground underline underline-offset-4">
          Log in
        </Link>
      </CardContent>
    </Card>
  );
}
