import { describe, expect, it } from 'vitest';
import { createProjectSchema } from './schema.js';

describe('createProjectSchema', () => {
  it('accepts a name with no description', () => {
    expect(createProjectSchema.parse({ name: 'Website' })).toEqual({ name: 'Website' });
  });

  it('trims the name', () => {
    expect(createProjectSchema.parse({ name: '  Website  ' }).name).toBe('Website');
  });

  it('accepts names of 1 and 100 characters', () => {
    expect(createProjectSchema.safeParse({ name: 'a' }).success).toBe(true);
    expect(createProjectSchema.safeParse({ name: 'a'.repeat(100) }).success).toBe(true);
  });

  it('checks the length after trimming', () => {
    expect(createProjectSchema.safeParse({ name: ` ${'a'.repeat(100)} ` }).success).toBe(true);
    expect(createProjectSchema.safeParse({ name: '   ' }).success).toBe(false);
  });

  it('rejects an empty name and one over 100 characters', () => {
    expect(createProjectSchema.safeParse({ name: '' }).success).toBe(false);
    expect(createProjectSchema.safeParse({ name: 'a'.repeat(101) }).success).toBe(false);
  });

  it('rejects a missing or non-string name', () => {
    expect(createProjectSchema.safeParse({}).success).toBe(false);
    expect(createProjectSchema.safeParse({ name: 42 }).success).toBe(false);
  });

  it('accepts a description of up to 2,000 characters', () => {
    const description = 'd'.repeat(2000);
    expect(createProjectSchema.parse({ name: 'Website', description })).toEqual({
      name: 'Website',
      description,
    });
  });

  it('rejects a description over 2,000 characters or not a string', () => {
    expect(
      createProjectSchema.safeParse({ name: 'Website', description: 'd'.repeat(2001) }).success,
    ).toBe(false);
    expect(createProjectSchema.safeParse({ name: 'Website', description: 5 }).success).toBe(false);
  });

  it('drops unknown keys', () => {
    expect(createProjectSchema.parse({ name: 'Website', createdById: 'someone' })).toEqual({
      name: 'Website',
    });
  });
});
