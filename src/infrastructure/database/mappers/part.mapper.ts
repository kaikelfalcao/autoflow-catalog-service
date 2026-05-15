import { Part } from '../../../domain/parts/entities/part.entity';
import { SKU } from '../../../domain/parts/value-objects/sku.vo';
import { PartDocument } from '../schemas/part.schema';

export class PartMapper {
  static toDomain(doc: PartDocument): Part {
    return new Part(
      doc._id.toString(),
      new SKU(doc.sku),
      doc.name,
      doc.category,
      doc.unit,
      doc.attributes ?? {},
      doc.stockQuantity,
      doc.reservedQuantity,
      doc.minimumStock,
      doc.active,
      doc.lowStockAlertSent,
    );
  }

  static toPersistence(part: Part): Partial<PartDocument> {
    return {
      sku: part.sku.value,
      name: part.name,
      category: part.category,
      unit: part.unit,
      attributes: part.attributes,
      stockQuantity: part.stockQuantity,
      reservedQuantity: part.reservedQuantity,
      minimumStock: part.minimumStock,
      active: part.active,
      lowStockAlertSent: part.lowStockAlertSent,
    };
  }
}
