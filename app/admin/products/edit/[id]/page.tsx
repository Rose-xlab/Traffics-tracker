// app/admin/products/edit/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { AlertCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { useToast } from "@/hooks/use-toast";
import { ApiClient } from "@/lib/utils/api-client";
import type { Product } from "@/types";

export default function EditProductPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const productId = params.id as string;

  // Fetch product and categories
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // In a real implementation, this would fetch from the API
        // const productData = await ApiClient.get<Product>(`/api/admin/products/${productId}`);
        // const categoriesData = await ApiClient.get<string[]>('/api/admin/categories');
        
        // Mock data for now
        const mockCategories = ["Electronics", "Textiles", "Chemicals", "Metals", "Food"];
        
        // Mock product data
        const mockProduct: Product = {
          id: productId,
          name: "Sample Product",
          description: "A detailed description of the sample product",
          htsCode: "8471.30.0100",
          category: "Electronics",
          baseRate: 2.5,
          totalRate: 7.5,
          additionalRates: [
            {
              type: "Section 301",
              rate: 5,
              description: "China tariff",
              effectiveDate: "2023-01-01"
            }
          ],
          exclusions: [],
          rulings: [],
          effectiveDates: [],
          lastUpdated: new Date().toISOString(),
          complianceRequirements: [],
          historicalRates: [],
          relatedProducts: [],
        };
        
        setProduct(mockProduct);
        setCategories(mockCategories);
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("Failed to load product");
        toast({
          title: "Error",
          description: "Failed to load product data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [productId, toast]);

  // Handle form submission
  const handleSubmit = async (data: any) => {
    try {
      // In a real implementation, this would call the API
      // await ApiClient.put(`/api/admin/products/${productId}`, data);
      
      // For mock purposes, just wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to products list
      router.push("/admin/products");
    } catch (error) {
      console.error("Error updating product:", error);
      throw error; // Let the form component handle the error
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" disabled>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/products">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Edit Product</h1>
        </div>
        
        <Card className="p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <p className="text-muted-foreground mb-4">
            {error || "The product you're trying to edit doesn't exist or has been removed."}
          </p>
          <Button asChild>
            <Link href="/admin/products">Back to Products</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/products">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Edit Product</h1>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/product/${product.id}`} target="_blank">
            View on Site
          </Link>
        </Button>
      </div>

      <ProductForm
        product={product}
        onSubmit={handleSubmit}
        categories={categories}
      />
    </div>
  );
}