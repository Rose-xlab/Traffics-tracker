"use client";

import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";
import type { RelatedProduct } from "@/types";

interface RelatedProductsProps {
  products: RelatedProduct[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Package className="h-5 w-5" />
        Related Products
      </h2>
      <div className="space-y-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="block p-4 rounded-lg border hover:border-primary transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium">{product.name}</h3>
              <span className="text-xs bg-secondary px-2 py-1 rounded">
                {product.similarity}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              HTS: {product.htsCode}
            </p>
            <p className="text-sm">Rate: {product.rate}</p>
          </Link>
        ))}
      </div>
    </Card>
  );
}