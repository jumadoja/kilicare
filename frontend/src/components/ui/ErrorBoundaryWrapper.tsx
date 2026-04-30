'use client';
import React from 'react';
import { KiliButton } from './KiliButton';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service in production
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Integrate with error tracking service (Sentry, LogRocket, etc.)
      // Example with Sentry:
      // Sentry.captureException(error, {
      //   contexts: { react: { componentStack: errorInfo.componentStack } }
      // });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div 
          role="alert"
          aria-live="assertive"
          className="flex flex-col items-center justify-center p-8 text-center min-h-[200px]"
        >
          <span className="text-4xl mb-4" aria-hidden="true">⚠️</span>
          <h3 className="font-bold font-display text-text-primary text-base mb-2">
            Hitilafu imetokea
          </h3>
          <p className="text-text-muted text-sm font-body mb-4 max-w-xs">
            {this.state.error?.message || 'Kuna tatizo. Jaribu tena.'}
          </p>
          <div className="flex gap-3">
            <KiliButton
              variant="secondary"
              size="sm"
              onClick={this.handleReset}
              aria-label="Try again"
            >
              Jaribu Tena
            </KiliButton>
            <KiliButton
              variant="primary"
              size="sm"
              onClick={this.handleReload}
              aria-label="Reload page"
            >
              Reload Page
            </KiliButton>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details className="mt-4 text-left text-xs text-text-muted max-w-md">
              <summary className="cursor-pointer hover:text-text-primary mb-2">
                Error Details (Development Only)
              </summary>
              <pre className="bg-dark-elevated p-2 rounded overflow-auto max-h-40">
                {this.state.error?.toString()}
                {'\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}