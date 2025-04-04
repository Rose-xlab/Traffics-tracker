import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Package, ArrowRight } from 'lucide-react';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  showDetails?: boolean;
}

export function ProductCard({ product, showDetails = true }: ProductCardProps) {
  return (
    <Card className="overflow-hidden">
      {product.image && (
        <div
          className="h-48 bg-cover bg-center"
          style={{ backgroundImage: `url(${product.image})` }}
        />
      )}
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
        <p className="text-muted-foreground mb-4">{product.description}</p>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">HTS Code:</span>
            <span className="text-sm font-medium">{product.htsCode}</span>
          </div>
          {showDetails && (
            <>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Base Rate:</span>
                <span className="text-sm font-medium">{product.details.china.baseRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Section 301:</span>
                <span className="text-sm font-medium">{product.details.china.section301}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Rate:</span>
                <span className="text-sm font-bold">{product.details.china.totalRate}</span>
              </div>
            </>
          )}
        </div>
        <div className="mt-4">
          <Link
            href={`/product/${product.id}`}
            className="text-primary hover:text-primary/80 font-medium flex items-center gap-2"
          >
            View Details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
}