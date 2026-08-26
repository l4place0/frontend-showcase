import { describe, expect, it } from "vitest";
import { specimenCatalogIdentity } from "../../scripts/ci/artifact-lib.mjs";

describe("specimen artifact identity", () => {
  it("is stable when catalog item order changes", () => {
    const left = specimenCatalogIdentity({ specimenVersion: 1, items: [{ id: "beta" }, { id: "alpha" }] });
    const right = specimenCatalogIdentity({ specimenVersion: 1, items: [{ id: "alpha" }, { id: "beta" }] });

    expect(left).toEqual(right);
    expect(left.specimenCount).toBe(2);
    expect(left.specimenIdsDigest).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("rejects duplicate specimen ids", () => {
    expect(() =>
      specimenCatalogIdentity({ specimenVersion: 1, items: [{ id: "duplicate" }, { id: "duplicate" }] }),
    ).toThrow("duplicate item ids");
  });

  it("rejects catalogs outside Protocol v1", () => {
    expect(() => specimenCatalogIdentity({ specimenVersion: 2, items: [] })).toThrow("Protocol v1");
  });
});
