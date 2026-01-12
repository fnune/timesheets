import type { Settings, TimesheetRow, RowMode } from "~/types";
import { formatDateLong, formatDateShort, getMonthName } from "~/utils/date";
import { calculateHours, calculateBreakHours, calculateOvertime, formatTime12h } from "~/utils/time";

interface Props {
  rows: TimesheetRow[];
  settings: Settings;
  onRowChange: (index: number, updates: Partial<TimesheetRow>) => void;
}

const modeConfig: { mode: RowMode; label: string; short: string }[] = [
  { mode: "workday", label: "Work day", short: "Work" },
  { mode: "pto", label: "PTO", short: "PTO" },
  { mode: "public_holiday", label: "Public holiday", short: "Pub" },
  { mode: "company_holiday", label: "Company holiday", short: "Co" },
  { mode: "weekend", label: "Weekend", short: "WE" },
];

function isWorkMode(mode: RowMode): boolean {
  return mode === "workday";
}

function getTypeOutput(mode: RowMode): string {
  switch (mode) {
    case "public_holiday":
      return "public holiday";
    case "company_holiday":
      return "company holiday";
    case "pto":
      return "PTO";
    default:
      return "";
  }
}

export default function TimesheetTable({ rows, settings, onRowChange }: Props) {
  const totals = rows.reduce(
    (acc, row) => {
      const hours = isWorkMode(row.mode)
        ? calculateHours(row.start, row.breakStart, row.breakEnd, row.end)
        : 0;
      const breakHours = isWorkMode(row.mode)
        ? calculateBreakHours(row.breakStart, row.breakEnd)
        : 0;
      const overtime = isWorkMode(row.mode)
        ? calculateOvertime(hours, settings.workdayHours)
        : 0;

      return {
        hours: acc.hours + hours,
        breakHours: acc.breakHours + breakHours,
        overtime: acc.overtime + overtime,
      };
    },
    { hours: 0, breakHours: 0, overtime: 0 }
  );

  const handleModeChange = (index: number, mode: RowMode) => {
    const row = rows[index];
    if (isWorkMode(mode)) {
      onRowChange(index, {
        mode,
        start: row.start || settings.start,
        breakStart: row.breakStart || settings.breakStart,
        breakEnd: row.breakEnd || settings.breakEnd,
        end: row.end || settings.end,
      });
    } else {
      onRowChange(index, {
        mode,
        start: "",
        breakStart: "",
        breakEnd: "",
        end: "",
      });
    }
  };

  return (
    <div>
      <div className="mb-2 hidden print:block">
        <div className="text-sm">
          <span>{getMonthName(settings.month)} {settings.year}</span>
          {settings.name && <span> | {settings.name}</span>}
          {settings.company && <span>, {settings.company}</span>}
        </div>
      </div>

      <table className="w-full border-collapse text-sm tabular-nums">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1 text-left">Date</th>
            <th className="border px-1 py-1 text-left no-print">Mode</th>
            <th className="border px-2 py-1 text-left w-20">Start Time</th>
            <th className="border px-2 py-1 text-left w-20">Break Start</th>
            <th className="border px-2 py-1 text-left w-20">Break End</th>
            <th className="border px-2 py-1 text-left w-20">End Time</th>
            <th className="border px-2 py-1 text-left hidden print:table-cell">Time off Type</th>
            <th className="border px-2 py-1 text-right w-12">OT</th>
            <th className="border px-2 py-1 text-right w-16">Break</th>
            <th className="border px-2 py-1 text-right w-16">Hours</th>
            <th className="border px-2 py-1 text-left">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const hours = isWorkMode(row.mode)
              ? calculateHours(row.start, row.breakStart, row.breakEnd, row.end)
              : 0;
            const breakHours = isWorkMode(row.mode)
              ? calculateBreakHours(row.breakStart, row.breakEnd)
              : 0;
            const overtime = isWorkMode(row.mode)
              ? calculateOvertime(hours, settings.workdayHours)
              : 0;

            return (
              <tr key={index} className={row.mode === "weekend" ? "bg-gray-50" : ""}>
                <td className="border px-2 py-1">
                  <span className="hidden print:inline">{formatDateLong(row.date)}</span>
                  <span className="print:hidden">{formatDateShort(row.date)}</span>
                </td>
                <td className="border px-1 py-1 no-print">
                  <div className="flex gap-0.5">
                    {modeConfig.map(({ mode, label, short }) => (
                      <button
                        key={mode}
                        type="button"
                        title={label}
                        onClick={() => handleModeChange(index, mode)}
                        className={`px-1.5 py-0.5 text-xs font-medium rounded transition-colors ${
                          row.mode === mode
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {short}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="border px-2 py-1">
                  {isWorkMode(row.mode) ? (
                    <>
                      <input
                        type="time"
                        value={row.start}
                        onChange={(e) => onRowChange(index, { start: e.target.value })}
                        className="w-full border rounded px-1 py-0.5 text-sm print:hidden"
                      />
                      <span className="hidden print:inline">{formatTime12h(row.start)}</span>
                    </>
                  ) : null}
                </td>
                <td className="border px-2 py-1">
                  {isWorkMode(row.mode) ? (
                    <>
                      <input
                        type="time"
                        value={row.breakStart}
                        onChange={(e) => onRowChange(index, { breakStart: e.target.value })}
                        className="w-full border rounded px-1 py-0.5 text-sm print:hidden"
                      />
                      <span className="hidden print:inline">{formatTime12h(row.breakStart)}</span>
                    </>
                  ) : null}
                </td>
                <td className="border px-2 py-1">
                  {isWorkMode(row.mode) ? (
                    <>
                      <input
                        type="time"
                        value={row.breakEnd}
                        onChange={(e) => onRowChange(index, { breakEnd: e.target.value })}
                        className="w-full border rounded px-1 py-0.5 text-sm print:hidden"
                      />
                      <span className="hidden print:inline">{formatTime12h(row.breakEnd)}</span>
                    </>
                  ) : null}
                </td>
                <td className="border px-2 py-1">
                  {isWorkMode(row.mode) ? (
                    <>
                      <input
                        type="time"
                        value={row.end}
                        onChange={(e) => onRowChange(index, { end: e.target.value })}
                        className="w-full border rounded px-1 py-0.5 text-sm print:hidden"
                      />
                      <span className="hidden print:inline">{formatTime12h(row.end)}</span>
                    </>
                  ) : null}
                </td>
                <td className="border px-2 py-1 hidden print:table-cell">
                  {getTypeOutput(row.mode)}
                </td>
                <td className="border px-2 py-1 text-right">{overtime}</td>
                <td className="border px-2 py-1 text-right">{breakHours}</td>
                <td className="border px-2 py-1 text-right">{hours}</td>
                <td className="border px-2 py-1">
                  <input
                    type="text"
                    value={row.notes}
                    onChange={(e) => onRowChange(index, { notes: e.target.value })}
                    className="w-full border rounded px-1 py-0.5 text-sm print:hidden"
                    placeholder={row.mode === "public_holiday" || row.mode === "company_holiday" ? "Holiday name" : ""}
                  />
                  <span className="hidden print:inline">{row.notes}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-semibold">
            <td className="border px-2 py-1">Totals</td>
            <td className="border px-1 py-1 no-print"></td>
            <td className="border px-2 py-1" colSpan={4}></td>
            <td className="border px-2 py-1 hidden print:table-cell"></td>
            <td className="border px-2 py-1 text-right">{totals.overtime}</td>
            <td className="border px-2 py-1 text-right">{totals.breakHours}</td>
            <td className="border px-2 py-1 text-right">{totals.hours}</td>
            <td className="border px-2 py-1"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
