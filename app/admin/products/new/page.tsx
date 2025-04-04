// app/admin/products/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { useToast } from "@/hooks/use-toast";
import { ApiClient } from "@/lib/utils/api-client";

export default function NewProductPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        // In a real implementation, this would call the API
        // const data = await ApiClient.get<string[]>('/api/admin/categories');
        
        // Mock data for now
        const mockCategories = ["Electronics", "Textiles", "Chemicals", "Metals", "Food"];
        setCategories(mockCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, [toast]);

  // Handle form submission
  const handleSubmit = async (data: any) => {
    try {
      // In a real implementation, this would call the API
      // await ApiClient.post('/api/admin/products', data);
      
      // For mock purposes, just wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to products list
      router.push("/admin/products");
    } catch (error) {
      console.error("Error creating product:", error);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/products">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Add New Product</h1>
        </div>
      </div>

      <ProductForm
        onSubmit={handleSubmit}
        categories={categories}
      />
    </div>
  );
}