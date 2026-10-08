import { describe, expect, it } from "vitest";
import { ohmLabel, solveOhm, solveOhmFromText } from "./ohm.ts";

describe("Legea lui Ohm", () => {
  it("calculează U = 220 V și R = 110 Ω", () => {
    const result = solveOhm("U", 220, "R", 110);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.I).toBe(2);
    expect(result.P).toBe(440);
    expect(result.U).toBe(220);
    expect(result.R).toBe(110);
    expect(result.formulas).toContain("I = U / R");
  });

  it("rezolvă toate cele șase combinații pentru același punct de funcționare", () => {
    const cases = [
      solveOhm("U", 220, "I", 2),
      solveOhm("U", 220, "R", 110),
      solveOhm("U", 220, "P", 440),
      solveOhm("I", 2, "R", 110),
      solveOhm("I", 2, "P", 440),
      solveOhm("R", 110, "P", 440),
    ];
    for (const result of cases) {
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.U).toBeCloseTo(220, 8);
      expect(result.I).toBeCloseTo(2, 8);
      expect(result.R).toBeCloseTo(110, 8);
      expect(result.P).toBeCloseTo(440, 8);
    }
  });

  it("acceptă text cu virgulă", () => {
    const result = solveOhmFromText("U", "220", "R", "110,0");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.I).toBe(2);
    expect(result.P).toBe(440);
  });

  it("tratează câmpurile goale, negativele, zero și valorile enorme", () => {
    expect(solveOhmFromText("U", "", "R", "10").ok).toBe(false);
    expect(solveOhmFromText("U", "", "R", "10").code).toBe("empty");
    expect(solveOhm("U", -220, "R", 10).code).toBe("negative");
    expect(solveOhm("U", 220, "R", 0).code).toBe("division_by_zero");
    expect(solveOhm("U", 0, "I", 0).code).toBe("indeterminate");
    expect(solveOhm("U", 0, "P", 20).code).toBe("impossible");
    expect(solveOhm("R", 0, "P", 10).code).toBe("impossible");
    expect(solveOhm("U", 1e308, "R", 1e-308).code).toBe("too_large");
    expect(solveOhm("U", 1, "U", 2).code).toBe("invalid_pair");
    expect(solveOhmFromText("I", "abc", "R", "1").code).toBe("invalid_number");
  });

  it("etichetează mărimile în română", () => {
    expect(ohmLabel("R")).toBe("Rezistența R");
  });

  it("scrie mesajul de eroare în rusă când limba este ru", () => {
    const result = solveOhm("U", -220, "R", 10, "ru");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/Отрицательн/);
    expect(ohmLabel("R", "ru")).toBe("Сопротивление R");
  });
});
