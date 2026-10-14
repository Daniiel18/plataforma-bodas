// Creates (or recreates) the public demo wedding at /demo: a fictional couple
// with photos, music, texts in Spanish + English, a sample Zelle QR and
// published status. Safe to re-run: it replaces the demo's own content only.
//
// Usage:
//   npm run demo:seed
//
// Media credits:
//   Photos — Unsplash (https://unsplash.com/license), see README.
//   Music  — "Canon in D Major" by Kevin MacLeod (incompetech.com), CC BY 4.0.

import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

const SLUG = "demo";
const BUCKET = "wedding-media";

const PHOTOS = {
  cover: "1606216794074-735e91aa2c92",
  gallery: [
    "1546032996-6dfacbacbf3f",
    "1606216836537-eea72a939072",
    "1567051181435-c9c9647c9cd4",
    "1606490194859-07c18c9f0968",
    "1537633552985-df8429e8048b",
    "1519741196428-6a2175fa2557",
    "1561287495-a3fe1fd28504",
    "1563808599481-34a342e44508",
  ],
};
const PHOTO_SIZE = { width: 1200, height: 1500 };
const photoUrl = (id) =>
  `https://images.unsplash.com/photo-${id}?w=${PHOTO_SIZE.width}&h=${PHOTO_SIZE.height}&fit=crop&crop=faces,center&q=80&fm=jpg`;
const MUSIC_URL = "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Canon%20in%20D%20Major.mp3";

/** Manual English translations: { path: [es, en] }. */
const SECTIONS = {
  intro: {
    content: { title: "", subtitle: "Para celebrar juntos nuestro amor", button: "" },
    en: { subtitle: ["Para celebrar juntos nuestro amor", "To celebrate our love together"] },
  },
  hero: { content: { kicker: "" }, en: {} },
  parents: {
    content: {
      title: "",
      intro: "Con la bendición de Dios y de nuestros padres, tenemos el honor de invitarles a nuestra boda",
      families: [
        { title: "Padres de la novia", names: ["Carlos Ramírez", "Elena Torres"] },
        { title: "Padres del novio", names: ["Javier Fernández", "Lucía Morales"] },
      ],
    },
    en: {
      intro: [
        "Con la bendición de Dios y de nuestros padres, tenemos el honor de invitarles a nuestra boda",
        "With the blessing of God and our parents, we are honored to invite you to our wedding",
      ],
      "families.0.title": ["Padres de la novia", "Parents of the bride"],
      "families.1.title": ["Padres del novio", "Parents of the groom"],
    },
  },
  celebration: {
    content: { title: "", message: "La ceremonia comenzará puntualmente a las" },
    en: { message: ["La ceremonia comenzará puntualmente a las", "The ceremony will begin promptly at"] },
  },
  gallery: {
    content: { title: "Nuestra historia", style: "coverflow", autoplay: true },
    en: { title: ["Nuestra historia", "Our story"] },
  },
  location: {
    content: {
      title: "",
      venue: "Vizcaya Museum & Gardens",
      address: "3251 S Miami Ave, Miami, FL 33129",
      note: "Estacionamiento gratuito para invitados",
    },
    en: { note: ["Estacionamiento gratuito para invitados", "Free parking for guests"] },
  },
  dress_code: {
    content: { title: "", description: "Formal de jardín · Tonos pastel y neutros.\nPor favor, evitar el blanco." },
    en: {
      description: [
        "Formal de jardín · Tonos pastel y neutros.\nPor favor, evitar el blanco.",
        "Garden formal · Pastel and neutral tones.\nPlease avoid wearing white.",
      ],
    },
  },
  program: {
    content: {
      title: "",
      items: [
        { time: "17:00", title: "Ceremonia" },
        { time: "18:00", title: "Cóctel de bienvenida" },
        { time: "19:30", title: "Cena y brindis" },
        { time: "21:00", title: "¡A bailar!" },
      ],
    },
    en: {
      "items.0.title": ["Ceremonia", "Ceremony"],
      "items.1.title": ["Cóctel de bienvenida", "Welcome cocktails"],
      "items.2.title": ["Cena y brindis", "Dinner and toasts"],
      "items.3.title": ["¡A bailar!", "Let's dance!"],
    },
  },
  rsvp: { content: { title: "", message: "", closed_message: "" }, en: {} },
  gifts: { content: { title: "", message: "" }, en: {} },
  music: { content: { autoplay_on_open: true }, en: {} },
};

const ORDER = [
  "intro",
  "hero",
  "parents",
  "celebration",
  "gallery",
  "location",
  "dress_code",
  "program",
  "rsvp",
  "gifts",
  "music",
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const must = (result, what) => {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data;
};

async function download(source) {
  const res = await fetch(source);
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${source}`);
  return Buffer.from(await res.arrayBuffer());
}

async function upload(path, body, contentType) {
  must(
    await db.storage.from(BUCKET).upload(path, body, { contentType, upsert: true, cacheControl: "31536000" }),
    `upload ${path}`,
  );
}

async function main() {
  // 1. Wedding (fictional couple, date in the future so the countdown runs).
  const wedding = must(
    await db
      .from("weddings")
      .upsert(
        {
          slug: SLUG,
          partner1_name: "Sofía Ramírez",
          partner2_name: "Mateo Fernández",
          event_starts_at: "2027-06-12T21:00:00Z", // 5:00 PM in Miami (EDT)
          timezone: "America/New_York",
          rsvp_deadline: "2027-05-16T03:59:00Z", // May 15, 11:59 PM in Miami
          max_companions: 4,
          template_key: "champagne-clasico",
          theme_overrides: {},
          is_published: true,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single(),
    "wedding",
  );
  const wid = wedding.id;
  console.log(`✓ wedding /${SLUG}`);

  // 2. Sections with Spanish content and manual English translations.
  const rows = ORDER.map((type, position) => ({
    wedding_id: wid,
    type,
    position,
    is_visible: true,
    content: SECTIONS[type].content,
    content_en: Object.fromEntries(
      Object.entries(SECTIONS[type].en).map(([path, [src, en]]) => [path, { src, en, manual: true }]),
    ),
  }));
  must(await db.from("sections").upsert(rows, { onConflict: "wedding_id,type" }), "sections");
  console.log(`✓ ${rows.length} sections`);

  // 3. Replace the demo's media.
  const old = must(await db.from("media").select("id, storage_path").eq("wedding_id", wid), "media list");
  if (old.length) {
    must(await db.from("gift_methods").update({ qr_media_id: null }).eq("wedding_id", wid), "detach qr");
    must(await db.from("media").delete().eq("wedding_id", wid), "media delete");
    await db.storage.from(BUCKET).remove(old.map((m) => m.storage_path));
  }

  const media = [];
  const coverPath = `${wid}/cover/demo-cover.jpg`;
  const cover = await download(photoUrl(PHOTOS.cover));
  await upload(coverPath, cover, "image/jpeg");
  media.push({
    kind: "cover",
    storage_path: coverPath,
    mime_type: "image/jpeg",
    size_bytes: cover.length,
    ...PHOTO_SIZE,
    position: 0,
  });

  for (const [i, id] of PHOTOS.gallery.entries()) {
    const path = `${wid}/gallery/demo-${String(i + 1).padStart(2, "0")}.jpg`;
    const body = await download(photoUrl(id));
    await upload(path, body, "image/jpeg");
    media.push({
      kind: "gallery",
      storage_path: path,
      mime_type: "image/jpeg",
      size_bytes: body.length,
      ...PHOTO_SIZE,
      position: i,
    });
  }
  console.log(`✓ ${PHOTOS.gallery.length + 1} photos`);

  const audioPath = `${wid}/audio/canon-in-d-major.mp3`;
  const audio = await download(MUSIC_URL);
  await upload(audioPath, audio, "audio/mpeg");
  media.push({
    kind: "audio",
    storage_path: audioPath,
    mime_type: "audio/mpeg",
    size_bytes: audio.length,
    position: 0,
  });
  console.log("✓ music");

  const qrPath = `${wid}/qr/demo-qr.png`;
  const qr = await QRCode.toBuffer("https://www.zelle.com/", {
    width: 600,
    margin: 2,
    color: { dark: "#3f352e", light: "#ffffff" },
  });
  await upload(qrPath, qr, "image/png");
  media.push({
    kind: "qr",
    storage_path: qrPath,
    mime_type: "image/png",
    size_bytes: qr.length,
    width: 600,
    height: 600,
    position: 0,
  });

  const inserted = must(
    await db
      .from("media")
      .insert(media.map((m) => ({ wedding_id: wid, ...m })))
      .select("id, kind"),
    "media insert",
  );
  const qrId = inserted.find((m) => m.kind === "qr").id;

  // 4. Gift box (sample Zelle data, not a real account).
  const gift = {
    wedding_id: wid,
    type: "zelle",
    holder_name: "Sofía & Mateo",
    handle: "demo@example.com",
    qr_media_id: qrId,
    note: "Gracias por acompañarnos 💛",
    note_en: "Thank you for celebrating with us 💛",
    is_visible: true,
  };
  const existing = must(await db.from("gift_methods").select("id").eq("wedding_id", wid).limit(1), "gift list");
  if (existing.length) must(await db.from("gift_methods").update(gift).eq("id", existing[0].id), "gift update");
  else must(await db.from("gift_methods").insert(gift), "gift insert");
  console.log("✓ gift box");

  console.log(`\nDemo ready at /${SLUG}. Add sample guests with: npm run demo:data -- ${SLUG}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
