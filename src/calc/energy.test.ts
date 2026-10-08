import { describe, expect, it } from "vitest";
import {
  annualFromMonthly,
  applianceMonthlyKwh,
  describeSavings,
  energyCost,
  evaluateAppliance,
  readTariff,
  summarizeAppliances,
} from "./energy.ts";

describe("Consum de energie", () => {
  it("calculează exemplul de control: 1000 W, 2 h, 30 zile", () => {
    expect(applianceMonthlyKwh(1000, 1, 2, 30)).toBe(60);
    const result = evaluateAppliance({
      name: "Aparat",
      power: "1000",
      quantity: "1",
      hours: "2",
      days: "30",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.kwh).toBe(60);
    expect(annualFromMonthly(result.kwh)).toBe(720);
  });

  it("acceptă virgula și însumează aparatele", () => {
    const summary = summarizeAppliances([
      { name: "A", power: "1 000", quantity: "1", hours: "2", days: "30" },
      { name: "", power: "", quantity: "", hours: "", days: "" },
      { name: "B", power: "500", quantity: "2", hours: "1", days: "10" },
    ]);
    expect(summary.ok).toBe(true);
    if (!summary.ok) return;
    expect(summary.appliances).toHaveLength(2);
    expect(summary.monthlyKwh).toBe(70);
    expect(summary.annualKwh).toBe(840);
  });

  it("validează câmpurile goale, negativele și limitele", () => {
    expect(evaluateAppliance({ name: "", power: "1", quantity: "1", hours: "1", days: "1" }).code).toBe("empty");
    expect(evaluateAppliance({ name: "X", power: "", quantity: "1", hours: "1", days: "1" }).code).toBe("empty");
    expect(evaluateAppliance({ name: "X", power: "-5", quantity: "1", hours: "1", days: "1" }).code).toBe("negative");
    expect(evaluateAppliance({ name: "X", power: "10", quantity: "1", hours: "25", days: "1" }).code).toBe("out_of_range");
    expect(evaluateAppliance({ name: "X", power: "10", quantity: "1", hours: "1", days: "32" }).code).toBe("out_of_range");
    expect(evaluateAppliance({ name: "X", power: "abc", quantity: "1", hours: "1", days: "1" }).code).toBe("invalid_number");
    expect(evaluateAppliance({ name: "X", power: "1e308", quantity: "1e308", hours: "24", days: "31" }).code).toBe(
      "too_large",
    );
  });

  it("compară scenariile și nu inventează tariful", () => {
    expect(energyCost(60, 2.5)).toBe(150);
    const emptyTariff = readTariff("");
    expect(emptyTariff.ok).toBe(true);
    if (emptyTariff.ok) expect(emptyTariff.value).toBeNull();
    const negativeTariff = readTariff("-1");
    expect(negativeTariff.ok).toBe(false);
    if (!negativeTariff.ok) expect(negativeTariff.code).toBe("negative");
    const savings = describeSavings(80, 60, null);
    expect(savings.cheaper).toBe("B");
    expect(savings.savedKwh).toBe(20);
    expect(savings.savedCost).toBeNull();
    expect(describeSavings(60, 60, 2).cheaper).toBe("equal");
  });
});
