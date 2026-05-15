import { randomBytes } from 'crypto';
import { PartCategory } from '../enums/part-category.enum';

export class SKU {
  readonly value: string;

  constructor(value: string) {
    if (!/^PART-[A-Z_]+-[A-F0-9]{8}$/.test(value)) {
      throw new Error('SKU inválido');
    }
    this.value = value;
  }

  static generate(category: PartCategory): SKU {
    return new SKU(
      `PART-${category}-${randomBytes(4).toString('hex').toUpperCase()}`,
    );
  }

  toJSON(): string {
    return this.value;
  }
}
