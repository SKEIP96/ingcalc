import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PrintSheet } from "../components/PrintSheet.tsx";
import { STUDENT_NAME } from "../config.ts";
import { LanguageProvider } from "../context/LanguageContext.tsx";

describe("Export PDF", () => {
  it("conține datele obligatorii și diacriticele românești", () => {
    const html = renderToStaticMarkup(
      <LanguageProvider><PrintSheet
        report={{
          calculatorId: "ohm",
          calculatorName: "Legea lui Ohm",
          calculatedAt: "2026-10-09T12:00:00.000Z",
          inputs: [{ label: "Tensiune U", value: "220", unit: "V" }],
          results: [{ label: "Curent I", value: "2", unit: "A" }],
          formulas: ["I = U / R"],
          steps: ["I = 220 / 110 = 2 A."],
          notes: ["Sarcină rezistivă."],
        }}
      /></LanguageProvider>,
    );
    expect(html).toContain("ElectroLab");
    expect(html).toContain("Legea lui Ohm");
    expect(html).toContain("I = U / R");
    expect(html).toContain("220");
    expect(html).toContain(STUDENT_NAME);
    expect(html).toContain("FEIE, UTM");
    expect(html).toContain("electrotehnică și energetică");
    expect(html).toContain("Energetică");
  });
});
