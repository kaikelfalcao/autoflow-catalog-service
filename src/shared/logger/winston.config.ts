import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

export const winstonConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : nestWinstonModuleUtilities.format.nestLike('catalog-service', {
          prettyPrint: true,
          colors: true,
        }),
  ),
  transports: [new winston.transports.Console()],
};
