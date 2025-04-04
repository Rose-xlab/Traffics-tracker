"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { Package, ArrowRight, AlertTriangle, Sparkles } from "lucide-react";
import { TariffCalculator } from "@/components/data/tariff-calculator";
import { HistoricalRates } from "@/components/data/historical-rates";
import { ComplianceRequirements } from "@/components/data/compliance-requirements";
import { RelatedProducts } from "@/components/data/related-products";
import { TariffExplanation } from "@/components/data/tariff-explanation";
import { LoadingState } from "@/components/data/loading-state";
import { ErrorState } from "@/components/data/error-state";
import { EmptyState } from "@/components/data/empty-state";
import { useToast } from "@/hooks/use-toast";
import { useRetry } from "@/hooks/use-retry";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { productService } from "@/lib/services/product-service";
import { ErrorHandler } from "@/lib/utils/error-handler";
import { ErrorBoundary } from "@/components/error-boundary";
import { ApiError } from "@/lib/utils/api-client";
import type { Product } from "@/types";

export default function ProductPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(
    searchParams.get("country")
  );
  const [loading, setLoading] = useState(true);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [explanation, setExplanation] = useState<any>(null);
  const [enableAI, setEnableAI] = useState(true);
  const { toast } = useToast();
  const { executeWithRetry } = useRetry();
  const [contentRef, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  useEffect(() => {
    loadProduct();
  }, [params.id]);

  useEffect(() => {
    if (product && enableAI) {
      loadTariffExplanation();
    }
  }, [product, selectedCountry, enableAI]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the retry utility to automatically retry the request
      const productData = await executeWithRetry(() =>
        productService.getProduct(params.id as string)
      );
      
      setProduct(productData);
    } catch (error) {
      // Set the error state to display in the UI
      setError(error instanceof Error ? error : new Error('Failed to load product'));
      
      // Show a toast only for non-404 errors (404s will be handled by the UI)
      if (!(error instanceof ApiError && error.status === 404)) {
        toast({
          title: "Error",
          description: "There was a problem loading the product details",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTariffExplanation = async () => {
    try {
      setExplanationLoading(true);
      
      // Build the API URL
      let url = `/api/tariff-explanation?productId=${params.id}`;
      if (selectedCountry) {
        url += `&countryId=${selectedCountry}`;
      }
      
      // Call the explanation API
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to load tariff explanation');
      }
      
      const data = await response.json();
      setExplanation(data.explanation);
    } catch (error) {
      console.error('Error loading tariff explanation:', error);
      // Don't show a toast for this - just fail silently
    } finally {
      setExplanationLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <LoadingState message="Loading product details..." />
      </main>
    );
  }

  // Render error state
  if (error) {
    // Special handling for 404 errors
    if (error instanceof ApiError && error.status === 404) {
      return (
        <main className="max-w-7xl mx-auto px-4 py-8">
          <EmptyState
            icon={<AlertTriangle className="h-8 w-8" />}
            title="Product Not Found"
            description="The product you're looking for doesn't exist or has been removed."
            actionLabel="Back to Products"
            actionHref="/product"
          />
        </main>
      );
    }
    
    // Generic error state with retry button
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <ErrorState
          title="Failed to Load Product"
          message="We couldn't load the product details. Please try again."
          onRetry={loadProduct}
        />
      </main>
    );
  }

  // Render empty state if no product was found
  if (!product) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <EmptyState
          icon={<AlertTriangle className="h-8 w-8" />}
          title="No Product Details"
          description="We couldn't find any details for this product."
          actionLabel="Back to Products"
          actionHref="/product"
        />
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8" ref={contentRef}>
      {/* Product Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Package className="h-8 w-8" />
              {product.name}
            </h1>
            <p className="text-lg text-muted-foreground mb-2">
              {product.description}
            </p>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="bg-secondary px-2 py-1 rounded">
                HTS: {product.htsCode}
              </span>
              <span className="bg-secondary px-2 py-1 rounded">
                Category: {product.category}
              </span>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/product" className="flex items-center gap-2">
              Back to Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* AI Features Toggle */}
      <div className="mb-6 flex items-center space-x-2">
        <Switch
          id="enable-ai"
          checked={enableAI}
          onCheckedChange={setEnableAI}
        />
        <label
          htmlFor="enable-ai"
          className="text-sm flex items-center cursor-pointer"
        >
          <Sparkles className="w-4 h-4 mr-1 text-primary" />
          Enable AI-powered explanations
        </label>
      </div>

      <div className="grid lg:grid-cols-[2fr,1fr] gap-8">
        <div className="space-y-6">
          {/* AI-powered Tariff Explanation */}
          {enableAI && (
            <ErrorBoundary
              fallback={
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Tariff Explanation
                  </h2>
                  <p className="text-muted-foreground">
                    Unable to load the AI explanation. Please try again later.
                  </p>
                </Card>
              }
            >
              <TariffExplanation
                product={product}
                country={selectedCountry ? { id: selectedCountry } : undefined}
                explanation={explanation || {
                  plainLanguage: "Loading explanation...",
                  costImpact: "Calculating cost impact...",
                }}
                loading={explanationLoading}
              />
            </ErrorBoundary>
          )}

          <ErrorBoundary
            fallback={
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-2">Tariff Calculator</h2>
                <p className="text-muted-foreground">
                  Unable to load the tariff calculator. Please try again later.
                </p>
              </Card>
            }
          >
            {/* Tariff Calculator */}
            <TariffCalculator
              baseRate={product.baseRate}
              additionalRates={product.additionalRates.map(rate => rate.rate)}
              onCountryChange={setSelectedCountry}
            />
          </ErrorBoundary>

          <ErrorBoundary
            fallback={
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-2">Historical Rates</h2>
                <p className="text-muted-foreground">
                  Unable to load historical rates. Please try again later.
                </p>
              </Card>
            }
          >
            {/* Historical Rates */}
            <HistoricalRates data={product.historicalRates} />
          </ErrorBoundary>

          <ErrorBoundary
            fallback={
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-2">Compliance Requirements</h2>
                <p className="text-muted-foreground">
                  Unable to load compliance requirements. Please try again later.
                </p>
              </Card>
            }
          >
            {/* Compliance Requirements */}
            <ComplianceRequirements requirements={product.complianceRequirements} />
          </ErrorBoundary>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ErrorBoundary
            fallback={
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-2">Related Products</h2>
                <p className="text-muted-foreground">
                  Unable to load related products. Please try again later.
                </p>
              </Card>
            }
          >
            {/* Related Products */}
            <RelatedProducts products={product.relatedProducts} />
          </ErrorBoundary>

          {/* Additional Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </h3>
                <p className="mt-1">
                  {new Date(product.lastUpdated).toLocaleDateString()}
                </p>
              </div>
              {product.exclusions && product.exclusions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Exclusions
                  </h3>
                  <ul className="mt-1 space-y-2">
                    {product.exclusions.map((exclusion, index) => (
                      <li key={index} className="text-sm">
                        {exclusion.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {product.rulings && product.rulings.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Recent Rulings
                  </h3>
                  <ul className="mt-1 space-y-2">
                    {product.rulings.map((ruling, index) => (
                      <li key={index} className="text-sm">
                        <a
                          href={ruling.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {ruling.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}