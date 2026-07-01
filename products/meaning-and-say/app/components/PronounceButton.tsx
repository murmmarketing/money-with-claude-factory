"use client";

import { useEffect, useState } from "react";

interface Props {
  text: string;
  lang?: string;
  label?: string;
}

/**
 * Tap-to-hear pronunciation using the browser Web Speech API.
 * No audio files, no backend, no API cost. Degrades to a disabled
 * button with a hint when the browser has no speech synthesis.
 */
export default function PronounceButton({ text, lang = "en-US", label }: Props) {
  const [supported, setSupported] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" && "speechSynthesis" in window
    );
  }, []);

  function speak() {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = 0.92;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    } catch {
      setSpeaking(false);
    }
  }

  if (!supported) {
    return (
      <span className="speak-hint">
        Your browser can&apos;t play audio pronunciations — use the phonetic
        spelling above.
      </span>
    );
  }

  return (
    <button
      type="button"
      className="speak-btn"
      onClick={speak}
      aria-label={`Hear how to say ${text}`}
      disabled={speaking}
    >
      <span aria-hidden="true">{speaking ? "🔊" : "🔈"}</span>
      {label ?? "Hear it"}
    </button>
  );
}
