import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { signIn } from './auth-client';
import { loginSchema, type LoginInput } from './schemas';

// Rejected credentials share one message so the form never reveals whether an email is registered.
function serverErrorMessage(status: number) {
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.';
  if (status >= 500) return 'Something went wrong on our end. Please try again.';
  return 'Invalid email or password';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // handleSubmit only calls this once the schema passes, so invalid input never reaches the API.
  async function onSubmit(values: LoginInput) {
    try {
      const { error } = await signIn.email(values);
      if (error) {
        setError('root.server', { message: serverErrorMessage(error.status) });
        return;
      }
    } catch {
      // The client only rejects when the request itself fails, such as when the network is down.
      setError('root.server', {
        message: 'Could not reach the server. Check your connection and try again.',
      });
      return;
    }
    void navigate('/projects');
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>Sign in to see your team's projects.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* noValidate: the browser's own email check would otherwise pre-empt the Zod messages. */}
        <form noValidate onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
          <FieldGroup>
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
              />
              <FieldError id="email-error" errors={[errors.email]} />
            </Field>
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password')}
              />
              <FieldError id="password-error" errors={[errors.password]} />
            </Field>
            <FieldError id="form-error" errors={[errors.root?.server]} />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in…' : 'Log in'}
            </Button>
          </FieldGroup>
        </form>
        <p className="text-sm text-muted-foreground">
          No account yet?{' '}
          <Link to="/register" className="text-foreground underline underline-offset-4">
            Register
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
