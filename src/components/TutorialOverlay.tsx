"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import PixelCat from "./PixelCat";

interface TutorialStep {
  id: string;
  title: string;
  message: string;
  emoji: string;
  targetHref: string;
  targetTab: string;
  tryItMessage: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "live",
    title: "Live Detection",
    message:
      "This is your Live dashboard! See what your cat is doing in real-time — behavior detection powered by the ESP32 leash sensors. ⚡",
    emoji: "⚡",
    targetHref: "/dashboard",
    targetTab: "Live",
    tryItMessage: "Try scrolling through the live observations!",
  },
  {
    id: "cam",
    title: "Cat Cam",
    message:
      "Watch your kitty through the ESP32-CAM! You can view live streams, save clips, and even get motion-triggered recordings. 📸",
    emoji: "📷",
    targetHref: "/dashboard/cam",
    targetTab: "Cam",
    tryItMessage: "Check out the camera feed and clip gallery!",
  },
  {
    id: "map",
    title: "GPS Map",
    message:
      "Track where your cat roams! The GPS module on the leash maps their territory and favorite spots. 🗺️",
    emoji: "🗺️",
    targetHref: "/dashboard/map",
    targetTab: "Map",
    tryItMessage: "Explore the map and see tracked locations!",
  },
  {
    id: "reminders",
    title: "Tasks & Reminders",
    message:
      "Set reminders for feeding, vet visits, grooming, and play sessions. Never miss a thing! 🔔",
    emoji: "🔔",
    targetHref: "/dashboard/reminders",
    targetTab: "Tasks",
    tryItMessage: "Try creating a reminder or checking the schedule!",
  },
  {
    id: "scrapbook",
    title: "Photo Album",
    message:
      "Create albums to save your cat's cutest moments. Upload real photos and videos — they're saved forever! 📖",
    emoji: "📖",
    targetHref: "/dashboard/scrapbook",
    targetTab: "Album",
    tryItMessage: "Try creating an album and adding a photo!",
  },
];

type TutorialState = "showing" | "exploring" | "hidden";

export default function TutorialOverlay({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<TutorialState>("hidden");
  const pathname = usePathname();
  const router = useRouter();

  // Start tutorial
  useEffect(() => {
    const timer = setTimeout(() => setState("showing"), 500);
    return () => clearTimeout(timer);
  }, []);

  // Navigate to the correct page when showing a new step
  useEffect(() => {
    if (state === "showing") {
      const current = TUTORIAL_STEPS[step];
      if (pathname !== current.targetHref) {
        router.push(current.targetHref);
      }
    }
  }, [step, state, pathname, router]);

  function handleTryIt() {
    // Hide tutorial, let user explore
    setState("exploring");
  }

  function handleResume() {
    // Go to next step
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(step + 1);
      setState("showing");
    } else {
      handleFinish();
    }
  }

  function handleSkip() {
    handleFinish();
  }

  function handleFinish() {
    setState("hidden");
    setTimeout(() => {
      localStorage.setItem("purrdict_tutorial_done", "true");
      router.push("/dashboard");
      onComplete();
    }, 300);
  }

  const current = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;

  // Floating "Resume Tutorial" button when exploring
  if (state === "exploring") {
    return (
      <div className="fixed bottom-20 left-0 right-0 z-[999] flex justify-center px-4 pointer-events-none">
        <button
          onClick={handleResume}
          className="pointer-events-auto px-5 py-3 rounded-2xl font-pixel text-[9px] text-white transition-all animate-bounce pixel-press"
          style={{
            background: "linear-gradient(135deg, var(--pink-dk), var(--pink))",
            border: "2.5px solid var(--cocoa)",
            boxShadow: "4px 4px 0 var(--cocoa), 0 8px 24px rgba(255,143,163,0.4)",
          }}
        >
          {isLast ? "FINISH TUTORIAL 🎉" : "CONTINUE TUTORIAL →"}
        </button>
      </div>
    );
  }

  // Hidden state
  if (state === "hidden") return null;

  // Showing state — tutorial overlay visible
  return (
    <div className="fixed inset-0 z-[999] flex items-end justify-center transition-all duration-300">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(26,18,37,0.7)", backdropFilter: "blur(3px)" }}
      />

      {/* Tutorial Card */}
      <div className="relative z-[1001] w-full max-w-md mx-4 mb-28 animate-fade-up">
        {/* Cat mascot */}
        <div className="flex justify-center mb-3">
          <div className="relative">
            <div className="animate-bob">
              <PixelCat size={56} variant="orange" bounce={isLast} walking={step > 0 && !isLast} />
            </div>
            <div className="absolute -top-2 -right-2 text-lg animate-bounce">
              {step === 0 ? "✨" : "💬"}
            </div>
          </div>
        </div>

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
                STEP {step + 1}/{TUTORIAL_STEPS.length}
              </div>
              <div className="text-lg font-bold text-[var(--cocoa)]">{current.title}</div>
            </div>
          </div>

          {/* Message */}
          <p className="text-[14px] text-[var(--cocoa-lt)] leading-relaxed mb-4">
            {current.message}
          </p>

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

          {/* Try It hint */}
          <div
            className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl"
            style={{ background: "rgba(79,174,148,0.1)", border: "1.5px solid rgba(79,174,148,0.25)" }}
          >
            <span className="text-base">👆</span>
            <span className="text-[11px] text-[var(--mint-dk)]">{current.tryItMessage}</span>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 py-3 rounded-xl font-pixel text-[9px] text-[var(--cocoa-lt)] transition-all hover:bg-[var(--cream2)]"
              style={{ border: "2px solid var(--cream2)" }}
            >
              SKIP ALL
            </button>
            <button
              onClick={handleTryIt}
              className="flex-[2] py-3 rounded-xl font-pixel text-[9px] text-white pixel-press transition-all"
              style={{
                background: "linear-gradient(135deg, var(--mint-dk), var(--mint))",
                border: "2px solid var(--cocoa)",
                boxShadow: "3px 3px 0 var(--cocoa)",
              }}
            >
              TRY IT! 👆
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
