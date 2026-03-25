import { MASS_MARKET_LIST, MENU_OPTIONS, QUERY_TYPES } from '../books.constants';
import type { QueryMenuProps, QueryType } from '../types/index';

function getButtonCopy(queryType: QueryType): string {
  if (queryType === QUERY_TYPES.TITLE) {
    return 'Buscar titulo';
  }

  if (queryType === QUERY_TYPES.AUTHOR) {
    return 'Buscar autor';
  }

  if (queryType === QUERY_TYPES.DATE) {
    return 'Consultar fecha';
  }

  return 'Cargar lista';
}

export function QueryMenu({
  form,
  isLoading,
  authorSuggestions,
  onFieldChange,
  onAuthorSuggestionSelect,
  onModeChange,
  onSubmit,
}: QueryMenuProps) {
  const needsDate = form.queryType !== QUERY_TYPES.LATEST;
  const isAuthorQuery = form.queryType === QUERY_TYPES.AUTHOR;
  const usesWeeklyFilter =
    form.queryType === QUERY_TYPES.TITLE || isAuthorQuery;
  const hasAuthorInput = Boolean(form.author.trim());
  const showAuthorSuggestions =
    isAuthorQuery && hasAuthorInput && authorSuggestions.length > 0;
  const showAuthorSuggestionEmptyState =
    isAuthorQuery && hasAuthorInput && !authorSuggestions.length;

  return (
    <section className="panel">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <p className="section-title">Control de consulta</p>
       
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {MENU_OPTIONS.map((option) => {
            const isActive = form.queryType === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onModeChange(option.id)}
                aria-pressed={isActive}
                className={`interactive-card text-left ${
                  isActive ? 'interactive-card-active' : 'text-[var(--text-primary)]'
                }`}
              >
                <span className="block text-sm font-semibold tracking-[0.04em]">
                  {option.label}
                </span>
                <span
                  className={`mt-2 block text-sm leading-6 ${
                    isActive ? 'text-white/80' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>

        <form onSubmit={onSubmit} className="panel-soft grid gap-4 p-5">
          <div className="helper-card text-sm leading-6">
            <p className="font-semibold text-[var(--text-primary)]">Antes de consultar</p>
            <p className="mt-2">
              Esta lista se publicaba cada domingo. Si eliges otra fecha, la app consulta
              el domingo anterior mas cercano dentro del archivo.
            </p>
          </div>

          {usesWeeklyFilter ? (
            <div className="helper-card text-sm leading-6">
              Los filtros por titulo y autor se aplican sobre la semana seleccionada, no
              sobre todo el archivo historico.
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] lg:items-end">
            {needsDate ? (
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
              <div className="helper-card text-sm leading-6">
                <p className="font-semibold text-[var(--text-primary)]">Fecha automatica</p>
                <p className="mt-2">
                  Se usa la fecha mas reciente disponible del archivo:{' '}
                  {MASS_MARKET_LIST.newestPublishedDate}.
                </p>
              </div>
            )}

            {form.queryType === QUERY_TYPES.TITLE ? (
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

            {isAuthorQuery ? (
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

            <button
              type="submit"
              disabled={isLoading}
              className="primary-button w-full lg:min-w-[12rem]"
            >
              {isLoading ? 'Consultando...' : getButtonCopy(form.queryType)}
            </button>
          </div>

          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            Rango disponible: {MASS_MARKET_LIST.oldestPublishedDate} a{' '}
            {MASS_MARKET_LIST.newestPublishedDate}.
          </p>
        </form>
      </div>
    </section>
  );
}
