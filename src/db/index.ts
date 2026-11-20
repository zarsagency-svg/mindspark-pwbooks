import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Await a Supabase query and throw on error.
 * Mirrors the throwing behaviour the routes previously relied on from Drizzle,
 * so existing try/catch blocks keep working unchanged.
 */
export async function must<T>(
  query: PromiseLike<{ data: T; error: { message: string } | null }>
): Promise<T> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

/* ------------------------------------------------------------------ */
/* Row mappers: snake_case database rows -> camelCase API objects.     */
/* The frontend expects the exact camelCase shapes previously produced */
/* by Drizzle, so every row is mapped before it leaves the API.        */
/* ------------------------------------------------------------------ */

export interface CustomBookRow {
  id: number;
  bookId: string;
  title: string;
  subtitle: string | null;
  author: string;
  displayClass: string;
  edition: string;
  exams: string;
  tags: string;
  cohort: string;
  coverUrl: string;
  pdfUrl: string | null;
  totalPages: number;
  createdAt: string;
}

export interface BookshelfRow {
  id: number;
  bookId: string;
  title: string;
  author: string;
  coverUrl: string;
  displayClass: string;
  cohort: string;
  edition: string;
  tags: string;
  isSaved: boolean;
  isPurchased: boolean;
  lastReadChapterId: string | null;
  lastReadChapterTitle: string | null;
  lastReadAssetRef: string | null;
  lastReadPage: number;
  totalPages: number;
  updatedAt: string;
}

export interface ReadingProgressRow {
  id: number;
  bookId: string;
  chapterId: string;
  chapterTitle: string;
  assetRef: string;
  currentPage: number;
  totalPages: number;
  updatedAt: string;
}

export interface PageAnnotationRow {
  id: number;
  assetRef: string;
  bookId: string;
  chapterTitle: string;
  pageNumber: number;
  type: string;
  text: string;
  noteContent: string;
  color: string;
  createdAt: string;
}

export interface UnlockedPassRow {
  id: number;
  passId: string;
  cohort: string;
  title: string;
  couponCode: string | null;
  unlockedAt: string;
}

type AnyRow = Record<string, any>;

export function mapCustomBook(r: AnyRow): CustomBookRow {
  return {
    id: r.id,
    bookId: r.book_id,
    title: r.title,
    subtitle: r.subtitle,
    author: r.author,
    displayClass: r.display_class,
    edition: r.edition,
    exams: r.exams,
    tags: r.tags,
    cohort: r.cohort,
    coverUrl: r.cover_url,
    pdfUrl: r.pdf_url,
    totalPages: r.total_pages,
    createdAt: r.created_at,
  };
}

export function mapBookshelfItem(r: AnyRow): BookshelfRow {
  return {
    id: r.id,
    bookId: r.book_id,
    title: r.title,
    author: r.author,
    coverUrl: r.cover_url,
    displayClass: r.display_class,
    cohort: r.cohort,
    edition: r.edition,
    tags: r.tags,
    isSaved: r.is_saved,
    isPurchased: r.is_purchased,
    lastReadChapterId: r.last_read_chapter_id,
    lastReadChapterTitle: r.last_read_chapter_title,
    lastReadAssetRef: r.last_read_asset_ref,
    lastReadPage: r.last_read_page,
    totalPages: r.total_pages,
    updatedAt: r.updated_at,
  };
}

export function mapReadingProgress(r: AnyRow): ReadingProgressRow {
  return {
    id: r.id,
    bookId: r.book_id,
    chapterId: r.chapter_id,
    chapterTitle: r.chapter_title,
    assetRef: r.asset_ref,
    currentPage: r.current_page,
    totalPages: r.total_pages,
    updatedAt: r.updated_at,
  };
}

export function mapPageAnnotation(r: AnyRow): PageAnnotationRow {
  return {
    id: r.id,
    assetRef: r.asset_ref,
    bookId: r.book_id,
    chapterTitle: r.chapter_title,
    pageNumber: r.page_number,
    type: r.type,
    text: r.text,
    noteContent: r.note_content,
    color: r.color,
    createdAt: r.created_at,
  };
}

export function mapUnlockedPass(r: AnyRow): UnlockedPassRow {
  return {
    id: r.id,
    passId: r.pass_id,
    cohort: r.cohort,
    title: r.title,
    couponCode: r.coupon_code,
    unlockedAt: r.unlocked_at,
  };
}
