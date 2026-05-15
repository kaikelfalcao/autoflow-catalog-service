import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { PartCategory } from '../../../domain/parts/enums/part-category.enum';
import { Unit } from '../../../domain/parts/enums/unit.enum';

export type PartDocument = HydratedDocument<PartDoc>;

@Schema({
  timestamps: true,
  collection: 'parts',
  optimisticConcurrency: true,
  versionKey: 'version',
})
export class PartDoc {
  @Prop({ unique: true, index: true })
  sku: string;

  @Prop({ required: true })
  name: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(PartCategory),
    index: true,
  })
  category: PartCategory;

  @Prop({ type: String, required: true, enum: Object.values(Unit) })
  unit: Unit;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  attributes: Record<string, unknown>;

  @Prop({ required: true, min: 0 })
  stockQuantity: number;

  @Prop({ required: true, min: 0, default: 0 })
  reservedQuantity: number;

  @Prop({ required: true, min: 0, default: 0 })
  minimumStock: number;

  @Prop({ default: true, index: true })
  active: boolean;

  @Prop({ default: false })
  lowStockAlertSent: boolean;
}

export const PartSchema = SchemaFactory.createForClass(PartDoc);
PartSchema.index({ name: 'text' });
PartSchema.index({ category: 1, active: 1 });
