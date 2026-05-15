import { HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { PartNotFoundError } from '../../domain/shared/errors/part-not-found.error';
import { ServiceNotFoundError } from '../../domain/shared/errors/service-not-found.error';
import { InsufficientStockError } from '../../domain/shared/errors/insufficient-stock.error';
import { InvalidQuantityError } from '../../domain/shared/errors/invalid-quantity.error';
import { PartHasActiveReservationsError } from '../../domain/shared/errors/part-has-active-reservations.error';

function makeHost(json: jest.Mock, url = '/test', correlationId?: string) {
  return {
    switchToHttp: () => ({
      getResponse: () => ({
        status: jest.fn().mockReturnValue({ json }),
      }),
      getRequest: () => ({
        url,
        headers: correlationId ? { 'x-correlation-id': correlationId } : {},
      }),
    }),
  } as unknown as ArgumentsHost;
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let json: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    json = jest.fn();
    host = makeHost(json, '/parts', 'corr-abc');
  });

  it('maps HttpException correctly', () => {
    filter.catch(
      new HttpException('Bad Request', HttpStatus.BAD_REQUEST),
      host,
    );
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, error: 'Bad Request' }),
    );
  });

  it('includes path and correlationId in response', () => {
    filter.catch(new HttpException('err', HttpStatus.BAD_REQUEST), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/parts', correlationId: 'corr-abc' }),
    );
  });

  it('preserves array message from ValidationPipe', () => {
    filter.catch(
      new HttpException(
        { message: ['name must not be empty', 'category must be valid'] },
        HttpStatus.BAD_REQUEST,
      ),
      host,
    );
    const call = (json.mock.calls[0] as [{ message: unknown }])[0];
    expect(Array.isArray(call.message)).toBe(true);
    expect(call.message).toHaveLength(2);
  });

  it('maps HttpException with object response', () => {
    filter.catch(
      new HttpException(
        { message: 'Validation failed' },
        HttpStatus.UNPROCESSABLE_ENTITY,
      ),
      host,
    );
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 422 }),
    );
  });

  it('maps PartNotFoundError to 404', () => {
    filter.catch(new PartNotFoundError('p-1'), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, error: 'Not Found' }),
    );
  });

  it('maps ServiceNotFoundError to 404', () => {
    filter.catch(new ServiceNotFoundError('s-1'), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404 }),
    );
  });

  it('maps InsufficientStockError to 409', () => {
    filter.catch(new InsufficientStockError([]), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409, error: 'Conflict' }),
    );
  });

  it('maps InvalidQuantityError to 400', () => {
    filter.catch(new InvalidQuantityError('bad'), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 }),
    );
  });

  it('maps PartHasActiveReservationsError to 409', () => {
    filter.catch(new PartHasActiveReservationsError('p-1'), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409 }),
    );
  });

  it('maps unknown error to 500', () => {
    filter.catch(new Error('unexpected'), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        error: 'Internal Server Error',
      }),
    );
  });

  it('handles non-Error exceptions gracefully', () => {
    filter.catch('string error', host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500 }),
    );
  });

  it('uses unknown as correlationId when header is absent', () => {
    const hostNoCorr = makeHost(json, '/parts');
    filter.catch(new PartNotFoundError('p-1'), hostNoCorr);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: 'unknown' }),
    );
  });
});
