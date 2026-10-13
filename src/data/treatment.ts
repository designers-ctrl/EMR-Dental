/**
 * Dataset for the "Add treatment" dialog — what a clinician fills in to put a
 * procedure on the plan for a finding on one tooth.
 *
 * The dialog is opened from a record in the tooth panel ("Add treatment" on a
 * carious lesion). The tooth, the kind of finding and the surface in hand come
 * from the chart; everything else the dialog says or offers is below.
 *
 * ⚠️ SYNTHETIC — and a clinical and billing surface, so read this before
 * trusting any of it:
 *
 *  - PROCEDURE CODES are written in the shape of CDT codes, with the names such
 *    codes commonly carry, from memory. They have NOT been checked against a
 *    current, licensed CDT edition; the real list comes from the practice's
 *    fee schedule.
 *  - FEES are invented round figures. They are not a fee schedule, a quote or
 *    an insurance estimate.
 *  - THE PRESCRIPTION DRAFT is an example line so the block has something in
 *    it. Nobody prescribed it; a prescription is a clinician's decision and
 *    needs their sign-off, the allergy check included.
 */

import type { IconName } from './patientChart.ts'

export interface TreatmentProcedure {
  id: string
  /** The procedure code, as written on a claim. */
  code: string
  name: string
  /** In whole currency units. Shown through `fee.currency`. */
  fee: number
}

/** One prescription line, as typed. All three are free text. */
export interface PrescriptionDraft {
  id: string
  /** The drug and its strength, as one label. */
  name: string
  quantity: string
  /** How to take it and for how long. Empty until entered. */
  directions: string
}

export interface TreatmentDialogFrame {
  title: string
  close: string
  procedure: {
    label: string
    placeholder: string
    helper: string
    /** Said in the helper's place when Save is pressed with nothing chosen. */
    required: string
    noOptions: string
    icon: IconName
    openIcon: IconName
  }
  fee: {
    label: string
    currency: string
    /** Stands in the field until a procedure is chosen. */
    empty: string
    helper: string
  }
  notes: { label: string; placeholder: string }
  prescription: {
    title: string
    /** The glyph at the head of every line. */
    icon: IconName
    add: { label: string; icon: IconName }
    /** The chip on every line: nothing in this dialog is sent to a pharmacy. */
    status: string
    quantityPrefix: string
    /** Said on a line whose directions are still empty. */
    noDirections: string
    edit: { label: string; icon: IconName }
    remove: { label: string; icon: IconName }
    /** Labels of the three fields a line is edited through, and their button. */
    fields: { name: string; quantity: string; directions: string }
    done: string
    /** What the dialog opens with. */
    drafts: PrescriptionDraft[]
  }
  cancel: string
  save: string
  procedures: TreatmentProcedure[]
}

export const treatment: TreatmentDialogFrame = {
  title: 'Add treatment',
  close: 'Close',
  procedure: {
    label: 'Procedure / CDT code',
    placeholder: 'Search by procedure name or code',
    helper: 'Select one procedure to add to the plan.',
    required: 'Select a procedure before saving.',
    noOptions: 'No procedures match.',
    icon: 'search',
    openIcon: 'dropdown',
  },
  fee: {
    label: 'Estimated fee',
    currency: '$',
    empty: '—',
    helper: 'Filled after selecting a procedure.',
  },
  notes: { label: 'Notes (optional)', placeholder: 'Add treatment notes…' },
  prescription: {
    title: 'Prescription (optional)',
    icon: 'erx',
    add: { label: 'Add prescription', icon: 'add' },
    status: 'Draft',
    quantityPrefix: 'Quantity:',
    noDirections: 'Directions and duration not entered.',
    edit: { label: 'Edit prescription', icon: 'pencil' },
    remove: { label: 'Remove prescription', icon: 'remove' },
    fields: { name: 'Medication', quantity: 'Quantity', directions: 'Directions and duration' },
    done: 'Done',
    drafts: [{ id: 'rx-1', name: 'Amoxicillin 500 mg', quantity: '30 capsules', directions: '' }],
  },
  cancel: 'Cancel',
  save: 'Save',

  procedures: [
    { id: 'proc-1', code: 'D1206', name: 'Topical fluoride varnish', fee: 40 },
    { id: 'proc-2', code: 'D1351', name: 'Sealant, per tooth', fee: 60 },
    { id: 'proc-3', code: 'D2140', name: 'Amalgam, one surface', fee: 150 },
    { id: 'proc-4', code: 'D2330', name: 'Resin composite, one surface, anterior', fee: 180 },
    { id: 'proc-5', code: 'D2391', name: 'Resin composite, one surface, posterior', fee: 200 },
    { id: 'proc-6', code: 'D2392', name: 'Resin composite, two surfaces, posterior', fee: 250 },
    { id: 'proc-7', code: 'D2740', name: 'Crown, porcelain/ceramic', fee: 1200 },
    { id: 'proc-8', code: 'D3330', name: 'Root canal therapy, molar', fee: 1100 },
    { id: 'proc-9', code: 'D7140', name: 'Extraction, erupted tooth', fee: 220 },
  ],
}
