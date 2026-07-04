"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import PixelCat from "@/components/PixelCat";

type Step = "connect" | "name-cat" | "card" | "done";

// Cat breed icons — SVG silhouettes
const CAT_ICONS = [
  { id: "sitting", label: "Sitting", svg: "M12 2C10.5 2 9.5 3 9 4C8 4 7 5 7 6.5C7 7.5 7.5 8.5 8 9C7 10 6 12 6 14C6 17 8 20 12 20C16 20 18 17 18 14C18 12 17 10 16 9C16.5 8.5 17 7.5 17 6.5C17 5 16 4 15 4C14.5 3 13.5 2 12 2Z" },
  { id: "playful", label: "Playful", svg: "M4 18C4 18 6 14 8 13C10 12 10 10 9 8C8 6 9 4 11 3C13 2 15 3 16 5C17 7 16 9 14 10C12 11 13 14 15 15C17 16 20 18 20 18" },
  { id: "sleeping", label: "Sleeping", svg: "M6 16C6 16 7 12 10 11C13 10 14 11 15 12C16 13 17 12 18 11C19 10 20 12 20 14C20 16 18 18 16 18C14 18 12 18 10 18C8 18 6 17 6 16Z" },
  { id: "standing", label: "Standing", svg: "M12 2C10 2 9 3.5 9 5C9 6 9.5 7 10 7.5C9 8 8 9.5 8 11C8 13 8 15 7 17C7 18 8 19 9 19C10 19 10 18 10 17C10 15 11 14 12 14C13 14 14 15 14 17C14 18 14 19 15 19C16 19 17 18 17 17C16 15 16 13 16 11C16 9.5 15 8 14 7.5C14.5 7 15 6 15 5C15 3.5 14 2 12 2Z" },
  { id: "stretching", label: "Stretching", svg: "M5 14C5 14 7 12 9 11C11 10 11 8 10 6.5C9 5 10 3 12 3C14 3 15 5 14 6.5C13 8 14 10 16 11C18 12 20 13 20 14C20 15 19 16 18 16C16 16 14 15 12 15C10 15 8 16 6 16C5 16 5 15 5 14Z" },
  { id: "loaf", label: "Loaf", svg: "M6 12C6 10 8 8 12 8C16 8 18 10 18 12C18 14 18 16 18 17C18 18 16 19 12 19C8 19 6 18 6 17C6 16 6 14 6 12Z" },
];
const CAT_COLORS = [
  { name: "Orange Tabby", value: "#F5A623" },
  { name: "Tuxedo", value: "#2D2438" },
  { name: "Grey", value: "#8A7768" },
  { name: "White", value: "#F5F0EA" },
  { name: "Calico", value: "#E56B85" },
  { name: "Black", value: "#1A1225" },
  { name: "Siamese", value: "#D4C5A9" },
  { name: "Ginger", value: "#D4721A" },
];

export default function SetupPage() {
  const router = useRouter();
  const { user, addCat } = useAuth();
  const [step, setStep] = useState<Step>("connect");

  // ESP32 connection
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [connecting, setConnecting] = useState(false);
  const [pinError, setPinError] = useState("");
  const [connected, setConnected] = useState(false);
  const [showDemoPrompt, setShowDemoPrompt] = useState(false);

  // Cat card
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("sitting");
  const [catPhoto, setCatPhoto] = useState<string | null>(null);
  const [catBreed, setCatBreed] = useState("");
  const [catColor, setCatColor] = useState(CAT_COLORS[0].value);
  const [catAge, setCatAge] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);

  function handlePinChange(index: number, value: string) {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/[0-9A-Za-z]/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.toUpperCase();
    setPin(newPin);
    setPinError("");
    if (value && index < 5) {
      const next = document.getElementById(`pin-${index + 1}`);
      next?.focus();
    }
  }

  function handlePinKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      const prev = document.getElementById(`pin-${index - 1}`);
      prev?.focus();
    }
  }

  async function handleConnect() {
    const code = pin.join("");
    if (code.length < 6) {
      setPinError("Enter the full 6-character PIN.");
      return;
    }

    setConnecting(true);
    setPinError("");
    await new Promise((r) => setTimeout(r, 2200));
    setConnecting(false);

    // Only accept the real device PIN
    const VALID_PIN = "PUR042";
    if (code === VALID_PIN) {
      setConnected(true);
      setTimeout(() => setStep("name-cat"), 800);
    } else {
      setPinError("");
      setShowDemoPrompt(true);
    }
  }

  function handleCreateCard() {
    if (!catName.trim()) return;
    const cat = {
      id: Date.now().toString(),
      name: catName.trim(),
      emoji: catIcon,
      breed: catBreed.trim() || "Unknown breed",
      color: catColor,
      ageMonths: parseInt(catAge) || null,
      photo: catPhoto || undefined,
      esp32Pin: pin.join(""),
      esp32Connected: true,
    };

    // If user is not logged in, create a guest user first
    if (!user) {
      const guestUser = {
        id: Date.now().toString(),
        email: "guest@purrdict.app",
        displayName: "Cat Parent",
        cats: [cat],
      };
      localStorage.setItem("purrdict_user", JSON.stringify(guestUser));
      // Force reload to pick up the new user
      window.location.href = "/dashboard";
      return;
    }

    addCat(cat);
    setStep("done");
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCatPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5 py-10"
      style={{
        background:
          "radial-gradient(circle at 50% 20%, rgba(196,181,253,0.12) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,209,102,0.1) 0%, transparent 40%), var(--cream)",
      }}
    >
      <div className="w-full max-w-sm">

        {/* ─── Progress dots ─── */}
        <div className="flex justify-center gap-2 mb-8">
          {(["connect", "name-cat", "card", "done"] as Step[]).map((s, i) => {
            const stepIndex = ["connect", "name-cat", "card", "done"].indexOf(step);
            const thisIndex = i;
            return (
              <div
                key={s}
                className="transition-all"
                style={{
                  width: thisIndex === stepIndex ? 20 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: thisIndex <= stepIndex ? "var(--pink-dk)" : "var(--cream2)",
                  border: thisIndex <= stepIndex ? "none" : "1.5px solid var(--cocoa-lt)",
                }}
              />
            );
          })}
        </div>

        {/* ════ STEP 1: CONNECT ESP32 ════ */}
        {step === "connect" && (
          <div className="animate-fade-up">
            <div className="text-center mb-7">
              <div
                className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-4xl"
                style={{
                  background: "linear-gradient(135deg, var(--plum) 0%, var(--plum-xl) 100%)",
                  border: "3px solid var(--cocoa)",
                  boxShadow: "4px 4px 0 var(--cocoa)",
                }}
              >
                📡
              </div>
              <h1 className="text-2xl font-bold text-[var(--cocoa)] mb-1">Pair your leash</h1>
              <p className="text-sm text-[var(--cocoa-lt)]">
                Enter the 6-character PIN on your ESP32 device
              </p>
            </div>

            <div
              className="rounded-2xl p-5"
              style={{ background: "white", border: "3px solid var(--cocoa)", boxShadow: "5px 5px 0 var(--cocoa)" }}
            >
              {/* PIN input */}
              <div className="flex justify-center gap-1.5 mb-4">
                {pin.map((digit, i) => (
                  <input
                    key={i}
                    id={`pin-${i}`}
                    type="text"
                    inputMode="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(i, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(i, e)}
                    className="w-12 h-14 text-center text-lg font-bold text-[var(--cocoa)] rounded-xl outline-none transition-all focus:ring-2 focus:ring-[var(--mint-dk)]"
                    style={{
                      background: digit ? "var(--mint)" + "22" : "var(--cream)",
                      border: `2.5px solid ${digit ? "var(--mint-dk)" : "var(--cream2)"}`,
                      boxShadow: digit ? "inset 0 2px 4px rgba(79,174,148,0.1), 2px 2px 0 var(--cocoa)" : "none",
                    }}
                    aria-label={`PIN character ${i + 1}`}
                  />
                ))}
              </div>

              {pinError && (
                <div className="text-[11px] text-[var(--coral)] text-center mb-3 font-medium">{pinError}</div>
              )}

              {connected ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse-ring" style={{ background: "rgba(79,174,148,0.15)", border: "2px solid var(--mint-dk)" }}>
                    <span className="text-xl">✓</span>
                  </div>
                  <span className="font-pixel text-[9px] text-[var(--mint-dk)]">DEVICE FOUND!</span>
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="w-full py-3.5 rounded-xl font-pixel text-[9px] transition-all pixel-press"
                  style={{
                    background: connecting ? "var(--cream2)" : "linear-gradient(135deg, var(--mint) 0%, var(--mint-dk) 100%)",
                    color: connecting ? "var(--cocoa-lt)" : "var(--plum)",
                    boxShadow: connecting ? "none" : "4px 4px 0 var(--cocoa)",
                  }}
                >
                  {connecting ? "🔄 SCANNING…" : "📡 CONNECT LEASH"}
                </button>
              )}
            </div>

            {/* Help + skip */}
            <div className="mt-5 space-y-3 text-center">
              {showDemoPrompt ? (
                <div
                  className="rounded-2xl p-5 text-left animate-fade-up"
                  style={{ background: "white", border: "2.5px solid var(--coral)", boxShadow: "4px 4px 0 var(--cocoa)" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">⚠️</span>
                    <span className="text-sm font-bold text-[var(--cocoa)]">Device not found</span>
                  </div>
                  <p className="text-[11px] text-[var(--cocoa-lt)] mb-3 leading-relaxed">
                    Couldn&apos;t connect to an ESP32 device with that PIN. Make sure your leash hardware is powered on and connected to the same Wi-Fi.
                  </p>
                  <div className="text-[10px] text-[var(--cocoa-lt)] mb-3 font-medium">Required hardware:</div>
                  <div className="space-y-1.5 mb-4">
                    {[
                      { name: "ESP32-CAM", desc: "Camera module (stationary)" },
                      { name: "MPU6050", desc: "Accelerometer + Gyroscope" },
                      { name: "INP Sensor", desc: "Infrared proximity" },
                      { name: "GPS Module", desc: "Location tracking" },
                    ].map((hw) => (
                      <div key={hw.name} className="flex items-center gap-2 py-1.5 px-3 rounded-lg" style={{ background: "var(--cream)" }}>
                        <span className="w-2 h-2 rounded-full bg-[var(--coral)]" />
                        <span className="text-[11px] font-bold text-[var(--cocoa)]">{hw.name}</span>
                        <span className="text-[10px] text-[var(--cocoa-lt)]">— {hw.desc}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-[var(--cocoa-lt)] mb-4">
                    Don&apos;t have the hardware? Try our demo mode instead — it simulates all sensor data so you can explore the full app.
                  </p>
                  <button
                    onClick={() => { setPin(["D","E","M","O","4","2"]); setConnected(true); setShowDemoPrompt(false); setTimeout(() => setStep("name-cat"), 400); }}
                    className="w-full py-3 rounded-xl font-pixel text-[9px] text-white pixel-press"
                    style={{ background: "linear-gradient(135deg, var(--pink) 0%, var(--pink-dk) 100%)", boxShadow: "4px 4px 0 var(--cocoa)" }}
                  >
                    🎮 TRY DEMO MODE
                  </button>
                  <button
                    onClick={() => { setShowDemoPrompt(false); setPin(["","","","","",""]); }}
                    className="w-full mt-2 py-2 font-pixel text-[7px] text-[var(--cocoa-lt)] hover:text-[var(--cocoa)] transition-colors"
                  >
                    ← TRY ANOTHER PIN
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-[10px] text-[var(--cocoa-lt)] leading-relaxed px-2">
                    💡 The PIN appears on the ESP32 OLED when it powers on. Both devices must be on the same Wi-Fi.
                  </div>
                  <button
                    onClick={() => { setPin(["D","E","M","O","4","2"]); setConnected(true); setTimeout(() => setStep("name-cat"), 400); }}
                    className="font-pixel text-[7px] text-[var(--cocoa-lt)] hover:text-[var(--pink-dk)] transition-colors underline"
                  >
                    SKIP → USE DEMO DEVICE
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ════ STEP 2: NAME YOUR CAT ════ */}
        {step === "name-cat" && (
          <div className="animate-fade-up">
            <div className="text-center mb-6">
              <div className="inline-block mb-3"><PixelCat size={64} bounce /></div>
              <h1 className="text-2xl font-bold text-[var(--cocoa)] mb-1">Who wears the leash?</h1>
              <p className="text-sm text-[var(--cocoa-lt)]">Create your cat&apos;s profile card</p>
            </div>

            <div
              className="rounded-2xl p-5 space-y-4"
              style={{ background: "white", border: "3px solid var(--cocoa)", boxShadow: "5px 5px 0 var(--cocoa)" }}
            >
              {/* Avatar — Cat icons + photo upload */}
              <div>
                <label className="font-pixel text-[7px] text-[var(--cocoa-lt)] block mb-2">CAT ICON</label>
                <div className="flex gap-2 flex-wrap justify-center mb-3">
                  {CAT_ICONS.map((icon) => (
                    <button
                      key={icon.id}
                      onClick={() => setCatIcon(icon.id)}
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
                      style={{
                        background: catIcon === icon.id ? `${catColor}22` : "var(--cream)",
                        border: `2px solid ${catIcon === icon.id ? catColor : "transparent"}`,
                        transform: catIcon === icon.id ? "scale(1.1)" : "scale(1)",
                        boxShadow: catIcon === icon.id ? "2px 2px 0 var(--cocoa)" : "none",
                      }}
                      title={icon.label}
                      aria-label={icon.label}
                    >
                      <svg viewBox="0 0 24 24" className="w-7 h-7" fill={catIcon === icon.id ? catColor : "var(--cocoa-lt)"}>
                        <path d={icon.svg} />
                      </svg>
                    </button>
                  ))}
                </div>

                {/* Photo upload */}
                <label className="font-pixel text-[7px] text-[var(--cocoa-lt)] block mb-1.5">PHOTO (optional)</label>
                <div className="flex items-center gap-3">
                  {catPhoto ? (
                    <div className="relative">
                      <img
                        src={catPhoto}
                        alt="Cat photo"
                        className="w-16 h-16 rounded-xl object-cover"
                        style={{ border: "2px solid var(--cocoa)" }}
                      />
                      <button
                        onClick={() => setCatPhoto(null)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--coral)] text-white text-[10px] flex items-center justify-center"
                        style={{ border: "1.5px solid var(--cocoa)" }}
                        aria-label="Remove photo"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => photoRef.current?.click()}
                      className="w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-105"
                      style={{
                        background: "var(--cream)",
                        border: "2px dashed var(--cocoa-lt)",
                      }}
                      aria-label="Upload cat photo"
                    >
                      <span className="text-lg">📷</span>
                      <span className="font-pixel text-[5px] text-[var(--cocoa-lt)]">UPLOAD</span>
                    </button>
                  )}
                  <div className="flex-1 text-[10px] text-[var(--cocoa-lt)] leading-relaxed">
                    Upload a photo of your cat for the profile card. JPG, PNG, or WEBP.
                  </div>
                </div>
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {/* Name */}
              <div>
                <label className="font-pixel text-[7px] text-[var(--cocoa-lt)] block mb-1.5">NAME *</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm font-bold text-[var(--cocoa)] outline-none focus:ring-2 focus:ring-[var(--pink)]"
                  style={{ background: "var(--cream)", border: "2px solid var(--cream2)" }}
                  placeholder="Mochi, Luna, Whiskers…"
                />
              </div>

              {/* Breed + Age row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-pixel text-[7px] text-[var(--cocoa-lt)] block mb-1.5">BREED</label>
                  <input
                    type="text"
                    value={catBreed}
                    onChange={(e) => setCatBreed(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-[var(--cocoa)] outline-none"
                    style={{ background: "var(--cream)", border: "2px solid var(--cream2)" }}
                    placeholder="Shorthair"
                  />
                </div>
                <div>
                  <label className="font-pixel text-[7px] text-[var(--cocoa-lt)] block mb-1.5">AGE (months)</label>
                  <input
                    type="number"
                    value={catAge}
                    onChange={(e) => setCatAge(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-[var(--cocoa)] outline-none"
                    style={{ background: "var(--cream)", border: "2px solid var(--cream2)" }}
                    placeholder="18"
                  />
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="font-pixel text-[7px] text-[var(--cocoa-lt)] block mb-2">FUR COLOR</label>
                <div className="flex gap-2 flex-wrap">
                  {CAT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setCatColor(c.value)}
                      className="w-8 h-8 rounded-full transition-all"
                      style={{
                        background: c.value,
                        border: `3px solid ${catColor === c.value ? "var(--cocoa)" : "transparent"}`,
                        boxShadow: catColor === c.value ? "0 0 0 2px var(--cream), 2px 2px 0 var(--cocoa)" : "inset 0 -2px 4px rgba(0,0,0,0.15)",
                        transform: catColor === c.value ? "scale(1.2)" : "scale(1)",
                      }}
                      title={c.name}
                      aria-label={c.name}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep("card")}
                disabled={!catName.trim()}
                className="w-full py-3.5 rounded-xl font-pixel text-[9px] transition-all pixel-press"
                style={{
                  background: catName.trim() ? "linear-gradient(135deg, var(--pink) 0%, var(--pink-dk) 100%)" : "var(--cream2)",
                  color: catName.trim() ? "white" : "var(--cocoa-lt)",
                  boxShadow: catName.trim() ? "4px 4px 0 var(--cocoa)" : "none",
                }}
              >
                {catName.trim() ? "SEE CARD →" : "ENTER A NAME"}
              </button>
            </div>
          </div>
        )}

        {/* ════ STEP 3: CAT CARD PREVIEW ════ */}
        {step === "card" && (
          <div className="animate-fade-up">
            <div className="text-center mb-5">
              <h1 className="text-xl font-bold text-[var(--cocoa)]">{catName}&apos;s Card</h1>
              <p className="text-[12px] text-[var(--cocoa-lt)]">Your cat&apos;s ID — confirm to save</p>
            </div>

            {/* ── THE CAT CARD ── */}
            <div
              className="rounded-2xl overflow-hidden mb-5 relative"
              style={{
                border: "3px solid var(--cocoa)",
                boxShadow: "6px 6px 0 var(--cocoa)",
                background: "white",
              }}
            >
              {/* top color band */}
              <div
                className="h-24 relative flex items-end justify-center"
                style={{ background: `linear-gradient(135deg, ${catColor}88 0%, ${catColor}44 100%)` }}
              >
                {/* corner badge */}
                <div
                  className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-full"
                  style={{ background: "rgba(255,255,255,0.85)", border: "1.5px solid var(--mint-dk)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--mint)] animate-blink" />
                  <span className="font-pixel text-[5.5px] text-[var(--mint-dk)]">ONLINE</span>
                </div>
                {/* purrdict branding */}
                <div className="absolute top-2.5 left-3 font-pixel text-[6px] text-[var(--cocoa)]">🐾 PURRDICT</div>
                {/* avatar circle */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center translate-y-8 relative z-10 overflow-hidden"
                  style={{
                    background: "white",
                    border: "3px solid var(--cocoa)",
                    boxShadow: "3px 3px 0 var(--cocoa)",
                  }}
                >
                  {catPhoto ? (
                    <img src={catPhoto} alt={catName} className="w-full h-full object-cover" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-9 h-9" fill={catColor}>
                      <path d={CAT_ICONS.find((i) => i.id === catIcon)?.svg || CAT_ICONS[0].svg} />
                    </svg>
                  )}
                </div>
              </div>

              {/* body */}
              <div className="pt-10 pb-5 px-5">
                {/* name */}
                <div className="text-center mb-4">
                  <div className="text-xl font-bold text-[var(--cocoa)]">{catName}</div>
                  <div className="text-[11px] text-[var(--cocoa-lt)]">
                    {catBreed || "Unknown breed"} · {catAge ? `${catAge}mo` : "Age unknown"}
                  </div>
                </div>

                {/* stat grid */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="rounded-lg py-2 px-2 text-center" style={{ background: "var(--cream)" }}>
                    <div className="flex justify-center mb-0.5">
                      {catPhoto ? (
                        <img src={catPhoto} alt="" className="w-6 h-6 rounded-full object-cover" style={{ border: "1px solid var(--cocoa)" }} />
                      ) : (
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill={catColor}>
                          <path d={CAT_ICONS.find((i) => i.id === catIcon)?.svg || CAT_ICONS[0].svg} />
                        </svg>
                      )}
                    </div>
                    <div className="font-pixel text-[5.5px] text-[var(--cocoa-lt)]">ICON</div>
                  </div>
                  <div className="rounded-lg py-2 px-2 text-center" style={{ background: "var(--cream)" }}>
                    <div className="flex justify-center mb-0.5">
                      <span className="w-5 h-5 rounded-full" style={{ background: catColor, border: "1.5px solid var(--cocoa)" }} />
                    </div>
                    <div className="font-pixel text-[5.5px] text-[var(--cocoa-lt)]">COLOR</div>
                  </div>
                  <div className="rounded-lg py-2 px-2 text-center" style={{ background: "var(--cream)" }}>
                    <div className="text-lg mb-0.5">📡</div>
                    <div className="font-pixel text-[5.5px] text-[var(--mint-dk)]">ESP32 ✓</div>
                  </div>
                </div>

                {/* device info */}
                <div
                  className="rounded-xl px-3 py-2.5 flex items-center justify-between"
                  style={{ background: "var(--cream)", border: "1.5px dashed var(--cream2)" }}
                >
                  <div>
                    <div className="font-pixel text-[6px] text-[var(--cocoa-lt)]">LEASH PIN</div>
                    <div className="font-mono text-sm font-bold text-[var(--cocoa)] tracking-wider">{pin.join("")}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-pixel text-[6px] text-[var(--cocoa-lt)]">OWNER</div>
                    <div className="text-[12px] font-bold text-[var(--cocoa)]">{user?.displayName || "You"}</div>
                  </div>
                </div>
              </div>

              {/* bottom decorative strip */}
              <div
                className="h-2"
                style={{ background: `repeating-linear-gradient(90deg, ${catColor} 0 8px, var(--cocoa) 8px 10px)` }}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep("name-cat")}
                className="flex-1 py-3 rounded-xl font-pixel text-[8px] text-[var(--cocoa)] pixel-press"
                style={{ background: "white", border: "2.5px solid var(--cocoa)", boxShadow: "3px 3px 0 var(--cocoa)" }}
              >
                ← EDIT
              </button>
              <button
                onClick={handleCreateCard}
                className="flex-[2] py-3 rounded-xl font-pixel text-[9px] text-white pixel-press"
                style={{ background: "linear-gradient(135deg, var(--mint) 0%, var(--mint-dk) 100%)", boxShadow: "4px 4px 0 var(--cocoa)" }}
              >
                ✓ SAVE CAT CARD
              </button>
            </div>
          </div>
        )}

        {/* ════ STEP 4: DONE ════ */}
        {step === "done" && (
          <div className="animate-fade-up text-center">
            <div
              className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center text-4xl"
              style={{
                background: "linear-gradient(135deg, var(--mint) 0%, var(--mint-dk) 100%)",
                border: "3px solid var(--cocoa)",
                boxShadow: "4px 4px 0 var(--cocoa)",
              }}
            >
              🎉
            </div>
            <h1 className="text-2xl font-bold text-[var(--cocoa)] mb-2">You&apos;re all set!</h1>
            <p className="text-sm text-[var(--cocoa-lt)] mb-2">
              <strong>{catName}</strong>&apos;s leash is paired and their card is saved.
            </p>
            <p className="text-[11px] text-[var(--cocoa-lt)] mb-8">
              Time to see what they&apos;re really up to 👀
            </p>

            <button
              onClick={() => router.push("/dashboard")}
              className="px-8 py-4 rounded-xl font-pixel text-[10px] text-white pixel-press"
              style={{
                background: "linear-gradient(135deg, var(--pink) 0%, var(--pink-dk) 100%)",
                boxShadow: "5px 5px 0 var(--cocoa)",
              }}
            >
              🐱 OPEN DASHBOARD
            </button>

            <div className="mt-5">
              <button
                onClick={() => { setCatName(""); setCatBreed(""); setCatAge(""); setCatIcon("sitting"); setCatPhoto(null); setPin(["","","","","",""]); setConnected(false); setStep("connect"); }}
                className="font-pixel text-[7px] text-[var(--cocoa-lt)] hover:text-[var(--pink-dk)] transition-colors underline"
              >
                + ADD ANOTHER CAT
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
