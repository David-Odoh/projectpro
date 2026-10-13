import type { ErrorRequestHandler, RequestHandler } from 'express';

export type ErrorBody = {
  error: {
    message: string;
    fields?: Record<string, string>;
  };
};

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { message: 'Not found' } } satisfies ErrorBody);
};

// Errors raised by Express and its body parsers carry a status and an `expose` flag.
function isExposedClientError(err: unknown): err is Error & { status: number } {
  return (
    err instanceof Error &&
    'expose' in err &&
    err.expose === true &&
    'status' in err &&
    typeof err.status === 'number' &&
    err.status >= 400 &&
    err.status < 500
  );
}

// Express identifies error handlers by their four parameters, so `_next` must stay.
export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  if (err instanceof HttpError) {
    const body: ErrorBody = { error: { message: err.message } };
    if (err.fields) body.error.fields = err.fields;
    res.status(err.status).json(body);
    return;
  }

  if (isExposedClientError(err)) {
    res.status(err.status).json({ error: { message: err.message } } satisfies ErrorBody);
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: 'Internal server error' } } satisfies ErrorBody);
};
