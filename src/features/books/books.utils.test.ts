import assert from 'node:assert/strict';
import test from 'node:test';
import { MASS_MARKET_LIST, QUERY_TYPES } from './books.constants';
import {
  buildBookDetailPath,
  getBookRouteId,
  parseBooksRoute,
} from './books.routes';
import {
  filterBooksByQuery,
  getAuthorSuggestions,
  getQuerySummary,
  normalizeToPublishedSunday,
  validateQueryForm,
} from './books.utils';
import type { BookItem, BooksMeta } from './types/index';

function createBook(overrides: Partial<BookItem>): BookItem {
  return {
    rank: 1,
    rankLastWeek: 0,
    weeksOnList: 1,
    asterisk: 0,
    dagger: 0,
    title: 'Placeholder',
    author: 'Placeholder',
    contributor: '',
    contributorNote: '',
    description: '',
    publisher: '',
    price: null,
    ageGroup: '',
    image: '',
    imageWidth: 0,
    imageHeight: 0,
    amazonUrl: '',
    bookReviewLink: '',
    firstChapterLink: '',
    sundayReviewLink: '',
    articleChapterLink: '',
    bookUri: '',
    primaryIsbn10: '',
    primaryIsbn13: '',
    isbns: [],
    ...overrides,
  };
}

test('normalizeToPublishedSunday keeps sunday dates', () => {
  assert.equal(normalizeToPublishedSunday('2017-01-29'), '2017-01-29');
});

test('normalizeToPublishedSunday moves any weekday to the previous sunday', () => {
  assert.equal(normalizeToPublishedSunday('2017-01-26'), '2017-01-22');
});

test('normalizeToPublishedSunday clamps the supported archived range', () => {
  assert.equal(
    normalizeToPublishedSunday('2007-01-01'),
    MASS_MARKET_LIST.oldestPublishedDate,
  );
  assert.equal(
    normalizeToPublishedSunday('2020-01-01'),
    MASS_MARKET_LIST.newestPublishedDate,
  );
});

test('validateQueryForm enforces title and author queries', () => {
  assert.equal(
    validateQueryForm({
      queryType: QUERY_TYPES.TITLE,
      date: '',
      title: '',
      author: '',
    })?.code,
    'MISSING_TITLE',
  );

  assert.equal(
    validateQueryForm({
      queryType: QUERY_TYPES.AUTHOR,
      date: '',
      title: '',
      author: '',
    })?.code,
    'MISSING_AUTHOR',
  );
});

test('filterBooksByQuery filters by title and author without changing other queries', () => {
  const books = [
    createBook({ title: 'The Whistler', author: 'John Grisham' }),
    createBook({ title: 'Night School', author: 'Lee Child' }),
  ];

  assert.deepEqual(
    filterBooksByQuery(books, {
      queryType: QUERY_TYPES.TITLE,
      date: '',
      title: 'whis',
      author: '',
    }),
    [createBook({ title: 'The Whistler', author: 'John Grisham' })],
  );

  assert.deepEqual(
    filterBooksByQuery(books, {
      queryType: QUERY_TYPES.AUTHOR,
      date: '',
      title: '',
      author: 'lee',
    }),
    [createBook({ title: 'Night School', author: 'Lee Child' })],
  );
});

test('getAuthorSuggestions returns unique matches and prioritizes prefix matches', () => {
  const books = [
    createBook({ author: 'John Grisham' }),
    createBook({ author: 'Jojo Moyes' }),
    createBook({ author: 'Banjo Cole' }),
    createBook({ author: 'John Grisham' }),
  ];

  assert.deepEqual(getAuthorSuggestions(books, 'jo'), [
    'John Grisham',
    'Jojo Moyes',
    'Banjo Cole',
  ]);

  assert.deepEqual(getAuthorSuggestions(books, 'john grisham'), []);
});

test('books routes build and parse a dynamic book detail path', () => {
  const book = createBook({
    title: 'The Whistler',
    author: 'John Grisham',
    primaryIsbn13: '9780385541190',
  });

  assert.equal(
    buildBookDetailPath('2017-01-29', book),
    '/books/2017-01-29/9780385541190-the-whistler-john-grisham',
  );

  assert.deepEqual(parseBooksRoute('/books/2017-01-29/9780385541190-the-whistler-john-grisham'), {
    view: 'detail',
    date: '2017-01-29',
    bookId: getBookRouteId(book),
  });

  assert.deepEqual(parseBooksRoute('/ruta-invalida'), {
    view: 'not-found',
  });
});

test('getQuerySummary returns the correct copy for each query type', () => {
  const meta: Pick<BooksMeta, 'bestsellersDate'> = { bestsellersDate: '2017-01-29' };

  assert.equal(
    getQuerySummary(
      {
        queryType: QUERY_TYPES.LATEST,
        date: '',
        title: '',
        author: '',
      },
      meta,
      15,
    ),
    'Lista mas reciente del archivo cargada desde 2017-01-29.',
  );

  assert.equal(
    getQuerySummary(
      {
        queryType: QUERY_TYPES.TITLE,
        date: '',
        title: 'The Whistler',
        author: '',
      },
      meta,
      1,
    ),
    'Resultados para "The Whistler" en la semana del 2017-01-29.',
  );
});
