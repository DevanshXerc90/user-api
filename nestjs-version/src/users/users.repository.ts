import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

/**
 * NestJS counterpart to Go's internal/repository/user_repository.go.
 *
 * Wraps TypeORM's Repository<User> and exposes the same logical operations:
 *   createUser, getUserById, listUsers, listUsersPaginated, updateUser, deleteUser
 *
 * Where Go uses SQLC-generated type-safe queries against raw SQL files,
 * this layer uses TypeORM's Repository API — the SQL executed is equivalent.
 */
@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  /**
   * Mirrors Go: r.q.CreateUser(ctx, db.CreateUserParams{Name: name, Dob: dob})
   * SQL: INSERT INTO users (name, dob) VALUES ($1, $2) RETURNING id, name, dob;
   */
  async createUser(name: string, dob: Date): Promise<User> {
    const user = this.repo.create({ name, dob });
    return this.repo.save(user);
  }

  /**
   * Mirrors Go: r.q.GetUserByID(ctx, int32(id))
   * SQL: SELECT id, name, dob FROM users WHERE id = $1;
   * Returns null if not found (Go returns sql.ErrNoRows which bubbles as error).
   *
   * DIVERGENCE: Go repo returns an error on not-found; this returns null.
   * The service layer converts null → NotFoundException (404), which is
   * better behaviour than Go's accidental 500.
   */
  async getUserById(id: number): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  /**
   * Mirrors Go: r.q.ListUsers(ctx)
   * SQL: SELECT id, name, dob FROM users ORDER BY id ASC;
   */
  async listUsers(): Promise<User[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  /**
   * Mirrors Go: r.q.ListUsersPaginated(ctx, db.ListUsersPaginatedParams{Limit, Offset})
   * SQL: SELECT id, name, dob FROM users ORDER BY id ASC LIMIT $1 OFFSET $2;
   */
  async listUsersPaginated(limit: number, offset: number): Promise<User[]> {
    return this.repo.find({
      order: { id: 'ASC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Mirrors Go: r.q.UpdateUser(ctx, db.UpdateUserParams{ID, Name, Dob})
   * SQL: UPDATE users SET name=$2, dob=$3 WHERE id=$1 RETURNING id, name, dob;
   * Returns null if the user with given id doesn't exist.
   */
  async updateUser(id: number, name: string, dob: Date): Promise<User | null> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) return null;
    user.name = name;
    user.dob = dob;
    return this.repo.save(user);
  }

  /**
   * Mirrors Go: r.q.DeleteUser(ctx, int32(id))
   * SQL: DELETE FROM users WHERE id = $1;
   * Returns true if a row was deleted, false if no matching row.
   */
  async deleteUser(id: number): Promise<boolean> {
    const result = await this.repo.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}
