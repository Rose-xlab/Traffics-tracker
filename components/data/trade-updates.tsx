"use client";

import { UpdateCard } from "@/components/data/update-card";
import type { TradeUpdate } from "@/types/api";

interface TradeUpdatesProps {
  updates: TradeUpdate[];
  loading?: boolean;
}

export function TradeUpdates({ updates, loading }: TradeUpdatesProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-32 bg-muted animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No updates available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {updates.map((update, index) => (
        <UpdateCard key={index} update={update} />
      ))}
    </div>
  );
}