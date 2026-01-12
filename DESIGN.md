# Timesheet generator design

## Problem

Germany-based employees must submit monthly timesheets. The process is tedious but formulaic:
- Most days are identical (9-6, 1hr lunch, 8 total hours)
- Weekends are blank
- Company holidays and local holidays need to be marked
- Personal PTO needs to be added manually

## Solution

A static website that generates an editable timesheet table. Sensible defaults are pre-filled, users toggle which days they were offline, and print to PDF.

## URL parameters for defaults

Teams can share a pre-configured link. All params are optional:

| Param | Example | Description |
|-------|---------|-------------|
| `name` | `Fausto` | Employee name |
| `company` | `Pulumi` | Company name |
| `start` | `09:00` | Default work start time |
| `breakStart` | `12:00` | Default break start time |
| `breakEnd` | `13:00` | Default break end time |
| `end` | `18:00` | Default work end time |
| `workdayHours` | `8` | Expected hours per day (for overtime calc) |
| `country` | `DE` | ISO country code for public holidays |
| `region` | `DE-BY` | ISO 3166-2 region code (optional, for regional holidays) |
| `ics` | `https://...` | Company holiday calendar URL |

Example: `https://timesheets.example.com/?company=Pulumi&start=09:00&breakStart=12:00&breakEnd=13:00&end=18:00&country=DE&region=DE-BE`

### URL sync behavior

1. On page load:
   - Parse URL params
   - For missing params: check localStorage
   - For still missing: auto-detect (country/region from `navigator.language`, timezone from browser)
2. Any settings change updates URL via `history.replaceState` (no page reload)
3. URL is always shareable and represents current state

## Data sources

| Data | Source | Frequency |
|------|--------|-----------|
| Company holidays | BambooHR ICS feed | Updated yearly |
| Public holidays | Nager.Date API (free, no key, 100+ countries) | Fetched on demand |
| Personal PTO | User toggles in UI | Per-session |

### Company holidays ICS

Default URL: `https://pulumi.bamboohr.com/feeds/feed.php?id=7c7a72c3c702bce82fb21a94be787f2a`

The app validates the ICS and shows a warning if:
- The feed fails to load or parse
- No holidays exist for the selected year
- The response doesn't look like valid ICS data

### Public holidays API

Using [Nager.Date](https://date.nager.at/API):
- Free, no API key, CORS enabled
- 100+ countries with regional subdivision support
- Regional holidays include a `counties` array with ISO 3166-2 codes (e.g., `DE-BY` for Bavaria)

Endpoints:
- `GET /api/v3/AvailableCountries` - list of 195 countries
- `GET /api/v3/PublicHolidays/{year}/{countryCode}` - holidays with regional info

Example response for regional holidays:
```json
{
  "date": "2025-06-19",
  "name": "Corpus Christi",
  "countryCode": "DE",
  "global": false,
  "counties": ["DE-BW", "DE-BY", "DE-HE", "DE-NW", "DE-RP", "DE-SL"]
}
```

To get available regions: fetch holidays, extract unique county codes from responses.

## Timezone handling

- Use `Intl.DateTimeFormat().resolvedOptions().timeZone` to detect browser timezone
- Display timezone in settings bar (e.g., "Europe/Berlin")
- All times interpreted in this timezone
- Timezone shown on print output for clarity

## URL as source of truth

- On load: read URL params, fall back to localStorage, then browser defaults
- Auto-detect country/region from `navigator.language` if not in URL
- Any settings change updates URL (via `history.replaceState`)
- Users can copy/share URL at any time to share their configuration

## UI layout

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  Settings bar (hidden on print)                                                                    │
│  [Name] [Company] [Month ▼] [Country ▼] [Region ▼]                                                │
│  Default times: [Start] [Break start] [Break end] [End]     Timezone: Europe/Berlin               │
├────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  Editable timesheet table                                                                          │
│                                                                                                    │
│  Date              │ Mode ▼    │ Start │ Brk start│ Brk end│ End   │ OT  │ Break│ Hours│ Notes    │
│  ──────────────────────────────────────────────────────────────────────────────────────────────────│
│  Mon, Dec 1, 2025  │ Work day  │ 09:00 │ 12:00    │ 13:00  │ 18:00 │ 0   │ 1    │ 8    │          │
│  Tue, Dec 2, 2025  │ Work day  │ 09:00 │ 12:00    │ 13:00  │ 19:00 │ 1   │ 1    │ 9    │          │
│  ...               │           │       │          │        │       │     │      │      │          │
│  Sat, Dec 6, 2025  │ Weekend   │   -   │    -     │   -    │   -   │ 0   │ 0    │ 0    │          │
│  Sun, Dec 7, 2025  │ Weekend   │   -   │    -     │   -    │   -   │ 0   │ 0    │ 0    │          │
│  ...               │           │       │          │        │       │     │      │      │          │
│  Wed, Dec 24, 2025 │ Pub. hol. │   -   │    -     │   -    │   -   │ 0   │ 0    │ 0    │ Xmas Eve │
│  Thu, Dec 25, 2025 │ PTO       │   -   │    -     │   -    │   -   │ 0   │ 0    │ 0    │          │
│  Fri, Dec 26, 2025 │ On-call   │ 09:00 │ 12:00    │ 13:00  │ 18:00 │ 0   │ 1    │ 8    │          │
│  ──────────────────────────────────────────────────────────────────────────────────────────────────│
│                                                         Totals │ 1   │ 15   │ 120  │          │
├────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  [Print PDF]                                                                                       │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

All inputs use standard HTML form elements (`<select>`, `<input type="time">`, `<input type="text">`) for accessibility.

## Row modes

Each row has a mode that determines its behavior and default values:

| Mode | Times | Hours | Auto-assigned when |
|------|-------|-------|-------------------|
| Work day | Editable (default: 9-18, 1hr break) | Calculated from times | Weekday with no holiday |
| On-call | Editable (same defaults as work day) | Calculated from times | Never (user selects) |
| Public holiday | Hidden | 0 | Date matches public/company holiday |
| PTO | Hidden | 0 | Never (user selects) |
| Weekend | Hidden | 0 | Saturday or Sunday |

All modes have an editable Notes column.

### Mode behavior

- User can change any row's mode via dropdown
- Changing to Work day or On-call shows time inputs with defaults
- Changing to Public holiday, PTO, or Weekend hides time inputs and zeros hours
- Public holidays are pre-labeled with the holiday name in Notes (e.g., "Christmas Day")
- If API data is wrong, user can override any day's mode

### Partial days

Users can simply edit times to work fewer hours. No special UI needed - just change end time or break duration.

### Holiday precedence and notes

When a date has both company holiday (from ICS) and public holiday (from API):
- Mode defaults to "Public holiday"
- Notes auto-populated with both: "Company: Winter Break; Public: Christmas Day"

Company holidays take display precedence in the Type column.

### Output mapping

| Mode | Time off Type column | Notes column |
|------|---------------------|--------------|
| Work day | (empty) | User notes |
| On-call | on-call | User notes |
| Public holiday | public holiday | Holiday name(s) + user notes |
| PTO | PTO | User notes |
| Weekend | (empty, row still shown) | User notes |

### Overtime calculation

Overtime hours = actual hours worked - expected workday hours

- Default expected workday: 8 hours (configurable via `workdayHours` URL param)
- Only calculated for Work day and On-call modes
- Negative values shown as 0 (no "undertime")
- Example: worked 9:00-19:00 with 1h break = 9 hours worked, 1 hour overtime

## Auto-detection

When the page loads:
1. Generate all days for selected month
2. Mark weekends as offline (type: "weekend", not shown in output)
3. Fetch/parse holiday data, mark those days as offline (type: "public holiday" or "company holiday")
4. Fill remaining weekdays with default times
5. User toggles their PTO days

## Print output

On print, the table reformats to match the required format exactly:
- Settings bar hidden
- Checkboxes hidden
- Full date format ("Monday, December 1, 2025")
- Times in 12-hour format with AM/PM
- All columns from original template

## Technical approach

### Stack
- Single HTML file with embedded CSS/JS (zero dependencies, fully portable)
- Or: minimal build with Vite if we want TypeScript/better DX

### Holiday data
- German public holidays: bundle a small JSON file, or fetch from Nager.Date API at runtime
- Company holidays: parse ICS client-side with a small parser (no library needed for basic VEVENT parsing)

### PDF generation
- CSS `@media print` to reformat the table
- Browser's native print dialog → "Save as PDF"

## Resolved decisions

1. Holiday labeling: Company holidays take precedence in Type column, both aggregated into Notes
2. Break times: Explicit break start/end inputs (matching PDF format), break duration calculated
3. Region selection: Auto-detect from browser locale, URL is source of truth, changes sync to URL

## Resolved decisions (continued)

4. Partial days: no special UI, users just edit times to reduce hours
5. Print layout: landscape (must fit without wrapping)
6. Overtime: calculated as (actual hours - workdayHours), where workdayHours defaults to 8
7. Mobile: use standard HTML inputs for accessibility, no special mobile optimization

## Open questions

None at this time. Ready to implement.

## Implementation phases

### Phase 1: MVP
- Single HTML file with embedded CSS/JS
- Month selector, name/company inputs
- Editable table with mode dropdown per row
- Standard HTML inputs (`<select>`, `<input type="time">`, `<input type="text">`)
- Weekend auto-detection
- Hours/overtime/break auto-calculation
- Totals row
- Print styling (landscape, matches PDF format)
- URL params for all settings
- URL sync via `history.replaceState`
- localStorage fallback

### Phase 2: Holidays
- Company ICS fetch from BambooHR URL
- ICS parsing (extract VEVENT dates and summaries)
- ICS validation with warnings (no holidays for year, parse errors, fetch failures)
- Public holidays via Nager.Date API
- Country dropdown (populated from API)
- Region dropdown (populated from holiday data's county codes)
- Auto-detect country/region from `navigator.language`
- Holiday names in Notes column

### Phase 3: Polish
- Timezone display
- Better error messages
- Keyboard navigation
- Print preview refinements
