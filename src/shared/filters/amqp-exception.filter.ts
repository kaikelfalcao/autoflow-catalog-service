import { Logger } from '@nestjs/common';

export class AmqpExceptionFilter {
  private readonly logger = new Logger(AmqpExceptionFilter.name);

  catch(exception: unknown): void {
    this.logger.error('AMQP exception caught', {
      error: (exception as Error).message,
      stack: (exception as Error).stack,
    });
  }
}
