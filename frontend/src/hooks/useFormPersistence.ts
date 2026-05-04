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
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFreshStart, setIsFreshStart] = useState(true);
  const [isRestored, setIsRestored] = useState(false);
  
  const getStorage = () => {
    if (typeof window === 'undefined') return null;
    try {
      return storageType === 'localStorage' ? window.localStorage : window.sessionStorage;
    } catch (e) {
      return null;
    }
  };

  // NO AUTO-RESTORATION - Controlled restore only
  // useEffect for auto-restore removed to prevent unwanted auto-fill

  const restoreDraft = () => {
    const storage = getStorage();
    if (!storage) {
      setIsRestored(true);
      return false;
    }

    setIsRestoring(true);
    
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
          setIsRestoring(false);
          return false;
        }
        
        // Only restore if not submitted and fresh start is allowed
        if (!isSubmitted && onRestore) {
          onRestore(formData);
          setIsFreshStart(false);
        }
        
        setIsRestored(true);
        setIsRestoring(false);
        return true;
      }
    } catch (error) {
      // Silent fail
    } finally {
      setIsRestored(true);
      setIsRestoring(false);
    }
    
    return false;
  };

  const saveFormState = (data: T) => {
    const storage = getStorage();
    if (!storage) return;

    try {
      const toSave = { ...data, _timestamp: Date.now() };
      storage.setItem(`form_${formKey}`, JSON.stringify(toSave));
    } catch (error) {
      // Silent fail
    }
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
    setIsSubmitted(true);
    setIsFreshStart(true);
  };

  const startFreshSession = () => {
    clearFormState();
    setIsSubmitted(false);
    setIsFreshStart(true);
    setIsRestored(false);
  };

  return {
    isRestored,
    isRestoring,
    isSubmitted,
    isFreshStart,
    saveFormState,
    clearFormState,
    handleSuccess,
    restoreDraft,
    startFreshSession,
  };
}
