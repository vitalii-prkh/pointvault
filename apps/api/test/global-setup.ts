import { execSync } from 'node:child_process';
import { config } from 'dotenv';

/**
 * Runs once before the e2e suite and applies any pending migrations to the test database. It never
 * deletes data: every test creates its own member, so tests don't depend on a clean database.
 */
export default function setup(): void {
  const env =
    config({ path: '.env.test', override: true, quiet: true }).parsed ?? {};

  if (
    !env.DATABASE_URL?.includes('_test') ||
    !env.MONGODB_URI?.includes('_test')
  ) {
    throw new Error('.env.test must point at the *_test databases');
  }

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
}
