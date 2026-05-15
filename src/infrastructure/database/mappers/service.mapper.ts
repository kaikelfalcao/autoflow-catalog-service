import { Service } from '../../../domain/services/entities/service.entity';
import { Money } from '../../../domain/services/value-objects/money.vo';
import { EstimatedDuration } from '../../../domain/services/value-objects/estimated-duration.vo';
import { ServiceDocument } from '../schemas/service.schema';

export class ServiceMapper {
  static toDomain(doc: ServiceDocument): Service {
    return new Service(
      doc._id.toString(),
      doc.sku,
      doc.name,
      doc.description,
      new EstimatedDuration(doc.estimatedMinutes),
      new Money(doc.laborCost.amount, doc.laborCost.currency),
      doc.active,
    );
  }

  static toPersistence(service: Service): Partial<ServiceDocument> {
    return {
      sku: service.sku,
      name: service.name,
      description: service.description,
      estimatedMinutes: service.estimatedDuration.minutes,
      laborCost: {
        amount: service.laborCost.amount,
        currency: service.laborCost.currency,
      },
      active: service.active,
    };
  }
}
