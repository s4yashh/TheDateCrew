import { describe, expect, it } from "vitest";
import { pairTriStateFit, triStateCompatible, triStateFit } from "@/matching/tri-state";

describe("tri-state compatibility", () => {
  it("scores identical answers as the strongest fit", () => {
    expect(triStateFit("Yes", "Yes")).toBe(100);
    expect(triStateFit("No", "No")).toBe(100);
    expect(pairTriStateFit("Maybe", "Maybe")).toBe(100);
  });

  it("treats Maybe as openness rather than a mismatch", () => {
    expect(triStateFit("Yes", "Maybe")).toBe(70);
    expect(triStateFit("No", "Maybe")).toBe(70);
    expect(triStateCompatible("Yes", "Maybe")).toBe(true);
    expect(triStateCompatible("No", "Maybe")).toBe(true);
  });

  it("only treats Yes against No as a hard conflict", () => {
    expect(triStateFit("Yes", "No")).toBe(15);
    expect(pairTriStateFit("Yes", "No")).toBe(25);
    expect(triStateCompatible("Yes", "No")).toBe(false);
    expect(triStateCompatible("No", "Yes")).toBe(false);
  });

  it("keeps missing answers unknown", () => {
    expect(triStateFit(null, "Yes")).toBeNull();
    expect(triStateFit("Yes", null)).toBeNull();
    expect(triStateCompatible(null, null)).toBeNull();
    expect(pairTriStateFit(null, "No")).toBeNull();
  });
});
