import 'reflect-metadata';
import { validateEnv } from './env.config';

const validEnv = {
  MONGODB_URI: 'mongodb://localhost/test',
  RABBITMQ_URL: 'amqp://localhost',
};

describe('validateEnv', () => {
  it('returns config with defaults when optional fields are missing', () => {
    const config = validateEnv(validEnv);
    expect(config.PORT).toBe(3003);
    expect(config.NODE_ENV).toBe('development');
    expect(config.LOG_LEVEL).toBe('info');
    expect(config.RABBITMQ_PREFETCH).toBe(10);
  });

  it('throws when MONGODB_URI is missing', () => {
    expect(() => validateEnv({ RABBITMQ_URL: 'amqp://localhost' })).toThrow();
  });

  it('throws when RABBITMQ_URL is missing', () => {
    expect(() => validateEnv({ MONGODB_URI: 'mongodb://localhost' })).toThrow();
  });

  it('accepts valid NODE_ENV values', () => {
    const config = validateEnv({ ...validEnv, NODE_ENV: 'production' });
    expect(config.NODE_ENV).toBe('production');
  });

  it('accepts valid LOG_LEVEL values', () => {
    const config = validateEnv({ ...validEnv, LOG_LEVEL: 'debug' });
    expect(config.LOG_LEVEL).toBe('debug');
  });
});
