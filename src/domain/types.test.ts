import { describe, expect, it } from "vitest";
import { formatIncome, getAge } from "@/domain/types";

describe("domain formatting helpers", () => {
  it("formats numeric annual income as lakhs per annum", () => {
    expect(formatIncome(1_200_000)).toBe("₹12 LPA");
    expect(formatIncome(1_850_000)).toBe("₹18.5 LPA");
    expect(formatIncome(600_000)).toBe("₹6 LPA");
  });

  it("keeps missing income missing", () => {
    expect(formatIncome(null)).toBeNull();
  });

  it("computes age at a boundary without an off-by-one", () => {
    const now = new Date("2026-10-13T12:00:00.000Z");
    expect(getAge("1990-10-13", now)).toBe(36);
    expect(getAge("1990-10-14", now)).toBe(35);
  });
});
