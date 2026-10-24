import { z } from 'zod';

export const PROJECT_NAME_MAX = 100;
export const PROJECT_DESCRIPTION_MAX = 2000;

// Names are trimmed before the length check, so a name of only spaces counts as empty.
export const createProjectSchema = z.object({
  name: z
    .string({
      error: (issue) => (issue.input === undefined ? 'Name is required' : 'Name must be a string'),
    })
    .trim()
    .min(1, 'Name is required')
    .max(PROJECT_NAME_MAX, `Name must be at most ${PROJECT_NAME_MAX} characters`),
  description: z
    .string({ error: 'Description must be a string' })
    .max(
      PROJECT_DESCRIPTION_MAX,
      `Description must be at most ${PROJECT_DESCRIPTION_MAX} characters`,
    )
    .optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
