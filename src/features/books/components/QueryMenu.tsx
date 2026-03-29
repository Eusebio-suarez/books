import {
  BookText,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  UserRound,
} from 'lucide-react';
import { MASS_MARKET_LIST, MENU_OPTIONS, QUERY_TYPES } from '../books.constants';
import type { QueryMenuProps } from '../types/index';

const QUERY_MODE_ICONS = {
  [QUERY_TYPES.LATEST]: Clock3,
  [QUERY_TYPES.DATE]: CalendarDays,
  [QUERY_TYPES.TITLE]: BookText,
  [QUERY_TYPES.AUTHOR]: UserRound,
} as const;

export function QueryMenu({
  form,
  isLoading,
  authorSuggestions,
  onFieldChange,
  onAuthorSuggestionSelect,
  onModeChange,
}: QueryMenuProps) {
  const needsDate = form.queryType !== QUERY_TYPES.LATEST;
  const isAuthorQuery = form.queryType === QUERY_TYPES.AUTHOR;
  const hasAuthorInput = Boolean(form.author.trim());
  const showAuthorSuggestions =
    isAuthorQuery && hasAuthorInput && authorSuggestions.length > 0;
  const showAuthorSuggestionEmptyState =
    isAuthorQuery && hasAuthorInput && !authorSuggestions.length;
  const noteCopy = needsDate
    ? 'La fecha se alinea automaticamente con el domingo historico mas cercano del archivo.'
    : `Se usa automaticamente la fecha mas reciente disponible: ${MASS_MARKET_LIST.newestPublishedDate}.`;

  return (
    <section className="panel filter-sidebar-panel">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="section-title">Busqueda</p>
          <h2 className="display-font text-2xl font-semibold text-[var(--text-primary)]">
            Filtros
          </h2>
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            Elige un modo y la consulta se actualiza de inmediato.
          </p>
        </div>

        <div className="filter-note text-sm leading-6">
          {noteCopy}
          <div className="filter-sync-indicator" role="status" aria-live="polite">
            {isLoading ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{isLoading ? 'Aplicando filtros...' : 'Auto-filtrado activo.'}</span>
          </div>
        </div>

        <div className="filter-checklist" role="radiogroup" aria-label="Filtros del archivo">
          {MENU_OPTIONS.map((option) => {
            const isActive = form.queryType === option.id;
            const Icon = QUERY_MODE_ICONS[option.id];

            return (
              <section
                key={option.id}
                className={`filter-check-item ${isActive ? 'filter-check-item-active' : ''}`}
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => {
                    if (!isActive) {
                      onModeChange(option.id);
                    }
                  }}
                  className="filter-check-trigger"
                >
                  <span className="filter-check-leading">
                    <span
                      className={`filter-check-indicator ${
                        isActive ? 'filter-check-indicator-active' : ''
                      }`}
                      aria-hidden="true"
                    >
                      {isActive ? '✓' : ''}
                    </span>
                    <span
                      className={`filter-check-mode-icon ${
                        isActive ? 'filter-check-mode-icon-active' : ''
                      }`}
                      aria-hidden="true"
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="filter-check-title">{option.label}</span>
                    <span className="filter-check-description">{option.description}</span>
                  </span>
                </button>

                {isActive ? (
                  <div className="filter-check-fields">
                    {option.id !== QUERY_TYPES.LATEST ? (
                      <label className="input-label">
                        Fecha de consulta
                        <input
                          type="date"
                          name="date"
                          value={form.date}
                          min={MASS_MARKET_LIST.oldestPublishedDate}
                          max={MASS_MARKET_LIST.newestPublishedDate}
                          step="7"
                          onChange={onFieldChange}
                          className="input-field"
                        />
                      </label>
                    ) : (
                      <p className="filter-active-copy">
                        Se usa la fecha mas reciente: {MASS_MARKET_LIST.newestPublishedDate}.
                      </p>
                    )}

                    {option.id === QUERY_TYPES.TITLE ? (
                      <label className="input-label">
                        Titulo del libro
                        <input
                          type="text"
                          name="title"
                          value={form.title}
                          placeholder="Ej. The Whistler"
                          onChange={onFieldChange}
                          className="input-field"
                        />
                      </label>
                    ) : null}

                    {option.id === QUERY_TYPES.AUTHOR ? (
                      <label className="input-label">
                        Autor
                        <div className="input-stack">
                          <input
                            type="text"
                            name="author"
                            value={form.author}
                            placeholder="Ej. John Grisham"
                            onChange={onFieldChange}
                            autoComplete="off"
                            list="author-suggestions-list"
                            className="input-field"
                          />
                          <datalist id="author-suggestions-list">
                            {authorSuggestions.map((author) => (
                              <option key={author} value={author} />
                            ))}
                          </datalist>
                          {showAuthorSuggestions ? (
                            <>
                              <p className="author-suggestion-copy">
                                Sugerencias basadas en los autores ya cargados para esta semana.
                              </p>
                              <div className="author-suggestions" aria-label="Autores sugeridos">
                                {authorSuggestions.map((author) => (
                                  <button
                                    key={author}
                                    type="button"
                                    onClick={() => onAuthorSuggestionSelect(author)}
                                    className="author-suggestion-button"
                                  >
                                    {author}
                                  </button>
                                ))}
                              </div>
                            </>
                          ) : null}
                          {showAuthorSuggestionEmptyState ? (
                            <p className="author-suggestion-copy">
                              No hay coincidencias entre los autores de la lista cargada.
                            </p>
                          ) : null}
                        </div>
                      </label>
                    ) : null}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}
