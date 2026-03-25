import type { BookItem } from './types/index';

type RouteBook = Pick<BookItem, 'primaryIsbn13' | 'bookUri' | 'title' | 'author'>;

export type BooksRoute =
  | { view: 'list' }
  | { view: 'detail'; date: string; bookId: string }
  | { view: 'not-found' };

const DETAIL_ROUTE_SEGMENT = 'books';

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getBookRouteId(book: RouteBook): string {
  const readableSource = `${book.title}-${book.author}`;
  const uniqueSource = book.primaryIsbn13 || book.bookUri || readableSource;
  const uniquePart = slugify(uniqueSource);
  const readablePart = slugify(readableSource);

  if (uniquePart && readablePart && uniquePart !== readablePart) {
    return `${uniquePart}-${readablePart}`;
  }

  return uniquePart || readablePart || 'book';
}

export function buildBookDetailPath(date: string, book: RouteBook): string {
  return `/${DETAIL_ROUTE_SEGMENT}/${date}/${getBookRouteId(book)}`;
}

export function parseBooksRoute(pathname: string): BooksRoute {
  const trimmedPath = trimSlashes(pathname);

  if (!trimmedPath) {
    return { view: 'list' };
  }

  const segments = trimmedPath.split('/');

  if (segments[0] === DETAIL_ROUTE_SEGMENT && segments.length === 3) {
    const [, date, bookId] = segments;

    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && bookId) {
      return {
        view: 'detail',
        date,
        bookId,
      };
    }
  }

  return { view: 'not-found' };
}
