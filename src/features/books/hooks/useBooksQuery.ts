import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BOOKS_STATUS_CODES,
  DEFAULT_QUERY,
  INITIAL_STATUS,
} from '../books.constants';
import {
  createStatus,
  filterBooksByQuery,
  hasDateAdjustment,
  normalizeToPublishedSunday,
  resolveRequestedDate,
  validateQueryForm,
} from '../books.utils';
import {
  fetchMassMarketBooks,
  isAbortError,
  NYTApiError,
} from '../services/nytBooks.service';
import type { UseBooksQueryResult, BookItem, BooksFormState, BooksMeta, QueryStatus } from '../types/index';

interface CachedWeekEntry {
  books: BookItem[];
  meta: BooksMeta;
}

export function useBooksQuery(initialQuery: BooksFormState = DEFAULT_QUERY): UseBooksQueryResult {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [fetchedBooks, setFetchedBooks] = useState<BookItem[]>([]);
  const [meta, setMeta] = useState<BooksMeta | null>(null);
  const [status, setStatus] = useState<QueryStatus>(INITIAL_STATUS);
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState<BooksFormState | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const weekCacheRef = useRef<Map<string, CachedWeekEntry>>(new Map());
  const requestIdRef = useRef(0);
  const initialQueryRef = useRef<BooksFormState>(initialQuery);

  const applyQueryResult = useCallback(
    (
      sourceBooks: BookItem[],
      sourceMeta: BooksMeta,
      form: BooksFormState,
      inputDate: string,
    ): void => {
      const viewMeta =
        sourceMeta.requestedDate === inputDate
          ? sourceMeta
          : {
              ...sourceMeta,
              requestedDate: inputDate,
            };
      const filteredBooks = filterBooksByQuery(sourceBooks, form);

      setFetchedBooks(sourceBooks);
      setMeta(viewMeta);
      setBooks(filteredBooks);
      setLastQuery({ ...form, date: inputDate });

      if (!filteredBooks.length) {
        setStatus(
          createStatus(
            'warning',
            BOOKS_STATUS_CODES.NO_RESULTS,
            'No se encontraron libros que coincidan con tu consulta en esa semana.',
          ),
        );
        return;
      }

      if (hasDateAdjustment(viewMeta)) {
        setStatus(
          createStatus(
            'info',
            BOOKS_STATUS_CODES.DATE_ADJUSTED,
            `La fecha solicitada se ajusto a ${viewMeta.resolvedDate} porque esta lista solo se publicaba los domingos.`,
          ),
        );
        return;
      }

      setStatus(
        createStatus(
          'success',
          BOOKS_STATUS_CODES.QUERY_SUCCESS,
          'Consulta completada correctamente.',
        ),
      );
    },
    [],
  );

  const runQuery = useCallback(async (form: BooksFormState) => {
    const validationStatus = validateQueryForm(form);

    if (validationStatus) {
      setStatus(validationStatus);
      return;
    }

    const inputDate = resolveRequestedDate(form);
    let resolvedDate: string;

    try {
      resolvedDate = normalizeToPublishedSunday(inputDate);
    } catch (error) {
      if (error instanceof Error && error.message === BOOKS_STATUS_CODES.INVALID_DATE) {
        setBooks([]);
        setFetchedBooks([]);
        setMeta(null);
        setLastQuery(null);
        setStatus(
          createStatus(
            'error',
            BOOKS_STATUS_CODES.INVALID_DATE,
            'Ingresa una fecha valida en formato YYYY-MM-DD.',
          ),
        );
      }

      return;
    }

    const cachedWeek = weekCacheRef.current.get(resolvedDate);

    if (cachedWeek) {
      abortRef.current?.abort();
      requestIdRef.current += 1;
      setIsLoading(false);
      applyQueryResult(cachedWeek.books, cachedWeek.meta, form, inputDate);
      return;
    }

    abortRef.current?.abort();

    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;

    abortRef.current = controller;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setStatus(
      createStatus(
        'info',
        BOOKS_STATUS_CODES.LOADING,
        'Consultando la Books API del New York Times...',
      ),
    );

    try {
      const response = await fetchMassMarketBooks(inputDate, {
        signal: controller.signal,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      weekCacheRef.current.set(response.meta.resolvedDate, {
        books: response.books,
        meta: response.meta,
      });
      applyQueryResult(response.books, response.meta, form, inputDate);
    } catch (error: unknown) {
      if (isAbortError(error) || requestId !== requestIdRef.current) {
        return;
      }

      setBooks([]);
      setFetchedBooks([]);
      setMeta(null);
      setLastQuery(null);

      if (error instanceof NYTApiError) {
        setStatus(createStatus('error', error.code, error.message));
      } else {
        setStatus(
          createStatus(
            'error',
            BOOKS_STATUS_CODES.UNKNOWN_ERROR,
            'Ocurrio un error inesperado al consultar la API.',
          ),
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [applyQueryResult]);

  useEffect(() => {
    void runQuery(initialQueryRef.current);

    return () => {
      abortRef.current?.abort();
    };
  }, [runQuery]);

  return {
    books,
    fetchedBooks,
    meta,
    status,
    isLoading,
    lastQuery,
    runQuery,
  };
}
