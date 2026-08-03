/**
 * Dataset for the Patient chart screen — the product's main page.
 *
 * The view in `src/screens/PatientChart.tsx` is a pure projection of this file:
 * every label, figure, name and count on screen is read from here, so a real
 * backend can drop in by producing the same shape.
 *
 * The record below is SYNTHETIC placeholder data. No real patient.
 */

// ─── ICONS ────────────────────────────────────────────────────────────────
// Data names an icon; the view owns the mapping from name to component. That
// keeps this module free of JSX and importable by anything (tests, a server).

export type IconName =
  // rail
  | 'schedule'
  | 'operations'
  | 'tasks'
  | 'billing'
  | 'settings'
  | 'patients'
  | 'referrals'
  | 'contacts'
  | 'treatmentPlans'
  | 'inventory'
  | 'pharmacy'
  | 'library'
  | 'notes'
  | 'support'
  | 'collapse'
  // header actions
  | 'recall'
  | 'newForm'
  | 'message'
  | 'call'
  // patient tabs
  | 'general'
  | 'photos'
  | 'charts'
  | 'eclaims'
  | 'ledger'
  | 'implantExam'
  | 'smile'
  | 'checklists'
  | 'lab'
  | 'imaging'
  | 'erx'
  | 'docs'
  | 'forms'
  | 'alerts'
  | 'clinicalNotes'
  | 'sharedCare'
  | 'sPad'
  // chart footer
  | 'history'
  | 'help'

// ─── APP RAIL ─────────────────────────────────────────────────────────────

export interface RailItem {
  id: string
  label: string
  icon: IconName
}

/** Rail items are grouped; the view draws a hairline between groups. */
export interface RailGroup {
  id: string
  items: RailItem[]
}

export interface AppRail {
  groups: RailGroup[]
  /** `id` of the item drawn in the active state. */
  activeItemId: string
  /** Pinned to the bottom of the rail, below the groups. */
  footer: RailItem
}

// ─── PATIENT HEADER ───────────────────────────────────────────────────────

/** `accent` renders as a call-to-action — e.g. an unscheduled next visit. */
export type FieldTone = 'default' | 'accent'

export interface PatientField {
  id: string
  label: string
  value: string
  tone: FieldTone
}

export interface HeaderAction {
  id: string
  label: string
  icon: IconName
  /** The one filled, full-width action. Exactly one action should set this. */
  primary: boolean
}

export interface PatientTab {
  id: string
  label: string
  icon: IconName
}

export interface Patient {
  /** Human-facing chart number, shown above the name. */
  chartNumber: string
  name: string
  /** Initials stand in for the photo until one is uploaded. */
  initials: string
  status: string
  dateOfBirth: string
  /** Rendered as three two-row columns, in this order. */
  fields: PatientField[]
  actions: HeaderAction[]
  tabs: PatientTab[]
  activeTabId: string
}

// ─── ODONTOGRAM ───────────────────────────────────────────────────────────

export type ToothType = 'molar' | 'premolar' | 'canine' | 'incisor'
export type Arch = 'upper' | 'lower'

/** Treatment state driving the tooth's fill. Placeholder set is all `sound`. */
export type ToothStatus = 'sound' | 'restored' | 'watch' | 'missing'

export interface Tooth {
  /** FDI two-digit notation — 18 is the upper-right third molar. */
  fdi: number
  arch: Arch
  type: ToothType
  status: ToothStatus
}

/** FDI's second digit encodes position within the quadrant. */
const TYPE_BY_POSITION: Record<number, ToothType> = {
  1: 'incisor',
  2: 'incisor',
  3: 'canine',
  4: 'premolar',
  5: 'premolar',
  6: 'molar',
  7: 'molar',
  8: 'molar',
}

function tooth(fdi: number): Tooth {
  const quadrant = Math.floor(fdi / 10)
  return {
    fdi,
    arch: quadrant === 1 || quadrant === 2 ? 'upper' : 'lower',
    type: TYPE_BY_POSITION[fdi % 10],
    status: 'sound',
  }
}

/** Left-to-right on screen: patient's right quadrant first, as clinicians read it. */
const UPPER_FDI = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER_FDI = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

/** Which arches the odontogram is showing — the control beside the chart. */
export type ArchView = 'upper' | 'both' | 'lower'

export interface ChartOption {
  id: string
  label: string
}

export interface Odontogram {
  upper: Tooth[]
  lower: Tooth[]
  /** Segmented buttons above the chart. */
  modes: ChartOption[]
  activeModeId: string
  archViews: ArchView[]
  activeArchView: ArchView
  /** Copy for the 3D arch, which is the whole odontogram. */
  model: {
    /** Shown under the arch until a tooth is picked. */
    hint: string
    /** Prefixes the tooth number once one is. */
    toothLabel: string
  }
  /** Corner affordances, bottom-left and bottom-right of the chart panel. */
  footerActions: { start: RailItem; end: RailItem }
}

// ─── THE SCREEN ───────────────────────────────────────────────────────────

export interface PatientChartScreen {
  title: string
  rail: AppRail
  patient: Patient
  odontogram: Odontogram
}

export const patientChart: PatientChartScreen = {
  title: 'Charts',

  rail: {
    activeItemId: 'patients',
    groups: [
      {
        id: 'practice',
        items: [
          { id: 'schedule', label: 'Schedule', icon: 'schedule' },
          { id: 'operations', label: 'Operations', icon: 'operations' },
          { id: 'tasks', label: 'Tasks', icon: 'tasks' },
          { id: 'billing', label: 'Billing', icon: 'billing' },
          { id: 'settings', label: 'Settings', icon: 'settings' },
        ],
      },
      {
        id: 'records',
        items: [
          { id: 'patients', label: 'Patients', icon: 'patients' },
          { id: 'referrals', label: 'Referrals', icon: 'referrals' },
          { id: 'contacts', label: 'Contacts', icon: 'contacts' },
          { id: 'treatment-plans', label: 'Treatment plans', icon: 'treatmentPlans' },
        ],
      },
      {
        id: 'clinic',
        items: [
          { id: 'inventory', label: 'Inventory', icon: 'inventory' },
          { id: 'pharmacy', label: 'Pharmacy', icon: 'pharmacy' },
          { id: 'library', label: 'Library', icon: 'library' },
          { id: 'notes', label: 'Notes', icon: 'notes' },
          { id: 'support', label: 'Support', icon: 'support' },
        ],
      },
    ],
    footer: { id: 'collapse', label: 'Collapse menu', icon: 'collapse' },
  },

  patient: {
    chartNumber: '#P6L272',
    name: 'Julia Smith',
    initials: 'JS',
    status: 'Active',
    dateOfBirth: '01.28.94',
    fields: [
      {
        id: 'primary-provider',
        label: 'Primary provider',
        value: 'Dr. Louie Al-Faraje',
        tone: 'default',
      },
      { id: 'phone', label: 'Phone number', value: '(888) 452 1505', tone: 'default' },
      {
        id: 'primary-insurance',
        label: 'Primary insurance',
        value: 'Active until 06.22',
        tone: 'default',
      },
      {
        id: 'secondary-insurance',
        label: 'Secondary insurance',
        value: 'Expired on 07.21',
        tone: 'default',
      },
      { id: 'last-visit', label: 'Last visit', value: '12.11.22', tone: 'default' },
      { id: 'next-date', label: 'Next date', value: 'Set date', tone: 'accent' },
    ],
    actions: [
      { id: 'recall', label: 'Recall', icon: 'recall', primary: false },
      { id: 'new-form', label: 'New form', icon: 'newForm', primary: false },
      { id: 'message', label: 'Message', icon: 'message', primary: false },
      { id: 'call', label: 'Call patient', icon: 'call', primary: true },
    ],
    activeTabId: 'charts',
    tabs: [
      { id: 'general', label: 'General', icon: 'general' },
      { id: 'photos', label: 'Photos', icon: 'photos' },
      { id: 'charts', label: 'Charts', icon: 'charts' },
      { id: 'eclaims', label: 'eClaims', icon: 'eclaims' },
      { id: 'ledger', label: 'Ledger', icon: 'ledger' },
      { id: 'implant-exam', label: 'Implant exam', icon: 'implantExam' },
      { id: 'smile', label: 'Smile', icon: 'smile' },
      { id: 'checklists', label: 'Checklists', icon: 'checklists' },
      { id: 'lab', label: 'Lab', icon: 'lab' },
      { id: 'imaging', label: 'Imaging', icon: 'imaging' },
      { id: 'erx', label: 'eRx', icon: 'erx' },
      { id: 'docs', label: 'Docs', icon: 'docs' },
      { id: 'forms', label: 'Forms', icon: 'forms' },
      { id: 'alerts', label: 'Alerts', icon: 'alerts' },
      { id: 'clinical-notes', label: 'Clinical notes', icon: 'clinicalNotes' },
      { id: 'shared-care', label: 'SharedCare', icon: 'sharedCare' },
      { id: 's-pad', label: 'S Pad', icon: 'sPad' },
    ],
  },

  odontogram: {
    upper: UPPER_FDI.map(tooth),
    lower: LOWER_FDI.map(tooth),
    activeModeId: 'overview',
    modes: [
      { id: 'overview', label: 'Overview' },
      { id: 'quickselect', label: 'Quickselect' },
      { id: 'perio-probing', label: 'Periodontal Probing' },
    ],
    archViews: ['upper', 'both', 'lower'],
    activeArchView: 'both',
    model: {
      hint: 'Drag to rotate · scroll to zoom · click a tooth to select',
      toothLabel: 'Tooth',
    },
    footerActions: {
      start: { id: 'chart-history', label: 'Chart history', icon: 'history' },
      end: { id: 'chart-help', label: 'Charting help', icon: 'help' },
    },
  },
}
