'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface FormEngineOptions<T> {
  formKey: string;
  initialValues: T;
  onStateChange?: (state: T) => void;
  onSubmit?: (data: T) => Promise<void>;
}

interface FormEngineState<T> {
  data: T;
  isDirty: boolean;
  isSubmitting: boolean;
  hasActiveDraft: boolean;
  lastSaved: number | null;
}

export function useFormEngine<T extends Record<string, any>>({
  formKey,
  initialValues,
  onStateChange,
  onSubmit,
}: FormEngineOptions<T>) {
  const [state, setState] = useState<FormEngineState<T>>({
    data: initialValues,
    isDirty: false,
    isSubmitting: false,
    hasActiveDraft: false,
    lastSaved: null,
  });

  const isInitialized = useRef(false);
  const hasRestoredDraft = useRef(false);

  // Storage access - ENGINE ONLY
  const getStorage = useCallback(() => {
    if (typeof window === 'undefined') return null;
    try {
      return window.sessionStorage;
    } catch (e) {
      return null;
    }
  }, []);

  // Check if this is a page refresh (not initial load)
  const isPageRefresh = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    // Check navigation type for refresh detection
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0) {
      const navigationType = navigationEntries[0]?.type;
      return navigationType === 'reload' || navigationType === 'back_forward';
    }
    
    // Fallback: check if we have existing session data
    const storage = getStorage();
    if (storage) {
      const hasSession = storage.getItem(`session_${formKey}`);
      return !!hasSession;
    }
    
    return false;
  }, [formKey, getStorage]);

  // Smart restore logic - ONLY on refresh/session resume
  const loadDraft = useCallback(() => {
    const storage = getStorage();
    if (!storage) return false;

    try {
      const saved = storage.getItem(`form_${formKey}`);
      const sessionMarker = storage.getItem(`session_${formKey}`);
      
      if (saved && sessionMarker && isPageRefresh() && !hasRestoredDraft.current) {
        const parsed = JSON.parse(saved);
        const { _timestamp, ...formData } = parsed;
        
        // Check if saved data is expired (1 hour)
        const ONE_HOUR = 60 * 60 * 1000;
        if (_timestamp && Date.now() - _timestamp > ONE_HOUR) {
          storage.removeItem(`form_${formKey}`);
          storage.removeItem(`session_${formKey}`);
          return false;
        }
        
        hasRestoredDraft.current = true;
        return formData;
      }
    } catch (error) {
      // Silent fail
    }
    
    return false;
  }, [formKey, getStorage, isPageRefresh]);

  // Update single field
  const updateField = useCallback((field: keyof T, value: T[keyof T]) => {
    setState(prev => {
      const newData = { ...prev.data, [field]: value };
      const newState = {
        ...prev,
        data: newData,
        isDirty: true,
      };
      
      onStateChange?.(newData);
      return newState;
    });
  }, [onStateChange]);

  // Update multiple fields
  const updateFields = useCallback((updates: Partial<T>) => {
    setState(prev => {
      const newData = { ...prev.data, ...updates };
      const newState = {
        ...prev,
        data: newData,
        isDirty: true,
      };
      
      onStateChange?.(newData);
      return newState;
    });
  }, [onStateChange]);

  // Save draft to cache
  const saveDraft = useCallback(() => {
    const storage = getStorage();
    if (!storage || !state.isDirty) return;

    try {
      const toSave = { ...state.data, _timestamp: Date.now() };
      storage.setItem(`form_${formKey}`, JSON.stringify(toSave));
      storage.setItem(`session_${formKey}`, 'active');
      
      setState(prev => ({
        ...prev,
        hasActiveDraft: true,
        lastSaved: Date.now(),
      }));
    } catch (error) {
      // Silent fail
    }
  }, [formKey, getStorage, state.data, state.isDirty]);

  // Clear draft
  const clearDraft = useCallback(() => {
    const storage = getStorage();
    if (!storage) return;

    try {
      storage.removeItem(`form_${formKey}`);
      storage.removeItem(`session_${formKey}`);
      
      setState(prev => ({
        ...prev,
        hasActiveDraft: false,
        lastSaved: null,
        isDirty: false,
      }));
      
      hasRestoredDraft.current = false;
    } catch (error) {
      // Silent fail
    }
  }, [formKey, getStorage]);

  // Submit form
  const submit = useCallback(async () => {
    if (!onSubmit || state.isSubmitting) return;

    setState(prev => ({ ...prev, isSubmitting: true }));

    try {
      await onSubmit(state.data);
      
      // Clear draft on successful submit
      clearDraft();
      
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        isDirty: false,
      }));
    } catch (error) {
      setState(prev => ({ ...prev, isSubmitting: false }));
      throw error;
    }
  }, [onSubmit, state.data, state.isSubmitting, clearDraft]);

  // Reset to initial values
  const reset = useCallback(() => {
    setState({
      data: initialValues,
      isDirty: false,
      isSubmitting: false,
      hasActiveDraft: false,
      lastSaved: null,
    });
    
    hasRestoredDraft.current = false;
  }, [initialValues]);

  // Initialize engine
  useEffect(() => {
    if (isInitialized.current) return;
    
    isInitialized.current = true;
    
    // Mark session as active
    const storage = getStorage();
    if (storage) {
      storage.setItem(`session_${formKey}`, 'active');
    }
    
    // Check for active draft on refresh
    const draftData = loadDraft();
    if (draftData) {
      setState(prev => ({
        ...prev,
        data: draftData,
        hasActiveDraft: true,
      }));
      
      onStateChange?.(draftData);
    }
  }, [formKey, getStorage, loadDraft, onStateChange]);

  // Auto-save draft periodically (debounced)
  useEffect(() => {
    if (!state.isDirty) return;
    
    const timer = setTimeout(() => {
      saveDraft();
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [state.data, saveDraft]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't clear session on unmount (allow resume)
      const storage = getStorage();
      if (storage && state.isDirty) {
        saveDraft(); // Final save
      }
    };
  }, [getStorage, state.isDirty, saveDraft]);

  return {
    // State
    data: state.data,
    isDirty: state.isDirty,
    isSubmitting: state.isSubmitting,
    hasActiveDraft: state.hasActiveDraft,
    lastSaved: state.lastSaved,
    
    // Actions
    updateField,
    updateFields,
    saveDraft,
    loadDraft,
    clearDraft,
    submit,
    reset,
  };
}
