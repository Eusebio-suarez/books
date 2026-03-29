import { CalendarDays, Gauge, Rows3, Search } from 'lucide-react';
import { MASS_MARKET_LIST } from '../books.constants';
import type { ResultsHeaderProps } from '../types/index';

export function ResultsHeader({
  meta,
  summary,
  totalBooks,
  isLoading,
}: ResultsHeaderProps) {
  return (
    <section className="results-summary">
      <div className="results-summary-head">
        <div className="max-w-3xl min-w-0">
          <p className="section-title">Resultados</p>
          <h2 className="results-summary-title display-font">
            {meta?.displayName || MASS_MARKET_LIST.displayName}
          </h2>
          <p className="results-summary-text">{summary}</p>
        </div>

        <span className="results-count-chip">
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          {isLoading ? 'Actualizando' : `${totalBooks} resultados`}
        </span>
      </div>

      <div className="results-meta-row">
        <span className="results-meta-chip">
          <CalendarDays className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
          Bestsellers {meta?.bestsellersDate || MASS_MARKET_LIST.newestPublishedDate}
        </span>
        <span className="results-meta-chip">
          <Gauge className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
          Consulta {meta?.resolvedDate || MASS_MARKET_LIST.newestPublishedDate}
        </span>
        <span className="results-meta-chip">
          <Rows3 className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
          Cadencia {MASS_MARKET_LIST.cadence.toLowerCase()}
        </span>
      </div>
    </section>
  );
}
