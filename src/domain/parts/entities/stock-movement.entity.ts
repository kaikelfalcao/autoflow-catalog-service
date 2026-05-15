import { MovementType } from '../enums/movement-type.enum';

export class StockMovement {
  constructor(
    readonly id: string,
    readonly partId: string,
    readonly type: MovementType,
    readonly quantity: number,
    readonly reason: string,
    readonly osId: string | null,
    readonly sagaId: string | null,
    readonly createdAt: Date,
  ) {}

  static reserve(
    partId: string,
    qty: number,
    osId: string,
    sagaId: string,
  ): StockMovement {
    return new StockMovement(
      '',
      partId,
      MovementType.RESERVE,
      qty,
      'Stock reserved via saga',
      osId,
      sagaId,
      new Date(),
    );
  }

  static consume(
    partId: string,
    qty: number,
    osId: string,
    sagaId: string,
  ): StockMovement {
    return new StockMovement(
      '',
      partId,
      MovementType.OUT,
      qty,
      'Stock consumed via saga',
      osId,
      sagaId,
      new Date(),
    );
  }

  static release(
    partId: string,
    qty: number,
    osId: string,
    sagaId: string,
  ): StockMovement {
    return new StockMovement(
      '',
      partId,
      MovementType.RELEASE,
      qty,
      'Reservation released via saga',
      osId,
      sagaId,
      new Date(),
    );
  }

  static replenish(partId: string, qty: number, reason: string): StockMovement {
    return new StockMovement(
      '',
      partId,
      MovementType.IN,
      qty,
      reason,
      null,
      null,
      new Date(),
    );
  }
}
