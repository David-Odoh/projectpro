import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from './schemas';

const validRegister = { name: 'Ada', email: 'ada@example.com', password: 'password1' };

function messages(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues.map((issue) => issue.message) ?? [];
}

describe('registerSchema', () => {
  it('accepts a valid registration', () => {
    expect(registerSchema.parse(validRegister)).toEqual(validRegister);
  });

  it('trims the name and email but not the password', () => {
    expect(
      registerSchema.parse({ name: ' Ada ', email: ' ada@example.com ', password: ' password1 ' }),
    ).toEqual({ name: 'Ada', email: 'ada@example.com', password: ' password1 ' });
  });

  it('requires a name', () => {
    expect(messages(registerSchema.safeParse({ ...validRegister, name: '   ' }))).toEqual([
      'Name is required',
    ]);
  });

  it('requires a valid email', () => {
    expect(messages(registerSchema.safeParse({ ...validRegister, email: '' }))).toEqual([
      'Email is required',
    ]);
    expect(messages(registerSchema.safeParse({ ...validRegister, email: 'ada' }))).toEqual([
      'Enter a valid email address',
    ]);
  });

  it('accepts passwords of 8 and 128 characters', () => {
    expect(registerSchema.safeParse({ ...validRegister, password: 'a'.repeat(8) }).success).toBe(
      true,
    );
    expect(registerSchema.safeParse({ ...validRegister, password: 'a'.repeat(128) }).success).toBe(
      true,
    );
  });

  it('rejects passwords of 7 and 129 characters', () => {
    expect(
      messages(registerSchema.safeParse({ ...validRegister, password: 'a'.repeat(7) })),
    ).toEqual(['Password must be at least 8 characters']);
    expect(
      messages(registerSchema.safeParse({ ...validRegister, password: 'a'.repeat(129) })),
    ).toEqual(['Password must be at most 128 characters']);
  });
});

describe('loginSchema', () => {
  it('accepts any non-empty password', () => {
    expect(loginSchema.parse({ email: ' ada@example.com ', password: 'x' })).toEqual({
      email: 'ada@example.com',
      password: 'x',
    });
  });

  it('requires an email and a password', () => {
    expect(messages(loginSchema.safeParse({ email: '', password: '' }))).toEqual([
      'Email is required',
      'Password is required',
    ]);
  });

  it('rejects an invalid email', () => {
    expect(messages(loginSchema.safeParse({ email: 'ada@', password: 'x' }))).toEqual([
      'Enter a valid email address',
    ]);
  });
});
