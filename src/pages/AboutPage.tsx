import { Link } from "react-router-dom";
import { courseName, FACULTY_LABEL, studentName, SUBMISSION_DATE, universityName, appSubtitle } from "../config.ts";
import { useI18n } from "../context/LanguageContext.tsx";

export function AboutPage() {
  const { locale, m } = useI18n();
  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <p className="kicker">{m.navAbout}</p>
        <h1 className="text-3xl font-bold tracking-tight">ElectroLab</h1>
        <p className="tagline">{appSubtitle(locale)}</p>
      </header>
      <section className="panel grid gap-3 p-5">
        <h2 className="text-xl font-semibold">{m.aboutProblem}</h2>
        <p className="lede">{m.aboutProblemText}</p>
      </section>
      <section className="panel grid gap-3 p-5">
        <h2 className="text-xl font-semibold">{m.aboutCan}</h2>
        <ul className="step-list">
          <li>{m.about1}</li>
          <li>{m.about2}</li>
          <li>{m.about3}</li>
          <li>{m.about4}</li>
          <li>{m.about5}</li>
          <li>{m.about6}</li>
        </ul>
      </section>
      <section className="panel grid gap-3 p-5">
        <h2 className="text-xl font-semibold">{m.aboutData}</h2>
        <p className="lede">{m.aboutDataText}</p>
        <Link className="btn btn-primary w-fit" to="/">{m.backHome}</Link>
      </section>
      <section className="panel grid gap-2 p-5">
        <h2 className="text-xl font-semibold">{m.author}</h2>
        <p>{studentName(locale)}</p>
        <p>{universityName(locale)}</p>
        <p>{FACULTY_LABEL}</p>
        <p>{m.discipline}: {courseName(locale)}</p>
        <p>{m.due}: {SUBMISSION_DATE}</p>
      </section>
    </div>
  );
}
