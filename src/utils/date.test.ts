import { describe, it, expect } from "vitest";
import {
  getDaysInMonth,
  isWeekend,
  formatDateISO,
  getMonthName,
} from "./date";

describe("getDaysInMonth", () => {
  it("returns correct number of days for January", () => {
    const days = getDaysInMonth(2025, 0);
    expect(days).toHaveLength(31);
    expect(days[0].getDate()).toBe(1);
    expect(days[30].getDate()).toBe(31);
  });

  it("returns correct number of days for February (non-leap year)", () => {
    const days = getDaysInMonth(2025, 1);
    expect(days).toHaveLength(28);
  });

  it("returns correct number of days for February (leap year)", () => {
    const days = getDaysInMonth(2024, 1);
    expect(days).toHaveLength(29);
  });

  it("returns correct number of days for April", () => {
    const days = getDaysInMonth(2025, 3);
    expect(days).toHaveLength(30);
  });
});

describe("isWeekend", () => {
  it("returns true for Saturday", () => {
    expect(isWeekend(new Date(2025, 0, 4))).toBe(true);
  });

  it("returns true for Sunday", () => {
    expect(isWeekend(new Date(2025, 0, 5))).toBe(true);
  });

  it("returns false for Monday", () => {
    expect(isWeekend(new Date(2025, 0, 6))).toBe(false);
  });

  it("returns false for Friday", () => {
    expect(isWeekend(new Date(2025, 0, 3))).toBe(false);
  });
});

describe("formatDateISO", () => {
  it("formats date as YYYY-MM-DD", () => {
    expect(formatDateISO(new Date(2025, 0, 15))).toBe("2025-01-15");
    expect(formatDateISO(new Date(2025, 11, 25))).toBe("2025-12-25");
  });
});

describe("getMonthName", () => {
  it("returns correct month names", () => {
    expect(getMonthName(0)).toBe("January");
    expect(getMonthName(5)).toBe("June");
    expect(getMonthName(11)).toBe("December");
  });
});
