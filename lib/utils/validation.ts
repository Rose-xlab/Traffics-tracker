import { z } from 'zod';

// User input validation schemas
export const userInputSchema = {
  search: z.object({
    query: z.string().min(1, 'Search query is required'),
    category: z.string().optional(),
    country: z.string().optional(),
    rateRange: z.object({
      min: z.number().min(0),
      max: z.number().max(100),
    }).optional(),
  }),

  watchlist: z.object({
    productId: z.string().uuid('Invalid product ID'),
    countryId: z.string().uuid('Invalid country ID'),
    notifyChanges: z.boolean().default(true),
  }),

  notificationPreferences: z.object({
    email: z.boolean(),
    push: z.boolean(),
    frequency: z.enum(['immediate', 'daily', 'weekly']),
    types: z.object({
      rate_changes: z.boolean(),
      new_rulings: z.boolean(),
      exclusions: z.boolean(),
    }),
  }),
};

// Data validation schemas
export const dataSchema = {
  product: z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().optional(),
    htsCode: z.string().regex(/^\d{4}\.\d{2}\.\d{4}$/),
    category: z.string().min(1),
    baseRate: z.number().min(0),
    totalRate: z.number().min(0),
    lastUpdated: z.string().datetime(),
  }),

  tariffRate: z.object({
    baseRate: z.number().min(0),
    additionalRates: z.array(z.object({
      type: z.string(),
      rate: z.number().min(0),
      description: z.string(),
    })),
    totalRate: z.number().min(0),
    effectiveDate: z.string().datetime(),
  }),
};

// Helper functions
export function validateUserInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}