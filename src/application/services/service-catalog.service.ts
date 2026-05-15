import { Inject, Injectable, Logger } from '@nestjs/common';
import { SERVICE_REPO } from '../shared/tokens';
import type {
  ServiceRepository,
  ListServicesFilter,
  PaginatedServices,
} from '../../domain/services/ports/service.repository';
import { Service } from '../../domain/services/entities/service.entity';
import { Money } from '../../domain/services/value-objects/money.vo';
import { EstimatedDuration } from '../../domain/services/value-objects/estimated-duration.vo';
import { ServiceNotFoundError } from '../../domain/shared/errors/service-not-found.error';
import { v4 as uuidv4 } from 'uuid';

export interface CreateServiceDto {
  name: string;
  description?: string;
  estimatedMinutes: number;
  laborCost: { amount: number; currency: string };
}

export interface UpdateServiceDto {
  name?: string;
  description?: string;
  estimatedMinutes?: number;
  laborCost?: { amount: number; currency: string };
}

@Injectable()
export class ServiceCatalogService {
  private readonly logger = new Logger(ServiceCatalogService.name);

  constructor(
    @Inject(SERVICE_REPO) private readonly serviceRepo: ServiceRepository,
  ) {}

  async findAll(filter: ListServicesFilter): Promise<PaginatedServices> {
    return this.serviceRepo.findAll(filter);
  }

  async findById(id: string): Promise<Service> {
    const service = await this.serviceRepo.findById(id);
    if (!service) throw new ServiceNotFoundError(id);
    return service;
  }

  async create(dto: CreateServiceDto): Promise<Service> {
    const shortId = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
    const sku = `SVC-${shortId}`;
    const service = new Service(
      uuidv4(),
      sku,
      dto.name,
      dto.description ?? '',
      new EstimatedDuration(dto.estimatedMinutes),
      new Money(dto.laborCost.amount, dto.laborCost.currency),
      true,
    );
    return this.serviceRepo.save(service);
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.serviceRepo.findById(id);
    if (!service) throw new ServiceNotFoundError(id);

    if (dto.name !== undefined) service.name = dto.name;
    if (dto.description !== undefined) service.description = dto.description;
    if (dto.estimatedMinutes !== undefined) {
      service.estimatedDuration = new EstimatedDuration(dto.estimatedMinutes);
    }
    if (dto.laborCost !== undefined) {
      service.laborCost = new Money(
        dto.laborCost.amount,
        dto.laborCost.currency,
      );
    }

    return this.serviceRepo.update(service);
  }

  async softDelete(id: string): Promise<void> {
    const service = await this.serviceRepo.findById(id);
    if (!service) throw new ServiceNotFoundError(id);
    service.deactivate();
    await this.serviceRepo.update(service);
  }
}
