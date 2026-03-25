const EMPTY_TIPS = [
  'Prueba con otra fecha cercana al domingo publicado.',
  'Reduce el texto del titulo para ampliar coincidencias.',
  'Usa solo el apellido del autor cuando haya variantes.',
];

export function EmptyState() {
  return (
    <section className="panel">
      <span className="meta-chip-strong">Sin coincidencias</span>
      <h3 className="display-font mt-5 text-3xl font-semibold text-[var(--text-primary)]">
        Ajusta la consulta y vuelve a explorar
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
        La API respondio correctamente, pero no hubo libros que coincidieran con los
        filtros aplicados en esa semana del archivo.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {EMPTY_TIPS.map((tip) => (
          <article key={tip} className="empty-tip text-sm leading-6">
            {tip}
          </article>
        ))}
      </div>
    </section>
  );
}
