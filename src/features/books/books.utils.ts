import {
  BOOKS_STATUS_CODES,
  DEFAULT_QUERY,
  MASS_MARKET_LIST,
  QUERY_TYPES,
} from './books.constants';
import type {
  BookItem,
  BooksFormState,
  BooksMeta,
  BooksStatusCode,
  QueryStatus,
  QueryTone,
} from './types/index';

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

export function createStatus(
  tone: QueryTone,
  code: BooksStatusCode,
  message: string,
): QueryStatus {
  return { tone, code, message };
}

export function getInitialFormState(): BooksFormState {
  return { ...DEFAULT_QUERY };
}

export function resolveRequestedDate(form: BooksFormState): string {
  return form.queryType === QUERY_TYPES.LATEST
    ? MASS_MARKET_LIST.newestPublishedDate
    : form.date;
}

export function validateQueryForm(form: BooksFormState): QueryStatus | null {
  if (form.queryType === QUERY_TYPES.TITLE && !form.title.trim()) {
    return createStatus(
      'warning',
      BOOKS_STATUS_CODES.MISSING_TITLE,
      'Debes escribir un titulo para hacer la consulta.',
    );
  }

  if (form.queryType === QUERY_TYPES.AUTHOR && !form.author.trim()) {
    return createStatus(
      'warning',
      BOOKS_STATUS_CODES.MISSING_AUTHOR,
      'Debes escribir el nombre de un autor para hacer la consulta.',
    );
  }

  return null;
}

export function normalizeToPublishedSunday(inputDate: string): string {
  const selected = new Date(`${inputDate}T12:00:00Z`);
  const oldest = new Date(`${MASS_MARKET_LIST.oldestPublishedDate}T12:00:00Z`);
  const newest = new Date(`${MASS_MARKET_LIST.newestPublishedDate}T12:00:00Z`);

  if (Number.isNaN(selected.getTime())) {
    throw new Error(BOOKS_STATUS_CODES.INVALID_DATE);
  }

  selected.setUTCDate(selected.getUTCDate() - selected.getUTCDay());

  if (selected < oldest) {
    return MASS_MARKET_LIST.oldestPublishedDate;
  }

  if (selected > newest) {
    return MASS_MARKET_LIST.newestPublishedDate;
  }

  return selected.toISOString().slice(0, 10);
}

export function filterBooksByQuery(
  books: BookItem[],
  form: BooksFormState,
): BookItem[] {
  if (form.queryType === QUERY_TYPES.TITLE) {
    const title = normalizeSearchValue(form.title);
    return books.filter((book) => normalizeSearchValue(book.title).includes(title));
  }

  if (form.queryType === QUERY_TYPES.AUTHOR) {
    const author = normalizeSearchValue(form.author);
    return books.filter((book) => normalizeSearchValue(book.author).includes(author));
  }

  return books;
}

export function getAuthorSuggestions(
  books: BookItem[],
  authorQuery: string,
  limit = 6,
): string[] {
  const normalizedQuery = normalizeSearchValue(authorQuery);

  if (!normalizedQuery) {
    return [];
  }

  const uniqueAuthors = books.reduce<Map<string, string>>((authors, book) => {
    const author = book.author.trim();
    const normalizedAuthor = normalizeSearchValue(author);

    if (author && !authors.has(normalizedAuthor)) {
      authors.set(normalizedAuthor, author);
    }

    return authors;
  }, new Map());

  return Array.from(uniqueAuthors.values())
    .filter((author) => {
      const normalizedAuthor = normalizeSearchValue(author);
      return (
        normalizedAuthor.includes(normalizedQuery) &&
        normalizedAuthor !== normalizedQuery
      );
    })
    .sort((firstAuthor, secondAuthor) => {
      const firstNormalized = normalizeSearchValue(firstAuthor);
      const secondNormalized = normalizeSearchValue(secondAuthor);
      const firstStartsWithQuery = firstNormalized.startsWith(normalizedQuery);
      const secondStartsWithQuery = secondNormalized.startsWith(normalizedQuery);

      if (firstStartsWithQuery !== secondStartsWithQuery) {
        return firstStartsWithQuery ? -1 : 1;
      }

      return firstAuthor.localeCompare(secondAuthor);
    })
    .slice(0, limit);
}

export function hasDateAdjustment(meta: BooksMeta | null): boolean {
  return Boolean(meta && meta.requestedDate !== meta.resolvedDate);
}

export function getQuerySummary(
  lastQuery: BooksFormState | null,
  meta: Pick<BooksMeta, 'bestsellersDate'> | null,
  totalBooks: number,
): string {
  if (!meta || !lastQuery) {
    return 'Selecciona una consulta del menu y la aplicacion mostrara los libros disponibles para esa semana.';
  }

  if (lastQuery.queryType === QUERY_TYPES.TITLE) {
    return `Resultados para "${lastQuery.title}" en la semana del ${meta.bestsellersDate}.`;
  }

  if (lastQuery.queryType === QUERY_TYPES.AUTHOR) {
    return `Resultados para ${lastQuery.author} en la semana del ${meta.bestsellersDate}.`;
  }

  if (lastQuery.queryType === QUERY_TYPES.DATE) {
    return `${totalBooks} libros encontrados para la semana del ${meta.bestsellersDate}.`;
  }

  return `Lista mas reciente del archivo cargada desde ${meta.bestsellersDate}.`;
}
