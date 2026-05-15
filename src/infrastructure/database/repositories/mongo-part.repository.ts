import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Error as MongooseError } from 'mongoose';
import {
  PartRepository,
  ListPartsFilter,
  PaginatedResult,
} from '../../../domain/parts/ports/part.repository';
import { Part } from '../../../domain/parts/entities/part.entity';
import { PartDoc, PartDocument } from '../schemas/part.schema';
import { PartMapper } from '../mappers/part.mapper';

@Injectable()
export class MongoPartRepository implements PartRepository {
  constructor(
    @InjectModel(PartDoc.name) private readonly model: Model<PartDocument>,
  ) {}

  async findById(id: string): Promise<Part | null> {
    try {
      const doc = await this.model.findById(id).exec();
      return doc ? PartMapper.toDomain(doc) : null;
    } catch (err) {
      if (err instanceof MongooseError.CastError) return null;
      throw err;
    }
  }

  async findAll(filter: ListPartsFilter): Promise<PaginatedResult<Part>> {
    const page = filter.page ?? 1;
    const limit = Math.min(filter.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (filter.category) query.category = filter.category;
    if (filter.active !== undefined) query.active = filter.active;
    if (filter.search) query.$text = { $search: filter.search };

    const [docs, total] = await Promise.all([
      this.model.find(query).skip(skip).limit(limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return {
      data: docs.map((doc) => PartMapper.toDomain(doc)),
      total,
      page,
      limit,
    };
  }

  async findLowStock(): Promise<Part[]> {
    const docs = await this.model
      .find({ $expr: { $lte: ['$stockQuantity', '$minimumStock'] } })
      .exec();
    return docs.map((doc) => PartMapper.toDomain(doc));
  }

  async save(part: Part): Promise<Part> {
    const data = PartMapper.toPersistence(part);
    const created = await this.model.create(data);
    return PartMapper.toDomain(created);
  }

  async update(part: Part): Promise<Part> {
    const data = PartMapper.toPersistence(part);
    const updated = await this.model
      .findByIdAndUpdate(part.id, data, { new: true })
      .exec();
    if (!updated) throw new Error(`Part ${part.id} not found for update`);
    return PartMapper.toDomain(updated);
  }
}
