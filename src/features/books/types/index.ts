import type { ChangeEvent } from 'react';

export type QueryType = 'latest' | 'date' | 'title' | 'author';
export type QueryTone = 'info' | 'success' | 'warning' | 'error';

export type BooksStatusCode =
  | 'ARCHIVED_LIST'
  | 'LOADING'
  | 'OFFLINE_CACHE_MODE'
  | 'OFFLINE_CACHE_MISS'
  | 'QUERY_SUCCESS'
  | 'DATE_ADJUSTED'
  | 'NO_RESULTS'
  | 'MISSING_TITLE'
  | 'MISSING_AUTHOR'
  | 'MISSING_API_KEY'
  | 'INVALID_DATE'
  | 'INVALID_API_KEY'
  | 'RATE_LIMIT'
  | 'LIST_NOT_FOUND'
  | 'BAD_RESPONSE'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface BooksFormState {
  queryType: QueryType;
  date: string;
  title: string;
  author: string;
}

export interface QueryStatus {
  tone: QueryTone;
  code: BooksStatusCode;
  message: string;
}

export interface ListConfig {
  name: string;
  displayName: string;
  slug: string;
  oldestPublishedDate: string;
  newestPublishedDate: string;
  cadence: string;
}

export interface MenuOption {
  id: QueryType;
  label: string;
  description: string;
}

export interface BookIsbn {
  isbn10: string;
  isbn13: string;
}

export interface BookBuyLink {
  name: string;
  url: string;
}

export interface BookItem {
  rank: number;
  rankLastWeek: number;
  weeksOnList: number;
  asterisk: number;
  dagger: number;
  title: string;
  author: string;
  contributor: string;
  contributorNote: string;
  description: string;
  publisher: string;
  price: number | null;
  ageGroup: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  amazonUrl: string;
  bookReviewLink: string;
  firstChapterLink: string;
  sundayReviewLink: string;
  articleChapterLink: string;
  bookUri: string;
  primaryIsbn10: string;
  primaryIsbn13: string;
  isbns: BookIsbn[];
  buyLinks: BookBuyLink[];
}

export interface BooksMeta {
  apiStatus: string;
  copyright: string;
  numResults: number;
  lastModified: string;
  requestedDate: string;
  resolvedDate: string;
  listName: string;
  displayName: string;
  publishedDate: string;
  bestsellersDate: string;
  updated: string;
  normalListEndsAt: number | null;
}

export interface BooksResponse {
  meta: BooksMeta;
  books: BookItem[];
}

export interface RawNYTBook {
  rank?: number;
  rank_last_week?: number;
  weeks_on_list?: number;
  asterisk?: number;
  dagger?: number;
  title?: string;
  author?: string;
  contributor?: string;
  contributor_note?: string;
  description?: string;
  publisher?: string;
  price?: number;
  age_group?: string;
  book_image?: string;
  book_image_width?: number;
  book_image_height?: number;
  amazon_product_url?: string;
  book_review_link?: string;
  first_chapter_link?: string;
  sunday_review_link?: string;
  article_chapter_link?: string;
  book_uri?: string;
  primary_isbn10?: string;
  primary_isbn13?: string;
  isbns?: RawNYTIsbn[];
  buy_links?: RawNYTBuyLink[];
}

export interface RawNYTIsbn {
  isbn10?: string;
  isbn13?: string;
}

export interface RawNYTBuyLink {
  name?: string;
  url?: string;
}

export interface RawNYTResults {
  list_name?: string;
  display_name?: string;
  published_date?: string;
  bestsellers_date?: string;
  updated?: string;
  normal_list_ends_at?: number;
  books?: RawNYTBook[];
}

export interface NYTErrorPayload {
  status?: string;
  copyright?: string;
  num_results?: number;
  last_modified?: string;
  errors?: string[];
  fault?: {
    faultstring?: string;
  };
  message?: string;
  results?: RawNYTResults;
}

export interface FetchMassMarketBooksOptions {
  signal?: AbortSignal;
}

export interface UseBooksQueryResult {
  books: BookItem[];
  fetchedBooks: BookItem[];
  meta: BooksMeta | null;
  status: QueryStatus;
  isLoading: boolean;
  lastQuery: BooksFormState | null;
  runQuery: (form: BooksFormState) => Promise<void>;
}

export interface BookCardProps {
  book: BookItem;
  detailPath: string;
}

export interface BooksGridProps {
  books: BookItem[];
  activeDate: string;
}

export interface QueryMenuProps {
  form: BooksFormState;
  isLoading: boolean;
  authorSuggestions: string[];
  onFieldChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onAuthorSuggestionSelect: (author: string) => void;
  onModeChange: (queryType: QueryType) => void;
  onFilterCommit?: () => void;
}

export interface ResultsHeaderProps {
  meta: BooksMeta | null;
  summary: string;
  totalBooks: number;
  isLoading: boolean;
}

export interface StatusBannerProps {
  status: QueryStatus;
  compact?: boolean;
}
