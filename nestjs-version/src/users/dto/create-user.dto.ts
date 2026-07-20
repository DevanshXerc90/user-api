import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

/**
 * Mirrors the Go createUserRequest struct validation rules:
 *   Name string `validate:"required,min=1"`
 *   Dob  string `validate:"required"`  + manual time.Parse("2006-01-02", ...)
 */
export class CreateUserDto {
  /**
   * User's full name.
   * Go rule: `required,min=1`
   * NestJS equivalent: @IsNotEmpty() + @MinLength(1)
   */
  @IsString()
  @IsNotEmpty({ message: 'name is required' })
  @MinLength(1, { message: 'name must be at least 1 character' })
  name: string;

  /**
   * Date of birth in YYYY-MM-DD format.
   * Go rule: `required` + manual parse check for "2006-01-02" layout.
   * NestJS equivalent: @IsNotEmpty() + @Matches regex for YYYY-MM-DD.
   *
   * DIVERGENCE NOTE: Go returns {"error":"dob must be in YYYY-MM-DD format"}
   * on a bad date string. The global ValidationPipe here returns a structured
   * class-validator error array instead. Both are 400 Bad Request.
   */
  @IsString()
  @IsNotEmpty({ message: 'dob is required' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'dob must be in YYYY-MM-DD format',
  })
  dob: string;
}
