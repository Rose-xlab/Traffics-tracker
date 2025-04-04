// app/api/products/[id]/route.ts
import { createClient } from '@/lib/supabase/server';
import { ApiResponse } from '@/lib/utils/api-response';
import { ErrorHandler } from '@/lib/utils/error-handler';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        compliance_requirements (*),
        tariff_rates (
          *,
          countries (*)
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) throw error;
    if (!data) {
      return ApiResponse.notFound(`Product with ID ${params.id} not found`);
    }

    // Track successful API request in metadata
    return ApiResponse.success(data, {
      endpoint: `/api/products/${params.id}`,
      method: 'GET'
    });
  } catch (error) {
    // Log the error
    ErrorHandler.handle(error, {
      context: 'ProductsApi',
      metadata: { productId: params.id }
    });

    // Return standardized error response
    return ApiResponse.error(error);
  }
}