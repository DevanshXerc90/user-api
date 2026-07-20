import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter that shapes all error responses to match the Go
 * API's error envelope format.
 *
 * Go error shape (fiber.Map):
 *   {"error": "message"}
 *   {"error": "validation failed", "details": "..."}
 *
 * This filter produces:
 *   {"error": "message"}                         ← for simple HTTP errors
 *   {"error": "validation failed", "details": []}  ← for class-validator errors
 *
 * DIVERGENCE: Go's `details` is a raw validator string (e.g.
 * "Key: 'createUserRequest.Name' Error:Field validation for 'Name' failed on 'required' tag").
 * NestJS class-validator produces a structured array of ValidationError objects.
 * Both signal 400 Bad Request with {"error":"validation failed"}.
 * This is documented as a known divergence.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let errorMessage: string;
      let details: unknown = undefined;

      if (typeof exceptionResponse === 'string') {
        // Simple string exceptions
        errorMessage = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const obj = exceptionResponse as Record<string, unknown>;

        // NestJS ValidationPipe produces: { statusCode, message: string[], error }
        if (Array.isArray(obj.message)) {
          // class-validator error array — mirrors Go's "validation failed" + details
          errorMessage = 'validation failed';
          details = obj.message;
        } else if (typeof obj.message === 'string') {
          errorMessage = obj.message;
        } else {
          errorMessage = exception.message;
        }
      } else {
        errorMessage = exception.message;
      }

      const body: Record<string, unknown> = { error: errorMessage };
      if (details !== undefined) {
        body.details = details;
      }

      response.status(status).json(body);
    } else {
      // Unknown / unhandled errors → 500 Internal Server Error
      // Mirrors Go's catch-all: c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error":"..."})
      const requestId = (request as any).requestId ?? '';

      // Log the unexpected error to stderr (structured)
      process.stderr.write(
        JSON.stringify({
          level: 'error',
          ts: Date.now() / 1000,
          msg: 'unhandled exception',
          requestId,
          error: exception instanceof Error ? exception.message : String(exception),
          stack: exception instanceof Error ? exception.stack : undefined,
        }) + '\n',
      );

      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'internal server error',
      });
    }
  }
}
