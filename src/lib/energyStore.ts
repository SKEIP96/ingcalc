import { ENERGY_KEY } from "../config.ts";
import { tx, type Locale } from "../i18n/messages.ts";
import { createId, type KeyValueStore } from "./history.ts";

export type ApplianceDraft = {
  id: string;
  name: string;
  power: string;
  quantity: string;
  hours: string;
  days: string;
};

export type EnergyState = {
  tariff: string;
  tariffIsDemo: boolean;
  scenario: "A" | "B";
  A: ApplianceDraft[];
  B: ApplianceDraft[];
};

export const DEMO_TARIFF = "2,50";

export function blankAppliance(): ApplianceDraft {
  return { id: createId(), name: "", power: "", quantity: "", hours: "", days: "" };
}

export function controlAppliance(locale: Locale = "ro"): ApplianceDraft {
  return {
    id: createId(),
    name: tx(locale, "Aparat demonstrativ", "Демонстрационный прибор"),
    power: "1000",
    quantity: "1",
    hours: "2",
    days: "30",
  };
}

export function demoAppliances(locale: Locale = "ro"): ApplianceDraft[] {
  return [
    { id: createId(), name: tx(locale, "Bec LED", "Светодиодная лампа"), power: "10", quantity: "8", hours: "5", days: "30" },
    { id: createId(), name: tx(locale, "Laptop", "Ноутбук"), power: "65", quantity: "2", hours: "6", days: "22" },
    { id: createId(), name: tx(locale, "Frigider de laborator", "Лабораторный холодильник"), power: "120", quantity: "1", hours: "8", days: "30" },
    { id: createId(), name: tx(locale, "Ventilator", "Вентилятор"), power: "80", quantity: "1", hours: "4", days: "20" },
  ];
}

export function defaultEnergyState(): EnergyState {
  return {
    tariff: "",
    tariffIsDemo: false,
    scenario: "A",
    A: [blankAppliance()],
    B: [blankAppliance()],
  };
}

function isDraft(value: unknown): value is ApplianceDraft {
  if (!value || typeof value !== "object") return false;
  const item = value as ApplianceDraft;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.power === "string" &&
    typeof item.quantity === "string" &&
    typeof item.hours === "string" &&
    typeof item.days === "string"
  );
}

export function readEnergyState(store: KeyValueStore): EnergyState {
  const raw = store.getItem(ENERGY_KEY);
  if (!raw) return defaultEnergyState();
  try {
    const parsed = JSON.parse(raw) as Partial<EnergyState>;
    const A = Array.isArray(parsed.A) ? parsed.A.filter(isDraft) : [];
    const B = Array.isArray(parsed.B) ? parsed.B.filter(isDraft) : [];
    return {
      tariff: typeof parsed.tariff === "string" ? parsed.tariff : "",
      tariffIsDemo: parsed.tariffIsDemo === true,
      scenario: parsed.scenario === "B" ? "B" : "A",
      A: A.length > 0 ? A : [blankAppliance()],
      B: B.length > 0 ? B : [blankAppliance()],
    };
  } catch {
    return defaultEnergyState();
  }
}

export function writeEnergyState(store: KeyValueStore, state: EnergyState): boolean {
  try {
    store.setItem(ENERGY_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
