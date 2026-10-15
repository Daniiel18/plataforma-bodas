import { HeartMark } from "./decorations";

type Props = { startsAt: string; timeZone: string };

function eventDay(startsAt: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date(startsAt));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

const WEEKDAYS = {
  es: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"],
  en: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
};

/** Calendar of the wedding month with the day marked (es and en versions). */
export function MonthCalendar({ startsAt, timeZone }: Props) {
  const { year, month, day } = eventDay(startsAt, timeZone);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0 = Sunday

  return (
    <>
      {(["es", "en"] as const).map((lang) => {
        const offset = lang === "es" ? (firstWeekday + 6) % 7 : firstWeekday;
        const title = new Intl.DateTimeFormat(lang, { month: "long", year: "numeric", timeZone: "UTC" }).format(
          new Date(Date.UTC(year, month - 1, 1)),
        );
        const cells: (number | null)[] = [
          ...Array.from({ length: offset }, () => null),
          ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
        ];
        return (
          <div key={lang} className={`l-${lang} inv-card-strong px-4 pt-5 pb-6`} lang={lang}>
            <p className="inv-script mb-3 text-center text-3xl capitalize">{title.replace(" de ", " ")}</p>
            <div className="mb-2 grid grid-cols-7 border-b border-[var(--inv-on-strong)]/25 pb-2 text-center text-[0.7rem] tracking-wider text-[var(--inv-on-strong)]/70">
              {WEEKDAYS[lang].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1.5 text-center text-sm">
              {cells.map((value, i) =>
                value === day ? (
                  <span
                    key={i}
                    className="relative grid place-items-center font-semibold text-[var(--inv-card-strong)]"
                  >
                    <HeartMark className="absolute size-8 text-[var(--inv-paper)]" />
                    <span className="relative">{value}</span>
                  </span>
                ) : (
                  <span key={i} className="grid h-7 place-items-center text-[var(--inv-on-strong)]/85">
                    {value ?? ""}
                  </span>
                ),
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
