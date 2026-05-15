export interface StockFailure {
  partId: string;
  requested: number;
  available: number;
}

export class InsufficientStockError extends Error {
  constructor(readonly failures: StockFailure[]) {
    super('Insufficient stock for one or more parts');
    this.name = 'InsufficientStockError';
  }
}
