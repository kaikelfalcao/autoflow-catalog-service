import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ReservationStatus } from '../../../domain/parts/enums/reservation-status.enum';

export type ReservationDocument = HydratedDocument<ReservationDoc>;

@Schema({ timestamps: true, collection: 'reservations' })
export class ReservationDoc {
  @Prop({ unique: true, index: true })
  sagaId: string;

  @Prop({ required: true, index: true })
  osId: string;

  @Prop({
    type: [{ partId: String, quantity: Number }],
    required: true,
  })
  items: Array<{ partId: string; quantity: number }>;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(ReservationStatus),
    index: true,
  })
  status: ReservationStatus;
}

export const ReservationSchema = SchemaFactory.createForClass(ReservationDoc);
ReservationSchema.index({ osId: 1 });
