import winston from 'winston';
import config from '../config';

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp, context, ...meta }) => {
  const contextStr = context ? `[${context}]` : '';
  const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `${timestamp} ${level} ${contextStr}: ${message}${metaStr}`;
});

const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});




export function createLogger(context: string,logger:winston.Logger) {

  return {
    debug: (message: string, meta: object = {}) => {
      // logger.debug(message, { context, ...meta });
      console.log(message,meta,"--------DEBUG------------")
    },
    info: (message: string, meta: object = {}) => {
      // logger.info(message, { context, ...meta });
      console.log(message,meta,"--------INFO------------")

    },
    warn: (message: string, meta: object = {}) => {
      // logger.warn(message, { context, ...meta });
      console.log(message,meta,"--------WARN------------")

    },
    error: (message: string, error?: Error, meta: object = {}) => {
      // logger.error(message, { 
      //   context, 
      //   ...meta,
      //   ...(error && { 
      //     errorMessage: error.message,
      //     stack: error.stack
      //   })
      // });

      console.log(message,meta,"--------ERROR------------")

    }
  };
}

export default logger;