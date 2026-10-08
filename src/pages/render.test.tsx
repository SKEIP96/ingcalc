import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "../context/LanguageContext.tsx";
import { ThemeProvider } from "../context/ThemeContext.tsx";
import { AboutPage } from "../pages/AboutPage.tsx";
import { DashboardPage } from "../pages/DashboardPage.tsx";

describe("Randare inițială", () => {
  it("afișează panoul principal în română", () => {
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <LanguageProvider>
          <MemoryRouter>
            <DashboardPage />
          </MemoryRouter>
        </LanguageProvider>
      </ThemeProvider>,
    );
    expect(html).toContain("ElectroLab");
    expect(html).toContain("Instrumente inteligente pentru calcule electrice.");
    expect(html).toContain("Deschide calculatorul");
    expect(html).toContain("Nicolai Prodius");
    expect(html).toContain("Cum funcționează?");
  });

  it("afișează pagina despre aplicație", () => {
    const html = renderToStaticMarkup(
      <LanguageProvider>
        <MemoryRouter>
          <AboutPage />
        </MemoryRouter>
      </LanguageProvider>,
    );
    expect(html).toContain("Problema abordată");
    expect(html).toContain("FEIE, UTM");
    expect(html).toContain("Energetică");
  });
});
