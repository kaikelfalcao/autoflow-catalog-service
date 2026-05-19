import { firstValueFrom, of, throwError } from 'rxjs';
import { CanonicalLogInterceptor } from './canonical-log.interceptor';
import { RequestContextService } from './request-context.service';

type LoggedEntry = Record<string, unknown>;

const makeLogger = () => {
  const calls: LoggedEntry[] = [];
  return {
    log: jest.fn((entry: LoggedEntry) => {
      calls.push(entry);
    }),
    calls,
  };
};

const makeHttpCtx = (
  req: Record<string, unknown>,
  res: Record<string, unknown>,
  type: 'http' | 'rpc' = 'http',
) => ({
  getType: () => type,
  switchToHttp: () => ({
    getRequest: () => req,
    getResponse: () => res,
  }),
});

describe('CanonicalLogInterceptor', () => {
  let logger: ReturnType<typeof makeLogger>;
  let ctxSvc: RequestContextService;
  let interceptor: CanonicalLogInterceptor;

  beforeEach(() => {
    logger = makeLogger();
    ctxSvc = new RequestContextService();
    interceptor = new CanonicalLogInterceptor(logger as never, ctxSvc);
  });

  it('passa direto quando não é http (rpc, ws etc)', async () => {
    const next = { handle: () => of({ skipped: true }) };
    const httpCtx = makeHttpCtx({}, {}, 'rpc');
    const result = await firstValueFrom(
      interceptor.intercept(httpCtx as never, next as never),
    );
    expect(result).toEqual({ skipped: true });
    expect(logger.log).not.toHaveBeenCalled();
  });

  it('emite log de sucesso com status do response e accrued context', async () => {
    const req = {
      headers: { 'x-correlation-id': 'cid-success' },
      method: 'GET',
      url: '/items',
      path: '/items',
      route: { path: '/items' },
    };
    const res = { statusCode: 200 };
    const next = {
      handle: () => {
        // Simula um service que acresce contexto durante o request
        ctxSvc.set('partId', 'p1');
        return of({ ok: true });
      },
    };

    await firstValueFrom(
      interceptor.intercept(makeHttpCtx(req, res) as never, next as never),
    );

    expect(logger.calls).toHaveLength(1);
    const entry = logger.calls[0];
    expect(entry.level).toBe('info');
    expect(entry.status_code).toBe(200);
    expect(entry.request_id).toBe('cid-success');
    expect(entry.path).toBe('/items');
    expect(entry.method).toBe('GET');
    expect(entry.partId).toBe('p1');
    expect(entry.duration_ms).toEqual(expect.any(Number));
  });

  it('usa "unknown" quando não há x-correlation-id', async () => {
    const req = { headers: {}, method: 'GET', url: '/x', path: '/x' };
    const res = { statusCode: 200 };
    const next = { handle: () => of(null) };

    await firstValueFrom(
      interceptor.intercept(makeHttpCtx(req, res) as never, next as never),
    );

    expect(logger.calls[0].request_id).toBe('unknown');
  });

  it('emite warn em 4xx', async () => {
    const req = { headers: {}, method: 'POST', url: '/x', path: '/x' };
    const res = { statusCode: 404 };
    const next = { handle: () => of(null) };

    await firstValueFrom(
      interceptor.intercept(makeHttpCtx(req, res) as never, next as never),
    );

    expect(logger.calls[0].level).toBe('warn');
  });

  it('emite error com payload error.* quando handler lança Error tipado', async () => {
    const req = { headers: {}, method: 'PUT', url: '/x', path: '/x' };
    const res = { statusCode: 200 };
    const err = Object.assign(new Error('boom'), {
      status: 500,
      code: 'E_BOOM',
    });
    const next = { handle: () => throwError(() => err) };

    await expect(
      firstValueFrom(
        interceptor.intercept(makeHttpCtx(req, res) as never, next as never),
      ),
    ).rejects.toBe(err);

    const entry = logger.calls[0];
    expect(entry.level).toBe('error');
    expect(entry.status_code).toBe(500);
    expect(entry.error).toEqual({
      type: 'Error',
      message: 'boom',
      code: 'E_BOOM',
    });
  });

  it('quando handler lança string usa-a como mensagem', async () => {
    const req = { headers: {}, method: 'GET', url: '/x', path: '/x' };
    const res = { statusCode: 200 };
    const next = { handle: () => throwError(() => 'just a string') };

    await expect(
      firstValueFrom(
        interceptor.intercept(makeHttpCtx(req, res) as never, next as never),
      ),
    ).rejects.toBe('just a string');

    expect(logger.calls[0].error).toEqual({
      type: 'Error',
      message: 'just a string',
      code: undefined,
    });
  });

  it('quando handler lança objeto desconhecido aplica JSON.stringify como fallback', async () => {
    const req = { headers: {}, method: 'GET', url: '/x', path: '/x' };
    const res = { statusCode: 200 };
    const next = { handle: () => throwError(() => ({ weird: true })) };

    await expect(
      firstValueFrom(
        interceptor.intercept(makeHttpCtx(req, res) as never, next as never),
      ),
    ).rejects.toEqual({ weird: true });

    expect(logger.calls[0].error).toEqual({
      type: 'Error',
      message: '{"weird":true}',
      code: undefined,
    });
  });

  it('usa req.url quando não há route.path nem req.path', async () => {
    const req = { headers: {}, method: 'GET', url: '/raw' };
    const res = { statusCode: 200 };
    const next = { handle: () => of(null) };

    await firstValueFrom(
      interceptor.intercept(makeHttpCtx(req, res) as never, next as never),
    );

    expect(logger.calls[0].path).toBe('/raw');
  });
});
