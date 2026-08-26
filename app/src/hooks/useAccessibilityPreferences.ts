import { useEffect, useState } from 'react';
import type { AccessibilityPreferences } from '../types';

const STORAGE_KEY = 'clickbus-a11y-v1';

const defaultPreferences: AccessibilityPreferences = {
  highContrast: false,
  elderlyMode: false,
  // A tradução em Libras nasce ligada: quem depende dela não deveria precisar
  // abrir um menu para encontrá-la.
  librasWidget: true,
  reducedMotion: false,
};

const readStoredPreferences = (): AccessibilityPreferences => {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return defaultPreferences;

    const parsed = JSON.parse(value) as Partial<AccessibilityPreferences>;
    return {
      highContrast: Boolean(parsed.highContrast),
      elderlyMode: Boolean(parsed.elderlyMode),
      librasWidget: parsed.librasWidget ?? defaultPreferences.librasWidget,
      reducedMotion: Boolean(parsed.reducedMotion),
    };
  } catch {
    return defaultPreferences;
  }
};

export const useAccessibilityPreferences = () => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(readStoredPreferences);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.contrast = String(preferences.highContrast);
    root.dataset.elderly = String(preferences.elderlyMode);
    root.dataset.libras = String(preferences.librasWidget);
    root.dataset.reducedMotion = String(preferences.reducedMotion);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const togglePreference = (key: keyof AccessibilityPreferences) => {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
  };

  const resetPreferences = () => setPreferences(defaultPreferences);

  return { preferences, togglePreference, resetPreferences };
};
