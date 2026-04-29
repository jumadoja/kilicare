'use client';
import React from 'react';
import { KiliButton } from './KiliButton';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
          <span className="text-4xl mb-4">⚠️</span>
          <h3 className="font-bold font-display text-text-primary text-base mb-2">
            Hitilafu imetokea
          </h3>
          <p className="text-text-muted text-sm font-body mb-4 max-w-xs">
            {this.state.error?.message || 'Kuna tatizo. Jaribu tena.'}
          </p>
          <KiliButton
            variant="secondary"
            size="sm"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Jaribu Tena
          </KiliButton>
        </div>
      );
    }

    return this.props.children;
  }
}