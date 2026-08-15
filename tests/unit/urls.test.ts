import { describe, expect, it } from "vitest";
import { itemAsset, itemRoot, publicUrl } from "../../src/app/urls";

describe("catalog asset URLs", () => {
  it("keeps catalog assets under the configured base path", () => {
    expect(publicUrl("specimens.json")).toBe("/specimens.json");
    expect(publicUrl("/items/cosmos/index.html")).toBe("/items/cosmos/index.html");
  });

  it("preserves remote resources", () => {
    expect(publicUrl("https://example.com/specimen.json")).toBe("https://example.com/specimen.json");
  });

  it("builds independent item and AI resource URLs", () => {
    expect(itemRoot("cosmos")).toBe("/items/cosmos/");
    expect(itemAsset({ id: "cosmos" }, "./AI.md")).toBe("http://localhost:3000/items/cosmos/AI.md");
    expect(itemAsset({ id: "cosmos", url: "items/cosmos/index.html" }, "items/cosmos/AI.md")).toBe("/items/cosmos/AI.md");
  });
});
