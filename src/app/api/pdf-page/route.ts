import { NextRequest, NextResponse } from "next/server";
import {
  decryptStreamfilesPage,
  generateEducationalPdfPage,
} from "@/lib/pdf-generator";

const pageCache = new Map<string, Buffer>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "page";
  const assetRef = searchParams.get("asset_ref") || "";
  const pageNum = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const totalPages = Math.max(1, parseInt(searchParams.get("total") || "26", 10) || 26);
  const bookTitle = searchParams.get("book_title") || "Mind Spark Digital Module";
  const chapterTitle = searchParams.get("chapter_title") || "Chapter Study Notes";
  const rawPdf = searchParams.get("raw") === "1";
  const downloadPdf = searchParams.get("download") === "1";

  if (action === "page_count") {
    if (assetRef.startsWith("GENERATED::")) {
      const parts = assetRef.split("::");
      const count = parseInt(parts[3] || "24", 10) || 24;
      return NextResponse.json({ success: true, pages: count });
    }
    if (assetRef && !assetRef.startsWith("CUSTOM_PDF::")) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(
          `https://books.streamfiles.eu.org/api/page_count.php?asset_ref=${encodeURIComponent(assetRef)}`,
          {
            headers: {
              Origin: "https://books.pw.live",
              Referer: "https://books.pw.live/",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
            },
            signal: controller.signal,
          }
        );
        clearTimeout(timer);
        if (res.ok) {
          const j = await res.json();
          if (j?.success && j?.pages) {
            return NextResponse.json({ success: true, pages: Number(j.pages) });
          }
        }
      } catch {
        // Fallback below
      }
    }
    return NextResponse.json({ success: true, pages: totalPages });
  }

  // Serve or decrypt PDF page
  const cacheKey = `${assetRef}::${pageNum}`;
  let pdfBuffer = pageCache.get(cacheKey);

  if (!pdfBuffer && assetRef && !assetRef.startsWith("GENERATED::") && !assetRef.startsWith("CUSTOM_PDF::")) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(
        `https://books.streamfiles.eu.org/api/page.php?asset_ref=${encodeURIComponent(assetRef)}&page=${pageNum}`,
        {
          headers: {
            Origin: "https://books.pw.live",
            Referer: "https://books.pw.live/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timer);

      if (res.ok) {
        const j = await res.json();
        if (j?.success && typeof j?.data === "string" && j.data.length > 20) {
          const decrypted = decryptStreamfilesPage(j.data);
          if (decrypted.slice(0, 4).toString("utf8") === "%PDF") {
            pdfBuffer = decrypted;
            if (pageCache.size > 150) {
              const firstKey = pageCache.keys().next().value;
              if (firstKey) pageCache.delete(firstKey);
            }
            pageCache.set(cacheKey, pdfBuffer);
          }
        }
      }
    } catch {
      // Fallback to generated PDF below
    }
  }

  let sourceType = "upstream";
  if (!pdfBuffer) {
    sourceType = "generated";
    let genBook = bookTitle;
    let genChap = chapterTitle;
    let genTotal = totalPages;
    if (assetRef.startsWith("GENERATED::")) {
      const parts = assetRef.split("::");
      genBook = decodeURIComponent(parts[1] || bookTitle);
      genChap = decodeURIComponent(parts[2] || chapterTitle);
      genTotal = parseInt(parts[3] || String(totalPages), 10) || totalPages;
    }
    pdfBuffer = generateEducationalPdfPage({
      bookTitle: genBook,
      chapterTitle: genChap,
      pageNumber: pageNum,
      totalPages: genTotal,
    });
  }

  if (rawPdf || downloadPdf) {
    const safeName = chapterTitle.replace(/[^a-zA-Z0-9_-]/g, "_") || "MindSpark";
    const disposition = downloadPdf
      ? `attachment; filename="${safeName}_Page_${pageNum}.pdf"`
      : `inline; filename="${safeName}_Page_${pageNum}.pdf"`;
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  return NextResponse.json({
    success: true,
    page: pageNum,
    source: sourceType,
    base64Pdf: pdfBuffer.toString("base64"),
  });
}
