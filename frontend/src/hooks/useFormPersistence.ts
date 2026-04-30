'use client';

import { useEffect, useState } from 'react';

interface FormPersistenceOptions<T> {
  formKey: string;
  initialValues: T;
  storageType?: 'localStorage' | 'sessionStorage';
  clearOnSuccess?: boolean;
}

export function useFormPersistence<T extends Record<string, any>>({
  formKey,
  initialValues,
  storageType = 'sessionStorage',
  clearOnSuccess = true,
}: FormPersistenceOptions<T>) {
  const [isRestored, setIsRestored] = useState(false);
  const storage = storageType === 'localStorage' ? localStorage : sessionStorage;

  // Load saved form state on mount
  useEffect(() => {
    try {
      const saved = storage.getItem(`form_${formKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore if it's from the same session (within 1 hour)
        const timestamp = parsed._timestamp;
        const oneHour = 60 * 60 * 1000;
        
        if (timestamp && Date.now() - timestamp < oneHour) {
          const { _timestamp, ...formData } = parsed;
          return formData;
        } else {
          // Clear expired data
          storage.removeItem(`form_${formKey}`);
        }
      }
    } catch (error) {
      console.error('[FormPersistence] Failed to restore form state:', error);
      storage.removeItem(`form_${formKey}`);
    }
    finally {
      setIsRestored(true);
    }
    return initialValues;
  }, [formKey, initialValues, storage]);

  // Save form state on change
  const saveFormState = (data: T) => {
    try {
      const toSave = {
        ...data,
        _timestamp: Date.now(),
      };
      storage.setItem(`form_${formKey}`, JSON.stringify(toSave));
    } catch (error) {
      console.error('[FormPersistence] Failed to save form state:', error);
    }
  };

  // Clear form state (call on successful submission)
  const clearFormState = () => {
    try {
      storage.removeItem(`form_${formKey}`);
    } catch (error) {
      console.error('[FormPersistence] Failed to clear form state:', error);
    }
  };

  // Auto-clear on success if enabled
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
