import { EstimatedDuration } from '../value-objects/estimated-duration.vo';
import { Money } from '../value-objects/money.vo';

export class Service {
  constructor(
    readonly id: string,
    readonly sku: string,
    public name: string,
    public description: string,
    public estimatedDuration: EstimatedDuration,
    public laborCost: Money,
    public active: boolean,
  ) {}

  activate(): void {
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
  }
}
