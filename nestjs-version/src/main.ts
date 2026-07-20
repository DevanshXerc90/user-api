import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

/**
 * Application entry point — mirrors Go's cmd/server/main.go.
 *
 * NestJS bootstrap equivalent of:
 *   app := fiber.New(...)
 *   app.Use(middleware.RequestID())
 *   app.Use(middleware.RequestLogger(loggr))
 *   routes.RegisterUserRoutes(app, userHandler)
 *   app.Listen(":3000")
 *
 * Key global configuration:
 *   ValidationPipe    → Runs class-validator on all incoming DTOs (mirrors
 *                       go-playground/validator in Go handler).
 *   HttpExceptionFilter → Shapes all errors to {error, details?} matching
 *                          Go's fiber.Map error format.
 *
 * Port: 3001 (Go uses 3000; both run in Docker Compose simultaneously).
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Disable NestJS's default pretty logger; we write structured JSON ourselves
    // via RequestLoggerMiddleware (matching Zap's output format)
    logger: ['error', 'warn'],
  });

  // Global validation pipe — equivalent to go-playground/validator
  // whitelist: true  → strip unknown fields (go-playground ignores extra fields)
  // forbidNonWhitelisted: false → don't error on extra fields (Go behaviour)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      // Produce a flat array of constraint messages matching our filter's expectation
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter — consistent {error, details?} JSON shape
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  // Log startup — mirrors Go's log.Println("starting user-api server...")
  process.stdout.write(
    JSON.stringify({
      level: 'info',
      ts: Date.now() / 1000,
      msg: `nestjs-user-api listening on port ${port}`,
    }) + '\n',
  );
}

bootstrap().catch((err) => {
  process.stderr.write(
    JSON.stringify({
      level: 'fatal',
      ts: Date.now() / 1000,
      msg: 'failed to start server',
      error: err instanceof Error ? err.message : String(err),
    }) + '\n',
  );
  process.exit(1);
});
