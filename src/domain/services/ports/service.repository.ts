import { Service } from '../entities/service.entity';

export interface ListServicesFilter {
  active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedServices {
  data: Service[];
  total: number;
  page: number;
  limit: number;
}

export interface ServiceRepository {
  findById(id: string): Promise<Service | null>;
  findAll(filter: ListServicesFilter): Promise<PaginatedServices>;
  save(service: Service): Promise<Service>;
  update(service: Service): Promise<Service>;
}
