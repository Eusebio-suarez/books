import { useEffect, useState } from 'react';
import placeholderCover from '../../assets/book-placeholder.svg';
import { useThemeMode } from '../../app/useThemeMode';
import { BOOKS_STATUS_CODES } from './books.constants';
import { type BooksRoute, getBookRouteId } from './books.routes';
import { StatusBanner } from './components/StatusBanner';
import { createStatus } from './books.utils';
import {
  fetchMassMarketBooks,
  isAbortError,
  NYTApiError,
} from './services/nytBooks.service';
import type { BookItem, BooksMeta, QueryStatus } from './types/index';

interface BookDetailsPageProps {
  route: Extract<BooksRoute, { view: 'detail' }>;
}

function getRankMovementLabel(book: BookItem): string {
  if (book.rankLastWeek <= 0) {
    return 'Nuevo ingreso';
  }

  const delta = book.rankLastWeek - book.rank;

  if (delta > 0) {
    return `Sube ${delta}`;
  }

  if (delta < 0) {
    return `Baja ${Math.abs(delta)}`;
  }

  return 'Sin cambio';
}

function getPreviousRankLabel(book: BookItem): string {
  return book.rankLastWeek > 0 ? `#${book.rankLastWeek}` : 'Nuevo ingreso';
}

function getCoverDimensionsLabel(book: BookItem): string {
  if (!book.imageWidth || !book.imageHeight) {
    return 'No disponibles';
  }

  return `${book.imageWidth} x ${book.imageHeight}px`;
}

function getPriceLabel(book: BookItem): string {
  if (book.price === null || book.price <= 0) {
    return 'No disponible';
  }

  return `USD ${book.price}`;
}

function getContributorLabel(book: BookItem): string {
  return book.contributor || book.author || 'No disponible';
}

function getContributionNoteLabel(book: BookItem): string {
  return book.contributorNote || 'Sin nota adicional';
}

function getAgeGroupLabel(book: BookItem): string {
  return book.ageGroup || 'General';
}

function getNotationBadges(book: BookItem): string[] {
  const labels: string[] = [];

  if (book.asterisk > 0) {
    labels.push(`Asterisco ${book.asterisk}`);
  }

  if (book.dagger > 0) {
    labels.push(`Daga ${book.dagger}`);
  }

  return labels;
}

function getAvailableLinks(book: BookItem): Array<{ label: string; href: string }> {
  return [
    {
      label: 'Review del NYT',
      href: book.bookReviewLink,
    },
    {
      label: 'Primer capitulo',
      href: book.firstChapterLink,
    },
    {
      label: 'Sunday Review',
      href: book.sundayReviewLink,
    },
    {
      label: 'Articulo relacionado',
      href: book.articleChapterLink,
    },
    {
      label: 'Comprar en Amazon',
      href: book.amazonUrl,
    },
  ].filter((item) => Boolean(item.href));
}

function getUniqueIsbns(book: BookItem): Array<{ label: string; value: string }> {
  const seen = new Set<string>();
  const isbnEntries = [
    {
      label: 'ISBN10 principal',
      value: book.primaryIsbn10,
    },
    {
      label: 'ISBN13 principal',
      value: book.primaryIsbn13,
    },
    ...book.isbns.flatMap((isbn, index) => [
      {
        label: `ISBN10 alterno ${index + 1}`,
        value: isbn.isbn10,
      },
      {
        label: `ISBN13 alterno ${index + 1}`,
        value: isbn.isbn13,
      },
    ]),
  ];

  return isbnEntries.filter((entry) => {
    const normalizedValue = entry.value.trim();

    if (!normalizedValue || seen.has(normalizedValue)) {
      return false;
    }

    seen.add(normalizedValue);
    return true;
  });
}

function getInitialStatus(): QueryStatus {
  return createStatus(
    'info',
    BOOKS_STATUS_CODES.LOADING,
    'Buscando la ficha del libro en el archivo del New York Times...',
  );
}

export function BookDetailsPage({ route }: BookDetailsPageProps) {
  const { theme, toggleTheme } = useThemeMode();
  const [book, setBook] = useState<BookItem | null>(null);
  const [meta, setMeta] = useState<BooksMeta | null>(null);
  const [status, setStatus] = useState<QueryStatus>(getInitialStatus);
  const [isLoading, setIsLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState(placeholderCover);

  useEffect(() => {
    const controller = new AbortController();

    async function loadBookDetails(): Promise<void> {
      setIsLoading(true);
      setBook(null);
      setMeta(null);
      setStatus(getInitialStatus());

      try {
        const response = await fetchMassMarketBooks(route.date, {
          signal: controller.signal,
        });
        const matchedBook =
          response.books.find((item) => getBookRouteId(item) === route.bookId) || null;

        setMeta(response.meta);

        if (!matchedBook) {
          setStatus(
            createStatus(
              'warning',
              BOOKS_STATUS_CODES.NO_RESULTS,
              'No encontramos este libro dentro de la semana consultada.',
            ),
          );
          return;
        }

        setBook(matchedBook);
        setStatus(
          createStatus(
            'success',
            BOOKS_STATUS_CODES.QUERY_SUCCESS,
            'Ficha del libro cargada correctamente.',
          ),
        );
      } catch (error: unknown) {
        if (isAbortError(error)) {
          return;
        }

        setBook(null);
        setMeta(null);

        if (error instanceof NYTApiError) {
          setStatus(createStatus('error', error.code, error.message));
        } else {
          setStatus(
            createStatus(
              'error',
              BOOKS_STATUS_CODES.UNKNOWN_ERROR,
              'Ocurrio un error inesperado al cargar la ficha del libro.',
            ),
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadBookDetails();

    return () => {
      controller.abort();
    };
  }, [route.bookId, route.date]);

  useEffect(() => {
    setImageSrc(book?.image || placeholderCover);
  }, [book]);

  const shouldShowStatus = isLoading || !book || status.tone !== 'success';
  const notationBadges = book ? getNotationBadges(book) : [];
  const availableLinks = book ? getAvailableLinks(book) : [];
  const isbnEntries = book ? getUniqueIsbns(book) : [];
  const summaryCards = book
    ? [
        {
          label: 'Ranking actual',
          value: `#${book.rank}`,
        },
        {
          label: 'Semana previa',
          value: getPreviousRankLabel(book),
        },
        {
          label: 'Movimiento',
          value: getRankMovementLabel(book),
        },
        {
          label: 'Semanas en lista',
          value: book.weeksOnList.toString(),
        },
        {
          label: 'Editorial',
          value: book.publisher || 'No disponible',
        },
        {
          label: 'Contribucion',
          value: getContributorLabel(book),
        },
        {
          label: 'Precio reportado',
          value: getPriceLabel(book),
        },
      ]
    : [];
  const timelineCards = [
    {
      label: 'Fecha solicitada',
      value: meta?.requestedDate || route.date,
    },
    {
      label: 'Fecha consultada',
      value: meta?.resolvedDate || route.date,
    },
    {
      label: 'Fecha bestseller',
      value: meta?.bestsellersDate || 'Pendiente',
    },
    {
      label: 'Publicacion NYT',
      value: meta?.publishedDate || 'Pendiente',
    },
    {
      label: 'Actualizacion',
      value: meta?.updated || 'Pendiente',
    },
    {
      label: 'Corte de lista',
      value: meta?.normalListEndsAt ? `Top ${meta.normalListEndsAt}` : 'No disponible',
    },
    {
      label: 'Ultimo cambio API',
      value: meta?.lastModified || 'Pendiente',
    },
    {
      label: 'Resultados en respuesta',
      value: meta?.numResults ? meta.numResults.toString() : 'No disponible',
    },
  ];

  return (
    <main className="page-shell min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:gap-8">
        <section className="hero-shell px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.36em] text-[var(--accent-strong)]">
                  Detalle del libro
                </p>
                <h1 className="display-font mt-4 text-4xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-5xl">
                  {book?.title || 'Ficha editorial en proceso'}
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                  {book
                    ? `Vista ampliada para ${book.author} dentro de la semana ${meta?.bestsellersDate || route.date}.`
                    : `La aplicacion vuelve a consultar la semana ${route.date} para reconstruir la ficha del libro desde el mismo endpoint.`}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a href="/" className="theme-toggle no-underline">
                  Volver al explorador
                </a>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="theme-toggle"
                  aria-label={
                    theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
                  }
                >
                  {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="meta-chip">Semana consultada {meta?.resolvedDate || route.date}</span>
              {book?.author ? <span className="meta-chip">{book.author}</span> : null}
              {book?.publisher ? <span className="meta-chip">{book.publisher}</span> : null}
              {notationBadges.map((badge) => (
                <span key={badge} className="meta-chip">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </section>

        {shouldShowStatus ? <StatusBanner status={status} /> : null}

        {book ? (
          <section
            className="grid gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]"
            aria-busy={isLoading}
          >
            <article className="book-card overflow-hidden">
              <div className="relative aspect-[4/5] overflow-hidden bg-[var(--surface-secondary)]">
                <img
                  src={imageSrc}
                  alt={`Portada de ${book.title}`}
                  className="h-full w-full object-cover"
                  onError={() => setImageSrc(placeholderCover)}
                />

                <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
                  <span className="meta-chip-strong">#{book.rank}</span>
                  <span className="meta-chip bg-white/70 text-slate-900">
                    {getRankMovementLabel(book)}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 p-5">
                <div className="flex flex-wrap gap-2">
                  <span className="meta-chip">
                    {book.publisher || 'Editorial desconocida'}
                  </span>
                  <span className="meta-chip">{book.weeksOnList} semanas en lista</span>
                  <span className="meta-chip">Portada {getCoverDimensionsLabel(book)}</span>
                  <span className="meta-chip">Precio {getPriceLabel(book)}</span>
                </div>

                <div className="helper-card text-sm leading-6">
                  <p className="font-semibold text-[var(--text-primary)]">Sinopsis</p>
                  <p className="mt-3">
                    {book.description ||
                      'El New York Times no incluyo una descripcion para este titulo.'}
                  </p>
                </div>

                <div className="helper-card text-sm leading-6">
                  <p className="font-semibold text-[var(--text-primary)]">Lectura rapida</p>
                  <p className="mt-3">
                    Este titulo aparece en el puesto #{book.rank} y registra{' '}
                    {book.weeksOnList} semanas en lista. El comportamiento frente a la
                    semana anterior es: {getRankMovementLabel(book).toLowerCase()}.
                  </p>
                </div>
              </div>
            </article>

            <div className="flex flex-col gap-6">
              <section className="panel">
                <div className="flex flex-col gap-5">
                  <div>
                    <p className="section-title">Ficha editorial</p>
                    <h2 className="display-font mt-3 text-3xl font-semibold text-[var(--text-primary)]">
                      {book.title}
                    </h2>
                    <p className="mt-3 text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                      {book.author}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {summaryCards.map((item) => (
                      <article key={item.label} className="metric-card">
                        <p className="metric-label">{item.label}</p>
                        <p className="metric-value">{item.value}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <div className="helper-card text-sm leading-6">
                  <p className="font-semibold text-[var(--text-primary)]">
                    Contexto editorial
                  </p>
                  <p className="mt-3">
                    {book.title} aparece dentro de la lista{' '}
                    <span className="font-semibold text-[var(--text-primary)]">
                      {meta?.displayName || 'Mass Market Paperback'}
                    </span>
                    {' '}del New York Times. La editorial reportada es{' '}
                    <span className="font-semibold text-[var(--text-primary)]">
                      {book.publisher || 'no disponible'}
                    </span>
                    {' '}y la linea de contribucion publicada es{' '}
                    <span className="font-semibold text-[var(--text-primary)]">
                      {getContributorLabel(book)}
                    </span>
                    {' '}y la fecha bestseller asociada es{' '}
                    <span className="font-semibold text-[var(--text-primary)]">
                      {meta?.bestsellersDate || route.date}
                    </span>.
                  </p>
                </div>

                <div className="helper-card text-sm leading-6">
                  <p className="font-semibold text-[var(--text-primary)]">
                    Desempeno en ranking
                  </p>
                  <p className="mt-3">
                    El libro esta actualmente en{' '}
                    <span className="font-semibold text-[var(--text-primary)]">
                      #{book.rank}
                    </span>
                    , venia de{' '}
                    <span className="font-semibold text-[var(--text-primary)]">
                      {getPreviousRankLabel(book)}
                    </span>
                    {' '}y suma{' '}
                    <span className="font-semibold text-[var(--text-primary)]">
                      {book.weeksOnList} semanas
                    </span>
                    {' '}dentro de esta lista archivada.
                  </p>
                </div>
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <div className="helper-card text-sm leading-6">
                  <p className="font-semibold text-[var(--text-primary)]">
                    Datos bibliograficos
                  </p>
                  <p className="mt-3">
                    Contribucion: {getContributorLabel(book)}
                  </p>
                  <p className="mt-2">
                    Nota del contribuidor: {getContributionNoteLabel(book)}
                  </p>
                  <p className="mt-2">
                    Grupo de edad: {getAgeGroupLabel(book)}
                  </p>
                  <p className="mt-2">
                    Precio reportado: {getPriceLabel(book)}
                  </p>
                </div>

                <div className="helper-card text-sm leading-6">
                  <p className="font-semibold text-[var(--text-primary)]">
                    Identificadores del libro
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    {isbnEntries.length ? (
                      isbnEntries.map((entry) => (
                        <div key={`${entry.label}-${entry.value}`}>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                            {entry.label}
                          </p>
                          <p className="mt-1 break-all font-mono text-sm text-[var(--text-primary)]">
                            {entry.value}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p>No hay ISBNs adicionales disponibles.</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="grid gap-3 sm:grid-cols-2">
                {timelineCards.map((item) => (
                  <article key={item.label} className="metric-card">
                    <p className="metric-label">{item.label}</p>
                    <p className="metric-value">{item.value}</p>
                  </article>
                ))}
              </section>

              <section className="panel-soft grid gap-4 p-5">
                <div className="helper-card text-sm leading-6">
                  <p className="font-semibold text-[var(--text-primary)]">
                    Metadatos del archivo
                  </p>
                  <p className="mt-2">
                    Estado de API: {meta?.apiStatus || 'No disponible'}
                  </p>
                  <p className="mt-2">
                    Lista interna: {meta?.listName || 'No disponible'}
                  </p>
                  <p className="mt-2">
                    Etiqueta visible: {meta?.displayName || 'No disponible'}
                  </p>
                  <p className="mt-2">
                    Resolucion de portada: {getCoverDimensionsLabel(book)}
                  </p>
                  <p className="mt-2">
                    Copyright: {meta?.copyright || 'No disponible'}
                  </p>
                </div>

                <div className="helper-card text-sm leading-6">
                  <p className="font-semibold text-[var(--text-primary)]">
                    Enlaces relacionados
                  </p>
                  {availableLinks.length ? (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {availableLinks.map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          className="theme-toggle no-underline"
                        >
                          {item.label}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2">No hay enlaces editoriales adicionales para este libro.</p>
                  )}
                </div>

                <div className="helper-card text-sm leading-6">
                  <p className="font-semibold text-[var(--text-primary)]">Referencia NYT</p>
                  <p className="mt-2 break-all font-mono text-xs text-[var(--text-secondary)]">
                    {book.bookUri || 'No disponible'}
                  </p>
                </div>

                <a href="/" className="theme-toggle justify-center no-underline">
                  Volver a la lista principal
                </a>
              </section>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
