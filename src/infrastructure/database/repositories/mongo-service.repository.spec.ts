import type { Model } from 'mongoose';
import { MongoServiceRepository } from './mongo-service.repository';
import { Service } from '../../../domain/services/entities/service.entity';
import { Money } from '../../../domain/services/value-objects/money.vo';
import { EstimatedDuration } from '../../../domain/services/value-objects/estimated-duration.vo';
import type { ServiceDocument } from '../schemas/service.schema';

function makeServiceEntity(id = 'svc-1'): Service {
  return new Service(
    id,
    'SVC-ABCD1234',
    'Oil Change',
    'Description',
    new EstimatedDuration(30),
    new Money(5000, 'BRL'),
    true,
  );
}

function makeServiceDoc(id = 'svc-1') {
  return {
    _id: { toString: () => id },
    sku: 'SVC-ABCD1234',
    name: 'Oil Change',
    description: 'Description',
    estimatedMinutes: 30,
    laborCost: { amount: 5000, currency: 'BRL' },
    active: true,
  };
}

function makeModel(overrides: Record<string, unknown> = {}) {
  const doc = makeServiceDoc();
  return {
    findById: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(doc) }),
    find: jest.fn().mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([doc]),
    }),
    countDocuments: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(1) }),
    create: jest.fn().mockResolvedValue(doc),
    findByIdAndUpdate: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(doc) }),
    ...overrides,
  };
}

describe('MongoServiceRepository', () => {
  let repo: MongoServiceRepository;
  let model: ReturnType<typeof makeModel>;

  beforeEach(() => {
    model = makeModel();
    repo = new MongoServiceRepository(
      model as unknown as Model<ServiceDocument>,
    );
  });

  it('findById returns Service when found', async () => {
    const svc = await repo.findById('svc-1');
    expect(svc).not.toBeNull();
    expect(svc?.id).toBe('svc-1');
  });

  it('findById returns null when not found', async () => {
    model.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    expect(await repo.findById('missing')).toBeNull();
  });

  it('findAll returns paginated results', async () => {
    const result = await repo.findAll({ active: true });
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('findAll applies text search', async () => {
    await repo.findAll({ search: 'oil' });
    expect(model.find).toHaveBeenCalledWith(
      expect.objectContaining({ $text: { $search: 'oil' } }),
    );
  });

  it('findAll limits maximum to 100', async () => {
    const limitFn = jest.fn().mockReturnThis();
    model.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: limitFn,
      exec: jest.fn().mockResolvedValue([]),
    });
    await repo.findAll({ limit: 999 });
    expect(limitFn).toHaveBeenCalledWith(100);
  });

  it('save creates a new service', async () => {
    const svc = makeServiceEntity();
    const saved = await repo.save(svc);
    expect(model.create).toHaveBeenCalled();
    expect(saved).toBeDefined();
  });

  it('update modifies an existing service', async () => {
    const svc = makeServiceEntity();
    const updated = await repo.update(svc);
    expect(model.findByIdAndUpdate).toHaveBeenCalled();
    expect(updated).toBeDefined();
  });

  it('update throws when service not found', async () => {
    model.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    await expect(repo.update(makeServiceEntity())).rejects.toThrow();
  });
});
