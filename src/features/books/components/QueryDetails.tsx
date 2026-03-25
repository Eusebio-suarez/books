import { MASS_MARKET_LIST } from '../books.constants';
import type { QueryDetailsProps } from '../types/index';

export function QueryDetails({ meta, totalBooks }: QueryDetailsProps) {
  const details = [
    {
      label: 'Fecha solicitada',
      value: meta?.requestedDate || MASS_MARKET_LIST.newestPublishedDate,
    },
    {
      label: 'Fecha consultada',
      value: meta?.resolvedDate || MASS_MARKET_LIST.newestPublishedDate,
    },
    {
      label: 'Fecha del bestseller',
      value: meta?.bestsellersDate || 'Pendiente',
    },
    {
      label: 'Libros mostrados',
      value: totalBooks.toString(),
      accent: true,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {details.map((item) => (
        <article key={item.label} className="metric-card">
          <p className="metric-label">{item.label}</p>
          <p
            className={`metric-value ${item.accent ? 'text-[var(--accent)]' : ''}`}
          >
            {item.value}
          </p>
        </article>
      ))}
    </section>
  );
}
