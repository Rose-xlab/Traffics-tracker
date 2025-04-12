// src/services/tariff-history-service.ts
import { supabase } from '../utils/database';
import logger, { createLogger } from '../utils/logger';

const loga = createLogger('tariff-history', logger);

/**
 * Record a tariff rate change in the history
 */
export async function recordTariffChange(
  productId: string,
  countryId: string,
  oldRate: any,
  newRate: any,
  effectiveDate: string,
  source: string,
  notes?: string
): Promise<void> {
  try {
    // Close the previous rate period if it exists
    if (oldRate) {
      await supabase
        .from('tariff_history')
        .update({ end_date: effectiveDate })
        .match({ 
          product_id: productId, 
          country_id: countryId,
          end_date: null 
        });
    }

     // Insert the new rate
     await supabase
     .from('tariff_history')
     .insert({
       product_id: productId,
       country_id: countryId,
       base_rate: newRate.baseRate,
       additional_rates: newRate.additionalRates,
       total_rate: newRate.totalRate,
       effective_date: effectiveDate,
       source,
       notes
     });
     
   loga.info(`Recorded tariff change for product ${productId}, country ${countryId}`);
 } catch (error) {
   logger.error(`Failed to record tariff change for product ${productId}, error`);
   throw error;
 }
}
/**
 * Get historical tariff rates for a product-country combination
 */
export async function getHistoricalRates(
    productId: string,
    countryId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('tariff_history')
        .select('*')
        .eq('product_id', productId)
        .order('effective_date', { ascending: false });
        
      if (countryId) {
        query = query.eq('country_id', countryId);
      }
      
      if (startDate) {
        query = query.gte('effective_date', startDate);
      }
      
      if (endDate) {
        query = query.lte('effective_date', endDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      loga.error(`Failed to get historical rates for product ${productId}, error`);
      throw error;
    }
  }
