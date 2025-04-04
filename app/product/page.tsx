"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Package, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearch } from "@/hooks/use-search";
import { LoadingState } from "@/components/data/loading-state";
import { EmptyState } from "@/components/data/empty-state";
import { ProductCard } from "@/components/data/product-card";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { analyticsService } from "@/lib/services/analytics-service";
import type { Product } from "@/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { search } = useSearch();
  const [contentRef, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (isVisible) {
      analyticsService.trackEvent("view_product_list", {
        count: products.length,
      });
    }
  }, [isVisible, products.length]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const results = await search({});
      setProducts(results.products);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
            <Package className="h-8 w-8" />
            Popular Products
          </h1>
          <p className="text-lg text-muted-foreground">
            Browse commonly imported products and their current tariff rates
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <LoadingState key={i} />
          ))}
        </div>
      </main>
    );
  }

  if (!products.length) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="No Products Found"
          description="There are no products available at the moment."
        />
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8" ref={contentRef}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
          <Package className="h-8 w-8" />
          Popular Products
        </h1>
        <p className="text-lg text-muted-foreground">
          Browse commonly imported products and their current tariff rates
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {products.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No products found</p>
        </Card>
      )}
    </main>
  );
}