"use client";

import { CheckIcon, MusicIcon, PauseIcon, PlayIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { MUSIC_LIBRARY, trackUrl, type TrackKey } from "@/lib/music-library";
import { cn } from "@/lib/utils";

type Props = {
  /** The chosen library song, or null for the couple's own upload. */
  value: TrackKey | null;
  onChange: (track: TrackKey | null) => void;
  /** Whether the couple uploaded their own song (offered as the first option). */
  hasOwnSong: boolean;
  disabled?: boolean;
};

/** Pick a song of the library, listening to it first; shared by the builder and the dashboard. */
export function MusicLibraryPicker({ value, onChange, hasOwnSong, disabled }: Props) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<TrackKey | null>(null);

  // Nothing keeps playing after leaving the page.
  useEffect(() => () => audio.current?.pause(), []);

  const toggle = (key: TrackKey) => {
    if (playing === key) {
      audio.current?.pause();
      setPlaying(null);
      return;
    }
    audio.current?.pause();
    const player = new Audio(trackUrl(key));
    player.onended = () => setPlaying(null);
    audio.current = player;
    void player.play().catch(() => setPlaying(null));
    setPlaying(key);
  };

  const option = (selected: boolean) =>
    cn(
      "flex min-w-0 flex-1 items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors hover:bg-accent/40",
      selected && "border-primary bg-accent/30",
    );

  return (
    <div className="grid gap-2" role="radiogroup" aria-label="Canción de la invitación">
      {hasOwnSong && (
        <button
          type="button"
          role="radio"
          aria-checked={value === null}
          disabled={disabled}
          onClick={() => onChange(null)}
          className={option(value === null)}
        >
          <MusicIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 font-medium">Su propia canción</span>
          {value === null && <CheckIcon className="size-4 text-primary" />}
        </button>
      )}
      {MUSIC_LIBRARY.map((track) => (
        <div key={track.key} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggle(track.key)}
            className="grid size-10 shrink-0 place-items-center rounded-full border hover:bg-accent"
            aria-label={playing === track.key ? `Pausar ${track.title.es}` : `Escuchar ${track.title.es}`}
          >
            {playing === track.key ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={value === track.key}
            disabled={disabled}
            onClick={() => onChange(track.key)}
            className={option(value === track.key)}
          >
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="font-medium">
                {track.title.es} <span className="font-normal text-muted-foreground">· {track.composer}</span>
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {track.performer} · {track.duration}
              </span>
            </span>
            {value === track.key && <CheckIcon className="size-4 shrink-0 text-primary" />}
          </button>
        </div>
      ))}
    </div>
  );
}
