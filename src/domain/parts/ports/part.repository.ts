import { Part } from '../entities/part.entity';
import { PartCategory } from '../enums/part-category.enum';

export interface ListPartsFilter {
  category?: PartCategory;
  active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PartRepository {
  findById(id: string): Promise<Part | null>;
  findAll(filter: ListPartsFilter): Promise<PaginatedResult<Part>>;
  findLowStock(): Promise<Part[]>;
  save(part: Part): Promise<Part>;
  update(part: Part): Promise<Part>;
}
