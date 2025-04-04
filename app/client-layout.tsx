"use client";

import React from 'react';
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorHandler } from "@/lib/utils/error-handler";

export default function ClientLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  // Handle global unhandled errors
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    ErrorHandler.handle(error, {
      context: 'GlobalErrorBoundary',
      severity: 'high',
      metadata: {
        component: errorInfo.componentStack,
      }
    });
  };

  return (
    <ErrorBoundary onError={handleError}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            {/* Apply error boundaries to the main content */}
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          <Footer />
        </div>
        <Toaster />
      </ThemeProvider>
    </ErrorBoundary>
  );
}