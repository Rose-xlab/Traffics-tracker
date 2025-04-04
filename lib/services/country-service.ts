import { createLogger } from '@/lib/services/logger';
// Change this import to use your client-side Supabase client
import { createClient } from '@/lib/supabase/client';
import { ustrService } from './data-sources/ustr';

const logger = createLogger('country-service');

export class CountryService {
  // Initialize the client when needed, not at class level
  // This prevents issues during server-side rendering
  private getSupabase() {
    return createClient();
  }

  async getCountries() {
    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');

      if (error) throw error;

      // Fetch and merge trade agreement data
      const agreements = await ustrService.getTradeAgreements();
      
      return data.map(country => ({
        ...country,
        trade_agreements: agreements.filter(a =>
          a.countries.includes(country.code)
        ).map(a => a.name)
      }));
    } catch (error) {
      logger.error('Error fetching countries', error as Error);
      throw error;
    }
  }

  async getCountry(id: string) {
    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from('countries')
        .select(`
          *,
          tariff_rates!inner (
            *,
            products!inner (*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch additional trade data
      const [agreements, section301] = await Promise.all([
        ustrService.getTradeAgreements(),
        ustrService.getSection301Tariffs()
      ]);

      return {
        ...data,
        trade_agreements: agreements.filter(a =>
          a.countries.includes(data.code)
        ).map(a => a.name),
        special_tariffs: section301.some(t =>
          t.countries.includes(data.code)
        ) ? ['Section 301'] : []
      };
    } catch (error) {
      logger.error('Error fetching country', error as Error);
      throw error;
    }
  }

  async getCountryStatistics(id: string) {
    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from('tariff_rates')
        .select(`
          effective_date,
          total_rate,
          products (
            category
          )
        `)
        .eq('country_id', id)
        .order('effective_date');

      if (error) throw error;

      // Process data for charts
      const monthlyTrade = this.processMonthlyTrade(data);
      const categoryBreakdown = this.processCategoryBreakdown(data);

      return {
        monthlyTrade,
        categoryBreakdown
      };
    } catch (error) {
      logger.error('Error fetching country statistics', error as Error);
      throw error;
    }
  }

  private processMonthlyTrade(data: any[]) {
    // Group and aggregate data by month
    const monthly = data.reduce((acc, item) => {
      const month = new Date(item.effective_date).toISOString().slice(0, 7);
      if (!acc[month]) {
        acc[month] = { imports: 0, exports: 0 };
      }
      acc[month].imports += item.total_rate;
      return acc;
    }, {});

    return Object.entries(monthly).map(([month, values]) => ({
      month,
      ...values
    }));
  }

  private processCategoryBreakdown(data: any[]) {
    // Group and aggregate data by product category
    return data.reduce((acc, item) => {
      const category = item.products.category;
      if (!acc[category]) {
        acc[category] = { volume: 0, rate: 0, count: 0 };
      }
      acc[category].volume += 1;
      acc[category].rate += item.total_rate;
      acc[category].count += 1;
      return acc;
    }, {});
  }
}

export const countryService = new CountryService();