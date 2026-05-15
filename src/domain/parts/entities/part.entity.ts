import { PartCategory } from '../enums/part-category.enum';
import { Unit } from '../enums/unit.enum';
import { Quantity } from '../value-objects/quantity.vo';
import { SKU } from '../value-objects/sku.vo';
import { InsufficientStockError } from '../../shared/errors/insufficient-stock.error';

export class Part {
  constructor(
    readonly id: string,
    readonly sku: SKU,
    public name: string,
    public category: PartCategory,
    public unit: Unit,
    public attributes: Record<string, unknown>,
    public stockQuantity: number,
    public reservedQuantity: number,
    public minimumStock: number,
    public active: boolean,
    public lowStockAlertSent: boolean,
  ) {}

  get availableQuantity(): number {
    return this.stockQuantity - this.reservedQuantity;
  }

  canReserve(qty: number): boolean {
    return this.active && this.availableQuantity >= qty;
  }

  reserve(qty: Quantity): void {
    if (!this.canReserve(qty.value)) {
      throw new InsufficientStockError([
        {
          partId: this.id,
          requested: qty.value,
          available: this.availableQuantity,
        },
      ]);
    }
    this.reservedQuantity += qty.value;
  }

  consume(qty: Quantity): void {
    this.stockQuantity -= qty.value;
    this.reservedQuantity -= qty.value;
  }

  releaseReservation(qty: Quantity): void {
    this.reservedQuantity -= qty.value;
  }

  replenish(qty: Quantity): void {
    this.stockQuantity += qty.value;
    if (this.stockQuantity > this.minimumStock) {
      this.lowStockAlertSent = false;
    }
  }

  reduce(qty: Quantity): void {
    this.stockQuantity -= qty.value;
  }

  isBelowMinimum(): boolean {
    return this.stockQuantity <= this.minimumStock;
  }

  shouldEmitLowStockAlert(): boolean {
    return this.isBelowMinimum() && !this.lowStockAlertSent;
  }

  markLowStockAlertSent(): void {
    this.lowStockAlertSent = true;
  }
}
