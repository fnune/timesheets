# Timesheet generator

Static web app for generating monthly timesheets.

## Features

- Auto-fills work hours for weekdays
- Fetches public holidays from [Nager.Date API](https://date.nager.at/)
- Supports company holidays via ICS calendar feeds
- One-click PTO marking
- Print to PDF
- Pre-filled email with mailto link
- Bookmarkable URLs (settings persist, month/year don't)

## Usage

1. Configure settings and bookmark the page
2. Each month, open bookmark and mark PTO days
3. Print PDF and email it

## Development

```bash
yarn install
yarn dev
```

## Deployment

Deploys to GitHub Pages on push to main.
