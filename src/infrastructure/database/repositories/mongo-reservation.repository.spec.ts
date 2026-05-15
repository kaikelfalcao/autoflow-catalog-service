import type { Model } from 'mongoose';
import { MongoReservationRepository } from './mongo-reservation.repository';
import { StockReservation } from '../../../domain/parts/entities/stock-reservation.entity';
import { StockMovement } from '../../../domain/parts/entities/stock-movement.entity';
import { ReservationStatus } from '../../../domain/parts/enums/reservation-status.enum';
import { MovementType } from '../../../domain/parts/enums/movement-type.enum';
import type { ReservationDocument } from '../schemas/reservation.schema';
import type { MovementDocument } from '../schemas/movement.schema';

function makeReservationDoc(id = 'res-1') {
  return {
    _id: { toString: () => id },
    sagaId: 'saga-1',
    osId: 'os-1',
    items: [{ partId: 'p-1', quantity: 3 }],
    status: ReservationStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeMovementDoc(id = 'mov-1') {
  return {
    _id: { toString: () => id },
    partId: 'p-1',
    type: MovementType.RESERVE,
    quantity: 3,
    reason: 'test',
    osId: 'os-1',
    sagaId: 'saga-1',
    createdAt: new Date(),
  };
}

function makeReservationModel(overrides: Record<string, unknown> = {}) {
  const doc = makeReservationDoc();
  return {
    findById: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(doc) }),
    findOne: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(doc) }),
    find: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue([doc]) }),
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

function makeMovementModel(overrides: Record<string, unknown> = {}) {
  const doc = makeMovementDoc();
  return {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([doc]),
    }),
    countDocuments: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(1) }),
    create: jest.fn().mockResolvedValue(doc),
    ...overrides,
  };
}

describe('MongoReservationRepository', () => {
  let repo: MongoReservationRepository;
  let reservationModel: ReturnType<typeof makeReservationModel>;
  let movementModel: ReturnType<typeof makeMovementModel>;

  beforeEach(() => {
    reservationModel = makeReservationModel();
    movementModel = makeMovementModel();
    repo = new MongoReservationRepository(
      reservationModel as unknown as Model<ReservationDocument>,
      movementModel as unknown as Model<MovementDocument>,
    );
  });

  it('findById returns StockReservation when found', async () => {
    const r = await repo.findById('res-1');
    expect(r).not.toBeNull();
    expect(r?.id).toBe('res-1');
  });

  it('findById returns null when not found', async () => {
    reservationModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    expect(await repo.findById('missing')).toBeNull();
  });

  it('findBySagaId returns StockReservation when found', async () => {
    const r = await repo.findBySagaId('saga-1');
    expect(r?.sagaId).toBe('saga-1');
  });

  it('findBySagaId returns null when not found', async () => {
    reservationModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    expect(await repo.findBySagaId('missing')).toBeNull();
  });

  it('findByOsId returns list of reservations', async () => {
    const results = await repo.findByOsId('os-1');
    expect(results).toHaveLength(1);
  });

  it('hasActiveReservationsForPart returns true when count > 0', async () => {
    reservationModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(2),
    });
    expect(await repo.hasActiveReservationsForPart('p-1')).toBe(true);
  });

  it('hasActiveReservationsForPart returns false when count is 0', async () => {
    reservationModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(0),
    });
    expect(await repo.hasActiveReservationsForPart('p-1')).toBe(false);
  });

  it('save creates a new reservation', async () => {
    const reservation = new StockReservation(
      'res-new',
      'saga-new',
      'os-1',
      [],
      ReservationStatus.ACTIVE,
      new Date(),
      new Date(),
    );
    const saved = await repo.save(reservation);
    expect(reservationModel.create).toHaveBeenCalled();
    expect(saved).toBeDefined();
  });

  it('update modifies reservation status', async () => {
    const reservation = new StockReservation(
      'res-1',
      'saga-1',
      'os-1',
      [],
      ReservationStatus.CONSUMED,
      new Date(),
      new Date(),
    );
    const updated = await repo.update(reservation);
    expect(reservationModel.findByIdAndUpdate).toHaveBeenCalled();
    expect(updated).toBeDefined();
  });

  it('update throws when reservation not found', async () => {
    reservationModel.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    const reservation = new StockReservation(
      'missing',
      'saga',
      'os',
      [],
      ReservationStatus.ACTIVE,
      new Date(),
      new Date(),
    );
    await expect(repo.update(reservation)).rejects.toThrow();
  });

  it('saveMovement creates movement record', async () => {
    const movement = StockMovement.reserve('p-1', 3, 'os-1', 'saga-1');
    await repo.saveMovement(movement);
    expect(movementModel.create).toHaveBeenCalled();
  });

  it('findMovementsByPartId returns paginated movements', async () => {
    const result = await repo.findMovementsByPartId('p-1', {
      type: MovementType.RESERVE,
    });
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('findMovementsByPartId applies date filters', async () => {
    const from = new Date('2024-01-01');
    const to = new Date('2024-12-31');
    await repo.findMovementsByPartId('p-1', { from, to, page: 2, limit: 5 });
    const dateFilter = expect.objectContaining({}) as unknown;
    expect(movementModel.find).toHaveBeenCalledWith(
      expect.objectContaining({ createdAt: dateFilter }),
    );
  });
});
