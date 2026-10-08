import { HISTORY_KEY, HISTORY_LIMIT } from "../config.ts";

export type HistoryCalculatorId = "ohm" | "circuits" | "energy" | "resistance" | "efficiency";

export type HistoryLine = {
  label: string;
  value: string;
  unit: string;
};

export type HistoryEntry = {
  id: string;
  createdAt: string;
  calculatorId: HistoryCalculatorId;
  calculatorName: string;
  inputs: HistoryLine[];
  results: HistoryLine[];
  formulas: string[];
  steps: string[];
  notes: string[];
};

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createMemoryStore(initial: Record<string, string> = {}): KeyValueStore {
  const data = { ...initial };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = value;
    },
    removeItem(key) {
      delete data[key];
    },
  };
}

export function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isLine(value: unknown): value is HistoryLine {
  if (!value || typeof value !== "object") return false;
  const line = value as HistoryLine;
  return typeof line.label === "string" && typeof line.value === "string" && typeof line.unit === "string";
}

function isEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as HistoryEntry;
  const ids: HistoryCalculatorId[] = ["ohm", "circuits", "energy", "resistance", "efficiency"];
  return (
    typeof entry.id === "string" &&
    typeof entry.createdAt === "string" &&
    ids.includes(entry.calculatorId) &&
    typeof entry.calculatorName === "string" &&
    Array.isArray(entry.inputs) &&
    entry.inputs.every(isLine) &&
    Array.isArray(entry.results) &&
    entry.results.every(isLine) &&
    Array.isArray(entry.formulas) &&
    entry.formulas.every((item) => typeof item === "string") &&
    Array.isArray(entry.steps) &&
    entry.steps.every((item) => typeof item === "string") &&
    Array.isArray(entry.notes) &&
    entry.notes.every((item) => typeof item === "string")
  );
}

export function readHistory(store: KeyValueStore): HistoryEntry[] {
  const raw = store.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry).slice(0, HISTORY_LIMIT);
  } catch {
    return [];
  }
}

export function writeHistory(store: KeyValueStore, entries: HistoryEntry[]): boolean {
  try {
    store.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, HISTORY_LIMIT)));
    return true;
  } catch {
    return false;
  }
}

export function appendHistory(store: KeyValueStore, entry: HistoryEntry): HistoryEntry[] | null {
  const next = [entry, ...readHistory(store)].slice(0, HISTORY_LIMIT);
  return writeHistory(store, next) ? next : null;
}

export function removeHistory(store: KeyValueStore, id: string): HistoryEntry[] | null {
  const next = readHistory(store).filter((entry) => entry.id !== id);
  return writeHistory(store, next) ? next : null;
}

export function clearHistory(store: KeyValueStore): boolean {
  try {
    store.removeItem(HISTORY_KEY);
    return true;
  } catch {
    return false;
  }
}
