"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { WatchlistCard } from "@/components/data/watchlist-card";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useToast } from "@/hooks/use-toast";
import type { WatchlistItem } from "@/types/api";

export default function WatchlistPage() {
  const { watchlist, loading, removeItem, updateNotifications } = useWatchlist();
  const { toast } = useToast();

  const handleRemove = async (id: string) => {
    try {
      await removeItem(id);
      toast({
        title: "Success",
        description: "Item removed from watchlist",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  const handleToggleNotifications = async (id: string, value: boolean) => {
    try {
      await updateNotifications(id, value);
      toast({
        title: "Success",
        description: `Notifications ${value ? "enabled" : "disabled"}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notifications",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-6">Loading watchlist...</Card>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Watchlist</h1>
      {watchlist.length === 0 ? (
        <Card className="p-6">
          <p className="text-muted-foreground">Your watchlist is empty</p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {watchlist.map((item: WatchlistItem) => (
            <WatchlistCard
              key={item.id}
              item={item}
              onRemove={handleRemove}
              onToggleNotifications={handleToggleNotifications}
            />
          ))}
        </div>
      )}
    </main>
  );
}