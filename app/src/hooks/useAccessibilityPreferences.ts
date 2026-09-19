import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyPreferencePatch,
  getDefaultPreferences,
  loadPreferences,
  preferencesEqual,
  serializePreferences,
  STORAGE_KEY,
  type PreferencePatch,
} from '../features/accessibility-agent/core/preferences';
import type { AccessibilityPreferences } from '../types';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

const getLocalStorage = () => {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage; } catch { return null; }
};

export const useAccessibilityPreferences = () => {
  const initial = useRef<ReturnType<typeof loadPreferences> | null>(null);
  if (!initial.current) {
    initial.current = loadPreferences(getLocalStorage(), prefersReducedMotion());
  }

  const [preferences, setPreferences] = useState<AccessibilityPreferences>(initial.current.preferences);
  const [canUndo, setCanUndo] = useState(false);
  const [stateRevision, setStateRevision] = useState(0);
  const [storageAvailable, setStorageAvailable] = useState(initial.current.storageAvailable);
  const preferencesRef = useRef(preferences);
  const undoRef = useRef<AccessibilityPreferences | null>(null);
  const stateRevisionRef = useRef(0);

  const commit = useCallback((next: AccessibilityPreferences, keepUndo = true) => {
    const current = preferencesRef.current;
    if (preferencesEqual(current, next)) return false;
    if (keepUndo) undoRef.current = current;
    preferencesRef.current = next;
    stateRevisionRef.current += 1;
    setPreferences(next);
    setCanUndo(undoRef.current !== null);
    setStateRevision(stateRevisionRef.current);
    return true;
  }, []);

  const applyPreferences = useCallback((patch: PreferencePatch) => {
    const next = applyPreferencePatch(preferencesRef.current, patch);
    return next ? commit(next) : false;
  }, [commit]);

  const resetPreferences = useCallback(() =>
    commit(getDefaultPreferences(prefersReducedMotion())), [commit]);

  const undoPreferences = useCallback(() => {
    const previous = undoRef.current;
    if (!previous) return false;
    undoRef.current = null;
    return commit(previous, false);
  }, [commit]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.contrast = preferences.contrast;
    root.dataset.textScale = String(preferences.textScale);
    root.dataset.controlSize = preferences.controlSize;
    root.dataset.cursor = preferences.cursor;
    root.dataset.highlightLinks = String(preferences.highlightLinks);
    root.dataset.highlightHeadings = String(preferences.highlightHeadings);
    root.dataset.letterSpacing = preferences.letterSpacing;
    root.dataset.saturation = preferences.saturation;
    root.dataset.colorFilter = preferences.colorFilter;
    root.dataset.dyslexiaFont = String(preferences.dyslexiaFont);
    root.dataset.lineHeight = preferences.lineHeight;
    root.dataset.textAlign = preferences.textAlign;
    root.dataset.readingGuide = String(preferences.readingGuide);
    root.dataset.readingMask = String(preferences.readingMask);
    root.dataset.reducedMotion = String(preferences.reducedMotion);
    delete root.dataset.spacing;
    delete root.dataset.largeControls;
    delete root.dataset.libras;
    try {
      const storage = getLocalStorage();
      if (!storage) throw new Error('storage_unavailable');
      storage.setItem(STORAGE_KEY, serializePreferences(preferences));
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  }, [preferences]);

  return {
    preferences,
    stateRevision,
    storageAvailable,
    applyPreferences,
    resetPreferences,
    undoPreferences,
    canUndo,
    getPreferences: () => preferencesRef.current,
    getStateRevision: () => stateRevisionRef.current,
  };
};
