import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpDown,
  BarChart3,
  BookOpen,
  BookText,
  Building2,
  CalendarDays,
  Clock3,
  Database,
  ExternalLink,
  FileText,
  Globe,
  Hash,
  Info,
  Moon,
  Newspaper,
  Ruler,
  Shield,
  ShoppingCart,
  Store,
  Sun,
  Tag,
  Trophy,
  UserRound,
} from 'lucide-react';
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

function hasText(value: string | null | undefined): value is string {
  return Boolean(value && value.trim().length > 0);
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

function getCoverDimensionsLabel(book: BookItem): string {
  if (!book.imageWidth || !book.imageHeight) {
    return '';
  }

  return `${book.imageWidth} x ${book.imageHeight}px`;
}

function getPriceLabel(book: BookItem): string {
  if (book.price === null || book.price <= 0) {
    return '';
  }

  return `USD ${book.price.toFixed(2)}`;
}

function getContributorLabel(book: BookItem): string {
  return book.contributor.trim() || book.author.trim();
}

function getContributionNoteLabel(book: BookItem): string {
  return book.contributorNote.trim();
}

function getAgeGroupLabel(book: BookItem): string {
  return book.ageGroup.trim();
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

function getEditorialLinks(book: BookItem) {
  return [
    {
      label: 'Review del NYT',
      href: book.bookReviewLink,
      icon: Newspaper,
    },
    {
      label: 'Primer capitulo',
      href: book.firstChapterLink,
      icon: BookOpen,
    },
    {
      label: 'Sunday Review',
      href: book.sundayReviewLink,
      icon: FileText,
    },
    {
      label: 'Articulo relacionado',
      href: book.articleChapterLink,
      icon: ExternalLink,
    },
  ].filter((item) => Boolean(item.href));
}

function resolvePurchaseLinkMeta(name: string): {
  icon: typeof ShoppingCart;
  toneClass: string;
} {
  const normalizedName = name.trim().toLowerCase();

  if (normalizedName === 'amazon') {
    return {
      icon: ShoppingCart,
      toneClass: 'detail-link-pill-store-amazon',
    };
  }

  if (normalizedName === 'apple books') {
    return {
      icon: BookOpen,
      toneClass: 'detail-link-pill-store-apple-books',
    };
  }

  if (normalizedName === 'barnes and noble') {
    return {
      icon: BookText,
      toneClass: 'detail-link-pill-store-barnes-and-noble',
    };
  }

  if (normalizedName === 'books-a-million') {
    return {
      icon: Tag,
      toneClass: 'detail-link-pill-store-books-a-million',
    };
  }

  if (normalizedName === 'bookshop.org') {
    return {
      icon: Globe,
      toneClass: 'detail-link-pill-store-bookshop-org',
    };
  }

  return {
    icon: Store,
    toneClass: 'detail-link-pill-store-generic',
  };
}

function getPurchaseLinks(book: BookItem) {
  const seenUrls = new Set<string>();

  return book.buyLinks.flatMap((link, index) => {
    const label = link.name.trim();
    const href = link.url.trim();

    if (!label || !href || seenUrls.has(href)) {
      return [];
    }

    seenUrls.add(href);

    const { icon, toneClass } = resolvePurchaseLinkMeta(label);

    return [
      {
        id: `${label}-${index}`,
        label,
        href,
        icon,
        toneClass,
      },
    ];
  });
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

function isOfflineMode(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
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
      const offlineMode = isOfflineMode();

      setIsLoading(true);
      setBook(null);
      setMeta(null);
      setStatus(
        offlineMode
          ? createStatus(
              'info',
              BOOKS_STATUS_CODES.OFFLINE_CACHE_MODE,
              'Sin conexion: intentando abrir la ficha con datos cacheados.',
            )
          : getInitialStatus(),
      );

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
          offlineMode
            ? createStatus(
                'info',
                BOOKS_STATUS_CODES.OFFLINE_CACHE_MODE,
                'Sin conexion: ficha cargada desde cache local.',
              )
            : createStatus(
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
          if (
            error.code === BOOKS_STATUS_CODES.NETWORK_ERROR &&
            isOfflineMode()
          ) {
            setStatus(
              createStatus(
                'warning',
                BOOKS_STATUS_CODES.OFFLINE_CACHE_MISS,
                'Sin conexion y sin cache disponible para esta ficha. Conectate para volver a intentarlo.',
              ),
            );
          } else {
            setStatus(createStatus('error', error.code, error.message));
          }
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
  const editorialLinks = book ? getEditorialLinks(book) : [];
  const purchaseLinks = book ? getPurchaseLinks(book) : [];
  const isbnEntries = book ? getUniqueIsbns(book) : [];

  const primaryStats = book
    ? [
        {
          label: 'Ranking',
          value: `#${book.rank}`,
          icon: Trophy,
        },
        {
          label: 'Movimiento',
          value: getRankMovementLabel(book),
          icon: ArrowUpDown,
        },
        {
          label: 'Semanas en lista',
          value: book.weeksOnList.toString(),
          icon: Clock3,
        },
      ]
    : [];

  const bibliographicDetails = book
    ? [
        {
          label: 'Contribucion',
          value: getContributorLabel(book),
          icon: UserRound,
        },
        {
          label: 'Nota del contribuidor',
          value: getContributionNoteLabel(book),
          icon: FileText,
        },
        {
          label: 'Grupo de edad',
          value: getAgeGroupLabel(book),
          icon: BookText,
        },
        {
          label: 'Precio reportado',
          value: getPriceLabel(book),
          icon: Tag,
        },
        {
          label: 'Resolucion de portada',
          value: getCoverDimensionsLabel(book),
          icon: Ruler,
        },
      ]
          .filter((item) => hasText(item.value))
    : [];

  const chronologyAndApiDetails = [
    {
      label: 'Fecha solicitada',
      value: meta?.requestedDate || route.date,
      icon: CalendarDays,
    },
    {
      label: 'Fecha consultada',
      value: meta?.resolvedDate || route.date,
      icon: CalendarDays,
    },
    {
      label: 'Fecha bestseller',
      value: meta?.bestsellersDate || '',
      icon: CalendarDays,
    },
    {
      label: 'Publicacion NYT',
      value: meta?.publishedDate || '',
      icon: CalendarDays,
    },
    {
      label: 'Actualizacion de lista',
      value: meta?.updated || '',
      icon: Clock3,
    },
    {
      label: 'Corte de lista',
      value: meta?.normalListEndsAt != null ? `Top ${meta.normalListEndsAt}` : '',
      icon: BarChart3,
    },
    {
      label: 'Ultimo cambio API',
      value: meta?.lastModified || '',
      icon: Clock3,
    },
    {
      label: 'Resultados en respuesta',
      value: meta?.numResults != null ? meta.numResults.toString() : '',
      icon: BarChart3,
    },
    {
      label: 'Estado de API',
      value: meta?.apiStatus || '',
      icon: Shield,
    },
    {
      label: 'Lista interna',
      value: meta?.listName || '',
      icon: Database,
    },
    {
      label: 'Etiqueta visible',
      value: meta?.displayName || '',
      icon: BookText,
    },
    {
      label: 'Copyright',
      value: meta?.copyright || '',
      icon: Info,
    },
  ].filter((item) => hasText(item.value));

  const identifierEntries = book
    ? [
        ...isbnEntries.map((entry) => ({
          ...entry,
          icon: Hash,
          isMonospace: true,
        })),
        ...(hasText(book.bookUri)
          ? [
              {
                label: 'Referencia NYT',
                value: book.bookUri,
                icon: Globe,
                isMonospace: true,
              },
            ]
          : []),
      ]
    : [];

  return (
    <main className="page-shell min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:gap-8">
        <section className="hero-shell px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-3xl">
                <p className="section-title">Ficha editorial</p>
                <h1 className="display-font mt-2 text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                  {book?.title || 'Ficha editorial en proceso'}
                </h1>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                  Semana de referencia {meta?.resolvedDate || route.date}
                </p>
              </div>

              <div className="books-hero-actions">
                <a href="/" className="theme-toggle no-underline">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
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
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Moon className="h-4 w-4" aria-hidden="true" />
                  )}
                  {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                </button>
              </div>
            </div>

            {book ? (
              <div className="flex flex-wrap gap-2">
                <span className="meta-chip">
                  <UserRound className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                  {book.author}
                </span>
                <span className="meta-chip">
                  <Building2 className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                  {book.publisher || 'Editorial desconocida'}
                </span>
                <span className="meta-chip">
                  <CalendarDays className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                  Bestseller {meta?.bestsellersDate || route.date}
                </span>
                <span className="meta-chip">
                  <CalendarDays className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                  Consulta {meta?.resolvedDate || route.date}
                </span>
                {notationBadges.map((badge) => (
                  <span key={badge} className="meta-chip">
                    <Info className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                    {badge}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {shouldShowStatus ? <StatusBanner status={status} compact /> : null}

        {book ? (
          <section
            className="grid gap-5 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.2fr)]"
            aria-busy={isLoading}
          >
            <aside className="self-start lg:sticky lg:top-6">
              <article className="book-card detail-cover-card overflow-hidden">
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

                <div className="grid gap-3 p-4 sm:p-5">
                  <p className="section-title">Vista rapida</p>
                  <div className="grid gap-2">
                    <p className="detail-inline-metric">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      {book.weeksOnList} semanas en lista
                    </p>
                    <p className="detail-inline-metric">
                      <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                      {getRankMovementLabel(book)}
                    </p>
                    <p className="detail-inline-metric">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                      Bestseller {meta?.bestsellersDate || route.date}
                    </p>
                  </div>
                </div>
              </article>
            </aside>

            <div className="flex flex-col gap-4">
              <section className="panel detail-panel">
                <div className="flex flex-col gap-4">
                  <p className="section-title">De que trata</p>
                  <p className="text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                    {book.description ||
                      'El New York Times no incluyo una descripcion para este titulo.'}
                  </p>

                  <div className="detail-kpi-grid">
                    {primaryStats.map((item) => {
                      const Icon = item.icon;

                      return (
                        <article key={item.label} className="detail-kpi-card">
                          <p className="detail-kpi-label detail-kpi-label-with-icon">
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                            {item.label}
                          </p>
                          <p className="detail-kpi-value">{item.value}</p>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section className="panel detail-panel">
                <p className="detail-subtitle detail-subtitle-with-icon">
                  <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
                  Comprar este libro
                </p>

                {purchaseLinks.length ? (
                  <div className="detail-link-list mt-3">
                    {purchaseLinks.map((item) => {
                      const Icon = item.icon;

                      return (
                        <a
                          key={item.id}
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          className={`detail-link-pill detail-link-pill-purchase ${item.toneClass}`}
                        >
                          <Icon className="h-3.5 w-3.5 detail-link-icon" aria-hidden="true" />
                          {item.label}
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                    No hay enlaces de compra disponibles para este libro.
                  </p>
                )}
              </section>

              <div className="detail-technical-stack">
                <details className="panel detail-panel detail-collapsible">
                  <summary className="detail-collapsible-summary">
                    <span className="detail-collapsible-heading">
                      <BookText className="h-3.5 w-3.5" aria-hidden="true" />
                      Datos bibliograficos
                    </span>
                  </summary>
                  <div className="detail-collapsible-content">
                    {bibliographicDetails.length ? (
                      <dl className="detail-meta-list detail-meta-list-compact">
                        {bibliographicDetails.map((item) => {
                          const Icon = item.icon;

                          return (
                            <div key={item.label} className="detail-meta-row">
                              <dt className="detail-meta-term detail-meta-term-with-icon">
                                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                {item.label}
                              </dt>
                              <dd className="detail-meta-description">{item.value}</dd>
                            </div>
                          );
                        })}
                      </dl>
                    ) : (
                      <p className="text-sm leading-6 text-[var(--text-secondary)]">
                        No hay datos bibliograficos adicionales para mostrar.
                      </p>
                    )}

                    {identifierEntries.length ? (
                      <section className="detail-collapsible-block">
                        <p className="detail-subtitle detail-subtitle-with-icon">
                          <Hash className="h-3.5 w-3.5" aria-hidden="true" />
                          Identificadores tecnicos
                        </p>
                        <div className="detail-code-list">
                          {identifierEntries.map((entry) => {
                            const Icon = entry.icon;

                            return (
                              <div key={`${entry.label}-${entry.value}`} className="detail-code-pill">
                                <p className="detail-code-label detail-code-label-with-icon">
                                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                  {entry.label}
                                </p>
                                <p
                                  className={`detail-code-value ${
                                    entry.isMonospace ? 'detail-meta-description-mono' : ''
                                  }`}
                                >
                                  {entry.value}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    ) : null}
                  </div>
                </details>

                <details className="panel detail-panel detail-collapsible">
                  <summary className="detail-collapsible-summary">
                    <span className="detail-collapsible-heading">
                      <Database className="h-3.5 w-3.5" aria-hidden="true" />
                      Cronologia y metadatos API
                    </span>
                  </summary>
                  <div className="detail-collapsible-content">
                    {chronologyAndApiDetails.length ? (
                      <dl className="detail-meta-list detail-meta-list-compact">
                        {chronologyAndApiDetails.map((item) => {
                          const Icon = item.icon;

                          return (
                            <div key={item.label} className="detail-meta-row">
                              <dt className="detail-meta-term detail-meta-term-with-icon">
                                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                {item.label}
                              </dt>
                              <dd className="detail-meta-description">{item.value}</dd>
                            </div>
                          );
                        })}
                      </dl>
                    ) : (
                      <p className="text-sm leading-6 text-[var(--text-secondary)]">
                        No hay metadatos de API adicionales para mostrar.
                      </p>
                    )}
                  </div>
                </details>

                <details className="panel detail-panel detail-collapsible">
                  <summary className="detail-collapsible-summary">
                    <span className="detail-collapsible-heading">
                      <Newspaper className="h-3.5 w-3.5" aria-hidden="true" />
                      Recursos editoriales
                    </span>
                  </summary>
                  <div className="detail-collapsible-content">
                    {editorialLinks.length ? (
                      <div className="detail-link-list">
                        {editorialLinks.map((item) => {
                          const Icon = item.icon;

                          return (
                            <a
                              key={item.label}
                              href={item.href}
                              target="_blank"
                              rel="noreferrer"
                              className="detail-link-pill detail-link-pill-editorial"
                            >
                              <Icon className="h-3.5 w-3.5 detail-link-icon" aria-hidden="true" />
                              {item.label}
                            </a>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm leading-6 text-[var(--text-secondary)]">
                        No hay enlaces editoriales adicionales para este libro.
                      </p>
                    )}
                  </div>
                </details>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
