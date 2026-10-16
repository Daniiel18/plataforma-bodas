import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

/** Link preview of the platform pages (invitations use the couple's cover photo). */
export const alt = "Lazo de Oro · Invitaciones de boda digitales gratis";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const svg = await readFile(path.join(process.cwd(), "src/app/icon.svg"));
  const bow = `data:image/svg+xml;base64,${svg.toString("base64")}`;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        background: "linear-gradient(135deg, #FBF7F0 0%, #F2E6CF 100%)",
        color: "#3A2F27",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={bow} width={170} height={170} alt="" />
      <div style={{ fontSize: 96, letterSpacing: 2 }}>Lazo de Oro</div>
      <div style={{ fontSize: 38, color: "#776657" }}>La web de tu boda, gratis y lista en minutos</div>
    </div>,
    size,
  );
}
