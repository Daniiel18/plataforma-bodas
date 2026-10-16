import { cn } from "@/lib/utils";

/** Size of a typical phone screen (iPhone 14/15), in CSS pixels. */
const PHONE = { width: 390, height: 844 };

/**
 * A page running inside a phone frame. The page is laid out at a real phone's
 * width and scaled down to fit, so it looks exactly as it does on a phone.
 */
export function PhoneFrame({
  src,
  title,
  width = 280,
  className,
}: {
  src: string;
  title: string;
  /** Width of the screen inside the frame, in pixels. */
  width?: number;
  className?: string;
}) {
  const scale = width / PHONE.width;
  return (
    <div
      className={cn(
        "relative mx-auto rounded-[2.75rem] bg-[#2b241f] p-2.5 shadow-[var(--site-gold)]/30 shadow-2xl ring-1 ring-black/10",
        className,
      )}
      style={{ width: width + 20 }}
    >
      <div aria-hidden className="absolute top-3.5 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-[#2b241f]" />
      <div
        className="relative overflow-hidden rounded-[2.2rem] bg-[var(--site-paper)]"
        style={{ width, height: Math.round(PHONE.height * scale) }}
      >
        <iframe
          src={src}
          title={title}
          loading="lazy"
          className="absolute top-0 left-0 origin-top-left border-0"
          style={{ width: PHONE.width, height: PHONE.height, transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}
