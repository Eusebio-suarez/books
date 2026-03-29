import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, CalendarDays, Filter, Moon, Sun, X } from 'lucide-react';
import { useThemeMode } from '../../app/useThemeMode';
import { MASS_MARKET_LIST, QUERY_TYPES } from './books.constants';
import { BooksGrid, BooksGridSkeleton } from './components/BooksGrid';
import { EmptyState } from './components/EmptyState';
import { QueryMenu } from './components/QueryMenu';
import { ResultsHeader } from './components/ResultsHeader';
import { StatusBanner } from './components/StatusBanner';
import { useBooksQuery } from './hooks/useBooksQuery';
import { getAuthorSuggestions, getInitialFormState, getQuerySummary } from './books.utils';
import type { QueryType } from './types/index';

const HERO_STATS = [
  {
    label: 'Lista',
    value: MASS_MARKET_LIST.displayName,
    icon: BookOpen,
  },
  {
    label: 'Rango',
    value: `${MASS_MARKET_LIST.oldestPublishedDate} a ${MASS_MARKET_LIST.newestPublishedDate}`,
    icon: CalendarDays,
  },
];

export function BooksPage() {
  const [form, setForm] = useState(getInitialFormState);
  const { books, fetchedBooks, meta, status, isLoading, lastQuery, runQuery } =
    useBooksQuery();
  const hasAutoAppliedRef = useRef(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(min-width: 1024px)').matches
      : false,
  );
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const closeDrawerButtonRef = useRef<HTMLButtonElement | null>(null);
  const filterToggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const { theme, toggleTheme } = useThemeMode();
  const activeDate = meta?.resolvedDate ?? MASS_MARKET_LIST.newestPublishedDate;
  const totalBooks = books.length;
  const summary = getQuerySummary(lastQuery, meta, totalBooks);
  const authorSuggestions = getAuthorSuggestions(fetchedBooks, form.author);
  const showSkeleton = isLoading && !totalBooks;

  const closeFiltersDrawer = useCallback(
    (restoreFocus = false): void => {
      setIsFiltersOpen(false);

      if (!restoreFocus || isDesktop || typeof window === 'undefined') {
        return;
      }

      window.requestAnimationFrame(() => {
        filterToggleButtonRef.current?.focus();
      });
    },
    [isDesktop],
  );

  function handleModeChange(queryType: QueryType): void {
    setForm((currentForm) => {
      if (currentForm.queryType === queryType) {
        return currentForm;
      }

      return {
        ...currentForm,
        queryType,
      };
    });
  }

  function handleFieldChange(event: ChangeEvent<HTMLInputElement>): void {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function handleAuthorSuggestionSelect(author: string): void {
    setForm((currentForm) => ({
      ...currentForm,
      author,
    }));
  }

  useEffect(() => {
    if (!hasAutoAppliedRef.current) {
      hasAutoAppliedRef.current = true;
      return;
    }

    const shouldDebounceTextQuery =
      form.queryType === QUERY_TYPES.TITLE || form.queryType === QUERY_TYPES.AUTHOR;
    const timeoutId = window.setTimeout(
      () => {
        void runQuery(form);
      },
      shouldDebounceTextQuery ? 320 : 0,
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [form, runQuery]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const desktopMedia = window.matchMedia('(min-width: 1024px)');
    const syncViewport = (event?: MediaQueryListEvent): void => {
      const matches = event ? event.matches : desktopMedia.matches;
      setIsDesktop(matches);

      if (matches) {
        setIsFiltersOpen(false);
      }
    };

    syncViewport();
    desktopMedia.addEventListener('change', syncViewport);

    return () => {
      desktopMedia.removeEventListener('change', syncViewport);
    };
  }, []);

  useEffect(() => {
    if (!isFiltersOpen || isDesktop) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDesktop, isFiltersOpen]);

  useEffect(() => {
    if (!isFiltersOpen || isDesktop) {
      return;
    }

    closeDrawerButtonRef.current?.focus();

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        closeFiltersDrawer(true);
      }
    }

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [closeFiltersDrawer, isDesktop, isFiltersOpen]);

  return (
    <main className="page-shell min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[96rem] flex-col gap-6 lg:gap-8">
        <section className="hero-shell books-hero px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4">
            <div className="books-hero-head">
              <div className="max-w-3xl">
                <p className="section-title">Archivo Editorial NYT</p>
                <h1 className="books-hero-title display-font">Mass Market Paperback</h1>
                <p className="books-hero-copy">
                  Explora la coleccion historica por fecha, titulo o autor con una vista
                  enfocada en la lectura del catalogo.
                </p>
              </div>

              <div className="books-hero-actions">
                {!isDesktop ? (
                  <button
                    ref={filterToggleButtonRef}
                    type="button"
                    onClick={() => setIsFiltersOpen(true)}
                    className="theme-toggle books-filter-toggle"
                    aria-label="Abrir filtros de busqueda"
                    aria-controls="books-filters-drawer"
                    aria-expanded={isFiltersOpen}
                    aria-haspopup="dialog"
                  >
                    <Filter className="h-4 w-4" aria-hidden="true" />
                    Filtros
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="theme-toggle"
                  aria-label={
                    theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
                  }
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Moon className="h-4 w-4" aria-hidden="true" />
                  )}
                  {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                </button>
              </div>
            </div>

            <div className="books-hero-meta">
              {HERO_STATS.map((item) => (
                <span key={item.label} className="books-hero-chip">
                  <item.icon className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                  <span className="books-hero-chip-label">{item.label}</span>
                  <span>{item.value}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="books-layout" aria-busy={isLoading}>
          {isDesktop ? (
            <aside className="books-sidebar">
              <div className="books-sidebar-sticky">
                <QueryMenu
                  form={form}
                  isLoading={isLoading}
                  authorSuggestions={authorSuggestions}
                  onFieldChange={handleFieldChange}
                  onAuthorSuggestionSelect={handleAuthorSuggestionSelect}
                  onModeChange={handleModeChange}
                />

                <StatusBanner status={status} compact />
              </div>
            </aside>
          ) : null}

          <div className="books-main">
            <section className="panel results-overview">
              <ResultsHeader
                meta={meta}
                summary={summary}
                totalBooks={totalBooks}
                isLoading={isLoading}
              />
            </section>

            {!isDesktop ? (
              <section className="books-mobile-status">
                <StatusBanner status={status} compact />
              </section>
            ) : null}

            {showSkeleton ? (
              <BooksGridSkeleton />
            ) : totalBooks ? (
              <BooksGrid books={books} activeDate={activeDate} />
            ) : (
              <EmptyState />
            )}
          </div>
        </section>
      </div>

      {!isDesktop && typeof document !== 'undefined'
        ? createPortal(
            <>
              <div
                className={`books-drawer-backdrop ${isFiltersOpen ? 'is-open' : ''}`}
                onClick={() => closeFiltersDrawer(true)}
                aria-hidden={!isFiltersOpen}
              />

              <aside
                id="books-filters-drawer"
                className={`books-drawer ${isFiltersOpen ? 'books-drawer-open' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-label="Filtros de busqueda"
                aria-hidden={!isFiltersOpen}
              >
                <div className="books-drawer-surface">
                  <header className="books-drawer-head">
                    <p className="section-title">Panel movil</p>
                    <button
                      ref={closeDrawerButtonRef}
                      type="button"
                      onClick={() => closeFiltersDrawer(true)}
                      className="theme-toggle books-drawer-close"
                      aria-label="Cerrar filtros"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      Cerrar
                    </button>
                  </header>

                  <div className="books-drawer-content">
                    <QueryMenu
                      form={form}
                      isLoading={isLoading}
                      authorSuggestions={authorSuggestions}
                      onFieldChange={handleFieldChange}
                      onAuthorSuggestionSelect={handleAuthorSuggestionSelect}
                      onModeChange={handleModeChange}
                      onFilterCommit={() => closeFiltersDrawer(true)}
                    />

                    <StatusBanner status={status} compact />
                  </div>
                </div>
              </aside>
            </>,
            document.body,
          )
        : null}
    </main>
  );
}
