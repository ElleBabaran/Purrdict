"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useAuth, type CatCard } from "@/lib/AuthContext";

const COLOR_NAMES: Record<string, string> = {
  "#F5A623": "Orange",
  "#2D2438": "Tuxedo",
  "#8A7768": "Grey",
  "#F5F0EA": "White",
  "#E56B85": "Calico",
  "#1A1225": "Black",
  "#D4C5A9": "Siamese",
  "#D4721A": "Ginger",
};

const ALL_COLORS = [
  { name: "Orange Tabby", value: "#F5A623" },
  { name: "Tuxedo", value: "#2D2438" },
  { name: "Grey", value: "#8A7768" },
  { name: "White", value: "#F5F0EA" },
  { name: "Calico", value: "#E56B85" },
  { name: "Black", value: "#1A1225" },
  { name: "Siamese", value: "#D4C5A9" },
  { name: "Ginger", value: "#D4721A" },
];

export default function CatCardList() {
  const { user, updateCat, deleteCat } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBreed, setEditBreed] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editPhoto, setEditPhoto] = useState<string | undefined>(undefined);
  const editPhotoRef = useRef<HTMLInputElement>(null);

  function startEdit(cat: CatCard) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditBreed(cat.breed);
    setEditAge(cat.ageMonths?.toString() || "");
    setEditColor(cat.color);
    setEditPhoto(cat.photo);
  }

  async function saveEdit() {
    if (!editingId || !editName.trim()) return;
    await updateCat(editingId, {
      name: editName.trim(),
      breed: editBreed.trim() || "Unknown breed",
      ageMonths: parseInt(editAge) || null,
      color: editColor,
      photo: editPhoto,
    });
    setEditingId(null);
  }

  function handleEditPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEditPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleDelete(id: string, name: string) {
    if (confirm(`Delete ${name}'s card? This can't be undone.`)) {
      await deleteCat(id);
      if (editingId === id) setEditingId(null);
    }
  }

  if (!user || user.cats.length === 0) {
    return (
      <div className="glass-card p-5 text-center">
        <div className="text-3xl mb-2">🐱</div>
        <div className="text-sm font-bold text-[var(--cocoa)] mb-1">No cats yet</div>
        <p className="text-[11px] text-[var(--cocoa-lt)] mb-3">
          Pair an ESP32 leash to create your first cat card.
        </p>
        <Link
          href="/setup"
          className="inline-block font-pixel text-[8px] px-4 py-2.5 rounded-xl text-white pixel-press"
          style={{
            background: "linear-gradient(135deg, var(--pink) 0%, var(--pink-dk) 100%)",
            boxShadow: "3px 3px 0 var(--cocoa)",
          }}
        >
          + ADD CAT
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Cat cards ── */}
      {user.cats.map((cat) => (
        <div
          key={cat.id}
          className="rounded-2xl overflow-hidden"
          style={{
            border: "2.5px solid var(--cocoa)",
            boxShadow: "4px 4px 0 var(--cocoa)",
            background: "white",
          }}
        >
          {/* color header */}
          <div
            className="h-12 relative flex items-center justify-between px-4"
            style={{ background: `linear-gradient(135deg, ${cat.color}88, ${cat.color}33)` }}
          >
            <span className="font-pixel text-[6px] text-[var(--cocoa)]">🐾 PURRDICT CARD</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.7)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--mint)] animate-blink" />
                <span className="font-pixel text-[5.5px] text-[var(--mint-dk)]">
                  {cat.esp32Connected ? "ONLINE" : "OFFLINE"}
                </span>
              </div>
            </div>
          </div>

          {/* body */}
          <div className="px-4 py-3.5">
            <div className="flex items-center gap-3">
              {/* avatar */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ background: "var(--cream)", border: "2.5px solid var(--cocoa)", boxShadow: "2px 2px 0 var(--cocoa)" }}
              >
                {cat.photo ? (
                  <img src={cat.photo} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🐱</span>
                )}
              </div>

              {/* info */}
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold text-[var(--cocoa)] leading-tight">{cat.name}</div>
                <div className="text-[11px] text-[var(--cocoa-lt)] mt-0.5">{cat.breed}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: cat.color, border: "1.5px solid var(--cocoa)" }} />
                  <span className="text-[10px] text-[var(--cocoa-lt)]">{COLOR_NAMES[cat.color] || "Custom"}</span>
                  {cat.ageMonths && <span className="text-[10px] text-[var(--cocoa-lt)]">· {cat.ageMonths}mo</span>}
                </div>
              </div>

              {/* actions */}
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button
                  onClick={() => startEdit(cat)}
                  className="px-2.5 py-1.5 rounded-lg font-pixel text-[6.5px] transition-all pixel-press"
                  style={{ background: "var(--cream)", border: "1.5px solid var(--cocoa)", color: "var(--cocoa)" }}
                >
                  ✏️ EDIT
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="px-2.5 py-1.5 rounded-lg font-pixel text-[6.5px] transition-all"
                  style={{ background: "rgba(255,107,107,0.08)", border: "1.5px solid rgba(255,107,107,0.3)", color: "var(--coral)" }}
                >
                  🗑️ DEL
                </button>
              </div>
            </div>

            {/* PIN info */}
            <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "var(--cream)", border: "1px dashed var(--cream2)" }}>
              <div>
                <span className="font-pixel text-[5.5px] text-[var(--cocoa-lt)]">LEASH PIN: </span>
                <span className="font-mono text-[11px] font-bold text-[var(--cocoa)] tracking-wider">{cat.esp32Pin}</span>
              </div>
              <div className="font-pixel text-[5.5px] text-[var(--cocoa-lt)]">
                SAVED ✓
              </div>
            </div>
          </div>

          {/* bottom strip */}
          <div className="h-1.5" style={{ background: `repeating-linear-gradient(90deg, ${cat.color} 0 8px, var(--cocoa) 8px 10px)` }} />
        </div>
      ))}

      {/* ── Add another ── */}
      <Link
        href="/setup"
        className="block rounded-2xl p-4 text-center transition-all hover:scale-[1.01]"
        style={{ border: "2.5px dashed var(--cocoa-lt)", background: "var(--cream)" }}
      >
        <span className="text-2xl block mb-1">+</span>
        <span className="font-pixel text-[8px] text-[var(--cocoa-lt)]">ADD ANOTHER CAT</span>
      </Link>

      {/* ── EDIT MODAL ── */}
      {editingId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-5" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden animate-fade-up"
            style={{ background: "white", border: "3px solid var(--cocoa)", boxShadow: "6px 6px 0 var(--cocoa)" }}
          >
            {/* header */}
            <div className="flex items-center justify-between px-5 py-3.5" style={{ background: "var(--cream)", borderBottom: "2px solid var(--cocoa)" }}>
              <span className="font-pixel text-[9px] text-[var(--cocoa)]">✏️ EDIT CAT</span>
              <button onClick={() => setEditingId(null)} className="text-[var(--cocoa-lt)] text-lg hover:text-[var(--coral)]">✕</button>
            </div>

            <div className="px-5 py-5 space-y-4">
              {/* Photo */}
              <div>
                <label className="font-pixel text-[7px] text-[var(--cocoa-lt)] block mb-2">PHOTO</label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--cream)", border: "2px solid var(--cocoa)" }}
                  >
                    {editPhoto ? (
                      <img src={editPhoto} alt="Cat" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">🐱</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => editPhotoRef.current?.click()}
                      className="px-3 py-2 rounded-lg font-pixel text-[7px] pixel-press"
                      style={{ background: "var(--cream)", border: "1.5px solid var(--cocoa)" }}
                    >
                      📷 {editPhoto ? "CHANGE" : "UPLOAD"}
                    </button>
                    {editPhoto && (
                      <button
                        onClick={() => setEditPhoto(undefined)}
                        className="px-3 py-1.5 rounded-lg font-pixel text-[6px] text-[var(--coral)]"
                        style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)" }}
                      >
                        REMOVE
                      </button>
                    )}
                  </div>
                </div>
                <input ref={editPhotoRef} type="file" accept="image/*" onChange={handleEditPhoto} className="hidden" />
              </div>

              {/* Name */}
              <div>
                <label className="font-pixel text-[7px] text-[var(--cocoa-lt)] block mb-1.5">NAME</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm font-bold text-[var(--cocoa)] outline-none focus:ring-2 focus:ring-[var(--pink)]"
                  style={{ background: "var(--cream)", border: "2px solid var(--cream2)" }}
                />
              </div>

              {/* Breed + Age */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-pixel text-[7px] text-[var(--cocoa-lt)] block mb-1.5">BREED</label>
                  <input
                    type="text"
                    value={editBreed}
                    onChange={(e) => setEditBreed(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-[var(--cocoa)] outline-none"
                    style={{ background: "var(--cream)", border: "2px solid var(--cream2)" }}
                  />
                </div>
                <div>
                  <label className="font-pixel text-[7px] text-[var(--cocoa-lt)] block mb-1.5">AGE (months)</label>
                  <input
                    type="number"
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-[var(--cocoa)] outline-none"
                    style={{ background: "var(--cream)", border: "2px solid var(--cream2)" }}
                  />
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="font-pixel text-[7px] text-[var(--cocoa-lt)] block mb-2">FUR COLOR</label>
                <div className="flex gap-2 flex-wrap">
                  {ALL_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setEditColor(c.value)}
                      className="w-8 h-8 rounded-full transition-all"
                      style={{
                        background: c.value,
                        border: `3px solid ${editColor === c.value ? "var(--cocoa)" : "transparent"}`,
                        transform: editColor === c.value ? "scale(1.2)" : "scale(1)",
                        boxShadow: editColor === c.value ? "0 0 0 2px var(--cream), 2px 2px 0 var(--cocoa)" : "inset 0 -2px 4px rgba(0,0,0,0.15)",
                      }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingId(null)}
                  className="flex-1 py-3 rounded-xl font-pixel text-[8px] text-[var(--cocoa)] pixel-press"
                  style={{ background: "var(--cream)", border: "2px solid var(--cocoa)", boxShadow: "3px 3px 0 var(--cocoa)" }}
                >
                  CANCEL
                </button>
                <button
                  onClick={saveEdit}
                  disabled={!editName.trim()}
                  className="flex-[2] py-3 rounded-xl font-pixel text-[9px] text-white pixel-press"
                  style={{
                    background: editName.trim() ? "linear-gradient(135deg, var(--mint) 0%, var(--mint-dk) 100%)" : "var(--cream2)",
                    color: editName.trim() ? "white" : "var(--cocoa-lt)",
                    boxShadow: editName.trim() ? "4px 4px 0 var(--cocoa)" : "none",
                  }}
                >
                  ✓ SAVE CHANGES
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
