'use client';

import { useEffect, useState, useRef } from 'react';

interface FormPersistenceOptions<T> {
  formKey: string;
  initialValues: T;
  storageType?: 'localStorage' | 'sessionStorage';
  clearOnSuccess?: boolean;
  onRestore?: (data: T) => void;
}

export function useFormPersistence<T extends Record<string, any>>({
  formKey,
  initialValues,
  storageType = 'sessionStorage',
  clearOnSuccess = true,
  onRestore,
}: FormPersistenceOptions<T>) {
  const [isRestored, setIsRestored] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const getStorage = () => {
    if (typeof window === 'undefined') return null;
    try {
      return storageType === 'localStorage' ? window.localStorage : window.sessionStorage;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const storage = getStorage();
    if (!storage) {
      setIsRestored(true);
      return;
    }

    try {
      const saved = storage.getItem(`form_${formKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const { _timestamp, ...formData } = parsed;
        
        // Check if saved data is expired (1 hour)
        const ONE_HOUR = 60 * 60 * 1000;
        if (_timestamp && Date.now() - _timestamp > ONE_HOUR) {
          try {
            storage.removeItem(`form_${formKey}`);
          } catch (e) {
            // Silent fail
          }
          setIsRestored(true);
          return;
        }
        
        onRestore?.(formData);
      }
    } catch (error) {
      // Silent fail
    } finally {
      setIsRestored(true);
    }
  }, [formKey, onRestore]);

  const saveFormState = (data: T) => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer with 600ms debounce
    debounceTimerRef.current = setTimeout(() => {
      const storage = getStorage();
      if (!storage) return;

      try {
        const toSave = { ...data, _timestamp: Date.now() };
        storage.setItem(`form_${formKey}`, JSON.stringify(toSave));
      } catch (error) {
        // Silent fail
      }
    }, 600);
  };

  const clearFormState = () => {
    const storage = getStorage();
    if (!storage) return;
    
    try {
      storage.removeItem(`form_${formKey}`);
    } catch (error) {
      // Silent fail
    }
  };

  const handleSuccess = () => {
    if (clearOnSuccess) {
      clearFormState();
    }
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    isRestored,
    saveFormState,
    clearFormState,
    handleSuccess,
  };
}
