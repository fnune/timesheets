import type { Country, Holiday, PublicHoliday } from "~/types";

const NAGER_API = "https://date.nager.at/api/v3";

const NAME_OVERRIDES: Record<string, string> = {
  DE: "Germany",
  AT: "Austria",
  CH: "Switzerland",
  NL: "Netherlands",
  BE: "Belgium",
  JP: "Japan",
  KR: "South Korea",
  CN: "China",
  BR: "Brazil",
  MX: "Mexico",
  ES: "Spain",
  PT: "Portugal",
  IT: "Italy",
  FR: "France",
  PL: "Poland",
  CZ: "Czech Republic",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
};

export async function fetchCountries(): Promise<Country[]> {
  const response = await fetch(`${NAGER_API}/AvailableCountries`);
  if (!response.ok) {
    throw new Error("Failed to fetch countries");
  }
  const countries: Country[] = await response.json();
  return countries
    .map((c) => ({
      ...c,
      name: NAME_OVERRIDES[c.countryCode] || c.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchPublicHolidays(
  year: number,
  countryCode: string
): Promise<PublicHoliday[]> {
  const response = await fetch(
    `${NAGER_API}/PublicHolidays/${year}/${countryCode}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch holidays for ${countryCode}`);
  }
  return response.json();
}

export function getRegionsFromHolidays(holidays: PublicHoliday[]): string[] {
  const regions = new Set<string>();
  for (const holiday of holidays) {
    if (holiday.counties) {
      for (const county of holiday.counties) {
        regions.add(county);
      }
    }
  }
  return Array.from(regions).sort();
}

export function filterHolidaysByRegion(
  holidays: PublicHoliday[],
  region: string
): PublicHoliday[] {
  if (!region) {
    return holidays.filter((h) => h.global || !h.counties);
  }
  return holidays.filter(
    (h) => h.global || !h.counties || h.counties.includes(region)
  );
}

export function parseICS(icsContent: string): Holiday[] {
  const holidays: Holiday[] = [];
  const events = icsContent.split("BEGIN:VEVENT");

  for (const event of events.slice(1)) {
    const dateMatch =
      event.match(/DTSTART;VALUE=DATE:(\d{8})/) ||
      event.match(/DTSTART:(\d{8})/) ||
      event.match(/DTSTART;[^:]*:(\d{8})/);
    const summaryMatch = event.match(/SUMMARY:(.+)/);

    if (dateMatch && summaryMatch) {
      const dateStr = dateMatch[1];
      const year = dateStr.slice(0, 4);
      const month = dateStr.slice(4, 6);
      const day = dateStr.slice(6, 8);

      let name = summaryMatch[1].trim().replace(/\\,/g, ",");
      name = name.replace(/^Company Holiday\s*[-–—:]\s*/i, "");

      holidays.push({
        date: `${year}-${month}-${day}`,
        name,
        type: "company",
      });
    }
  }

  return holidays;
}

const CORS_PROXIES = [
  (url: string) => url,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

export async function fetchCompanyHolidays(icsUrl: string): Promise<Holiday[]> {
  let lastError: Error | null = null;

  for (const proxyFn of CORS_PROXIES) {
    const proxiedUrl = proxyFn(icsUrl);
    try {
      const response = await fetch(proxiedUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const content = await response.text();

      if (!content.includes("BEGIN:VCALENDAR")) {
        throw new Error("Invalid ICS format");
      }

      return parseICS(content);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastError || new Error("Failed to fetch company holidays");
}

export function validateHolidaysForYear(
  holidays: Holiday[],
  year: number
): { valid: boolean; message?: string } {
  const yearHolidays = holidays.filter((h) => h.date.startsWith(String(year)));

  if (yearHolidays.length === 0) {
    return {
      valid: false,
      message: `No company holidays found for ${year}`,
    };
  }

  return { valid: true };
}

export function mergeHolidays(
  publicHolidays: PublicHoliday[],
  companyHolidays: Holiday[]
): Map<string, Holiday> {
  const merged = new Map<string, Holiday>();

  for (const h of publicHolidays) {
    merged.set(h.date, {
      date: h.date,
      name: h.localName || h.name,
      type: "public",
    });
  }

  for (const h of companyHolidays) {
    const existing = merged.get(h.date);
    if (existing) {
      existing.name = `Company: ${h.name}; Public: ${existing.name}`;
    } else {
      merged.set(h.date, h);
    }
  }

  return merged;
}
