import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from './config/typeorm.config';
import { UsersModule } from './users/users.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';

/**
 * Root application module.
 *
 * Mirrors the wiring in Go's cmd/server/main.go:
 *   app.Use(middleware.RequestID())
 *   app.Use(middleware.RequestLogger(loggr))
 *   routes.RegisterUserRoutes(app, userHandler)
 */
@Module({
  imports: [
    // TypeORM connection — reads DATABASE_URL from process.env
    TypeOrmModule.forRoot(getTypeOrmConfig()),
    // Feature modules
    UsersModule,
  ],
})
export class AppModule implements NestModule {
  /**
   * Register global middleware in the same order as Go's main.go:
   *   1. RequestID   → inject / echo X-Request-Id
   *   2. RequestLogger → log method, path, duration after response
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestIdMiddleware, RequestLoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
