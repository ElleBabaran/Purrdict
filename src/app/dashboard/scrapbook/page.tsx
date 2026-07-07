"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import TopBar from "@/components/nav/TopBar";

type EntryType = "photo" | "video" | "note";

interface ScrapEntry {
  id: string;
  type: EntryType;
  title: string;
  body?: string;
  tag?: string;
  media_data?: string | null;
  created_at: string;
}

interface ScrapBook {
  id: string;
  name: string;
  cover_color: string;
  cover_pattern: string;
  entry_count: number;
  created_at: string;
}

const COVER_COLORS = [
  "#FF8FA3", "#FFD166", "#7FD8BE", "#C4B5FD",
  "#5B8DEF", "#F5A623", "#E56B85", "#8A7768",
];

const COVER_PATTERNS = [
  "none", "dots", "stripes", "zigzag", "stars", "hearts",
];

const TAG_COLORS: Record<string, string> = {
  milestone: "bg-[var(--yellow)] text-[var(--cocoa)]",
  funny: "bg-[var(--mint)] text-[var(--plum)]",
  chaos: "bg-[var(--pink)] text-white",
  cozy: "bg-[var(--lavender)] text-[var(--plum)]",
  wholesome: "bg-[var(--coral)] text-white",
  custom: "bg-[var(--cream2)] text-[var(--cocoa)]",
};

const TYPE_ICON: Record<EntryType, string> = {
  photo: "📷", video: "🎬", note: "📝",
};

function getPatternStyle(pattern: string, color: string) {
  const light = color + "33";
  switch (pattern) {
    case "dots":
      return { backgroundImage: `radial-gradient(circle, ${light} 2px, transparent 2px)`, backgroundSize: "12px 12px" };
    case "stripes":
      return { backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 5px, ${light} 5px, ${light} 7px)` };
    case "zigzag":
      return { backgroundImage: `linear-gradient(135deg, ${light} 25%, transparent 25%), linear-gradient(225deg, ${light} 25%, transparent 25%)`, backgroundSize: "12px 12px" };
    case "stars":
      return { backgroundImage: `radial-gradient(circle, ${light} 1px, transparent 1px), radial-gradient(circle, ${light} 1px, transparent 1px)`, backgroundSize: "20px 20px", backgroundPosition: "0 0, 10px 10px" };
    case "hearts":
      return { backgroundImage: `radial-gradient(circle, ${light} 3px, transparent 3px)`, backgroundSize: "16px 16px" };
    default:
      return {};
  }
}

function getToken() {
  return localStorage.getItem("purrdict_token") || "";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ScrapbookPage() {
  const [books, setBooks] = useState<ScrapBook[]>([]);
  const [openBookId, setOpenBookId] = useState<string | null>(null);
  const [showNewBook, setShowNewBook] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch("/api/scrapbook/books", { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        const fetched = data.books || [];
        if (fetched.length > 0) {
          setBooks(fetched);
          setLoading(false);
          return;
        }
      }
    } catch { /* fallback */ }
    // Fallback to localStorage
    const saved = localStorage.getItem("purrdict_scrapbooks");
    if (saved) {
      try { setBooks(JSON.parse(saved)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  useEffect(() => {
    const done = localStorage.getItem("purrdict_album_tutorial_done");
    if (!done) setShowTutorial(true);
  }, []);

  function dismissTutorial() {
    localStorage.setItem("purrdict_album_tutorial_done", "1");
    setShowTutorial(false);
    setTutorialStep(0);
  }

  async function handleCreateBook(name: string, coverColor: string, coverPattern: string) {
    // Always save locally first for instant UI
    const newBook: ScrapBook = {
      id: "local-" + Date.now(),
      name,
      cover_color: coverColor,
      cover_pattern: coverPattern,
      entry_count: 0,
      created_at: new Date().toISOString(),
    };
    const updated = [...books, newBook];
    setBooks(updated);
    localStorage.setItem("purrdict_scrapbooks", JSON.stringify(updated));
    setShowNewBook(false);

    // Try to sync to DB in background
    try {
      const res = await fetch("/api/scrapbook/books", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name, coverColor, coverPattern }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id && !data.id.startsWith("demo-") && !data.id.startsWith("local-")) {
          // Replace local id with DB id
          const synced = updated.map((b) => b.id === newBook.id ? { ...b, id: data.id } : b);
          setBooks(synced);
          localStorage.setItem("purrdict_scrapbooks", JSON.stringify(synced));
        }
      }
    } catch { /* DB sync failed, local still works */ }
  }

  async function handleDeleteBook(id: string) {
    try {
      await fetch(`/api/scrapbook/books?id=${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
    } catch { /* ignore */ }
    const updated = books.filter((b) => b.id !== id);
    setBooks(updated);
    localStorage.setItem("purrdict_scrapbooks", JSON.stringify(updated));
    if (openBookId === id) setOpenBookId(null);
  }

  const openBook = books.find((b) => b.id === openBookId) || null;

  if (openBook) {
    return (
      <OpenBookView
        book={openBook}
        onBack={() => { setOpenBookId(null); fetchBooks(); }}
      />
    );
  }

  return (
    <>
      <TopBar title="▸ ALBUM" />

      {showTutorial && (
        <AlbumTutorial step={tutorialStep} onNext={() => setTutorialStep((s) => s + 1)} onDismiss={dismissTutorial} />
      )}

      <div className="px-4 py-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--cocoa)] flex items-center gap-2">
              <span>📚</span> My Albums
            </h2>
            <p className="text-[11px] text-[var(--cocoa-lt)] mt-0.5">
              {books.length} {books.length === 1 ? "book" : "books"}
            </p>
          </div>
          <button
            onClick={() => setShowNewBook(!showNewBook)}
            className="pixel-press font-pixel text-[8px] px-3.5 py-2.5 rounded-xl text-white"
            style={{
              background: showNewBook ? "var(--coral)" : "linear-gradient(135deg, var(--pink) 0%, var(--pink-dk) 100%)",
              boxShadow: "3px 3px 0 var(--cocoa)",
            }}
          >
            {showNewBook ? "✕" : "+ NEW BOOK"}
          </button>
        </div>

        {showNewBook && <NewBookForm onCreate={handleCreateBook} onCancel={() => setShowNewBook(false)} />}

        {loading ? (
          <div className="text-center py-12">
            <div className="font-pixel text-[9px] text-[var(--cocoa-lt)] animate-pulse">Loading albums...</div>
          </div>
        ) : books.length === 0 && !showNewBook ? (
          <div className="glass-card p-8 text-center">
            <div className="text-5xl mb-3">📚</div>
            <h3 className="text-lg font-bold text-[var(--cocoa)] mb-2">No albums yet</h3>
            <p className="text-[12px] text-[var(--cocoa-lt)] mb-4">Create your first album to start saving cute cat moments!</p>
            <button onClick={() => setShowNewBook(true)} className="pixel-press font-pixel text-[9px] px-5 py-3 rounded-xl text-white" style={{ background: "linear-gradient(135deg, var(--pink) 0%, var(--pink-dk) 100%)", boxShadow: "3px 3px 0 var(--cocoa)" }}>
              + CREATE FIRST ALBUM
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {books.map((book) => (
              <BookCover key={book.id} book={book} onOpen={() => setOpenBookId(book.id)} onDelete={() => handleDeleteBook(book.id)} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ── Book Cover ── */
function BookCover({ book, onOpen, onDelete }: { book: ScrapBook; onOpen: () => void; onDelete: () => void }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={onOpen}
        className="w-full aspect-[3/4] rounded-xl overflow-hidden flex flex-col items-center justify-center relative transition-transform active:scale-95"
        style={{ background: `linear-gradient(135deg, ${book.cover_color}, ${book.cover_color}CC)`, border: "3px solid var(--cocoa)", boxShadow: "4px 4px 0 var(--cocoa)" }}
      >
        <div className="absolute inset-0 pointer-events-none" style={getPatternStyle(book.cover_pattern, "#ffffff")} />
        <div className="absolute left-0 top-0 bottom-0 w-3" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.15), transparent)" }} />
        <div className="relative z-10 flex flex-col items-center gap-2 px-3">
          <span className="font-pixel text-[8px] text-center leading-tight px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.85)", color: "var(--cocoa)" }}>
            {book.name}
          </span>
        </div>
        <div className="absolute bottom-2 right-2 font-pixel text-[6px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.85)", color: "var(--cocoa)" }}>
          {book.entry_count} 📄
        </div>
      </button>
      <button onClick={() => setShowMenu(!showMenu)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] z-20" style={{ background: "rgba(255,255,255,0.9)", border: "1.5px solid var(--cocoa)" }} aria-label="Book options">⋮</button>
      {showMenu && (
        <div className="absolute top-9 right-1.5 z-30 rounded-lg overflow-hidden" style={{ background: "var(--cream)", border: "2px solid var(--cocoa)", boxShadow: "3px 3px 0 var(--cocoa)" }}>
          <button onClick={() => { onDelete(); setShowMenu(false); }} className="px-3 py-2 text-[11px] text-[var(--coral)] font-bold hover:bg-[var(--cream2)] w-full text-left">🗑️ Delete</button>
        </div>
      )}
    </div>
  );
}

/* ── New Book Form ── */
function NewBookForm({ onCreate, onCancel }: { onCreate: (name: string, color: string, pattern: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COVER_COLORS[0]);
  const [pattern, setPattern] = useState("none");

  return (
    <div className="rounded-2xl overflow-hidden animate-fade-up" style={{ background: "var(--plum)", border: "2px solid var(--plum-lt)", boxShadow: "4px 4px 0 var(--cocoa)" }}>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="font-pixel text-[8px] text-[var(--yellow)]">✨ CREATE NEW ALBUM</span>
      </div>
      <div className="px-4 py-4 space-y-4">
        <div>
          <div className="font-pixel text-[7px] text-white/50 mb-2">ALBUM NAME</div>
          <input className="w-full bg-[var(--plum-xl)] text-white text-sm px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[var(--mint-dk)] placeholder-white/25" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mochi's Adventures" />
        </div>
        <div>
          <div className="font-pixel text-[7px] text-white/50 mb-2">COVER COLOR</div>
          <div className="flex gap-2 flex-wrap">
            {COVER_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)} className="w-9 h-9 rounded-lg transition-all" style={{ background: c, border: color === c ? "3px solid white" : "2px solid rgba(255,255,255,0.15)", boxShadow: color === c ? "0 0 8px rgba(255,255,255,0.3)" : "none" }} />
            ))}
          </div>
        </div>
        <div>
          <div className="font-pixel text-[7px] text-white/50 mb-2">COVER DESIGN</div>
          <div className="flex gap-2 flex-wrap">
            {COVER_PATTERNS.map((p) => (
              <button key={p} onClick={() => setPattern(p)} className="px-3 py-2 rounded-lg font-pixel text-[7px] transition-all" style={{ background: pattern === p ? "rgba(127,216,190,0.2)" : "rgba(255,255,255,0.04)", border: `1.5px solid ${pattern === p ? "var(--mint-dk)" : "rgba(255,255,255,0.08)"}`, color: pattern === p ? "var(--mint)" : "rgba(255,255,255,0.5)" }}>
                {p === "none" ? "PLAIN" : p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        {/* Preview */}
        <div className="flex justify-center">
          <div className="w-24 h-32 rounded-lg flex flex-col items-center justify-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)`, border: "2px solid var(--cocoa)", boxShadow: "3px 3px 0 var(--cocoa)" }}>
            <div className="absolute inset-0 pointer-events-none" style={getPatternStyle(pattern, "#ffffff")} />
            <div className="absolute left-0 top-0 bottom-0 w-2" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.15), transparent)" }} />
            {name && <span className="font-pixel text-[5px] px-1.5 py-0.5 rounded relative z-10" style={{ background: "rgba(255,255,255,0.85)", color: "var(--cocoa)" }}>{name.slice(0, 12)}</span>}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl font-pixel text-[8px]" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>CANCEL</button>
          <button onClick={() => name.trim() && onCreate(name.trim(), color, pattern)} disabled={!name.trim()} className="flex-1 py-3 rounded-xl font-pixel text-[9px] pixel-press" style={{ background: name.trim() ? "linear-gradient(135deg, var(--pink) 0%, var(--pink-dk) 100%)" : "rgba(255,255,255,0.08)", color: name.trim() ? "white" : "rgba(255,255,255,0.25)", boxShadow: name.trim() ? "3px 3px 0 var(--cocoa)" : "none" }}>📖 CREATE</button>
        </div>
      </div>
    </div>
  );
}

/* ── Open Book View ── */
function OpenBookView({ book, onBack }: { book: ScrapBook; onBack: () => void }) {
  const [entries, setEntries] = useState<ScrapEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState<EntryType>("photo");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newTag, setNewTag] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaBase64, setMediaBase64] = useState<string | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState<"next" | "prev">("next");
  const [saving, setSaving] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [detailEntry, setDetailEntry] = useState<ScrapEntry | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch(`/api/scrapbook/entries?bookId=${book.id}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        const fetched = data.entries || [];
        if (fetched.length > 0) {
          setEntries(fetched);
          setLoadingEntries(false);
          return;
        }
      }
    } catch { /* fallback */ }
    // Fallback to localStorage
    const saved = localStorage.getItem(`purrdict_entries_${book.id}`);
    if (saved) {
      try { setEntries(JSON.parse(saved)); } catch { /* ignore */ }
    }
    setLoadingEntries(false);
  }, [book.id]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const ENTRIES_PER_SPREAD = 2;
  const totalPages = Math.max(1, Math.ceil(entries.length / ENTRIES_PER_SPREAD));
  const spreadEntries = entries.slice(currentPage * ENTRIES_PER_SPREAD, currentPage * ENTRIES_PER_SPREAD + ENTRIES_PER_SPREAD);

  function goToPage(dir: "next" | "prev") {
    if (dir === "next" && currentPage >= totalPages - 1) return;
    if (dir === "prev" && currentPage <= 0) return;
    setFlipDir(dir);
    setIsFlipping(true);
    setTimeout(() => { setCurrentPage((p) => (dir === "next" ? p + 1 : p - 1)); setIsFlipping(false); }, 300);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Mirrors the server's MAX_RAW_MEDIA_SIZE in api/scrapbook/entries/route.ts —
    // kept low so the base64-inflated payload stays under Neon's 64MB HTTP
    // request cap. Detailed size info is only logged to the terminal
    // (console), not shown to the user beyond a plain message.
    const MAX_RAW_MEDIA_SIZE = 8 * 1024 * 1024;
    if (file.size > MAX_RAW_MEDIA_SIZE) {
      console.warn(`[scrapbook] File rejected client-side: ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds the ${MAX_RAW_MEDIA_SIZE / (1024 * 1024)}MB limit.`);
      alert("File too large. Please use a smaller file.");
      return;
    }
    // Most Chromium/Firefox browsers can't decode HEVC-coded .mov videos
    // (the default recording format on iPhone) even though the MIME type
    // still starts with "video/" — that showed up as a 0:00-duration,
    // thumbnail-less, unplayable video after upload. Warn up front rather
    // than let the user discover a broken entry later.
    const isMov = file.type === "video/quicktime" || /\.mov$/i.test(file.name);
    if (newType === "video" && isMov) {
      const proceed = confirm(
        "This looks like a .mov video (common on iPhone). Many browsers can't play this format after upload — it may show up with no thumbnail and won't play. Convert it to MP4 first for best results.\n\nUpload anyway?"
      );
      if (!proceed) {
        e.target.value = "";
        return;
      }
    }
    const base64 = await fileToBase64(file);
    setMediaBase64(base64);
    setMediaPreview(base64);
  }

  async function handleAdd() {
    if (!newTitle.trim()) return;
    setSaving(true);

    // Save locally first for instant UI
    const newEntry: ScrapEntry = {
      id: "local-" + Date.now(),
      type: newType,
      title: newTitle.trim(),
      body: newBody.trim() || undefined,
      tag: newTag || undefined,
      media_data: mediaBase64 || undefined,
      created_at: new Date().toISOString(),
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    try {
      localStorage.setItem(`purrdict_entries_${book.id}`, JSON.stringify(updated));
    } catch (err) {
      // Base64-encoded photos/videos can push the serialized entries past
      // localStorage's per-origin quota (~5-10MB), which throws
      // synchronously. Previously this was unguarded, so the throw aborted
      // handleAdd right here — the form never closed, "saving" never reset
      // (button stuck on "SAVING..."), and the DB sync fetch below never
      // even ran, silently dropping the memory (most noticeable with
      // videos, since they're the largest payloads). Caching locally is
      // just an optimization, so a quota failure shouldn't block anything.
      console.warn("[scrapbook] Local cache write failed (likely storage quota exceeded), continuing with DB sync:", err);
    }

    setNewTitle("");
    setNewBody("");
    setNewTag("");
    setMediaPreview(null);
    setMediaBase64(null);
    setShowAdd(false);
    setCurrentPage(0);
    setSaving(false);

    // Sync to DB in background
    try {
      const res = await fetch("/api/scrapbook/entries", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          bookId: book.id,
          type: newType,
          title: newEntry.title,
          entryBody: newEntry.body || null,
          tag: newEntry.tag || null,
          mediaData: newEntry.media_data || null,
        }),
      });
      if (!res.ok) {
        // Previously a non-OK response (e.g. 400 "Add a cat profile before
        // creating scrapbook entries" when the user has no cat yet) was
        // silently ignored here — the entry stayed in React state/
        // localStorage only, looked saved for that session, then vanished
        // on the next reload/reopen because it never reached the DB.
        // Surface the real reason so the user knows it didn't persist.
        let message = "Couldn't save this memory to the server — it's only stored on this device for now.";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch { /* ignore parse failure, use default message */ }
        alert(message);
        return;
      }
      {
        const data = await res.json();
        if (data.id && !data.id.startsWith("demo-") && !data.id.startsWith("local-")) {
          const synced = updated.map((e) => e.id === newEntry.id ? { ...e, id: data.id } : e);
          setEntries(synced);
          localStorage.setItem(`purrdict_entries_${book.id}`, JSON.stringify(synced));
        }
      }
    } catch { /* DB sync failed, local still works */ }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/scrapbook/entries?id=${id}`, { method: "DELETE", headers: authHeaders() });
    } catch { /* ignore */ }
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    localStorage.setItem(`purrdict_entries_${book.id}`, JSON.stringify(updated));
    const newLen = updated.length;
    const maxPage = Math.max(0, Math.ceil(newLen / ENTRIES_PER_SPREAD) - 1);
    if (currentPage > maxPage) setCurrentPage(maxPage);
  }

  return (
    <>
      <TopBar title="▸ ALBUM" />
      <div className="px-4 py-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="pixel-press font-pixel text-[8px] px-3 py-2 rounded-lg" style={{ background: "var(--cream2)", border: "2px solid var(--cocoa)", boxShadow: "2px 2px 0 var(--cocoa)" }}>← BACK</button>
            <div>
              <h2 className="text-lg font-bold text-[var(--cocoa)]">{book.name}</h2>
              <p className="text-[10px] text-[var(--cocoa-lt)]">{entries.length} memories · page {currentPage + 1}/{totalPages}</p>
            </div>
          </div>
          <button onClick={() => setShowAdd(!showAdd)} className="pixel-press font-pixel text-[8px] px-3 py-2.5 rounded-xl text-white" style={{ background: showAdd ? "var(--coral)" : "linear-gradient(135deg, var(--pink) 0%, var(--pink-dk) 100%)", boxShadow: "3px 3px 0 var(--cocoa)" }}>
            {showAdd ? "✕" : "+ ADD"}
          </button>
        </div>

        {/* Book pages */}
        {loadingEntries ? (
          <div className="text-center py-16">
            <div className="font-pixel text-[9px] text-[var(--cocoa-lt)] animate-pulse">Loading memories...</div>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden" style={{ background: "linear-gradient(135deg, #F5E6D3 0%, #EDD9C0 50%, #E8D1B5 100%)", border: "3px solid var(--cocoa)", boxShadow: "6px 6px 0 var(--cocoa), inset 0 0 30px rgba(74,59,50,0.08)", minHeight: "420px" }}>
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[3px] z-20 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(74,59,50,0.3), rgba(74,59,50,0.15), rgba(74,59,50,0.3))" }} />
            <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: "radial-gradient(circle, var(--cocoa) 0.5px, transparent 0.5px)", backgroundSize: "18px 18px" }} />

            {/* pb-14 reserves space for the absolutely-positioned nav bar
                below (◀ PREV / dots / NEXT ▶) — without it, that bar's
                z-20 gradient overlay sat on top of each PageEntry's own
                delete "✕" button, so clicks landed on the nav bar instead
                of actually deleting the entry. */}
            <div className={`grid grid-cols-2 gap-0 min-h-[400px] pb-14 transition-all duration-300 ${isFlipping ? (flipDir === "next" ? "opacity-0 translate-x-[-8px]" : "opacity-0 translate-x-[8px]") : "opacity-100 translate-x-0"}`}>
              <div className="p-4 flex flex-col" style={{ borderRight: "1px dashed rgba(74,59,50,0.15)" }}>
                {spreadEntries[0] ? <PageEntry entry={spreadEntries[0]} onDelete={handleDelete} onOpen={setDetailEntry} /> : <EmptyPage side="left" />}
              </div>
              <div className="p-4 flex flex-col">
                {spreadEntries[1] ? <PageEntry entry={spreadEntries[1]} onDelete={handleDelete} onOpen={setDetailEntry} /> : <EmptyPage side="right" />}
              </div>
            </div>

            {/* Navigation */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-20" style={{ background: "linear-gradient(transparent, rgba(245,230,211,0.9))" }}>
              <button onClick={() => goToPage("prev")} disabled={currentPage === 0} className="font-pixel text-[8px] px-3 py-2 rounded-lg pixel-press" style={{ background: currentPage === 0 ? "transparent" : "var(--cream)", border: `2px solid ${currentPage === 0 ? "transparent" : "var(--cocoa)"}`, opacity: currentPage === 0 ? 0.4 : 1 }}>◀ PREV</button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: Math.min(totalPages, 8) }).map((_, i) => (
                  <button key={i} onClick={() => { setFlipDir(i > currentPage ? "next" : "prev"); setIsFlipping(true); setTimeout(() => { setCurrentPage(i); setIsFlipping(false); }, 300); }} className="transition-all" style={{ width: currentPage === i ? 16 : 6, height: 6, borderRadius: 3, background: currentPage === i ? "var(--pink-dk)" : "var(--cocoa-lt)", opacity: currentPage === i ? 1 : 0.3 }} />
                ))}
              </div>
              <button onClick={() => goToPage("next")} disabled={currentPage >= totalPages - 1} className="font-pixel text-[8px] px-3 py-2 rounded-lg pixel-press" style={{ background: currentPage >= totalPages - 1 ? "transparent" : "var(--cream)", border: `2px solid ${currentPage >= totalPages - 1 ? "transparent" : "var(--cocoa)"}`, opacity: currentPage >= totalPages - 1 ? 0.4 : 1 }}>NEXT ▶</button>
            </div>
          </div>
        )}

        {/* Add entry form */}
        {showAdd && (
          <div className="rounded-2xl overflow-hidden animate-fade-up" style={{ background: "var(--plum)", border: "2px solid var(--plum-lt)", boxShadow: "4px 4px 0 var(--cocoa)" }}>
            <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="font-pixel text-[8px] text-[var(--yellow)]">✨ ADD A NEW MEMORY</span>
            </div>
            <div className="px-4 py-4 space-y-4">
              {/* Type */}
              <div>
                <div className="font-pixel text-[7px] text-white/50 mb-2">TYPE</div>
                <div className="flex gap-2">
                  {(["photo", "video", "note"] as EntryType[]).map((t) => (
                    <button key={t} onClick={() => setNewType(t)} className="flex-1 py-2.5 rounded-xl font-pixel text-[7px] transition-all" style={{ background: newType === t ? "linear-gradient(135deg, var(--mint) 0%, var(--mint-dk) 100%)" : "rgba(255,255,255,0.05)", border: `1px solid ${newType === t ? "var(--mint-dk)" : "rgba(255,255,255,0.08)"}`, color: newType === t ? "var(--plum)" : "rgba(255,255,255,0.5)" }}>
                      {TYPE_ICON[t]} {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption */}
              <div>
                <div className="font-pixel text-[7px] text-white/50 mb-2">CAPTION</div>
                <input className="w-full bg-[var(--plum-xl)] text-white text-sm px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[var(--mint-dk)] placeholder-white/25" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={newType === "photo" ? "What's in the photo?" : newType === "video" ? "Name this clip…" : "What happened today?"} />
              </div>

              {/* Body for notes */}
              {newType === "note" && (
                <div>
                  <div className="font-pixel text-[7px] text-white/50 mb-2">FULL STORY</div>
                  <textarea className="w-full bg-[var(--plum-xl)] text-white text-sm px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[var(--mint-dk)] placeholder-white/25 resize-none" value={newBody} onChange={(e) => setNewBody(e.target.value)} placeholder="Write the details…" rows={3} />
                </div>
              )}

              {/* File upload for photo/video */}
              {(newType === "photo" || newType === "video") && (
                <div>
                  {mediaPreview ? (
                    <div className="relative rounded-xl overflow-hidden">
                      {newType === "photo" ? (
                        <img src={mediaPreview} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
                      ) : (
                        <video src={mediaPreview} className="w-full h-40 object-cover rounded-xl" controls playsInline preload="metadata" />
                      )}
                      <button onClick={() => { setMediaPreview(null); setMediaBase64(null); }} className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm" style={{ background: "rgba(0,0,0,0.6)" }}>✕</button>
                    </div>
                  ) : (
                    <button onClick={() => fileRef.current?.click()} className="w-full py-8 rounded-xl flex flex-col items-center gap-2" style={{ background: "rgba(255,255,255,0.03)", border: "1.5px dashed rgba(255,255,255,0.15)" }}>
                      <span className="text-3xl opacity-50">{newType === "photo" ? "🖼️" : "🎞️"}</span>
                      <span className="font-pixel text-[7px] text-white/40">TAP TO UPLOAD (max 8MB)</span>
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept={newType === "photo" ? "image/*" : "video/*"} className="hidden" onChange={handleFileSelect} />
                </div>
              )}

              {/* Tag */}
              <div>
                <div className="font-pixel text-[7px] text-white/50 mb-2">TAG</div>
                <div className="flex gap-2 flex-wrap">
                  {["milestone", "funny", "chaos", "cozy", "wholesome"].map((tg) => (
                    <button key={tg} onClick={() => setNewTag(newTag === tg ? "" : tg)} className={`font-pixel text-[6px] px-2.5 py-1.5 rounded-full transition-all ${newTag === tg ? TAG_COLORS[tg] : "bg-white/5 text-white/40 border border-white/10"}`}>{tg}</button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button onClick={handleAdd} disabled={!newTitle.trim() || saving} className="w-full py-3.5 rounded-xl font-pixel text-[9px] transition-all pixel-press" style={{ background: newTitle.trim() ? "linear-gradient(135deg, var(--pink) 0%, var(--pink-dk) 100%)" : "rgba(255,255,255,0.08)", color: newTitle.trim() ? "white" : "rgba(255,255,255,0.25)", boxShadow: newTitle.trim() ? "3px 3px 0 var(--cocoa)" : "none" }}>
                {saving ? "SAVING..." : "📌 SAVE MEMORY"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal — rendered outside the book container */}
      {detailEntry && (
        <EntryDetailModal entry={detailEntry} onClose={() => setDetailEntry(null)} />
      )}
    </>
  );
}

/* ── Page Entry ── */
function PageEntry({ entry, onDelete, onOpen }: { entry: ScrapEntry; onDelete: (id: string) => void; onOpen: (entry: ScrapEntry) => void }) {
  const date = new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  // Tracks whether the browser actually failed to decode this video (e.g.
  // an HEVC-coded .mov straight off an iPhone, which many Chromium/Firefox
  // builds can't play without OS-level codec support). Shows a real error
  // instead of silently rendering a blank/frozen player.
  const [videoUnsupported, setVideoUnsupported] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="font-pixel text-[6px] text-[var(--cocoa-lt)] mb-2 opacity-60">{date}</div>
      <button
        onClick={() => onOpen(entry)}
        className="flex-1 rounded-lg overflow-hidden flex flex-col text-left transition-transform active:scale-[0.97]"
        style={{ background: "#fff", border: "2px solid var(--cocoa)", boxShadow: "2px 2px 0 rgba(74,59,50,0.15)" }}
      >
        {/* Content area */}
        {entry.type === "note" ? (
          <div className="flex-1 p-3 flex flex-col">
            <div className="text-[12px] font-bold text-[var(--cocoa)] leading-snug mb-1.5">{entry.title}</div>
            {entry.body && (
              <p className="text-[10px] text-[var(--cocoa-lt)] leading-relaxed line-clamp-6">{entry.body}</p>
            )}
          </div>
        ) : entry.media_data ? (
          <div className="flex-1 relative overflow-hidden">
            {entry.type === "photo" ? (
              <img src={entry.media_data} alt={entry.title} className="w-full h-full object-cover absolute inset-0" />
            ) : videoUnsupported ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-3 text-center" style={{ background: "var(--cream2)" }}>
                <span className="text-2xl opacity-60">⚠️</span>
                <span className="text-[9px] text-[var(--cocoa-lt)] leading-snug">Video format not supported by this browser</span>
              </div>
            ) : (
              // Appending #t=0.1 makes browsers that don't auto-generate a
              // poster frame for `data:`/blob video sources (Chrome/Edge
              // included) seek to a fraction of a second in and paint that
              // frame, instead of showing a blank gray box until playback
              // starts.
              <video
                src={`${entry.media_data}#t=0.1`}
                className="w-full h-full object-cover absolute inset-0"
                preload="metadata"
                muted
                playsInline
                onError={() => setVideoUnsupported(true)}
              />
            )}
            {entry.type === "video" && !videoUnsupported && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.9)", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                  <span className="text-[var(--pink-dk)] text-sm ml-0.5">▶</span>
                </div>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.6))" }}>
              <div className="text-[10px] font-bold text-white leading-snug line-clamp-1">{entry.title}</div>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-3 flex flex-col items-center justify-center" style={{ background: "var(--cream)" }}>
            <div className="text-[12px] font-bold text-[var(--cocoa)] text-center leading-snug">{entry.title}</div>
          </div>
        )}
      </button>
      {/* Tag + delete */}
      <div className="flex items-center justify-between mt-2">
        {entry.tag ? (
          <span className={`font-pixel text-[5.5px] px-2 py-0.5 rounded-full ${TAG_COLORS[entry.tag] ?? TAG_COLORS.custom}`}>{entry.tag}</span>
        ) : <div />}
        <button onClick={() => onDelete(entry.id)} className="text-[var(--cocoa-lt)] hover:text-[var(--coral)] transition-colors text-xs" aria-label="Remove memory">✕</button>
      </div>
    </div>
  );
}

/* ── Entry Detail Modal ── */
function EntryDetailModal({ entry, onClose }: { entry: ScrapEntry; onClose: () => void }) {
  const date = new Date(entry.created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const [videoUnsupported, setVideoUnsupported] = useState(false);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto" style={{ background: "#1A1225" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden my-auto" style={{ background: "white", border: "3px solid var(--cocoa)", boxShadow: "6px 6px 0 var(--cocoa)" }} onClick={(e) => e.stopPropagation()}>
        {/* Media */}
        {entry.media_data && entry.type === "photo" && (
          <img src={entry.media_data} alt={entry.title} className="w-full max-h-[50vh] object-contain bg-black" />
        )}
        {entry.media_data && entry.type === "video" && (
          videoUnsupported ? (
            <div className="w-full py-10 flex flex-col items-center justify-center gap-2 bg-black">
              <span className="text-3xl">⚠️</span>
              <span className="text-[12px] text-white/80 text-center px-6 leading-relaxed">
                This browser can&apos;t play this video file. This usually happens with HEVC-encoded .mov videos recorded on iPhone — try converting it to MP4 (H.264) before uploading.
              </span>
            </div>
          ) : (
            // Browsers block unmuted autoplay — without `muted` here, the
            // autoplay silently failed and the video just sat paused,
            // which looked like "the video doesn't play" even though
            // tapping the controls' own play button worked fine.
            <video
              src={entry.media_data}
              className="w-full max-h-[50vh]"
              controls
              autoPlay
              muted
              playsInline
              preload="metadata"
              onError={() => setVideoUnsupported(true)}
            />
          )
        )}

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-pixel text-[7px] text-[var(--cocoa-lt)]">{date}</div>
            {entry.tag && (
              <span className={`font-pixel text-[6px] px-2 py-0.5 rounded-full ${TAG_COLORS[entry.tag] ?? TAG_COLORS.custom}`}>{entry.tag}</span>
            )}
          </div>
          <h3 className="text-lg font-bold text-[var(--cocoa)] mb-2">{entry.title}</h3>
          {entry.body && (
            <p className="text-[13px] text-[var(--cocoa-lt)] leading-relaxed">{entry.body}</p>
          )}
        </div>

        {/* Close */}
        <div className="px-5 pb-5">
          <button onClick={onClose} className="w-full py-3 rounded-xl font-pixel text-[9px] text-[var(--cocoa)] transition-all" style={{ background: "var(--cream)", border: "2px solid var(--cocoa)", boxShadow: "2px 2px 0 var(--cocoa)" }}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Empty Page ── */
function EmptyPage({ side }: { side: "left" | "right" }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
      <div className="text-3xl mb-2">{side === "left" ? "📖" : "✨"}</div>
      <div className="font-pixel text-[6px] text-[var(--cocoa-lt)]">{side === "left" ? "EMPTY PAGE" : "TAP + ADD"}</div>
    </div>
  );
}

/* ── Tutorial ── */
const TUTORIAL_STEPS = [
  { emoji: "📚", title: "Welcome to Albums!", message: "Create multiple albums to organize your cat's cutest moments. Photos, videos, and notes — all saved to your account." },
  { emoji: "📖", title: "Create a Book", message: "Tap '+ NEW BOOK' to create an album. Pick a name, cover color, and pattern design." },
  { emoji: "📷", title: "Add Photos & Videos", message: "Inside a book, tap '+ ADD' and upload real photos or videos (up to 50MB). They'll be saved so you never lose them!" },
  { emoji: "👆", title: "Browse Pages", message: "Flip through your album with ◀ PREV and NEXT ▶. Each spread shows two memories side by side." },
];

function AlbumTutorial({ step, onNext, onDismiss }: { step: number; onNext: () => void; onDismiss: () => void }) {
  const current = TUTORIAL_STEPS[step];
  const isLast = step >= TUTORIAL_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6" style={{ background: "rgba(26,18,37,0.85)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden animate-fade-up" style={{ background: "linear-gradient(135deg, #2D2438 0%, #1A1225 100%)", border: "2px solid rgba(255,255,255,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div className="px-5 pt-6 pb-4 text-center">
          <div className="text-5xl mb-3">{current.emoji}</div>
          <h3 className="text-lg font-bold text-white">{current.title}</h3>
        </div>
        <div className="px-5 pb-5">
          <p className="text-[13px] text-white/70 text-center leading-relaxed">{current.message}</p>
        </div>
        <div className="flex items-center justify-center gap-1.5 pb-4">
          {TUTORIAL_STEPS.map((_, i) => (
            <div key={i} className="rounded-full transition-all" style={{ width: i === step ? 16 : 6, height: 6, background: i === step ? "var(--pink)" : "rgba(255,255,255,0.15)" }} />
          ))}
        </div>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={onDismiss} className="font-pixel text-[8px] text-white/40 hover:text-white/70 px-3 py-2">SKIP</button>
          <button onClick={isLast ? onDismiss : onNext} className="font-pixel text-[9px] px-5 py-2.5 rounded-xl text-white pixel-press" style={{ background: isLast ? "linear-gradient(135deg, var(--mint) 0%, var(--mint-dk) 100%)" : "linear-gradient(135deg, var(--pink) 0%, var(--pink-dk) 100%)", boxShadow: "3px 3px 0 var(--cocoa)" }}>
            {isLast ? "GOT IT! ✨" : "NEXT →"}
          </button>
        </div>
      </div>
    </div>
  );
}
