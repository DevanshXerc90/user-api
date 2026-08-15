import { getTypeOrmConfig } from './typeorm.config';
import { User } from '../users/user.entity';

describe('getTypeOrmConfig', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('throws when DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL;

    expect(() => getTypeOrmConfig()).toThrow('DATABASE_URL environment variable is not set');
  });

  it('returns a postgres config bound to the User entity', () => {
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/testdb?sslmode=disable';

    const config = getTypeOrmConfig();

    expect(config).toMatchObject({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      synchronize: false,
      logging: false,
      retryAttempts: 10,
      retryDelay: 1000,
    });
    expect(config.entities).toEqual([User]);
  });
});