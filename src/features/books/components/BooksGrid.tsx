import type { BooksGridProps } from '../types/index';
import { buildBookDetailPath } from '../books.routes';
import { BookCard } from './BookCard';

const SKELETON_ITEMS = Array.from({ length: 6 }, (_, index) => index);

export function BooksGrid({ books, activeDate }: BooksGridProps) {
  return (
    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {books.map((book) => (
        <BookCard
          key={`${book.primaryIsbn13}-${book.rank}`}
          book={book}
          detailPath={buildBookDetailPath(activeDate, book)}
        />
      ))}
    </section>
  );
}

export function BooksGridSkeleton() {
  return (
    <section
      className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      aria-hidden="true"
    >
      {SKELETON_ITEMS.map((item) => (
        <article key={item} className="book-card overflow-hidden">
          <div className="skeleton-block aspect-[4/5] w-full" />
          <div className="grid gap-4 p-5">
            <div className="grid gap-2">
              <div className="skeleton-block h-4 w-24" />
              <div className="skeleton-block h-9 w-4/5" />
              <div className="skeleton-block h-4 w-2/5" />
            </div>
            <div className="grid gap-2">
              <div className="skeleton-block h-3.5 w-full" />
              <div className="skeleton-block h-3.5 w-full" />
              <div className="skeleton-block h-3.5 w-5/6" />
            </div>
            <div className="grid gap-2 rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--surface-secondary)] p-4">
              <div className="skeleton-block h-3.5 w-2/3" />
              <div className="skeleton-block h-3.5 w-1/2" />
            </div>
            <div className="skeleton-block h-11 w-full rounded-full" />
          </div>
        </article>
      ))}
    </section>
  );
}
