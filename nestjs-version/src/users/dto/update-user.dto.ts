import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

/**
 * Mirrors the Go updateUserRequest struct validation rules:
 *   Name string `validate:"required,min=1"`
 *   Dob  string `validate:"required"`  + manual time.Parse("2006-01-02", ...)
 *
 * Identical rules to CreateUserDto — both name and dob are required on update
 * (Go uses PUT semantics, full replacement, not PATCH).
 */
export class UpdateUserDto {
  /** Go rule: `required,min=1` */
  @IsString()
  @IsNotEmpty({ message: 'name is required' })
  @MinLength(1, { message: 'name must be at least 1 character' })
  name: string;

  /** Go rule: `required` + YYYY-MM-DD parse */
  @IsString()
  @IsNotEmpty({ message: 'dob is required' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'dob must be in YYYY-MM-DD format',
  })
  dob: string;
}
