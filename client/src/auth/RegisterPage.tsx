import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormSetError } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { signUp } from './auth-client';
import { registerSchema, type RegisterInput } from './schemas';

type ServerError = { code?: string; message?: string; status: number };

// Keyed on code and status because Better Auth's message text is not a stable contract.
function applyServerError(error: ServerError, setError: UseFormSetError<RegisterInput>) {
  switch (error.code) {
    case 'USER_ALREADY_EXISTS':
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
      setError('email', {
        message: 'An account with this email already exists. Log in or use a different email.',
      });
      return;
    case 'INVALID_EMAIL':
      setError('email', { message: 'Enter a valid email address' });
      return;
    case 'PASSWORD_TOO_SHORT':
      setError('password', { message: 'Password must be at least 8 characters' });
      return;
    case 'PASSWORD_TOO_LONG':
      setError('password', { message: 'Password is too long' });
      return;
  }

  if (error.status === 429) {
    setError('root.server', { message: 'Too many attempts. Please wait a moment and try again.' });
  } else if (error.status >= 500) {
    setError('root.server', { message: 'Something went wrong on our end. Please try again.' });
  } else {
    setError('root.server', {
      message: error.message || 'Registration failed. Please try again.',
    });
  }
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  // handleSubmit only calls this once the schema passes, so invalid input never reaches the API.
  async function onSubmit(values: RegisterInput) {
    try {
      const { error } = await signUp.email(values);
      if (error) {
        applyServerError(error, setError);
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
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Register to start tracking projects.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* noValidate: the browser's own email check would otherwise pre-empt the Zod messages. */}
        <form noValidate onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                autoComplete="name"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
                {...register('name')}
              />
              <FieldError id="name-error" errors={[errors.name]} />
            </Field>
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
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password')}
              />
              <FieldError id="password-error" errors={[errors.password]} />
            </Field>
            <FieldError id="form-error" errors={[errors.root?.server]} />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </Button>
          </FieldGroup>
        </form>
        <p className="text-sm text-muted-foreground">
          Already registered?{' '}
          <Link to="/login" className="text-foreground underline underline-offset-4">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
