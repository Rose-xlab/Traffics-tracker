"use client";

import { ErrorBoundary } from "@/components/error-boundary";

interface ErrorBoundaryProviderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ErrorBoundaryProvider({
  children,
  fallback,
}: ErrorBoundaryProviderProps) {
  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}