// Tests always run against a separate database so they never touch development data.
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://projectpro:projectpro@localhost:5432/projectpro_test';
