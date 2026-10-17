import { describe, expect, it } from "vitest";

import { lifecycleCutoffs, lifecycleDates, lifecycleNotice, type LifecycleWedding } from "./lifecycle";

const wedding = (patch: Partial<LifecycleWedding>): LifecycleWedding => ({
  status: "active",
  event_starts_at: "2026-12-19T20:00:00.000Z",
  created_at: "2026-10-01T00:00:00.000Z",
  published_at: "2026-10-02T00:00:00.000Z",
  ...patch,
});

describe("wedding lifecycle", () => {
  it("dates each step from the event or, for drafts, from creation", () => {
    const dates = lifecycleDates(wedding({}));
    expect(dates.readOnlyAt?.toISOString()).toBe("2027-01-18T20:00:00.000Z");
    expect(dates.archiveAt?.toISOString()).toBe("2027-12-19T20:00:00.000Z");
    expect(dates.draftDeleteAt).toBeNull();
    expect(lifecycleDates(wedding({ status: "draft", published_at: null })).draftDeleteAt?.toISOString()).toBe(
      "2026-10-31T00:00:00.000Z",
    );
  });

  it("gives the daily job its cutoffs", () => {
    const cut = lifecycleCutoffs(new Date("2027-12-20T00:00:00.000Z"));
    expect(new Date("2026-12-19T20:00:00.000Z") <= cut.archive).toBe(true);
    expect(cut.archiveNotice > cut.archive).toBe(true);
    expect(cut.draftNotice > cut.draftDelete).toBe(true);
  });

  it("warns the couple only when something is close", () => {
    expect(lifecycleNotice(wedding({}), new Date("2026-11-01"))).toBeNull();
    expect(lifecycleNotice(wedding({ status: "read_only" }), new Date("2027-02-01"))?.title).toMatch(/solo lectura/);
    expect(lifecycleNotice(wedding({ status: "read_only" }), new Date("2027-12-01"))?.title).toMatch(/archivará/);
    expect(lifecycleNotice(wedding({ status: "draft", published_at: null }), new Date("2026-10-10"))).toBeNull();
    expect(lifecycleNotice(wedding({ status: "draft", published_at: null }), new Date("2026-10-26"))?.title).toMatch(
      /borrador/,
    );
    expect(lifecycleNotice(wedding({ status: "archived" }))?.title).toMatch(/archivada/);
  });
});
