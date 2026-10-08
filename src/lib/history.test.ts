import { describe, expect, it } from "vitest";
import { HISTORY_LIMIT } from "../config.ts";
import { toCsv } from "./csv.ts";
import { appendHistory, clearHistory, createMemoryStore, readHistory, removeHistory, type HistoryEntry } from "./history.ts";

function entry(id: string): HistoryEntry {
  return {
    id,
    createdAt: "2026-10-09T09:00:00.000Z",
    calculatorId: "ohm",
    calculatorName: "Legea lui Ohm",
    inputs: [{ label: "U", value: "220", unit: "V" }],
    results: [{ label: "I", value: "2", unit: "A" }],
    formulas: ["I = U / R"],
    steps: ["I = 2 A"],
    notes: [],
  };
}

describe("Istoric și CSV", () => {
  it("păstrează ultimele 50 de calcule și supraviețuiește unui JSON invalid", () => {
    const store = createMemoryStore();
    for (let index = 0; index < HISTORY_LIMIT + 5; index += 1) {
      appendHistory(store, entry(String(index)));
    }
    const saved = readHistory(store);
    expect(saved).toHaveLength(HISTORY_LIMIT);
    expect(saved[0]?.id).toBe(String(HISTORY_LIMIT + 4));
    expect(saved.at(-1)?.id).toBe("5");

    const broken = createMemoryStore({ "electrolab.history.v1": "{nu" });
    expect(readHistory(broken)).toEqual([]);
  });

  it("șterge o înregistrare și golește istoricul", () => {
    const store = createMemoryStore();
    appendHistory(store, entry("a"));
    appendHistory(store, entry("b"));
    expect(removeHistory(store, "a")?.map((item) => item.id)).toEqual(["b"]);
    expect(clearHistory(store)).toBe(true);
    expect(readHistory(store)).toEqual([]);
  });

  it("exportă CSV cu BOM, separator punct și virgulă și ghilimele", () => {
    const csv = toCsv([
      ["Data", "Notă"],
      ["09.10.2026", 'valoare; cu "ghilimele"'],
    ]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Data;Notă");
    expect(csv).toContain('"valoare; cu ""ghilimele"""');
  });
});
