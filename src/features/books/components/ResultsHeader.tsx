import { MASS_MARKET_LIST } from '../books.constants';
import type { ResultsHeaderProps } from '../types/index';

export function ResultsHeader({
  meta,
  summary,
  totalBooks,
  isLoading,
}: ResultsHeaderProps) {
  return (
    <section className="panel">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="section-title">Resultados</p>
            <h2 className="display-font mt-3 text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl">
              {meta?.displayName || MASS_MARKET_LIST.displayName}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
              {summary}
            </p>
          </div>

          <span className="meta-chip-strong self-start">
            {isLoading ? 'Actualizando lista' : `${totalBooks} libros visibles`}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="meta-chip">
            Bestsellers {meta?.bestsellersDate || MASS_MARKET_LIST.newestPublishedDate}
          </span>
          <span className="meta-chip">
            Cadencia {(meta?.updated || MASS_MARKET_LIST.cadence).toLowerCase()}
          </span>
          <span className="meta-chip">
            Archivo {MASS_MARKET_LIST.oldestPublishedDate.slice(0, 4)}-
            {MASS_MARKET_LIST.newestPublishedDate.slice(0, 4)}
          </span>
        </div>
      </div>
    </section>
  );
}
