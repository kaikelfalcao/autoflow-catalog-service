import type { Model } from 'mongoose';
import { MongoPartRepository } from './mongo-part.repository';
import { PartCategory } from '../../../domain/parts/enums/part-category.enum';
import { Unit } from '../../../domain/parts/enums/unit.enum';
import { Part } from '../../../domain/parts/entities/part.entity';
import { SKU } from '../../../domain/parts/value-objects/sku.vo';
import type { PartDocument } from '../schemas/part.schema';

function makePart(id = 'p-1'): Part {
  return new Part(
    id,
    new SKU('PART-FILTER-AABBCCDD'),
    'Filter',
    PartCategory.FILTER,
    Unit.UN,
    {},
    10,
    0,
    5,
    true,
    false,
  );
}

function makeDoc(id = 'p-1') {
  return {
    _id: { toString: () => id },
    sku: 'PART-FILTER-AABBCCDD',
    name: 'Filter',
    category: PartCategory.FILTER,
    unit: Unit.UN,
    attributes: {},
    stockQuantity: 10,
    reservedQuantity: 0,
    minimumStock: 5,
    active: true,
    lowStockAlertSent: false,
  };
}

function makeModel(overrides: Record<string, unknown> = {}) {
  const doc = makeDoc();
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
    findByIdAndUpdate: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(doc),
    }),
    ...overrides,
  };
}

describe('MongoPartRepository', () => {
  let repo: MongoPartRepository;
  let model: ReturnType<typeof makeModel>;

  beforeEach(() => {
    model = makeModel();
    repo = new MongoPartRepository(model as unknown as Model<PartDocument>);
  });

  it('findById returns Part when found', async () => {
    const part = await repo.findById('p-1');
    expect(part).not.toBeNull();
    expect(part?.id).toBe('p-1');
  });

  it('findById returns null when not found', async () => {
    model.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    const part = await repo.findById('missing');
    expect(part).toBeNull();
  });

  it('findAll returns paginated results', async () => {
    const result = await repo.findAll({
      category: PartCategory.FILTER,
      active: true,
    });
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('findAll applies search filter', async () => {
    await repo.findAll({ search: 'filter', page: 2, limit: 10 });
    expect(model.find).toHaveBeenCalledWith(
      expect.objectContaining({ $text: { $search: 'filter' } }),
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

  it('findLowStock returns parts with stock <= minimum', async () => {
    const parts = await repo.findLowStock();
    expect(parts).toHaveLength(1);
  });

  it('save creates a new part', async () => {
    const part = makePart();
    const saved = await repo.save(part);
    expect(model.create).toHaveBeenCalled();
    expect(saved).toBeDefined();
  });

  it('update modifies an existing part', async () => {
    const part = makePart();
    const updated = await repo.update(part);
    expect(model.findByIdAndUpdate).toHaveBeenCalled();
    expect(updated).toBeDefined();
  });

  it('update throws when part not found', async () => {
    model.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    await expect(repo.update(makePart())).rejects.toThrow();
  });
});
