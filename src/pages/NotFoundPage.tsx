import { Link } from "react-router-dom";
import { useI18n } from "../context/LanguageContext.tsx";

export function NotFoundPage() {
  const { m } = useI18n();
  return (
    <section className="panel grid gap-3 p-6">
      <h1 className="text-3xl font-bold">{m.notFound}</h1>
      <p className="lede">{m.notFoundText}</p>
      <Link className="btn btn-primary w-fit" to="/">{m.backHome}</Link>
    </section>
  );
}
