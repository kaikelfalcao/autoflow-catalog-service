import { RequestContextService } from './request-context.service';

describe('RequestContextService', () => {
  let svc: RequestContextService;

  beforeEach(() => {
    svc = new RequestContextService();
  });

  it('retorna undefined em get/snapshot quando não há contexto', () => {
    expect(svc.get('foo')).toBeUndefined();
    expect(svc.snapshot()).toEqual({});
  });

  it('persiste valores dentro de um contexto', () => {
    svc.enter({ request_id: 'cid-1' });
    expect(svc.get('request_id')).toBe('cid-1');
    expect(svc.snapshot()).toEqual({ request_id: 'cid-1' });
  });

  it('set adiciona/atualiza chaves no contexto atual', () => {
    svc.enter();
    svc.set('order_id', 'order-1');
    svc.set('user', { id: 42 });
    expect(svc.get('order_id')).toBe('order-1');
    expect(svc.get<{ id: number }>('user')).toEqual({ id: 42 });
    expect(svc.snapshot()).toEqual({
      order_id: 'order-1',
      user: { id: 42 },
    });
  });

  it('set é noop quando não há contexto ativo', () => {
    svc.set('x', 1);
    expect(svc.snapshot()).toEqual({});
  });

  it('snapshot retorna cópia (mutação externa não afeta storage)', () => {
    svc.enter({ a: 1 });
    const snap = svc.snapshot();
    snap.b = 2;
    expect(svc.snapshot()).toEqual({ a: 1 });
  });
});
