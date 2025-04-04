"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, DollarSign, Globe, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TariffExplanationProps {
  product: any;
  country?: any;
  explanation: {
    plainLanguage: string;
    costImpact: string;
    alternatives?: string;
    technicalDetails?: string;
  };
  loading?: boolean;
}

export function TariffExplanation({
  product,
  country,
  explanation,
  loading = false,
}: TariffExplanationProps) {
  const [activeTab, setActiveTab] = useState("plain");

  if (loading) {
    return (
      <Card className="p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold">Tariff Explanation</h3>
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold">Tariff Explained</h3>
        </div>
        <span className="text-xs bg-muted px-2 py-1 rounded">AI-Generated</span>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="plain" className="flex items-center space-x-1">
            <Sparkles className="h-4 w-4" />
            <span>Simple</span>
          </TabsTrigger>
          <TabsTrigger value="cost" className="flex items-center space-x-1">
            <DollarSign className="h-4 w-4" />
            <span>Cost Impact</span>
          </TabsTrigger>
          <TabsTrigger value="alternatives" className="flex items-center space-x-1">
            <Globe className="h-4 w-4" />
            <span>Alternatives</span>
          </TabsTrigger>
          <TabsTrigger value="technical" className="flex items-center space-x-1">
            <FileText className="h-4 w-4" />
            <span>Technical</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plain" className="space-y-4">
          <p>{explanation.plainLanguage}</p>
        </TabsContent>

        <TabsContent value="cost" className="space-y-4">
          <p>{explanation.costImpact}</p>
        </TabsContent>

        <TabsContent value="alternatives" className="space-y-4">
          {explanation.alternatives ? (
            <p>{explanation.alternatives}</p>
          ) : (
            <p className="text-muted-foreground">No alternative sourcing information available.</p>
          )}
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          {explanation.technicalDetails ? (
            <p className="text-sm font-mono">{explanation.technicalDetails}</p>
          ) : (
            <p className="text-muted-foreground">No technical details available.</p>
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-4 text-xs text-muted-foreground">
        <p>
          This explanation is AI-generated based on current tariff data and is provided for
          informational purposes only. For official guidance, please consult with a customs broker
          or trade compliance professional.
        </p>
      </div>
    </Card>
  );
}