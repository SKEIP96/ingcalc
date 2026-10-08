import { Activity, ArrowRight, Cable, Gauge, Plug, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { appSubtitle, courseName, FACULTY_LABEL, studentName, SUBMISSION_DATE, universityName } from "../config.ts";
import { HeroCircuit } from "../components/diagrams.tsx";
import { useI18n } from "../context/LanguageContext.tsx";

export function DashboardPage() {
  const navigate = useNavigate();
  const { locale, m } = useI18n();
  const tools = [
    { to: "/ohm", title: m.navOhm, text: m.cardOhm, icon: Zap },
    { to: "/circuite", title: m.navCircuits, text: m.cardCircuits, icon: Activity },
    { to: "/consum", title: m.navEnergy, text: m.cardEnergy, icon: Plug },
    { to: "/rezistente", title: m.navResistance, text: m.cardResistance, icon: Cable },
    { to: "/randament", title: m.navEfficiency, text: m.cardEfficiency, icon: Gauge },
  ];
  const demos = [
    { title: m.demo1t, text: m.demo1d, to: "/ohm?autorun=1&a=U&b=R&U=220&R=110" },
    { title: m.demo2t, text: m.demo2d, to: "/circuite?autorun=1&phase=trifazat&solve=current&nature=inductiva&U=400&I=10&cos=0,8" },
    { title: m.demo3t, text: m.demo3d, to: "/consum?autorun=1&demo=appliance" },
    { title: m.demo4t, text: m.demo4d, to: "/rezistente?autorun=1&mode=paralel&r=100,100" },
    { title: m.demo5t, text: m.demo5d, to: "/randament?autorun=1&mode=powers&unit=W&pin=1000&pout=850" },
  ];
  const notes = [
    ["U", m.noteU],
    ["I", m.noteI],
    ["R", m.noteR],
    ["P", m.noteP],
    ["Q", m.noteQ],
    ["S", m.noteS],
    ["cos φ", m.notePf],
    ["η", m.noteEta],
  ];
  const why = [
    [m.why1t, m.why1d],
    [m.why2t, m.why2d],
    [m.why3t, m.why3d],
  ];
  const steps = [
    ["1", m.how1t, m.how1d],
    ["2", m.how2t, m.how2d],
    ["3", m.how3t, m.how3d],
  ];

  return (
    <div className="grid gap-8">
      <section className="hero panel">
        <div className="grid gap-4">
          <p className="kicker">{FACULTY_LABEL}</p>
          <h1>ElectroLab</h1>
          <p className="tagline">{m.heroTag}</p>
          <p className="lede">{m.heroLede}</p>
          <p className="lede">{appSubtitle(locale)}</p>
        </div>
        <HeroCircuit />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <article key={tool.to} className="panel flex flex-col gap-4 p-5">
              <div className="flex items-center gap-3">
                <span className="icon-btn">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <h2 className="text-lg font-semibold">{tool.title}</h2>
              </div>
              <p className="lede flex-1">{tool.text}</p>
              <button className="btn btn-primary" type="button" onClick={() => navigate(tool.to)}>
                {m.openCalculator} <ArrowRight size={16} aria-hidden="true" />
              </button>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {why.map(([title, text]) => (
          <article key={title} className="panel p-5">
            <h2 className="mb-2 text-lg font-semibold">{title}</h2>
            <p className="lede">{text}</p>
          </article>
        ))}
      </section>

      <section className="panel p-5">
        <h2 className="mb-4 text-2xl font-semibold">{m.howTitle}</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map(([index, title, text]) => (
            <li key={index} className="rounded-2xl border border-[var(--border)] p-4">
              <p className="kicker">{index}</p>
              <h3 className="my-2 text-lg font-semibold">{title}</h3>
              <p className="lede">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold">{m.demoTitle}</h2>
        {demos.map((demo) => (
          <article key={demo.to} className="panel flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-semibold">{demo.title}</h3>
              <p className="lede">{demo.text}</p>
            </div>
            <button className="btn btn-secondary" type="button" onClick={() => navigate(`${demo.to}&t=${Date.now()}`)}>
              {m.openExample}
            </button>
          </article>
        ))}
      </section>

      <section className="panel p-5">
        <h2 className="mb-4 text-2xl font-semibold">{m.notesTitle}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {notes.map(([symbol, text]) => (
            <p key={symbol} className="rounded-xl border border-[var(--border)] p-3">
              <strong className="text-[var(--accent)]">{symbol}</strong>
              <span className="lede"> — {text}</span>
            </p>
          ))}
        </div>
      </section>

      <section className="panel grid gap-2 p-5">
        <p className="kicker">{m.authorBlock}</p>
        <h2 className="text-2xl font-semibold">{universityName(locale)}</h2>
        <p>{FACULTY_LABEL}</p>
        <p>{m.student}: {studentName(locale)}</p>
        <p>{m.discipline}: {courseName(locale)}</p>
        <p>{m.due}: {SUBMISSION_DATE}</p>
      </section>
    </div>
  );
}
