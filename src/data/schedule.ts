/**
 * Dataset for the Schedule screen — the practice's day, one column per
 * operatory.
 *
 * The first item in the rail. Where the Patients screen shows one narrow
 * column of the day as a glance beside the list, this is the day itself: every
 * chair side by side on a quarter-hour grid, which is the view a front desk
 * books from.
 *
 * ⚠️ SYNTHETIC. Every name, provider, phone number and address below is a
 * placeholder — the phone numbers use the reserved 555 exchange and the
 * addresses the reserved `example.com` domain, so none can belong to anyone.
 * The one real link to the rest of the app is `patientId` on the visit booked
 * for the patient this frontend has a chart for.
 */

import { patientChart, type AppRail, type IconName } from './patientChart.ts'

/** Theme channels a status can be drawn in. The bar is an index, never the only cue. */
export type ScheduleTone = 'warning' | 'info' | 'error' | 'secondary' | 'success'

export type VisitStatusId = 'scheduled' | 'confirmed' | 'checkedIn' | 'seated' | 'completed'

export interface VisitStatus {
  id: VisitStatusId
  label: string
  tone: ScheduleTone
}

export interface Operatory {
  id: string
  label: string
}

export interface Visit {
  id: string
  /** ISO `YYYY-MM-DD`. */
  date: string
  /** Which chair — an `Operatory.id`. */
  operatoryId: string
  /** 24-hour `HH:mm`. */
  start: string
  end: string
  patient: string
  /**
   * The record this visit belongs to, when there is one. Picking the patient's
   * name opens the chart only when this matches the charted record's id.
   */
  patientId?: string
  provider: string
  reason: string
  phone: string
  email: string
  status: VisitStatusId
}

export interface ScheduleAction {
  id: string
  label: string
  /** Leading glyph, when the action has one. */
  icon?: IconName
  /** The one filled action. Exactly one action should set this. */
  primary: boolean
}

export interface ScheduleScreen {
  title: string
  rail: AppRail
  /** The dataset's own "today" and "now" — not the wall clock. */
  today: string
  now: string
  nowLabel: string
  /** The grid runs from `firstHour` up to, not including, `lastHour`. */
  firstHour: number
  lastHour: number
  /** Minutes per row. The grid, the labels and the cards are all multiples of it. */
  slotMinutes: number
  /** dayjs formats: the date in the header, a row's clock time, its AM/PM. */
  dateFormat: string
  timeFormat: string
  meridiemFormat: string
  previousDay: string
  nextDay: string
  emptyDay: string
  actions: ScheduleAction[]
  operatories: Operatory[]
  statuses: VisitStatus[]
  /** The words in front of each line on a visit card. */
  visitLabels: {
    patient: string
    provider: string
    reason: string
    phone: string
    email: string
  }
  editVisit: string
  /** Said when a patient without a chart is picked, instead of doing nothing. */
  noChartMessage: string
  visits: Visit[]
}

export const schedule: ScheduleScreen = {
  title: 'Schedule',

  // The same rail as every screen, with this screen's item active.
  rail: { ...patientChart.rail, activeItemId: 'schedule' },

  // The same "today" the Patients screen's day column uses.
  today: '2022-07-02',
  now: '10:10',
  nowLabel: 'Now',
  firstHour: 7,
  lastHour: 19,
  slotMinutes: 15,
  dateFormat: 'D MMM YYYY',
  timeFormat: 'hh:mm',
  meridiemFormat: 'A',
  previousDay: 'Previous day',
  nextDay: 'Next day',
  emptyDay: 'No appointments on this day.',

  actions: [
    { id: 'filter', label: 'Filter', primary: false },
    { id: 'export-pdf', label: 'Export PDF', primary: false },
    { id: 'birthdays', label: 'Upcoming birthdays', primary: false },
    { id: 'production', label: 'Provider production', primary: false },
    { id: 'add-appointment', label: 'Add appointment', icon: 'newForm', primary: true },
  ],

  operatories: [
    { id: 'op-1', label: 'Operatory 1' },
    { id: 'op-2', label: 'Operatory 2' },
    { id: 'op-3', label: 'Operatory 3' },
    { id: 'op-4', label: 'Operatory 4' },
    { id: 'op-5', label: 'Operatory 5' },
    { id: 'op-6', label: 'Operatory 6' },
    { id: 'op-7', label: 'Operatory 7' },
  ],

  statuses: [
    { id: 'scheduled', label: 'Scheduled', tone: 'warning' },
    { id: 'confirmed', label: 'Confirmed', tone: 'info' },
    { id: 'checkedIn', label: 'Checked in', tone: 'error' },
    { id: 'seated', label: 'Seated', tone: 'secondary' },
    { id: 'completed', label: 'Completed', tone: 'success' },
  ],

  visitLabels: {
    patient: 'Patient',
    provider: 'Dr.',
    reason: 'Reason',
    phone: 'Phone',
    email: 'Email',
  },
  editVisit: 'Edit appointment',
  noChartMessage: 'No chart on file for this patient yet.',

  visits: [
    {
      id: 'v-0702-1',
      date: '2022-07-02',
      operatoryId: 'op-1',
      start: '07:00',
      end: '07:45',
      patient: 'Alisa Tomson',
      provider: 'John Hurst',
      reason: 'Checkup',
      phone: '(760) 555 0105',
      email: 'alisa.tomson@example.com',
      status: 'scheduled',
    },
    {
      id: 'v-0702-2',
      date: '2022-07-02',
      operatoryId: 'op-1',
      start: '08:00',
      end: '09:15',
      patient: 'Kathi Wearne',
      provider: 'Daniel Lee',
      reason: 'Continue treatment',
      phone: '(760) 555 0146',
      email: 'kathi.wearne@example.com',
      status: 'completed',
    },
    {
      id: 'v-0702-3',
      date: '2022-07-02',
      operatoryId: 'op-1',
      start: '09:15',
      end: '11:00',
      patient: 'Patrick Cunningham',
      provider: 'Ashok Patel',
      reason: 'Checkup',
      phone: '(760) 555 0100',
      email: 'patrick.cunningham@example.com',
      status: 'seated',
    },
    {
      id: 'v-0702-4',
      date: '2022-07-02',
      operatoryId: 'op-3',
      start: '07:30',
      end: '08:45',
      patient: 'Tim Bright',
      provider: 'Amanda Jones',
      reason: 'Initial visit',
      phone: '(760) 555 0133',
      email: 'tim.bright@example.com',
      status: 'confirmed',
    },
    {
      id: 'v-0702-5',
      date: '2022-07-02',
      operatoryId: 'op-3',
      start: '09:15',
      end: '11:00',
      // The one visit with a record behind it: the patient the chart is for.
      patient: patientChart.patient.name,
      patientId: patientChart.patient.id,
      provider: 'Louie Al-Faraje',
      reason: 'Checkup',
      phone: '(888) 555 0150',
      email: 'julia.smith@example.com',
      status: 'scheduled',
    },
    {
      id: 'v-0702-6',
      date: '2022-07-02',
      operatoryId: 'op-5',
      start: '07:00',
      end: '09:00',
      patient: 'Elina Krauf',
      provider: 'Mark Jackson',
      reason: 'Wisdom teeth',
      phone: '(760) 555 0156',
      email: 'elina.krauf@example.com',
      status: 'checkedIn',
    },
    {
      id: 'v-0701-1',
      date: '2022-07-01',
      operatoryId: 'op-2',
      start: '09:00',
      end: '10:00',
      patient: 'Jenny Wilson',
      provider: 'Daniel Lee',
      reason: 'Cleaning',
      phone: '(760) 555 0118',
      email: 'jenny.wilson@example.com',
      status: 'completed',
    },
    {
      id: 'v-0703-1',
      date: '2022-07-03',
      operatoryId: 'op-4',
      start: '10:00',
      end: '10:45',
      patient: 'Guy Hawkins',
      provider: 'Amanda Jones',
      reason: 'Initial visit',
      phone: '(760) 555 0127',
      email: 'guy.hawkins@example.com',
      status: 'confirmed',
    },
  ],
}
