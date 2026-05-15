import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { MovementType } from '../../../domain/parts/enums/movement-type.enum';

export type MovementDocument = HydratedDocument<MovementDoc>;

@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'movements',
})
export class MovementDoc {
  @Prop({ required: true, index: true })
  partId: string;

  @Prop({ type: String, required: true, enum: Object.values(MovementType) })
  type: MovementType;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  reason: string;

  @Prop({ index: true })
  osId?: string;

  @Prop({ index: true })
  sagaId?: string;
}

export const MovementSchema = SchemaFactory.createForClass(MovementDoc);
MovementSchema.index({ partId: 1, createdAt: -1 });
