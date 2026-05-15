import { PartsController, ReservationsController } from './parts.controller';
import { PartCatalogService } from '../../../application/parts/part-catalog.service';

const mockService: jest.Mocked<Partial<PartCatalogService>> = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findLowStock: jest.fn(),
  findMovements: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  replenish: jest.fn(),
  adjustStock: jest.fn(),
  softDelete: jest.fn(),
  findReservationsByOsId: jest.fn(),
};

describe('PartsController', () => {
  let controller: PartsController;

  beforeEach(() => {
    controller = new PartsController(mockService as PartCatalogService);
    jest.clearAllMocks();
  });

  it('findAll delegates to service', () => {
    const query = { page: 1, limit: 20 };
    void controller.findAll(query);
    expect(mockService.findAll).toHaveBeenCalledWith(query);
  });

  it('findLowStock delegates to service', () => {
    void controller.findLowStock();
    expect(mockService.findLowStock).toHaveBeenCalled();
  });

  it('findOne delegates to service', () => {
    void controller.findOne('p-1');
    expect(mockService.findById).toHaveBeenCalledWith('p-1');
  });

  it('findMovements delegates to service', () => {
    const query = { page: 1 };
    void controller.findMovements('p-1', query);
    expect(mockService.findMovements).toHaveBeenCalledWith('p-1', query);
  });

  it('create delegates to service', () => {
    const dto = { name: 'Part' };
    void controller.create(dto as Parameters<typeof controller.create>[0]);
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('update delegates to service', () => {
    const dto = { name: 'New' };
    void controller.update('p-1', dto);
    expect(mockService.update).toHaveBeenCalledWith('p-1', dto);
  });

  it('replenish delegates to service', () => {
    const dto = { quantity: 5, reason: 'r' };
    void controller.replenish('p-1', dto);
    expect(mockService.replenish).toHaveBeenCalledWith('p-1', dto);
  });

  it('adjust delegates to service', () => {
    const dto = { newQuantity: 10, reason: 'r' };
    void controller.adjust('p-1', dto);
    expect(mockService.adjustStock).toHaveBeenCalledWith('p-1', dto);
  });

  it('remove delegates to service', () => {
    void controller.remove('p-1');
    expect(mockService.softDelete).toHaveBeenCalledWith('p-1');
  });
});

describe('ReservationsController', () => {
  let controller: ReservationsController;

  beforeEach(() => {
    controller = new ReservationsController(mockService as PartCatalogService);
    jest.clearAllMocks();
  });

  it('findByOsId delegates to service', () => {
    void controller.findByOsId('os-1');
    expect(mockService.findReservationsByOsId).toHaveBeenCalledWith('os-1');
  });
});
