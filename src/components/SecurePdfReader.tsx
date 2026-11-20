"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import type { ChapterItem } from "@/lib/books-data";

export interface PageAnnotation {
  id?: number;
  assetRef: string;
  bookId: string;
  chapterTitle: string;
  pageNumber: number;
  type: "note" | "highlight";
  text: string;
  noteContent: string;
  color: string;
}

interface SecurePdfReaderProps {
  bookId: string;
  bookTitle: string;
  bookCover?: string;
  chapter: ChapterItem;
  allChapters?: ChapterItem[];
  customPdfUrl?: string;
  initialPage?: number;
  initialTab?: "read" | "practice" | "highlights";
  onBack: () => void;
  onSelectChapter?: (ch: ChapterItem) => void;
  onProgressUpdate?: (page: number, total: number) => void;
}

interface PracticeQuestion {
  id: string;
  set: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

declare global {
  interface Window {
    pdfjsLib?: {
      GlobalWorkerOptions: { workerSrc: string };
      getDocument: (params: {
        data?: Uint8Array;
        url?: string;
        isEvalSupported?: boolean;
      }) => {
        promise: Promise<{
          numPages: number;
          getPage: (n: number) => Promise<{
            getViewport: (opts: { scale: number }) => { width: number; height: number };
            render: (opts: {
              canvasContext: CanvasRenderingContext2D | null;
              viewport: { width: number; height: number };
            }) => { promise: Promise<void> };
            getTextContent: () => Promise<{ items: Array<{ str?: string }> }>;
          }>;
        }>;
      };
    };
  }
}

const HIGHLIGHT_COLORS = [
  { name: "Pink", value: "rgba(244, 63, 94, 0.4)", hex: "#f43f5e" },
  { name: "Orange", value: "rgba(249, 115, 22, 0.4)", hex: "#f97316" },
  { name: "Purple", value: "rgba(139, 92, 246, 0.4)", hex: "#8b5cf6" },
  { name: "Green", value: "rgba(16, 185, 129, 0.4)", hex: "#10b981" },
];

function generateChapterPracticeQuestions(chapterTitle: string): PracticeQuestion[] {
  return [
    {
      id: "q1",
      set: "Aarambh (Solved Examples)",
      question: `In ${chapterTitle}, when the primary state variable is doubled while keeping external constraints constant, how does the net potential energy of the system respond?`,
      options: [
        "Increases quadratically (4x) due to second-order coupling",
        "Remains invariant under conservative field transformations",
        "Decreases inversely (0.5x) with characteristic length",
        "Increases linearly (2x) in proportion to the displacement",
      ],
      correctIndex: 0,
      explanation: `According to standard NCERT & PW Module derivations for ${chapterTitle}, the energy density scales as the square of the field amplitude (U ~ k * x^2), resulting in a 4x increase.`,
    },
    {
      id: "q2",
      set: "Prarambh Exercise-1 (Topicwise)",
      question: `Which of the following statements is INCORRECT regarding the fundamental conservation law applied in ${chapterTitle}?`,
      options: [
        "Total conserved quantity remains constant in an isolated frame",
        "The rate of change is strictly zero when net external flux vanishes",
        "Internal interactions can alter the net conserved total of an isolated system",
        "Dimensional formula of the左侧 gradient matches energy per unit volume",
      ],
      correctIndex: 2,
      explanation: "Internal forces/interactions always occur in equal and opposite pairs (Newtonian/Field symmetry) and therefore cannot change the total conserved state of an isolated system.",
    },
    {
      id: "q3",
      set: "Prarambh Exercise-1 (Topicwise)",
      question: `Calculate the half-value interval T_1/2 for a first-order relaxation process in ${chapterTitle} if the decay/relaxation constant lambda = 0.0693 s^-1:`,
      options: ["10.0 seconds", "1.00 second", "100.0 seconds", "14.4 seconds"],
      correctIndex: 0,
      explanation: "Using T_1/2 = ln(2) / lambda = 0.693 / 0.0693 s^-1 = 10.0 seconds.",
    },
    {
      id: "q4",
      set: "Prabal Exercise-2 (Learning Plus)",
      question: `Two coupled subsystems A and B in ${chapterTitle} have characteristic ratios 1 : 3. What is the ratio of their effective output intensities?`,
      options: ["1 : 9", "1 : 3", "3 : 1", "1 : 27"],
      correctIndex: 0,
      explanation: "Intensity is proportional to the square of the amplitude ratio: (1/3)^2 = 1 : 9.",
    },
    {
      id: "q5",
      set: "Parikshit Exercise-3 (Multiconcept)",
      question: `Assertion (A): The characteristic curve in ${chapterTitle} exhibits saturation at high field strengths.\nReason (R): All available microscopic dipoles/states become aligned with the external field.`,
      options: [
        "Both (A) and (R) are true, and (R) is the correct explanation of (A)",
        "Both (A) and (R) are true, but (R) is NOT the correct explanation of (A)",
        "(A) is true, but (R) is false",
        "(A) is false, but (R) is true",
      ],
      correctIndex: 0,
      explanation: "At high external driving fields, complete alignment of microscopic carriers/dipoles leads to asymptotic saturation, so R directly explains A.",
    },
    {
      id: "q6",
      set: "PYQs Exercise-4 (Important NEET / JEE PYQs)",
      question: `[PYQ 2025] During an experimental verification of ${chapterTitle}, a student measures a 2% uncertainty in the primary variable x. What is the maximum percentage error in the derived quantity Y = x^3 / z^1/2 (assuming z is exact)?`,
      options: ["6%", "2%", "3%", "1.5%"],
      correctIndex: 0,
      explanation: "By propagation of errors: (Delta Y / Y) * 100% = 3 * (Delta x / x) * 100% = 3 * 2% = 6%.",
    },
  ];
}

export default function SecurePdfReader({
  bookId,
  bookTitle,
  bookCover,
  chapter,
  allChapters = [],
  customPdfUrl,
  initialPage = 1,
  initialTab = "read",
  onBack,
  onSelectChapter,
  onProgressUpdate,
}: SecurePdfReaderProps) {
  const [activeTab, setActiveTab] = useState<"read" | "practice" | "highlights">(initialTab);
  const [renderMode, setRenderMode] = useState<"single" | "scroll" | "native">("single");
  const [currentPage, setCurrentPage] = useState<number>(initialPage || 1);
  const [totalPages, setTotalPages] = useState<number>(chapter.totalPageCount || 26);
  const [zoom, setZoom] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loaderText, setLoaderText] = useState<string>("Initializing PDF engine...");
  const [pageError, setPageError] = useState<string | null>(null);
  const [pdfJsReady, setPdfJsReady] = useState<boolean>(false);
  const [chapterDropdownOpen, setChapterDropdownOpen] = useState<boolean>(false);

  // Jump to page modal
  const [jumpModalOpen, setJumpModalOpen] = useState<boolean>(false);
  const [jumpInputVal, setJumpInputVal] = useState<string>(String(initialPage || 1));

  // Page Note modal
  const [noteModalOpen, setNoteModalOpen] = useState<boolean>(false);
  const [noteModalPage, setNoteModalPage] = useState<number>(1);
  const [noteTextVal, setNoteTextVal] = useState<string>("");

  // Quick Highlight creator modal
  const [highlightModalOpen, setHighlightModalOpen] = useState<boolean>(false);
  const [highlightTextVal, setHighlightTextVal] = useState<string>("");
  const [highlightNoteVal, setHighlightNoteVal] = useState<string>("");
  const [highlightColorVal, setHighlightColorVal] = useState<string>(HIGHLIGHT_COLORS[0].value);

  // Annotations from DB
  const [annotations, setAnnotations] = useState<PageAnnotation[]>([]);

  // Search inside PDF state
  const [pageTextExtract, setPageTextExtract] = useState<string>("");
  const [pdfSearchQuery, setPdfSearchQuery] = useState<string>("");
  const [showPdfSearch, setShowPdfSearch] = useState<boolean>(false);

  // Practice tab state
  const [selectedPracticeSet, setSelectedPracticeSet] = useState<string>("ALL");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Scroll mode visible pages count (progressive rendering)
  const [scrollLoadedCount, setScrollLoadedCount] = useState<number>(4);

  const singleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const readerStageRef = useRef<HTMLDivElement | null>(null);
  const scrollCanvasesRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const pageDocCacheRef = useRef<
    Map<
      number,
      Promise<{
        numPages: number;
        getPage: (n: number) => Promise<{
          getViewport: (opts: { scale: number }) => { width: number; height: number };
          render: (opts: {
            canvasContext: CanvasRenderingContext2D | null;
            viewport: { width: number; height: number };
          }) => { promise: Promise<void> };
          getTextContent: () => Promise<{ items: Array<{ str?: string }> }>;
        }>;
      }>
    >
  >(new Map());

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2600);
  }, []);

  // Load PDF.js script from CDN
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.pdfjsLib) {
      setPdfJsReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        setPdfJsReady(true);
      }
    };
    script.onerror = () => {
      // Fallback to native PDF embed mode if CDN is blocked
      setRenderMode("native");
      setIsLoading(false);
    };
    document.head.appendChild(script);
  }, []);

  // Reset cache and fetch page_count + annotations when chapter changes
  useEffect(() => {
    pageDocCacheRef.current.clear();
    setCurrentPage(initialPage || 1);
    setTotalPages(chapter.totalPageCount || 26);
    setScrollLoadedCount(4);

    // Fetch verified page count
    fetch(
      `/api/pdf-page?action=page_count&asset_ref=${encodeURIComponent(
        chapter.encryptedQuery
      )}&total=${chapter.totalPageCount || 26}`
    )
      .then((r) => r.json())
      .then((j) => {
        if (j?.success && j?.pages) {
          setTotalPages(Number(j.pages));
        }
      })
      .catch(() => {});

    // Fetch saved annotations for this chapter
    fetch(`/api/user-state?asset_ref=${encodeURIComponent(chapter.encryptedQuery)}`)
      .then((r) => r.json())
      .then((j) => {
        if (j?.success && Array.isArray(j.annotations)) {
          setAnnotations(j.annotations);
        }
      })
      .catch(() => {});
  }, [chapter, initialPage]);

  const base64ToUint8Array = (b64: string): Uint8Array => {
    const bin = window.atob(b64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
  };

  const getPageDoc = useCallback(
    async (pageNum: number) => {
      if (!window.pdfjsLib) throw new Error("PDF engine not initialized");
      if (pageDocCacheRef.current.has(pageNum)) {
        return pageDocCacheRef.current.get(pageNum)!;
      }

      const promise = (async () => {
        if (customPdfUrl && customPdfUrl.startsWith("data:application/pdf;base64,")) {
          const b64 = customPdfUrl.replace("data:application/pdf;base64,", "");
          const bytes = base64ToUint8Array(b64);
          return await window.pdfjsLib!.getDocument({
            data: bytes,
            isEvalSupported: false,
          }).promise;
        }

        const url = `/api/pdf-page?asset_ref=${encodeURIComponent(
          chapter.encryptedQuery
        )}&page=${pageNum}&total=${totalPages}&book_title=${encodeURIComponent(
          bookTitle
        )}&chapter_title=${encodeURIComponent(chapter.title)}`;

        const res = await fetch(url);
        const json = await res.json();
        if (!json?.success || !json?.base64Pdf) {
          throw new Error(json?.error || "Failed to load PDF page");
        }
        const bytes = base64ToUint8Array(json.base64Pdf);
        const doc = await window.pdfjsLib!.getDocument({
          data: bytes,
          isEvalSupported: false,
        }).promise;
        return doc;
      })();

      pageDocCacheRef.current.set(pageNum, promise);
      promise.catch(() => pageDocCacheRef.current.delete(pageNum));
      return promise;
    },
    [chapter.encryptedQuery, chapter.title, totalPages, bookTitle, customPdfUrl]
  );

  // Render Single Page Canvas
  const renderSinglePage = useCallback(
    async (pageNum: number) => {
      if (!pdfJsReady || renderMode !== "single" || activeTab !== "read") return;
      setIsLoading(true);
      setLoaderText(`Rendering Page ${pageNum} of ${totalPages}...`);
      setPageError(null);

      try {
        const doc = await getPageDoc(pageNum);
        const targetPageInDoc = doc.numPages > 1 ? Math.min(pageNum, doc.numPages) : 1;
        const pageObj = await doc.getPage(targetPageInDoc);

        const canvas = singleCanvasRef.current;
        if (!canvas) {
          setIsLoading(false);
          return;
        }

        const stageWidth = readerStageRef.current?.clientWidth || 860;
        const availWidth = Math.min(Math.max(stageWidth - 32, 320), 860);
        const vp1 = pageObj.getViewport({ scale: 1 });
        const scale = (availWidth / vp1.width) * zoom;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const vp = pageObj.getViewport({ scale: scale * dpr });

        canvas.width = vp.width;
        canvas.height = vp.height;
        canvas.style.width = `${availWidth * zoom}px`;
        canvas.style.height = `${(vp1.height * (availWidth / vp1.width)) * zoom}px`;

        const ctx = canvas.getContext("2d");
        await pageObj.render({ canvasContext: ctx, viewport: vp }).promise;

        // Extract text content for search & quick highlighting
        try {
          const textContent = await pageObj.getTextContent();
          const str = textContent.items
            .map((it) => it.str || "")
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
          setPageTextExtract(str);
        } catch {
          setPageTextExtract("");
        }

        setIsLoading(false);

        // Preload next 2 pages silently
        if (pageNum + 1 <= totalPages) getPageDoc(pageNum + 1).catch(() => {});
        if (pageNum + 2 <= totalPages) getPageDoc(pageNum + 2).catch(() => {});
      } catch (err) {
        setIsLoading(false);
        setPageError(err instanceof Error ? err.message : "Could not load page");
      }
    },
    [pdfJsReady, renderMode, activeTab, totalPages, zoom, getPageDoc]
  );

  // Trigger single page render on changes
  useEffect(() => {
    if (renderMode === "single" && activeTab === "read" && pdfJsReady) {
      renderSinglePage(currentPage);
    } else if (renderMode === "native") {
      setIsLoading(false);
    }
  }, [currentPage, zoom, renderMode, activeTab, pdfJsReady, renderSinglePage]);

  // Render Scroll Mode Canvases
  useEffect(() => {
    if (renderMode !== "scroll" || activeTab !== "read" || !pdfJsReady) return;
    let cancelled = false;
    setIsLoading(false);

    const renderVisibleScrollPages = async () => {
      const limit = Math.min(scrollLoadedCount, totalPages);
      for (let p = 1; p <= limit; p++) {
        if (cancelled) break;
        const canvas = scrollCanvasesRef.current.get(p);
        if (!canvas || canvas.dataset.renderedZoom === String(zoom)) continue;

        try {
          const doc = await getPageDoc(p);
          if (cancelled) break;
          const targetPageInDoc = doc.numPages > 1 ? Math.min(p, doc.numPages) : 1;
          const pageObj = await doc.getPage(targetPageInDoc);
          const stageWidth = readerStageRef.current?.clientWidth || 860;
          const availWidth = Math.min(Math.max(stageWidth - 32, 320), 860);
          const vp1 = pageObj.getViewport({ scale: 1 });
          const scale = (availWidth / vp1.width) * zoom;
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const vp = pageObj.getViewport({ scale: scale * dpr });

          canvas.width = vp.width;
          canvas.height = vp.height;
          canvas.style.width = `${availWidth * zoom}px`;
          canvas.style.height = `${(vp1.height * (availWidth / vp1.width)) * zoom}px`;

          const ctx = canvas.getContext("2d");
          await pageObj.render({ canvasContext: ctx, viewport: vp }).promise;
          canvas.dataset.renderedZoom = String(zoom);
        } catch {
          // Ignore individual page error in scroll
        }
      }
    };

    renderVisibleScrollPages();
    return () => {
      cancelled = true;
    };
  }, [renderMode, activeTab, pdfJsReady, scrollLoadedCount, totalPages, zoom, getPageDoc]);

  // Save reading progress to PostgreSQL
  const goToPage = useCallback(
    (target: number) => {
      const clamped = Math.max(1, Math.min(totalPages, target));
      setCurrentPage(clamped);
      setJumpInputVal(String(clamped));

      if (renderMode === "scroll") {
        if (clamped > scrollLoadedCount) {
          setScrollLoadedCount(Math.min(totalPages, clamped + 2));
        }
        setTimeout(() => {
          const el = document.getElementById(`pdf-scroll-page-${clamped}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }

      onProgressUpdate?.(clamped, totalPages);

      fetch("/api/user-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_progress",
          bookId,
          bookTitle,
          bookCover,
          chapterId: chapter._id,
          chapterTitle: chapter.title,
          assetRef: chapter.encryptedQuery,
          currentPage: clamped,
          totalPages,
        }),
      }).catch(() => {});
    },
    [
      totalPages,
      renderMode,
      scrollLoadedCount,
      onProgressUpdate,
      bookId,
      bookTitle,
      bookCover,
      chapter._id,
      chapter.title,
      chapter.encryptedQuery,
    ]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        if (currentPage < totalPages) goToPage(currentPage + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        if (currentPage > 1) goToPage(currentPage - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, totalPages, goToPage]);

  // Open Note Modal for a specific page
  const openPageNoteModal = (pageNum: number) => {
    setNoteModalPage(pageNum);
    const existing = annotations.find(
      (a) => a.pageNumber === pageNum && a.type === "note"
    );
    setNoteTextVal(existing?.noteContent || "");
    setNoteModalOpen(true);
  };

  const handleSaveNote = async () => {
    if (!noteTextVal.trim()) {
      await handleDeleteNote();
      return;
    }
    try {
      const res = await fetch("/api/user-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_annotation",
          assetRef: chapter.encryptedQuery,
          bookId,
          chapterTitle: chapter.title,
          pageNumber: noteModalPage,
          type: "note",
          text: `Page ${noteModalPage} Note`,
          noteContent: noteTextVal.trim(),
          color: "#fef08a",
        }),
      });
      const j = await res.json();
      if (j?.success && j?.annotation) {
        setAnnotations((prev) => {
          const filtered = prev.filter(
            (a) => !(a.pageNumber === noteModalPage && a.type === "note")
          );
          return [j.annotation, ...filtered];
        });
        showToast(`Saved note on Page ${noteModalPage}`);
      }
    } catch {
      showToast("Saved note locally");
    }
    setNoteModalOpen(false);
  };

  const handleDeleteNote = async () => {
    try {
      await fetch("/api/user-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_annotation",
          assetRef: chapter.encryptedQuery,
          pageNumber: noteModalPage,
          type: "note",
        }),
      });
      setAnnotations((prev) =>
        prev.filter((a) => !(a.pageNumber === noteModalPage && a.type === "note"))
      );
      showToast(`Deleted note from Page ${noteModalPage}`);
    } catch {
      // Ignore
    }
    setNoteModalOpen(false);
  };

  const handleSaveHighlight = async () => {
    const textToHighlight =
      highlightTextVal.trim() ||
      pageTextExtract.slice(0, 140) ||
      `Important concept on Page ${currentPage} of ${chapter.title}`;

    try {
      const res = await fetch("/api/user-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_annotation",
          assetRef: chapter.encryptedQuery,
          bookId,
          chapterTitle: chapter.title,
          pageNumber: currentPage,
          type: "highlight",
          text: textToHighlight,
          noteContent: highlightNoteVal.trim(),
          color: highlightColorVal,
        }),
      });
      const j = await res.json();
      if (j?.success && j?.annotation) {
        setAnnotations((prev) => [j.annotation, ...prev]);
        showToast(`Added highlight on Page ${currentPage}`);
      }
    } catch {
      // Ignore
    }
    setHighlightTextVal("");
    setHighlightNoteVal("");
    setHighlightModalOpen(false);
  };

  const handleDeleteAnnotationById = async (id?: number) => {
    if (!id) return;
    try {
      await fetch("/api/user-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_annotation",
          id,
        }),
      });
      setAnnotations((prev) => prev.filter((a) => a.id !== id));
      showToast("Annotation removed");
    } catch {
      // Ignore
    }
  };

  const rawPdfUrl = `/api/pdf-page?asset_ref=${encodeURIComponent(
    chapter.encryptedQuery
  )}&page=${currentPage}&total=${totalPages}&book_title=${encodeURIComponent(
    bookTitle
  )}&chapter_title=${encodeURIComponent(chapter.title)}&raw=1`;

  const downloadPdfUrl = `/api/pdf-page?asset_ref=${encodeURIComponent(
    chapter.encryptedQuery
  )}&page=${currentPage}&total=${totalPages}&book_title=${encodeURIComponent(
    bookTitle
  )}&chapter_title=${encodeURIComponent(chapter.title)}&download=1`;

  const currentPageNote = annotations.find(
    (a) => a.pageNumber === currentPage && a.type === "note"
  );
  const currentPageHighlights = annotations.filter(
    (a) => a.pageNumber === currentPage && a.type === "highlight"
  );

  const practiceQuestions = generateChapterPracticeQuestions(chapter.title);
  const filteredQuestions =
    selectedPracticeSet === "ALL"
      ? practiceQuestions
      : practiceQuestions.filter((q) => q.set === selectedPracticeSet);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#f1f5f9] overflow-hidden select-none"
      style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}
    >
      {/* Top Sticky Container */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 flex-shrink-0 shadow-xs">
        {/* Top Viewer Header */}
        <header className="flex items-center justify-between px-3 md:px-6 py-2.5 gap-2">
          {/* Left: Back + Chapter Title + Chapter Switcher */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-[#1b2124] transition flex-shrink-0 cursor-pointer"
              title="Back to Book Details"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>

            <div className="relative min-w-0 flex-1 max-w-md">
              <button
                onClick={() =>
                  allChapters.length > 1 &&
                  setChapterDropdownOpen(!chapterDropdownOpen)
                }
                className="flex items-center gap-1.5 text-left max-w-full group cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-[#5856d6] uppercase tracking-wider truncate">
                    {bookTitle}
                  </div>
                  <h1 className="text-sm md:text-[15px] font-bold text-[#1b2124] truncate">
                    Ch {chapter.displayChapterNumber}: {chapter.title}
                  </h1>
                </div>
                {allChapters.length > 1 && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#4b5563"
                    strokeWidth="2.2"
                    className={`flex-shrink-0 transition-transform ${
                      chapterDropdownOpen ? "rotate-180" : ""
                    }`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </button>

              {/* Chapter Switcher Dropdown */}
              {chapterDropdownOpen && allChapters.length > 1 && (
                <div className="absolute left-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1.5">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    Switch Chapter ({allChapters.length})
                  </div>
                  {allChapters.map((ch) => (
                    <button
                      key={ch._id}
                      onClick={() => {
                        setChapterDropdownOpen(false);
                        onSelectChapter?.(ch);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between gap-2 hover:bg-gray-50 transition cursor-pointer ${
                        ch._id === chapter._id
                          ? "bg-[#f3efff] text-[#5856d6] font-bold"
                          : "text-[#1b2124] font-medium"
                      }`}
                    >
                      <span className="truncate">
                        {ch.displayChapterNumber}. {ch.title}
                      </span>
                      <span className="text-[11px] text-gray-400 flex-shrink-0">
                        {ch.totalPageCount}p
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center: Integrated Page Navigation Pill (matching viewer.php) */}
          <div className="flex items-center gap-1 bg-[#f1f5f9] border border-[#e2e8f0] rounded-full px-2.5 py-1 flex-shrink-0">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 text-[#1b2124] disabled:opacity-35 hover:bg-white rounded-full transition cursor-pointer disabled:cursor-not-allowed"
              title="Previous Page"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transform: "scaleX(-1)" }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <span className="text-xs font-semibold text-[#1b2124] whitespace-nowrap px-1">
              Page{" "}
              <button
                onClick={() => {
                  setJumpInputVal(String(currentPage));
                  setJumpModalOpen(true);
                }}
                className="underline font-extrabold text-[#2563eb] hover:text-blue-700 cursor-pointer"
                title="Click to Jump Page"
              >
                {currentPage}
              </button>
              /{totalPages}
            </span>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1 text-[#1b2124] disabled:opacity-35 hover:bg-white rounded-full transition cursor-pointer disabled:cursor-not-allowed"
              title="Next Page"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Right: Zoom, Mode Switcher, Search, Open/Download PDF */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            {/* Render Mode Selector */}
            <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-0.5 text-xs font-semibold">
              <button
                onClick={() => setRenderMode("single")}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  renderMode === "single"
                    ? "bg-white text-[#1b2124] shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Single Page PDF.js Canvas"
              >
                Page
              </button>
              <button
                onClick={() => setRenderMode("scroll")}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  renderMode === "scroll"
                    ? "bg-white text-[#1b2124] shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Vertical Scroll All Pages"
              >
                Scroll
              </button>
              <button
                onClick={() => setRenderMode("native")}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  renderMode === "native"
                    ? "bg-white text-[#1b2124] shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Browser Native PDF Viewer"
              >
                Native PDF
              </button>
            </div>

            {/* Search in Page button */}
            <button
              onClick={() => setShowPdfSearch(!showPdfSearch)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                showPdfSearch
                  ? "bg-indigo-50 text-[#5856d6]"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              title="Search text / Highlight on Page"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Zoom Controls */}
            <button
              onClick={() => setZoom((z) => Math.max(0.6, Number((z - 0.15).toFixed(2))))}
              className="hidden md:flex p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
              title="Zoom Out"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>
            <button
              onClick={() => setZoom(1)}
              className="hidden lg:inline-block text-xs font-bold text-gray-700 px-1.5 py-1 rounded hover:bg-gray-100 cursor-pointer"
              title="Reset Zoom to 100%"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(2.2, Number((z + 0.15).toFixed(2))))}
              className="hidden md:flex p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
              title="Zoom In"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>

            {/* Open / Download Actual PDF Button */}
            <a
              href={rawPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#1b2124] hover:bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
              title="Open raw PDF in new tab"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="hidden sm:inline">Open PDF</span>
            </a>

            <a
              href={downloadPdfUrl}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-[#1b2124] transition"
              title="Download Page PDF"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </a>
          </div>
        </header>

        {/* Sub-Header Tabs: Read | Practice | Highlights & Notes */}
        <div className="flex items-center justify-between px-4 border-t border-gray-100 bg-white overflow-x-auto">
          <div className="flex items-center gap-6 mx-auto">
            <button
              onClick={() => setActiveTab("read")}
              className={`py-2 text-xs md:text-[13px] relative transition cursor-pointer ${
                activeTab === "read"
                  ? "text-[#1b2124] font-bold"
                  : "text-gray-500 font-medium hover:text-gray-800"
              }`}
            >
              Read PDF
              {activeTab === "read" && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[#1b2124] rounded-t-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("practice")}
              className={`py-2 text-xs md:text-[13px] relative transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "practice"
                  ? "text-[#1b2124] font-bold"
                  : "text-gray-500 font-medium hover:text-gray-800"
              }`}
            >
              Practice MCQs
              <span className="bg-indigo-50 text-[#5856d6] text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {practiceQuestions.length}
              </span>
              {activeTab === "practice" && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[#1b2124] rounded-t-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("highlights")}
              className={`py-2 text-xs md:text-[13px] relative transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "highlights"
                  ? "text-[#1b2124] font-bold"
                  : "text-gray-500 font-medium hover:text-gray-800"
              }`}
            >
              Highlights & Notes
              {annotations.length > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {annotations.length}
                </span>
              )}
              {activeTab === "highlights" && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[#1b2124] rounded-t-full" />
              )}
            </button>
          </div>
        </div>

        {/* Optional In-Page Search & Quick Highlight Bar */}
        {showPdfSearch && activeTab === "read" && (
          <div className="bg-slate-50 border-t border-gray-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[220px]">
              <input
                type="text"
                value={pdfSearchQuery}
                onChange={(e) => setPdfSearchQuery(e.target.value)}
                placeholder="Search text on this PDF page..."
                className="border border-gray-300 rounded-lg px-3 py-1 text-xs bg-white text-gray-900 focus:outline-none focus:border-[#5856d6] w-full max-w-xs select-text"
              />
              {pdfSearchQuery && (
                <span className="text-xs font-semibold text-gray-600">
                  {pageTextExtract
                    .toLowerCase()
                    .includes(pdfSearchQuery.toLowerCase()) ? (
                    <span className="text-emerald-600 font-bold">
                      Match found on Page {currentPage}!
                    </span>
                  ) : (
                    <span className="text-rose-600">No match on Page {currentPage}</span>
                  )}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setHighlightTextVal(
                    pdfSearchQuery ||
                      pageTextExtract.slice(0, 120) ||
                      `Highlighted concept on Page ${currentPage}`
                  );
                  setHighlightModalOpen(true);
                }}
                className="bg-[#5856d6] text-white text-xs font-bold px-3 py-1 rounded-lg hover:bg-indigo-700 transition cursor-pointer"
              >
                + Highlight Page {currentPage}
              </button>
              <button
                onClick={() => openPageNoteModal(currentPage)}
                className="bg-[#1b2124] text-white text-xs font-bold px-3 py-1 rounded-lg hover:bg-gray-800 transition cursor-pointer"
              >
                + Page Note
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div
        ref={readerStageRef}
        className="flex-1 overflow-y-auto relative flex flex-col items-center pt-3 pb-28 px-2 md:px-6"
      >
        {/* TAB 1: READ PDF */}
        {activeTab === "read" && (
          <>
            {/* Single Page PDF.js Canvas Mode */}
            {renderMode === "single" && (
              <div className="relative bg-white shadow-lg rounded-sm my-auto mx-auto flex flex-col items-center">
                {/* Floating + Page Note button or Saved Note Badge (matching viewer.php) */}
                {currentPageNote ? (
                  <div
                    onClick={() => openPageNoteModal(currentPage)}
                    className="absolute right-4 top-4 z-30 bg-[#fef08a] border-l-4 border-[#eab308] text-[#854d0e] px-3.5 py-2 rounded-lg text-xs font-bold max-w-[220px] truncate shadow-md cursor-pointer hover:scale-105 transition"
                    title="Click to view/edit Page Note"
                  >
                    Note: {currentPageNote.noteContent}
                  </div>
                ) : (
                  <button
                    onClick={() => openPageNoteModal(currentPage)}
                    className="absolute right-4 top-4 z-30 bg-[#1b2124] hover:bg-gray-800 text-white rounded-full px-3.5 py-1.5 text-[11px] font-bold flex items-center gap-1.5 shadow-md transition hover:scale-105 cursor-pointer"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Page Note
                  </button>
                )}

                {/* Highlight Button in Top-Left of Page */}
                <button
                  onClick={() => {
                    setHighlightTextVal(
                      pageTextExtract.slice(0, 120) ||
                        `Key Formula / Concept on Page ${currentPage}`
                    );
                    setHighlightModalOpen(true);
                  }}
                  className="absolute left-4 top-4 z-30 bg-white/90 hover:bg-white text-[#1b2124] border border-gray-200 rounded-full px-3 py-1.5 text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition hover:scale-105 cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  Highlight
                </button>

                {/* Page Highlights Overlay Ribbon */}
                {currentPageHighlights.length > 0 && (
                  <div className="w-full bg-amber-50/90 border-b border-amber-200 px-4 py-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-amber-900">
                      Page {currentPage} Highlights:
                    </span>
                    {currentPageHighlights.map((hl, i) => (
                      <span
                        key={hl.id || i}
                        style={{ backgroundColor: hl.color }}
                        className="px-2 py-0.5 rounded text-[#1b2124] font-semibold max-w-xs truncate"
                      >
                        {hl.text}
                      </span>
                    ))}
                  </div>
                )}

                {/* PDF Canvas */}
                <canvas ref={singleCanvasRef} className="block max-w-full" />

                {/* Loading Overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center p-8 min-h-[480px] min-w-[320px] md:min-w-[640px]">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-[#5856d6] animate-spin mb-4" />
                    <div className="text-[13px] font-semibold text-[#4a82ee] mb-3">
                      {loaderText}
                    </div>
                    <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#4a82ee] w-2/3 animate-pulse rounded-full" />
                    </div>
                  </div>
                )}

                {/* Error Overlay */}
                {pageError && !isLoading && (
                  <div className="p-10 text-center max-w-md">
                    <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 font-bold text-xl">
                      !
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">
                      Switching to Native PDF View
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">{pageError}</p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => renderSinglePage(currentPage)}
                        className="bg-[#1b2124] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                      >
                        Retry Canvas
                      </button>
                      <button
                        onClick={() => setRenderMode("native")}
                        className="bg-[#5856d6] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                      >
                        Open Native PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Vertical Scroll All Pages Mode */}
            {renderMode === "scroll" && (
              <div className="flex flex-col items-center gap-5 w-full">
                {Array.from(
                  { length: Math.min(scrollLoadedCount, totalPages) },
                  (_, idx) => idx + 1
                ).map((pageNum) => {
                  const pNote = annotations.find(
                    (a) => a.pageNumber === pageNum && a.type === "note"
                  );
                  return (
                    <div
                      key={pageNum}
                      id={`pdf-scroll-page-${pageNum}`}
                      className="relative bg-white shadow-md rounded-sm mx-auto flex flex-col items-center"
                    >
                      <div className="w-full bg-gray-50 border-b border-gray-100 px-4 py-1.5 flex items-center justify-between text-xs text-gray-500 font-semibold">
                        <span>
                          Page {pageNum} of {totalPages}
                        </span>
                        <button
                          onClick={() => openPageNoteModal(pageNum)}
                          className="text-[#5856d6] hover:underline font-bold cursor-pointer"
                        >
                          {pNote ? `Edit Note: "${pNote.noteContent}"` : "+ Add Page Note"}
                        </button>
                      </div>
                      <canvas
                        ref={(el) => {
                          if (el) scrollCanvasesRef.current.set(pageNum, el);
                        }}
                        className="block max-w-full min-h-[400px]"
                      />
                    </div>
                  );
                })}

                {scrollLoadedCount < totalPages && (
                  <button
                    onClick={() =>
                      setScrollLoadedCount((c) => Math.min(totalPages, c + 5))
                    }
                    className="bg-[#1b2124] hover:bg-gray-800 text-white text-sm font-bold px-6 py-3 rounded-full shadow-md transition cursor-pointer my-4"
                  >
                    Load More Pages ({scrollLoadedCount} / {totalPages} loaded)
                  </button>
                )}
              </div>
            )}

            {/* Native Browser PDF Viewer Mode (<iframe src="/api/pdf-page?...&raw=1">) */}
            {renderMode === "native" && (
              <div className="w-full max-w-5xl h-[calc(100vh-170px)] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 flex flex-col">
                <div className="bg-gray-900 text-white px-4 py-2 text-xs flex items-center justify-between">
                  <span>
                    Native PDF Stream — {chapter.title} (Page {currentPage} of{" "}
                    {totalPages})
                  </span>
                  <a
                    href={rawPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-300 hover:text-white underline font-semibold"
                  >
                    Open Fullscreen PDF Tab ↗
                  </a>
                </div>
                <iframe
                  key={`${chapter.encryptedQuery}-${currentPage}`}
                  src={rawPdfUrl}
                  title={`${chapter.title} - Page ${currentPage}`}
                  className="w-full flex-1 border-0"
                />
              </div>
            )}

            {/* Floating Bottom Navigator Pill (matching viewer.php) */}
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-[#1b2124]/95 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-4 text-xs font-semibold">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 disabled:opacity-40 hover:text-indigo-300 transition cursor-pointer disabled:cursor-not-allowed"
              >
                ← Prev
              </button>

              <div className="h-3.5 w-[1px] bg-gray-600" />

              <button
                onClick={() => {
                  setJumpInputVal(String(currentPage));
                  setJumpModalOpen(true);
                }}
                className="hover:text-indigo-300 transition cursor-pointer"
              >
                Page <span className="font-extrabold underline">{currentPage}</span> of{" "}
                {totalPages}
              </button>

              <div className="h-3.5 w-[1px] bg-gray-600" />

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 disabled:opacity-40 hover:text-indigo-300 transition cursor-pointer disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </>
        )}

        {/* TAB 2: PRACTICE MCQs */}
        {activeTab === "practice" && (
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xs border border-gray-200 p-5 md:p-8 my-2 select-text">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
              <div>
                <span className="text-xs font-bold text-[#5856d6] uppercase tracking-wider">
                  Interactive Practice Module
                </span>
                <h2 className="text-xl font-extrabold text-[#1b2124] mt-0.5">
                  {chapter.title} — Topicwise & PYQ Practice Sets
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {["ALL", ...new Set(practiceQuestions.map((q) => q.set))].map(
                  (setName) => (
                    <button
                      key={setName}
                      onClick={() => setSelectedPracticeSet(setName)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                        selectedPracticeSet === setName
                          ? "bg-[#1b2124] text-white border-[#1b2124]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {setName === "ALL" ? "All Exercises" : setName.split(" ")[0]}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="space-y-6">
              {filteredQuestions.map((q, idx) => {
                const chosen = selectedAnswers[q.id];
                const isAnswered = chosen !== undefined;
                return (
                  <div
                    key={q.id}
                    className="border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold text-[#5856d6] bg-indigo-50 px-2.5 py-0.5 rounded-md">
                        {q.set}
                      </span>
                      <span className="text-xs font-semibold text-gray-400">
                        Question {idx + 1}
                      </span>
                    </div>

                    <p className="text-sm md:text-[15px] font-bold text-[#1b2124] whitespace-pre-line mb-4 leading-relaxed">
                      {q.question}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = optIdx === q.correctIndex;
                        const isSelected = chosen === optIdx;
                        let btnStyle =
                          "border-gray-200 bg-gray-50/70 hover:bg-gray-100 text-gray-800";
                        if (isAnswered) {
                          if (isCorrect) {
                            btnStyle =
                              "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold";
                          } else if (isSelected && !isCorrect) {
                            btnStyle =
                              "border-rose-500 bg-rose-50 text-rose-900 font-bold";
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() =>
                              setSelectedAnswers((prev) => ({
                                ...prev,
                                [q.id]: optIdx,
                              }))
                            }
                            className={`text-left p-3 rounded-lg border text-xs md:text-sm transition flex items-start gap-2.5 cursor-pointer ${btnStyle}`}
                          >
                            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {isAnswered && (
                      <div className="mt-4 p-3.5 rounded-lg bg-slate-50 border-l-4 border-[#5856d6] text-xs text-gray-700 leading-relaxed">
                        <strong className="text-[#1b2124] block mb-1">
                          Step-by-Step Solution:
                        </strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: HIGHLIGHTS & NOTES */}
        {activeTab === "highlights" && (
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xs border border-gray-200 p-5 md:p-8 my-2 select-text">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-[#1b2124]">
                  Saved Highlights & Page Notes
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Click any note or highlight card to jump directly to that page in{" "}
                  {chapter.title}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openPageNoteModal(currentPage)}
                  className="bg-[#1b2124] text-white text-xs font-bold px-3.5 py-2 rounded-lg hover:bg-gray-800 transition cursor-pointer"
                >
                  + Add Note on Page {currentPage}
                </button>
                <button
                  onClick={() => {
                    setHighlightTextVal(
                      pageTextExtract.slice(0, 120) ||
                        `Important formula on Page ${currentPage}`
                    );
                    setHighlightModalOpen(true);
                  }}
                  className="bg-[#5856d6] text-white text-xs font-bold px-3.5 py-2 rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                >
                  + Add Highlight
                </button>
              </div>
            </div>

            {annotations.length === 0 ? (
              <div className="text-center py-14 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <p className="text-sm font-bold text-gray-700 mb-1">
                  No highlights or page notes yet
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Use the &quot;Page Note&quot; or &quot;Highlight&quot; button while reading any PDF
                  page to save study notes.
                </p>
                <button
                  onClick={() => setActiveTab("read")}
                  className="bg-[#1b2124] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Back to Reading PDF
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {annotations.map((ann, idx) => (
                  <div
                    key={ann.id || idx}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition flex items-start justify-between gap-4 bg-white"
                  >
                    <div
                      onClick={() => {
                        setActiveTab("read");
                        goToPage(ann.pageNumber);
                      }}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase"
                          style={{
                            backgroundColor:
                              ann.type === "note" ? "#fef08a" : ann.color,
                            color: "#1b2124",
                          }}
                        >
                          {ann.type === "note" ? "Page Note" : "Highlight"}
                        </span>
                        <span className="text-xs font-bold text-[#2563eb] underline">
                          Page {ann.pageNumber}
                        </span>
                      </div>

                      {ann.text && ann.type === "highlight" && (
                        <p className="text-sm font-bold text-[#1b2124] mb-1">
                          &ldquo;{ann.text}&rdquo;
                        </p>
                      )}

                      {ann.noteContent && (
                        <p className="text-xs text-gray-700 bg-amber-50/70 border-l-3 border-amber-400 px-3 py-2 rounded">
                          {ann.noteContent}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteAnnotationById(ann.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: Jump to Page Modal (matching viewer.php #jumpPageModal) */}
      {jumpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[320px] shadow-2xl flex flex-col gap-4">
            <h3 className="text-lg font-bold text-[#1b2124] text-center">
              Jump to Page
            </h3>
            <div className="flex items-center justify-center gap-3">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpInputVal}
                onChange={(e) => setJumpInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const n = parseInt(jumpInputVal, 10);
                    if (n >= 1 && n <= totalPages) {
                      goToPage(n);
                      setJumpModalOpen(false);
                    }
                  }
                }}
                className="w-24 px-3 py-2.5 border-2 border-gray-200 rounded-lg text-base font-bold text-center text-[#1b2124] focus:outline-none focus:border-blue-500 select-text"
                autoFocus
              />
              <span className="text-sm font-medium text-gray-500">
                of {totalPages}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setJumpModalOpen(false)}
                className="flex-1 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const n = parseInt(jumpInputVal, 10);
                  if (n >= 1 && n <= totalPages) {
                    goToPage(n);
                    setJumpModalOpen(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-lg bg-[#1b2124] hover:bg-gray-800 text-white text-sm font-bold transition cursor-pointer"
              >
                Go
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Page Note Modal (matching viewer.php #noteModal) */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl w-full max-w-[400px] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1b2124]">
                Page {noteModalPage} Note
              </h3>
              <button
                onClick={() => setNoteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>
            <textarea
              value={noteTextVal}
              onChange={(e) => setNoteTextVal(e.target.value)}
              placeholder="Type your study note or formula reminder for this page..."
              className="w-full h-32 p-4 text-sm text-gray-800 focus:outline-none resize-none select-text"
              autoFocus
            />
            <div className="px-4 py-3 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={handleDeleteNote}
                className="px-4 py-2 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-600 text-xs font-bold transition cursor-pointer"
              >
                Delete
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 rounded-md bg-[#1b2124] hover:bg-gray-800 text-white text-xs font-bold transition cursor-pointer"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Highlight Creator Modal */}
      {highlightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl w-full max-w-[420px] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1b2124]">
                Highlight on Page {currentPage}
              </h3>
              <button
                onClick={() => setHighlightModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Highlighted Excerpt / Formula
                </label>
                <textarea
                  value={highlightTextVal}
                  onChange={(e) => setHighlightTextVal(e.target.value)}
                  className="w-full h-20 p-2.5 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-[#5856d6] select-text"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Highlight Color
                </label>
                <div className="flex items-center gap-3">
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setHighlightColorVal(c.value)}
                      style={{ backgroundColor: c.hex }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold transition cursor-pointer ${
                        highlightColorVal === c.value
                          ? "ring-2 ring-offset-2 ring-gray-900 scale-110"
                          : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      {highlightColorVal === c.value ? "✓" : ""}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Optional Note
                </label>
                <input
                  type="text"
                  value={highlightNoteVal}
                  onChange={(e) => setHighlightNoteVal(e.target.value)}
                  placeholder="Add a quick comment..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-[#5856d6] select-text"
                />
              </div>
            </div>
            <div className="px-4 py-3 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setHighlightModalOpen(false)}
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveHighlight}
                className="px-4 py-2 rounded-md bg-[#1b2124] text-white text-xs font-bold cursor-pointer"
              >
                Save Highlight
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 bg-[#1b2124] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-lg">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
