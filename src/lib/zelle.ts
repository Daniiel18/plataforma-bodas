/**
 * Zelle payment link: the same URL Zelle's own QR codes carry. On a phone it
 * opens Zelle's page, where the guest picks their bank and lands in their
 * banking app with the couple already set as the recipient.
 */
export function zelleLink(holderName: string, handle: string): string | null {
  const token = handle.includes("@") ? handle.trim().toLowerCase() : handle.replace(/[^\d+]/g, "");
  if (!token) return null;
  const payload = JSON.stringify({ name: holderName.trim(), token, action: "payment" });
  return `https://enroll.zellepay.com/qr-codes?data=${encodeURIComponent(Buffer.from(payload, "utf8").toString("base64"))}`;
}
