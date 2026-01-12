import { useEffect, useState, useCallback, useRef } from "react";
import type { Settings, TimesheetRow, Holiday, Country, PublicHoliday } from "~/types";
import {
  loadSettings,
  saveSettingsToStorage,
  saveSettingsToUrl,
} from "~/utils/settings";
import { getDaysInMonth, isWeekend, formatDateISO, getMonthName } from "~/utils/date";
import {
  fetchCountries,
  fetchPublicHolidays,
  fetchCompanyHolidays,
  getRegionsFromHolidays,
  filterHolidaysByRegion,
  mergeHolidays,
  validateHolidaysForYear,
} from "~/utils/holidays";
import SettingsBar from "~/components/SettingsBar";
import TimesheetTable from "~/components/TimesheetTable";
import QuickLinks from "~/components/QuickLinks";

function initializeRows(
  year: number,
  month: number,
  settings: Settings,
  holidays: Map<string, Holiday>
): TimesheetRow[] {
  const days = getDaysInMonth(year, month);

  return days.map((date) => {
    const dateStr = formatDateISO(date);
    const holiday = holidays.get(dateStr);

    let mode: TimesheetRow["mode"] = "workday";
    let notes = "";

    if (isWeekend(date)) {
      mode = "weekend";
    } else if (holiday) {
      mode = holiday.type === "public" ? "public_holiday" : "company_holiday";
      notes = holiday.name;
    }

    const isWorkMode = mode === "workday";

    return {
      date,
      mode,
      start: isWorkMode ? settings.start : "",
      breakStart: isWorkMode ? settings.breakStart : "",
      breakEnd: isWorkMode ? settings.breakEnd : "",
      end: isWorkMode ? settings.end : "",
      notes,
    };
  });
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [holidays, setHolidays] = useState<Map<string, Holiday>>(new Map());
  const [icsWarning, setIcsWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const hasUnsavedChanges = useRef(false);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      saveSettingsToStorage(next);
      saveSettingsToUrl(next);
      return next;
    });
  }, []);

  const destructiveKeys: (keyof Settings)[] = ["month", "year", "country", "region"];

  const updateSettingsWithConfirm = useCallback((updates: Partial<Settings>) => {
    const isDestructive = destructiveKeys.some((key) => key in updates);
    if (isDestructive && hasUnsavedChanges.current) {
      if (!window.confirm("You have unsaved changes. Discard them?")) {
        return;
      }
    }
    updateSettings(updates);
  }, [updateSettings]);

  const updateRow = useCallback((index: number, updates: Partial<TimesheetRow>) => {
    hasUnsavedChanges.current = true;
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  }, []);

  useEffect(() => {
    fetchCountries()
      .then(setCountries)
      .catch(console.error);
  }, []);

  useEffect(() => {
    const loadHolidays = async () => {
      setLoading(true);
      setIcsWarning(null);

      const publicHolidays: PublicHoliday[] = [];
      let companyHolidays: Holiday[] = [];

      try {
        const ph = await fetchPublicHolidays(settings.year, settings.country);
        publicHolidays.push(...ph);

        const availableRegions = getRegionsFromHolidays(ph);
        setRegions(availableRegions);
      } catch (e) {
        console.error("Failed to fetch public holidays:", e);
      }

      if (settings.icsUrl) {
        try {
          companyHolidays = await fetchCompanyHolidays(settings.icsUrl);
          const validation = validateHolidaysForYear(companyHolidays, settings.year);
          if (!validation.valid) {
            setIcsWarning(validation.message || "Invalid ICS data");
          }
        } catch (e) {
          setIcsWarning(
            e instanceof Error ? e.message : "Failed to load company holidays (CORS blocked? Try pasting ICS content directly)"
          );
        }
      }

      const filtered = filterHolidaysByRegion(publicHolidays, settings.region);
      const merged = mergeHolidays(filtered, companyHolidays);
      setHolidays(merged);
      setLoading(false);
    };

    loadHolidays();
  }, [settings.year, settings.country, settings.region, settings.icsUrl]);

  useEffect(() => {
    if (!loading) {
      setRows(initializeRows(settings.year, settings.month, settings, holidays));
      hasUnsavedChanges.current = false;
    }
  }, [settings.year, settings.month, settings, holidays, loading]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    const monthYear = `${getMonthName(settings.month)} ${settings.year}`;
    let title = `Timesheet: ${monthYear}`;
    if (settings.name || settings.company) {
      const who = [settings.name, settings.company].filter(Boolean).join(", ");
      title += ` | ${who}`;
    }
    document.title = title;
  }, [settings.name, settings.company, settings.month, settings.year]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="no-print sticky top-0 z-10 bg-white border-b shadow-sm px-4 py-2">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="font-semibold text-gray-800">Timesheet</h1>
          <select
            value={settings.month}
            onChange={(e) => updateSettingsWithConfirm({ month: parseInt(e.target.value) })}
            className="border rounded px-2 py-1 text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {getMonthName(i)}
              </option>
            ))}
          </select>
          <select
            value={settings.year}
            onChange={(e) => updateSettingsWithConfirm({ year: parseInt(e.target.value) })}
            className="border rounded px-2 py-1 text-sm"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const y = new Date().getFullYear() - 2 + i;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
          <div className="flex-1" />
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Print PDF
          </button>
          {settings.emailTo && (
            <a
              href={buildMailtoLink(settings)}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              Open email
            </a>
          )}
        </div>
      </header>

      <div className="no-print px-4 py-2">
        <div className="bg-white border rounded p-3 space-y-4">
          <QuickLinks />
          <SettingsBar
            settings={settings}
            countries={countries}
            regions={regions}
            onSettingsChange={updateSettings}
            onDestructiveChange={updateSettingsWithConfirm}
          />
          {icsWarning && (
            <div className="p-2 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded text-sm">
              Warning: {icsWarning}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <TimesheetTable
            rows={rows}
            settings={settings}
            onRowChange={updateRow}
          />
        )}
      </div>
    </div>
  );
}

function buildMailtoLink(settings: Settings): string {
  const monthName = getMonthName(settings.month);
  const subject = `Timesheet - ${monthName} ${settings.year}${settings.name ? ` - ${settings.name}` : ""}`;
  const body = `Hi,

Please find my timesheet for ${monthName} ${settings.year} attached.

Thanks`;

  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  return `mailto:${settings.emailTo}?subject=${encodedSubject}&body=${encodedBody}`;
}
