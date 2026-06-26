"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import PixelCat from "@/components/PixelCat";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name || !email || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    const ok = await signup(email, password, name);
    setLoading(false);
    if (ok) {
      router.push("/setup");
    } else {
      setError("Something went wrong. Try again.");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{
        background:
          "radial-gradient(circle at 70% 20%, rgba(127,216,190,0.2) 0%, transparent 40%), radial-gradient(circle at 30% 80%, rgba(255,143,163,0.15) 0%, transparent 40%), var(--cream)",
      }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <PixelCat size={64} />
          </div>
          <h1 className="font-pixel text-[14px] text-[var(--cocoa)] mb-2">PURRDICT</h1>
          <p className="text-sm text-[var(--cocoa-lt)]">Create your account to get started 🎉</p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 space-y-4"
          style={{
            background: "white",
            border: "3px solid var(--cocoa)",
            boxShadow: "6px 6px 0 var(--cocoa)",
          }}
        >
          <div className="font-pixel text-[9px] text-[var(--mint-dk)] text-center mb-2">
            ▸ SIGN UP
          </div>

          {error && (
            <div
              className="px-3 py-2 rounded-xl text-[11px] text-[var(--coral)] font-medium"
              style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)" }}
            >
              {error}
            </div>
          )}

          <div>
            <label className="font-pixel text-[7px] text-[var(--cocoa-lt)] block mb-1.5">YOUR NAME</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-[var(--cocoa)] outline-none"
              style={{ background: "var(--cream)", border: "2px solid var(--cream2)" }}
              placeholder="Cat Parent"
              aria-label="Display name"
            />
          </div>

          <div>
            <label className="font-pixel text-[7px] text-[var(--cocoa-lt)] block mb-1.5">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-[var(--cocoa)] outline-none"
              style={{ background: "var(--cream)", border: "2px solid var(--cream2)" }}
              placeholder="you@email.com"
              aria-label="Email"
            />
          </div>

          <div>
            <label className="font-pixel text-[7px] text-[var(--cocoa-lt)] block mb-1.5">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-[var(--cocoa)] outline-none"
              style={{ background: "var(--cream)", border: "2px solid var(--cream2)" }}
              placeholder="Min 6 characters"
              aria-label="Password"
            />
          </div>

          <div>
            <label className="font-pixel text-[7px] text-[var(--cocoa-lt)] block mb-1.5">CONFIRM PASSWORD</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-[var(--cocoa)] outline-none"
              style={{ background: "var(--cream)", border: "2px solid var(--cream2)" }}
              placeholder="••••••••"
              aria-label="Confirm password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-pixel text-[10px] text-white transition-all pixel-press"
            style={{
              background: loading
                ? "var(--cocoa-lt)"
                : "linear-gradient(135deg, var(--mint) 0%, var(--mint-dk) 100%)",
              boxShadow: loading ? "none" : "4px 4px 0 var(--cocoa)",
            }}
          >
            {loading ? "CREATING…" : "✨ CREATE ACCOUNT"}
          </button>

          <div className="text-center pt-2">
            <span className="text-[12px] text-[var(--cocoa-lt)]">Already have an account? </span>
            <Link href="/login" className="text-[12px] font-bold text-[var(--pink-dk)] hover:underline">
              Log in
            </Link>
          </div>
        </form>

        <div className="text-center mt-5">
          <Link href="/" className="font-pixel text-[8px] text-[var(--cocoa-lt)] hover:text-[var(--cocoa)]">
            ← BACK TO HOME
          </Link>
        </div>
      </div>
    </div>
  );
}
