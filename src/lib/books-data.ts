export interface BookItem {
  bookId: string;
  title: string;
  subtitle?: string;
  author: string;
  tags: string[];
  displayClass: string;
  edition?: string;
  coverUrl: string;
  isPaid: boolean;
  price?: number;
  originalPrice?: number;
  language: string;
  cohort: string;
  collectionName?: string;
  exams?: string[];
  boards?: string[];
  noOfChapters?: number;
  pdfUrl?: string;
  isCustom?: boolean;
}

export interface ChapterPracticeSet {
  name: string;
  testId: string;
  numberOfQuestions: number;
}

export interface ChapterItem {
  _id: string;
  bookId: string;
  displayChapterNumber: number;
  title: string;
  totalPageCount: number;
  encryptedQuery: string;
  type: string;
  isSample?: boolean;
  customPracticeSet: ChapterPracticeSet[];
}

export interface BookDetailData {
  _id: string;
  bookId: string;
  title: string;
  subTitle: string;
  author: string;
  publication: string;
  publicationYear: string;
  edition: string;
  displayClass: string;
  language: string;
  noOfChapters: number;
  currentPrice: number;
  listPrice: number;
  discount: number;
  isPaid: boolean;
  tags: string[];
  exams: string[];
  boards: string[];
  coverUrl: string;
  pdfUrl?: string;
  faq: Array<{ que: string; ans: string }>;
  knowMore: Array<{ icon: string; title: string; points: string[] }>;
  chapterDetails: ChapterItem[];
}

export interface BookPassItem {
  passId: string;
  cohort: string;
  title: string;
  subtitle: string;
  badge: string;
  bookCount: number;
  price: number;
  originalPrice: number;
  discountPercent: number;
  expiryLabel: string;
  examTargetYear: number;
  description: string;
  coverBooks: string[];
}

export const COHORT_LIST = [
  { slug: "ALL", label: "All Books", exam: "ALL", className: "ALL" },
  { slug: "12_NEET", label: "12th NEET", exam: "NEET", className: "12" },
  { slug: "11_NEET", label: "11th NEET", exam: "NEET", className: "11" },
  { slug: "DROPPER_NEET", label: "Dropper NEET", exam: "NEET", className: "12+" },
  { slug: "12_JEE", label: "12th IIT-JEE", exam: "IIT-JEE", className: "12" },
  { slug: "11_JEE", label: "11th IIT-JEE", exam: "IIT-JEE", className: "11" },
  { slug: "DROPPER_JEE", label: "Dropper IIT-JEE", exam: "IIT-JEE", className: "12+" },
  { slug: "12_SCHOOL_PREP", label: "Class 12th Board", exam: "SCHOOL_PREPARATION", className: "12" },
  { slug: "11_SCHOOL_PREP", label: "Class 11th Board", exam: "SCHOOL_PREPARATION", className: "11" },
  { slug: "10_SCHOOL_PREP", label: "Class 10th (Udaan)", exam: "SCHOOL_PREPARATION", className: "10" },
  { slug: "9_SCHOOL_PREP", label: "Class 9th (Neev)", exam: "SCHOOL_PREPARATION", className: "9" },
  { slug: "UPSC", label: "UPSC CSE", exam: "UPSC", className: "Grad" },
] as const;

export const UPSTREAM_COHORTS = [
  "12_NEET",
  "11_NEET",
  "DROPPER_NEET",
  "12_JEE",
  "11_JEE",
  "DROPPER_JEE",
  "12_SCHOOL_PREP",
  "11_SCHOOL_PREP",
  "10_SCHOOL_PREP",
  "9_SCHOOL_PREP",
  "UPSC",
];

export const EXAM_OPTIONS = [
  { id: "NEET", label: "NEET", desc: "Medical Entrance Preparation (Class 11, 12 & Dropper)" },
  { id: "IIT-JEE", label: "IIT-JEE", desc: "Engineering Entrance Main & Advanced Modules" },
  { id: "SCHOOL_PREPARATION", label: "School / Board Preparation", desc: "CBSE, ICSE, State Boards, Udaan & Neev" },
  { id: "UPSC", label: "UPSC CSE", desc: "Civil Services Prelims & Mains NCERT + Standard Books" },
];

export const CLASS_OPTIONS = [
  { id: "9", label: "Class 9th" },
  { id: "10", label: "Class 10th" },
  { id: "11", label: "Class 11th" },
  { id: "12", label: "Class 12th" },
  { id: "12+", label: "Dropper / 12th Pass" },
];

export const BOARD_OPTIONS = [
  { id: "CBSE", label: "CBSE Board" },
  { id: "ICSE", label: "ICSE / ISC Board" },
  { id: "UP_BOARD", label: "UP Board" },
  { id: "BIHAR_BOARD", label: "Bihar Board" },
  { id: "MAHARASHTRA_BOARD", label: "Maharashtra Board" },
  { id: "RAJASTHAN_BOARD", label: "Rajasthan Board" },
  { id: "OTHER_BOARD", label: "Other State Board" },
];

export const BOOK_PASSES: BookPassItem[] = [
  {
    passId: "6a4b91680c30749bcb0722b7",
    cohort: "12_NEET",
    title: "Lakshya NEET Digital Books Pass",
    subtitle: "12th NEET Complete Digital Module & Notes Bundle",
    badge: "STAR PASS FOR 12 NEET",
    bookCount: 24,
    price: 1799,
    originalPrice: 5506,
    discountPercent: 67,
    expiryLabel: "One Year Validity",
    examTargetYear: 2027,
    description: "Unlimited digital access to all Lakshya NEET Physics, Chemistry, Botany, Zoology Modules, Med Easy Handwritten Notes & NCERT Exemplars.",
    coverBooks: [
      "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/8de5d17f-871d-4b86-a54e-5b3b60388f49.png",
      "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/8f654049-1b3c-4513-9210-d8c600c4d017.png",
      "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/6f73a260-906b-44fe-9f92-c92f243acfe5.png",
    ],
  },
  {
    passId: "pass_11_neet_arjuna",
    cohort: "11_NEET",
    title: "Arjuna NEET Digital Books Pass",
    subtitle: "11th NEET Foundation & Module Digital Bundle",
    badge: "STAR PASS FOR 11 NEET",
    bookCount: 22,
    price: 1699,
    originalPrice: 5200,
    discountPercent: 67,
    expiryLabel: "One Year Validity",
    examTargetYear: 2028,
    description: "Complete Class 11 NEET Physics, Chemistry, Botany & Zoology modules with topicwise PYQs, Prarambh & Parikshit exercises.",
    coverBooks: [
      "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/38ed2ed8-0606-4bba-a02e-15fb006ca127.png",
      "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/8de5d17f-871d-4b86-a54e-5b3b60388f49.png",
    ],
  },
  {
    passId: "pass_dropper_neet_yakeen",
    cohort: "DROPPER_NEET",
    title: "Yakeen NEET Dropper Digital Pass",
    subtitle: "Complete Class 11 + 12 Ranker Digital Library",
    badge: "STAR PASS FOR DROPPER NEET",
    bookCount: 36,
    price: 1999,
    originalPrice: 6499,
    discountPercent: 69,
    expiryLabel: "One Year Validity",
    examTargetYear: 2027,
    description: "All-in-one Yakeen NEET dropper modules, Med Easy 2.0 handwritten notes, Punch NCERT boosters & 37-year PYQ banks.",
    coverBooks: [
      "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/123a0f38-7b17-46e2-b60f-46dd782a3e46.png",
      "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/8f654049-1b3c-4513-9210-d8c600c4d017.png",
    ],
  },
  {
    passId: "pass_12_jee_lakshya",
    cohort: "12_JEE",
    title: "Lakshya JEE Digital Books Pass",
    subtitle: "Class 12 IIT-JEE Main & Advanced Complete Modules",
    badge: "STAR PASS FOR 12 JEE",
    bookCount: 26,
    price: 1799,
    originalPrice: 5499,
    discountPercent: 67,
    expiryLabel: "One Year Validity",
    examTargetYear: 2027,
    description: "Unlock all Lakshya JEE Physics, Chemistry & Mathematics Modules, EaJEE Handwritten Notes, and JEE Main & Advanced PYQs.",
    coverBooks: [
      "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/8de5d17f-871d-4b86-a54e-5b3b60388f49.png",
      "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/8f654049-1b3c-4513-9210-d8c600c4d017.png",
    ],
  },
  {
    passId: "pass_11_jee_arjuna",
    cohort: "11_JEE",
    title: "Arjuna JEE Digital Books Pass",
    subtitle: "Class 11 IIT-JEE Modules, EaJEE Notes & Flashcards",
    badge: "STAR PASS FOR 11 JEE",
    bookCount: 28,
    price: 1699,
    originalPrice: 5299,
    discountPercent: 68,
    expiryLabel: "One Year Validity",
    examTargetYear: 2028,
    description: "Complete Arjuna JEE Modules, EaJEE Notes, Exam Essential Notes, Summary Notes, Flashcard Zone & PYQ Test Series.",
    coverBooks: [
      "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/38ed2ed8-0606-4bba-a02e-15fb006ca127.png",
    ],
  },
  {
    passId: "pass_10_school_udaan",
    cohort: "10_SCHOOL_PREP",
    title: "Udaan Class 10th Star Pass",
    subtitle: "Class 10 Board Booster, NCERT Solutions & Question Banks",
    badge: "UDAAN STAR PASS",
    bookCount: 18,
    price: 999,
    originalPrice: 3299,
    discountPercent: 70,
    expiryLabel: "One Year Validity",
    examTargetYear: 2027,
    description: "Complete Class 10 Udaan study modules for Science, Maths, Social Science, English & Hindi along with NCERT Exemplars.",
    coverBooks: [
      "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/8de5d17f-871d-4b86-a54e-5b3b60388f49.png",
    ],
  },
  {
    passId: "pass_9_school_neev",
    cohort: "9_SCHOOL_PREP",
    title: "NEEV Class 9th Star Pass",
    subtitle: "Class 9 Foundation & NCERT Complete Digital Library",
    badge: "NEEV STAR PASS",
    bookCount: 16,
    price: 899,
    originalPrice: 2999,
    discountPercent: 70,
    expiryLabel: "One Year Validity",
    examTargetYear: 2027,
    description: "Master Class 9 Science, Mathematics, Social Science & English with PW Neev modules and interactive chapter PDFs.",
    coverBooks: [
      "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/6f73a260-906b-44fe-9f92-c92f243acfe5.png",
    ],
  },
  {
    passId: "pass_upsc_2028",
    cohort: "UPSC",
    title: "UPSC 2028 Digital Books Pass",
    subtitle: "GS Prahar, Sampoorna & Complete NCERT Class 11-12 Library",
    badge: "UPSC STAR PASS",
    bookCount: 30,
    price: 2199,
    originalPrice: 7499,
    discountPercent: 71,
    expiryLabel: "Two Years Validity",
    examTargetYear: 2028,
    description: "Complete UPSC Civil Services Prelims & Mains reference modules, Polity, History, Geography, Economy & NCERT Compendiums.",
    coverBooks: [
      "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/123a0f38-7b17-46e2-b60f-46dd782a3e46.png",
    ],
  },
];

export const FALLBACK_BOOKS: BookItem[] = [
  {
    bookId: "6978968b3b5f1c676ebc664b",
    title: "Lakshya NEET Physics (Digital Module)",
    subtitle: "Digital book with instant solutions & AI doubt support",
    author: "PW",
    tags: ["Modules"],
    displayClass: "Class XII",
    edition: "2026 Edition",
    coverUrl: "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/8de5d17f-871d-4b86-a54e-5b3b60388f49.png",
    isPaid: true,
    price: 999,
    originalPrice: 1299,
    language: "ENGLISH",
    cohort: "12_NEET",
    collectionName: "Star Pass for 12 NEET",
    exams: ["NEET"],
    boards: ["CBSE"],
    noOfChapters: 14,
  },
  {
    bookId: "697897e5479b9a2655f3788e",
    title: "Lakshya NEET Chemistry (Digital Module)",
    subtitle: "Physical, Organic & Inorganic Chemistry Class 12 Module",
    author: "PW",
    tags: ["Modules"],
    displayClass: "Class XII",
    edition: "2026 Edition",
    coverUrl: "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/8f654049-1b3c-4513-9210-d8c600c4d017.png",
    isPaid: true,
    price: 999,
    originalPrice: 1299,
    language: "ENGLISH",
    cohort: "12_NEET",
    collectionName: "Star Pass for 12 NEET",
    exams: ["NEET"],
    boards: ["CBSE"],
    noOfChapters: 16,
  },
  {
    bookId: "697898e9e8cc08fd8899e3dc",
    title: "Lakshya NEET Zoology (Digital Module)",
    subtitle: "High-yield NCERT aligned Zoology theory & NEET PYQs",
    author: "PW",
    tags: ["Modules"],
    displayClass: "Class XII",
    edition: "2026 Edition",
    coverUrl: "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/6f73a260-906b-44fe-9f92-c92f243acfe5.png",
    isPaid: true,
    price: 899,
    originalPrice: 1199,
    language: "ENGLISH",
    cohort: "12_NEET",
    collectionName: "Star Pass for 12 NEET",
    exams: ["NEET"],
    boards: ["CBSE"],
    noOfChapters: 12,
  },
  {
    bookId: "6978998a5cc30eabbae5e413",
    title: "Lakshya NEET Botany (Digital Module)",
    subtitle: "Complete Class 12 Botany with NCERT line-by-line MCQs",
    author: "PW",
    tags: ["Modules"],
    displayClass: "Class XII",
    edition: "2026 Edition",
    coverUrl: "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/123a0f38-7b17-46e2-b60f-46dd782a3e46.png",
    isPaid: true,
    price: 899,
    originalPrice: 1199,
    language: "ENGLISH",
    cohort: "12_NEET",
    collectionName: "Star Pass for 12 NEET",
    exams: ["NEET"],
    boards: ["CBSE"],
    noOfChapters: 13,
  },
  {
    bookId: "69391ef49dcd5b25c9eb875f",
    title: "Physics Med Easy 2.0 (Digital Book)",
    subtitle: "Handwritten revision notes & formula sheets by MR Sir",
    author: "Dr. Manish Raj (MR Sir)",
    tags: ["Handwritten Notes"],
    displayClass: "Class XII",
    edition: "2026 Edition",
    coverUrl: "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/38ed2ed8-0606-4bba-a02e-15fb006ca127.png",
    isPaid: true,
    price: 499,
    originalPrice: 699,
    language: "ENGLISH",
    cohort: "12_NEET",
    collectionName: "Handwritten Notes",
    exams: ["NEET"],
    boards: ["CBSE"],
    noOfChapters: 28,
  },
];

export const DEFAULT_PHYSICS_CHAPTERS: ChapterItem[] = [
  {
    _id: "ch_phys_01",
    bookId: "6978968b3b5f1c676ebc664b",
    displayChapterNumber: 1,
    title: "Electric Charges and Fields",
    totalPageCount: 48,
    encryptedQuery: "4971496e4b67706d3433753971747555634a313372365473626a50354d7375657869327339766647634e6e6b512b713579497a626957506a515279697763614a4666787168784832445256744436735536594e7347324d4971706e684a517277666476694b327441647233316548574671643069537877664a756b59584531666f50794363333557664d46556271357645383839324a4f4f5767714b584d3446414832353669324e6f47303d",
    type: "PDF",
    isSample: true,
    customPracticeSet: [
      { name: "Aarambh (Solved Examples)", testId: "t_01_1", numberOfQuestions: 15 },
      { name: "Prarambh Exercise-1 (Topicwise)", testId: "t_01_2", numberOfQuestions: 65 },
      { name: "Prabal Exercise-2 (Learning Plus)", testId: "t_01_3", numberOfQuestions: 42 },
      { name: "Parikshit Exercise-3 (Multiconcept)", testId: "t_01_4", numberOfQuestions: 25 },
      { name: "PYQs Exercise-4 (Important PYQs)", testId: "t_01_5", numberOfQuestions: 38 },
    ],
  },
  {
    _id: "ch_phys_02",
    bookId: "6978968b3b5f1c676ebc664b",
    displayChapterNumber: 2,
    title: "Electrostatic Potential and Capacitance",
    totalPageCount: 52,
    encryptedQuery: "4971496e4b67706d3433753971747555634a313372365473626a50354d7375657869327339766647634e6e6b512b713579497a626957506a515279697763614a4666787168784832445256744436735536594e7347324d4971706e684a517277666476694b327441647233316548574671643069537877664a756b5958453166766f765348594b6936646b74515053465a6c4774746a4e3458526767466e4a63507234757141713645624e666f4c364d48556765687138534449325432436b6f6e525578506b6167356b71476d4e57524d314167397148725a494a463645536a794648676f55306b4346513d",
    type: "PDF",
    isSample: false,
    customPracticeSet: [
      { name: "Aarambh (Solved Examples)", testId: "t_02_1", numberOfQuestions: 14 },
      { name: "Prarambh Exercise-1 (Topicwise)", testId: "t_02_2", numberOfQuestions: 70 },
      { name: "Prabal Exercise-2 (Learning Plus)", testId: "t_02_3", numberOfQuestions: 40 },
      { name: "PYQs Exercise-4 (Important PYQs)", testId: "t_02_4", numberOfQuestions: 34 },
    ],
  },
  {
    _id: "697b06fd413874813c3b8ad3",
    bookId: "6978968b3b5f1c676ebc664b",
    displayChapterNumber: 13,
    title: "Nuclei",
    totalPageCount: 26,
    encryptedQuery: "4971496e4b67706d3433753971747555634a313372365473626a50354d7375657869327339766647634e6e6b512b713579497a626957506a515279697763614a4666787168784832445256744436735536594e7347324d4971706e684a517277666476694b327441647233316548574671643069537877664a756b59584531666f50794363333557664d46556271357645383839324a4f4f5767714b584d3446414832353669324e6f47303d",
    type: "PDF",
    isSample: true,
    customPracticeSet: [
      { name: "Aarambh (Solved Examples)", testId: "t_13_1", numberOfQuestions: 12 },
      { name: "Prarambh Exercise-1 (Topicwise)", testId: "t_13_2", numberOfQuestions: 54 },
      { name: "Prabal Exercise-2 (Learning Plus)", testId: "t_13_3", numberOfQuestions: 32 },
      { name: "PYQs Exercise-4 (Important NEET PYQs)", testId: "t_13_4", numberOfQuestions: 29 },
    ],
  },
  {
    _id: "697b06fd413874813c3b8ad4",
    bookId: "6978968b3b5f1c676ebc664b",
    displayChapterNumber: 14,
    title: "Semiconductor Electronics Materials, Devices and Simple Circuits",
    totalPageCount: 60,
    encryptedQuery: "4971496e4b67706d3433753971747555634a313372365473626a50354d7375657869327339766647634e6e6b512b713579497a626957506a515279697763614a4666787168784832445256744436735536594e7347324d4971706e684a517277666476694b327441647233316548574671643069537877664a756b5958453166766f765348594b6936646b74515053465a6c4774746a4e3458526767466e4a63507234757141713645624e666f4c364d48556765687138534449325432436b6f6e525578506b6167356b71476d4e57524d314167397148725a494a463645536a794648676f55306b4346513d",
    type: "PDF",
    isSample: false,
    customPracticeSet: [
      { name: "Aarambh (Solved Examples)", testId: "698071bc12d4ec85f1b2bd58", numberOfQuestions: 11 },
      { name: "Prarambh Exercise-1 (Topicwise)", testId: "697dd1f152da9b6367df9a60", numberOfQuestions: 77 },
      { name: "Prabal Exercise-2 (Learning Plus)", testId: "697dd109bb34a24174f51e15", numberOfQuestions: 45 },
      { name: "Parikshit Exercise-3 (Multiconcept)", testId: "697dd07952da9b6367df9717", numberOfQuestions: 27 },
      { name: "PYQs Exercise-4 (Important NEET PYQs)", testId: "698072777ff3c627154d70dc", numberOfQuestions: 31 },
    ],
  },
];

// Global server-side cache for upstream catalog so searching across all 235+ books is instant
const globalCache = globalThis as typeof globalThis & {
  __raysBookCohortCache?: Map<string, { timestamp: number; books: BookItem[]; passes: BookPassItem[] }>;
  __raysBookDetailCache?: Map<string, { timestamp: number; detail: BookDetailData }>;
};

const COHORT_CACHE =
  globalCache.__raysBookCohortCache ??
  (globalCache.__raysBookCohortCache = new Map());

const DETAIL_CACHE =
  globalCache.__raysBookDetailCache ??
  (globalCache.__raysBookDetailCache = new Map());

const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

export async function fetchCohortBooksFromUpstream(cohortSlug: string): Promise<{
  books: BookItem[];
  passes: BookPassItem[];
}> {
  const cached = COHORT_CACHE.get(cohortSlug);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL && cached.books.length > 0) {
    return { books: cached.books, passes: cached.passes };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      `https://books.streamfiles.eu.org/api/books.php?cohort=${encodeURIComponent(cohortSlug)}`,
      {
        headers: {
          Origin: "https://books.pw.live",
          Referer: "https://books.pw.live/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
        },
        signal: controller.signal,
        cache: "no-store",
      }
    );
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      if (json?.success && json?.data?.explorePages) {
        const booksMap = new Map<string, BookItem>();
        const passesList: BookPassItem[] = [];

        for (const ep of json.data.explorePages) {
          const epObj = ep?.explorePage || {};
          const collectionName = epObj.name || "Digital Collection";
          for (const pack of epObj.books || []) {
            if (pack.bookPassId || Array.isArray(pack.books)) {
              const innerBooks: BookItem[] = [];
              for (const b of pack.books || []) {
                if (!b?.bookId) continue;
                const coverUrl =
                  b.coverImage?.fullUrl ||
                  (b.coverImage?.baseUrl && b.coverImage?.key
                    ? `${b.coverImage.baseUrl}${b.coverImage.key}`
                    : "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/8de5d17f-871d-4b86-a54e-5b3b60388f49.png");

                const item: BookItem = {
                  bookId: b.bookId,
                  title: b.title || "Digital Book",
                  subtitle: pack.subtitle || collectionName,
                  author: b.author || "PW",
                  tags: Array.isArray(b.tags) && b.tags.length > 0 ? b.tags : ["Modules"],
                  displayClass: b.displayClass || "Class XII",
                  edition: "2026 Edition",
                  coverUrl,
                  isPaid: Boolean(b.isPaid),
                  price: pack.price || 499,
                  originalPrice: pack.originalPrice || 999,
                  language: b.language || "ENGLISH",
                  cohort: cohortSlug,
                  collectionName,
                };
                booksMap.set(b.bookId, item);
                innerBooks.push(item);
              }

              if (pack.title && pack.price) {
                passesList.push({
                  passId: pack.bookPassId || pack._id || `pass_${cohortSlug}`,
                  cohort: cohortSlug,
                  title: pack.title,
                  subtitle: pack.subtitle || collectionName,
                  badge: collectionName.toUpperCase(),
                  bookCount: pack.bookCount || innerBooks.length || 20,
                  price: pack.price || 1499,
                  originalPrice: pack.originalPrice || 4999,
                  discountPercent: pack.discountPercent || 65,
                  expiryLabel: pack.expiryLabel || "One Year Validity",
                  examTargetYear: pack.examTargetYear || 2027,
                  description: pack.descriptionPass || "One pass for complete exam preparation",
                  coverBooks: innerBooks.slice(0, 3).map((x) => x.coverUrl),
                });
              }
            } else if (pack.bookId || pack._id) {
              const id = pack.bookId || pack._id;
              const coverUrl =
                pack.coverImage?.fullUrl ||
                "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/8de5d17f-871d-4b86-a54e-5b3b60388f49.png";
              booksMap.set(id, {
                bookId: id,
                title: pack.title || "Digital Module",
                subtitle: collectionName,
                author: pack.author || "PW",
                tags: Array.isArray(pack.tags) && pack.tags.length > 0 ? pack.tags : ["NCERT"],
                displayClass: pack.displayClass || "Class XII",
                edition: "2026 Edition",
                coverUrl,
                isPaid: Boolean(pack.isPaid),
                language: pack.language || "ENGLISH",
                cohort: cohortSlug,
                collectionName,
              });
            }
          }
        }

        const result = {
          books: Array.from(booksMap.values()),
          passes: passesList,
        };
        if (result.books.length > 0) {
          COHORT_CACHE.set(cohortSlug, {
            timestamp: Date.now(),
            books: result.books,
            passes: result.passes,
          });
          return result;
        }
      }
    }
  } catch {
    // Fallback below
  }

  return {
    books: FALLBACK_BOOKS.filter((b) => cohortSlug === "ALL" || b.cohort === cohortSlug),
    passes: BOOK_PASSES.filter((p) => cohortSlug === "ALL" || p.cohort === cohortSlug),
  };
}

function stripHtmlBullets(html: string): string[] {
  if (!html) return [];
  const matches = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
  if (matches.length > 0) {
    return matches.map((m) =>
      m[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .trim()
    );
  }
  const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return plain ? [plain] : [];
}

export async function fetchBookDetailFromUpstream(bookId: string): Promise<BookDetailData | null> {
  const cached = DETAIL_CACHE.get(bookId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.detail;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      `https://books.streamfiles.eu.org/api/books.php?book_chapters=${encodeURIComponent(bookId)}`,
      {
        headers: {
          Origin: "https://books.pw.live",
          Referer: "https://books.pw.live/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
        },
        signal: controller.signal,
        cache: "no-store",
      }
    );
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      if (json?.success && json?.data) {
        const d = json.data;
        const coverUrl =
          d.coverImage?.fullUrl ||
          (d.coverImage?.baseUrl && d.coverImage?.key
            ? `${d.coverImage.baseUrl}${d.coverImage.key}`
            : "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/8de5d17f-871d-4b86-a54e-5b3b60388f49.png");

        const rawChapters = Array.isArray(d.chapterDetails) ? d.chapterDetails : [];
        const activeChapters: ChapterItem[] = rawChapters
          .filter((c: Record<string, unknown>) => !c.status || c.status === "ACTIVE")
          .map((c: Record<string, unknown>, idx: number) => ({
            _id: String(c._id || `ch_${idx + 1}`),
            bookId: String(d._id || bookId),
            displayChapterNumber: Number(c.displayChapterNumber || c.displayOrder || idx + 1),
            title: String(c.title || `Chapter ${idx + 1}`),
            totalPageCount: Number(c.totalPageCount || 28),
            encryptedQuery: String(
              c.encryptedQuery || DEFAULT_PHYSICS_CHAPTERS[idx % DEFAULT_PHYSICS_CHAPTERS.length].encryptedQuery
            ),
            type: String(c.type || "PDF"),
            isSample: Boolean(c.isSample || idx === 0),
            customPracticeSet: Array.isArray(c.customPracticeSet)
              ? (c.customPracticeSet as ChapterPracticeSet[])
              : DEFAULT_PHYSICS_CHAPTERS[0].customPracticeSet,
          }))
          .sort((a: ChapterItem, b: ChapterItem) => a.displayChapterNumber - b.displayChapterNumber);

        const detail: BookDetailData = {
          _id: String(d._id || bookId),
          bookId: String(d._id || bookId),
          title: String(d.title || "Digital Module"),
          subTitle: String(d.subTitle || "Digital book with instant solutions & interactive PDF reader"),
          author: String(d.author || "PW"),
          publication: String(d.publication || "PW Publication"),
          publicationYear: String(d.publicationYear || "2026"),
          edition: String(d.edition || "2026 Edition"),
          displayClass: String(d.displayClass || "Class XII"),
          language: String(d.language || "ENGLISH"),
          noOfChapters: Number(d.noOfChapters || activeChapters.length || 14),
          currentPrice: Number(d.currentPrice ?? 499),
          listPrice: Number(d.listPrice ?? 999),
          discount: Number(d.discount ?? 50),
          isPaid: Boolean(d.isPaid),
          tags: Array.isArray(d.tags) && d.tags.length > 0 ? d.tags : ["Modules"],
          exams: Array.isArray(d.exams) && d.exams.length > 0 ? d.exams : ["NEET"],
          boards: Array.isArray(d.boards) && d.boards.length > 0 ? d.boards : ["CBSE"],
          coverUrl,
          faq: Array.isArray(d.faq) && d.faq.length > 0
            ? d.faq
            : [
                {
                  que: "What happens when I unlock or open the Digital format?",
                  ans: "You get instant access to the interactive PDF version of your book inside Mind Spark Secure Reader with page notes, highlights, and practice sets.",
                },
                {
                  que: "How do I access my saved or purchased digital books?",
                  ans: "All saved and unlocked books are available in My Bookshelf (Home) and My Purchases tabs in the left sidebar.",
                },
              ],
          knowMore: Array.isArray(d.knowMore) && d.knowMore.length > 0
            ? d.knowMore.map((km: { icon?: string; title?: string; content?: string }) => ({
                icon: km.icon || "",
                title: km.title || "Key Highlights",
                points: stripHtmlBullets(km.content || ""),
              }))
            : [
                {
                  icon: "",
                  title: "How will this book help you?",
                  points: [
                    "Build strong conceptual clarity with comprehensive theory and illustrations.",
                    "Boost exam readiness with topic-wise MCQs and past 10 years PYQ analysis.",
                  ],
                },
                {
                  icon: "",
                  title: "Inside this Book",
                  points: [
                    "Aarambh: Solved examples to build concepts with confidence.",
                    "Prarambh: Topic-wise practice for progressive learning.",
                    "Prabal & Parikshit: Advanced-level exercises to master multi-concept problems.",
                  ],
                },
              ],
          chapterDetails: activeChapters.length > 0 ? activeChapters : DEFAULT_PHYSICS_CHAPTERS,
        };

        DETAIL_CACHE.set(bookId, { timestamp: Date.now(), detail });
        return detail;
      }
    }
  } catch {
    // Fallback below
  }

  return null;
}
