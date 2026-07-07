"use client";
import { useState, useEffect, useRef, useCallback, InputHTMLAttributes } from "react";

export interface AddressSuggestion {
  label: string;
  lat: number;
  lng: number;
  isSpecific: boolean;
}

interface AddressAutocompleteProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "onSelect"> {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: AddressSuggestion) => void;
  inputClassName?: string;
  inputStyle?: React.CSSProperties;
}

const DEBOUNCE_MS = 350;

/**
 * Text input with a live address/place suggestion dropdown, backed by
 * /api/geocode/suggest (Nominatim). Debounces requests while typing,
 * supports keyboard navigation (Up/Down/Enter/Escape), and closes on
 * outside click or blur.
 */
export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  inputClassName,
  inputStyle,
  onKeyDown,
  ...inputProps
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const fetchSuggestions = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }
    const thisRequestId = ++requestIdRef.current;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/geocode/suggest?query=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      // Ignore stale responses from superseded requests
      if (thisRequestId !== requestIdRef.current) return;
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      setIsOpen(true);
    } catch {
      if (thisRequestId === requestIdRef.current) setSuggestions([]);
    } finally {
      if (thisRequestId === requestIdRef.current) setIsLoading(false);
    }
  }, []);

  // Debounce fetching suggestions as the user types
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchSuggestions]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(suggestion: AddressSuggestion) {
    onChange(suggestion.label);
    setIsOpen(false);
    setSuggestions([]);
    setHighlightedIndex(-1);
    onSelect?.(suggestion);
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (isOpen && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
        return;
      }
      if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
        return;
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }
    }
    onKeyDown?.(e);
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <input
        {...inputProps}
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setHighlightedIndex(-1); }}
        onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
        onKeyDown={handleInputKeyDown}
        className={inputClassName}
        style={inputStyle}
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        autoComplete="off"
      />

      {isOpen && (isLoading || suggestions.length > 0) && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-20 max-h-56 overflow-y-auto rounded-xl"
          style={{ background: "var(--cream)", border: "2px solid var(--cocoa)", boxShadow: "3px 3px 0 var(--cocoa)" }}
          role="listbox"
        >
          {isLoading && suggestions.length === 0 && (
            <div className="px-3 py-2.5 text-[11px] text-[var(--cocoa-lt)]">Searching…</div>
          )}
          {suggestions.map((s, i) => (
            <button
              key={`${s.lat}-${s.lng}-${i}`}
              type="button"
              role="option"
              aria-selected={i === highlightedIndex}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
              onMouseEnter={() => setHighlightedIndex(i)}
              className="w-full text-left px-3 py-2.5 text-[12px] text-[var(--cocoa)] flex items-start gap-2 transition-colors"
              style={{
                background: i === highlightedIndex ? "var(--cream2)" : "transparent",
                borderBottom: i < suggestions.length - 1 ? "1px solid var(--cream2)" : "none",
              }}
            >
              <span className="mt-0.5 flex-shrink-0">{s.isSpecific ? "📍" : "🌐"}</span>
              <span className="truncate">{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
