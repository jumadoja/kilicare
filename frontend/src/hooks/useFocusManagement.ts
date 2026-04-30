'use client';

import { useEffect, useRef, useCallback } from 'react';

interface FocusManagementOptions {
  autoFocusSelector?: string;
  restoreOnMount?: boolean;
  enableFocusOnError?: boolean;
  errorSelector?: string;
}

interface FocusManagementReturn {
  saveFocus: () => void;
  restoreFocus: () => void;
  focusOnError: () => void;
  trapFocus: (container: HTMLElement) => (() => void) | undefined;
  containerRef: React.MutableRefObject<HTMLElement | null>;
}

export function useFocusManagement({
  autoFocusSelector = 'input:not([disabled]), textarea:not([disabled]), button:not([disabled])',
  restoreOnMount = true,
  enableFocusOnError = false,
  errorSelector = '[aria-invalid="true"]',
}: FocusManagementOptions = {}): FocusManagementReturn {
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  // Auto-focus first input on mount
  useEffect(() => {
    if (restoreOnMount && typeof document !== 'undefined') {
      // Small delay to ensure DOM is ready
      const timeout = setTimeout(() => {
        const firstInput = document.querySelector(autoFocusSelector) as HTMLElement;
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);

      return () => clearTimeout(timeout);
    }
  }, [autoFocusSelector, restoreOnMount]);

  // Save previous focused element before navigation
  const saveFocus = useCallback(() => {
    if (typeof document !== 'undefined') {
      previousFocusedElementRef.current = document.activeElement as HTMLElement;
    }
  }, []);

  // Restore focus after navigation
  const restoreFocus = useCallback(() => {
    if (previousFocusedElementRef.current && typeof document !== 'undefined') {
      const element = previousFocusedElementRef.current;
      // Check if element is still in DOM
      if (document.contains(element)) {
        element.focus();
      } else {
        // Fallback to first input if previous element is gone
        const firstInput = document.querySelector(autoFocusSelector) as HTMLElement;
        if (firstInput) {
          firstInput.focus();
        }
      }
    }
  }, [autoFocusSelector]);

  // Move focus to first error field
  const focusOnError = useCallback(() => {
    if (enableFocusOnError && typeof document !== 'undefined') {
      const firstError = document.querySelector(errorSelector) as HTMLElement;
      if (firstError) {
        firstError.focus();
        // Scroll into view if needed
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [enableFocusOnError, errorSelector]);

  // Focus trap for modals/dialogs
  const trapFocus = useCallback((container: HTMLElement) => {
    if (typeof document === 'undefined') return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      }
      if (e.key === 'Escape') {
        // Optionally close modal on escape
        // This should be handled by the modal component
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstFocusable?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return {
    saveFocus,
    restoreFocus,
    focusOnError,
    trapFocus,
    containerRef,
  };
}
