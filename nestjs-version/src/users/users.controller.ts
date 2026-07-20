import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponse } from './users.service';

/**
 * NestJS counterpart to Go's internal/handler/user_handler.go.
 *
 * Responsibilities (routing only — no business logic):
 *  - Parse path params, query params, request bodies
 *  - Delegate validation to class-validator (via global ValidationPipe)
 *  - Call the service layer
 *  - Return the correct HTTP status codes
 *
 * Routes mirror Go's handler.RegisterRoutes:
 *   POST   /users        → CreateUser
 *   GET    /users        → ListUsers   (query: page, limit)
 *   GET    /users/:id    → GetUserByID
 *   PUT    /users/:id    → UpdateUser
 *   DELETE /users/:id    → DeleteUser
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─────────────────────────── POST /users ────────────────────────────────

  /**
   * Mirrors Go handler.CreateUser.
   * Returns 201 Created on success.
   * Validation (name required/min=1, dob YYYY-MM-DD) handled by ValidationPipe.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() dto: CreateUserDto): Promise<UserResponse> {
    return this.usersService.createUser(dto);
  }

  // ─────────────────────────── GET /users ─────────────────────────────────

  /**
   * Mirrors Go handler.ListUsers.
   *
   * Query parameters:
   *   page  (default: 1,  must be >= 1)
   *   limit (default: 10, must be > 0)
   *
   * Go validation:
   *   page < 1  → 400 "invalid page"
   *   limit <= 0 → 400 "invalid limit"
   *
   * NestJS replication:
   *   DefaultValuePipe sets defaults → ParseIntPipe converts to int.
   *   Manual guards below throw BadRequestException for out-of-range values,
   *   producing the same 400 response shape {"error":"invalid page"} via the
   *   global HttpExceptionFilter.
   */
  @Get()
  async listUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<UserResponse[]> {
    if (page < 1) {
      throw new BadRequestException('invalid page');
    }
    if (limit <= 0) {
      throw new BadRequestException('invalid limit');
    }
    return this.usersService.listUsersPaginated(page, limit);
  }

  // ───────────────────────── GET /users/:id ───────────────────────────────

  /**
   * Mirrors Go handler.GetUserByID.
   * ParseIntPipe → 400 on non-numeric id (Go: strconv.ParseInt → 400 "invalid id").
   * Service throws NotFoundException on missing user → global filter → 404.
   */
  @Get(':id')
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponse> {
    return this.usersService.getUserById(id);
  }

  // ───────────────────────── PUT /users/:id ───────────────────────────────

  /**
   * Mirrors Go handler.UpdateUser (full PUT — both name and dob required).
   * ParseIntPipe → 400 on bad id.
   * ValidationPipe → 400 on bad body.
   * Service throws NotFoundException if id missing → 404.
   */
  @Put(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponse> {
    return this.usersService.updateUser(id, dto);
  }

  // ──────────────────────── DELETE /users/:id ─────────────────────────────

  /**
   * Mirrors Go handler.DeleteUser.
   * Returns 204 No Content (no body).
   * Idempotent — no 404 on missing id, matching Go's DELETE behaviour.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.deleteUser(id);
  }
}
