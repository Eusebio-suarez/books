import type { BooksGridProps } from '../types/index';
import { buildBookDetailPath } from '../books.routes';
import { BookCard } from './BookCard';

const SKELETON_ITEMS = Array.from({ length: 6 }, (_, index) => index);

export function BooksGrid({ books, activeDate }: BooksGridProps) {
  return (
    <section className="books-grid">
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
    <section className="books-grid" aria-hidden="true">
      {SKELETON_ITEMS.map((item) => (
        <article key={item} className="book-card compact-book-card overflow-hidden">
          <div className="skeleton-block aspect-[3/4] w-full" />
          <div className="grid gap-3 p-4">
            <div className="flex gap-2">
              <div className="skeleton-block h-6 w-20 rounded-full" />
              <div className="skeleton-block h-6 w-16 rounded-full" />
            </div>
            <div className="grid gap-2">
              <div className="skeleton-block h-8 w-5/6" />
              <div className="skeleton-block h-3.5 w-2/3" />
              <div className="skeleton-block h-3.5 w-3/4" />
            </div>
            <div className="skeleton-block h-4 w-20" />
          </div>
        </article>
      ))}
    </section>
  );
}
