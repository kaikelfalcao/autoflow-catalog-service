export interface StockReservedPayload {
  sagaId: string;
  osId: string;
  reservationId: string;
}

export interface StockConsumedPayload {
  sagaId: string;
  osId: string;
  reservationId: string;
}

export interface ReservationReleasedPayload {
  sagaId: string;
  osId: string;
  reservationId: string;
}

export interface StockInsufficientPayload {
  sagaId: string;
  osId: string;
  failures: Array<{ partId: string; requested: number; available: number }>;
}

export interface LowStockAlertPayload {
  partId: string;
  sku: string;
  name: string;
  currentStock: number;
  minimumStock: number;
}

export interface SagaReplyPublisher {
  publishStockReserved(payload: StockReservedPayload): Promise<void>;
  publishStockConsumed(payload: StockConsumedPayload): Promise<void>;
  publishReservationReleased(
    payload: ReservationReleasedPayload,
  ): Promise<void>;
  publishStockInsufficient(payload: StockInsufficientPayload): Promise<void>;
  publishLowStockAlert(payload: LowStockAlertPayload): Promise<void>;
}
