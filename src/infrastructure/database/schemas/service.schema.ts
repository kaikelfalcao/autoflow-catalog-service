import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ServiceDocument = HydratedDocument<ServiceDoc>;

@Schema({ timestamps: true, collection: 'services' })
export class ServiceDoc {
  @Prop({ unique: true, index: true })
  sku: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true, min: 1 })
  estimatedMinutes: number;

  @Prop({
    type: { amount: Number, currency: String },
    required: true,
  })
  laborCost: { amount: number; currency: string };

  @Prop({ default: true, index: true })
  active: boolean;
}

export const ServiceSchema = SchemaFactory.createForClass(ServiceDoc);
ServiceSchema.index({ name: 'text' });
