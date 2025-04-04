// components/error-boundary.tsx
"use client";

import { Component, ReactNode, ErrorInfo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { ErrorHandler } from "@/lib/utils/error-handler";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnChange?: any;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to the error handler service
    ErrorHandler.handle(error, "ErrorBoundary");

    // Call custom onError if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({ errorInfo });
  }

  public componentDidUpdate(prevProps: Props) {
    // If resetOnChange prop changes, reset the error state
    if (this.state.hasError && this.props.resetOnChange !== prevProps.resetOnChange) {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
      });
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  public render() {
    const { hasError, error, errorInfo } = this.state;

    if (hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="p-6 max-w-2xl mx-auto my-8">
          <div className="flex items-center gap-2 text-destructive mb-4">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Something went wrong</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            {error?.message || "An unexpected error occurred"}
          </p>
          
          {process.env.NODE_ENV !== 'production' && errorInfo && (
            <div className="my-4 p-3 bg-muted rounded-md overflow-auto text-xs">
              <details>
                <summary className="cursor-pointer font-medium mb-2">Error Details</summary>
                <pre className="whitespace-pre-wrap">{error?.stack}</pre>
                <pre className="whitespace-pre-wrap mt-2">{errorInfo.componentStack}</pre>
              </details>
            </div>
          )}
          
          <div className="flex gap-4">
            <Button onClick={this.handleRetry} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            <Button variant="outline" asChild>
              <Link href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go to homepage
              </Link>
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}