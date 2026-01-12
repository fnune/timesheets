import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getDefaultSettings,
  loadSettingsFromStorage,
  saveSettingsToStorage,
  loadSettingsFromUrl,
  saveSettingsToUrl,
  loadSettings,
} from "./settings";

describe("getDefaultSettings", () => {
  it("returns default work hours", () => {
    const settings = getDefaultSettings();
    expect(settings.start).toBe("09:00");
    expect(settings.breakStart).toBe("12:00");
    expect(settings.breakEnd).toBe("13:00");
    expect(settings.end).toBe("18:00");
    expect(settings.workdayHours).toBe(8);
  });

  it("returns empty strings for user-specific fields", () => {
    const settings = getDefaultSettings();
    expect(settings.name).toBe("");
    expect(settings.company).toBe("");
    expect(settings.icsUrl).toBe("");
    expect(settings.emailTo).toBe("");
  });

  it("returns previous month", () => {
    const settings = getDefaultSettings();
    const now = new Date();
    const expectedMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    expect(settings.month).toBe(expectedMonth);
  });
});

describe("loadSettingsFromStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty object when nothing stored", () => {
    const settings = loadSettingsFromStorage();
    expect(settings).toEqual({});
  });

  it("returns parsed settings from localStorage", () => {
    localStorage.setItem(
      "timesheet-settings",
      JSON.stringify({ name: "Test User", company: "Test Co" })
    );
    const settings = loadSettingsFromStorage();
    expect(settings.name).toBe("Test User");
    expect(settings.company).toBe("Test Co");
  });

  it("returns empty object on invalid JSON", () => {
    localStorage.setItem("timesheet-settings", "not valid json");
    const settings = loadSettingsFromStorage();
    expect(settings).toEqual({});
  });
});

describe("saveSettingsToStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves settings to localStorage", () => {
    const settings = getDefaultSettings();
    settings.name = "Test User";
    saveSettingsToStorage(settings);

    const stored = JSON.parse(localStorage.getItem("timesheet-settings") || "{}");
    expect(stored.name).toBe("Test User");
  });
});

describe("loadSettingsFromUrl", () => {
  beforeEach(() => {
    vi.stubGlobal("location", { search: "" });
  });

  it("returns empty object when no params", () => {
    vi.stubGlobal("location", { search: "" });
    const settings = loadSettingsFromUrl();
    expect(settings).toEqual({});
  });

  it("parses string parameters", () => {
    vi.stubGlobal("location", { search: "?name=John&company=Acme" });
    const settings = loadSettingsFromUrl();
    expect(settings.name).toBe("John");
    expect(settings.company).toBe("Acme");
  });

  it("parses numeric parameters", () => {
    vi.stubGlobal("location", { search: "?month=5&year=2025&workdayHours=7.5" });
    const settings = loadSettingsFromUrl();
    expect(settings.month).toBe(5);
    expect(settings.year).toBe(2025);
    expect(settings.workdayHours).toBe(7.5);
  });
});

describe("saveSettingsToUrl", () => {
  let replaceStateCalls: Array<{ url: string }>;

  beforeEach(() => {
    replaceStateCalls = [];
    vi.stubGlobal("location", { pathname: "/app" });
    vi.stubGlobal("history", {
      replaceState: (_: unknown, __: string, url: string) => {
        replaceStateCalls.push({ url });
      },
    });
  });

  it("does not include ephemeral keys (month, year)", () => {
    const settings = getDefaultSettings();
    settings.name = "Test";
    settings.month = 5;
    settings.year = 2030;
    saveSettingsToUrl(settings);

    const url = replaceStateCalls[0]?.url || "";
    expect(url).toContain("name=Test");
    expect(url).not.toContain("month=");
    expect(url).not.toContain("year=");
  });

  it("does not include default values", () => {
    const settings = getDefaultSettings();
    saveSettingsToUrl(settings);

    const url = replaceStateCalls[0]?.url || "";
    expect(url).toBe("/app");
  });

  it("does not include empty values", () => {
    const settings = getDefaultSettings();
    settings.name = "";
    saveSettingsToUrl(settings);

    const url = replaceStateCalls[0]?.url || "";
    expect(url).not.toContain("name=");
  });
});

describe("loadSettings", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("location", { search: "" });
  });

  it("merges defaults, storage, and URL with correct priority", () => {
    localStorage.setItem(
      "timesheet-settings",
      JSON.stringify({ name: "Storage Name", company: "Storage Co" })
    );
    vi.stubGlobal("location", { search: "?name=URL%20Name" });

    const settings = loadSettings();
    expect(settings.name).toBe("URL Name");
    expect(settings.company).toBe("Storage Co");
    expect(settings.start).toBe("09:00");
  });
});
