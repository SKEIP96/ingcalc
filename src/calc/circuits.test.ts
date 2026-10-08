import { describe, expect, it } from "vitest";
import { solveCircuit, solveCircuitFromText } from "./circuits.ts";

describe("Circuite monofazate și trifazate", () => {
  it("calculează puterea trifazată de control", () => {
    const result = solveCircuit({
      phase: "trifazat",
      nature: "inductiva",
      solve: "current",
      U: 400,
      I: 10,
      cosPhi: 0.8,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Number((result.P / 1000).toFixed(3))).toBe(5.543);
    expect(result.P).toBeCloseTo(Math.sqrt(3) * 400 * 10 * 0.8, 8);
    expect(result.Q).toBeGreaterThan(0);
    expect(result.notes.some((note) => note.includes("simetrică"))).toBe(true);
    expect(result.formulas).toContain("P = √3 × U_L × I_L × cos φ");
  });

  it("schimbă semnul puterii reactive pentru sarcină capacitivă", () => {
    const result = solveCircuit({
      phase: "monofazat",
      nature: "capacitiva",
      solve: "current",
      U: 230,
      I: 10,
      cosPhi: 0.8,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.P).toBeCloseTo(1840, 8);
    expect(result.S).toBe(2300);
    expect(result.Q).toBeLessThan(0);
    expect(result.phiDeg).toBeLessThan(0);
  });

  it("determină curentul din puterea activă", () => {
    const mono = solveCircuit({
      phase: "monofazat",
      nature: "inductiva",
      solve: "power",
      U: 230,
      P: 2300,
      cosPhi: 1,
    });
    expect(mono.ok).toBe(true);
    if (mono.ok) expect(mono.I).toBeCloseTo(10, 8);

    const active = Math.sqrt(3) * 400 * 10 * 0.8;
    const tri = solveCircuit({
      phase: "trifazat",
      nature: "inductiva",
      solve: "power",
      U: 400,
      P: active,
      cosPhi: 0.8,
    });
    expect(tri.ok).toBe(true);
    if (tri.ok) expect(tri.I).toBeCloseTo(10, 6);
  });

  it("respinge cos φ invalid, valorile negative și cazurile nedeterminate", () => {
    expect(solveCircuit({ phase: "monofazat", nature: "inductiva", solve: "current", U: 230, I: 1, cosPhi: 1.2 }).code).toBe(
      "out_of_range",
    );
    expect(solveCircuit({ phase: "monofazat", nature: "inductiva", solve: "current", U: 230, I: 1, cosPhi: -0.2 }).code).toBe(
      "negative",
    );
    expect(solveCircuit({ phase: "monofazat", nature: "inductiva", solve: "power", U: 230, P: 100, cosPhi: 0 }).code).toBe(
      "impossible",
    );
    expect(solveCircuit({ phase: "monofazat", nature: "inductiva", solve: "power", U: 0, P: 0, cosPhi: 1 }).code).toBe(
      "indeterminate",
    );
    expect(solveCircuit({ phase: "monofazat", nature: "inductiva", solve: "power", U: 0, P: 10, cosPhi: 1 }).code).toBe(
      "division_by_zero",
    );
    expect(solveCircuitFromText({
      phase: "trifazat",
      nature: "inductiva",
      solve: "current",
      voltage: "",
      current: "10",
      power: "",
      cosPhi: "0,8",
    }).code).toBe("empty");
    expect(solveCircuitFromText({
      phase: "trifazat",
      nature: "inductiva",
      solve: "current",
      voltage: "400",
      current: "10",
      power: "",
      cosPhi: "0,8",
    }).ok).toBe(true);
    expect(
      solveCircuit({ phase: "monofazat", nature: "inductiva", solve: "current", U: 1e308, I: 1e308, cosPhi: 1 }).code,
    ).toBe("too_large");
  });
});
