import type { Bi } from "./sections";

/**
 * Songs every couple can pick when they do not have their own file (Apple
 * Music and Spotify songs are not files). Public domain recordings by United
 * States Air Force bands (works of the US government), from Wikimedia Commons;
 * served from /public, so they cost no Storage bandwidth.
 */
export const MUSIC_LIBRARY = [
  {
    key: "canon",
    title: { es: "Canon en Re", en: "Canon in D" },
    composer: "Pachelbel",
    performer: "Cuerdas · Banda de la Fuerza Aérea de EE. UU.",
    duration: "3:49",
    source:
      "https://commons.wikimedia.org/wiki/File:Canon_(2004)_-_Strolling_Strings_-_United_States_Air_Force_Band.mp3",
  },
  {
    key: "air",
    title: { es: "Aria «Air»", en: "Air on the G String" },
    composer: "J. S. Bach",
    performer: "Cuerdas · Banda de la Fuerza Aérea de EE. UU.",
    duration: "3:03",
    source: "https://commons.wikimedia.org/wiki/File:Air_-_Air_Force_Strings_-_United_States_Air_Force_Band.mp3",
  },
  {
    key: "claro-de-luna",
    title: { es: "Claro de luna", en: "Clair de Lune" },
    composer: "Debussy",
    performer: "Quinteto de metales · Banda de la Fuerza Aérea de EE. UU.",
    duration: "4:02",
    source:
      "https://commons.wikimedia.org/wiki/File:Clair_de_Lune_-_Wright_Brass_-_United_States_Air_Force_Band_of_Flight.mp3",
  },
  {
    key: "amazing-grace",
    title: { es: "Sublime gracia", en: "Amazing Grace" },
    composer: "Tradicional",
    performer: "Cuerdas · Banda de la Fuerza Aérea de EE. UU.",
    duration: "2:05",
    source:
      "https://commons.wikimedia.org/wiki/File:Amazing_Grace_(2004)_-_Strolling_Strings_-_United_States_Air_Force_Band.mp3",
  },
  {
    key: "ave-maria",
    title: { es: "Ave María", en: "Ave Maria" },
    composer: "Bach y Gounod",
    performer: "Banda de concierto · Fuerza Aérea de EE. UU.",
    duration: "8:25",
    source:
      "https://commons.wikimedia.org/wiki/File:Ave_Maria_in_Due_-_Concert_Band_-_United_States_Air_Force_Heritage_of_America_Band.mp3",
  },
] as const satisfies readonly {
  key: string;
  title: Bi;
  composer: string;
  performer: string;
  duration: string;
  source: string;
}[];

export type TrackKey = (typeof MUSIC_LIBRARY)[number]["key"];

export const TRACK_KEYS = MUSIC_LIBRARY.map((t) => t.key) as [TrackKey, ...TrackKey[]];

/** Same-origin URL of a library song. */
export const trackUrl = (key: TrackKey) => `/music/${key}.mp3`;

export const findTrack = (key: string | null | undefined) => MUSIC_LIBRARY.find((t) => t.key === key) ?? null;
