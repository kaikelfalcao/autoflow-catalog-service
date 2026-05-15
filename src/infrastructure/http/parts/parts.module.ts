import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PartsController, ReservationsController } from './parts.controller';
import { PartCatalogService } from '../../../application/parts/part-catalog.service';
import { StockService } from '../../../application/parts/stock.service';
import { MongoPartRepository } from '../../database/repositories/mongo-part.repository';
import { MongoReservationRepository } from '../../database/repositories/mongo-reservation.repository';
import { RabbitMQSagaReplyPublisher } from '../../messaging/publishers/rabbitmq-saga-reply.publisher';
import { StockSagaConsumer } from '../../messaging/consumers/stock-saga.consumer';
import { DlqConsumer } from '../../messaging/dlq/dlq.consumer';
import { PartDoc, PartSchema } from '../../database/schemas/part.schema';
import {
  ReservationDoc,
  ReservationSchema,
} from '../../database/schemas/reservation.schema';
import {
  MovementDoc,
  MovementSchema,
} from '../../database/schemas/movement.schema';
import {
  PART_REPO,
  RESERVATION_REPO,
  SAGA_REPLY_PUBLISHER,
} from '../../../application/shared/tokens';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PartDoc.name, schema: PartSchema },
      { name: ReservationDoc.name, schema: ReservationSchema },
      { name: MovementDoc.name, schema: MovementSchema },
    ]),
  ],
  controllers: [PartsController, ReservationsController],
  providers: [
    PartCatalogService,
    StockService,
    StockSagaConsumer,
    DlqConsumer,
    { provide: PART_REPO, useClass: MongoPartRepository },
    { provide: RESERVATION_REPO, useClass: MongoReservationRepository },
    { provide: SAGA_REPLY_PUBLISHER, useClass: RabbitMQSagaReplyPublisher },
  ],
})
export class PartsModule {}
