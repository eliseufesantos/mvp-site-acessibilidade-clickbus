import type { AccessibilityPreferences } from '../../../types.js';

export const STORAGE_KEY = 'clickbus-a11y-v4';
export const LEGACY_V3_STORAGE_KEY = 'clickbus-a11y-v3';
export const LEGACY_V2_STORAGE_KEY = 'clickbus-a11y-v2';
export const LEGACY_V1_STORAGE_KEY = 'clickbus-a11y-v1';

export const TEXT_SCALES = [1, 1.125, 1.25, 1.5] as const;
export const LIBRAS_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5] as const;
export const LINE_HEIGHTS = ['default', 'comfortable', 'wide'] as const;
export const TEXT_ALIGNS = ['original', 'left', 'center'] as const;
export const SATURATIONS = ['default', 'high', 'low', 'grayscale'] as const;
/**
 * Correção de cores para dicromacias. São aproximações por matriz, úteis para
 * aumentar a separação entre matizes confundíveis — não são simulação clínica
 * nem substituem contraste adequado.
 */
export const COLOR_FILTERS = ['none', 'protanopia', 'deuteranopia', 'tritanopia'] as const;

export const PREFERENCE_KEYS = [
  'contrast',
  'textScale',
  'controlSize',
  'cursor',
  'highlightLinks',
  'highlightHeadings',
  'letterSpacing',
  'lineHeight',
  'textAlign',
  'readingGuide',
  'readingMask',
  'reducedMotion',
  'saturation',
  'colorFilter',
  'dyslexiaFont',
  'librasSpeed',
] as const satisfies readonly (keyof AccessibilityPreferences)[];

export type PreferencePatch = Partial<AccessibilityPreferences>;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface StoredPreferencesV4 {
  version: 4;
  visual: Omit<AccessibilityPreferences, 'librasSpeed'>;
  libras: { speed: AccessibilityPreferences['librasSpeed'] };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const onlyKeys = (value: Record<string, unknown>, allowed: readonly string[]) =>
  Object.keys(value).every((key) => allowed.includes(key));

const includes = <Value extends string | number>(values: readonly Value[], value: unknown): value is Value =>
  values.includes(value as Value);

export const getDefaultPreferences = (prefersReducedMotion = false): AccessibilityPreferences => ({
  contrast: 'default',
  textScale: 1,
  controlSize: 'default',
  cursor: 'default',
  highlightLinks: false,
  highlightHeadings: false,
  letterSpacing: 'default',
  lineHeight: 'default',
  textAlign: 'original',
  readingGuide: false,
  readingMask: false,
  reducedMotion: prefersReducedMotion,
  saturation: 'default',
  colorFilter: 'none',
  dyslexiaFont: false,
  librasSpeed: 1,
});

const parseBoolean = (value: unknown, fallback: boolean) => typeof value === 'boolean' ? value : fallback;

export const parsePreferencePatch = (value: unknown): PreferencePatch | null => {
  if (!isRecord(value) || Object.keys(value).length === 0 || !onlyKeys(value, PREFERENCE_KEYS)) return null;
  const patch: PreferencePatch = {};
  for (const key of Object.keys(value) as (keyof AccessibilityPreferences)[]) {
    const candidate = value[key];
    if (key === 'contrast' && (candidate === 'default' || candidate === 'high')) patch.contrast = candidate;
    else if (key === 'textScale' && includes(TEXT_SCALES, candidate)) patch.textScale = candidate;
    else if (key === 'controlSize' && (candidate === 'default' || candidate === 'large')) patch.controlSize = candidate;
    else if (key === 'cursor' && (candidate === 'default' || candidate === 'large')) patch.cursor = candidate;
    else if (key === 'letterSpacing' && (candidate === 'default' || candidate === 'wide')) patch.letterSpacing = candidate;
    else if (key === 'lineHeight' && includes(LINE_HEIGHTS, candidate)) patch.lineHeight = candidate;
    else if (key === 'textAlign' && includes(TEXT_ALIGNS, candidate)) patch.textAlign = candidate;
    else if (key === 'saturation' && includes(SATURATIONS, candidate)) patch.saturation = candidate;
    else if (key === 'colorFilter' && includes(COLOR_FILTERS, candidate)) patch.colorFilter = candidate;
    else if (key === 'librasSpeed' && includes(LIBRAS_SPEEDS, candidate)) patch.librasSpeed = candidate;
    else if (
      (key === 'highlightLinks' || key === 'highlightHeadings' || key === 'readingGuide' ||
        key === 'readingMask' || key === 'reducedMotion' || key === 'dyslexiaFont') &&
      typeof candidate === 'boolean'
    ) {
      Object.assign(patch, { [key]: candidate });
    } else {
      return null;
    }
  }
  return patch;
};

export const isPreferencePatch = (value: unknown): value is PreferencePatch =>
  parsePreferencePatch(value) !== null;

export const applyPreferencePatch = (
  current: AccessibilityPreferences,
  patchValue: unknown,
): AccessibilityPreferences | null => {
  const patch = parsePreferencePatch(patchValue);
  return patch ? { ...current, ...patch } : null;
};

export const preferencesEqual = (left: AccessibilityPreferences, right: AccessibilityPreferences) =>
  PREFERENCE_KEYS.every((key) => left[key] === right[key]);

const parseV4 = (value: unknown, defaults: AccessibilityPreferences): AccessibilityPreferences | null => {
  if (!isRecord(value) || value.version !== 4 || !onlyKeys(value, ['version', 'visual', 'libras'])) return null;
  if (!isRecord(value.visual) || !isRecord(value.libras) || !onlyKeys(value.libras, ['speed'])) return null;
  const complete = {
    ...value.visual,
    librasSpeed: value.libras.speed,
  };
  if (!isRecord(complete) || Object.keys(complete).length !== PREFERENCE_KEYS.length) return null;
  const patch = parsePreferencePatch(complete);
  return patch ? { ...defaults, ...patch } : null;
};

/**
 * v3 → v4. A v4 só acrescentou `saturation`, `colorFilter` e `dyslexiaFont`,
 * então a migração é preencher os três com o padrão e preservar o resto. Um
 * registro v3 parcial ou corrompido cai no padrão inteiro, nunca em erro.
 */
const migrateV3 = (value: unknown, defaults: AccessibilityPreferences): AccessibilityPreferences | null => {
  if (!isRecord(value) || value.version !== 3 || !isRecord(value.visual) || !isRecord(value.libras)) return null;
  const patch = parsePreferencePatch({
    ...value.visual,
    librasSpeed: value.libras.speed,
  });
  return { ...defaults, ...(patch ?? {}) };
};

const migrateV2 = (value: unknown, defaults: AccessibilityPreferences): AccessibilityPreferences | null => {
  if (!isRecord(value)) return null;
  const comfortable = value.comfortableSpacing === true;
  return {
    ...defaults,
    contrast: value.highContrast === true ? 'high' : 'default',
    textScale: includes(TEXT_SCALES, value.textScale) ? value.textScale : defaults.textScale,
    controlSize: value.largeControls === true ? 'large' : 'default',
    letterSpacing: comfortable ? 'wide' : 'default',
    lineHeight: comfortable ? 'comfortable' : 'default',
    readingGuide: parseBoolean(value.readingGuide, defaults.readingGuide),
    reducedMotion: parseBoolean(value.reducedMotion, defaults.reducedMotion),
    librasSpeed: includes(LIBRAS_SPEEDS, value.librasSpeed) ? value.librasSpeed : defaults.librasSpeed,
  };
};

const migrateV1 = (value: unknown, defaults: AccessibilityPreferences): AccessibilityPreferences | null => {
  if (!isRecord(value)) return null;
  const comfortable = value.elderlyMode === true;
  return {
    ...defaults,
    contrast: value.highContrast === true ? 'high' : 'default',
    textScale: comfortable ? 1.125 : 1,
    controlSize: comfortable ? 'large' : 'default',
    letterSpacing: comfortable ? 'wide' : 'default',
    lineHeight: comfortable ? 'comfortable' : 'default',
    reducedMotion: parseBoolean(value.reducedMotion, defaults.reducedMotion),
  };
};

const readJson = (storage: StorageLike, key: string): unknown | null => {
  const raw = storage.getItem(key);
  return raw === null ? null : JSON.parse(raw);
};

export const loadPreferences = (
  storage: StorageLike | null,
  prefersReducedMotion = false,
): { preferences: AccessibilityPreferences; migratedFrom: 1 | 2 | 3 | null; storageAvailable: boolean } => {
  const defaults = getDefaultPreferences(prefersReducedMotion);
  if (!storage) return { preferences: defaults, migratedFrom: null, storageAvailable: false };
  try {
    const v4 = readJson(storage, STORAGE_KEY);
    if (v4 !== null) {
      return { preferences: parseV4(v4, defaults) ?? defaults, migratedFrom: null, storageAvailable: true };
    }
    const v3 = readJson(storage, LEGACY_V3_STORAGE_KEY);
    if (v3 !== null) {
      return { preferences: migrateV3(v3, defaults) ?? defaults, migratedFrom: 3, storageAvailable: true };
    }
    const v2 = readJson(storage, LEGACY_V2_STORAGE_KEY);
    if (v2 !== null) {
      return { preferences: migrateV2(v2, defaults) ?? defaults, migratedFrom: 2, storageAvailable: true };
    }
    const v1 = readJson(storage, LEGACY_V1_STORAGE_KEY);
    if (v1 !== null) {
      return { preferences: migrateV1(v1, defaults) ?? defaults, migratedFrom: 1, storageAvailable: true };
    }
    return { preferences: defaults, migratedFrom: null, storageAvailable: true };
  } catch {
    return { preferences: defaults, migratedFrom: null, storageAvailable: true };
  }
};

export const serializePreferences = (preferences: AccessibilityPreferences): string => {
  const { librasSpeed, ...visual } = preferences;
  const stored: StoredPreferencesV4 = { version: 4, visual, libras: { speed: librasSpeed } };
  return JSON.stringify(stored);
};

export const COMFORTABLE_READING_PATCH: PreferencePatch = {
  textScale: 1.125,
  letterSpacing: 'wide',
  lineHeight: 'comfortable',
  textAlign: 'left',
  reducedMotion: true,
};

export const saturationLabel: Record<AccessibilityPreferences['saturation'], string> = {
  default: 'Saturação padrão',
  high: 'Saturação alta',
  low: 'Saturação baixa',
  grayscale: 'Tons de cinza',
};

export const colorFilterLabel: Record<AccessibilityPreferences['colorFilter'], string> = {
  none: 'Sem correção de cores',
  protanopia: 'Correção protanopia',
  deuteranopia: 'Correção deuteranopia',
  tritanopia: 'Correção tritanopia',
};

export const getActivePreferenceLabels = (preferences: AccessibilityPreferences) => [
  preferences.contrast === 'high' ? 'Alto contraste' : null,
  preferences.textScale !== 1 ? `Texto ${Math.round(preferences.textScale * 100)}%` : null,
  preferences.controlSize === 'large' ? 'Controles maiores' : null,
  preferences.cursor === 'large' ? 'Cursor grande' : null,
  preferences.highlightLinks ? 'Links destacados' : null,
  preferences.highlightHeadings ? 'Títulos destacados' : null,
  preferences.letterSpacing === 'wide' ? 'Letras espaçadas' : null,
  preferences.lineHeight !== 'default' ? 'Entrelinha ampliada' : null,
  preferences.textAlign !== 'original' ? `Texto ao ${preferences.textAlign === 'left' ? 'lado esquerdo' : 'centro'}` : null,
  preferences.readingGuide ? 'Guia de leitura' : null,
  preferences.readingMask ? 'Máscara de leitura' : null,
  preferences.reducedMotion ? 'Movimento reduzido' : null,
  preferences.saturation !== 'default' ? saturationLabel[preferences.saturation] : null,
  preferences.colorFilter !== 'none' ? colorFilterLabel[preferences.colorFilter] : null,
  preferences.dyslexiaFont ? 'Fonte para dislexia' : null,
].filter((label): label is string => Boolean(label));
