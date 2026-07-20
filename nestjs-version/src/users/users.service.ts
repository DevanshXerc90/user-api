import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

/**
 * Shape of every user response returned by the API.
 * Mirrors Go's models.UserResponse:
 *   type UserResponse struct {
 *     ID   int64  `json:"id"`
 *     Name string `json:"name"`
 *     Dob  string `json:"dob"`
 *     Age  int    `json:"age,omitempty"`
 *   }
 *
 * DIVERGENCE: Go uses `omitempty` on Age, which omits the field when Age == 0.
 * This NestJS version always includes Age (even when 0) for a consistent contract.
 */
export interface UserResponse {
  id: number;
  name: string;
  /** Date of birth in "YYYY-MM-DD" format, matching Go's time.Format("2006-01-02") */
  dob: string;
  /** Computed age in whole years. Always present (see divergence note above). */
  age: number;
}

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  // ─────────────────────────────── AGE ────────────────────────────────────

  /**
   * Exact replica of Go's service.CalculateAge(dob time.Time) int.
   *
   * Algorithm (from internal/service/age.go):
   *   1. age = currentYear - dobYear
   *   2. If today is before birthdayThisYear, decrement age by 1
   *   3. Clamp to 0 (no negative ages)
   *
   * Called from every method that returns a UserResponse so the derived
   * field is always fresh.
   */
  calculateAge(dob: Date): number {
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();

    // Replicate Go: birthdayThisYear := time.Date(now.Year(), dob.Month(), dob.Day(), ...)
    const birthdayThisYear = new Date(
      now.getFullYear(),
      dob.getMonth(),
      dob.getDate(),
    );

    // Replicate Go: if now.Before(birthdayThisYear) { age-- }
    if (now < birthdayThisYear) {
      age--;
    }

    // Replicate Go: if age < 0 { return 0 }
    return age < 0 ? 0 : age;
  }

  // ─────────────────────────── HELPERS ────────────────────────────────────

  /**
   * Formats a Date to "YYYY-MM-DD", mirroring Go's:
   *   user.Dob.Format("2006-01-02")
   *
   * NOTE: TypeORM returns the `dob` column as a JavaScript Date object when
   * the column type is 'date'. However, PostgreSQL DATE columns have no time
   * component, and the pg driver may return them as strings ("2000-01-01")
   * depending on the TypeORM version. We handle both cases here.
   */
  private formatDob(dob: Date | string): string {
    if (typeof dob === 'string') {
      // pg driver returned a string already in YYYY-MM-DD
      return dob.substring(0, 10);
    }
    // JavaScript Date: use ISO string and slice the date portion
    return dob.toISOString().substring(0, 10);
  }

  /**
   * Converts a raw User entity + computed age into the API response shape.
   * Mirrors the pattern repeated in every Go service method:
   *   return &models.UserResponse{ID: ..., Name: ..., Dob: ..., Age: CalculateAge(...)}
   */
  private toResponse(user: { id: number; name: string; dob: Date | string }): UserResponse {
    const dobDate =
      typeof user.dob === 'string' ? new Date(user.dob) : user.dob;
    return {
      id: user.id,
      name: user.name,
      dob: this.formatDob(user.dob),
      age: this.calculateAge(dobDate),
    };
  }

  // ─────────────────────────── CREATE ─────────────────────────────────────

  /**
   * Mirrors Go: func (s *UserService) CreateUser(ctx, name, dob) (*UserResponse, error)
   *
   * Handler validated the DTO (including YYYY-MM-DD regex), so we can safely
   * parse the dob string here — mirroring Go's:
   *   dob, err := time.Parse("2006-01-02", req.Dob)
   */
  async createUser(dto: CreateUserDto): Promise<UserResponse> {
    const dob = new Date(dto.dob);
    const user = await this.usersRepository.createUser(dto.name, dob);
    return this.toResponse(user);
  }

  // ────────────────────────── GET BY ID ───────────────────────────────────

  /**
   * Mirrors Go: func (s *UserService) GetUserByID(ctx, id) (*UserResponse, error)
   *
   * DIVERGENCE: Go's handler checks `user == nil` for 404, but the repo
   * currently returns a non-nil error on sql.ErrNoRows, causing an accidental
   * 500. NestJS properly throws NotFoundException (404) when the user is not
   * found in the database.
   */
  async getUserById(id: number): Promise<UserResponse> {
    const user = await this.usersRepository.getUserById(id);
    if (!user) {
      throw new NotFoundException(`user not found`);
    }
    return this.toResponse(user);
  }

  // ─────────────────────── LIST (PAGINATED) ───────────────────────────────

  /**
   * Mirrors Go: func (s *UserService) ListUsersPaginated(ctx, page, limit) ([]UserResponse, error)
   *
   * Exact pagination arithmetic:
   *   if page < 1  → page = 1
   *   if limit < 1 → limit = 10
   *   offset = (page - 1) * limit
   *
   * The handler layer enforces page >= 1 and limit > 0 before calling this,
   * matching the Go handler's validation. The guards here are a safety net
   * for direct service calls (e.g. tests).
   */
  async listUsersPaginated(page: number, limit: number): Promise<UserResponse[]> {
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const offset = (page - 1) * limit;
    const users = await this.usersRepository.listUsersPaginated(limit, offset);
    return users.map((u) => this.toResponse(u));
  }

  // ──────────────────────────── UPDATE ────────────────────────────────────

  /**
   * Mirrors Go: func (s *UserService) UpdateUser(ctx, id, name, dob) (*UserResponse, error)
   *
   * DIVERGENCE: Go returns 500 if id not found (repo error bubbles up).
   * NestJS returns 404 NotFoundException.
   */
  async updateUser(id: number, dto: UpdateUserDto): Promise<UserResponse> {
    const dob = new Date(dto.dob);
    const user = await this.usersRepository.updateUser(id, dto.name, dob);
    if (!user) {
      throw new NotFoundException(`user not found`);
    }
    return this.toResponse(user);
  }

  // ──────────────────────────── DELETE ────────────────────────────────────

  /**
   * Mirrors Go: func (s *UserService) DeleteUser(ctx, id) error
   *
   * Go returns no error if the user doesn't exist (DELETE is idempotent in
   * the SQLC query). NestJS matches this: no NotFoundException on delete.
   */
  async deleteUser(id: number): Promise<void> {
    await this.usersRepository.deleteUser(id);
  }
}
