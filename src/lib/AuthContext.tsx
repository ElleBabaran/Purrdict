"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export interface CatCard {
  id: string;
  name: string;
  emoji: string;
  breed: string;
  color: string;
  ageMonths: number | null;
  photo?: string;
  esp32Pin: string;
  esp32Connected: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  cats: CatCard[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  addCat: (cat: CatCard) => void;
  updateCat: (id: string, updates: Partial<CatCard>) => void;
  deleteCat: (id: string) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user and token from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("purrdict_user");
    const storedToken = localStorage.getItem("purrdict_token");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        // ignore corrupt data
      }
    }
    if (storedToken) {
      setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  // Persist user state
  useEffect(() => {
    if (user) {
      localStorage.setItem("purrdict_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("purrdict_user");
    }
  }, [user]);

  // ── Login ──
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (!email || !password) return false;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      setUser(data.user);
      if (data.token) {
        localStorage.setItem("purrdict_token", data.token);
        setToken(data.token);
      }
      return true;
    } catch {
      // API not reachable — do not auto-login
      return false;
    }
  }, []);

  // ── Signup ──
  const signup = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    if (!email || !password || !name) return false;

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName: name }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      setUser(data.user);
      if (data.token) {
        localStorage.setItem("purrdict_token", data.token);
        setToken(data.token);
      }
      return true;
    } catch {
      // API not reachable — do not auto-signup
      return false;
    }
  }, []);

  // ── Logout ──
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("purrdict_user");
    localStorage.removeItem("purrdict_token");
    localStorage.removeItem("purrdict_tutorial_done");
  }, []);

  // ── Cat CRUD (local state + API) ──
  const addCat = useCallback((cat: CatCard) => {
    setUser((prev) => {
      if (!prev) {
        // Create a guest user if none exists
        const guest: User = {
          id: Date.now().toString(),
          email: "guest@purrdict.app",
          displayName: "Cat Parent",
          cats: [cat],
        };
        return guest;
      }
      return { ...prev, cats: [...prev.cats, cat] };
    });
    // Also persist to API
    const token = localStorage.getItem("purrdict_token");
    if (token) {
      fetch("/api/cats", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(cat),
      }).catch(() => {});
    }
  }, []);

  const updateCat = useCallback((id: string, updates: Partial<CatCard>) => {
    setUser((prev) =>
      prev ? { ...prev, cats: prev.cats.map((c) => (c.id === id ? { ...c, ...updates } : c)) } : prev
    );
    const token = localStorage.getItem("purrdict_token");
    fetch(`/api/cats/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    }).catch(() => {});
  }, []);

  const deleteCat = useCallback((id: string) => {
    setUser((prev) =>
      prev ? { ...prev, cats: prev.cats.filter((c) => c.id !== id) } : prev
    );
    const token = localStorage.getItem("purrdict_token");
    fetch(`/api/cats/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, signup, logout, addCat, updateCat, deleteCat }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
