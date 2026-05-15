import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { WinstonModule } from 'nest-winston';
import { TerminusModule } from '@nestjs/terminus';
import { validateEnv } from './shared/config/env.config';
import { winstonConfig } from './shared/logger/winston.config';
import { CorrelationIdMiddleware } from './shared/middlewares/correlation-id.middleware';
import { PartsModule } from './infrastructure/http/parts/parts.module';
import { ServicesModule } from './infrastructure/http/services/services.module';
import { HealthController } from './infrastructure/http/health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ validate: validateEnv, isGlobal: true }),
    WinstonModule.forRoot(winstonConfig),
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    {
      ...RabbitMQModule.forRoot({
        uri: process.env.RABBITMQ_URL!,
        prefetchCount: parseInt(process.env.RABBITMQ_PREFETCH ?? '10', 10),
        exchanges: [
          { name: 'oficina.commands', type: 'topic' },
          { name: 'oficina.replies', type: 'topic' },
          { name: 'oficina.alerts', type: 'topic' },
          { name: 'oficina.dlx', type: 'topic' },
        ],
        connectionInitOptions: { wait: true, timeout: 30000 },
      }),
      global: true,
    },
    TerminusModule,
    PartsModule,
    ServicesModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
