import { describe, it, expect } from "vitest";
import {
  parseTime,
  formatTime,
  formatTime12h,
  calculateHours,
  calculateBreakHours,
  calculateOvertime,
} from "./time";

describe("parseTime", () => {
  it("parses HH:MM format", () => {
    expect(parseTime("09:00")).toBe(540);
    expect(parseTime("12:30")).toBe(750);
    expect(parseTime("18:00")).toBe(1080);
    expect(parseTime("00:00")).toBe(0);
  });
});

describe("formatTime", () => {
  it("formats minutes to HH:MM", () => {
    expect(formatTime(540)).toBe("09:00");
    expect(formatTime(750)).toBe("12:30");
    expect(formatTime(0)).toBe("00:00");
  });
});

describe("formatTime12h", () => {
  it("formats 24h time to 12h with AM/PM", () => {
    expect(formatTime12h("09:00")).toBe("9:00 AM");
    expect(formatTime12h("12:00")).toBe("12:00 PM");
    expect(formatTime12h("13:00")).toBe("1:00 PM");
    expect(formatTime12h("18:00")).toBe("6:00 PM");
    expect(formatTime12h("00:00")).toBe("12:00 AM");
  });

  it("returns empty string for empty input", () => {
    expect(formatTime12h("")).toBe("");
  });
});

describe("calculateHours", () => {
  it("calculates work hours with break", () => {
    expect(calculateHours("09:00", "12:00", "13:00", "18:00")).toBe(8);
  });

  it("calculates work hours without break", () => {
    expect(calculateHours("09:00", "", "", "17:00")).toBe(8);
  });

  it("returns 0 for missing start or end", () => {
    expect(calculateHours("", "12:00", "13:00", "18:00")).toBe(0);
    expect(calculateHours("09:00", "12:00", "13:00", "")).toBe(0);
  });

  it("handles different break durations", () => {
    expect(calculateHours("09:00", "12:00", "12:30", "17:30")).toBe(8);
    expect(calculateHours("09:00", "12:00", "14:00", "19:00")).toBe(8);
  });
});

describe("calculateBreakHours", () => {
  it("calculates break duration", () => {
    expect(calculateBreakHours("12:00", "13:00")).toBe(1);
    expect(calculateBreakHours("12:00", "12:30")).toBe(0.5);
  });

  it("returns 0 for missing inputs", () => {
    expect(calculateBreakHours("", "13:00")).toBe(0);
    expect(calculateBreakHours("12:00", "")).toBe(0);
  });
});

describe("calculateOvertime", () => {
  it("calculates overtime when hours exceed expected", () => {
    expect(calculateOvertime(9, 8)).toBe(1);
    expect(calculateOvertime(10, 8)).toBe(2);
  });

  it("returns 0 when hours equal expected", () => {
    expect(calculateOvertime(8, 8)).toBe(0);
  });

  it("returns 0 when hours less than expected", () => {
    expect(calculateOvertime(6, 8)).toBe(0);
    expect(calculateOvertime(4, 8)).toBe(0);
  });
});
