import { describe, it, expect } from "vitest";
import {
  parseICS,
  getRegionsFromHolidays,
  filterHolidaysByRegion,
  validateHolidaysForYear,
  formatHolidayStatus,
  mergeHolidays,
} from "./holidays";
import type { PublicHoliday, Holiday } from "~/types";

describe("parseICS", () => {
  it("parses valid ICS content", () => {
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART;VALUE=DATE:20251225
SUMMARY:Christmas Day
END:VEVENT
BEGIN:VEVENT
DTSTART;VALUE=DATE:20251231
SUMMARY:New Year's Eve
END:VEVENT
END:VCALENDAR`;

    const holidays = parseICS(ics);
    expect(holidays).toHaveLength(2);
    expect(holidays[0]).toEqual({
      date: "2025-12-25",
      name: "Christmas Day",
      type: "company",
    });
    expect(holidays[1]).toEqual({
      date: "2025-12-31",
      name: "New Year's Eve",
      type: "company",
    });
  });

  it("handles empty ICS", () => {
    const holidays = parseICS("BEGIN:VCALENDAR\nEND:VCALENDAR");
    expect(holidays).toHaveLength(0);
  });
});

describe("getRegionsFromHolidays", () => {
  it("extracts unique regions from holidays", () => {
    const holidays: PublicHoliday[] = [
      {
        date: "2025-06-19",
        localName: "Fronleichnam",
        name: "Corpus Christi",
        countryCode: "DE",
        global: false,
        counties: ["DE-BW", "DE-BY"],
      },
      {
        date: "2025-10-31",
        localName: "Reformationstag",
        name: "Reformation Day",
        countryCode: "DE",
        global: false,
        counties: ["DE-BB", "DE-BY"],
      },
    ];

    const regions = getRegionsFromHolidays(holidays);
    expect(regions).toEqual(["DE-BB", "DE-BW", "DE-BY"]);
  });

  it("returns empty array when no regional holidays", () => {
    const holidays: PublicHoliday[] = [
      {
        date: "2025-01-01",
        localName: "Neujahr",
        name: "New Year",
        countryCode: "DE",
        global: true,
        counties: null,
      },
    ];

    const regions = getRegionsFromHolidays(holidays);
    expect(regions).toHaveLength(0);
  });
});

describe("filterHolidaysByRegion", () => {
  const holidays: PublicHoliday[] = [
    {
      date: "2025-01-01",
      localName: "Neujahr",
      name: "New Year",
      countryCode: "DE",
      global: true,
      counties: null,
    },
    {
      date: "2025-06-19",
      localName: "Fronleichnam",
      name: "Corpus Christi",
      countryCode: "DE",
      global: false,
      counties: ["DE-BW", "DE-BY"],
    },
  ];

  it("returns all global holidays when no region specified", () => {
    const filtered = filterHolidaysByRegion(holidays, "");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("New Year");
  });

  it("includes regional holidays when region matches", () => {
    const filtered = filterHolidaysByRegion(holidays, "DE-BY");
    expect(filtered).toHaveLength(2);
  });

  it("excludes regional holidays when region does not match", () => {
    const filtered = filterHolidaysByRegion(holidays, "DE-BE");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("New Year");
  });
});

describe("formatHolidayStatus", () => {
  it("shows month count when holidays exist for month", () => {
    const holidays: Holiday[] = [
      { date: "2026-02-15", name: "Holiday 1", type: "company" },
      { date: "2026-02-20", name: "Holiday 2", type: "company" },
    ];
    const result = formatHolidayStatus(holidays, 2026, 1, "February");
    expect(result).toBe("Found 2 company holidays for February 2026.");
  });

  it("shows year count when no holidays for month", () => {
    const holidays: Holiday[] = [
      { date: "2026-05-25", name: "Memorial Day", type: "company" },
      { date: "2026-12-25", name: "Christmas", type: "company" },
    ];
    const result = formatHolidayStatus(holidays, 2026, 1, "February");
    expect(result).toBe("Found 0 company holidays for February 2026 (2 for the year).");
  });

  it("handles zero holidays for both month and year", () => {
    const holidays: Holiday[] = [];
    const result = formatHolidayStatus(holidays, 2026, 1, "February");
    expect(result).toBe("Found 0 company holidays for February 2026 (0 for the year).");
  });
});

describe("validateHolidaysForYear", () => {
  it("returns valid with count when holidays exist for year", () => {
    const holidays: Holiday[] = [
      { date: "2025-12-25", name: "Christmas", type: "company" },
      { date: "2025-12-31", name: "New Year's Eve", type: "company" },
    ];
    const result = validateHolidaysForYear(holidays, 2025);
    expect(result.valid).toBe(true);
    expect(result.count).toBe(2);
  });

  it("returns invalid when no holidays for year", () => {
    const holidays: Holiday[] = [
      { date: "2024-12-25", name: "Christmas", type: "company" },
    ];
    const result = validateHolidaysForYear(holidays, 2025);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("2025");
  });

  it("includes available years in message when no holidays for year", () => {
    const holidays: Holiday[] = [
      { date: "2024-12-25", name: "Christmas", type: "company" },
      { date: "2026-01-01", name: "New Year", type: "company" },
    ];
    const result = validateHolidaysForYear(holidays, 2025);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("2024");
    expect(result.message).toContain("2026");
  });
});

describe("mergeHolidays", () => {
  it("merges public and company holidays", () => {
    const publicHolidays: PublicHoliday[] = [
      {
        date: "2025-12-25",
        localName: "Weihnachten",
        name: "Christmas",
        countryCode: "DE",
        global: true,
        counties: null,
      },
    ];
    const companyHolidays: Holiday[] = [
      { date: "2025-12-31", name: "Company Holiday", type: "company" },
    ];

    const merged = mergeHolidays(publicHolidays, companyHolidays);
    expect(merged.size).toBe(2);
    expect(merged.get("2025-12-25")?.name).toBe("Weihnachten");
    expect(merged.get("2025-12-31")?.type).toBe("company");
  });

  it("combines names when same date in both", () => {
    const publicHolidays: PublicHoliday[] = [
      {
        date: "2025-12-25",
        localName: "Weihnachten",
        name: "Christmas",
        countryCode: "DE",
        global: true,
        counties: null,
      },
    ];
    const companyHolidays: Holiday[] = [
      { date: "2025-12-25", name: "Winter Break", type: "company" },
    ];

    const merged = mergeHolidays(publicHolidays, companyHolidays);
    expect(merged.size).toBe(1);
    expect(merged.get("2025-12-25")?.name).toContain("Company: Winter Break");
    expect(merged.get("2025-12-25")?.name).toContain("Public: Weihnachten");
  });
});
