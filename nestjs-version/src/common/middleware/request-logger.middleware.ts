import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * NestJS counterpart to Go's internal/middleware/logger.go.
 *
 * Go implementation (Zap structured JSON):
 *   log.Info("request completed",
 *     zap.String("method",   c.Method()),
 *     zap.String("path",     c.Path()),
 *     zap.Duration("duration", time.Since(start)),
 *   )
 *
 * This middleware emits the same fields as a structured JSON log line to
 * stdout, matching Zap's production format so log aggregators can parse
 * both Go and NestJS log streams with the same schema.
 *
 * Example output:
 * {"level":"info","ts":1721000000.123,"msg":"request completed","method":"GET","path":"/users","duration":"4ms","requestId":"..."}
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();

    // Intercept response `finish` event to log after the response is sent
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const requestId = (req as any).requestId ?? '';

      // Structured JSON matching Zap's production output schema:
      //   level, ts (Unix epoch seconds), msg, method, path, duration, status, requestId
      const logEntry = {
        level: 'info',
        ts: Date.now() / 1000,
        msg: 'request completed',
        method: req.method,
        path: req.path,
        // Go uses time.Duration which prints as "Xms" or "Xµs" — we match the ms format
        duration: `${durationMs}ms`,
        status: res.statusCode,
        requestId,
      };

      // Write to stdout as a single JSON line (same as Zap's production output)
      process.stdout.write(JSON.stringify(logEntry) + '\n');
    });

    next();
  }
}
