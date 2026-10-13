/**
 * Dataset for the Patient details section of the record — everything on file
 * about the patient, of which the sidebar beside it is the digest.
 *
 * The view in `src/screens/PatientDetails.tsx` is a pure projection of this
 * file: every label, value, name and row on screen is read from here, so a real
 * backend can drop in by producing the same shape.
 *
 * ⚠️ Everything below is SYNTHETIC placeholder data. No real patient, relative,
 * employer or insurer. The identifiers are not in any real format (the social
 * security number is the all-zero one no person can hold), the email addresses
 * are on `example.com`, and the phone numbers are in the 555-01xx range kept
 * for fiction.
 *
 * ⚠️ The medical and dental history is the part that would need a clinician's
 * sign-off before any of it were shown as fact. Nobody took this history; the
 * conditions ticked are a few plausible ones, and the three sections that
 * would describe a diabetic patient on blood thinners or bisphosphonates are
 * left "not recorded" rather than filled with invented doses and lab values.
 * It is kept clear of the two allergies on the record (penicillin, latex).
 *
 * What the record already states — the patient's name, ID, date of birth,
 * status, provider and phone — is READ from `patientChart` and `patients`, not
 * retyped, so the details can never disagree with the chart they open from.
 */

import { patientChart, type IconName } from './patientChart.ts'
import { patients, type StatusTone } from './patients.ts'

// ─── SHARED SHAPES ────────────────────────────────────────────────────────

/** One labelled value. `null` is "nothing on file" — shown in words, never as a blank. */
export interface DetailField {
  id: string
  label: string
  value: string | null
}

/** One line of a yes/no checklist, as recorded. */
export interface DetailCheck {
  id: string
  label: string
  checked: boolean
}

/**
 * A titled block of a tab: labelled values, a checklist, or both — fields
 * first. `editable` gives it its own Edit button, where the section is edited
 * on its own rather than with the whole tab.
 */
export interface DetailSection {
  id: string
  title: string
  editable: boolean
  fields?: DetailField[]
  checks?: DetailCheck[]
}

// ─── FAMILY ───────────────────────────────────────────────────────────────

export type FamilyStatusId = 'guarantor' | 'patient' | 'nonPatient'

export interface FamilyStatus {
  id: FamilyStatusId
  label: string
  /** The chip's colour — an index into the word beside it, never the only signal. */
  tone: StatusTone | 'default'
}

export interface FamilyMember {
  id: string
  firstName: string
  lastName: string
  gender: string
  /** `null` where none is on file — a child, say. */
  email: string | null
  phone: string | null
  /** ISO `YYYY-MM-DD`, so it sorts as a date. Shown through `dateFormat`. */
  dateOfBirth: string
  relationship: string
  status: FamilyStatusId
}

export type FamilyColumnId =
  | 'firstName'
  | 'lastName'
  | 'gender'
  | 'email'
  | 'phone'
  | 'dateOfBirth'
  | 'relationship'
  | 'status'

// ─── SCREEN ───────────────────────────────────────────────────────────────

export type PatientDetailsTabId = 'personal' | 'family' | 'insurance' | 'history' | 'rx'

export interface PatientDetailsScreen {
  /** The dialog's heading. Whose details they are is written under it. */
  title: string
  /** Names the dialog's close button. */
  close: string
  /** Names the tab strip for assistive tech. */
  tabsLabel: string
  tabs: { id: PatientDetailsTabId; label: string }[]
  /** Said in place of a value that is not on file. */
  notRecorded: string
  /** dayjs format — the same `MM.DD.YY` the record writes dates in. */
  dateFormat: string
  actions: {
    edit: string
    newMember: { label: string; icon: IconName }
  }
  personal: { fields: DetailField[] }
  family: {
    /** Names the table for assistive tech. */
    label: string
    columns: Record<FamilyColumnId, string>
    filters: { all: string; by: string }
    statuses: FamilyStatus[]
    noMatches: string
    members: FamilyMember[]
  }
  insurance: { sections: DetailSection[] }
  history: {
    /** Stated on screen above the history — see the warning at the top. */
    disclaimer: string
    sections: DetailSection[]
  }
  rx: {
    empty: string
  }
}

const { patient } = patientChart

/** The patient's own row in the list — where the name is held as two parts. */
const listed = patients.rows.find((row) => row.id === patient.id)

/** A value the chart's sidebar already shows, by its field id. */
const fromRecord = (id: string) =>
  patient.fields.find((field) => field.id === id)?.value ?? null

/** Shorthand for a checklist line. */
const check = (label: string, checked = false): DetailCheck => ({
  id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  label,
  checked,
})

export const patientDetails: PatientDetailsScreen = {
  title: 'Patient details',
  close: 'Close patient details',

  tabsLabel: 'Patient details sections',
  tabs: [
    { id: 'personal', label: 'Personal' },
    { id: 'family', label: 'Family' },
    { id: 'insurance', label: 'Insurance' },
    { id: 'history', label: 'M&D history' },
    { id: 'rx', label: 'Rx history' },
  ],

  notRecorded: 'Not recorded',
  dateFormat: 'MM.DD.YY',

  actions: {
    edit: 'Edit',
    newMember: { label: 'New member', icon: 'newForm' },
  },

  personal: {
    fields: [
      { id: 'first-name', label: 'First name', value: listed?.firstName ?? null },
      { id: 'last-name', label: 'Last name', value: listed?.lastName ?? null },
      { id: 'preferred-name', label: 'Preferred name', value: 'Julie' },
      { id: 'middle-initial', label: 'Middle initial', value: 'A.' },
      { id: 'business-phone', label: 'Business phone', value: '(760) 555 0102' },
      { id: 'cell-phone', label: 'Cell phone', value: fromRecord('phone') },
      { id: 'initial-visit', label: 'Initial visit', value: '03.03.20' },
      { id: 'date-of-birth', label: patient.dateOfBirthLabel, value: patient.dateOfBirth },
      { id: 'street', label: 'Street', value: '4987 Example Avenue' },
      { id: 'city', label: 'City', value: 'San Diego' },
      { id: 'state', label: 'State', value: 'CA' },
      { id: 'zip', label: 'ZIP code', value: '92101' },
      { id: 'country', label: 'Country', value: 'United States' },
      { id: 'employer', label: 'Employer', value: 'Example Design Studio' },
      { id: 'social-security', label: 'Social security', value: '000-00-0000' },
      { id: 'email', label: 'Email', value: 'julia.smith@example.com' },
      { id: 'marital-status', label: 'Marital status', value: 'Married' },
      { id: 'drivers-license', label: 'Driver’s license', value: 'D0000000' },
      { id: 'contact-method', label: 'Preferred contact method', value: 'Phone' },
      { id: 'appt-confirmation', label: 'Preferred appointment confirmation', value: 'Email' },
      { id: 'gender', label: 'Gender', value: patient.sex.label },
      { id: 'referral-source', label: 'Referral source', value: 'Walk-in' },
      { id: 'chief-complaint', label: 'Chief complaint', value: 'History of pain' },
      { id: 'secondary-complaint', label: 'Secondary complaint', value: 'Pain' },
      { id: 'patient-id', label: 'Patient ID', value: patient.id },
      { id: 'primary-provider', label: 'Primary provider', value: fromRecord('primary-provider') },
      { id: 'status', label: 'Status', value: patient.status },
      { id: 'online-registration', label: 'Online registration status', value: 'Registered' },
      { id: 'treatment-goal', label: 'Treatment goal', value: '6 months' },
      { id: 'family-member', label: 'Family member', value: 'Daniel Smith' },
      { id: 'referred-to', label: 'Referred to', value: 'Dr. Amanda Jones' },
      { id: 'referred-to-date', label: 'Referred to date', value: '06.05.22' },
    ],
  },

  family: {
    label: 'Family members',
    columns: {
      firstName: 'First name',
      lastName: 'Last name',
      gender: 'Gender',
      email: 'Email',
      phone: 'Phone',
      dateOfBirth: 'Date of birth',
      relationship: 'Relationship',
      status: 'Status',
    },
    filters: { all: 'All', by: 'Filter by' },
    statuses: [
      { id: 'guarantor', label: 'Guarantor', tone: 'success' },
      { id: 'patient', label: 'Patient', tone: 'info' },
      { id: 'nonPatient', label: 'Non-patient', tone: 'default' },
    ],
    noMatches: 'No family members match. Set the filters back to All.',
    members: [
      {
        id: 'fm-1',
        firstName: 'Daniel',
        lastName: 'Smith',
        gender: 'Male',
        email: 'daniel.smith@example.com',
        phone: '(760) 555 0111',
        dateOfBirth: '1991-06-05',
        relationship: 'Husband',
        status: 'guarantor',
      },
      {
        id: 'fm-2',
        firstName: 'Emma',
        lastName: 'Smith',
        gender: 'Female',
        email: null,
        phone: null,
        dateOfBirth: '2016-01-08',
        relationship: 'Daughter',
        status: 'patient',
      },
      {
        id: 'fm-3',
        firstName: 'Oliver',
        lastName: 'Smith',
        gender: 'Male',
        email: null,
        phone: null,
        dateOfBirth: '2018-07-05',
        relationship: 'Son',
        status: 'patient',
      },
      {
        id: 'fm-4',
        firstName: 'Margaret',
        lastName: 'Lane',
        gender: 'Female',
        email: 'margaret.lane@example.com',
        phone: '(760) 555 0127',
        dateOfBirth: '1964-01-08',
        relationship: 'Mother',
        status: 'nonPatient',
      },
      {
        id: 'fm-5',
        firstName: 'Thomas',
        lastName: 'Lane',
        gender: 'Male',
        email: 'thomas.lane@example.com',
        phone: '(760) 555 0139',
        dateOfBirth: '1989-07-05',
        relationship: 'Brother',
        status: 'nonPatient',
      },
    ],
  },

  insurance: {
    sections: [
      {
        id: 'dental-primary',
        title: 'Dental primary',
        editable: true,
        fields: [
          { id: 'relationship', label: 'Relationship', value: 'Spouse' },
          { id: 'first-name', label: 'First name', value: 'Daniel' },
          { id: 'last-name', label: 'Last name', value: 'Smith' },
          { id: 'date-of-birth', label: 'Date of birth', value: '06.05.91' },
          { id: 'gender', label: 'Gender', value: 'Male' },
          { id: 'street', label: 'Street', value: '4987 Example Avenue' },
          { id: 'city', label: 'City', value: 'San Diego' },
          { id: 'state', label: 'State', value: 'CA' },
          { id: 'zip', label: 'ZIP code', value: '92101' },
          { id: 'country', label: 'Country', value: 'United States' },
          { id: 'cell-phone', label: 'Cell phone', value: '(760) 555 0111' },
          { id: 'social-security', label: 'Social security', value: '000-00-0000' },
          { id: 'carrier', label: 'Carrier', value: 'Example Dental Plan' },
          { id: 'member-id', label: 'Member ID', value: 'M-000456' },
          { id: 'group-number', label: 'Group/policy number', value: 'G-000123' },
          { id: 'plan-name', label: 'Plan name', value: 'Family PPO' },
          { id: 'employer-name', label: 'Employer name', value: 'Example Engineering Co.' },
          { id: 'employer-phone', label: 'Employer phone', value: '(760) 555 0164' },
        ],
      },
      {
        id: 'dental-secondary',
        title: 'Dental secondary',
        editable: true,
        fields: [
          { id: 'relationship', label: 'Relationship', value: 'Self' },
          { id: 'first-name', label: 'First name', value: listed?.firstName ?? null },
          { id: 'last-name', label: 'Last name', value: listed?.lastName ?? null },
          { id: 'date-of-birth', label: 'Date of birth', value: patient.dateOfBirth },
          { id: 'gender', label: 'Gender', value: patient.sex.label },
          { id: 'cell-phone', label: 'Cell phone', value: fromRecord('phone') },
          { id: 'carrier', label: 'Carrier', value: 'Sample Employee Dental' },
          { id: 'member-id', label: 'Member ID', value: 'M-000789' },
          { id: 'group-number', label: 'Group/policy number', value: 'G-000321' },
          { id: 'plan-name', label: 'Plan name', value: 'Basic' },
          { id: 'employer-name', label: 'Employer name', value: 'Example Design Studio' },
          { id: 'employer-phone', label: 'Employer phone', value: '(760) 555 0102' },
        ],
      },
    ],
  },

  history: {
    disclaimer: 'Sample data — not a medical history taken from a patient',
    sections: [
      {
        id: 'medical-conditions',
        title: 'Medical conditions',
        editable: true,
        // The checklist a practice hands a new patient, in the order the
        // design lists it. Read down the columns, as it is laid out.
        checks: [
          check('High blood pressure'),
          check('Low blood pressure'),
          check('Diabetes'),
          check('Smoking'),
          check('Sinus problems', true),
          check('Taking bisphosphonate medication'),
          check('Cancer'),
          check('Radiation therapy'),
          check('Chemotherapy'),
          check('Bleeding disorder'),
          check('Anemia'),
          check('Angina'),
          check('Arthritis'),
          check('Artificial joints or implants'),
          check('Daily alcoholic beverages'),
          check('Asthma', true),
          check('Congenital heart problem'),
          check('Congestive heart disease'),
          check('Heart attack'),
          check('Heart disease'),
          check('Heart murmur'),
          check('Heart pacemaker'),
          check('Heart surgery'),
          check('Mitral valve prolapse'),
          check('Stroke'),
          check('Glaucoma'),
          check('HIV infection (AIDS)'),
          check('Hay fever', true),
          check('Psychological disorder'),
          check('Frequent headaches', true),
          check('Ulcers'),
          check('Thyroid problems'),
          check('Epilepsy'),
          check('Artificial heart valve'),
          check('Hepatitis A'),
          check('Hepatitis B'),
          check('Hepatitis C'),
          check('Kidney disease'),
          check('Seizure/fainting'),
          check('Respiratory problem'),
          check('Rheumatic fever'),
          check('Pre-med clindamycin'),
          // Left unticked on purpose: the record carries a penicillin allergy.
          check('Pre-med amoxicillin'),
          check('Dizziness'),
          check('Lung disease (tuberculosis)'),
          check('Blood disease'),
          check('Other'),
        ],
      },
      {
        id: 'dental-history',
        title: 'Dental history',
        editable: true,
        fields: [
          { id: 'previous-dentist', label: 'Previous dentist', value: 'Dr. John Hurst' },
          { id: 'last-exam', label: 'Date of last exam', value: '11.06.22' },
        ],
        checks: [
          // Ticked to agree with the chart, which has bleeding on probing.
          check('Gums bleed while brushing/flossing', true),
          check('Sensitive to hot/cold', true),
          check('Sensitive to sweet/sour', true),
          check('Unusual feeling in the mouth'),
          check('Teeth clenching/grinding', true),
          check('Head/neck/jaw injuries'),
          check('Previous orthodontic treatment'),
          check('Likes their smile', true),
          check('Clicking pain'),
          check('Difficulty in opening/closing the jaw'),
          check('Difficulty in chewing'),
        ],
      },
      {
        id: 'covid-vaccination',
        title: 'COVID-19 vaccination',
        editable: true,
        fields: [
          { id: 'manufacturer', label: 'Manufacturer', value: 'Pfizer' },
          { id: 'location', label: 'Location', value: 'Hospital' },
          { id: 'first-shot', label: 'First shot date', value: '03.14.21' },
          { id: 'second-shot', label: 'Second shot date', value: '04.04.21' },
          { id: 'verification', label: 'Verification method', value: 'Vaccination card' },
        ],
      },
      // The three sections below describe conditions this patient is not
      // recorded as having, so their values are left unset rather than filled
      // with invented doses and lab results.
      {
        id: 'diabetic',
        title: 'Diabetic',
        editable: true,
        fields: [
          { id: 'type', label: 'Type', value: null },
          { id: 'insulin', label: 'Insulin', value: null },
          { id: 'daily-intermediate', label: 'Total daily intermediate', value: null },
          { id: 'daily-short', label: 'Total daily short acting dose', value: null },
          { id: 'fasting-glucose', label: 'Recent fasting blood glucose level', value: null },
          { id: 'hba1c', label: 'HbA1c level', value: null },
        ],
      },
      {
        id: 'blood-thinners',
        title: 'Blood thinners',
        editable: true,
        fields: [
          { id: 'inr', label: 'INR', value: null },
          { id: 'pt-time', label: 'PT time', value: null },
        ],
      },
      {
        id: 'bisphosphonates',
        title: 'Bisphosphonates / Monoclonal antibody medication',
        editable: true,
        fields: [
          { id: 'type', label: 'Type', value: null },
          { id: 'medication', label: 'Medication', value: null },
          { id: 'reason', label: 'Reason', value: null },
          { id: 'administration', label: 'Administration', value: null },
          { id: 'duration', label: 'Treatment duration', value: null },
          { id: 'last-dose', label: 'Last dose', value: null },
        ],
      },
    ],
  },

  rx: {
    empty: 'No medication prescribed for this patient.',
  },
}
