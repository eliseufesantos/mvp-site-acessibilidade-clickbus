import type { AccessibilityPreferences } from '../../../../types';

export type LibrasState =
  | 'unavailable_pending_provider_configuration'
  | 'loading'
  | 'ready'
  | 'translating'
  | 'paused'
  | 'failed';

export interface LibrasSnapshot {
  state: LibrasState;
  message: string;
  attribution: string;
  attributionUrl: string;
}

export interface LibrasReceipt {
  status: 'accepted' | 'unavailable' | 'failed';
  state: LibrasState;
  message: string;
}

export interface LibrasContent {
  id: string;
  text: string;
}

export interface LibrasAdapter {
  getSnapshot(): LibrasSnapshot;
  initialize(): Promise<LibrasReceipt>;
  open(): Promise<LibrasReceipt>;
  close(): Promise<LibrasReceipt>;
  translate(content: LibrasContent): Promise<LibrasReceipt>;
  pause(): Promise<LibrasReceipt>;
  resume(): Promise<LibrasReceipt>;
  stop(): Promise<LibrasReceipt>;
  setSpeed(speed: AccessibilityPreferences['librasSpeed']): Promise<LibrasReceipt>;
  subscribe(listener: () => void): () => void;
}
