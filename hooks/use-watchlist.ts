'use client';

import { useState, useEffect } from 'react';
import { getWatchlist, addToWatchlist, removeFromWatchlist, updateWatchlistNotifications } from '@/lib/api/watchlist';
import { useAuth } from '@/hooks/use-auth';

export function useWatchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWatchlist();
    } else {
      setWatchlist([]);
      setLoading(false);
    }
  }, [user]);

  async function loadWatchlist() {
    try {
      setLoading(true);
      const data = await getWatchlist();
      setWatchlist(data);
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addItem(productId: string, countryId: string, notifyChanges: boolean = true) {
    try {
      const item = await addToWatchlist(productId, countryId, notifyChanges);
      setWatchlist((prev) => [...prev, item]);
      return item;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  }

  async function removeItem(id: string) {
    try {
      await removeFromWatchlist(id);
      setWatchlist((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  }

  async function updateNotifications(id: string, notifyChanges: boolean) {
    try {
      const updated = await updateWatchlistNotifications(id, notifyChanges);
      setWatchlist((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
      return updated;
    } catch (error) {
      console.error('Error updating watchlist notifications:', error);
      throw error;
    }
  }

  return {
    watchlist,
    loading,
    addItem,
    removeItem,
    updateNotifications,
  };
}