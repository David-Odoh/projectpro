import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { HttpError } from './errorHandler.js';

// Parses req.body with the schema and replaces it with the parsed (trimmed, stripped) value.
// Failures become a 400 with the first message for each field, keyed by its dotted path.
export function validateBody(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.');
        if (key && !(key in fields)) fields[key] = issue.message;
      }
      throw new HttpError(
        400,
        'Invalid request body',
        Object.keys(fields).length > 0 ? fields : undefined,
      );
    }

    req.body = result.data;
    next();
  };
}
