import { Lightbulb, SearchX } from 'lucide-react';

const EMPTY_TIPS = [
  'Prueba una fecha cercana al domingo publicado.',
  'Reduce el texto del titulo para ampliar coincidencias.',
  'Usa solo el apellido del autor para buscar variaciones.',
];

export function EmptyState() {
  return (
    <section className="panel">
      <span className="meta-chip-strong">
        <SearchX className="h-3.5 w-3.5" aria-hidden="true" />
        Sin coincidencias
      </span>
      <h3 className="display-font mt-5 text-3xl font-semibold text-[var(--text-primary)]">
        Ajusta la consulta y vuelve a intentar
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
        La API respondio correctamente, pero no encontro libros para los filtros
        aplicados en esa semana del archivo.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {EMPTY_TIPS.map((tip) => (
          <article key={tip} className="empty-tip text-sm leading-6">
            <Lightbulb className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
            {tip}
          </article>
        ))}
      </div>
    </section>
  );
}
