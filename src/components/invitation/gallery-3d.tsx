"use client";

import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/effect-coverflow";
import "swiper/css/effect-cube";
import "swiper/css/effect-flip";
import "swiper/css/pagination";

import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { A11y, Autoplay, EffectCards, EffectCoverflow, EffectCube, EffectFlip, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import type { Photo } from "@/lib/invitation";
import type { GalleryStyle } from "@/lib/sections";

import { pick, useLang } from "./use-lang";

type Props = { photos: Photo[]; style: GalleryStyle; autoplay: boolean };

/** Carrusel de fotos en 3D con el estilo que eligió la novia. */
export function Gallery3D({ photos, style, autoplay }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <div className="inv-gallery">
      {style === "ring" ? (
        <RingGallery photos={photos} autoplay={autoplay} onOpen={setLightbox} />
      ) : (
        <SwiperGallery photos={photos} style={style} autoplay={autoplay} onOpen={setLightbox} />
      )}
      {lightbox !== null && <Lightbox photos={photos} index={lightbox} onChange={setLightbox} />}
    </div>
  );
}

function SwiperGallery({
  photos,
  style,
  autoplay,
  onOpen,
}: Props & { style: Exclude<GalleryStyle, "ring">; onOpen: (index: number) => void }) {
  const lang = useLang();
  const square = style === "cube" || style === "flip";

  const effectProps = {
    coverflow: {
      effect: "coverflow" as const,
      slidesPerView: "auto" as const,
      centeredSlides: true,
      coverflowEffect: { rotate: 32, stretch: 0, depth: 140, modifier: 1, slideShadows: true },
    },
    cube: {
      effect: "cube" as const,
      cubeEffect: { shadow: true, slideShadows: true, shadowOffset: 24, shadowScale: 0.9 },
    },
    cards: { effect: "cards" as const, cardsEffect: { perSlideOffset: 9, perSlideRotate: 3, slideShadows: false } },
    flip: { effect: "flip" as const, flipEffect: { slideShadows: true } },
  }[style];

  return (
    <Swiper
      key={style}
      modules={[A11y, Autoplay, EffectCards, EffectCoverflow, EffectCube, EffectFlip, Pagination]}
      {...effectProps}
      grabCursor
      rewind
      pagination={{ clickable: true, dynamicBullets: photos.length > 6 }}
      autoplay={autoplay ? { delay: 3800, disableOnInteraction: false, pauseOnMouseEnter: true } : false}
      a11y={{
        prevSlideMessage: pick(lang, "Foto anterior", "Previous photo"),
        nextSlideMessage: pick(lang, "Foto siguiente", "Next photo"),
      }}
      className={style === "coverflow" ? "" : "!mx-auto w-[78%] max-w-[340px] !overflow-visible"}
    >
      {photos.map((photo, index) => (
        <SwiperSlide key={photo.id} className={style === "coverflow" ? "!w-[72%] max-w-[320px]" : ""}>
          <button
            type="button"
            onClick={() => onOpen(index)}
            className={`relative block w-full overflow-hidden rounded-2xl bg-[var(--inv-card)] ${square ? "aspect-square" : "aspect-[4/5]"}`}
            aria-label={pick(lang, `Ver foto ${index + 1} en grande`, `View photo ${index + 1}`)}
          >
            <Image
              src={photo.url}
              alt={photo.caption ? pick(lang, photo.caption.es, photo.caption.en) : ""}
              fill
              sizes="(max-width: 480px) 80vw, 340px"
              className="object-cover"
              loading={index < 2 ? "eager" : "lazy"}
            />
          </button>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

/** Anillo 3D: las fotos giran alrededor de un cilindro. Se arrastra con el dedo. */
function RingGallery({ photos, autoplay, onOpen }: Omit<Props, "style"> & { onOpen: (index: number) => void }) {
  const lang = useLang();
  const trackRef = useRef<HTMLDivElement>(null);
  const angle = useRef(0);
  const drag = useRef<{ x: number; start: number; moved: boolean } | null>(null);

  const count = photos.length;
  const itemWidth = count > 12 ? 118 : count > 6 ? 140 : 160;
  const itemHeight = Math.round(itemWidth * 1.3);
  const step = 360 / count;
  const radius = count < 3 ? itemWidth : Math.round(itemWidth / 2 / Math.tan(Math.PI / count)) + 24;

  const apply = useCallback(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateZ(${-radius}px) rotateY(${angle.current}deg)`;
    }
  }, [radius]);

  useEffect(() => {
    apply();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!autoplay || reduceMotion) return;
    let frame = 0;
    const tick = () => {
      if (!drag.current) {
        angle.current -= 0.12;
        apply();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [apply, autoplay]);

  return (
    <div
      className="inv-ring select-none"
      style={{ height: itemHeight + 120 }}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, start: angle.current, moved: false };
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const dx = e.clientX - drag.current.x;
        if (Math.abs(dx) > 4) drag.current.moved = true;
        angle.current = drag.current.start + dx * 0.4;
        apply();
      }}
      onPointerUp={() => {
        setTimeout(() => (drag.current = null), 0);
      }}
      onPointerLeave={() => (drag.current = null)}
    >
      <div ref={trackRef} className="inv-ring-track">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            className="inv-ring-item"
            style={{
              width: itemWidth,
              height: itemHeight,
              left: -itemWidth / 2,
              top: -itemHeight / 2,
              transform: `rotateY(${index * step}deg) translateZ(${radius}px)`,
            }}
            onClick={() => {
              if (!drag.current?.moved) onOpen(index);
            }}
            aria-label={pick(lang, `Ver foto ${index + 1} en grande`, `View photo ${index + 1}`)}
          >
            <Image
              src={photo.url}
              alt={photo.caption ? pick(lang, photo.caption.es, photo.caption.en) : ""}
              fill
              sizes={`${itemWidth * 2}px`}
              className="pointer-events-none object-cover"
              draggable={false}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/** Foto en grande con anterior/siguiente. */
function Lightbox({
  photos,
  index,
  onChange,
}: {
  photos: Photo[];
  index: number;
  onChange: (i: number | null) => void;
}) {
  const lang = useLang();
  const photo = photos[index];
  const go = useCallback(
    (delta: number) => onChange((index + delta + photos.length) % photos.length),
    [index, onChange, photos.length],
  );

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onChange(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [go, onChange]);

  const touchStart = useRef<number | null>(null);

  return (
    <div
      className="fixed inset-0 z-[80] grid grid-rows-[1fr_auto] bg-black/85 p-4"
      role="dialog"
      aria-modal="true"
      onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStart.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchStart.current = null;
      }}
    >
      <div className="relative">
        <Image
          src={photo.url}
          alt={photo.caption ? pick(lang, photo.caption.es, photo.caption.en) : ""}
          fill
          sizes="100vw"
          className="object-contain"
        />
      </div>
      <div className="flex items-center justify-between gap-4 pt-3 text-white">
        <button
          type="button"
          onClick={() => go(-1)}
          className="grid size-11 place-items-center rounded-full bg-white/10"
          aria-label={pick(lang, "Anterior", "Previous")}
        >
          <ChevronLeftIcon />
        </button>
        <p className="text-center text-sm text-white/80">
          {photo.caption ? pick(lang, photo.caption.es, photo.caption.en) : `${index + 1} / ${photos.length}`}
        </p>
        <button
          type="button"
          onClick={() => go(1)}
          className="grid size-11 place-items-center rounded-full bg-white/10"
          aria-label={pick(lang, "Siguiente", "Next")}
        >
          <ChevronRightIcon />
        </button>
      </div>
      <button
        type="button"
        onClick={() => onChange(null)}
        className="absolute top-4 right-4 grid size-11 place-items-center rounded-full bg-white/10 text-white"
        aria-label={pick(lang, "Cerrar", "Close")}
      >
        <XIcon />
      </button>
    </div>
  );
}
