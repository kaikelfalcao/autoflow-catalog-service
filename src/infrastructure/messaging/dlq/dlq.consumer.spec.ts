import { DlqConsumer } from './dlq.consumer';

describe('DlqConsumer', () => {
  let consumer: DlqConsumer;

  beforeEach(() => {
    consumer = new DlqConsumer();
  });

  it('handleReserveStockDlq logs message without throwing', () => {
    expect(() =>
      consumer.handleReserveStockDlq({ test: 'data' }),
    ).not.toThrow();
  });

  it('handleConsumeStockDlq logs message without throwing', () => {
    expect(() =>
      consumer.handleConsumeStockDlq({ test: 'data' }),
    ).not.toThrow();
  });

  it('handleReleaseReservationDlq logs message without throwing', () => {
    expect(() =>
      consumer.handleReleaseReservationDlq({ test: 'data' }),
    ).not.toThrow();
  });
});
