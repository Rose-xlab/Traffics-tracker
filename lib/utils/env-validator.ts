// lib/utils/env-validator.ts
type EnvVar = {
    key: string;
    required: boolean;
    defaultValue?: string;
    isPublic?: boolean;
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
      const { key, defaultValue, isPublic } = envVar;
      const envKey = isPublic ? `NEXT_PUBLIC_${key}` : key;
      return process.env[envKey] || defaultValue;
    }
  
    private logMissingVars(): void {
      console.error('Missing required environment variables:');
      this.missingVars.forEach(key => {
        console.error(`- ${key}`);
      });
      console.error('Please check your .env file. See .env.example for required variables.');
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
        console.warn(`Environment variable ${key} is not defined`);
        return '';
      }
      
      return value;
    }
  }
  
  // Define all required environment variables here
  export const nextEnvVars: EnvVar[] = [
    { key: 'SITE_URL', required: true, defaultValue: 'http://localhost:3000', isPublic: true },
    { key: 'DATA_SERVICE_URL', required: true, defaultValue: 'http://localhost:3001', isPublic: true },
    { key: 'SUPABASE_URL', required: true, isPublic: true },
    { key: 'SUPABASE_ANON_KEY', required: true, isPublic: true },
  ];
  
  export const expressEnvVars: EnvVar[] = [
    { key: 'PORT', required: false, defaultValue: '3001' },
    { key: 'NODE_ENV', required: false, defaultValue: 'development' },
    { key: 'LOG_LEVEL', required: false, defaultValue: 'info' },
    { key: 'API_KEY', required: true },
    { key: 'SUPABASE_URL', required: true },
    { key: 'SUPABASE_SERVICE_KEY', required: true },
    { key: 'REDIS_HOST', required: true, defaultValue: 'localhost' },
    { key: 'REDIS_PORT', required: false, defaultValue: '6379' },
    { key: 'REDIS_PASSWORD', required: false },
    { key: 'USITC_API_URL', required: false, defaultValue: 'https://hts.usitc.gov/api' },
    { key: 'USTR_API_URL', required: false, defaultValue: 'https://ustr.gov/api' },
    { key: 'CBP_API_URL', required: false, defaultValue: 'https://www.cbp.gov/api' },
    { key: 'FED_REGISTER_API_URL', required: false, defaultValue: 'https://www.federalregister.gov/api/v1' },
  ];
  
  // Validate Next.js environment variables
  export function validateNextEnv(): boolean {
    const validator = new EnvValidator(nextEnvVars);
    return validator.validate();
  }
  
  // Validate Express environment variables
  export function validateExpressEnv(): boolean {
    const validator = new EnvValidator(expressEnvVars);
    return validator.validate();
  }