import { Router } from 'express';
import { requireAuth, signedInUser } from '../middleware/requireAuth.js';
import { validateBody } from '../middleware/validate.js';
import { createProjectSchema, type CreateProjectInput } from './schema.js';
import { createProject, listProjects } from './service.js';

export const projectsRouter = Router();

// Auth runs first, so a signed-out request with a bad body gets 401 rather than 400.
projectsRouter.use(requireAuth);

projectsRouter.get('/', async (_req, res) => {
  res.json({ projects: await listProjects() });
});

// The creator always comes from the session, never from the request body.
projectsRouter.post('/', validateBody(createProjectSchema), async (req, res) => {
  const { id } = signedInUser(req);
  const project = await createProject(req.body as CreateProjectInput, id);
  res.status(201).json({ project });
});
