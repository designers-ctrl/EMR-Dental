/**
 * Dataset for the Patients screen — the list a record is opened from.
 *
 * The view in `src/screens/Patients.tsx` is a pure projection of this file:
 * every label, name, date and appointment on screen is read from here, so a
 * real backend can drop in by producing the same shape.
 *
 * Everything below is SYNTHETIC placeholder data. No real patient, provider or
 * appointment. The procedure names are labels carried over from the design
 * reference; which patient has which is invented, and none of it is a
 * treatment record a clinician has signed.
 */

import { patientChart, type AppRail, type IconName } from './patientChart.ts'

// ─── SHARED ───────────────────────────────────────────────────────────────

/**
 * Which palette channel a status borrows. A tone is never the only signal: the
 * status is always written out beside it.
 */
export type StatusTone = 'success' | 'info' | 'warning'

// ─── PATIENT LIST ─────────────────────────────────────────────────────────

export type PatientStatusId = 'active' | 'prospect'

export interface PatientStatus {
  id: PatientStatusId
  label: string
  tone: StatusTone
}

export interface PatientRow {
  /** Record identifier — the key a row and a chart are matched on. */
  id: string
  firstName: string
  lastName: string
  /** ISO `YYYY-MM-DD`, so it sorts as a date. Shown through `dateOfBirthFormat`. */
  dateOfBirth: string
  status: PatientStatusId
  procedure: string
  /** `null` when nobody is assigned — shown as `unassignedProvider`, not a blank. */
  provider: string | null
}

/** The columns a row can be narrowed by from its header. */
export type PatientFilterId = 'status' | 'procedure' | 'provider'

export type PatientColumnId =
  | 'id'
  | 'firstName'
  | 'lastName'
  | 'dateOfBirth'
  | 'status'
  | 'procedure'
  | 'provider'

export interface PatientListAction {
  id: string
  label: string
  /** Leading glyph, when the action has one. */
  icon?: IconName
  /** The one filled action. Exactly one action should set this. */
  primary: boolean
}

// ─── DAY SCHEDULE ─────────────────────────────────────────────────────────

export type AppointmentStatusId = 'confirmed' | 'checkedIn' | 'checkedOut'

export interface AppointmentStatus {
  id: AppointmentStatusId
  label: string
  tone: StatusTone
}

export interface Appointment {
  id: string
  /** ISO `YYYY-MM-DD`. */
  date: string
  /** 24-hour `HH:mm`. */
  start: string
  end: string
  /** The patient's name, or what the time is blocked for. */
  title: string
  /** Absent on a block that is not a visit — a seminar, a lunch. */
  status?: AppointmentStatusId
  room?: string
}

export interface DaySchedule {
  /** Names the column for assistive tech; the visible heading is the date. */
  label: string
  /** The day the column opens on, ISO `YYYY-MM-DD`. */
  today: string
  /** Where the "now" line sits on `today`, `HH:mm`. Never drawn on another day. */
  now: string
  nowLabel: string
  /** First hour row and the hour the grid ends at, 24-hour. */
  firstHour: number
  lastHour: number
  /** dayjs format for the heading. */
  dateFormat: string
  previousDay: string
  nextDay: string
  emptyDay: string
  statuses: AppointmentStatus[]
  appointments: Appointment[]
}

// ─── SCREEN ───────────────────────────────────────────────────────────────

export interface PatientsScreen {
  title: string
  rail: AppRail
  search: { label: string }
  actions: PatientListAction[]
  columns: Record<PatientColumnId, string>
  /** dayjs format — the same `MM.DD.YY` the record itself writes dates in. */
  dateOfBirthFormat: string
  filters: {
    /** The option that clears a filter. */
    all: string
    /** Accessible name of each header filter. */
    labels: Record<PatientFilterId, string>
  }
  statuses: PatientStatus[]
  unassignedProvider: string
  rowMenu: { openChart: string }
  /**
   * The one record this frontend has a chart for. A row opens the chart only
   * when its `id` matches — see `hasChart`.
   */
  chartedPatientId: string
  /** Said when a row without a chart is picked, instead of doing nothing. */
  noChartMessage: string
  /** Shown in the table when the search and filters leave no rows. */
  noMatches: string
  rows: PatientRow[]
  schedule: DaySchedule
}

/**
 * Whether picking this row can open a chart.
 *
 * Only one synthetic record exists (`patientChart`). Matching on the record's
 * own `id` — rather than flagging a row by hand — means a row can never open
 * somebody else's chart: if the two ids drift apart, the row simply stops
 * opening anything.
 */
export function hasChart(row: PatientRow, screen: PatientsScreen = patients): boolean {
  return row.id === screen.chartedPatientId
}

export const patients: PatientsScreen = {
  title: 'Patients',

  // The same rail, with the same item active: the list and the record both
  // live under Patients.
  rail: patientChart.rail,

  search: { label: 'Search by name or ID' },

  actions: [
    { id: 'online-registration', label: 'Online registration', primary: false },
    { id: 'create-patient', label: 'Create new patient', icon: 'newForm', primary: true },
  ],

  columns: {
    id: 'Patient ID',
    firstName: 'First name',
    lastName: 'Last name',
    dateOfBirth: 'Date of birth',
    status: 'Status',
    procedure: 'Procedure',
    provider: 'Provider',
  },
  dateOfBirthFormat: 'MM.DD.YY',

  filters: {
    all: 'All',
    labels: {
      status: 'Filter by status',
      procedure: 'Filter by procedure',
      provider: 'Filter by provider',
    },
  },

  statuses: [
    { id: 'active', label: 'Active', tone: 'success' },
    { id: 'prospect', label: 'Prospect', tone: 'info' },
  ],

  unassignedProvider: 'Not assigned',
  rowMenu: { openChart: 'Open chart' },

  chartedPatientId: patientChart.patient.id,
  noChartMessage: 'No chart on file for this patient yet.',
  noMatches: 'No patients match. Clear the search or set the filters back to All.',

  rows: [
    // The charted record. Mirrors `patientChart.patient`; the id is what ties
    // the two together.
    {
      id: '5340872',
      firstName: 'Julia',
      lastName: 'Smith',
      dateOfBirth: '1994-01-28',
      status: 'active',
      procedure: 'Socket graft',
      provider: 'Dr. Louie Al-Faraje',
    },
    {
      id: '3455352',
      firstName: 'Robert',
      lastName: 'Fox',
      dateOfBirth: '1981-06-12',
      status: 'active',
      procedure: 'Socket graft',
      provider: 'Dr. Maya Lindqvist',
    },
    {
      id: '5576567',
      firstName: 'Cody',
      lastName: 'Fisher',
      dateOfBirth: '1990-01-01',
      status: 'active',
      procedure: 'Split ridge',
      provider: 'Dr. Tomas Reyes',
    },
    {
      id: '4454651',
      firstName: 'Annette',
      lastName: 'Black',
      dateOfBirth: '1976-07-30',
      status: 'active',
      procedure: 'GBR',
      provider: 'Dr. Priya Nair',
    },
    {
      id: '3455658',
      firstName: 'Kathryn',
      lastName: 'Murphy',
      dateOfBirth: '1988-01-17',
      status: 'prospect',
      procedure: 'Socket graft',
      provider: 'Dr. Louie Al-Faraje',
    },
    {
      id: '3454765',
      firstName: 'Brooklyn',
      lastName: 'Simmons',
      dateOfBirth: '1969-12-21',
      status: 'active',
      procedure: 'PSP',
      provider: 'Dr. Maya Lindqvist',
    },
    {
      id: '3456565',
      firstName: 'Arlene',
      lastName: 'McCoy',
      dateOfBirth: '1992-11-12',
      status: 'active',
      procedure: 'Chin block graft',
      provider: 'Dr. Tomas Reyes',
    },
    {
      id: '3555765',
      firstName: 'Cameron',
      lastName: 'Williamson',
      dateOfBirth: '1985-01-12',
      status: 'prospect',
      procedure: 'Socket graft',
      provider: 'Dr. Priya Nair',
    },
    {
      id: '3455766',
      firstName: 'Jenny',
      lastName: 'Wilson',
      dateOfBirth: '1979-03-04',
      status: 'active',
      procedure: 'GBR',
      provider: null,
    },
    {
      id: '4555765',
      firstName: 'Guy',
      lastName: 'Hawkins',
      dateOfBirth: '1963-07-30',
      status: 'active',
      procedure: 'Chin block graft',
      provider: 'Dr. Maya Lindqvist',
    },
    {
      id: '3457652',
      firstName: 'Esther',
      lastName: 'Howard',
      dateOfBirth: '1997-01-09',
      status: 'prospect',
      procedure: 'Socket graft',
      provider: 'Dr. Tomas Reyes',
    },
    {
      id: '3455767',
      firstName: 'Wade',
      lastName: 'Warren',
      dateOfBirth: '1983-08-12',
      status: 'active',
      procedure: 'Chin block graft',
      provider: 'Dr. Louie Al-Faraje',
    },
    {
      id: '3576510',
      firstName: 'Leslie',
      lastName: 'Alexander',
      dateOfBirth: '1971-07-30',
      status: 'active',
      procedure: 'GBR',
      provider: null,
    },
    {
      id: '3455768',
      firstName: 'Darlene',
      lastName: 'Robertson',
      dateOfBirth: '1958-09-12',
      status: 'active',
      procedure: 'Socket graft',
      provider: null,
    },
    {
      id: '3455769',
      firstName: 'Jacob',
      lastName: 'Jones',
      dateOfBirth: '1995-11-12',
      status: 'prospect',
      procedure: 'Chin block graft',
      provider: 'Dr. Louie Al-Faraje',
    },
    {
      id: '3455770',
      firstName: 'Kristin',
      lastName: 'Watson',
      dateOfBirth: '1987-07-30',
      status: 'prospect',
      procedure: 'PSP',
      provider: 'Dr. Tomas Reyes',
    },
    {
      id: '3455771',
      firstName: 'Savannah',
      lastName: 'Nguyen',
      dateOfBirth: '1974-01-12',
      status: 'active',
      procedure: 'GBR',
      provider: 'Dr. Maya Lindqvist',
    },
    {
      id: '3455772',
      firstName: 'Ralph',
      lastName: 'Edwards',
      dateOfBirth: '1966-02-12',
      status: 'active',
      procedure: 'Socket graft',
      provider: 'Dr. Priya Nair',
    },
  ],

  schedule: {
    label: 'Day schedule',
    // The dataset's own "today", not the wall clock: the screen is a
    // projection of this file, and the record it opens is dated the same year.
    today: '2022-07-02',
    now: '11:00',
    nowLabel: 'Now',
    firstHour: 8,
    lastHour: 20,
    dateFormat: 'MMMM D, YYYY',
    previousDay: 'Previous day',
    nextDay: 'Next day',
    emptyDay: 'No appointments on this day.',
    statuses: [
      { id: 'confirmed', label: 'Confirmed', tone: 'info' },
      { id: 'checkedIn', label: 'Checked in', tone: 'warning' },
      { id: 'checkedOut', label: 'Checked out', tone: 'success' },
    ],
    appointments: [
      {
        id: 'a-0701-1',
        date: '2022-07-01',
        start: '09:00',
        end: '10:00',
        title: 'Jenny Wilson',
        status: 'checkedOut',
        room: 'Room 208',
      },
      {
        id: 'a-0701-2',
        date: '2022-07-01',
        start: '13:30',
        end: '14:30',
        title: 'Guy Hawkins',
        status: 'checkedOut',
        room: 'Room 415',
      },
      {
        id: 'a-0702-1',
        date: '2022-07-02',
        start: '08:00',
        end: '09:00',
        title: 'Robert Fox',
        status: 'checkedOut',
        room: 'Room 415',
      },
      {
        id: 'a-0702-2',
        date: '2022-07-02',
        start: '09:00',
        end: '09:30',
        title: 'Cody Fisher',
        status: 'checkedIn',
        room: 'Room 320',
      },
      {
        id: 'a-0702-3',
        date: '2022-07-02',
        start: '09:30',
        end: '10:00',
        title: 'Annette Black',
        status: 'checkedIn',
        room: 'Room 320',
      },
      // These two overlap on purpose — the column has to split for them.
      {
        id: 'a-0702-4',
        date: '2022-07-02',
        start: '10:00',
        end: '10:45',
        title: 'Kathryn Murphy',
        status: 'checkedIn',
        room: 'Room 320',
      },
      {
        id: 'a-0702-5',
        date: '2022-07-02',
        start: '10:15',
        end: '11:00',
        title: 'Brooklyn Simmons',
        status: 'confirmed',
        room: 'Room 208',
      },
      {
        id: 'a-0702-6',
        date: '2022-07-02',
        start: '11:00',
        end: '12:00',
        title: 'Arlene McCoy',
        status: 'confirmed',
        room: 'Room 208',
      },
      // A block, not a visit: no status and no room.
      { id: 'a-0702-7', date: '2022-07-02', start: '12:00', end: '14:00', title: 'Seminar' },
      {
        id: 'a-0702-8',
        date: '2022-07-02',
        start: '14:00',
        end: '15:00',
        title: 'Cameron Williamson',
        status: 'confirmed',
        room: 'Room 208',
      },
    ],
  },
}
