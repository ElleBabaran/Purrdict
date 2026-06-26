"use client";
import { useState, useRef } from "react";
import TopBar from "@/components/nav/TopBar";

type EntryType = "photo" | "video" | "note";

interface ScrapEntry {
  id: string;
  type: EntryType;
  title: string;
  body?: string;
  emoji: string;
  date: string;
  tag?: string;
  color: string;
}

const INITIAL_ENTRIES: ScrapEntry[] = [
  {
    id: "s1",
    type: "photo",
    title: "First day with the collar 🎉",
    emoji: "📷",
    date: "Jun 22",
    tag: "milestone",
    color: "#FFD166",
  },
  {
    id: "s2",
    type: "note",
    title: "Mochi figured out the treat puzzle in 4 minutes",
    body: "She stared at it for 2 minutes, then batted it twice and all the treats fell out. 10/10 genius.",
    emoji: "📝",
    date: "Jun 21",
    tag: "funny",
    color: "#7FD8BE",
  },
  {
    id: "s3",
    type: "video",
    title: "Zoomies at 3AM compilation",
    emoji: "🎬",
    date: "Jun 20",
    tag: "chaos",
    color: "#FF8FA3",
  },
  {
    id: "s4",
    type: "photo",
    title: "Sunbathing on the windowsill",
    emoji: "☀️",
    date: "Jun 18",
    tag: "cozy",
    color: "#C4B5FD",
  },
  {
    id: "s5",
    type: "note",
    title: "Today she brought me a sock as a gift",
    body: "Dropped it right at my feet, looked me in the eyes, and walked away. She's perfect.",
    emoji: "🧦",
    date: "Jun 15",
    tag: "wholesome",
    color: "#FFD166",
  },
  {
    id: "s6",
    type: "photo",
    title: "Caught sleeping in the laundry basket",
    emoji: "😴",
    date: "Jun 13",
    tag: "cozy",
    color: "#C4B5FD",
  },
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
  photo: "📷",
  video: "🎬",
  note: "📝",
};

export default function ScrapbookPage() {
  const [entries, setEntries] = useState<ScrapEntry[]>(INITIAL_ENTRIES);
  const [currentPage, setCurrentPage] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState<EntryType>("note");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newEmoji, setNewEmoji] = useState("📝");
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState<"next" | "prev">("next");
  const fileRef = useRef<HTMLInputElement>(null);

  // 2 entries per "spread" (left page + right page)
  const ENTRIES_PER_SPREAD = 2;
  const totalPages = Math.ceil(entries.length / ENTRIES_PER_SPREAD);
  const spreadEntries = entries.slice(
    currentPage * ENTRIES_PER_SPREAD,
    currentPage * ENTRIES_PER_SPREAD + ENTRIES_PER_SPREAD
  );

  function goToPage(dir: "next" | "prev") {
    if (dir === "next" && currentPage >= totalPages - 1) return;
    if (dir === "prev" && currentPage <= 0) return;
    setFlipDir(dir);
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentPage((p) => (dir === "next" ? p + 1 : p - 1));
      setIsFlipping(false);
    }, 300);
  }

  function handleAdd() {
    if (!newTitle.trim()) return;
    const entry: ScrapEntry = {
      id: Date.now().toString(),
      type: newType,
      title: newTitle.trim(),
      body: newBody.trim() || undefined,
      emoji: newEmoji || TYPE_ICON[newType],
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      tag: newTag.trim() || undefined,
      color: ["#FFD166", "#7FD8BE", "#FF8FA3", "#C4B5FD", "#FF6B6B"][
        Math.floor(Math.random() * 5)
      ],
    };
    setEntries((prev) => [...prev, entry]);
    setNewTitle("");
    setNewBody("");
    setNewTag("");
    setNewEmoji("📝");
    setShowAdd(false);
    // go to last page
    setTimeout(() => {
      setCurrentPage(Math.ceil((entries.length + 1) / ENTRIES_PER_SPREAD) - 1);
    }, 50);
  }

  function handleDelete(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    // adjust page if needed
    const newLen = entries.length - 1;
    const maxPage = Math.max(0, Math.ceil(newLen / ENTRIES_PER_SPREAD) - 1);
    if (currentPage > maxPage) setCurrentPage(maxPage);
  }

  const EMOJI_SUGGESTIONS: Record<EntryType, string[]> = {
    photo: ["📷", "🌟", "🥰", "☀️", "🌙", "🐾"],
    video: ["🎬", "🎥", "⚡", "🌀", "🤣", "🎉"],
    note: ["📝", "💬", "🧠", "🫶", "✨", "🐱"],
  };

  return (
    <>
      <TopBar title="▸ SCRAPBOOK" />
      <div className="px-4 py-5 space-y-4">

        {/* ── Book header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--cocoa)] flex items-center gap-2">
              <span>📖</span> Mochi&apos;s Scrapbook
            </h2>
            <p className="text-[11px] text-[var(--cocoa-lt)] mt-0.5">
              {entries.length} memories · page {currentPage + 1} of {totalPages}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="pixel-press font-pixel text-[8px] px-3.5 py-2.5 rounded-xl text-white"
            style={{
              background: showAdd
                ? "var(--coral)"
                : "linear-gradient(135deg, var(--pink) 0%, var(--pink-dk) 100%)",
              boxShadow: "3px 3px 0 var(--cocoa)",
            }}
            aria-label="Add new scrapbook entry"
          >
            {showAdd ? "✕" : "+ ADD"}
          </button>
        </div>

        {/* ── The book ── */}
        <div
          className="relative rounded-xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #F5E6D3 0%, #EDD9C0 50%, #E8D1B5 100%)",
            border: "3px solid var(--cocoa)",
            boxShadow: "6px 6px 0 var(--cocoa), inset 0 0 30px rgba(74,59,50,0.08)",
            minHeight: "420px",
          }}
        >
          {/* book spine shadow */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[3px] z-20 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(74,59,50,0.3), rgba(74,59,50,0.15), rgba(74,59,50,0.3))",
              boxShadow: "-4px 0 8px rgba(74,59,50,0.1), 4px 0 8px rgba(74,59,50,0.1)",
            }}
          />

          {/* page texture dots */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage: "radial-gradient(circle, var(--cocoa) 0.5px, transparent 0.5px)",
              backgroundSize: "18px 18px",
            }}
          />

          {/* top page curl decoration */}
          <div className="absolute top-3 right-4 z-10">
            <div
              className="w-6 h-6 rounded-bl-lg"
              style={{
                background: "linear-gradient(135deg, transparent 50%, rgba(74,59,50,0.08) 50%)",
              }}
            />
          </div>

          {/* page content — two-page spread */}
          <div
            className={`grid grid-cols-2 gap-0 min-h-[400px] transition-all duration-300 ${
              isFlipping
                ? flipDir === "next"
                  ? "opacity-0 translate-x-[-8px]"
                  : "opacity-0 translate-x-[8px]"
                : "opacity-100 translate-x-0"
            }`}
          >
            {/* left page */}
            <div className="p-4 flex flex-col" style={{ borderRight: "1px dashed rgba(74,59,50,0.15)" }}>
              {spreadEntries[0] ? (
                <PageEntry entry={spreadEntries[0]} onDelete={handleDelete} />
              ) : (
                <EmptyPage side="left" />
              )}
            </div>

            {/* right page */}
            <div className="p-4 flex flex-col">
              {spreadEntries[1] ? (
                <PageEntry entry={spreadEntries[1]} onDelete={handleDelete} />
              ) : (
                <EmptyPage side="right" />
              )}
            </div>
          </div>

          {/* page navigation */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-20"
            style={{ background: "linear-gradient(transparent, rgba(245,230,211,0.9))" }}
          >
            <button
              onClick={() => goToPage("prev")}
              disabled={currentPage === 0}
              className="font-pixel text-[8px] px-3 py-2 rounded-lg transition-all pixel-press"
              style={{
                background: currentPage === 0 ? "transparent" : "var(--cream)",
                border: `2px solid ${currentPage === 0 ? "transparent" : "var(--cocoa)"}`,
                color: currentPage === 0 ? "var(--cocoa-lt)" : "var(--cocoa)",
                boxShadow: currentPage === 0 ? "none" : "2px 2px 0 var(--cocoa)",
                opacity: currentPage === 0 ? 0.4 : 1,
              }}
            >
              ◀ PREV
            </button>

            {/* page dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setFlipDir(i > currentPage ? "next" : "prev");
                    setIsFlipping(true);
                    setTimeout(() => {
                      setCurrentPage(i);
                      setIsFlipping(false);
                    }, 300);
                  }}
                  className="transition-all"
                  style={{
                    width: currentPage === i ? 16 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: currentPage === i ? "var(--pink-dk)" : "var(--cocoa-lt)",
                    opacity: currentPage === i ? 1 : 0.3,
                  }}
                  aria-label={`Go to page ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => goToPage("next")}
              disabled={currentPage >= totalPages - 1}
              className="font-pixel text-[8px] px-3 py-2 rounded-lg transition-all pixel-press"
              style={{
                background: currentPage >= totalPages - 1 ? "transparent" : "var(--cream)",
                border: `2px solid ${currentPage >= totalPages - 1 ? "transparent" : "var(--cocoa)"}`,
                color: currentPage >= totalPages - 1 ? "var(--cocoa-lt)" : "var(--cocoa)",
                boxShadow: currentPage >= totalPages - 1 ? "none" : "2px 2px 0 var(--cocoa)",
                opacity: currentPage >= totalPages - 1 ? 0.4 : 1,
              }}
            >
              NEXT ▶
            </button>
          </div>
        </div>

        {/* ── Add new entry form ── */}
        {showAdd && (
          <div
            className="rounded-2xl overflow-hidden animate-fade-up"
            style={{
              background: "var(--plum)",
              border: "2px solid var(--plum-lt)",
              boxShadow: "4px 4px 0 var(--cocoa)",
            }}
          >
            <div
              className="px-4 py-3 flex items-center gap-2"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="font-pixel text-[8px] text-[var(--yellow)]">✨ PASTE A NEW MEMORY</span>
            </div>

            <div className="px-4 py-4 space-y-4">
              {/* type picker */}
              <div>
                <div className="font-pixel text-[7px] text-white/50 mb-2">TYPE</div>
                <div className="flex gap-2">
                  {(["photo", "video", "note"] as EntryType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => { setNewType(t); setNewEmoji(EMOJI_SUGGESTIONS[t][0]); }}
                      className="flex-1 py-2.5 rounded-xl font-pixel text-[7px] transition-all"
                      style={{
                        background: newType === t
                          ? "linear-gradient(135deg, var(--mint) 0%, var(--mint-dk) 100%)"
                          : "rgba(255,255,255,0.05)",
                        border: `1px solid ${newType === t ? "var(--mint-dk)" : "rgba(255,255,255,0.08)"}`,
                        color: newType === t ? "var(--plum)" : "rgba(255,255,255,0.5)",
                        boxShadow: newType === t ? "2px 2px 0 var(--cocoa)" : "none",
                      }}
                      aria-pressed={newType === t}
                    >
                      {TYPE_ICON[t]} {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* emoji picker */}
              <div>
                <div className="font-pixel text-[7px] text-white/50 mb-2">STICKER</div>
                <div className="flex gap-2">
                  {EMOJI_SUGGESTIONS[newType].map((em) => (
                    <button
                      key={em}
                      onClick={() => setNewEmoji(em)}
                      className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                      style={{
                        background: newEmoji === em ? "rgba(127,216,190,0.2)" : "rgba(255,255,255,0.04)",
                        border: `1.5px solid ${newEmoji === em ? "var(--mint-dk)" : "rgba(255,255,255,0.08)"}`,
                      }}
                      aria-label={`Choose sticker ${em}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* title */}
              <div>
                <div className="font-pixel text-[7px] text-white/50 mb-2">CAPTION</div>
                <input
                  className="w-full bg-[var(--plum-xl)] text-white text-sm px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[var(--mint-dk)] placeholder-white/25"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={
                    newType === "photo" ? "What's in the photo?"
                    : newType === "video" ? "Name this clip…"
                    : "What happened today?"
                  }
                  aria-label="Entry caption"
                />
              </div>

              {/* body (notes) */}
              {newType === "note" && (
                <div>
                  <div className="font-pixel text-[7px] text-white/50 mb-2">FULL STORY</div>
                  <textarea
                    className="w-full bg-[var(--plum-xl)] text-white text-sm px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[var(--mint-dk)] placeholder-white/25 resize-none"
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                    placeholder="Write the details…"
                    rows={3}
                    aria-label="Entry body"
                  />
                </div>
              )}

              {/* file upload */}
              {(newType === "photo" || newType === "video") && (
                <div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full py-5 rounded-xl flex flex-col items-center gap-2 transition-colors"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1.5px dashed rgba(255,255,255,0.15)",
                    }}
                    aria-label="Upload file"
                  >
                    <span className="text-2xl opacity-50">{newType === "photo" ? "🖼️" : "🎞️"}</span>
                    <span className="font-pixel text-[7px] text-white/40">TAP TO UPLOAD</span>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept={newType === "photo" ? "image/*" : "video/*"}
                    className="hidden"
                    aria-label="File upload"
                  />
                </div>
              )}

              {/* tag */}
              <div>
                <div className="font-pixel text-[7px] text-white/50 mb-2">TAG</div>
                <div className="flex gap-2 flex-wrap">
                  {["milestone", "funny", "chaos", "cozy", "wholesome"].map((tg) => (
                    <button
                      key={tg}
                      onClick={() => setNewTag(newTag === tg ? "" : tg)}
                      className={`font-pixel text-[6px] px-2.5 py-1.5 rounded-full transition-all ${
                        newTag === tg
                          ? TAG_COLORS[tg]
                          : "bg-white/5 text-white/40 border border-white/10"
                      }`}
                      aria-pressed={newTag === tg}
                    >
                      {tg}
                    </button>
                  ))}
                </div>
              </div>

              {/* submit */}
              <button
                onClick={handleAdd}
                disabled={!newTitle.trim()}
                className="w-full py-3.5 rounded-xl font-pixel text-[9px] transition-all pixel-press"
                style={{
                  background: newTitle.trim()
                    ? "linear-gradient(135deg, var(--pink) 0%, var(--pink-dk) 100%)"
                    : "rgba(255,255,255,0.08)",
                  color: newTitle.trim() ? "white" : "rgba(255,255,255,0.25)",
                  boxShadow: newTitle.trim() ? "3px 3px 0 var(--cocoa)" : "none",
                }}
              >
                📌 PASTE INTO BOOK
              </button>
            </div>
          </div>
        )}

        {/* ── Tip ── */}
        <div
          className="rounded-xl px-4 py-3 text-[11px] text-[var(--cocoa-lt)] leading-relaxed"
          style={{
            background: "linear-gradient(135deg, var(--cream2) 0%, var(--cream) 100%)",
            border: "2px solid var(--cream2)",
          }}
        >
          📖 Swipe through your scrapbook like a real photo album. Each spread shows two memories side by side.
        </div>
      </div>
    </>
  );
}

/* ── Individual page entry component ── */
function PageEntry({
  entry,
  onDelete,
}: {
  entry: ScrapEntry;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* date stamp — looks like handwritten */}
      <div className="font-pixel text-[6px] text-[var(--cocoa-lt)] mb-2 opacity-60">
        {entry.date}
      </div>

      {/* polaroid-style photo placeholder or note card */}
      <div
        className="flex-1 rounded-lg overflow-hidden flex flex-col"
        style={{
          background: "#fff",
          border: "2px solid var(--cocoa)",
          boxShadow: "2px 2px 0 rgba(74,59,50,0.15)",
          transform: `rotate(${Math.random() > 0.5 ? 1 : -1}deg)`,
        }}
      >
        {/* image area or emoji placeholder */}
        <div
          className="flex-1 min-h-[100px] flex items-center justify-center relative"
          style={{
            background: `linear-gradient(135deg, ${entry.color}22, ${entry.color}11)`,
          }}
        >
          <span className="text-4xl">{entry.emoji}</span>

          {/* type badge */}
          <span
            className="absolute top-2 right-2 font-pixel text-[5px] px-1.5 py-0.5 rounded-full"
            style={{
              background: `${entry.color}33`,
              color: entry.color,
              border: `1px solid ${entry.color}55`,
            }}
          >
            {TYPE_ICON[entry.type]}
          </span>

          {/* play icon for video */}
          {entry.type === "video" && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.1)" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.9)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                <span className="text-[var(--pink-dk)] text-sm ml-0.5">▶</span>
              </div>
            </div>
          )}
        </div>

        {/* caption area — like a polaroid bottom */}
        <div className="px-3 py-2.5" style={{ borderTop: "1.5px solid rgba(74,59,50,0.1)" }}>
          <div className="text-[11px] font-bold text-[var(--cocoa)] leading-snug line-clamp-2">
            {entry.title}
          </div>
          {entry.body && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1"
            >
              {expanded ? (
                <p className="text-[10px] text-[var(--cocoa-lt)] leading-relaxed text-left">
                  {entry.body}
                </p>
              ) : (
                <span className="text-[9px] text-[var(--pink-dk)] font-pixel">▼ more</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* bottom: tag + delete — like a taped sticker */}
      <div className="flex items-center justify-between mt-2">
        {entry.tag ? (
          <span
            className={`font-pixel text-[5.5px] px-2 py-0.5 rounded-full ${
              TAG_COLORS[entry.tag] ?? TAG_COLORS.custom
            }`}
            style={{ transform: "rotate(-2deg)" }}
          >
            {entry.tag}
          </span>
        ) : (
          <div />
        )}
        <button
          onClick={() => onDelete(entry.id)}
          className="text-[var(--cocoa-lt)] hover:text-[var(--coral)] transition-colors text-xs"
          aria-label="Remove memory"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/* ── Empty page placeholder ── */
function EmptyPage({ side }: { side: "left" | "right" }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
      <div className="text-3xl mb-2">{side === "left" ? "📖" : "✨"}</div>
      <div className="font-pixel text-[6px] text-[var(--cocoa-lt)]">
        {side === "left" ? "EMPTY PAGE" : "ADD A MEMORY"}
      </div>
    </div>
  );
}
