import { describe, expect, it } from "vitest";

import { safeNext } from "./auth-redirect";

describe("safeNext", () => {
  it("keeps the dashboard and the builder's publish step", () => {
    expect(safeNext("/panel/ajustes?recuperacion=1")).toBe("/panel/ajustes?recuperacion=1");
    expect(safeNext("/crear/publicar")).toBe("/crear/publicar");
  });

  it("falls back to the dashboard for anything else", () => {
    expect(safeNext(null)).toBe("/panel");
    expect(safeNext("https://evil.example")).toBe("/panel");
    expect(safeNext("//evil.example/panel")).toBe("/panel");
    expect(safeNext("/panelfalso")).toBe("/panel");
    expect(safeNext("/demo")).toBe("/panel");
  });
});
