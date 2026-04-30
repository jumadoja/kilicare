'use client';

import { useEffect, useState } from 'react';

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
  
  const getStorage = () => {
    if (typeof window === 'undefined') return null;
    try {
      return storageType === 'localStorage' ? window.localStorage : window.sessionStorage;
    } catch (e) {
      console.error('[useFormPersistence] Failed to access storage:', e);
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
            console.error('[useFormPersistence] Failed to remove expired form state:', e);
          }
          setIsRestored(true);
          return;
        }
        
        onRestore?.(formData);
      }
    } catch (error) {
      console.error(`[useFormPersistence] Failed to restore form state for ${formKey}:`, error);
    } finally {
      setIsRestored(true);
    }
  }, [formKey, onRestore]);

  const saveFormState = (data: T) => {
    const storage = getStorage();
    if (!storage) return;
    
    try {
      const toSave = { ...data, _timestamp: Date.now() };
      storage.setItem(`form_${formKey}`, JSON.stringify(toSave));
    } catch (error) {
      console.error(`[useFormPersistence] Failed to save form state for ${formKey}:`, error);
    }
  };

  const clearFormState = () => {
    const storage = getStorage();
    if (!storage) return;
    
    try {
      storage.removeItem(`form_${formKey}`);
    } catch (error) {
      console.error(`[useFormPersistence] Failed to clear form state for ${formKey}:`, error);
    }
  };

  const handleSuccess = () => {
    if (clearOnSuccess) {
      clearFormState();
    }
  };

  return {
    isRestored,
    saveFormState,
    clearFormState,
    handleSuccess,
  };
}
