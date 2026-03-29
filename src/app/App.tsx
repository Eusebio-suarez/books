import { useEffect, useState } from 'react';
import { NetworkStatusBanner } from './NetworkStatusBanner';
import { BookDetailsPage } from '../features/books/BookDetailsPage';
import { BooksPage } from '../features/books/BooksPage';
import { parseBooksRoute, type BooksRoute } from '../features/books/books.routes';
import { useNetworkStatus } from './useNetworkStatus';
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
                <p className="section-title">Ruta no encontrada</p>
                <h1 className="display-font mt-4 text-4xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-5xl">
                  No encontramos esta ruta del explorador
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                  La URL no coincide con una ficha valida del archivo. Vuelve al
                  listado principal para continuar la exploracion.
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
                Volver al listado
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
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    function handlePopState(): void {
      setRoute(parseBooksRoute(window.location.pathname));
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <>
      <NetworkStatusBanner isOnline={isOnline} />
      {route.view === 'detail' ? <BookDetailsPage route={route} /> : null}
      {route.view === 'not-found' ? <NotFoundPage /> : null}
      {route.view === 'list' ? <BooksPage /> : null}
    </>
  );
}
