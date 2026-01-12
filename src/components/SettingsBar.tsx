import type { Settings, Country } from "~/types";

interface Props {
  settings: Settings;
  countries: Country[];
  regions: string[];
  onSettingsChange: (updates: Partial<Settings>) => void;
  onDestructiveChange: (updates: Partial<Settings>) => void;
}

export default function SettingsBar({
  settings,
  countries,
  regions,
  onSettingsChange,
  onDestructiveChange,
}: Props) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex flex-wrap gap-2 items-end">
        <label className="flex flex-col">
          <span className="text-xs text-gray-500">Name</span>
          <input
            type="text"
            value={settings.name}
            onChange={(e) => onSettingsChange({ name: e.target.value })}
            placeholder="Employee name"
            className="border rounded px-1.5 py-0.5 w-36"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-gray-500">Company</span>
          <input
            type="text"
            value={settings.company}
            onChange={(e) => onSettingsChange({ company: e.target.value })}
            className="border rounded px-1.5 py-0.5 w-24"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-gray-500">Country</span>
          <select
            value={settings.country}
            onChange={(e) => onDestructiveChange({ country: e.target.value, region: "" })}
            className="border rounded px-1.5 py-0.5 w-36"
          >
            <option value="">Select</option>
            {countries.map((c) => (
              <option key={c.countryCode} value={c.countryCode}>{c.name}</option>
            ))}
          </select>
        </label>
        {regions.length > 0 && (
          <label className="flex flex-col">
            <span className="text-xs text-gray-500">Region</span>
            <select
              value={settings.region}
              onChange={(e) => onDestructiveChange({ region: e.target.value })}
              className="border rounded px-1.5 py-0.5 w-24"
            >
              <option value="">All</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col">
          <span className="text-xs text-gray-500">Start</span>
          <input
            type="time"
            value={settings.start}
            onChange={(e) => onSettingsChange({ start: e.target.value })}
            className="border rounded px-1.5 py-0.5"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-gray-500">Break</span>
          <div className="flex gap-1">
            <input
              type="time"
              value={settings.breakStart}
              onChange={(e) => onSettingsChange({ breakStart: e.target.value })}
              className="border rounded px-1.5 py-0.5"
            />
            <input
              type="time"
              value={settings.breakEnd}
              onChange={(e) => onSettingsChange({ breakEnd: e.target.value })}
              className="border rounded px-1.5 py-0.5"
            />
          </div>
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-gray-500">End</span>
          <input
            type="time"
            value={settings.end}
            onChange={(e) => onSettingsChange({ end: e.target.value })}
            className="border rounded px-1.5 py-0.5"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2 items-end">
        <label className="flex flex-col flex-1 min-w-48">
          <span className="text-xs text-gray-500">
            ICS calendar URL{" "}
            <abbr
              title="Calendar feed with company days off. Each VEVENT with a DTSTART date will be marked as a company holiday."
              className="text-gray-400 no-underline cursor-help"
            >
              (?)
            </abbr>
          </span>
          <input
            type="text"
            value={settings.icsUrl}
            onChange={(e) => onSettingsChange({ icsUrl: e.target.value })}
            placeholder="https://example.com/holidays.ics"
            className="border rounded px-1.5 py-0.5"
          />
        </label>
        <label className="flex flex-col flex-1 min-w-48">
          <span className="text-xs text-gray-500">Send to (comma-separated)</span>
          <input
            type="text"
            value={settings.emailTo}
            onChange={(e) => onSettingsChange({ emailTo: e.target.value })}
            placeholder="hr@example.com, manager@example.com"
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            className="border rounded px-1.5 py-0.5"
          />
        </label>
      </div>
    </div>
  );
}
