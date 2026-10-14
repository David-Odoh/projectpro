-- Creates the local development role and databases. Safe to run more than once.
-- Run as a superuser against the local Postgres 18 server:
--   psql -d postgres -f server/db/setup.sql

-- CREATEDB lets `prisma migrate dev` create its shadow database.
SELECT 'CREATE ROLE projectpro LOGIN CREATEDB PASSWORD ''projectpro'''
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'projectpro')
\gexec

SELECT 'CREATE DATABASE projectpro OWNER projectpro'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'projectpro')
\gexec

SELECT 'CREATE DATABASE projectpro_test OWNER projectpro'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'projectpro_test')
\gexec
