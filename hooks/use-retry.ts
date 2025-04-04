"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

export function useRetry(options: RetryOptions = {}) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
  } = options;

  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const executeWithRetry = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      let delay = initialDelay;

      try {
        setLoading(true);
        return await fn();
      } catch (error) {
        if (attempts >= maxAttempts - 1) {
          throw error;
        }

        const nextDelay = Math.min(delay * backoffFactor, maxDelay);
        
        toast({
          title: "Retrying...",
          description: `Attempt ${attempts + 1} of ${maxAttempts}`,
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        setAttempts(prev => prev + 1);
        delay = nextDelay;

        return executeWithRetry(fn);
      } finally {
        setLoading(false);
      }
    },
    [attempts, maxAttempts, initialDelay, maxDelay, backoffFactor, toast]
  );

  const reset = useCallback(() => {
    setAttempts(0);
  }, []);

  return {
    executeWithRetry,
    attempts,
    loading,
    reset,
  };
}