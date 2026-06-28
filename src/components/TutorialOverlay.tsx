"use client";
import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import PixelCat from "./PixelCat";

interface TutorialStep {
  id: string;
  title: string;
  message: string;
  emoji: string;
  action: "next" | "tap-tab" | "done";
  targetTab?: string;
  targetHref?: string;
  actionLabel: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to PurrDict!",
    message:
      "Meow~! I'm Whiskers, your cat guide! Let me show you around so you can take care of your fur baby like a pro! 🐾",
    emoji: "👋",
    action: "next",
    actionLabel: "START TOUR ➜",
  },
  {
    id: "live",
    title: "Live Detection",
    message:
      "This is your Live dashboard! You can see what your cat is doing right now. Pretty cool, right? Now try tapping the Cam tab below~ 📸",
    emoji: "⚡",
    action: "tap-tab",
    targetTab: "cam",
    targetHref: "/dashboard/cam",
    actionLabel: "TAP THE CAM TAB ↓",
  },
  {
    id: "cam",
    title: "Cat Cam",
    message:
      "Nice one! This is where you can watch your kitty through the camera. Now let's check the Tasks tab~ 🔔",
    emoji: "📷",
    action: "tap-tab",
    targetTab: "reminders",
    targetHref: "/dashboard/reminders",
    actionLabel: "TAP THE TASKS TAB ↓",
  },
  {
    id: "reminders",
    title: "Tasks & Reminders",
    message:
      "Here you can set reminders for feeding, vet visits, and more! I'll meow at you when it's time~ Now try the Album tab! 📖",
    emoji: "🔔",
    action: "tap-tab",
    targetTab: "scrapbook",
    targetHref: "/dashboard/scrapbook",
    actionLabel: "TAP THE ALBUM TAB ↓",
  },
  {
    id: "scrapbook",
    title: "Photo Album",
    message:
      "Save cute moments here! Every cat deserves their own photo collection~ One more — tap the Health tab! ❤️",
    emoji: "📖",
    action: "tap-tab",
    targetTab: "health",
    targetHref: "/dashboard/health",
    actionLabel: "TAP THE HEALTH TAB ↓",
  },
  {
    id: "health",
    title: "Health Tracker",
    message:
      "This is where you track weight, vet records, and overall wellness. A healthy cat is a happy cat! 😸",
    emoji: "❤️",
    action: "next",
    actionLabel: "ALMOST DONE ➜",
  },
  {
    id: "done",
    title: "You're All Set!",
    message:
      "That's everything! You're ready to be the best cat parent ever. I'll always be here purring for you~ Purrr~ 🐱✨",
    emoji: "🎉",
    action: "done",
    actionLabel: "LET'S GO! 🐾",
  },
];

export default function TutorialOverlay({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [waitingForTap, setWaitingForTap] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Listen for navigation changes to detect when user taps the correct tab
  useEffect(() => {
    if (!waitingForTap) return;
    const current = TUTORIAL_STEPS[step];
    if (current.action === "tap-tab" && current.targetHref && pathname === current.targetHref) {
      // User tapped the correct tab — advance immediately
      setWaitingForTap(false);
      setStep((s) => s + 1);
    }
  }, [pathname, waitingForTap, step]);

  function handleAction() {
    const current = TUTORIAL_STEPS[step];

    if (current.action === "done") {
      handleFinish();
      return;
    }

    if (current.action === "tap-tab") {
      // Enable listening for tab navigation
      setWaitingForTap(true);
      return;
    }

    // Simple next
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(step + 1);
    }
  }

  function handleSkip() {
    handleFinish();
  }

  function handleFinish() {
    setVisible(false);
    setTimeout(() => {
      localStorage.setItem("purrdict_tutorial_done", "true");
      // Navigate back to main dashboard
      router.push("/dashboard");
      onComplete();
    }, 300);
  }

  const current = TUTORIAL_STEPS[step];
  const isLast = current.action === "done";
  const isFirst = step === 0;

  return (
    <div
      className={`fixed inset-0 z-[999] flex items-end justify-center transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      } ${waitingForTap ? "pointer-events-none" : ""}`}
    >
      {/* Backdrop — allow clicks through to bottom nav when waiting */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ background: "rgba(26,18,37,0.7)", backdropFilter: "blur(3px)" }}
      />

      {/* Bottom nav highlight when waiting for tap */}
      {waitingForTap && current.targetTab && (
        <BottomNavHighlight targetTab={current.targetTab} />
      )}

      {/* Tutorial Card */}
      <div
        className={`relative z-[1001] w-full max-w-md mx-4 transition-all duration-300 pointer-events-auto ${
          waitingForTap ? "mb-32" : "mb-28"
        } ${visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
      >
        {/* Cat mascot */}
        <div className="flex justify-center mb-3">
          <div className="relative">
            <div className="animate-bob">
              <PixelCat size={56} variant="orange" bounce={isLast} walking={!isFirst && !isLast} />
            </div>
            {waitingForTap && (
              <div className="absolute -top-3 -right-3 text-xl animate-bounce">👇</div>
            )}
            {!waitingForTap && !isLast && step > 0 && (
              <div className="absolute -top-2 -right-2 text-lg animate-bounce">💬</div>
            )}
            {isFirst && (
              <div className="absolute -top-2 -right-2 text-lg animate-bounce">✨</div>
            )}
            {isLast && (
              <div className="absolute -top-2 -right-2 text-lg animate-bounce">🎉</div>
            )}
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #FFF6EC 0%, #FFEFDC 100%)",
            border: "3px solid var(--cocoa)",
            boxShadow: "5px 5px 0 var(--cocoa), 0 8px 32px rgba(26,18,37,0.3)",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "var(--cream2)", border: "2px solid var(--cocoa)" }}
            >
              {current.emoji}
            </div>
            <div>
              <div className="font-pixel text-[10px] text-[var(--pink-dk)]">
                {isFirst ? "HELLO!" : isLast ? "ALL DONE!" : `STEP ${step}/${TUTORIAL_STEPS.length - 2}`}
              </div>
              <div className="text-lg font-bold text-[var(--cocoa)]">{current.title}</div>
            </div>
          </div>

          {/* Message */}
          <p className="text-[14px] text-[var(--cocoa-lt)] leading-relaxed mb-4">
            {current.message}
          </p>

          {/* Waiting indicator */}
          {waitingForTap && (
            <div
              className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl animate-pulse"
              style={{ background: "rgba(255,143,163,0.12)", border: "1.5px solid rgba(255,143,163,0.3)" }}
            >
              <span className="text-base">👇</span>
              <span className="font-pixel text-[8px] text-[var(--pink-dk)]">
                TAP THE {current.targetTab?.toUpperCase()} TAB IN THE NAVIGATION BAR BELOW
              </span>
            </div>
          )}

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {TUTORIAL_STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 18 : 7,
                  height: 7,
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
                SKIP
              </button>
            )}
            {!waitingForTap && (
              <button
                onClick={handleAction}
                className="flex-1 py-3 rounded-xl font-pixel text-[9px] text-white pixel-press transition-all"
                style={{
                  background: isLast
                    ? "linear-gradient(135deg, var(--mint-dk), var(--mint))"
                    : "linear-gradient(135deg, var(--pink-dk), var(--pink))",
                  border: "2px solid var(--cocoa)",
                  boxShadow: "3px 3px 0 var(--cocoa)",
                }}
              >
                {current.actionLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Pulsing highlight around the target tab in the bottom nav */
function BottomNavHighlight({ targetTab }: { targetTab: string }) {
  const tabMap: Record<string, number> = {
    live: 0,
    cam: 1,
    reminders: 2,
    scrapbook: 3,
    health: 4,
  };

  const index = tabMap[targetTab] ?? -1;
  if (index === -1) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[998] flex max-w-2xl mx-auto pointer-events-none">
      <div className="w-full flex">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 flex items-center justify-center py-3.5">
            {i === index && (
              <div
                className="w-14 h-14 rounded-full animate-pulse-ring"
                style={{
                  border: "3px solid var(--pink)",
                  background: "rgba(255,143,163,0.15)",
                  boxShadow: "0 0 20px rgba(255,143,163,0.4)",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
