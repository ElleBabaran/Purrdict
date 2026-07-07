/**
 * Emotion scoring — maps a classified behavior + motion intensity onto the
 * 5 primary feline emotions (fear, anger, joy, contentment, interest) from
 * the Nicholson & O'Carroll 2021 ethogram, adapted for IMU-only detection
 * (no camera-based facial/ear tracking, so posture/tail/ear/eye fields are
 * inferred from the motion signature rather than observed directly).
 *
 * This runs server-side in the sensor ingestion path so results are
 * deterministic and persisted to `emotion_assessments`, instead of being
 * recomputed ad hoc in the UI from whatever behavior happens to be on screen.
 */

export interface EmotionScores {
  fearScore: number;
  angerScore: number;
  joyScore: number;
  contentmentScore: number;
  interestScore: number;
  bodyPosture: string;
  tailPosition: string;
  earOrientation: string;
  eyeState: string;
  vocalization: string;
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

const BASE_SCORES: Record<string, Omit<EmotionScores, "">> = {
  resting: {
    fearScore: 0.03, angerScore: 0.02, joyScore: 0.05, contentmentScore: 0.88, interestScore: 0.1,
    bodyPosture: "Recumbent / loaf position", tailPosition: "Relaxed, loosely wrapped",
    earOrientation: "Neutral, slightly back", eyeState: "Slow blink / closed", vocalization: "Silent",
  },
  sleeping: {
    fearScore: 0.02, angerScore: 0.01, joyScore: 0.03, contentmentScore: 0.92, interestScore: 0.05,
    bodyPosture: "Curled / lateral recumbent", tailPosition: "Still, wrapped close to body",
    earOrientation: "Relaxed, resting", eyeState: "Closed", vocalization: "Silent",
  },
  grooming: {
    fearScore: 0.02, angerScore: 0.03, joyScore: 0.15, contentmentScore: 0.75, interestScore: 0.2,
    bodyPosture: "Seated, curled toward body", tailPosition: "Relaxed, resting",
    earOrientation: "Forward, relaxed", eyeState: "Half-closed", vocalization: "Silent / occasional purr",
  },
  eating: {
    fearScore: 0.03, angerScore: 0.02, joyScore: 0.35, contentmentScore: 0.7, interestScore: 0.3,
    bodyPosture: "Head down, crouched over bowl", tailPosition: "Relaxed, low",
    earOrientation: "Forward, relaxed", eyeState: "Focused downward", vocalization: "Silent / occasional purr",
  },
  drinking: {
    fearScore: 0.03, angerScore: 0.02, joyScore: 0.15, contentmentScore: 0.55, interestScore: 0.25,
    bodyPosture: "Head lowered, crouched", tailPosition: "Relaxed, low",
    earOrientation: "Forward", eyeState: "Focused downward", vocalization: "Silent",
  },
  playing: {
    fearScore: 0.05, angerScore: 0.08, joyScore: 0.82, contentmentScore: 0.25, interestScore: 0.55,
    bodyPosture: "Dynamic — crouch-to-leap transitions", tailPosition: "Twitching / upright",
    earOrientation: "Forward, alert", eyeState: "Dilated pupils", vocalization: "Occasional chirp / silent",
  },
  running: {
    fearScore: 0.12, angerScore: 0.05, joyScore: 0.78, contentmentScore: 0.1, interestScore: 0.35,
    bodyPosture: "Full extension gallop", tailPosition: "Extended for balance",
    earOrientation: "Forward, focused", eyeState: "Wide, dilated", vocalization: "Silent",
  },
  jumping: {
    fearScore: 0.1, angerScore: 0.03, joyScore: 0.7, contentmentScore: 0.15, interestScore: 0.5,
    bodyPosture: "Explosive extension, airborne", tailPosition: "Extended for balance",
    earOrientation: "Forward, focused", eyeState: "Wide, dilated", vocalization: "Silent",
  },
  walking: {
    fearScore: 0.04, angerScore: 0.03, joyScore: 0.2, contentmentScore: 0.35, interestScore: 0.65,
    bodyPosture: "Upright, forward-leaning gait", tailPosition: "Held upright, slight curve",
    earOrientation: "Forward, scanning", eyeState: "Normal, attentive", vocalization: "Silent / occasional meow",
  },
  sitting_alert: {
    fearScore: 0.08, angerScore: 0.03, joyScore: 0.1, contentmentScore: 0.3, interestScore: 0.7,
    bodyPosture: "Upright, watchful stillness", tailPosition: "Wrapped or still",
    earOrientation: "Rotating, tracking sounds", eyeState: "Wide, scanning", vocalization: "Silent",
  },
  scratching: {
    fearScore: 0.05, angerScore: 0.25, joyScore: 0.3, contentmentScore: 0.2, interestScore: 0.4,
    bodyPosture: "Braced, extended forelimbs", tailPosition: "Raised, slight flick",
    earOrientation: "Forward", eyeState: "Focused", vocalization: "Silent",
  },
};

const DEFAULT_SCORES: Omit<EmotionScores, ""> = {
  fearScore: 0.1, angerScore: 0.1, joyScore: 0.1, contentmentScore: 0.3, interestScore: 0.4,
  bodyPosture: "Neutral", tailPosition: "Neutral", earOrientation: "Neutral",
  eyeState: "Normal", vocalization: "Silent",
};

// Behaviors whose emotional intensity scales with how vigorous the motion was.
const INTENSITY_SCALED: Record<string, "joy" | "interest" | "fear"> = {
  playing: "joy",
  running: "joy",
  jumping: "joy",
  walking: "interest",
  sitting_alert: "interest",
  scratching: "fear",
};

/**
 * Derive emotion scores for a classified behavior + the motion intensity
 * (0-100) that produced it. Deterministic — same inputs always produce the
 * same scores, so results can be safely persisted and re-derived for tests.
 */
export function deriveEmotionScores(behavior: string, motionIntensity: number): EmotionScores {
  const base = BASE_SCORES[behavior] || DEFAULT_SCORES;
  const scores: EmotionScores = { ...base };

  // Modulate the dominant emotion slightly by how intense the motion was,
  // so e.g. a very high-energy "running" reading skews more toward joy/fear
  // than a borderline one.
  const scaleKey = INTENSITY_SCALED[behavior];
  if (scaleKey) {
    const intensityFactor = (clamp01(motionIntensity / 100) - 0.5) * 0.2;
    if (scaleKey === "joy") scores.joyScore = clamp01(scores.joyScore + intensityFactor);
    if (scaleKey === "interest") scores.interestScore = clamp01(scores.interestScore + intensityFactor);
    if (scaleKey === "fear") scores.fearScore = clamp01(scores.fearScore + intensityFactor);
  }

  return scores;
}
