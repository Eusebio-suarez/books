import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useThemeMode } from '../../app/useThemeMode';
import { MASS_MARKET_LIST } from './books.constants';
import { BooksGrid, BooksGridSkeleton } from './components/BooksGrid';
import { EmptyState } from './components/EmptyState';
import { QueryDetails } from './components/QueryDetails';
import { QueryMenu } from './components/QueryMenu';
import { ResultsHeader } from './components/ResultsHeader';
import { StatusBanner } from './components/StatusBanner';
import { useBooksQuery } from './hooks/useBooksQuery';
import { getAuthorSuggestions, getInitialFormState, getQuerySummary } from './books.utils';
import type { QueryType } from './types/index';

const HERO_STATS = [
  {
    label: 'Categoria',
    value: MASS_MARKET_LIST.displayName,
  },
  {
    label: 'Archivo',
    value: `${MASS_MARKET_LIST.oldestPublishedDate} a ${MASS_MARKET_LIST.newestPublishedDate}`,
  },
  {
    label: 'Cadencia',
    value: MASS_MARKET_LIST.cadence,
  },
];


export function BooksPage() {
  const [form, setForm] = useState(getInitialFormState);
  const { books, fetchedBooks, meta, status, isLoading, lastQuery, runQuery } =
    useBooksQuery();
  const { theme, toggleTheme } = useThemeMode();
  const activeDate = meta?.resolvedDate ?? MASS_MARKET_LIST.newestPublishedDate;
  const totalBooks = books.length;
  const summary = getQuerySummary(lastQuery, meta, totalBooks);
  const authorSuggestions = getAuthorSuggestions(fetchedBooks, form.author);
  const showSkeleton = isLoading && !totalBooks;

  function handleModeChange(queryType: QueryType): void {
    setForm((currentForm) => ({
      ...currentForm,
      queryType,
    }));
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

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void runQuery(form);
  }

  return (
    <main className="page-shell min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:gap-8">
        <section className="hero-shell px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.36em] text-[var(--accent-strong)]">
                  New York Times Books API
                </p>
                <h1 className="display-font mt-4 text-4xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-5xl">
                  Explorador editorial del archivo Mass Market Paperback
                </h1>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="theme-toggle self-start"
                aria-label={
                  theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
                }
              >
                {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
              <div className="grid gap-4 sm:grid-cols-3">
                {HERO_STATS.map((item) => (
                  <article key={item.label} className="metric-card">
                    <p className="metric-label">{item.label}</p>
                    <p className="metric-value">{item.value}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <QueryMenu
          form={form}
          isLoading={isLoading}
          authorSuggestions={authorSuggestions}
          onFieldChange={handleFieldChange}
          onAuthorSuggestionSelect={handleAuthorSuggestionSelect}
          onModeChange={handleModeChange}
          onSubmit={handleSubmit}
        />

        <section className="flex flex-col gap-6" aria-busy={isLoading}>
            <StatusBanner status={status} />

            <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <ResultsHeader
                meta={meta}
                summary={summary}
                totalBooks={totalBooks}
                isLoading={isLoading}
              />
              <QueryDetails meta={meta} totalBooks={totalBooks} />
            </section>

            {showSkeleton ? (
              <BooksGridSkeleton />
            ) : totalBooks ? (
              <BooksGrid books={books} activeDate={activeDate} />
            ) : (
              <EmptyState />
            )}
        </section>
      </div>
    </main>
  );
}
