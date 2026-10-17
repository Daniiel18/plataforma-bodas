import { describe, expect, it } from "vitest";

import { FRAME, fitZoom, galleryFrame, parseCrop, placePhoto, storableCrop } from "./photo-crop";

const LANDSCAPE = 1600 / 1067;

describe("placing a photo in its frame", () => {
  it("fills the frame by default, centered", () => {
    const p = placePhoto(LANDSCAPE, FRAME.cover, null);
    expect(p.fills).toBe(true);
    expect(p.height).toBeCloseTo(1);
    expect(p.width).toBeGreaterThan(1);
    expect(p.left).toBeCloseTo((1 - p.width) / 2);
    expect(p.top).toBeCloseTo(0);
  });

  it("shows the whole photo at the fit zoom, centered over the blurred copy", () => {
    const zoom = fitZoom(LANDSCAPE, FRAME.cover);
    const p = placePhoto(LANDSCAPE, FRAME.cover, { x: 0.1, y: 0.9, zoom });
    expect(p.fills).toBe(false);
    expect(p.width).toBeCloseTo(1);
    expect(p.height).toBeLessThan(1);
    expect(p.left).toBeCloseTo(0);
    expect(p.top).toBeCloseTo((1 - p.height) / 2);
    expect(p.crop).toMatchObject({ x: 0.5, y: 0.5 });
  });

  it("never zooms out past the whole photo, nor in past the maximum", () => {
    expect(placePhoto(LANDSCAPE, FRAME.cover, { x: 0.5, y: 0.5, zoom: 0.05 }).crop.zoom).toBeCloseTo(
      fitZoom(LANDSCAPE, FRAME.cover),
    );
    expect(placePhoto(LANDSCAPE, FRAME.cover, { x: 0.5, y: 0.5, zoom: 9 }).crop.zoom).toBe(3);
    // Backgrounds always fill the screen.
    expect(placePhoto(LANDSCAPE, FRAME.background, { x: 0.5, y: 0.5, zoom: 0.2 }, 1).fills).toBe(true);
  });

  it("keeps the chosen point at the center while the photo still covers the frame", () => {
    const p = placePhoto(LANDSCAPE, FRAME.cover, { x: 0.35, y: 0.5, zoom: 1.5 });
    expect(0.5 - p.left).toBeCloseTo(0.35 * p.width);
    expect(p.crop.x).toBeCloseTo(0.35);
  });

  it("stops at the edges instead of leaving a gap", () => {
    const p = placePhoto(LANDSCAPE, FRAME.cover, { x: 0, y: 0, zoom: 1 });
    expect(p.left).toBe(0);
    expect(p.top).toBe(0);
    expect(p.crop.x).toBeGreaterThan(0);
  });

  it("uses each carousel style's frame", () => {
    expect(galleryFrame("cube")).toBe(1);
    expect(galleryFrame("ring")).toBeCloseTo(1 / 1.3);
    expect(galleryFrame("coverflow")).toBe(0.8);
  });
});

describe("stored framing", () => {
  it("is null when centered and filling, rounded otherwise", () => {
    expect(storableCrop({ x: 0.5, y: 0.5, zoom: 1 })).toBeNull();
    expect(storableCrop({ x: 0.123456, y: 0.5, zoom: 0.66666 })).toEqual({ x: 0.123, y: 0.5, zoom: 0.667 });
  });

  it("ignores malformed values", () => {
    expect(parseCrop({ x: 2, y: 0, zoom: 1 })).toBeNull();
    expect(parseCrop("nope")).toBeNull();
    expect(parseCrop({ x: 0.2, y: 0.3, zoom: 1.2 })).toEqual({ x: 0.2, y: 0.3, zoom: 1.2 });
  });
});
