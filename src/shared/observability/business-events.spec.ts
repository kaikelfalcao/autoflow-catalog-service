// Usa o auto-mock global em __mocks__/newrelic.js (sem jest.mock inline — evita
// race condition entre workers do Jest quando outros specs também tocam newrelic).
import newrelicMod from 'newrelic';
import { recordBusinessEvent, recordSagaCompensation } from './business-events';

interface NewRelicMock {
  recordCustomEvent: (eventType: string, attrs: Record<string, unknown>) => void;
}

const newrelic = newrelicMod as unknown as NewRelicMock;
const spy = jest.spyOn(newrelic, 'recordCustomEvent');

describe('business-events', () => {
  beforeEach(() => {
    spy.mockReset();
  });

  afterAll(() => {
    spy.mockRestore();
  });

  it('recordBusinessEvent envia eventType, eventName e service derivado da env', () => {
    process.env.NEW_RELIC_APP_NAME = 'catalog-service';
    recordBusinessEvent('Test', { foo: 'bar' });
    expect(spy).toHaveBeenCalledWith('AutoflowBizEvent', {
      eventName: 'Test',
      service: 'catalog-service',
      foo: 'bar',
    });
  });

  it('usa "unknown" quando NEW_RELIC_APP_NAME não está definida', () => {
    delete process.env.NEW_RELIC_APP_NAME;
    recordBusinessEvent('Test');
    expect(spy).toHaveBeenCalledWith('AutoflowBizEvent', {
      eventName: 'Test',
      service: 'unknown',
    });
  });

  it('sanitize ignora undefined/null e serializa Date como ISO-8601', () => {
    const when = new Date('2026-05-18T10:00:00.000Z');
    recordBusinessEvent('Sample', {
      keep: 'yes',
      empty: undefined,
      nullish: null,
      when,
      flag: true,
      count: 42,
    });
    expect(spy).toHaveBeenCalled();
    const payload = spy.mock.calls[0][1];
    expect(payload.keep).toBe('yes');
    expect(payload.flag).toBe(true);
    expect(payload.count).toBe(42);
    expect(payload.when).toBe('2026-05-18T10:00:00.000Z');
    expect('empty' in payload).toBe(false);
    expect('nullish' in payload).toBe(false);
  });

  it('swallowa qualquer erro do newrelic (intentionally silent)', () => {
    spy.mockImplementationOnce(() => {
      throw new Error('agent down');
    });
    expect(() => recordBusinessEvent('Boom')).not.toThrow();
  });

  it('recordSagaCompensation delega com eventName=SagaCompensation', () => {
    recordSagaCompensation({
      orderId: 'order-1',
      reason: 'stock-insufficient',
      step: 'stock-reserve',
    });
    expect(spy).toHaveBeenCalledWith(
      'AutoflowBizEvent',
      expect.objectContaining({
        eventName: 'SagaCompensation',
        orderId: 'order-1',
        reason: 'stock-insufficient',
        step: 'stock-reserve',
      }),
    );
  });
});
