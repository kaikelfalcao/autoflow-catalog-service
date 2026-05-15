import { CorrelationIdMiddleware } from './correlation-id.middleware';

type MockReq = { headers: Record<string, string> };
type MockRes = { setHeader: jest.Mock };

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;
  let next: jest.Mock;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
    next = jest.fn();
  });

  it('passes through existing correlation-id header', () => {
    const req: MockReq = { headers: { 'x-correlation-id': 'existing-id' } };
    const res: MockRes = { setHeader: jest.fn() };

    middleware.use(
      req as Parameters<CorrelationIdMiddleware['use']>[0],
      res as Parameters<CorrelationIdMiddleware['use']>[1],
      next,
    );

    expect(req.headers['x-correlation-id']).toBe('existing-id');
    expect(res.setHeader).toHaveBeenCalledWith(
      'x-correlation-id',
      'existing-id',
    );
    expect(next).toHaveBeenCalled();
  });

  it('generates a uuid when no correlation-id present', () => {
    const req: MockReq = { headers: {} };
    const res: MockRes = { setHeader: jest.fn() };

    middleware.use(
      req as Parameters<CorrelationIdMiddleware['use']>[0],
      res as Parameters<CorrelationIdMiddleware['use']>[1],
      next,
    );

    const id = req.headers['x-correlation-id'];
    expect(id).toBeTruthy();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(next).toHaveBeenCalled();
  });
});
