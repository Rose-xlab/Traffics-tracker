// src/config.ts (updated)
import dotenv from 'dotenv';
import { validateExpressEnv, EnvValidator } from './utils/env-validator';

dotenv.config();

// Validate environment variables
const isValid = validateExpressEnv();

// Exit if required environment variables are missing
if (!isValid && process.env.NODE_ENV === 'production') {
  console.error('Missing required environment variables. Exiting...');
  process.exit(1);
}

// Use the EnvValidator.get method for safe access to env vars
const get = EnvValidator.get;

export default {
  server: {
    port: parseInt(get('PORT', '3001'), 10),
    env: get('NODE_ENV', 'development')
  },
  database: {
    url: get('SUPABASE_URL'),
    key: get('SUPABASE_SERVICE_KEY'),
    pgUrl: get('DATABASE_URL')
  },
  apis: {
    usitc: {
      baseUrl: get('USITC_API_URL', 'https://hts.usitc.gov/api')
    },
    ustr: {
      baseUrl: get('USTR_API_URL', 'https://ustr.gov/api')
    },
    cbp: {
      baseUrl: get('CBP_API_URL', 'https://www.cbp.gov/api')
    },
    federalRegister: {
      baseUrl: get('FED_REGISTER_API_URL', 'https://www.federalregister.gov/api/v1')
    },
    openai: {
      enabled: get('AI_FEATURES_ENABLED', 'true') === 'true',
      apiKey: get('OPENAI_API_KEY', ''),
      model: get('OPENAI_MODEL', 'gpt-4o'),
      temperature: parseFloat(get('OPENAI_TEMPERATURE', '0.2')),
      maxTokens: parseInt(get('OPENAI_MAX_TOKENS', '1000')),
      trackUsage: true
    }
  },
  sync: {
    concurrency: parseInt(get('SYNC_CONCURRENCY', '3'), 10),
    retries: parseInt(get('SYNC_RETRIES', '3'), 10),
    batchSize: parseInt(get('SYNC_BATCH_SIZE', '100'), 10)
  },
  logging: {
    level: get('LOG_LEVEL', 'info')
  },
  alerting: {
    enabled: get('ENABLE_ALERTS', 'false') === 'true',
    slackWebhookUrl: get('SLACK_WEBHOOK_URL', ''),
    email: get('ALERT_EMAIL', '')
  },
  redis: {
    host: get('REDIS_HOST', 'localhost'),
    port: parseInt(get('REDIS_PORT', '6379'), 10),
    password: get('REDIS_PASSWORD', ''),
    prefix: get('REDIS_PREFIX', 'tariffs_tracker:')
  }
};