"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

/**
 * SECURITY NOTE: Token Storage
 * 
 * This implementation uses localStorage for token storage, which has known security limitations:
 * - localStorage is not encrypted at rest on the device
 * - Tokens stored in localStorage are accessible to any JavaScript running in the same origin
 * - While Android backup is disabled (android:allowBackup="false") and explicit backup exclusion
 *   rules are configured, localStorage in WebView is still vulnerable to device-level attacks
 * 
 * MITIGATION MEASURES IN PLACE:
 * 1. Android manifest sets android:allowBackup="false"
 * 2. Explicit backup exclusion rules for Android 12+ (dataExtractionRules)
 * 3. Legacy backup exclusion rules for Android 11- (fullBackupContent)
 * 4. WebView localStorage directory explicitly excluded from backups
 * 
 * RECOMMENDED FUTURE ENHANCEMENT:
 * Migrate to platform-specific secure storage:
 * - Android: Use Android Keystore via @capacitor-community/secure-storage-plugin
 * - iOS: Use iOS Keychain via @capacitor-community/secure-storage-plugin
 * - Web: Continue using localStorage (acceptable for web context)
 * 
 * The storage abstraction functions below (secureStorage) are designed to make
 * this migration straightforward when the secure storage plugin is added.
 */

/**
 * Storage abstraction layer for sensitive data (tokens)
 * Currently uses localStorage but designed for easy migration to secure storage
 */
const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    // TODO: Replace with secure storage plugin when available
    // Example: return await SecureStoragePlugin.get({ key });
    return localStorage.getItem(key);
  },
  
  async setItem(key: string, value: string): Promise<void> {
    // TODO: Replace with secure storage plugin when available
    // Example: await SecureStoragePlugin.set({ key, value });
    localStorage.setItem(key, value);
  },
  
  async removeItem(key: string): Promise<void> {
    // TODO: Replace with secure storage plugin when available
    // Example: await SecureStoragePlugin.remove({ key });
    localStorage.removeItem(key);
  }
};

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
  logout: () => Promise<void>;
  addCat: (cat: CatCard) => Promise<void>;
  updateCat: (id: string, updates: Partial<CatCard>) => Promise<void>;
  deleteCat: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user and token from storage on mount
  useEffect(() => {
    const loadStoredAuth = async () => {
      const stored = localStorage.getItem("purrdict_user");
      const storedToken = await secureStorage.getItem("purrdict_token");
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
    };
    loadStoredAuth();
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
        await secureStorage.setItem("purrdict_token", data.token);
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
        await secureStorage.setItem("purrdict_token", data.token);
        setToken(data.token);
      }
      return true;
    } catch {
      // API not reachable — do not auto-signup
      return false;
    }
  }, []);

  // ── Logout ──
  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("purrdict_user");
    await secureStorage.removeItem("purrdict_token");
    localStorage.removeItem("purrdict_tutorial_done");
  }, []);

  // ── Cat CRUD (local state + API) ──
  const addCat = useCallback(async (cat: CatCard) => {
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
    const token = await secureStorage.getItem("purrdict_token");
    if (token) {
      fetch("/api/cats", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(cat),
      }).catch(() => {});
    }
  }, []);

  const updateCat = useCallback(async (id: string, updates: Partial<CatCard>) => {
    setUser((prev) =>
      prev ? { ...prev, cats: prev.cats.map((c) => (c.id === id ? { ...c, ...updates } : c)) } : prev
    );
    const token = await secureStorage.getItem("purrdict_token");
    if (token) {
      fetch(`/api/cats/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      }).catch(() => {});
    }
  }, []);

  const deleteCat = useCallback(async (id: string) => {
    setUser((prev) =>
      prev ? { ...prev, cats: prev.cats.filter((c) => c.id !== id) } : prev
    );
    const token = await secureStorage.getItem("purrdict_token");
    if (token) {
      fetch(`/api/cats/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
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
