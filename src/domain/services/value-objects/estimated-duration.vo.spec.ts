import { EstimatedDuration } from './estimated-duration.vo';

describe('EstimatedDuration', () => {
  it('creates valid duration', () => {
    const d = new EstimatedDuration(60);
    expect(d.minutes).toBe(60);
  });

  it('throws for zero', () => {
    expect(() => new EstimatedDuration(0)).toThrow();
  });

  it('throws for negative', () => {
    expect(() => new EstimatedDuration(-5)).toThrow();
  });

  it('throws for decimal', () => {
    expect(() => new EstimatedDuration(30.5)).toThrow();
  });
});
