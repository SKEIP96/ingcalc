import { describe, expect, it } from "vitest";
import { fromWatts, solveEfficiencyFromText, solveFromEfficiency, solveFromPowers, toWatts } from "./efficiency.ts";

describe("Randament și pierderi", () => {
  it("calculează 1000 W intrare și 850 W ieșire", () => {
    const result = solveFromPowers(1000, 850);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.etaPercent).toBe(85);
    expect(result.lossW).toBe(150);
    expect(result.formulas[0]).toContain("η");
    expect(result.notes.some((note) => note.includes("cos φ"))).toBe(true);
  });

  it("inversează calculul din randament", () => {
    const result = solveFromEfficiency(1000, 85);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.poutW).toBe(850);
    expect(result.lossW).toBe(150);
  });

  it("converteste unitățile și respinge combinațiile nefizice", () => {
    expect(toWatts(1, "kW")).toBe(1000);
    expect(fromWatts(850, "kW")).toBe(0.85);
    const fromText = solveEfficiencyFromText({
      mode: "powers",
      unit: "kW",
      pin: "1",
      pout: "0,85",
      eta: "",
    });
    expect(fromText.ok).toBe(true);
    if (fromText.ok) expect(fromText.etaPercent).toBeCloseTo(85, 8);

    expect(solveFromPowers(0, 0).code).toBe("division_by_zero");
    expect(solveFromPowers(100, 120).code).toBe("impossible");
    expect(solveFromPowers(-10, 1).code).toBe("negative");
    expect(solveFromEfficiency(1000, 101).code).toBe("out_of_range");
    expect(solveFromEfficiency(1000, -1).code).toBe("negative");
    expect(solveEfficiencyFromText({ mode: "powers", unit: "W", pin: "", pout: "1", eta: "" }).code).toBe("empty");
    expect(solveEfficiencyFromText({ mode: "efficiency", unit: "W", pin: "1000", pout: "", eta: "85" }).ok).toBe(true);
    const huge = solveEfficiencyFromText({ mode: "powers", unit: "kW", pin: "1e308", pout: "1", eta: "" });
    expect(huge.ok).toBe(false);
    if (!huge.ok) expect(huge.code).toBe("non_finite");
    const large = solveFromPowers(1_000_000, 850_000);
    expect(large.ok).toBe(true);
    if (large.ok) expect(large.etaPercent).toBe(85);
  });
});
