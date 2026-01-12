export type RowMode = "workday" | "public_holiday" | "company_holiday" | "pto" | "weekend";

export interface TimesheetRow {
  date: Date;
  mode: RowMode;
  start: string;
  breakStart: string;
  breakEnd: string;
  end: string;
  notes: string;
}

export interface Settings {
  name: string;
  company: string;
  month: number;
  year: number;
  country: string;
  region: string;
  start: string;
  breakStart: string;
  breakEnd: string;
  end: string;
  workdayHours: number;
  icsUrl: string;
  emailTo: string;
}

export interface Holiday {
  date: string;
  name: string;
  type: "public" | "company";
}

export interface Country {
  countryCode: string;
  name: string;
}

export interface PublicHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  global: boolean;
  counties: string[] | null;
}
