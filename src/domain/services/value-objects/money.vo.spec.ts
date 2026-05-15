import { Money } from './money.vo';

describe('Money', () => {
  it('creates a valid money object', () => {
    const m = new Money(1000, 'BRL');
    expect(m.amount).toBe(1000);
    expect(m.currency).toBe('BRL');
  });

  it('allows zero amount', () => {
    expect(() => new Money(0, 'BRL')).not.toThrow();
  });

  it('throws for negative amount', () => {
    expect(() => new Money(-1, 'BRL')).toThrow();
  });

  it('throws for decimal amount', () => {
    expect(() => new Money(9.99, 'BRL')).toThrow();
  });
});
