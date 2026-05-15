import { InvalidQuantityError } from '../../shared/errors/invalid-quantity.error';

export class Quantity {
  readonly value: number;

  constructor(value: number) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new InvalidQuantityError('Quantidade deve ser inteiro positivo');
    }
    this.value = value;
  }
}
