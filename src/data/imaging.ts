/**
 * Dataset for the Imaging section of the patient record — the scans on file.
 *
 * The section is reached from the record's own sidebar and is drawn beside it:
 * the patient block stays on the left, as it does for every section of the
 * record, and this fills the right.
 *
 * ⚠️ SYNTHETIC. No scan below was taken of anyone. The kinds are the ones a
 * dental practice files, the names and sizes are invented, and all six open
 * the SAME sample picture — the only radiograph in this repo, taken from the
 * design reference. It is a screenshot of an imaging program (its toolbars are
 * in the frame), standing in for a real viewer. Reading a radiograph is a
 * clinician's job; nothing here is a finding.
 *
 * The list is the SEED of what the section shows: a card's menu can take a
 * scan off it (after asking) or put another file in a scan's place, and both
 * live only in the page — a reload brings these six back.
 */

import sampleRadiograph from '../assets/imaging/dental-xray.png'

import type { IconName } from './patientChart.ts'

export interface Scan {
  id: string
  /** What kind of image it is — the card's title. */
  kind: string
  fileName: string
  /** As a label, with its unit: the card shows it, nothing computes with it. */
  size: string
  /** ISO `YYYY-MM-DD`, so the cards sort by date. Shown through `dateFormat`. */
  takenOn: string
  /** The picture itself, as a resolved URL. A real backend supplies one per scan. */
  image: string
}

export interface ImagingSection {
  title: string
  /** `label` is the faint prompt in the empty field AND its accessible name. */
  search: { label: string; icon: IconName }
  upload: { label: string; icon: IconName }
  /** The glyph on each card's tile. */
  scanIcon: IconName
  /** dayjs format — the same `MM.DD.YY` the record writes dates in. */
  dateFormat: string
  /**
   * A card's menu: `label` names the button that opens it, the rest are its
   * entries. Removing asks first (`removeConfirm`); re-uploading opens the
   * file picker and the chosen picture takes the scan's place.
   */
  menu: {
    label: string
    remove: { label: string; icon: IconName }
    reupload: { label: string; icon: IconName }
  }
  /** `{scan}` and `{file}` in `body` are filled with the scan being removed. */
  removeConfirm: { title: string; body: string; cancel: string; confirm: string }
  /** Units a re-uploaded file's size is written in, to match the seeded labels. */
  sizeUnits: { kb: string; mb: string }
  /** Goes before a scan's kind to name its card for assistive tech — "Open bitewing". */
  openPrefix: string
  /** Shown when the search leaves no cards. */
  noMatches: string
  /** Shown when every scan has been removed. */
  empty: string
  viewer: {
    close: string
    /** Completes the picture's text alternative after the scan's kind. */
    imageNote: string
  }
  scans: Scan[]
}

export const imaging: ImagingSection = {
  title: 'Scans',
  search: { label: 'Search scans', icon: 'search' },
  upload: { label: 'Upload', icon: 'imaging' },
  scanIcon: 'photos',
  dateFormat: 'MM.DD.YY',
  menu: {
    label: 'Scan actions',
    remove: { label: 'Remove', icon: 'remove' },
    reupload: { label: 'Reupload', icon: 'reupload' },
  },
  removeConfirm: {
    title: 'Remove this scan?',
    body: '“{scan}” ({file}) will be taken off this record.',
    cancel: 'Cancel',
    confirm: 'Remove',
  },
  sizeUnits: { kb: 'KB', mb: 'MB' },
  openPrefix: 'Open',
  noMatches: 'No scans match the search.',
  empty: 'No scans on file.',
  viewer: {
    close: 'Close scan',
    imageNote: 'sample image, not this patient’s radiograph',
  },

  scans: [
    {
      id: 'scan-6',
      kind: 'Bitewing, right',
      fileName: 'bitewing_right.jpg',
      size: '1.2 MB',
      takenOn: '2022-12-11',
      image: sampleRadiograph,
    },
    {
      id: 'scan-5',
      kind: 'Bitewing, left',
      fileName: 'bitewing_left.jpg',
      size: '1.1 MB',
      takenOn: '2022-12-11',
      image: sampleRadiograph,
    },
    {
      id: 'scan-4',
      kind: 'Periapical',
      fileName: 'periapical_16.jpg',
      size: '0.9 MB',
      takenOn: '2022-11-28',
      image: sampleRadiograph,
    },
    {
      id: 'scan-3',
      kind: 'Panoramic',
      fileName: 'panoramic.jpg',
      size: '3.4 MB',
      takenOn: '2022-06-14',
      image: sampleRadiograph,
    },
    {
      id: 'scan-2',
      kind: 'Cone beam CT',
      fileName: 'cbct_lower_right.zip',
      size: '48 MB',
      takenOn: '2021-09-03',
      image: sampleRadiograph,
    },
    {
      id: 'scan-1',
      kind: 'Intraoral photo',
      fileName: 'intraoral_upper.jpg',
      size: '2.6 MB',
      takenOn: '2021-03-14',
      image: sampleRadiograph,
    },
  ],
}
