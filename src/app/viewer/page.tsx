"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SecurePdfReader from "@/components/SecurePdfReader";
import { DEFAULT_PHYSICS_CHAPTERS } from "@/lib/books-data";

function ViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const assetRef =
    searchParams.get("asset_ref") ||
    searchParams.get("ref") ||
    DEFAULT_PHYSICS_CHAPTERS[0].encryptedQuery;
  const title = searchParams.get("title") || "Nuclei";
  const bookTitle = searchParams.get("book_title") || "Lakshya NEET Physics (Digital Module)";
  const bookId = searchParams.get("book_id") || "6978968b3b5f1c676ebc664b";
  const pages = parseInt(searchParams.get("pages") || "26", 10) || 26;
  const page = parseInt(searchParams.get("page") || "1", 10) || 1;

  return (
    <SecurePdfReader
      bookId={bookId}
      bookTitle={bookTitle}
      chapter={{
        _id: "direct_viewer_ch",
        bookId,
        displayChapterNumber: 1,
        title,
        totalPageCount: pages,
        encryptedQuery: assetRef,
        type: "PDF",
        customPracticeSet: DEFAULT_PHYSICS_CHAPTERS[0].customPracticeSet,
      }}
      initialPage={page}
      onBack={() => router.push("/")}
    />
  );
}

export default function ViewerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-white text-sm font-bold text-gray-600">
          Initializing Secure PDF Reader...
        </div>
      }
    >
      <ViewerContent />
    </Suspense>
  );
}
