import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * NestJS counterpart to Go's internal/middleware/request_id.go.
 *
 * Go implementation:
 *   reqID := c.Get("X-Request-Id")
 *   if reqID == "" {
 *     reqID = strconv.FormatUint(c.Context().ID(), 10)   // Fiber's numeric conn ID
 *   }
 *   c.Set("X-Request-Id", reqID)
 *
 * NestJS implementation:
 *   - Reads the incoming X-Request-Id header (same as Go)
 *   - If absent, generates a UUID v4 (vs Go's numeric connection counter)
 *
 * DIVERGENCE: Go uses Fiber's internal numeric connection ID as a fallback;
 * NestJS uses UUID v4. Both are unique per request. UUID v4 is more suitable
 * for distributed tracing across services. The header name is identical.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const existingId = req.headers['x-request-id'] as string | undefined;
    const requestId = existingId && existingId.trim() ? existingId.trim() : uuidv4();

    // Attach to request for downstream middleware/handlers to read
    (req as any).requestId = requestId;

    // Echo back in the response header (matches Go behaviour)
    res.setHeader('X-Request-Id', requestId);

    next();
  }
}
