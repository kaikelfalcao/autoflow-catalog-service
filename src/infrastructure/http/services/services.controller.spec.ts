import { ServicesController } from './services.controller';
import { ServiceCatalogService } from '../../../application/services/service-catalog.service';

const mockService: jest.Mocked<Partial<ServiceCatalogService>> = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

describe('ServicesController', () => {
  let controller: ServicesController;

  beforeEach(() => {
    controller = new ServicesController(mockService as ServiceCatalogService);
    jest.clearAllMocks();
  });

  it('findAll delegates to service', () => {
    const query = { active: true };
    void controller.findAll(query);
    expect(mockService.findAll).toHaveBeenCalledWith(query);
  });

  it('findOne delegates to service', () => {
    void controller.findOne('svc-1');
    expect(mockService.findById).toHaveBeenCalledWith('svc-1');
  });

  it('create delegates to service', () => {
    const dto = { name: 'Test' };
    void controller.create(dto as Parameters<typeof controller.create>[0]);
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('update delegates to service', () => {
    const dto = { name: 'Updated' };
    void controller.update('svc-1', dto);
    expect(mockService.update).toHaveBeenCalledWith('svc-1', dto);
  });

  it('remove delegates to service', () => {
    void controller.remove('svc-1');
    expect(mockService.softDelete).toHaveBeenCalledWith('svc-1');
  });
});
