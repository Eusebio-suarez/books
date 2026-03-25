import { useState } from 'react';
import placeholderCover from '../../../assets/book-placeholder.svg';
import type { BookCardProps, BookItem } from '../types/index';

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

export function BookCard({ book, detailPath }: BookCardProps) {
  const [imageSrc, setImageSrc] = useState<string>(book.image || placeholderCover);

  return (
    <article className="book-card group flex h-full flex-col transition hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--surface-secondary)]">
        <img
          src={imageSrc}
          alt={`Portada de ${book.title}`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          onError={() => setImageSrc(placeholderCover)}
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
          <span className="meta-chip-strong">#{book.rank}</span>
          <span className="meta-chip bg-white/70 text-slate-900">
            {getRankMovementLabel(book)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 p-4">
        <div className="flex flex-wrap gap-2">
          <span className="meta-chip">{book.weeksOnList} semanas en lista</span>
          <span className="meta-chip">Semana previa {getPreviousRankLabel(book)}</span>
        </div>

        <div>
          <h3 className="display-font text-xl font-semibold leading-tight text-[var(--text-primary)]">
            <a
              href={detailPath}
              className="no-underline transition hover:text-[var(--accent)]"
              aria-label={`Abrir ficha detallada de ${book.title}`}
            >
              {book.title}
            </a>
          </h3>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            {book.author}
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            {book.publisher || 'Editorial desconocida'}
          </p>
        </div>

        <div className="helper-card text-sm leading-6">
          Puesto actual <span className="font-semibold text-[var(--text-primary)]">#{book.rank}</span>.
          {' '}
          {getRankMovementLabel(book)} frente a la semana anterior.
        </div>

        <div className="mt-auto">
          <a
            href={detailPath}
            className="theme-toggle w-full justify-center text-center no-underline"
          >
            Ver ficha completa
          </a>
        </div>
      </div>
    </article>
  );
}
