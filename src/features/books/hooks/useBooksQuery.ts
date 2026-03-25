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
  resolveRequestedDate,
  validateQueryForm,
} from '../books.utils';
import {
  fetchMassMarketBooks,
  isAbortError,
  NYTApiError,
} from '../services/nytBooks.service';
import type { UseBooksQueryResult, BookItem, BooksFormState, BooksMeta, QueryStatus } from '../types/index';

export function useBooksQuery(initialQuery: BooksFormState = DEFAULT_QUERY): UseBooksQueryResult {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [fetchedBooks, setFetchedBooks] = useState<BookItem[]>([]);
  const [meta, setMeta] = useState<BooksMeta | null>(null);
  const [status, setStatus] = useState<QueryStatus>(INITIAL_STATUS);
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState<BooksFormState | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const initialQueryRef = useRef<BooksFormState>(initialQuery);

  const runQuery = useCallback(async (form: BooksFormState) => {
    const validationStatus = validateQueryForm(form);

    if (validationStatus) {
      setStatus(validationStatus);
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
      const inputDate = resolveRequestedDate(form);
      const response = await fetchMassMarketBooks(inputDate, {
        signal: controller.signal,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      const filteredBooks = filterBooksByQuery(response.books, form);

      setFetchedBooks(response.books);
      setMeta(response.meta);
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

      if (hasDateAdjustment(response.meta)) {
        setStatus(
          createStatus(
            'info',
            BOOKS_STATUS_CODES.DATE_ADJUSTED,
            `La fecha solicitada se ajusto a ${response.meta.resolvedDate} porque esta lista solo se publicaba los domingos.`,
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
  }, []);

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
