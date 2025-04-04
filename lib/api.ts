import { Product, TariffRate } from "@/types";

export async function fetchProduct(id: string): Promise<Product | null> {
  try {
    const response = await fetch(`/api/products/${id}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function fetchTariffData(productId: string, countryId: string): Promise<TariffRate | null> {
  try {
    const response = await fetch(`/api/tariffs/${productId}/${countryId}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Error fetching tariff data:', error);
    return null;
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    return response.json();
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}