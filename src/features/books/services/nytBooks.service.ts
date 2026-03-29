import { BOOKS_STATUS_CODES, MASS_MARKET_LIST } from '../books.constants';
import { normalizeToPublishedSunday } from '../books.utils';
import type {
  BookItem,
  BooksMeta,
  BooksResponse,
  FetchMassMarketBooksOptions,
  NYTErrorPayload,
  RawNYTBook,
  RawNYTResults,
} from '../types/index';

const API_BASE_URL = 'https://api.nytimes.com/svc/books/v3';
const API_KEY = import.meta.env.VITE_NYT_API_KEY;

export class NYTApiError extends Error {
  code: typeof BOOKS_STATUS_CODES[keyof typeof BOOKS_STATUS_CODES];
  statusCode: number;

  constructor(
    message: string,
    code: typeof BOOKS_STATUS_CODES[keyof typeof BOOKS_STATUS_CODES] = BOOKS_STATUS_CODES.BAD_RESPONSE,
    statusCode = 500,
  ) {
    super(message);
    this.name = 'NYTApiError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function ensureApiKey(): void {
  if (!API_KEY) {
    throw new NYTApiError(
      'No se encontro la API key. Define VITE_NYT_API_KEY en el archivo .env.',
      BOOKS_STATUS_CODES.MISSING_API_KEY,
      401,
    );
  }
}

function buildUrl(pathname: string): URL {
  const url = new URL(`${API_BASE_URL}${pathname}`);
  url.searchParams.set('api-key', API_KEY);
  return url;
}

function buildApiError(
  statusCode: number,
  payload: NYTErrorPayload,
  requestedDate: string,
): NYTApiError {
  const apiMessage =
    payload.errors?.[0] ||
    payload.fault?.faultstring ||
    payload.message ||
    '';

  if (statusCode === 401) {
    return new NYTApiError(
      'La API key del New York Times no es valida o no tiene permisos para esta consulta.',
      BOOKS_STATUS_CODES.INVALID_API_KEY,
      401,
    );
  }

  if (statusCode === 429) {
    return new NYTApiError(
      'La cuota de peticiones del NYT se excedio. Espera unos minutos e intenta de nuevo.',
      BOOKS_STATUS_CODES.RATE_LIMIT,
      429,
    );
  }

  if (apiMessage.toLowerCase().includes('list not found')) {
    return new NYTApiError(
      `No existe una lista para ${requestedDate}. La app ajusta fechas al domingo mas cercano dentro del rango historico disponible.`,
      BOOKS_STATUS_CODES.LIST_NOT_FOUND,
      404,
    );
  }

  return new NYTApiError(
    apiMessage || 'No fue posible completar la consulta al New York Times.',
    BOOKS_STATUS_CODES.BAD_RESPONSE,
    statusCode || 500,
  );
}

function mapIsbns(isbns: RawNYTBook['isbns'] = []): BookItem['isbns'] {
  return isbns.map((isbn) => ({
    isbn10: isbn.isbn10 ?? '',
    isbn13: isbn.isbn13 ?? '',
  }));
}

function mapBuyLinks(
  buyLinks: RawNYTBook['buy_links'] = [],
  amazonUrl = '',
): BookItem['buyLinks'] {
  const seen = new Set<string>();
  const mappedLinks = buyLinks.flatMap((entry) => {
    const name = entry.name?.trim() ?? '';
    const url = entry.url?.trim() ?? '';

    if (!name || !url || seen.has(url)) {
      return [];
    }

    seen.add(url);
    return [{ name, url }];
  });

  if (!mappedLinks.length) {
    const normalizedAmazonUrl = amazonUrl.trim();

    if (normalizedAmazonUrl) {
      return [
        {
          name: 'Amazon',
          url: normalizedAmazonUrl,
        },
      ];
    }
  }

  return mappedLinks;
}

function mapBook(book: RawNYTBook): BookItem {
  const amazonUrl = book.amazon_product_url ?? '';

  return {
    rank: book.rank ?? 0,
    rankLastWeek: book.rank_last_week ?? 0,
    weeksOnList: book.weeks_on_list ?? 0,
    asterisk: book.asterisk ?? 0,
    dagger: book.dagger ?? 0,
    title: book.title ?? '',
    author: book.author ?? '',
    contributor: book.contributor ?? '',
    contributorNote: book.contributor_note ?? '',
    description: book.description ?? '',
    publisher: book.publisher ?? '',
    price: typeof book.price === 'number' ? book.price : null,
    ageGroup: book.age_group ?? '',
    image: book.book_image ?? '',
    imageWidth: book.book_image_width ?? 0,
    imageHeight: book.book_image_height ?? 0,
    amazonUrl,
    bookReviewLink: book.book_review_link ?? '',
    firstChapterLink: book.first_chapter_link ?? '',
    sundayReviewLink: book.sunday_review_link ?? '',
    articleChapterLink: book.article_chapter_link ?? '',
    bookUri: book.book_uri ?? '',
    primaryIsbn10: book.primary_isbn10 ?? '',
    primaryIsbn13: book.primary_isbn13 ?? '',
    isbns: mapIsbns(book.isbns),
    buyLinks: mapBuyLinks(book.buy_links, amazonUrl),
  };
}

function mapMeta(
  inputDate: string,
  resolvedDate: string,
  payload: NYTErrorPayload,
  results: RawNYTResults,
): BooksMeta {
  return {
    apiStatus: payload.status ?? '',
    copyright: payload.copyright ?? '',
    numResults: payload.num_results ?? 0,
    lastModified: payload.last_modified ?? '',
    requestedDate: inputDate,
    resolvedDate,
    listName: results.list_name ?? '',
    displayName: results.display_name ?? '',
    publishedDate: results.published_date ?? '',
    bestsellersDate: results.bestsellers_date ?? '',
    updated: results.updated ?? '',
    normalListEndsAt: results.normal_list_ends_at ?? null,
  };
}

export async function fetchMassMarketBooks(
  inputDate = MASS_MARKET_LIST.newestPublishedDate,
  options: FetchMassMarketBooksOptions = {},
): Promise<BooksResponse> {
  ensureApiKey();

  let resolvedDate: string;

  try {
    resolvedDate = normalizeToPublishedSunday(inputDate);
  } catch (error) {
    if (error instanceof Error && error.message === BOOKS_STATUS_CODES.INVALID_DATE) {
      throw new NYTApiError(
        'Ingresa una fecha valida en formato YYYY-MM-DD.',
        BOOKS_STATUS_CODES.INVALID_DATE,
        400,
      );
    }

    throw error;
  }

  const url = buildUrl(`/lists/${resolvedDate}/${MASS_MARKET_LIST.slug}.json`);

  let response: Response;

  try {
    response = await fetch(url, { signal: options.signal });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    throw new NYTApiError(
      'No fue posible conectarse al New York Times. Revisa tu conexion e intenta de nuevo.',
      BOOKS_STATUS_CODES.NETWORK_ERROR,
      503,
    );
  }

  const payload = (await response.json().catch(() => ({}))) as NYTErrorPayload;

  if (!response.ok || payload.status === 'ERROR') {
    throw buildApiError(response.status, payload, resolvedDate);
  }

  const results = payload.results;

  if (!results?.books) {
    throw new NYTApiError(
      'La respuesta del NYT no incluyo libros para esta lista.',
      BOOKS_STATUS_CODES.BAD_RESPONSE,
      500,
    );
  }

  return {
    meta: mapMeta(inputDate, resolvedDate, payload, results),
    books: results.books.map(mapBook),
  };
}
