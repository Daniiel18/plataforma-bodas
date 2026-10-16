"use client";

import { MusicIcon } from "lucide-react";
import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { pick, useLang } from "./use-lang";

type MusicApi = { play: () => void; available: boolean };

const MusicContext = createContext<MusicApi>({ play: () => {}, available: false });

export function useMusic() {
  return use(MusicContext);
}

/**
 * Background player. The song is not downloaded until the guest opens the
 * envelope or taps the button (browsers, especially on iPhone, only allow
 * sound after a tap).
 */
export function MusicProvider({ src, children }: { src: string | null; children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const resumeOnReturn = useRef(false);
  const lang = useLang();

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.7;
    audio.play().catch(() => setPlaying(false));
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) play();
    else audio.pause();
  };

  // Pauses when the guest switches apps or tabs, and resumes on return.
  useEffect(() => {
    const onVisibility = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.hidden) {
        resumeOnReturn.current = !audio.paused;
        audio.pause();
      } else if (resumeOnReturn.current) {
        resumeOnReturn.current = false;
        audio.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <MusicContext value={{ play, available: Boolean(src) }}>
      {children}
      {src && (
        <>
          <audio
            ref={audioRef}
            src={src}
            loop
            preload="none"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
          <button
            type="button"
            onClick={toggle}
            aria-pressed={playing}
            aria-label={pick(
              lang,
              playing ? "Pausar música" : "Reproducir música",
              playing ? "Pause music" : "Play music",
            )}
            className="inv-music-button fixed right-4 bottom-4 z-50 grid size-12 place-items-center rounded-full bg-[var(--inv-accent)] text-[var(--inv-on-strong)] shadow-lg transition hover:brightness-110"
          >
            {playing ? (
              <span className="inv-music-bars flex h-4 items-end gap-[3px]" data-playing="true" aria-hidden>
                <span />
                <span />
                <span />
              </span>
            ) : (
              <MusicIcon className="size-5" aria-hidden />
            )}
          </button>
        </>
      )}
    </MusicContext>
  );
}
