import { describe, expect, it } from "vitest";
import { formatNumber, isResultStale, parseDecimal } from "./numbers.ts";

describe("parseDecimal", () => {
  it("acceptă punctul și virgula", () => {
    expect(parseDecimal("1.5")).toEqual({ ok: true, value: 1.5 });
    expect(parseDecimal("1,5")).toEqual({ ok: true, value: 1.5 });
    expect(parseDecimal(" 2,50 ")).toEqual({ ok: true, value: 2.5 });
    expect(parseDecimal("1.234,5")).toEqual({ ok: true, value: 1234.5 });
  });

  it("respinge câmpurile goale, textele și numerele nefinite", () => {
    expect(parseDecimal("")).toEqual({ ok: false, reason: "empty" });
    expect(parseDecimal("   ")).toEqual({ ok: false, reason: "empty" });
    expect(parseDecimal("abc")).toEqual({ ok: false, reason: "invalid" });
    expect(parseDecimal("1.2.3")).toEqual({ ok: false, reason: "invalid" });
    expect(parseDecimal("1,2,3")).toEqual({ ok: false, reason: "invalid" });
    expect(parseDecimal("1e309")).toEqual({ ok: false, reason: "invalid" });
  });

  it("păstrează semnul pentru validarea ulterioară", () => {
    expect(parseDecimal("-2,5")).toEqual({ ok: true, value: -2.5 });
  });
});

describe("formatNumber", () => {
  it("folosește virgula zecimală și gruparea miilor", () => {
    expect(formatNumber(5542.562584, 3)).toBe("5 542,563");
    expect(formatNumber(5.542562584, 3)).toBe("5,543");
    expect(formatNumber(440)).toBe("440");
  });
});

describe("isResultStale", () => {
  it("marchează rezultatul când semnătura datelor se schimbă", () => {
    expect(isResultStale(null, "a")).toBe(false);
    expect(isResultStale("a", "a")).toBe(false);
    expect(isResultStale("a", "b")).toBe(true);
  });
});
