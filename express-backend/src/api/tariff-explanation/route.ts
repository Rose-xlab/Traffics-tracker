// src/api/tariff-explanation/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { explainTariff } from '@/services/ai-service';
import { createLogger } from '@/utils/logger';

const logger = createLogger('tariff-explanation-api');

export async function GET(request: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const countryId = searchParams.get('countryId');
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Query parameter "productId" is required' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createClient();
    
    // Fetch product information
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
      
    if (productError) {
      logger.error('Error fetching product:', productError);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Fetch country information if provided
    let country = null;
    if (countryId) {
      const { data: countryData, error: countryError } = await supabase
        .from('countries')
        .select('*')
        .eq('id', countryId)
        .single();
        
      if (!countryError) {
        country = countryData;
      }
    }
    
    // Fetch tariff rate information
    let rate = null;
    if (countryId) {
      const { data: rateData, error: rateError } = await supabase
        .from('tariff_rates')
        .select('*')
        .eq('product_id', productId)
        .eq('country_id', countryId)
        .order('effective_date', { ascending: false })
        .limit(1)
        .single();
        
      if (!rateError) {
        rate = rateData;
      }
    }
    
    // Generate explanation using AI service
    const explanation = await explainTariff(product, country, rate || product);
    
    // Return the explanation
    return NextResponse.json({
      product,
      country,
      rate,
      explanation
    });
  } catch (error) {
    logger.error('Error generating tariff explanation:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate tariff explanation' },
      { status: 500 }
    );
  }
}