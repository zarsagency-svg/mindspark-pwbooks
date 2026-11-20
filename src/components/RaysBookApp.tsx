"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BOARD_OPTIONS,
  BOOK_PASSES,
  BookDetailData,
  BookItem,
  BookPassItem,
  CLASS_OPTIONS,
  COHORT_LIST,
  DEFAULT_PHYSICS_CHAPTERS,
  EXAM_OPTIONS,
  ChapterItem,
} from "@/lib/books-data";
import SecurePdfReader from "@/components/SecurePdfReader";

interface BookshelfRow {
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
}

interface ReadingProgressRow {
  id: number;
  bookId: string;
  chapterId: string;
  chapterTitle: string;
  assetRef: string;
  currentPage: number;
  totalPages: number;
}

interface UnlockedPassRow {
  id: number;
  passId: string;
  cohort: string;
  title: string;
  couponCode: string | null;
}

const SUPPORT_FAQS = [
  {
    id: "faq1",
    q: "How do I open and read any book's PDF?",
    a: "Click on any book card in Explore or Search to open the Book Details page, then click 'Read PDF' on any chapter (or click 'Quick PDF' directly on the book card). The chapter opens immediately in the integrated Secure PDF Reader where you can zoom, jump pages, add notes, highlight text, or open the raw PDF in a new tab.",
  },
  {
    id: "faq2",
    q: "How do I access my purchased or saved books?",
    a: "After saving or unlocking a book, go to the 'Home (My Bookshelf)' or 'My Purchases' tab in the left sidebar. All your saved and unlocked books are listed there with your latest reading progress.",
  },
  {
    id: "faq3",
    q: "What is a Books Pass and how does it work?",
    a: "A Books Pass gives you unlimited access to all digital books and coaching modules in your selected class and exam category (NEET, IIT-JEE, Udaan, Neev, Boards, UPSC). Click on 'Books Pass' in the sidebar to unlock any pass instantly.",
  },
  {
    id: "faq4",
    q: "How do I reset my reading progress on a book?",
    a: "Reading progress is automatically saved as you flip through pages in the PDF reader. To reset progress on a specific book, open the Book Details page and click the 'Reset Progress' button in the top bar.",
  },
  {
    id: "faq5",
    q: "Can I upload my own PDF file to read in the Secure Reader?",
    a: "Yes! Click the '+ Upload PDF' button in the top bar or in My Purchases to upload any .pdf file from your device or add a custom digital book to your bookshelf.",
  },
];

export default function RaysBookApp() {
  // Navigation & View state
  const [activeNav, setActiveNav] = useState<"home" | "explore" | "passes" | "purchases">(
    "explore"
  );
  const [selectedCohort, setSelectedCohort] = useState<string>("12_NEET");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Catalog state
  const [books, setBooks] = useState<BookItem[]>([]);
  const [passes, setPasses] = useState<BookPassItem[]>(BOOK_PASSES);
  const [isLoadingBooks, setIsLoadingBooks] = useState<boolean>(true);

  // Inline Filters on Explore
  const [inlineSearch, setInlineSearch] = useState<string>("");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("ALL");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("ALL");

  // User DB state
  const [bookshelf, setBookshelf] = useState<BookshelfRow[]>([]);
  const [readingProgress, setReadingProgress] = useState<ReadingProgressRow[]>([]);
  const [unlockedPasses, setUnlockedPasses] = useState<UnlockedPassRow[]>([]);

  // Book Details View state
  const [activeBookDetail, setActiveBookDetail] = useState<BookDetailData | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [openChapterId, setOpenChapterId] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<Record<string, boolean>>({
    desc: true,
    author: false,
    digital: false,
    faq: false,
  });
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Active PDF Reader state
  const [activeReaderState, setActiveReaderState] = useState<{
    bookId: string;
    bookTitle: string;
    bookCover?: string;
    chapter: ChapterItem;
    allChapters: ChapterItem[];
    customPdfUrl?: string;
    initialPage: number;
    initialTab: "read" | "practice" | "highlights";
  } | null>(null);

  // Modals state
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>("");
  const [modalSearchResults, setModalSearchResults] = useState<BookItem[]>([]);
  const [isSearchingModal, setIsSearchingModal] = useState<boolean>(false);

  const [onboardingModalOpen, setOnboardingModalOpen] = useState<boolean>(false);
  const [boardModalOpen, setBoardModalOpen] = useState<boolean>(false);
  const [tempExam, setTempExam] = useState<string>("NEET");
  const [tempClass, setTempClass] = useState<string>("12");
  const [tempBoard, setTempBoard] = useState<string>("CBSE");

  const [supportModalOpen, setSupportModalOpen] = useState<boolean>(false);
  const [supportSearch, setSupportSearch] = useState<string>("");
  const [openFaqIds, setOpenFaqIds] = useState<Record<string, boolean>>({ faq1: true });
  const [faqVotes, setFaqVotes] = useState<Record<string, "yes" | "no">>({});

  // Upload Custom PDF Modal state
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [customTitle, setCustomTitle] = useState<string>("");
  const [customAuthor, setCustomAuthor] = useState<string>("PW Faculty");
  const [customClass, setCustomClass] = useState<string>("Class XII");
  const [customCohort, setCustomCohort] = useState<string>("12_NEET");
  const [customTag, setCustomTag] = useState<string>("Modules");
  const [customPdfDataUrl, setCustomPdfDataUrl] = useState<string>("");
  const [customPdfFileName, setCustomPdfFileName] = useState<string>("");
  const [isSubmittingCustom, setIsSubmittingSubmitting] = useState<boolean>(false);

  // Toast message
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  // Load books for selected cohort
  const loadCohortCatalog = useCallback(async (cohortSlug: string) => {
    setIsLoadingBooks(true);
    try {
      const res = await fetch(
        `/api/books?cohort=${encodeURIComponent(cohortSlug)}`
      );
      const data = await res.json();
      if (data?.books) {
        setBooks(data.books);
      }
      if (data?.passes && data.passes.length > 0) {
        setPasses(data.passes);
      }
      if (data?.bookshelf) setBookshelf(data.bookshelf);
      if (data?.readingProgress) setReadingProgress(data.readingProgress);
      if (data?.unlockedPasses) setUnlockedPasses(data.unlockedPasses);
    } catch {
      // Fallback handled by state
    } finally {
      setIsLoadingBooks(false);
    }
  }, []);

  useEffect(() => {
    loadCohortCatalog(selectedCohort);
  }, [selectedCohort, loadCohortCatalog]);

  // Global keyboard shortcut Cmd/Ctrl+K to open Search Modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Search Modal live query handler across all 235+ books
  useEffect(() => {
    if (!searchModalOpen) return;
    const q = modalSearchQuery.trim();
    if (!q) {
      setModalSearchResults(books.slice(0, 18));
      return;
    }

    let cancelled = false;
    setIsSearchingModal(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/books?search=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!cancelled && Array.isArray(data?.books)) {
          setModalSearchResults(data.books);
        }
      } catch {
        if (!cancelled) {
          const lower = q.toLowerCase();
          setModalSearchResults(
            books.filter(
              (b) =>
                b.title.toLowerCase().includes(lower) ||
                b.author.toLowerCase().includes(lower)
            )
          );
        }
      } finally {
        if (!cancelled) setIsSearchingModal(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [modalSearchQuery, searchModalOpen, books]);

  // Open a book's details view
  const openBookDetails = async (bookId: string, autoOpenPdf = false) => {
    setSearchModalOpen(false);
    setIsLoadingDetail(true);
    setAppliedCoupon(null);

    try {
      const res = await fetch(
        `/api/books?book_chapters=${encodeURIComponent(bookId)}`
      );
      const json = await res.json();
      if (json?.success && json?.data) {
        const detail: BookDetailData = json.data;
        setActiveBookDetail(detail);
        if (detail.chapterDetails.length > 0) {
          setOpenChapterId(detail.chapterDetails[0]._id);
          if (autoOpenPdf) {
            const firstChap = detail.chapterDetails[0];
            const savedProg = readingProgress.find(
              (p) => p.assetRef === firstChap.encryptedQuery
            );
            setActiveReaderState({
              bookId: detail.bookId,
              bookTitle: detail.title,
              bookCover: detail.coverUrl,
              chapter: firstChap,
              allChapters: detail.chapterDetails,
              customPdfUrl: detail.pdfUrl,
              initialPage: savedProg?.currentPage || 1,
              initialTab: "read",
            });
          }
        }
      }
    } catch {
      triggerToast("Failed to load book details");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Open a specific chapter in the Secure PDF Reader
  const openChapterInReader = (
    detail: BookDetailData,
    chapter: ChapterItem,
    tab: "read" | "practice" | "highlights" = "read"
  ) => {
    const savedProg = readingProgress.find(
      (p) => p.assetRef === chapter.encryptedQuery
    );
    setActiveReaderState({
      bookId: detail.bookId,
      bookTitle: detail.title,
      bookCover: detail.coverUrl,
      chapter,
      allChapters: detail.chapterDetails,
      customPdfUrl: detail.pdfUrl,
      initialPage: savedProg?.currentPage || 1,
      initialTab: tab,
    });
  };

  // Toggle Save to Bookshelf
  const handleToggleBookshelf = async (book: {
    bookId: string;
    title: string;
    author: string;
    coverUrl: string;
    displayClass: string;
    cohort?: string;
    edition?: string;
    tags?: string[];
  }) => {
    try {
      const res = await fetch("/api/user-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_bookshelf",
          ...book,
        }),
      });
      const data = await res.json();
      if (data?.success && data?.item) {
        setBookshelf((prev) => {
          const others = prev.filter((i) => i.bookId !== book.bookId);
          return [data.item, ...others];
        });
        triggerToast(
          data.isSaved
            ? `Added "${book.title}" to My Bookshelf!`
            : `Removed "${book.title}" from My Bookshelf`
        );
      }
    } catch {
      triggerToast("Updated Bookshelf");
    }
  };

  // Unlock / Buy Now Book
  const handlePurchaseBook = async (detail: BookDetailData) => {
    try {
      const res = await fetch("/api/user-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "purchase_book",
          bookId: detail.bookId,
          title: detail.title,
          author: detail.author,
          coverUrl: detail.coverUrl,
          displayClass: detail.displayClass,
          cohort: selectedCohort,
          edition: detail.edition,
          tags: detail.tags,
        }),
      });
      const data = await res.json();
      if (data?.success && data?.item) {
        setBookshelf((prev) => {
          const others = prev.filter((i) => i.bookId !== detail.bookId);
          return [data.item, ...others];
        });
      }
      triggerToast(`Unlocked "${detail.title}"! Opening PDF Reader...`);
      const ch = detail.chapterDetails[0] || DEFAULT_PHYSICS_CHAPTERS[0];
      openChapterInReader(detail, ch, "read");
    } catch {
      triggerToast("Book unlocked!");
    }
  };

  // Reset Reading Progress for a book
  const handleResetBookProgress = async (bookId: string) => {
    try {
      await fetch("/api/user-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_progress",
          bookId,
        }),
      });
      setReadingProgress((prev) => prev.filter((p) => p.bookId !== bookId));
      setBookshelf((prev) =>
        prev.map((b) =>
          b.bookId === bookId
            ? {
                ...b,
                lastReadChapterId: null,
                lastReadChapterTitle: null,
                lastReadAssetRef: null,
                lastReadPage: 1,
              }
            : b
        )
      );
      triggerToast("Reading progress has been reset for this book.");
    } catch {
      // Ignore
    }
  };

  // Unlock a Book Pass
  const handleUnlockPass = async (pass: BookPassItem) => {
    try {
      const res = await fetch("/api/user-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unlock_pass",
          passId: pass.passId,
          cohort: pass.cohort,
          title: pass.title,
          couponCode: "RAYS100",
        }),
      });
      const data = await res.json();
      if (data?.success && data?.pass) {
        setUnlockedPasses((prev) => {
          const others = prev.filter((p) => p.passId !== pass.passId);
          return [data.pass, ...others];
        });
      }
      triggerToast(`Unlocked "${pass.title}"! All books in ${pass.cohort} are ready.`);
    } catch {
      triggerToast(`Unlocked "${pass.title}"!`);
    }
  };

  // Save Onboarding Exam & Class selection
  const handleSaveOnboarding = () => {
    if (tempExam === "SCHOOL_PREPARATION") {
      setOnboardingModalOpen(false);
      setBoardModalOpen(true);
      return;
    }
    applyExamAndClassToCohort(tempExam, tempClass);
    setOnboardingModalOpen(false);
  };

  const applyExamAndClassToCohort = (exam: string, cls: string) => {
    let target = "12_NEET";
    if (exam === "UPSC") {
      target = "UPSC";
    } else if (exam === "NEET") {
      if (cls === "11") target = "11_NEET";
      else if (cls === "12+") target = "DROPPER_NEET";
      else target = "12_NEET";
    } else if (exam === "IIT-JEE") {
      if (cls === "11") target = "11_JEE";
      else if (cls === "12+") target = "DROPPER_JEE";
      else target = "12_JEE";
    } else if (exam === "SCHOOL_PREPARATION") {
      if (cls === "9") target = "9_SCHOOL_PREP";
      else if (cls === "10") target = "10_SCHOOL_PREP";
      else if (cls === "11") target = "11_SCHOOL_PREP";
      else target = "12_SCHOOL_PREP";
    }
    setSelectedCohort(target);
    setActiveBookDetail(null);
    setActiveNav("explore");
    triggerToast(`Updated cohort to ${target.replace(/_/g, " ")}`);
  };

  // Handle Custom PDF File upload & creation
  const handlePdfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCustomPdfFileName(file.name);
    if (!customTitle) {
      setCustomTitle(file.name.replace(/\.pdf$/i, ""));
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCustomPdfDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateCustomBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;
    setIsSubmittingSubmitting(true);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: customTitle.trim(),
          subtitle: customPdfFileName
            ? `Uploaded PDF: ${customPdfFileName}`
            : "Custom Digital Module with Instant PDF Viewer",
          author: customAuthor.trim() || "PW Faculty",
          displayClass: customClass,
          cohort: customCohort,
          tags: [customTag],
          pdfUrl: customPdfDataUrl || undefined,
          totalPages: 24,
        }),
      });
      const data = await res.json();
      if (data?.success && data?.book) {
        setUploadModalOpen(false);
        setCustomTitle("");
        setCustomPdfDataUrl("");
        setCustomPdfFileName("");
        await loadCohortCatalog(selectedCohort);
        triggerToast(`Added "${data.book.title}"! Opening PDF Reader...`);
        openBookDetails(data.book.bookId, true);
      }
    } catch {
      triggerToast("Could not create custom book");
    } finally {
      setIsSubmittingSubmitting(false);
    }
  };

  // Filtered books on Explore view
  const allAvailableTags = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => b.tags.forEach((t) => set.add(t)));
    return ["ALL", ...Array.from(set)];
  }, [books]);

  const filteredExploreBooks = useMemo(() => {
    return books.filter((b) => {
      if (selectedTagFilter !== "ALL" && !b.tags.includes(selectedTagFilter)) {
        return false;
      }
      if (selectedClassFilter !== "ALL") {
        const dc = b.displayClass.toLowerCase();
        if (selectedClassFilter === "12" && !dc.includes("xii") && !dc.includes("12"))
          return false;
        if (
          selectedClassFilter === "11" &&
          (!dc.includes("xi") || dc.includes("xii")) &&
          !dc.includes("11")
        )
          return false;
        if (selectedClassFilter === "10" && !dc.includes("x") && !dc.includes("10"))
          return false;
        if (selectedClassFilter === "9" && !dc.includes("ix") && !dc.includes("9"))
          return false;
      }
      if (inlineSearch.trim()) {
        const q = inlineSearch.toLowerCase();
        return (
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q)) ||
          (b.collectionName && b.collectionName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [books, selectedTagFilter, selectedClassFilter, inlineSearch]);

  const activePassBanner = useMemo(() => {
    return (
      passes.find((p) => p.cohort === selectedCohort) ||
      BOOK_PASSES.find((p) => p.cohort === selectedCohort) ||
      BOOK_PASSES[0]
    );
  }, [passes, selectedCohort]);

  const savedBooksList = useMemo(
    () => bookshelf.filter((b) => b.isSaved),
    [bookshelf]
  );

  const purchasedBooksList = useMemo(
    () => bookshelf.filter((b) => b.isPurchased),
    [bookshelf]
  );

  // If SecurePdfReader is active, render it fullscreen
  if (activeReaderState) {
    return (
      <SecurePdfReader
        bookId={activeReaderState.bookId}
        bookTitle={activeReaderState.bookTitle}
        bookCover={activeReaderState.bookCover}
        chapter={activeReaderState.chapter}
        allChapters={activeReaderState.allChapters}
        customPdfUrl={activeReaderState.customPdfUrl}
        initialPage={activeReaderState.initialPage}
        initialTab={activeReaderState.initialTab}
        onBack={() => setActiveReaderState(null)}
        onSelectChapter={(nextChap) =>
          setActiveReaderState((prev) =>
            prev
              ? {
                  ...prev,
                  chapter: nextChap,
                  initialPage: 1,
                }
              : null
          )
        }
        onProgressUpdate={(page, total) => {
          setReadingProgress((prev) => {
            const others = prev.filter(
              (p) => p.assetRef !== activeReaderState.chapter.encryptedQuery
            );
            return [
              {
                id: Date.now(),
                bookId: activeReaderState.bookId,
                chapterId: activeReaderState.chapter._id,
                chapterTitle: activeReaderState.chapter.title,
                assetRef: activeReaderState.chapter.encryptedQuery,
                currentPage: page,
                totalPages: total,
              },
              ...others,
            ];
          });
        }}
      />
    );
  }

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-white text-[#1b2124]"
      style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}
    >
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      {/* ===================== LEFT SIDEBAR ===================== */}
      <aside
        className={`w-[260px] bg-white border-r border-[#e5e7eb] h-full flex flex-col px-4 py-6 flex-shrink-0 z-50 transition-transform duration-300 fixed md:static top-0 bottom-0 left-0 ${
          mobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="mb-6 px-2 flex items-center justify-between">
          <div
            onClick={() => {
              setActiveBookDetail(null);
              setActiveNav("explore");
              setMobileSidebarOpen(false);
            }}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#1b2124] text-white flex items-center justify-center font-black text-base shadow-xs">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <span className="font-extrabold text-[18px] text-[#1b2124] tracking-tight">
              RaysBook.live
            </span>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-gray-700 text-xl font-bold"
          >
            &times;
          </button>
        </div>

        {/* Menu Options */}
        <nav className="flex flex-col gap-1">
          {/* Home (My Bookshelf) */}
          <button
            onClick={() => {
              setActiveBookDetail(null);
              setActiveNav("home");
              setMobileSidebarOpen(false);
            }}
            className={`h-12 px-3 flex items-center justify-between rounded-md transition cursor-pointer ${
              activeNav === "home" && !activeBookDetail
                ? "border-l-4 border-[#5856d6] bg-[#5856d6]/5 font-extrabold text-[#1b2124]"
                : "text-[#4b5563] font-medium hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <svg
                width="21"
                height="20"
                viewBox="0 0 22 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.25488 12.0615C3.25444 11.8272 3.17258 11.6015 3.02539 11.4219L2.95801 11.3477L2.88379 11.2803C2.70412 11.1331 2.47844 11.0512 2.24414 11.0508H1.80078C1.55015 11.0517 1.30671 10.9673 1.11035 10.8115C0.915004 10.6565 0.778339 10.44 0.72168 10.1973C0.682495 9.99165 0.696879 9.77927 0.764648 9.58105C0.833968 9.37845 0.956029 9.19749 1.11816 9.05762L9.99121 0.992188C10.1967 0.803668 10.4632 0.700143 10.7393 0.700195C11.0152 0.700251 11.281 0.803742 11.4844 0.990234L20.4238 9.11621C20.5896 9.26711 20.7062 9.46445 20.7578 9.68262C20.8094 9.90103 20.7938 10.1305 20.7129 10.3398C20.6319 10.5492 20.4889 10.7296 20.3037 10.8564C20.1186 10.9832 19.8992 11.0508 19.6748 11.0508H19.2354C19.001 11.0512 18.7755 11.1332 18.5957 11.2803L18.5215 11.3467C18.332 11.5359 18.2245 11.7927 18.2236 12.0605V18.4346C18.2236 18.7296 18.107 19.0131 17.8984 19.2217C17.6898 19.4303 17.4064 19.5479 17.1113 19.5479H13.9893V15.4482C13.6889 14.2 12.4 12.5 10.4307 12.5156C8.99 12.6 7.8 14.0 7.78906 15.583V19.5479H4.36719C3.78 19.5479 3.25488 18.9 3.25488 18.4355V12.0615Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <span className="text-sm">Home</span>
            </div>
            {savedBooksList.length > 0 && (
              <span className="bg-indigo-50 text-[#5856d6] text-[11px] font-bold px-2 py-0.5 rounded-full">
                {savedBooksList.length}
              </span>
            )}
          </button>

          {/* Explore */}
          <button
            onClick={() => {
              setActiveBookDetail(null);
              setActiveNav("explore");
              setMobileSidebarOpen(false);
            }}
            className={`h-12 px-3 flex items-center justify-between rounded-md transition cursor-pointer ${
              activeNav === "explore" && !activeBookDetail
                ? "border-l-4 border-[#5856d6] bg-[#5856d6]/5 font-extrabold text-[#1b2124]"
                : "text-[#4b5563] font-medium hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <span className="text-sm">Explore</span>
            </div>
            <span className="text-[11px] font-bold text-gray-400">
              {books.length}
            </span>
          </button>

          {/* Books Pass */}
          <button
            onClick={() => {
              setActiveBookDetail(null);
              setActiveNav("passes");
              setMobileSidebarOpen(false);
            }}
            className={`h-12 px-3 flex items-center justify-between rounded-md border-b border-gray-100 mb-2 pb-2 transition cursor-pointer ${
              activeNav === "passes" && !activeBookDetail
                ? "border-l-4 border-[#5856d6] bg-[#5856d6]/5 font-extrabold text-[#1b2124]"
                : "text-[#4b5563] font-medium hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
              </svg>
              <span className="text-sm">Books Pass</span>
            </div>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
              PRO
            </span>
          </button>

          {/* My Purchases */}
          <button
            onClick={() => {
              setActiveBookDetail(null);
              setActiveNav("purchases");
              setMobileSidebarOpen(false);
            }}
            className={`h-12 px-3 flex items-center justify-between rounded-md transition cursor-pointer ${
              activeNav === "purchases" && !activeBookDetail
                ? "border-l-4 border-[#5856d6] bg-[#5856d6]/5 font-extrabold text-[#1b2124]"
                : "text-[#4b5563] font-medium hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span className="text-sm">My Purchases</span>
            </div>
            {(purchasedBooksList.length > 0 || unlockedPasses.length > 0) && (
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                {purchasedBooksList.length + unlockedPasses.length}
              </span>
            )}
          </button>

          {/* Support */}
          <button
            onClick={() => {
              setSupportModalOpen(true);
              setMobileSidebarOpen(false);
            }}
            className="h-12 px-3 flex items-center gap-3 rounded-md text-[#4b5563] font-medium hover:bg-gray-50 transition cursor-pointer"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="text-sm">Support</span>
          </button>

          {/* Upload / Add Custom PDF Book */}
          <button
            onClick={() => {
              setUploadModalOpen(true);
              setMobileSidebarOpen(false);
            }}
            className="mt-3 h-11 px-3 flex items-center justify-center gap-2 rounded-lg border border-dashed border-[#5856d6] bg-indigo-50/50 hover:bg-indigo-50 text-[#5856d6] font-bold text-xs transition cursor-pointer"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Upload / Add PDF Book
          </button>
        </nav>

        {/* Bottom Profile Section */}
        <div className="mt-auto border-t border-gray-100 pt-4">
          <div
            onClick={() => setOnboardingModalOpen(true)}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#ef4444] text-white flex items-center justify-center font-bold text-sm">
                R
              </div>
              <div>
                <div className="font-bold text-sm text-[#1b2124] leading-tight">
                  RaysBook.live
                </div>
                <div className="text-[11px] font-semibold text-gray-500">
                  {COHORT_LIST.find((c) => c.slug === selectedCohort)?.label ||
                    selectedCohort}
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-[#5856d6]">Change</span>
          </div>
        </div>
      </aside>

      {/* ===================== MAIN VIEWPORT ===================== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        {/* CASE A: BOOK DETAILS VIEW (#book-details-view) */}
        {activeBookDetail || isLoadingDetail ? (
          <main className="flex-1 flex flex-col overflow-y-auto bg-white">
            {/* Sticky Book Top Bar */}
            <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 md:px-8 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setActiveBookDetail(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-[#1b2124] transition cursor-pointer"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1b2124"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                </button>
                <h1 className="text-sm md:text-base font-bold text-[#1b2124] truncate">
                  {activeBookDetail?.title || "Loading Book..."}
                </h1>
              </div>

              {activeBookDetail && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResetBookProgress(activeBookDetail.bookId)}
                    className="text-xs font-semibold text-gray-500 hover:text-rose-600 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                    title="Reset reading progress for this book"
                  >
                    Reset Progress
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      triggerToast("Book link copied to clipboard!");
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 text-[#1b2124] cursor-pointer"
                    title="Share Book"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {isLoadingDetail || !activeBookDetail ? (
              <div className="flex-1 flex flex-col items-center justify-center py-28">
                <div className="w-14 h-14 rounded-full border-4 border-indigo-100 border-t-[#5856d6] animate-spin mb-4" />
                <p className="text-sm font-bold text-gray-600">
                  Loading book chapters & digital PDF assets...
                </p>
              </div>
            ) : (
              <div className="max-w-[1200px] w-full mx-auto p-5 md:p-8 flex flex-col md:flex-row gap-8 pb-24">
                {/* Left Side: Cover + CTAs */}
                <div className="w-full md:w-[280px] flex-shrink-0 flex flex-col gap-4">
                  <div className="relative flex justify-center items-center p-6 bg-gray-50/70 md:bg-transparent rounded-2xl border border-gray-100 md:border-0">
                    <div
                      className="absolute w-44 h-60 rounded-full pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(46,148,250,0.28) 0%, rgba(46,148,250,0) 70%)",
                        filter: "blur(24px)",
                      }}
                    />
                    <img
                      src={activeBookDetail.coverUrl}
                      alt={activeBookDetail.title}
                      className="w-[170px] h-auto rounded-lg shadow-xl relative z-10 object-cover"
                    />
                  </div>

                  {/* Apply Coupon Box */}
                  <div
                    onClick={() => {
                      setAppliedCoupon("RAYS100");
                      triggerToast(
                        "Coupon RAYS100 applied! 100% Free Instant Digital Access unlocked."
                      );
                    }}
                    className="bg-[#effaf4] border border-dashed border-[#34d399] rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-emerald-50 transition"
                  >
                    <div className="flex items-center gap-2 text-[#059669] text-[13px] font-bold">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.3"
                      >
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                      <span>
                        {appliedCoupon
                          ? `Coupon ${appliedCoupon} Applied (FREE)`
                          : "Apply Coupon (RAYS100)"}
                      </span>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="2.5"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => handlePurchaseBook(activeBookDetail)}
                      className="w-full bg-[#1b2124] hover:bg-gray-800 text-white rounded-full py-3.5 px-5 text-sm font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                      >
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                      {bookshelf.some(
                        (b) => b.bookId === activeBookDetail.bookId && b.isPurchased
                      )
                        ? "Read Digital Book Now"
                        : appliedCoupon
                        ? "Unlock Free & Read PDF"
                        : "Buy Now / Read PDF"}
                    </button>

                    <button
                      onClick={() =>
                        handleToggleBookshelf({
                          bookId: activeBookDetail.bookId,
                          title: activeBookDetail.title,
                          author: activeBookDetail.author,
                          coverUrl: activeBookDetail.coverUrl,
                          displayClass: activeBookDetail.displayClass,
                          cohort: selectedCohort,
                          edition: activeBookDetail.edition,
                          tags: activeBookDetail.tags,
                        })
                      }
                      className="w-full bg-white hover:bg-gray-50 text-[#1b2124] border border-[#d9dce1] rounded-full py-3.5 px-5 text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {bookshelf.some(
                        (b) => b.bookId === activeBookDetail.bookId && b.isSaved
                      ) ? (
                        <>
                          <span className="text-emerald-600">✓</span> Saved in My
                          Bookshelf
                        </>
                      ) : (
                        <>+ Add to Bookshelf</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right Side: Metadata + Chapters + Accordions */}
                <div className="flex-1 flex flex-col gap-6">
                  {/* Top Book Metadata */}
                  <div className="border-b border-gray-100 pb-5">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ea580c] bg-orange-50 px-2.5 py-1 rounded-md">
                        <svg
                          width="10"
                          height="14"
                          viewBox="0 0 10 15"
                          fill="#FB6514"
                        >
                          <path d="M3.93359 0L0.000211219 9.95249L1.34416 14.0303L5.11279 11.9731L9.04618 2.02057L3.93359 0Z" />
                        </svg>
                        {activeBookDetail.edition}
                      </span>
                      <span className="text-[11px] font-extrabold text-[#5856d6] bg-indigo-50 px-2.5 py-1 rounded-md uppercase">
                        DIGITAL BOOK
                      </span>
                      <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
                        {activeBookDetail.displayClass}
                      </span>
                    </div>

                    <h2 className="text-2xl md:text-[26px] font-extrabold text-[#1b2124] leading-tight mb-1.5">
                      {activeBookDetail.title}
                    </h2>
                    <p className="text-sm text-gray-600 font-medium mb-2">
                      {activeBookDetail.subTitle}
                    </p>
                    <div className="text-xs font-bold text-[#1b2124]">
                      By {activeBookDetail.author} •{" "}
                      <span className="text-gray-500 uppercase">
                        {activeBookDetail.publication} ({activeBookDetail.language})
                      </span>
                    </div>

                    {/* Price & Instant Unlock Badge */}
                    <div className="mt-4 flex items-center gap-3">
                      <span className="text-xl font-black text-[#1b2124]">
                        {appliedCoupon ? "₹0 (Free with RAYS100)" : `₹${activeBookDetail.currentPrice}`}
                      </span>
                      {activeBookDetail.listPrice > 0 && (
                        <span className="text-sm text-gray-400 line-through font-semibold">
                          ₹{activeBookDetail.listPrice}
                        </span>
                      )}
                      <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        All {activeBookDetail.chapterDetails.length} Chapters Unlocked for PDF Reading
                      </span>
                    </div>
                  </div>

                  {/* Chapters List Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-extrabold text-[#1b2124]">
                        Chapters ({activeBookDetail.chapterDetails.length})
                      </h3>
                      <span className="text-xs font-semibold text-gray-500">
                        Click any chapter to open PDF or Practice Sets
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {activeBookDetail.chapterDetails.map((ch, idx) => {
                        const isOpen = openChapterId === ch._id;
                        const prog = readingProgress.find(
                          (p) => p.assetRef === ch.encryptedQuery
                        );
                        const rawChPdfUrl = `/api/pdf-page?asset_ref=${encodeURIComponent(
                          ch.encryptedQuery
                        )}&page=1&total=${ch.totalPageCount}&book_title=${encodeURIComponent(
                          activeBookDetail.title
                        )}&chapter_title=${encodeURIComponent(ch.title)}&raw=1`;

                        return (
                          <div
                            key={ch._id}
                            className="border border-[#eaecf0] rounded-xl bg-white overflow-hidden transition hover:border-indigo-200"
                          >
                            {/* Chapter Header Row */}
                            <div
                              onClick={() =>
                                setOpenChapterId(isOpen ? null : ch._id)
                              }
                              className="px-4 md:px-5 py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-gray-50/70 transition"
                            >
                              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                <div className="w-9 h-9 rounded-full bg-[#ecfdf5] text-[#10b981] flex items-center justify-center font-extrabold text-xs flex-shrink-0">
                                  {String(
                                    ch.displayChapterNumber || idx + 1
                                  ).padStart(2, "0")}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase">
                                      CHAPTER {ch.displayChapterNumber || idx + 1}
                                    </span>
                                    {prog && (
                                      <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.2 rounded-full">
                                        Read {prog.currentPage}/{prog.totalPages}p
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm md:text-[15px] font-bold text-[#1b2124] truncate">
                                    {ch.title}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 flex-shrink-0">
                                <span className="text-xs font-semibold text-gray-500 hidden sm:inline">
                                  {ch.totalPageCount} Pages
                                </span>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openChapterInReader(activeBookDetail, ch, "read");
                                  }}
                                  className="bg-[#1b2124] hover:bg-[#5856d6] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                                >
                                  Read PDF
                                </button>

                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#4b5563"
                                  strokeWidth="2.2"
                                  className={`transition-transform ${
                                    isOpen ? "rotate-180" : ""
                                  }`}
                                >
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                              </div>
                            </div>

                            {/* Expanded Chapter Actions (Read, Practice, Highlights, Raw PDF) */}
                            {isOpen && (
                              <div className="px-4 md:px-5 pb-4 pt-2 border-t border-gray-100 bg-slate-50/40">
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                                  <button
                                    onClick={() =>
                                      openChapterInReader(activeBookDetail, ch, "read")
                                    }
                                    className="bg-[#f8fafc] hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg p-3 flex items-center justify-center gap-2 text-xs font-bold text-[#1b2124] transition cursor-pointer"
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="#3b82f6"
                                      strokeWidth="2.2"
                                    >
                                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                    </svg>
                                    Read Interactive PDF
                                  </button>

                                  <button
                                    onClick={() =>
                                      openChapterInReader(
                                        activeBookDetail,
                                        ch,
                                        "practice"
                                      )
                                    }
                                    className="bg-[#f8fafc] hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg p-3 flex items-center justify-center gap-2 text-xs font-bold text-[#1b2124] transition cursor-pointer"
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="#10b981"
                                      strokeWidth="2.2"
                                    >
                                      <polyline points="9 11 12 14 22 4" />
                                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                    </svg>
                                    Practice MCQs ({ch.customPracticeSet?.length || 4} Sets)
                                  </button>

                                  <button
                                    onClick={() =>
                                      openChapterInReader(
                                        activeBookDetail,
                                        ch,
                                        "highlights"
                                      )
                                    }
                                    className="bg-[#f8fafc] hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg p-3 flex items-center justify-center gap-2 text-xs font-bold text-[#1b2124] transition cursor-pointer"
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="#f59e0b"
                                      strokeWidth="2.2"
                                    >
                                      <path d="M12 20h9" />
                                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                    </svg>
                                    Highlights & Notes
                                  </button>

                                  <a
                                    href={rawChPdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-[#f8fafc] hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg p-3 flex items-center justify-center gap-2 text-xs font-bold text-[#1b2124] transition"
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="#5856d6"
                                      strokeWidth="2.2"
                                    >
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                      <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                    Open Raw PDF ↗
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Know More Cards */}
                  {activeBookDetail.knowMore.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {activeBookDetail.knowMore.map((km, i) => (
                        <div
                          key={i}
                          className="border border-gray-200 rounded-xl p-4 bg-white"
                        >
                          <h4 className="text-sm font-extrabold text-[#1b2124] mb-2">
                            {km.title}
                          </h4>
                          <ul className="space-y-1.5 text-xs text-gray-600 list-disc pl-4">
                            {km.points.slice(0, 5).map((pt, j) => (
                              <li key={j}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Additional Details Accordions */}
                  <div className="space-y-2 pt-2">
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() =>
                          setOpenAccordion((p) => ({ ...p, desc: !p.desc }))
                        }
                        className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-gray-50 text-sm font-bold text-[#1b2124] cursor-pointer"
                      >
                        <span>Book Description</span>
                        <span>{openAccordion.desc ? "−" : "+"}</span>
                      </button>
                      {openAccordion.desc && (
                        <div className="px-5 pb-4 pt-2 border-t border-gray-100 text-xs text-gray-600 leading-relaxed">
                          {activeBookDetail.title} ({activeBookDetail.edition}) is a
                          comprehensive digital study module crafted by{" "}
                          {activeBookDetail.author} for {activeBookDetail.displayClass}{" "}
                          students. It includes {activeBookDetail.chapterDetails.length}{" "}
                          high-yield chapters, solved examples, topic-wise exercises, and
                          instant PDF reader support.
                        </div>
                      )}
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() =>
                          setOpenAccordion((p) => ({ ...p, digital: !p.digital }))
                        }
                        className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-gray-50 text-sm font-bold text-[#1b2124] cursor-pointer"
                      >
                        <span>About the Digital PDF Version</span>
                        <span>{openAccordion.digital ? "−" : "+"}</span>
                      </button>
                      {openAccordion.digital && (
                        <div className="px-5 pb-4 pt-2 border-t border-gray-100 text-xs text-gray-600 leading-relaxed">
                          Read online instantly in the RaysBook Secure Reader with
                          high-DPI PDF.js canvas zoom, page-level sticky notes, colored
                          highlights, and interactive MCQ practice sets.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        ) : activeNav === "home" ? (
          /* CASE B: HOME / MY BOOKSHELF VIEW (#home-view) */
          <main className="flex-1 flex flex-col overflow-hidden bg-[#fafafa]">
            <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="md:hidden p-1 text-[#1b2124]"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
                <h1 className="text-lg font-extrabold text-[#1b2124]">
                  My Bookshelf
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <div
                  onClick={() => setSearchModalOpen(true)}
                  className="relative w-48 sm:w-72 cursor-pointer"
                >
                  <input
                    type="text"
                    readOnly
                    placeholder='Search for "Book Titles"'
                    className="w-full border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-sm font-medium bg-white cursor-pointer focus:outline-none"
                  />
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2.5"
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <h2 className="text-2xl font-extrabold text-[#1b2124] mb-1">
                My Bookshelf
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Books you&apos;ve saved for quick access and continuous PDF reading
              </p>

              {savedBooksList.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center max-w-lg mx-auto my-8">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-[#5856d6] flex items-center justify-center mx-auto mb-3">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-extrabold text-[#1b2124] mb-1">
                    Your Bookshelf is Empty
                  </h3>
                  <p className="text-xs text-gray-500 mb-5">
                    Explore our catalog of 235+ NEET, JEE, NCERT & Board modules and
                    save books here or start reading any PDF chapter.
                  </p>
                  <button
                    onClick={() => setActiveNav("explore")}
                    className="bg-[#1b2124] text-white text-xs font-bold px-5 py-2.5 rounded-full cursor-pointer"
                  >
                    Explore All Books
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {savedBooksList.map((item) => (
                    <div
                      key={item.bookId}
                      onClick={() => openBookDetails(item.bookId)}
                      className="book-card bg-white border border-gray-100 rounded-xl overflow-hidden shadow-2xs hover:shadow-md hover:-translate-y-1 hover:border-[#5856d6] transition cursor-pointer flex flex-col"
                    >
                      <div className="relative bg-gray-50 aspect-[3/4] overflow-hidden">
                        <img
                          src={item.coverUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        {item.lastReadPage > 1 && (
                          <span className="absolute bottom-2 left-2 right-2 bg-[#1b2124]/90 text-white text-[10px] font-bold px-2 py-1 rounded text-center truncate">
                            Continue Page {item.lastReadPage}/{item.totalPages}
                          </span>
                        )}
                      </div>
                      <div className="p-3 flex flex-col flex-1">
                        <span className="text-[10px] font-bold text-[#ea580c] mb-1">
                          {item.edition || "2026 Edition"}
                        </span>
                        <h3 className="text-xs font-bold text-[#1b2124] line-clamp-2 mb-2">
                          {item.title}
                        </h3>
                        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between gap-1">
                          <span className="text-[11px] text-gray-500 truncate">
                            {item.author}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openBookDetails(item.bookId, true);
                            }}
                            className="text-[11px] font-extrabold text-[#5856d6] hover:underline cursor-pointer"
                          >
                            Open PDF →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        ) : activeNav === "passes" ? (
          /* CASE C: BOOKS PASS VIEW */
          <main className="flex-1 flex flex-col overflow-y-auto bg-[#fafafa]">
            <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="md:hidden p-1 text-[#1b2124]"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
                <h1 className="text-lg font-extrabold text-[#1b2124]">
                  Digital Books Pass
                </h1>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Use Code RAYS100 for Instant Unlock
              </span>
            </header>

            <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-[#1b2124]">
                  All Exam Star Passes (2026–2028)
                </h2>
                <p className="text-sm text-gray-500">
                  Unlock unlimited access to all digital coaching modules, NCERT books,
                  and handwritten notes in your cohort
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {BOOK_PASSES.map((pass) => {
                  const isUnlocked = unlockedPasses.some(
                    (u) => u.passId === pass.passId
                  );
                  return (
                    <div
                      key={pass.passId}
                      className="rounded-2xl overflow-hidden border border-gray-200 bg-[#1b2124] text-white p-6 flex flex-col justify-between relative shadow-md"
                      style={{
                        backgroundImage:
                          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                            {pass.badge}
                          </span>
                          <span className="text-xs text-gray-300 font-semibold">
                            {pass.bookCount} Digital Books • {pass.expiryLabel}
                          </span>
                        </div>

                        <h3 className="text-xl font-extrabold text-amber-300 mb-1">
                          {pass.title}
                        </h3>
                        <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                          {pass.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-white">
                              ₹{pass.price}
                            </span>
                            <span className="text-xs text-gray-400 line-through">
                              ₹{pass.originalPrice}
                            </span>
                            <span className="text-xs font-extrabold text-emerald-400">
                              {pass.discountPercent}% OFF
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400">
                            Target Exam {pass.examTargetYear}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedCohort(pass.cohort);
                              setActiveNav("explore");
                            }}
                            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
                          >
                            View Books
                          </button>
                          <button
                            onClick={() => handleUnlockPass(pass)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                              isUnlocked
                                ? "bg-emerald-500 text-white"
                                : "bg-amber-400 hover:bg-amber-300 text-[#1b2124]"
                            }`}
                          >
                            {isUnlocked ? "Unlocked ✓" : "Unlock Pass"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        ) : activeNav === "purchases" ? (
          /* CASE D: MY PURCHASES & CUSTOM UPLOADED PDF BOOKS VIEW */
          <main className="flex-1 flex flex-col overflow-y-auto bg-[#fafafa]">
            <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="md:hidden p-1 text-[#1b2124]"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
                <h1 className="text-lg font-extrabold text-[#1b2124]">
                  My Purchases & Uploaded PDFs
                </h1>
              </div>

              <button
                onClick={() => setUploadModalOpen(true)}
                className="bg-[#5856d6] hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer"
              >
                + Upload / Add PDF Book
              </button>
            </header>

            <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8">
              {/* Unlocked Passes */}
              {unlockedPasses.length > 0 && (
                <div>
                  <h2 className="text-lg font-extrabold text-[#1b2124] mb-3">
                    Active Subscriptions & Passes ({unlockedPasses.length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {unlockedPasses.map((up) => (
                      <div
                        key={up.passId}
                        className="bg-white border border-emerald-200 rounded-xl p-4 flex items-center justify-between shadow-2xs"
                      >
                        <div>
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            ACTIVE PASS
                          </span>
                          <h3 className="text-sm font-bold text-[#1b2124] mt-1">
                            {up.title}
                          </h3>
                          <p className="text-xs text-gray-500">
                            Cohort: {up.cohort}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedCohort(up.cohort);
                            setActiveNav("explore");
                          }}
                          className="bg-[#1b2124] text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                        >
                          Open
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Purchased / Unlocked Books */}
              <div>
                <h2 className="text-lg font-extrabold text-[#1b2124] mb-1">
                  Unlocked & Custom PDF Books ({purchasedBooksList.length})
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Tap on any book to open its chapters and read the PDF immediately
                </p>

                {purchasedBooksList.length === 0 ? (
                  <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center">
                    <p className="text-sm font-bold text-gray-700 mb-1">
                      No purchased or uploaded books yet
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      Unlock any book from Explore for free using coupon RAYS100, or
                      upload your own PDF file!
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => setActiveNav("explore")}
                        className="bg-[#1b2124] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                      >
                        Browse Catalog
                      </button>
                      <button
                        onClick={() => setUploadModalOpen(true)}
                        className="bg-[#5856d6] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                      >
                        + Upload PDF Book
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {purchasedBooksList.map((item) => (
                      <div
                        key={item.bookId}
                        onClick={() => openBookDetails(item.bookId)}
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:border-[#5856d6] transition cursor-pointer flex flex-col"
                      >
                        <div className="aspect-[3/4] bg-gray-50 relative">
                          <img
                            src={item.coverUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                            UNLOCKED
                          </span>
                        </div>
                        <div className="p-3 flex flex-col flex-1">
                          <h3 className="text-xs font-bold text-[#1b2124] line-clamp-2 mb-2">
                            {item.title}
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openBookDetails(item.bookId, true);
                            }}
                            className="mt-auto w-full bg-[#1b2124] hover:bg-[#5856d6] text-white text-xs font-bold py-1.5 rounded-lg transition cursor-pointer"
                          >
                            Read PDF Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        ) : (
          /* CASE E: MAIN EXPLORE VIEW (#explore-view) */
          <main id="explore-view" className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bar Header */}
            <div className="bg-white border-b border-[#e5e7eb] sticky top-0 z-20 flex-shrink-0">
              {/* Row 1: Title + Change Button + Install App + Search Bar */}
              <div className="flex items-center justify-between px-4 md:px-8 py-3.5 gap-4">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setMobileSidebarOpen(true)}
                    className="md:hidden p-1 text-[#1b2124]"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1b2124"
                      strokeWidth="2"
                    >
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                  </button>
                  <h1 className="text-lg font-extrabold text-[#1b2124]">
                    RaysBook.live
                  </h1>
                </div>

                <div className="flex items-center gap-3 md:gap-5 flex-1 justify-end">
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#5856d6] bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition cursor-pointer"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Upload PDF
                  </button>

                  <button
                    onClick={() =>
                      triggerToast(
                        "RaysBook.live Web App is ready for instant online & offline-cached reading!"
                      )
                    }
                    className="hidden lg:flex items-center gap-1.5 text-sm font-bold text-[#1b2124] hover:text-[#5856d6] transition cursor-pointer"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Install App</span>
                  </button>

                  {/* Search Trigger Box (matching #search-input on books.streamfiles.eu.org) */}
                  <div
                    onClick={() => setSearchModalOpen(true)}
                    className="relative w-full max-w-[320px] cursor-pointer"
                  >
                    <input
                      type="text"
                      readOnly
                      placeholder='Search for "Book Titles" (Ctrl+K)'
                      className="w-full border border-[#e5e7eb] hover:border-[#5856d6] rounded-lg py-2.5 pl-10 pr-4 text-sm font-medium bg-white text-[#1b2124] cursor-pointer transition focus:outline-none"
                    />
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#9ca3af"
                      strokeWidth="2.5"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Row 3: Sticky Change Button + Cohort Chips */}
              <div className="px-4 md:px-8 pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <div className="sticky left-0 z-10 bg-white flex items-center gap-2 pr-1 flex-shrink-0">
                  <button
                    onClick={() => setOnboardingModalOpen(true)}
                    className="bg-white hover:border-[#5856d6] border border-[#d9dce1] rounded-lg px-3.5 py-1.5 text-[13px] font-bold text-[#1b2124] flex items-center gap-1.5 shadow-2xs transition cursor-pointer whitespace-nowrap"
                  >
                    Change
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M16.9697 8.07024L9.44751 16.653M3.07024 11.9701L11.653 4.448"
                        stroke="#1b2124"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  <div className="h-5 w-[1px] bg-gray-200 mx-1" />
                </div>

                <div className="flex items-center gap-2.5 flex-nowrap">
                  {COHORT_LIST.map((c) => {
                    const active = selectedCohort === c.slug;
                    return (
                      <button
                        key={c.slug}
                        onClick={() => {
                          setSelectedCohort(c.slug);
                          setSelectedTagFilter("ALL");
                          setSelectedClassFilter("ALL");
                        }}
                        className={`px-4 py-1.5 rounded-full text-[13px] font-bold border transition whitespace-nowrap cursor-pointer ${
                          active
                            ? "bg-[#111827] text-white border-[#111827]"
                            : "bg-white text-[#4b5563] border-[#d9dce1] hover:border-gray-400"
                        }`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Scrollable Main Explorer Content */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-4 pb-20">
              {/* Hero Pass Banner (#hero-banner-container) */}
              {activePassBanner && (
                <div
                  className="mb-8 rounded-xl overflow-hidden bg-[#1b2124] text-white p-5 md:p-7 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                >
                  <div className="flex-1 flex flex-col items-start gap-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-400 text-[#1b2124] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {activePassBanner.badge}
                      </span>
                      <span className="text-xs text-emerald-400 font-bold">
                        {activePassBanner.discountPercent}% OFF •{" "}
                        {activePassBanner.bookCount} Digital Books
                      </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black text-amber-300 leading-tight">
                      {activePassBanner.title}
                    </h2>
                    <p className="text-sm md:text-base text-gray-200 font-medium max-w-xl">
                      {activePassBanner.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <button
                        onClick={() => handleUnlockPass(activePassBanner)}
                        className="bg-white hover:bg-gray-100 text-[#1b2124] font-extrabold text-xs md:text-sm px-5 py-2.5 rounded-full transition cursor-pointer shadow-sm"
                      >
                        {unlockedPasses.some(
                          (u) => u.passId === activePassBanner.passId
                        )
                          ? "Pass Unlocked ✓ (All Books Active)"
                          : `Unlock Pass — ₹${activePassBanner.price}`}
                      </button>
                      <button
                        onClick={() => setActiveNav("passes")}
                        className="text-xs font-bold text-gray-300 hover:text-white underline cursor-pointer"
                      >
                        View All Exam Passes →
                      </button>
                    </div>
                  </div>

                  {/* Book Cover Stack */}
                  <div className="flex items-center justify-center gap-3 flex-shrink-0">
                    {(activePassBanner.coverBooks.length > 0
                      ? activePassBanner.coverBooks
                      : books.slice(0, 3).map((b) => b.coverUrl)
                    )
                      .slice(0, 3)
                      .map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt="Pass Book"
                          className={`w-20 md:w-24 h-28 md:h-32 object-cover rounded-lg shadow-xl border border-white/15 transition-transform ${
                            idx === 1 ? "-translate-y-2 scale-105 z-10" : "opacity-90"
                          }`}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* All Books Heading + Inline Filter Controls */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-2xl font-extrabold text-[#1b2124]">
                      All Books
                    </h2>
                    <span className="bg-gray-100 text-gray-700 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                      {filteredExploreBooks.length} books
                    </span>
                  </div>
                  <p className="text-sm text-[#757575]">
                    Find all the books you need to succeed — click any book to view
                    chapters or open its PDF
                  </p>
                </div>

                {/* Inline Filter & Quick Search */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative">
                    <input
                      type="text"
                      value={inlineSearch}
                      onChange={(e) => setInlineSearch(e.target.value)}
                      placeholder="Filter books..."
                      className="border border-[#d9dce1] focus:border-[#5856d6] rounded-full py-1.5 pl-8 pr-3 text-xs font-medium text-[#1b2124] focus:outline-none w-44 sm:w-56"
                    />
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#6b7280"
                      strokeWidth="2.5"
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>

                  <select
                    value={selectedClassFilter}
                    onChange={(e) => setSelectedClassFilter(e.target.value)}
                    className="filter-select border border-[#d9dce1] rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#1b2124] bg-white cursor-pointer focus:outline-none hover:border-[#5856d6]"
                  >
                    <option value="ALL">All Classes</option>
                    <option value="12">Class 12th</option>
                    <option value="11">Class 11th</option>
                    <option value="10">Class 10th</option>
                    <option value="9">Class 9th</option>
                  </select>

                  <select
                    value={selectedTagFilter}
                    onChange={(e) => setSelectedTagFilter(e.target.value)}
                    className="filter-select border border-[#d9dce1] rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#1b2124] bg-white cursor-pointer focus:outline-none hover:border-[#5856d6]"
                  >
                    {allAvailableTags.map((t) => (
                      <option key={t} value={t}>
                        {t === "ALL" ? "All Categories" : t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Book Cards Grid (#books-grid) */}
              {isLoadingBooks ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="border border-gray-100 rounded-xl p-3 space-y-3 animate-pulse"
                    >
                      <div className="aspect-[3/4] bg-gray-200 rounded-lg" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ) : filteredExploreBooks.length === 0 ? (
                <div className="bg-[#f9fafb] border border-dashed border-[#d1d5db] rounded-2xl p-12 text-center">
                  <p className="text-base font-bold text-gray-800 mb-1">
                    No books found matching your filter
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Try clearing the filter or searching across all cohorts in the
                    Global Search Modal.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setInlineSearch("");
                        setSelectedTagFilter("ALL");
                        setSelectedClassFilter("ALL");
                      }}
                      className="bg-white border border-gray-300 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                    >
                      Reset Filters
                    </button>
                    <button
                      onClick={() => {
                        setModalSearchQuery(inlineSearch);
                        setSearchModalOpen(true);
                      }}
                      className="bg-[#1b2124] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                    >
                      Search All 235+ Books
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-8">
                  {filteredExploreBooks.map((book) => {
                    const isSaved = bookshelf.some(
                      (b) => b.bookId === book.bookId && b.isSaved
                    );
                    return (
                      <div
                        key={book.bookId}
                        onClick={() => openBookDetails(book.bookId)}
                        className="book-card group bg-white border border-[#f1f2f4] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-[#5856d6] flex flex-col"
                      >
                        {/* Book Cover Wrapper */}
                        <div className="relative aspect-[3/4] bg-[#f8fafc] overflow-hidden flex items-center justify-center p-2">
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            loading="lazy"
                            className="w-full h-full object-contain rounded-md group-hover:scale-103 transition-transform duration-300"
                          />

                          {/* Bookmark / Save Icon */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleBookshelf(book);
                            }}
                            title={
                              isSaved ? "Saved in Bookshelf" : "Save to Bookshelf"
                            }
                            className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-xs transition cursor-pointer ${
                              isSaved
                                ? "bg-[#5856d6] text-white"
                                : "bg-white/90 text-gray-600 hover:bg-white"
                            }`}
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill={isSaved ? "currentColor" : "none"}
                              stroke="currentColor"
                              strokeWidth="2.2"
                            >
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                          </button>

                          {/* Quick Read PDF Overlay Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openBookDetails(book.bookId, true);
                            }}
                            className="opacity-0 group-hover:opacity-100 absolute bottom-2 left-2 right-2 bg-[#1b2124]/95 hover:bg-[#5856d6] text-white text-[11px] font-bold py-1.5 px-2 rounded-lg shadow-md transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            Open PDF
                          </button>
                        </div>

                        {/* Card Info */}
                        <div className="p-3 flex flex-col flex-1">
                          {/* Tag & Class Row */}
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="bg-[#fff3e0] text-[#ef6c00] text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase truncate max-w-[70%]">
                              {book.tags[0] || "Modules"}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">
                              {book.displayClass}
                            </span>
                          </div>

                          {/* Book Title */}
                          <h3
                            title={book.title}
                            className="text-[13px] font-bold text-[#1b2124] leading-snug line-clamp-2 h-[36px] mb-1"
                          >
                            {book.title}
                          </h3>

                          {/* Author & Chevron */}
                          <div className="mt-auto pt-1.5 flex items-center justify-between text-[11px] text-[#7b8086]">
                            <span className="truncate max-w-[82%] font-medium">
                              {book.author}
                            </span>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        )}
      </div>

      {/* ===================== SEARCH MODAL (#search-modal) ===================== */}
      {searchModalOpen && (
        <div
          onClick={() => setSearchModalOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-start justify-center pt-[5vh] px-3"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-[1000px] max-h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-[#1b2124]">
                Search For Book Titles
              </h3>
              <button
                onClick={() => setSearchModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Search Input */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="relative">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="2.5"
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  placeholder="Search by Book Title, Subject (Physics, Chemistry, Biology, Maths, NCERT), Author, or Exam..."
                  className="w-full border border-gray-300 focus:border-[#7c3aed] focus:ring-3 focus:ring-purple-500/15 rounded-lg py-3 pl-12 pr-10 text-sm font-medium text-[#1b2124] focus:outline-none"
                  autoFocus
                />
                {modalSearchQuery && (
                  <button
                    onClick={() => setModalSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            {/* Results Grid */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {isSearchingModal
                    ? "Searching across all cohorts..."
                    : modalSearchQuery
                    ? `Found ${modalSearchResults.length} matching books`
                    : "Popular & Featured Books"}
                </span>
              </div>

              {modalSearchResults.length === 0 && !isSearchingModal ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm font-bold text-gray-600 mb-1">
                    No books matched &ldquo;{modalSearchQuery}&rdquo;
                  </p>
                  <p className="text-xs">
                    Try searching for Physics, Chemistry, Botany, Zoology, Maths,
                    NCERT, Lakshya, Arjuna, Udaan, or Neev
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {modalSearchResults.map((b) => (
                    <div
                      key={b.bookId}
                      onClick={() => openBookDetails(b.bookId)}
                      className="border border-gray-200 hover:border-blue-500 rounded-xl overflow-hidden bg-white hover:-translate-y-1 hover:shadow-md transition cursor-pointer flex flex-col"
                    >
                      <div className="h-36 bg-gray-50 flex items-center justify-center p-2">
                        <img
                          src={b.coverUrl}
                          alt={b.title}
                          className="h-full w-auto object-contain rounded"
                        />
                      </div>
                      <div className="p-3 flex flex-col gap-1.5 flex-1">
                        <span className="bg-[#fff3e0] text-[#ef6c00] text-[9px] font-bold px-1.5 py-0.5 rounded w-max uppercase">
                          {b.tags[0] || b.cohort}
                        </span>
                        <div className="text-xs font-bold text-[#1b2124] line-clamp-2">
                          {b.title}
                        </div>
                        <div className="text-[10px] text-gray-500 font-medium mt-auto">
                          {b.author} • {b.displayClass}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openBookDetails(b.bookId, true);
                          }}
                          className="mt-1 w-full bg-[#1b2124] hover:bg-[#5856d6] text-white text-[11px] font-bold py-1.5 rounded-md transition cursor-pointer"
                        >
                          Open PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== ONBOARDING EXAM & CLASS MODAL (#onboarding-modal) ===================== */}
      {onboardingModalOpen && (
        <div
          onClick={() => setOnboardingModalOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-[500px] max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between">
              <div className="pr-4">
                <h3 className="text-lg font-extrabold text-[#1b2124] mb-1">
                  Change Your Exam(s) and Class
                </h3>
                <p className="text-xs text-gray-500">
                  This will update your profile and book recommendations. You can
                  change this anytime here
                </p>
              </div>
              <button
                onClick={() => setOnboardingModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div>
                <h4 className="text-sm font-bold text-[#1b2124] mb-3">
                  Select Exam(s)
                </h4>
                <div className="space-y-2">
                  {EXAM_OPTIONS.map((ex) => {
                    const selected = tempExam === ex.id;
                    return (
                      <div
                        key={ex.id}
                        onClick={() => setTempExam(ex.id)}
                        className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          selected
                            ? "border-blue-500 bg-blue-50/70"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div>
                          <div className="text-sm font-bold text-[#1b2124]">
                            {ex.label}
                          </div>
                          <div className="text-xs text-gray-500">{ex.desc}</div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border ${
                            selected
                              ? "bg-blue-500 border-blue-500 text-white"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {selected && "✓"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {tempExam !== "UPSC" && (
                <div>
                  <h4 className="text-sm font-bold text-[#1b2124] mb-3">
                    Select Class
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {CLASS_OPTIONS.map((cl) => {
                      const selected = tempClass === cl.id;
                      return (
                        <button
                          key={cl.id}
                          onClick={() => setTempClass(cl.id)}
                          className={`px-4 py-2.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                            selected
                              ? "border-blue-500 bg-blue-50 text-blue-600"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {cl.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-white">
              <button
                onClick={handleSaveOnboarding}
                className="w-full py-3.5 bg-[#1b2124] hover:bg-gray-800 text-white rounded-lg text-sm font-bold transition cursor-pointer"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== BOARD SELECTION SUB-MODAL (#board-modal) ===================== */}
      {boardModalOpen && (
        <div
          onClick={() => setBoardModalOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-[440px] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-[#1b2124]">
                Select your board
              </h3>
              <button
                onClick={() => setBoardModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-2 max-h-80 overflow-y-auto">
              {BOARD_OPTIONS.map((b) => {
                const selected = tempBoard === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => setTempBoard(b.id)}
                    className={`px-4 py-3 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                      selected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-sm font-bold text-[#1b2124]">
                      {b.label}
                    </span>
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selected ? "border-blue-500" : "border-gray-300"
                      }`}
                    >
                      {selected && (
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setBoardModalOpen(false);
                  applyExamAndClassToCohort(tempExam, tempClass);
                }}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-600 cursor-pointer"
              >
                Skip
              </button>
              <button
                onClick={() => {
                  setBoardModalOpen(false);
                  applyExamAndClassToCohort(tempExam, tempClass);
                }}
                className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== UPLOAD / ADD CUSTOM PDF BOOK MODAL ===================== */}
      {uploadModalOpen && (
        <div
          onClick={() => setUploadModalOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-[480px] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-[#1b2124]">
                  Upload / Add PDF Book
                </h3>
                <p className="text-xs text-gray-500">
                  Upload any .pdf file from your device or create a custom book to
                  open in the Secure PDF Reader
                </p>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateCustomBook} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Select Local PDF File (Optional)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfFileSelect}
                  className="w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-[#5856d6] hover:file:bg-indigo-100 border border-dashed border-gray-300 rounded-xl p-2 cursor-pointer"
                />
                {customPdfFileName && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                    Loaded PDF: {customPdfFileName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Organic Chemistry Rapid Revision Notes"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-[#5856d6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Author / Institute
                  </label>
                  <input
                    type="text"
                    value={customAuthor}
                    onChange={(e) => setCustomAuthor(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5856d6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Class
                  </label>
                  <select
                    value={customClass}
                    onChange={(e) => setCustomClass(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white"
                  >
                    <option value="Class XII">Class XII</option>
                    <option value="Class XI">Class XI</option>
                    <option value="Class X">Class X</option>
                    <option value="Class IX">Class IX</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Cohort
                  </label>
                  <select
                    value={customCohort}
                    onChange={(e) => setCustomCohort(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white"
                  >
                    {COHORT_LIST.filter((c) => c.slug !== "ALL").map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Category Tag
                  </label>
                  <select
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white"
                  >
                    <option value="Modules">Modules</option>
                    <option value="NCERT">NCERT</option>
                    <option value="Handwritten Notes">Handwritten Notes</option>
                    <option value="Summary Notes">Summary Notes</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg bg-gray-100 text-xs font-bold text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCustom}
                  className="px-5 py-2.5 rounded-lg bg-[#1b2124] hover:bg-[#5856d6] text-white text-xs font-bold transition cursor-pointer"
                >
                  {isSubmittingCustom ? "Adding..." : "Add & Open PDF Reader"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== SUPPORT DRAWER (#support-modal) ===================== */}
      {supportModalOpen && (
        <div
          onClick={() => setSupportModalOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#f8fafc] w-full max-w-[640px] h-full flex flex-col overflow-y-auto shadow-2xl"
          >
            {/* Header */}
            <div className="bg-white px-7 py-5 border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#1b2124]">
                  Help & Support
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  Find answers or contact us below
                </p>
              </div>
              <button
                onClick={() => setSupportModalOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white px-7 py-4 border-b border-gray-100">
              <input
                type="text"
                value={supportSearch}
                onChange={(e) => setSupportSearch(e.target.value)}
                placeholder="Search for help topics..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-[#f8fafc] focus:outline-none focus:border-[#5856d6]"
              />
            </div>

            {/* FAQs */}
            <div className="p-7 flex-1 space-y-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Frequently Asked Questions
              </div>

              {SUPPORT_FAQS.filter(
                (f) =>
                  !supportSearch.trim() ||
                  f.q.toLowerCase().includes(supportSearch.toLowerCase()) ||
                  f.a.toLowerCase().includes(supportSearch.toLowerCase())
              ).map((faq) => {
                const isOpen = Boolean(openFaqIds[faq.id]);
                const vote = faqVotes[faq.id];
                return (
                  <div
                    key={faq.id}
                    className={`bg-white border rounded-xl overflow-hidden transition ${
                      isOpen ? "border-[#5856d6]" : "border-gray-200"
                    }`}
                  >
                    <button
                      onClick={() =>
                        setOpenFaqIds((p) => ({ ...p, [faq.id]: !p[faq.id] }))
                      }
                      className="w-full px-5 py-4 flex items-center justify-between text-left text-sm font-bold text-[#1b2124] cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <span className="text-gray-400">{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 pt-2 border-t border-gray-100 text-xs text-gray-600 leading-relaxed">
                        <p>{faq.a}</p>
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
                          <span className="text-[11px] text-gray-400 font-semibold">
                            Was this helpful?
                          </span>
                          {vote ? (
                            <span
                              className={`text-xs font-bold ${
                                vote === "yes" ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              {vote === "yes"
                                ? "✓ Thank you for the feedback!"
                                : "We'll work on improving this."}
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  setFaqVotes((p) => ({ ...p, [faq.id]: "yes" }))
                                }
                                className="border border-gray-200 hover:border-emerald-500 hover:text-emerald-600 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer"
                              >
                                👍 Yes
                              </button>
                              <button
                                onClick={() =>
                                  setFaqVotes((p) => ({ ...p, [faq.id]: "no" }))
                                }
                                className="border border-gray-200 hover:border-rose-500 hover:text-rose-600 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer"
                              >
                                👎 No
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Still Need Help Card */}
              <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5856d6] to-[#7c3aed] text-white flex items-center justify-center mx-auto mb-3">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-extrabold text-[#1b2124] mb-1">
                  Still Need Help?
                </h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4">
                  Can&apos;t find what you&apos;re looking for? Our support team is ready to
                  assist you.
                </p>
                <div className="flex justify-center gap-3">
                  <a
                    href="mailto:support@pw.live"
                    className="bg-[#5856d6] text-white text-xs font-bold px-5 py-2.5 rounded-xl"
                  >
                    Email Support
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1b2124] text-white px-5 py-3 rounded-full text-xs md:text-sm font-bold shadow-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
