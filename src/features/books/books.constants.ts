import type {
  BooksFormState,
  BooksStatusCode,
  ListConfig,
  MenuOption,
  QueryStatus,
  QueryType,
} from './types/index';

export const QUERY_TYPES = {
  LATEST: 'latest',
  DATE: 'date',
  TITLE: 'title',
  AUTHOR: 'author',
} as const satisfies Record<string, QueryType>;

export const BOOKS_STATUS_CODES = {
  ARCHIVED_LIST: 'ARCHIVED_LIST',
  LOADING: 'LOADING',
  OFFLINE_CACHE_MODE: 'OFFLINE_CACHE_MODE',
  OFFLINE_CACHE_MISS: 'OFFLINE_CACHE_MISS',
  QUERY_SUCCESS: 'QUERY_SUCCESS',
  DATE_ADJUSTED: 'DATE_ADJUSTED',
  NO_RESULTS: 'NO_RESULTS',
  MISSING_TITLE: 'MISSING_TITLE',
  MISSING_AUTHOR: 'MISSING_AUTHOR',
  MISSING_API_KEY: 'MISSING_API_KEY',
  INVALID_DATE: 'INVALID_DATE',
  INVALID_API_KEY: 'INVALID_API_KEY',
  RATE_LIMIT: 'RATE_LIMIT',
  LIST_NOT_FOUND: 'LIST_NOT_FOUND',
  BAD_RESPONSE: 'BAD_RESPONSE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const satisfies Record<string, BooksStatusCode>;

export const MASS_MARKET_LIST: ListConfig = {
  name: 'Mass Market Paperback',
  displayName: 'Paperback Mass-Market Fiction',
  slug: 'mass-market-paperback',
  oldestPublishedDate: '2008-06-08',
  newestPublishedDate: '2017-01-29',
  cadence: 'WEEKLY',
};

export const DEFAULT_QUERY: BooksFormState = {
  queryType: QUERY_TYPES.LATEST,
  date: MASS_MARKET_LIST.newestPublishedDate,
  title: '',
  author: '',
};

export const INITIAL_STATUS: QueryStatus = {
  tone: 'info',
  code: BOOKS_STATUS_CODES.ARCHIVED_LIST,
  message:
    'La categoria Mass Market Paperback es archivada. Se usa 2017-01-29 como fecha mas reciente disponible.',
};

export const MENU_OPTIONS: MenuOption[] = [
  {
    id: QUERY_TYPES.LATEST,
    label: 'Ultima lista',
    description: 'Carga la fecha mas reciente disponible del archivo.',
  },
  {
    id: QUERY_TYPES.DATE,
    label: 'Por fecha',
    description: 'Consulta una semana historica especifica.',
  },
  {
    id: QUERY_TYPES.TITLE,
    label: 'Por titulo',
    description: 'Filtra la lista historica por nombre del libro.',
  },
  {
    id: QUERY_TYPES.AUTHOR,
    label: 'Por autor',
    description: 'Filtra la lista historica por autor.',
  },
];
