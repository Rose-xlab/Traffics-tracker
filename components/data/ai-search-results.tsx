// components/data/ai-search-results.tsx
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";

interface AISearchResultsProps {
  results: any[];
  aiSuggestions: any[];
  enhancedQuery: string;
  loading: boolean;
  onProductSelect?: (product: any) => void;
}

export function AISearchResults({
  results,
  aiSuggestions,
  enhancedQuery,
  loading,
  onProductSelect,
}: AISearchResultsProps) {
  const [showAIExplanations, setShowAIExplanations] = useState(false);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <p>AI is analyzing your search...</p>
        </div>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground mb-4">No products found matching your search.</p>
        {aiSuggestions.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">AI Suggestions:</h3>
            <ul className="space-y-2">
              {aiSuggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <Sparkles className="h-4 w-4 text-primary mr-2 mt-1 shrink-0" />
                  <span>{suggestion.htsCode} - {suggestion.reasoning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {enhancedQuery && enhancedQuery !== "" && (
        <Card className="p-4 bg-muted/50">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="text-sm">
              AI enhanced your search to: <span className="font-medium">{enhancedQuery}</span>
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setShowAIExplanations(!showAIExplanations)}
            >
              {showAIExplanations ? "Hide AI Details" : "Show AI Details"}
            </Button>
          </div>
        </Card>
      )}

      {showAIExplanations && aiSuggestions.length > 0 && (
        <Card className="p-4 border-primary/20">
          <h3 className="text-sm font-medium mb-2 flex items-center">
            <Sparkles className="h-4 w-4 text-primary mr-2" />
            AI Suggested HTS Classifications
          </h3>
          <Accordion type="single" collapsible className="w-full">
            {aiSuggestions.map((suggestion, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-sm">
                  {suggestion.htsCode}
                  <Badge className="ml-2" variant={getConfidenceBadgeVariant(suggestion.confidence)}>
                    {suggestion.confidence}
                  </Badge>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      )}

      <div className="space-y-4">
        {results.map((product) => (
          <Card
            key={product.id}
            className="p-4 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => onProductSelect && onProductSelect(product)}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-medium">{product.name}</h3>
                  {product.aiMatch && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Sparkles className="h-4 w-4 text-primary inline-block" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            AI matched: {product.aiMatch.reasoning}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                    HTS: {product.hts_code}
                  </span>
                  {product.base_rate && (
                    <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                      Base Rate: {product.base_rate}%
                    </span>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/product/${product.id}`}>View Details</Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function getConfidenceBadgeVariant(confidence: string) {
  switch (confidence.toLowerCase()) {
    case 'high':
      return 'default';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'outline';
    default:
      return 'secondary';
  }
}