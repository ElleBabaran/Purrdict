"use client";
import { useState } from "react";
import TopBar from "@/components/nav/TopBar";

type Priority = "high" | "medium" | "low";
type Category = "feeding" | "health" | "play" | "grooming" | "vet" | "other";

interface Todo {
  id: string;
  text: string;
  done: boolean;
  priority: Priority;
  category: Category;
  time?: string;
  recurring?: string;
  createdAt: string;
}

const INITIAL_TODOS: Todo[] = [
  {
    id: "t1",
    text: "Morning feeding — wet food",
    done: true,
    priority: "high",
    category: "feeding",
    time: "7:00 AM",
    recurring: "Daily",
    createdAt: "Jun 24",
  },
  {
    id: "t2",
    text: "Refill water fountain",
    done: false,
    priority: "high",
    category: "feeding",
    time: "8:00 AM",
    recurring: "Daily",
    createdAt: "Jun 24",
  },
  {
    id: "t3",
    text: "Play session — feather wand",
    done: false,
    priority: "medium",
    category: "play",
    time: "6:00 PM",
    recurring: "Daily",
    createdAt: "Jun 24",
  },
  {
    id: "t4",
    text: "Brush Mochi (shedding season)",
    done: false,
    priority: "medium",
    category: "grooming",
    time: "Evening",
    recurring: "Every 2 days",
    createdAt: "Jun 23",
  },
  {
    id: "t5",
    text: "Vet appointment — annual checkup",
    done: false,
    priority: "high",
    category: "vet",
    time: "Jul 2, 10:00 AM",
    createdAt: "Jun 20",
  },
  {
    id: "t6",
    text: "Order flea treatment refill",
    done: false,
    priority: "low",
    category: "health",
    createdAt: "Jun 22",
  },
  {
    id: "t7",
    text: "Clean litter box",
    done: true,
    priority: "medium",
    category: "other",
    time: "Morning",
    recurring: "Daily",
    createdAt: "Jun 24",
  },
  {
    id: "t8",
    text: "Evening feeding — dry kibble",
    done: false,
    priority: "high",
    category: "feeding",
    time: "7:00 PM",
    recurring: "Daily",
    createdAt: "Jun 24",
  },
];

const CATEGORY_META: Record<Category, { emoji: string; label: string; color: string }> = {
  feeding:  { emoji: "🍽️", label: "Feeding",  color: "#FFD166" },
  health:   { emoji: "💊", label: "Health",   color: "#7FD8BE" },
  play:     { emoji: "🎯", label: "Play",     color: "#FF8FA3" },
  grooming: { emoji: "✨", label: "Grooming", color: "#C4B5FD" },
  vet:      { emoji: "🏥", label: "Vet",      color: "#FF6B6B" },
  other:    { emoji: "📋", label: "Other",    color: "#8A7768" },
};

const PRIORITY_STYLES: Record<Priority, { dot: string; label: string }> = {
  high:   { dot: "bg-[var(--coral)]",   label: "HIGH" },
  medium: { dot: "bg-[var(--yellow)]",  label: "MED" },
  low:    { dot: "bg-[var(--mint)]",    label: "LOW" },
};

type FilterCat = "all" | Category;

export default function RemindersPage() {
  const [todos, setTodos] = useState<Todo[]>(INITIAL_TODOS);
  const [filter, setFilter] = useState<FilterCat>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showDone, setShowDone] = useState(false);

  // new todo form state
  const [newText, setNewText] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newCategory, setNewCategory] = useState<Category>("other");
  const [newTime, setNewTime] = useState("");
  const [newRecurring, setNewRecurring] = useState("");

  const filtered = todos.filter((t) => {
    if (filter !== "all" && t.category !== filter) return false;
    if (!showDone && t.done) return false;
    return true;
  });

  const pending = todos.filter((t) => !t.done).length;
  const doneCount = todos.filter((t) => t.done).length;

  function toggleDone(id: string) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  function addTodo() {
    if (!newText.trim()) return;
    const todo: Todo = {
      id: Date.now().toString(),
      text: newText.trim(),
      done: false,
      priority: newPriority,
      category: newCategory,
      time: newTime.trim() || undefined,
      recurring: newRecurring.trim() || undefined,
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
    setTodos((prev) => [todo, ...prev]);
    setNewText("");
    setNewTime("");
    setNewRecurring("");
    setNewPriority("medium");
    setNewCategory("other");
    setShowAdd(false);
  }

  return (
    <>
      <TopBar title="▸ REMINDERS" />
      <div className="px-4 py-5 space-y-4">

        {/* ── Summary hero ── */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: "linear-gradient(135deg, var(--plum) 0%, var(--plum-xl) 100%)",
            border: "2px solid var(--plum-lt)",
            boxShadow: "4px 4px 0 var(--cocoa)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-pixel text-[7px] text-[var(--mint)] opacity-70 mb-1">
                TODAY&apos;S TASKS
              </div>
              <div className="text-2xl font-bold text-white">
                {pending} pending
              </div>
              <div className="text-[11px] text-white/40 mt-0.5">
                {doneCount} completed today
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(var(--mint-dk) ${(doneCount / (pending + doneCount)) * 360}deg, rgba(255,255,255,0.08) 0deg)`,
                  border: "2px solid rgba(127,216,190,0.3)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                  style={{ background: "var(--plum-xl)" }}
                >
                  {Math.round((doneCount / (pending + doneCount)) * 100)}%
                </div>
              </div>
              <span className="font-pixel text-[6px] text-white/30">DONE</span>
            </div>
          </div>
        </div>

        {/* ── Add button ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex-1 py-3 rounded-xl font-pixel text-[9px] pixel-press transition-all"
            style={{
              background: showAdd
                ? "rgba(255,107,107,0.12)"
                : "linear-gradient(135deg, var(--pink) 0%, var(--pink-dk) 100%)",
              color: showAdd ? "var(--coral)" : "white",
              border: `2px solid ${showAdd ? "var(--coral)" : "var(--cocoa)"}`,
              boxShadow: showAdd ? "none" : "3px 3px 0 var(--cocoa)",
            }}
          >
            {showAdd ? "✕ CANCEL" : "+ NEW REMINDER"}
          </button>
          <button
            onClick={() => setShowDone(!showDone)}
            className="py-3 px-4 rounded-xl font-pixel text-[8px] transition-all"
            style={{
              background: showDone ? "var(--cream2)" : "rgba(255,255,255,0.6)",
              border: `2px solid ${showDone ? "var(--cocoa)" : "transparent"}`,
              color: "var(--cocoa-lt)",
              boxShadow: showDone ? "2px 2px 0 var(--cocoa)" : "none",
            }}
          >
            {showDone ? "HIDE ✓" : "SHOW ✓"}
          </button>
        </div>

        {/* ── Add form ── */}
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
              className="px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="font-pixel text-[8px] text-[var(--yellow)]">🔔 NEW REMINDER</span>
            </div>

            <div className="px-4 py-4 space-y-4">
              {/* task text */}
              <div>
                <div className="font-pixel text-[7px] text-white/50 mb-2">WHAT TO DO</div>
                <input
                  className="w-full bg-[var(--plum-xl)] text-white text-sm px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[var(--mint-dk)] placeholder-white/25"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="e.g. Feed Mochi wet food"
                  aria-label="Reminder text"
                />
              </div>

              {/* category */}
              <div>
                <div className="font-pixel text-[7px] text-white/50 mb-2">CATEGORY</div>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(CATEGORY_META) as Category[]).map((cat) => {
                    const meta = CATEGORY_META[cat];
                    const isActive = newCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setNewCategory(cat)}
                        className="py-2.5 rounded-xl font-pixel text-[6px] transition-all text-center"
                        style={{
                          background: isActive ? `${meta.color}22` : "rgba(255,255,255,0.04)",
                          border: `1.5px solid ${isActive ? `${meta.color}66` : "rgba(255,255,255,0.08)"}`,
                          color: isActive ? meta.color : "rgba(255,255,255,0.4)",
                        }}
                        aria-pressed={isActive}
                      >
                        {meta.emoji} {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* priority */}
              <div>
                <div className="font-pixel text-[7px] text-white/50 mb-2">PRIORITY</div>
                <div className="flex gap-2">
                  {(["high", "medium", "low"] as Priority[]).map((p) => {
                    const ps = PRIORITY_STYLES[p];
                    const isActive = newPriority === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setNewPriority(p)}
                        className="flex-1 py-2.5 rounded-xl font-pixel text-[7px] flex items-center justify-center gap-1.5 transition-all"
                        style={{
                          background: isActive ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                          border: `1.5px solid ${isActive ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"}`,
                          color: isActive ? "white" : "rgba(255,255,255,0.4)",
                        }}
                        aria-pressed={isActive}
                      >
                        <span className={`w-2 h-2 rounded-full ${ps.dot}`} />
                        {ps.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* time & recurring */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="font-pixel text-[7px] text-white/50 mb-2">TIME</div>
                  <input
                    className="w-full bg-[var(--plum-xl)] text-white text-sm px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[var(--mint-dk)] placeholder-white/25"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="e.g. 7:00 PM"
                    aria-label="Time"
                  />
                </div>
                <div>
                  <div className="font-pixel text-[7px] text-white/50 mb-2">REPEATS</div>
                  <input
                    className="w-full bg-[var(--plum-xl)] text-white text-sm px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[var(--mint-dk)] placeholder-white/25"
                    value={newRecurring}
                    onChange={(e) => setNewRecurring(e.target.value)}
                    placeholder="e.g. Daily"
                    aria-label="Recurring schedule"
                  />
                </div>
              </div>

              {/* submit */}
              <button
                onClick={addTodo}
                disabled={!newText.trim()}
                className="w-full py-3.5 rounded-xl font-pixel text-[9px] transition-all pixel-press"
                style={{
                  background: newText.trim()
                    ? "linear-gradient(135deg, var(--mint) 0%, var(--mint-dk) 100%)"
                    : "rgba(255,255,255,0.06)",
                  color: newText.trim() ? "var(--plum)" : "rgba(255,255,255,0.2)",
                  boxShadow: newText.trim() ? "3px 3px 0 var(--cocoa)" : "none",
                }}
              >
                ✓ ADD REMINDER
              </button>
            </div>
          </div>
        )}

        {/* ── Category filter ── */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
          {(["all", ...Object.keys(CATEGORY_META)] as FilterCat[]).map((cat) => {
            const isAll = cat === "all";
            const meta = !isAll ? CATEGORY_META[cat as Category] : null;
            const isActive = filter === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className="flex-shrink-0 py-2 px-3 rounded-xl font-pixel text-[6.5px] transition-all whitespace-nowrap"
                style={{
                  background: isActive
                    ? (isAll ? "var(--plum)" : `${meta!.color}22`)
                    : "rgba(255,255,255,0.6)",
                  border: `1.5px solid ${isActive ? (isAll ? "var(--cocoa)" : `${meta!.color}66`) : "transparent"}`,
                  color: isActive
                    ? (isAll ? "var(--yellow)" : meta!.color)
                    : "var(--cocoa-lt)",
                  boxShadow: isActive ? "2px 2px 0 var(--cocoa)" : "none",
                }}
                aria-pressed={isActive}
              >
                {isAll ? "ALL" : `${meta!.emoji} ${meta!.label.toUpperCase()}`}
              </button>
            );
          })}
        </div>

        {/* ── Todo list ── */}
        {filtered.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <div className="text-4xl mb-3 opacity-40">🎉</div>
            <div className="font-pixel text-[8px] text-[var(--cocoa-lt)] mb-1">ALL DONE!</div>
            <div className="text-[11px] text-[var(--cocoa-lt)]">
              No pending tasks. Add a new reminder above.
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((todo) => {
              const catMeta = CATEGORY_META[todo.category];
              const priStyle = PRIORITY_STYLES[todo.priority];
              return (
                <div
                  key={todo.id}
                  className="rounded-xl overflow-hidden transition-all"
                  style={{
                    background: todo.done ? "rgba(255,255,255,0.5)" : "#fff",
                    border: `2px solid ${todo.done ? "var(--cream2)" : "var(--cocoa)"}`,
                    boxShadow: todo.done ? "none" : "3px 3px 0 var(--cocoa)",
                    opacity: todo.done ? 0.65 : 1,
                  }}
                >
                  {/* priority accent */}
                  <div className="h-0.5" style={{ background: catMeta.color }} />

                  <div className="px-3.5 py-3 flex items-start gap-3">
                    {/* checkbox */}
                    <button
                      onClick={() => toggleDone(todo.id)}
                      className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                      style={{
                        background: todo.done
                          ? "linear-gradient(135deg, var(--mint) 0%, var(--mint-dk) 100%)"
                          : "var(--cream2)",
                        border: `2px solid ${todo.done ? "var(--mint-dk)" : "var(--cocoa)"}`,
                      }}
                      aria-label={todo.done ? "Mark as not done" : "Mark as done"}
                      aria-checked={todo.done}
                    >
                      {todo.done && (
                        <span className="text-[10px] text-white font-bold">✓</span>
                      )}
                    </button>

                    {/* content */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[13px] font-bold leading-snug"
                        style={{
                          color: todo.done ? "var(--cocoa-lt)" : "var(--cocoa)",
                          textDecoration: todo.done ? "line-through" : "none",
                        }}
                      >
                        {todo.text}
                      </div>

                      {/* meta row */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {/* category chip */}
                        <span
                          className="font-pixel text-[6px] px-2 py-0.5 rounded-full"
                          style={{
                            background: `${catMeta.color}22`,
                            color: catMeta.color,
                            border: `1px solid ${catMeta.color}44`,
                          }}
                        >
                          {catMeta.emoji} {catMeta.label}
                        </span>

                        {/* priority dot */}
                        <span className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${priStyle.dot}`} />
                          <span className="font-pixel text-[5.5px] text-[var(--cocoa-lt)]">{priStyle.label}</span>
                        </span>

                        {/* time */}
                        {todo.time && (
                          <span className="font-pixel text-[6px] text-[var(--cocoa-lt)]">
                            ⏰ {todo.time}
                          </span>
                        )}

                        {/* recurring */}
                        {todo.recurring && (
                          <span className="font-pixel text-[6px] text-[var(--mint-dk)]">
                            🔁 {todo.recurring}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* delete */}
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="mt-0.5 text-[var(--cocoa-lt)] hover:text-[var(--coral)] transition-colors flex-shrink-0"
                      aria-label="Delete reminder"
                    >
                      <span className="text-sm">🗑️</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Quick tips ── */}
        <div
          className="rounded-xl px-4 py-3 text-[11px] text-[var(--cocoa-lt)] leading-relaxed"
          style={{
            background: "linear-gradient(135deg, var(--cream2) 0%, var(--cream) 100%)",
            border: "2px solid var(--cream2)",
          }}
        >
          💡 Tip: Purrdict can auto-suggest reminders based on your cat&apos;s patterns — like when
          feeding is overdue or play activity drops below average.
        </div>
      </div>
    </>
  );
}
