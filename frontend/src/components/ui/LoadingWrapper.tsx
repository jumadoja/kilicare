'use client';

import { ReactNode } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface LoadingWrapperProps {
  isLoading: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
}

/**
 * Standardized loading wrapper component
 * Provides consistent loading states across the application
 */
export function LoadingWrapper({
  isLoading,
  children,
  fallback,
  size = 'md',
  text,
  fullScreen = false,
}: LoadingWrapperProps) {
  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <LoadingSpinner size={size} text={text} fullScreen={fullScreen} />;
  }

  return <>{children}</>;
}
