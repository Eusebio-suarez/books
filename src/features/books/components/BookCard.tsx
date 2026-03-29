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

export function BookCard({ book, detailPath }: BookCardProps) {
  const [imageSrc, setImageSrc] = useState<string>(book.image || placeholderCover);

  return (
    <a
      href={detailPath}
      className="book-card compact-book-card compact-book-card-link group"
      aria-label={`Abrir ficha detallada de ${book.title}`}
    >
      <div className="compact-book-cover">
        <img
          src={imageSrc}
          alt={`Portada de ${book.title}`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          onError={() => setImageSrc(placeholderCover)}
        />

        <div className="compact-book-overlay">
          <span className="meta-chip-strong">#{book.rank}</span>
          <span className="compact-book-badge">{getRankMovementLabel(book)}</span>
        </div>
      </div>

      <div className="compact-book-body">
        <h3 className="compact-book-title">{book.title}</h3>
        <p className="compact-book-author">{book.author}</p>
      </div>
    </a>
  );
}
