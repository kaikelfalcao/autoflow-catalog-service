import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PartNotFoundError } from '../../domain/shared/errors/part-not-found.error';
import { ServiceNotFoundError } from '../../domain/shared/errors/service-not-found.error';
import { InsufficientStockError } from '../../domain/shared/errors/insufficient-stock.error';
import { InvalidQuantityError } from '../../domain/shared/errors/invalid-quantity.error';
import { PartHasActiveReservationsError } from '../../domain/shared/errors/part-has-active-reservations.error';

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
  correlationId: string;
}

const HTTP_STATUS_TEXT: Record<number, string> = {
  400: 'Bad Request',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
};

function statusText(status: number): string {
  return HTTP_STATUS_TEXT[status] ?? 'Error';
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const path = request.url;
    const correlationId =
      (request.headers['x-correlation-id'] as string | undefined) ?? 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        const raw = body['message'];
        if (Array.isArray(raw)) {
          message = raw.map(String);
        } else if (raw !== undefined) {
          message = typeof raw === 'string' ? raw : JSON.stringify(raw);
        }
      }
    } else if (
      exception instanceof PartNotFoundError ||
      exception instanceof ServiceNotFoundError
    ) {
      status = HttpStatus.NOT_FOUND;
      message = exception.message;
    } else if (exception instanceof InsufficientStockError) {
      status = HttpStatus.CONFLICT;
      message = exception.message;
    } else if (exception instanceof InvalidQuantityError) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
    } else if (exception instanceof PartHasActiveReservationsError) {
      status = HttpStatus.CONFLICT;
      message = exception.message;
    } else {
      const err =
        exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error('Unhandled exception', {
        correlationId,
        path,
        error: err.message,
        stack: err.stack,
      });
    }

    const body: ErrorResponse = {
      statusCode: status,
      error: statusText(status),
      message,
      timestamp: new Date().toISOString(),
      path,
      correlationId,
    };

    response.status(status).json(body);
  }
}
