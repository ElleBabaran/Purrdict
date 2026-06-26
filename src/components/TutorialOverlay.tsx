"use client";
import { useState, useEffect } from "react";
import PixelCat from "./PixelCat";

const TUTORIAL_STEPS = [
  {
    id: "welcome",
    title: "Welcome to PurrDict!",
    message:
      "Meow! I'm Whiskers, your guide~ Let me show you around so you can keep your cat happy and healthy! 🐾",
    emoji: "👋",
    highlight: null,
  },
  {
    id: "live",
    title: "Live Detection",
    message:
      "This is your dashboard! Here you can see what your cat is doing in real-time — sleeping, playing, eating... I know everything~ 😼",
    emoji: "⚡",
    highlight: "live",
  },
  {
    id: "cam",
    title: "Cat Cam",
    message:
      "Tap the Cam tab to check on your kitty with the live camera feed. Smile for the camera! 📸",
    emoji: "📷",
    highlight: "cam",
  },
  {
    id: "reminders",
    title: "Tasks & Reminders",
    message:
      "Never forget feeding time or vet visits! I'll remind you when it's time to take care of your fur baby~ 🔔",
    emoji: "🔔",
    highlight: "reminders",
  },
  {
    id: "scrapbook",
    title: "Photo Album",
    message:
      "Save your favorite moments in the scrapbook! Every cat deserves a photo album, right? 📖✨",
    emoji: "📖",
    highlight: "scrapbook",
  },
  {
    id: "health",
    title: "Health Tracker",
    message:
      "Keep track of your cat's health metrics, weight, and vet records all in one place. A healthy cat is a happy cat! ❤️",
    emoji: "❤️",
    highlight: "health",
  },
  {
    id: "done",
    title: "You're All Set!",
    message:
      "That's it! You're ready to be the best cat parent ever. I'll always be here if you need me~ Purrr~ 😸",
    emoji: "🎉",
    highlight: null,
  },
];

export default function TutorialOverlay({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [catMood, setCatMood] = useState<"happy" | "talking" | "waving">("waving");

  useEffect(() => {
    // Fade in on mount
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Change cat mood based on step
    if (step === 0) setCatMood("waving");
    else if (step === TUTORIAL_STEPS.length - 1) setCatMood("happy");
    else setCatMood("talking");
  }, [step]);

  function handleNext() {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  }

  function handleSkip() {
    handleFinish();
  }

  function handleFinish() {
    setVisible(false);
    setTimeout(() => {
      localStorage.setItem("purrdict_tutorial_done", "true");
      onComplete();
    }, 300);
  }

  const current = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <div
      className={`fixed inset-0 z-[999] flex items-end justify-center transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ background: "rgba(26,18,37,0.75)", backdropFilter: "blur(4px)" }}
      />

      {/* Nav highlight indicators */}
      {current.highlight && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] flex max-w-2xl mx-auto">
          <NavHighlight activeTab={current.highlight} />
        </div>
      )}

      {/* Tutorial Card */}
      <div
        className={`relative z-[1001] w-full max-w-md mx-4 mb-28 transition-all duration-300 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        {/* Cat mascot */}
        <div className="flex justify-center mb-3">
          <div className="relative">
            <div className="animate-bob">
              <PixelCat size={64} variant="orange" bounce={catMood === "happy"} />
            </div>
            {/* Speech indicator */}
            {catMood === "talking" && (
              <div className="absolute -top-2 -right-2 text-lg animate-bounce">💬</div>
            )}
            {catMood === "waving" && (
              <div className="absolute -top-2 -right-2 text-lg animate-bounce">✨</div>
            )}
            {catMood === "happy" && (
              <div className="absolute -top-2 -right-2 text-lg animate-bounce">🎉</div>
            )}
          </div>
        </div>

        {/* Card content */}
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #FFF6EC 0%, #FFEFDC 100%)",
            border: "3px solid var(--cocoa)",
            boxShadow: "5px 5px 0 var(--cocoa), 0 8px 32px rgba(26,18,37,0.3)",
          }}
        >
          {/* Step emoji badge */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "var(--cream2)", border: "2px solid var(--cocoa)" }}
            >
              {current.emoji}
            </div>
            <div>
              <div className="font-pixel text-[10px] text-[var(--pink-dk)]">
                {isFirst ? "HELLO THERE!" : isLast ? "ALL DONE!" : `STEP ${step}/${TUTORIAL_STEPS.length - 2}`}
              </div>
              <div className="text-lg font-bold text-[var(--cocoa)]">{current.title}</div>
            </div>
          </div>

          {/* Message */}
          <p className="text-[14px] text-[var(--cocoa-lt)] leading-relaxed mb-5">
            {current.message}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {TUTORIAL_STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 20 : 8,
                  height: 8,
                  background: i === step ? "var(--pink)" : i < step ? "var(--mint)" : "var(--cream2)",
                  border: `1.5px solid ${i === step ? "var(--pink-dk)" : i < step ? "var(--mint-dk)" : "var(--cocoa-lt)"}`,
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            {!isLast && (
              <button
                onClick={handleSkip}
                className="flex-1 py-3 rounded-xl font-pixel text-[9px] text-[var(--cocoa-lt)] transition-all hover:bg-[var(--cream2)]"
                style={{ border: "2px solid var(--cream2)" }}
              >
                SKIP TUTORIAL
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 py-3 rounded-xl font-pixel text-[9px] text-white pixel-press transition-all"
              style={{
                background: isLast
                  ? "linear-gradient(135deg, var(--mint-dk), var(--mint))"
                  : "linear-gradient(135deg, var(--pink-dk), var(--pink))",
                border: "2px solid var(--cocoa)",
                boxShadow: "3px 3px 0 var(--cocoa)",
              }}
            >
              {isLast ? "LET'S GO! 🐾" : isFirst ? "START TOUR ➜" : "NEXT ➜"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Highlight ring around the active nav tab */
function NavHighlight({ activeTab }: { activeTab: string }) {
  const tabMap: Record<string, number> = {
    live: 0,
    cam: 1,
    reminders: 2,
    scrapbook: 3,
    health: 4,
  };

  const index = tabMap[activeTab] ?? -1;
  if (index === -1) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[1002] flex max-w-2xl mx-auto pointer-events-none"
      style={{ padding: "0" }}
    >
      <div className="w-full flex">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 flex items-center justify-center py-3">
            {i === index && (
              <div
                className="w-12 h-12 rounded-full animate-pulse-ring"
                style={{
                  border: "2.5px solid var(--pink)",
                  background: "rgba(255,143,163,0.1)",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
