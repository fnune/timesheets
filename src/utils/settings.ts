import type { Settings } from "~/types";

const STORAGE_KEY = "timesheet-settings";

function detectCountryFromLocale(): { country: string; region: string } {
  const locale = navigator.language;
  const parts = locale.split("-");
  const country = parts[1]?.toUpperCase() || "US";
  return { country, region: "" };
}

function getPreviousMonth(): { month: number; year: number } {
  const now = new Date();
  const prevMonth = now.getMonth() - 1;
  if (prevMonth < 0) {
    return { month: 11, year: now.getFullYear() - 1 };
  }
  return { month: prevMonth, year: now.getFullYear() };
}

export function getDefaultSettings(): Settings {
  const { month, year } = getPreviousMonth();
  const { country, region } = detectCountryFromLocale();

  return {
    name: "",
    company: "",
    month,
    year,
    country,
    region,
    start: "09:00",
    breakStart: "12:00",
    breakEnd: "13:00",
    end: "18:00",
    workdayHours: 8,
    icsUrl: "",
    emailTo: "",
  };
}

export function loadSettingsFromStorage(): Partial<Settings> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return {};
}

export function saveSettingsToStorage(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function loadSettingsFromUrl(): Partial<Settings> {
  const params = new URLSearchParams(window.location.search);
  const settings: Partial<Settings> = {};

  const stringKeys: (keyof Settings)[] = [
    "name",
    "company",
    "country",
    "region",
    "start",
    "breakStart",
    "breakEnd",
    "end",
    "icsUrl",
    "emailTo",
  ];

  for (const key of stringKeys) {
    const value = params.get(key);
    if (value !== null) {
      (settings as Record<string, string>)[key] = value;
    }
  }

  const month = params.get("month");
  if (month !== null) settings.month = parseInt(month, 10);

  const year = params.get("year");
  if (year !== null) settings.year = parseInt(year, 10);

  const workdayHours = params.get("workdayHours");
  if (workdayHours !== null) settings.workdayHours = parseFloat(workdayHours);

  return settings;
}

const EPHEMERAL_KEYS: (keyof Settings)[] = ["month", "year"];

export function saveSettingsToUrl(settings: Settings): void {
  const defaults = getDefaultSettings();
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(settings)) {
    if (EPHEMERAL_KEYS.includes(key as keyof Settings)) {
      continue;
    }
    const defaultValue = defaults[key as keyof Settings];
    if (value !== defaultValue && value !== "" && value !== undefined) {
      params.set(key, String(value));
    }
  }

  const newUrl = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;

  window.history.replaceState(null, "", newUrl);
}

export function loadSettings(): Settings {
  const defaults = getDefaultSettings();
  const fromStorage = loadSettingsFromStorage();
  const fromUrl = loadSettingsFromUrl();

  return {
    ...defaults,
    ...fromStorage,
    ...fromUrl,
  };
}
