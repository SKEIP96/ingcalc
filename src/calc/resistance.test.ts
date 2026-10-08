import { describe, expect, it } from "vitest";
import { equivalentParallel, solveResistance, solveResistanceFromText } from "./resistance.ts";

describe("Rezistențe electrice", () => {
  it("calculează 100 Ω paralel cu 100 Ω", () => {
    expect(equivalentParallel([100, 100])).toBeCloseTo(50, 10);
    const result = solveResistance("paralel", [100, 100], null);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.req).toBeCloseTo(50, 10);
    expect(result.shortCircuit).toBe(false);
    expect(result.current).toBeNull();
  });

  it("adună conexiunea serie și calculează curentul", () => {
    const result = solveResistance("serie", [100, 100], 10);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.req).toBe(200);
    expect(result.current).toBeCloseTo(0.05, 10);
  });

  it("tratează scurtcircuitul, numărul de elemente și valorile invalide", () => {
    const shorted = solveResistance("paralel", [100, 0], 12);
    expect(shorted.ok).toBe(true);
    if (shorted.ok) {
      expect(shorted.req).toBe(0);
      expect(shorted.shortCircuit).toBe(true);
      expect(shorted.current).toBeNull();
      expect(shorted.currentIssue).toMatch(/Scurtcircuit/);
    }
    const bothZero = solveResistance("paralel", [0, 0], 0);
    expect(bothZero.ok).toBe(true);
    if (bothZero.ok) expect(bothZero.currentIssue).toMatch(/nedeterminat/);
    expect(solveResistance("serie", [10], null).code).toBe("invalid_count");
    expect(solveResistance("serie", Array.from({ length: 13 }, () => 1), null).code).toBe("invalid_count");
    expect(solveResistance("serie", [10, -2], null).code).toBe("negative");
    expect(solveResistance("serie", [10, 10], -5).code).toBe("negative");
    expect(solveResistanceFromText("paralel", ["100", "100,0"], "").ok).toBe(true);
    expect(solveResistanceFromText("paralel", ["", "100"], "").code).toBe("empty");
    expect(solveResistanceFromText("serie", ["1e308", "1e308"], "").code).toBe("too_large");
  });
});
