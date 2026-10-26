import { prisma } from '../db.js';
import type { CreateProjectInput } from './schema.js';

// The creator's id and name only; their email and other user fields stay on the server.
const projectSelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  createdBy: { select: { id: true, name: true } },
} as const;

// Every signed-in user sees every project. The id tiebreak keeps the order stable when timestamps match.
export function listProjects() {
  return prisma.project.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: projectSelect,
  });
}

export function createProject(input: CreateProjectInput, userId: string) {
  return prisma.project.create({
    data: { name: input.name, description: input.description, createdById: userId },
    select: projectSelect,
  });
}
