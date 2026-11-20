import { NextRequest, NextResponse } from "next/server";
import {
  supabase,
  must,
  mapCustomBook,
  mapBookshelfItem,
  mapReadingProgress,
  mapUnlockedPass,
} from "@/db";
import {
  BOOK_PASSES,
  BookDetailData,
  BookItem,
  BookPassItem,
  DEFAULT_PHYSICS_CHAPTERS,
  FALLBACK_BOOKS,
  UPSTREAM_COHORTS,
  fetchBookDetailFromUpstream,
  fetchCohortBooksFromUpstream,
} from "@/lib/books-data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookChaptersId = searchParams.get("book_chapters");
  const searchQuery = searchParams.get("search")?.trim() || "";
  const cohortParam = searchParams.get("cohort")?.trim() || "12_NEET";

  try {
    // 1. Single Book Details + Chapters
    if (bookChaptersId) {
      let customBookRow = null;
      try {
        const rows = await must(
          supabase
            .from("custom_books")
            .select("*")
            .eq("book_id", bookChaptersId)
            .limit(1)
        );
        if (rows && rows.length > 0) customBookRow = mapCustomBook(rows[0]);
      } catch {
        // Table may not be migrated yet on first boot
      }

      if (customBookRow) {
        const customDetail: BookDetailData = {
          _id: customBookRow.bookId,
          bookId: customBookRow.bookId,
          title: customBookRow.title,
          subTitle: customBookRow.subtitle || "Custom Uploaded Digital PDF Book",
          author: customBookRow.author,
          publication: "Mind Spark Custom Library",
          publicationYear: "2026",
          edition: customBookRow.edition,
          displayClass: customBookRow.displayClass,
          language: "ENGLISH",
          noOfChapters: 4,
          currentPrice: 0,
          listPrice: 499,
          discount: 100,
          isPaid: false,
          tags: customBookRow.tags.split(",").map((s) => s.trim()),
          exams: customBookRow.exams.split(",").map((s) => s.trim()),
          boards: ["CBSE"],
          coverUrl: customBookRow.coverUrl,
          pdfUrl: customBookRow.pdfUrl || undefined,
          faq: [
            {
              que: "How does this uploaded PDF book work?",
              ans: "You can open any chapter or the full uploaded PDF directly in the Mind Spark Secure Reader, zoom, jump pages, and add page notes or highlights.",
            },
          ],
          knowMore: [
            {
              icon: "",
              title: "Inside this Custom Digital Book",
              points: [
                "Instant browser & canvas PDF rendering with high-DPI zoom.",
                "Page-level sticky notes and multi-color text highlighting.",
                "Topic-wise self-assessment practice questions.",
              ],
            },
          ],
          chapterDetails: [
            {
              _id: `${customBookRow.bookId}_ch_1`,
              bookId: customBookRow.bookId,
              displayChapterNumber: 1,
              title: `${customBookRow.title} - Complete Digital PDF Document`,
              totalPageCount: customBookRow.totalPages || 24,
              encryptedQuery: customBookRow.pdfUrl
                ? `CUSTOM_PDF::${customBookRow.bookId}`
                : DEFAULT_PHYSICS_CHAPTERS[0].encryptedQuery,
              type: "PDF",
              isSample: true,
              customPracticeSet: DEFAULT_PHYSICS_CHAPTERS[0].customPracticeSet,
            },
            {
              _id: `${customBookRow.bookId}_ch_2`,
              bookId: customBookRow.bookId,
              displayChapterNumber: 2,
              title: "Unit 2: Core Theory, Derivations & Formula Sheet",
              totalPageCount: 18,
              encryptedQuery: `GENERATED::${encodeURIComponent(customBookRow.title)}::Unit 2 Core Theory & Derivations::18`,
              type: "PDF",
              isSample: true,
              customPracticeSet: DEFAULT_PHYSICS_CHAPTERS[1].customPracticeSet,
            },
            {
              _id: `${customBookRow.bookId}_ch_3`,
              bookId: customBookRow.bookId,
              displayChapterNumber: 3,
              title: "Unit 3: Aarambh & Prarambh Solved Examples",
              totalPageCount: 22,
              encryptedQuery: `GENERATED::${encodeURIComponent(customBookRow.title)}::Unit 3 Solved Examples::22`,
              type: "PDF",
              isSample: false,
              customPracticeSet: DEFAULT_PHYSICS_CHAPTERS[2].customPracticeSet,
            },
            {
              _id: `${customBookRow.bookId}_ch_4`,
              bookId: customBookRow.bookId,
              displayChapterNumber: 4,
              title: "Unit 4: Previous Year Archive & Mock Practice",
              totalPageCount: 26,
              encryptedQuery: `GENERATED::${encodeURIComponent(customBookRow.title)}::Unit 4 PYQ Archive::26`,
              type: "PDF",
              isSample: false,
              customPracticeSet: DEFAULT_PHYSICS_CHAPTERS[3].customPracticeSet,
            },
          ],
        };
        return NextResponse.json({ success: true, data: customDetail });
      }

      const upstreamDetail = await fetchBookDetailFromUpstream(bookChaptersId);
      if (upstreamDetail) {
        return NextResponse.json({ success: true, data: upstreamDetail });
      }

      // Fallback detail if bookId is not found upstream
      const fallbackBook =
        FALLBACK_BOOKS.find((b) => b.bookId === bookChaptersId) || FALLBACK_BOOKS[0];
      const fallbackDetail: BookDetailData = {
        _id: fallbackBook.bookId,
        bookId: fallbackBook.bookId,
        title: fallbackBook.title,
        subTitle: fallbackBook.subtitle || "Digital book with instant solutions & AI doubt support",
        author: fallbackBook.author,
        publication: "PW",
        publicationYear: "2026",
        edition: fallbackBook.edition || "2026 Edition",
        displayClass: fallbackBook.displayClass,
        language: fallbackBook.language,
        noOfChapters: DEFAULT_PHYSICS_CHAPTERS.length,
        currentPrice: fallbackBook.price || 499,
        listPrice: fallbackBook.originalPrice || 999,
        discount: 50,
        isPaid: fallbackBook.isPaid,
        tags: fallbackBook.tags,
        exams: fallbackBook.exams || ["NEET"],
        boards: fallbackBook.boards || ["CBSE"],
        coverUrl: fallbackBook.coverUrl,
        faq: [
          {
            que: "What happens when I buy the Digital format?",
            ans: "Once your purchase is successful, you get access to an interactive version of your book inside Mind Spark.",
          },
          {
            que: "How do I access my digital book?",
            ans: "All the purchased and added books are available in My Bookshelf and My Purchases sections.",
          },
        ],
        knowMore: [
          {
            icon: "",
            title: "How will this book help you?",
            points: [
              "Build strong conceptual clarity with comprehensive theory.",
              "Boost exam readiness with focused practice and past 10 years exam trends.",
            ],
          },
          {
            icon: "",
            title: "Inside this Book",
            points: [
              "Aarambh: Solved examples to build concepts with confidence.",
              "Prarambh: Topic-wise practice for progressive learning.",
              "Prabal: Advanced-level exercises to master challenging concepts.",
            ],
          },
        ],
        chapterDetails: DEFAULT_PHYSICS_CHAPTERS,
      };
      return NextResponse.json({ success: true, data: fallbackDetail });
    }

    // 2. Load custom books from DB
    let dbCustomBooks: BookItem[] = [];
    try {
      const rows = await must(
        supabase
          .from("custom_books")
          .select("*")
          .order("created_at", { ascending: false })
      );
      dbCustomBooks = (rows || []).map((r: any) => {
        const book = mapCustomBook(r);
        return {
          bookId: book.bookId,
          title: book.title,
          subtitle: book.subtitle || "Custom Digital Book",
          author: book.author,
          tags: book.tags.split(",").map((t) => t.trim()).filter(Boolean),
          displayClass: book.displayClass,
          edition: book.edition,
          coverUrl: book.coverUrl,
          isPaid: false,
          price: 0,
          originalPrice: 499,
          language: "ENGLISH",
          cohort: book.cohort,
          collectionName: "Custom Uploaded Books",
          pdfUrl: book.pdfUrl || undefined,
          isCustom: true,
        };
      });
    } catch {
      // Ignore if DB not initialized yet
    }

    // 3. Search across all cohorts OR load requested cohort
    let booksList: BookItem[] = [];
    let passesList: BookPassItem[] = [];

    if (searchQuery || cohortParam === "ALL") {
      // Fetch top cohorts in parallel for instant comprehensive catalog
      const results = await Promise.all(
        UPSTREAM_COHORTS.map((c) => fetchCohortBooksFromUpstream(c))
      );
      const seenBooks = new Map<string, BookItem>();
      const seenPasses = new Map<string, BookPassItem>();

      for (const b of dbCustomBooks) {
        seenBooks.set(b.bookId, b);
      }
      for (const res of results) {
        for (const b of res.books) {
          if (!seenBooks.has(b.bookId)) {
            seenBooks.set(b.bookId, b);
          }
        }
        for (const p of res.passes) {
          if (!seenPasses.has(p.passId)) {
            seenPasses.set(p.passId, p);
          }
        }
      }
      for (const p of BOOK_PASSES) {
        if (!seenPasses.has(p.passId)) {
          seenPasses.set(p.passId, p);
        }
      }

      booksList = Array.from(seenBooks.values());
      passesList = Array.from(seenPasses.values());

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        booksList = booksList.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            b.displayClass.toLowerCase().includes(q) ||
            b.cohort.toLowerCase().includes(q) ||
            (b.collectionName && b.collectionName.toLowerCase().includes(q)) ||
            b.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
    } else {
      const cohortData = await fetchCohortBooksFromUpstream(cohortParam);
      const customForCohort = dbCustomBooks.filter(
        (b) => b.cohort === cohortParam || cohortParam === "12_NEET"
      );
      const map = new Map<string, BookItem>();
      for (const b of customForCohort) map.set(b.bookId, b);
      for (const b of cohortData.books) map.set(b.bookId, b);
      booksList = Array.from(map.values());
      passesList =
        cohortData.passes.length > 0
          ? cohortData.passes
          : BOOK_PASSES.filter((p) => p.cohort === cohortParam);
    }

    // 4. Also fetch user's bookshelf, purchases, unlocked passes & reading progress
    let savedBookshelf: ReturnType<typeof mapBookshelfItem>[] = [];
    let progressRows: ReturnType<typeof mapReadingProgress>[] = [];
    let passesRows: ReturnType<typeof mapUnlockedPass>[] = [];

    try {
      const [shelfRes, progressRes, passesRes] = await Promise.all([
        must(
          supabase
            .from("bookshelf_items")
            .select("*")
            .order("updated_at", { ascending: false })
        ),
        must(
          supabase
            .from("reading_progress")
            .select("*")
            .order("updated_at", { ascending: false })
        ),
        must(
          supabase
            .from("unlocked_passes")
            .select("*")
            .order("unlocked_at", { ascending: false })
        ),
      ]);
      savedBookshelf = (shelfRes || []).map(mapBookshelfItem);
      progressRows = (progressRes || []).map(mapReadingProgress);
      passesRows = (passesRes || []).map(mapUnlockedPass);
    } catch {
      // Ignore if tables not pushed yet
    }

    return NextResponse.json({
      success: true,
      cohort: cohortParam,
      count: booksList.length,
      books: booksList,
      passes: passesList,
      bookshelf: savedBookshelf,
      readingProgress: progressRows,
      unlockedPasses: passesRows,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load books",
        books: FALLBACK_BOOKS,
        passes: BOOK_PASSES,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      subtitle,
      author,
      displayClass,
      cohort,
      tags,
      coverUrl,
      pdfUrl,
      totalPages,
    } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { success: false, error: "Book title is required" },
        { status: 400 }
      );
    }

    const bookId = `custom_${Date.now()}`;
    const defaultCover =
      coverUrl?.trim() ||
      "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/38ed2ed8-0606-4bba-a02e-15fb006ca127.png";

    const insertedRaw = await must(
      supabase
        .from("custom_books")
        .insert({
          book_id: bookId,
          title: title.trim(),
          subtitle: subtitle?.trim() || "Digital Book with Instant PDF Reader",
          author: author?.trim() || "PW Faculty",
          display_class: displayClass || "Class XII",
          edition: "2026 Edition",
          exams: "NEET,IIT-JEE",
          tags: Array.isArray(tags) ? tags.join(",") : tags || "Modules",
          cohort: cohort || "12_NEET",
          cover_url: defaultCover,
          pdf_url: pdfUrl || null,
          total_pages: Number(totalPages) || 24,
        })
        .select()
        .single()
    );
    const inserted = mapCustomBook(insertedRaw);

    // Also add to bookshelf & purchases automatically (ignore if already present)
    await must(
      supabase.from("bookshelf_items").upsert(
        {
          book_id: bookId,
          title: inserted.title,
          author: inserted.author,
          cover_url: inserted.coverUrl,
          display_class: inserted.displayClass,
          cohort: inserted.cohort,
          edition: inserted.edition,
          tags: inserted.tags,
          is_saved: true,
          is_purchased: true,
        },
        { onConflict: "book_id", ignoreDuplicates: true }
      )
    );

    return NextResponse.json({
      success: true,
      book: inserted,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create custom book",
      },
      { status: 500 }
    );
  }
}
