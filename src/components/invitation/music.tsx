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
 * Reproductor de fondo. La canción no se descarga hasta que el invitado
 * abre el sobre o toca el botón (los navegadores, sobre todo en iPhone,
 * solo permiten sonido después de un toque).
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

  // Pausa cuando el invitado cambia de app o pestaña, y retoma al volver.
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
            className="fixed right-4 bottom-4 z-50 grid size-12 place-items-center rounded-full bg-[var(--inv-accent)] text-[var(--inv-on-strong)] shadow-lg transition hover:brightness-110"
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
