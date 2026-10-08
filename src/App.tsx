import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout.tsx";
import { HistoryProvider } from "./context/HistoryContext.tsx";
import { LanguageProvider, useI18n } from "./context/LanguageContext.tsx";
import { PrintProvider } from "./context/PrintContext.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { ToastProvider } from "./context/ToastContext.tsx";
import { AboutPage } from "./pages/AboutPage.tsx";
import { CircuitsPage } from "./pages/CircuitsPage.tsx";
import { DashboardPage } from "./pages/DashboardPage.tsx";
import { HistoryPage } from "./pages/HistoryPage.tsx";
import { NotFoundPage } from "./pages/NotFoundPage.tsx";
import { OhmPage } from "./pages/OhmPage.tsx";
import { ResistancePage } from "./pages/ResistancePage.tsx";

const EfficiencyPage = lazy(() => import("./pages/EfficiencyPage.tsx").then((module) => ({ default: module.EfficiencyPage })));
const EnergyPage = lazy(() => import("./pages/EnergyPage.tsx").then((module) => ({ default: module.EnergyPage })));

function PageFallback() {
  const { m } = useI18n();
  return <p className="lede">{m.loading}</p>;
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
      <HistoryProvider>
        <ToastProvider>
          <PrintProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="ohm" element={<OhmPage />} />
                  <Route path="circuite" element={<CircuitsPage />} />
                  <Route path="consum" element={<Suspense fallback={<PageFallback />}><EnergyPage /></Suspense>} />
                  <Route path="rezistente" element={<ResistancePage />} />
                  <Route path="randament" element={<Suspense fallback={<PageFallback />}><EfficiencyPage /></Suspense>} />
                  <Route path="istoric" element={<HistoryPage />} />
                  <Route path="despre" element={<AboutPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </PrintProvider>
        </ToastProvider>
      </HistoryProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
