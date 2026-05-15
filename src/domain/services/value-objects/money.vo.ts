export class Money {
  readonly amount: number;
  readonly currency: string;

  constructor(amount: number, currency: string) {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new Error('Money amount must be a non-negative integer (centavos)');
    }
    this.amount = amount;
    this.currency = currency;
  }
}
