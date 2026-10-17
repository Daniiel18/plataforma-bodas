import Image from "next/image";

import type { MediaImage } from "@/lib/media";
import { photoAspect, placePhoto } from "@/lib/photo-crop";

const percent = (value: number) => `${(value * 100).toFixed(3)}%`;

type Props = {
  photo: MediaImage;
  /** Shape of the frame (width / height); the parent must be `relative overflow-hidden` with that shape. */
  frame: number;
  alt: string;
  /** Rendered width of the frame in CSS pixels, to pick the image size. */
  width: number;
  priority?: boolean;
  loading?: "eager" | "lazy";
  className?: string;
};

/**
 * A photo placed in its frame as the couple adjusted it. When it is zoomed out
 * to show more than the frame holds, a blurred copy fills the rest.
 */
export function FramedPhoto({ photo, frame, alt, width, priority, loading, className }: Props) {
  const place = placePhoto(photoAspect(photo), frame, photo.crop);
  return (
    <>
      {!place.fills && (
        <Image
          src={photo.url}
          alt=""
          aria-hidden
          fill
          sizes="96px"
          quality={40}
          className="pointer-events-none scale-125 object-cover blur-xl brightness-95"
          draggable={false}
        />
      )}
      <span
        className="pointer-events-none absolute block"
        style={{
          left: percent(place.left),
          top: percent(place.top),
          width: percent(place.width),
          height: percent(place.height),
        }}
      >
        <Image
          src={photo.url}
          alt={alt}
          fill
          priority={priority}
          loading={loading}
          sizes={`${Math.ceil(width * Math.max(1, place.width))}px`}
          className={className ?? "object-cover"}
          draggable={false}
        />
      </span>
    </>
  );
}
