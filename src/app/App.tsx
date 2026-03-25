import { useEffect, useState } from 'react';
import { BookDetailsPage } from '../features/books/BookDetailsPage';
import { BooksPage } from '../features/books/BooksPage';
import { parseBooksRoute, type BooksRoute } from '../features/books/books.routes';
import { useThemeMode } from './useThemeMode';

function getCurrentRoute(): BooksRoute {
  if (typeof window === 'undefined') {
    return { view: 'list' };
  }

  return parseBooksRoute(window.location.pathname);
}

function NotFoundPage() {
  const { theme, toggleTheme } = useThemeMode();

  return (
    <main className="page-shell min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 lg:gap-8">
        <section className="hero-shell px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.36em] text-[var(--accent-strong)]">
                  Ruta no encontrada
                </p>
                <h1 className="display-font mt-4 text-4xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-5xl">
                  Esta ficha no existe dentro del explorador
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                  La URL no coincide con una ficha dinamica valida. Puedes volver al
                  listado principal y seguir explorando el archivo historico.
                </p>
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

            <div className="flex flex-wrap gap-3">
              <a href="/" className="primary-button no-underline">
                Volver al explorador
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function App() {
  const [route, setRoute] = useState<BooksRoute>(getCurrentRoute);

  useEffect(() => {
    function handlePopState(): void {
      setRoute(parseBooksRoute(window.location.pathname));
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  if (route.view === 'detail') {
    return <BookDetailsPage route={route} />;
  }

  if (route.view === 'not-found') {
    return <NotFoundPage />;
  }

  return <BooksPage />;
}
