import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicesController } from './services.controller';
import { ServiceCatalogService } from '../../../application/services/service-catalog.service';
import { MongoServiceRepository } from '../../database/repositories/mongo-service.repository';
import {
  ServiceDoc,
  ServiceSchema,
} from '../../database/schemas/service.schema';
import { SERVICE_REPO } from '../../../application/shared/tokens';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceDoc.name, schema: ServiceSchema },
    ]),
  ],
  controllers: [ServicesController],
  providers: [
    ServiceCatalogService,
    { provide: SERVICE_REPO, useClass: MongoServiceRepository },
  ],
})
export class ServicesModule {}
