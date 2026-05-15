import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const header = process.env.CORRELATION_ID_HEADER || 'x-correlation-id';
    const correlationId = (req.headers[header] as string) || uuidv4();
    req.headers[header] = correlationId;
    res.setHeader(header, correlationId);
    next();
  }
}
