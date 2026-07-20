import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/user.entity';

/**
 * Builds TypeORM connection options from DATABASE_URL env variable.
 *
 * The DATABASE_URL format is identical to the Go service:
 *   postgres://postgres:postgres@db:5432/jeevan?sslmode=disable
 *
 * Critical settings:
 *   synchronize: false  → TypeORM will NEVER alter the schema. All DDL is
 *                         managed by Go's db/migrations/001_users.sql.
 *   logging: false      → Raw SQL logging disabled in production. Set to
 *                         true for local debugging.
 */
export function getTypeOrmConfig(): TypeOrmModuleOptions {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  return {
    type: 'postgres',
    url: dbUrl,
    entities: [User],
    synchronize: false,  // ← CRITICAL: never touch the Go-managed schema
    logging: false,
    // Retry connection until DB is ready (matches Go's retry loop in main.go)
    retryAttempts: 10,
    retryDelay: 1000,  // 1s between retries
  };
}
