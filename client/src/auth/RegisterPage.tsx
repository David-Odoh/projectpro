import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { signUp } from './auth-client';
import { registerSchema, type RegisterInput } from './schemas';

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
    const { error } = await signUp.email(values);
    if (error) {
      setError('root.server', {
        message: error.message ?? 'Registration failed. Please try again.',
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
            <FieldError errors={[errors.root?.server]} />
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
