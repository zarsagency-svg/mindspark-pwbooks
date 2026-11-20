import { NextRequest, NextResponse } from "next/server";
import {
  supabase,
  must,
  mapBookshelfItem,
  mapReadingProgress,
  mapPageAnnotation,
  mapUnlockedPass,
} from "@/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assetRef = searchParams.get("asset_ref");
  const bookId = searchParams.get("book_id");

  try {
    let progressQuery = supabase
      .from("reading_progress")
      .select("*")
      .order("updated_at", { ascending: false });
    if (bookId) progressQuery = progressQuery.eq("book_id", bookId);

    let annotationsQuery = supabase
      .from("page_annotations")
      .select("*")
      .order("created_at", { ascending: false });
    if (assetRef) annotationsQuery = annotationsQuery.eq("asset_ref", assetRef);

    const [bookshelfRes, progressRes, passesRes, annotationsRes] =
      await Promise.all([
        must(
          supabase
            .from("bookshelf_items")
            .select("*")
            .order("updated_at", { ascending: false })
        ),
        must(progressQuery),
        must(
          supabase
            .from("unlocked_passes")
            .select("*")
            .order("unlocked_at", { ascending: false })
        ),
        must(annotationsQuery),
      ]);

    return NextResponse.json({
      success: true,
      bookshelf: (bookshelfRes || []).map(mapBookshelfItem),
      progress: (progressRes || []).map(mapReadingProgress),
      passes: (passesRes || []).map(mapUnlockedPass),
      annotations: (annotationsRes || []).map(mapPageAnnotation),
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      bookshelf: [],
      progress: [],
      passes: [],
      annotations: [],
      warning: error instanceof Error ? error.message : "DB not ready",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "toggle_bookshelf") {
      const {
        bookId,
        title,
        author,
        coverUrl,
        displayClass,
        cohort,
        edition,
        tags,
      } = body;

      const existing = await must(
        supabase
          .from("bookshelf_items")
          .select("*")
          .eq("book_id", bookId)
          .limit(1)
      );

      if (existing && existing.length > 0) {
        const nextSaved = !existing[0].is_saved;
        const updatedRaw = await must(
          supabase
            .from("bookshelf_items")
            .update({ is_saved: nextSaved, updated_at: new Date().toISOString() })
            .eq("book_id", bookId)
            .select()
            .single()
        );
        const updated = mapBookshelfItem(updatedRaw);
        return NextResponse.json({
          success: true,
          isSaved: updated.isSaved,
          item: updated,
        });
      } else {
        const insertedRaw = await must(
          supabase
            .from("bookshelf_items")
            .insert({
              book_id: bookId,
              title: title || "Digital Book",
              author: author || "PW",
              cover_url:
                coverUrl ||
                "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/8de5d17f-871d-4b86-a54e-5b3b60388f49.png",
              display_class: displayClass || "Class XII",
              cohort: cohort || "12_NEET",
              edition: edition || "2026 Edition",
              tags: Array.isArray(tags) ? tags.join(",") : tags || "Modules",
              is_saved: true,
              is_purchased: false,
            })
            .select()
            .single()
        );
        return NextResponse.json({
          success: true,
          isSaved: true,
          item: mapBookshelfItem(insertedRaw),
        });
      }
    }

    if (action === "purchase_book") {
      const {
        bookId,
        title,
        author,
        coverUrl,
        displayClass,
        cohort,
        edition,
        tags,
      } = body;

      const existing = await must(
        supabase
          .from("bookshelf_items")
          .select("*")
          .eq("book_id", bookId)
          .limit(1)
      );

      if (existing && existing.length > 0) {
        const updatedRaw = await must(
          supabase
            .from("bookshelf_items")
            .update({
              is_purchased: true,
              is_saved: true,
              updated_at: new Date().toISOString(),
            })
            .eq("book_id", bookId)
            .select()
            .single()
        );
        return NextResponse.json({
          success: true,
          item: mapBookshelfItem(updatedRaw),
        });
      } else {
        const insertedRaw = await must(
          supabase
            .from("bookshelf_items")
            .insert({
              book_id: bookId,
              title: title || "Digital Book",
              author: author || "PW",
              cover_url:
                coverUrl ||
                "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/8de5d17f-871d-4b86-a54e-5b3b60388f49.png",
              display_class: displayClass || "Class XII",
              cohort: cohort || "12_NEET",
              edition: edition || "2026 Edition",
              tags: Array.isArray(tags) ? tags.join(",") : tags || "Modules",
              is_saved: true,
              is_purchased: true,
            })
            .select()
            .single()
        );
        return NextResponse.json({
          success: true,
          item: mapBookshelfItem(insertedRaw),
        });
      }
    }

    if (action === "unlock_pass") {
      const { passId, cohort, title, couponCode } = body;
      const existing = await must(
        supabase
          .from("unlocked_passes")
          .select("*")
          .eq("pass_id", passId)
          .limit(1)
      );

      if (existing && existing.length > 0) {
        return NextResponse.json({
          success: true,
          pass: mapUnlockedPass(existing[0]),
        });
      }

      const insertedRaw = await must(
        supabase
          .from("unlocked_passes")
          .insert({
            pass_id: passId,
            cohort: cohort || "12_NEET",
            title: title || "Digital Books Pass",
            coupon_code: couponCode || "RAYS100",
          })
          .select()
          .single()
      );

      return NextResponse.json({
        success: true,
        pass: mapUnlockedPass(insertedRaw),
      });
    }

    if (action === "save_progress") {
      const {
        bookId,
        bookTitle,
        bookCover,
        chapterId,
        chapterTitle,
        assetRef,
        currentPage,
        totalPages,
      } = body;

      if (!assetRef) {
        return NextResponse.json(
          { success: false, error: "assetRef required" },
          { status: 400 }
        );
      }

      const existing = await must(
        supabase
          .from("reading_progress")
          .select("*")
          .eq("asset_ref", assetRef)
          .limit(1)
      );

      let savedRaw;
      if (existing && existing.length > 0) {
        savedRaw = await must(
          supabase
            .from("reading_progress")
            .update({
              current_page: Number(currentPage) || 1,
              total_pages: Number(totalPages) || existing[0].total_pages,
              updated_at: new Date().toISOString(),
            })
            .eq("asset_ref", assetRef)
            .select()
            .single()
        );
      } else {
        savedRaw = await must(
          supabase
            .from("reading_progress")
            .insert({
              book_id: bookId || "unknown",
              chapter_id: chapterId || "ch_1",
              chapter_title: chapterTitle || "Chapter",
              asset_ref: assetRef,
              current_page: Number(currentPage) || 1,
              total_pages: Number(totalPages) || 26,
            })
            .select()
            .single()
        );
      }
      const saved = mapReadingProgress(savedRaw);

      // Also update bookshelf item if bookId is known
      if (bookId) {
        const shelfExisting = await must(
          supabase
            .from("bookshelf_items")
            .select("*")
            .eq("book_id", bookId)
            .limit(1)
        );

        if (shelfExisting && shelfExisting.length > 0) {
          await must(
            supabase
              .from("bookshelf_items")
              .update({
                last_read_chapter_id: chapterId || "ch_1",
                last_read_chapter_title: chapterTitle || "Chapter",
                last_read_asset_ref: assetRef,
                last_read_page: Number(currentPage) || 1,
                total_pages: Number(totalPages) || 26,
                updated_at: new Date().toISOString(),
              })
              .eq("book_id", bookId)
          );
        } else if (bookTitle) {
          await must(
            supabase.from("bookshelf_items").insert({
              book_id: bookId,
              title: bookTitle,
              author: "PW",
              cover_url:
                bookCover ||
                "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/8de5d17f-871d-4b86-a54e-5b3b60388f49.png",
              is_saved: true,
              is_purchased: false,
              last_read_chapter_id: chapterId || "ch_1",
              last_read_chapter_title: chapterTitle || "Chapter",
              last_read_asset_ref: assetRef,
              last_read_page: Number(currentPage) || 1,
              total_pages: Number(totalPages) || 26,
            })
          );
        }
      }

      return NextResponse.json({ success: true, progress: saved });
    }

    if (action === "reset_progress") {
      const { bookId } = body;
      if (bookId) {
        await must(
          supabase.from("reading_progress").delete().eq("book_id", bookId)
        );
        await must(
          supabase
            .from("bookshelf_items")
            .update({
              last_read_chapter_id: null,
              last_read_chapter_title: null,
              last_read_asset_ref: null,
              last_read_page: 1,
              updated_at: new Date().toISOString(),
            })
            .eq("book_id", bookId)
        );
      }
      return NextResponse.json({ success: true });
    }

    if (action === "save_annotation") {
      const {
        id,
        assetRef,
        bookId,
        chapterTitle,
        pageNumber,
        type,
        text,
        noteContent,
        color,
      } = body;

      if (id) {
        const updatedRaw = await must(
          supabase
            .from("page_annotations")
            .update({
              note_content: noteContent ?? "",
              color: color || "rgba(244, 63, 94, 0.4)",
            })
            .eq("id", Number(id))
            .select()
            .single()
        );
        return NextResponse.json({
          success: true,
          annotation: mapPageAnnotation(updatedRaw),
        });
      }

      // If type === 'note', check if a page note already exists for (assetRef, pageNumber, 'note')
      if (type === "note") {
        const existingNote = await must(
          supabase
            .from("page_annotations")
            .select("*")
            .eq("asset_ref", assetRef)
            .eq("page_number", Number(pageNumber))
            .eq("type", "note")
            .limit(1)
        );

        if (existingNote && existingNote.length > 0) {
          const updatedRaw = await must(
            supabase
              .from("page_annotations")
              .update({ note_content: noteContent || "" })
              .eq("id", existingNote[0].id)
              .select()
              .single()
          );
          return NextResponse.json({
            success: true,
            annotation: mapPageAnnotation(updatedRaw),
          });
        }
      }

      const insertedRaw = await must(
        supabase
          .from("page_annotations")
          .insert({
            asset_ref: assetRef || "",
            book_id: bookId || "",
            chapter_title: chapterTitle || "",
            page_number: Number(pageNumber) || 1,
            type: type || "note",
            text: text || "",
            note_content: noteContent || "",
            color: color || "rgba(244, 63, 94, 0.4)",
          })
          .select()
          .single()
      );

      return NextResponse.json({
        success: true,
        annotation: mapPageAnnotation(insertedRaw),
      });
    }

    if (action === "delete_annotation") {
      const { id, assetRef, pageNumber, type } = body;
      if (id) {
        await must(
          supabase.from("page_annotations").delete().eq("id", Number(id))
        );
      } else if (assetRef && pageNumber && type) {
        await must(
          supabase
            .from("page_annotations")
            .delete()
            .eq("asset_ref", assetRef)
            .eq("page_number", Number(pageNumber))
            .eq("type", type)
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Unknown action" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save state",
      },
      { status: 500 }
    );
  }
}
