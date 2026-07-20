import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Maps to the existing `users` table created by the Go migration
 * (db/migrations/001_users.sql).
 *
 * Schema:
 *   id   SERIAL PRIMARY KEY
 *   name TEXT   NOT NULL
 *   dob  DATE   NOT NULL
 *
 * TypeORM is configured with synchronize: false so it will NEVER alter
 * or recreate this table — all schema management is handled by the Go
 * migration files.
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: false })
  name: string;

  /**
   * Stored as DATE in Postgres. TypeORM returns JavaScript Date objects
   * for date columns. We format to "YYYY-MM-DD" in the service layer,
   * mirroring the Go service's `user.Dob.Format("2006-01-02")`.
   */
  @Column({ type: 'date', nullable: false })
  dob: Date;
}
