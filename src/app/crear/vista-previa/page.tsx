import type { Metadata } from "next";

import { DraftPreview } from "./draft-preview";

export const metadata: Metadata = {
  title: "Vista previa",
  robots: { index: false, follow: false },
};

/** The builder's invitation at full size, read from this device. */
export default function DraftPreviewPage() {
  return <DraftPreview />;
}
