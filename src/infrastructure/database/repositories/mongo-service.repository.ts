import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Error as MongooseError } from 'mongoose';
import {
  ServiceRepository,
  ListServicesFilter,
  PaginatedServices,
} from '../../../domain/services/ports/service.repository';
import { Service } from '../../../domain/services/entities/service.entity';
import { ServiceDoc, ServiceDocument } from '../schemas/service.schema';
import { ServiceMapper } from '../mappers/service.mapper';

@Injectable()
export class MongoServiceRepository implements ServiceRepository {
  constructor(
    @InjectModel(ServiceDoc.name)
    private readonly model: Model<ServiceDocument>,
  ) {}

  async findById(id: string): Promise<Service | null> {
    try {
      const doc = await this.model.findById(id).exec();
      return doc ? ServiceMapper.toDomain(doc) : null;
    } catch (err) {
      if (err instanceof MongooseError.CastError) return null;
      throw err;
    }
  }

  async findAll(filter: ListServicesFilter): Promise<PaginatedServices> {
    const page = filter.page ?? 1;
    const limit = Math.min(filter.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (filter.active !== undefined) query.active = filter.active;
    if (filter.search) query.$text = { $search: filter.search };

    const [docs, total] = await Promise.all([
      this.model.find(query).skip(skip).limit(limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return {
      data: docs.map((doc) => ServiceMapper.toDomain(doc)),
      total,
      page,
      limit,
    };
  }

  async save(service: Service): Promise<Service> {
    const data = ServiceMapper.toPersistence(service);
    const created = await this.model.create(data);
    return ServiceMapper.toDomain(created);
  }

  async update(service: Service): Promise<Service> {
    const data = ServiceMapper.toPersistence(service);
    const updated = await this.model
      .findByIdAndUpdate(service.id, data, { new: true })
      .exec();
    if (!updated) throw new Error(`Service ${service.id} not found for update`);
    return ServiceMapper.toDomain(updated);
  }
}
