// src/utils/env-validator.ts
import { createLogger } from './logger';

const logger = createLogger('env-validator');

type EnvVar = {
  key: string;
  required: boolean;
  defaultValue?: string;
};

export class EnvValidator {
  private envVars: EnvVar[];
  private missingVars: string[] = [];

  constructor(envVars: EnvVar[]) {
    this.envVars = envVars;
  }

  validate(): boolean {
    this.missingVars = [];

    for (const envVar of this.envVars) {
      const value = this.getEnvValue(envVar);
      
      if (envVar.required && !value) {
        this.missingVars.push(envVar.key);
      }
    }

    if (this.missingVars.length > 0) {
      this.logMissingVars();
      return false;
    }

    return true;
  }

  private getEnvValue(envVar: EnvVar): string | undefined {
    const { key, defaultValue } = envVar;
    return process.env[key] || defaultValue;
  }

  private logMissingVars(): void {
    logger.error('Missing required environment variables:');
    this.missingVars.forEach(key => {
      logger.error(`- ${key}`);
    });
    logger.error('Please check your .env file. See .env.example for required variables.');
  }

  /**
   * Get the value of an environment variable
   * @param key The environment variable key
   * @param defaultValue Optional default value
   * @returns The environment variable value or default value
   */
  static get(key: string, defaultValue?: string): string {
    const value = process.env[key];
    
    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      logger.warn(`Environment variable ${key} is not defined`);
      return '';
    }
    
    return value;
  }
}

// Define all required environment variables here
const requiredEnvVars: EnvVar[] = [
  { key: 'SUPABASE_URL', required: true },
  { key: 'SUPABASE_SERVICE_KEY', required: true },
  { key: 'API_KEY', required: true },
  // OpenAI is required when AI features are enabled
  { key: 'OPENAI_API_KEY', required: process.env.AI_FEATURES_ENABLED === 'true' },
];

const optionalEnvVars: EnvVar[] = [
  { key: 'PORT', required: false, defaultValue: '3001' },
  { key: 'NODE_ENV', required: false, defaultValue: 'development' },
  { key: 'LOG_LEVEL', required: false, defaultValue: 'info' },
  { key: 'REDIS_HOST', required: false, defaultValue: 'localhost' },
  { key: 'REDIS_PORT', required: false, defaultValue: '6379' },
  { key: 'REDIS_PASSWORD', required: false },
  { key: 'REDIS_PREFIX', required: false, defaultValue: 'tariffs_tracker:' },
  { key: 'SYNC_CONCURRENCY', required: false, defaultValue: '3' },
  { key: 'SYNC_RETRIES', required: false, defaultValue: '3' },
  { key: 'SYNC_BATCH_SIZE', required: false, defaultValue: '100' },
  { key: 'USITC_API_URL', required: false, defaultValue: 'https://hts.usitc.gov/api' },
  { key: 'USTR_API_URL', required: false, defaultValue: 'https://ustr.gov/api' },
  { key: 'CBP_API_URL', required: false, defaultValue: 'https://www.cbp.gov/api' },
  { key: 'FED_REGISTER_API_URL', required: false, defaultValue: 'https://www.federalregister.gov/api/v1' },
  { key: 'ENABLE_ALERTS', required: false, defaultValue: 'false' },
  { key: 'SLACK_WEBHOOK_URL', required: false },
  { key: 'ALERT_EMAIL', required: false },
  
  // New AI-related variables
  { key: 'AI_FEATURES_ENABLED', required: false, defaultValue: 'true' },
  { key: 'OPENAI_MODEL', required: false, defaultValue: 'gpt-4o' },
  { key: 'OPENAI_TEMPERATURE', required: false, defaultValue: '0.2' },
  { key: 'OPENAI_MAX_TOKENS', required: false, defaultValue: '1000' },
  { key: 'OPENAI_TIMEOUT', required: false, defaultValue: '30000' },
  { key: 'OPENAI_RETRY_COUNT', required: false, defaultValue: '3' },
  { key: 'AI_CACHE_TTL', required: false, defaultValue: '3600' },
  { key: 'AI_TRACK_USAGE', required: false, defaultValue: 'true' },
];

// Combine all env vars
const allEnvVars = [...requiredEnvVars, ...optionalEnvVars];

// Validate environment variables
export function validateEnv(): boolean {
  const validator = new EnvValidator(allEnvVars);
  return validator.validate();
}

// Validate Express specific environment variables
export function validateExpressEnv(): boolean {
  // For Express, we only need to validate a subset of the variables
  const expressEnvVars = allEnvVars.filter(envVar => 
    envVar.key !== 'AI_FEATURES_ENABLED' || 
    (envVar.key === 'OPENAI_API_KEY' && process.env.AI_FEATURES_ENABLED === 'true')
  );
  
  const validator = new EnvValidator(expressEnvVars);
  return validator.validate();
}

// Export the get method for easy access
export const get = EnvValidator.get;