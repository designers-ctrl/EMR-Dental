/**
 * Dataset for the Patient chart screen — the product's main page.
 *
 * The view in `src/screens/PatientChart.tsx` is a pure projection of this file:
 * every label, figure, name and count on screen is read from here, so a real
 * backend can drop in by producing the same shape.
 *
 * The record below is SYNTHETIC placeholder data. No real patient.
 */

// The patient portrait is the one asset this dataset owns directly: it is
// patient data, not chrome, so it belongs here rather than in the view.
import patientPhoto from '../assets/patient-photo.jpg'

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
  // patient demographics
  | 'sexFemale'
  | 'sexMale'
  // patient demographics
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
  // chart tabs
  | 'hidden'
  // chart footer
  | 'history'
  | 'help'
  // patient sidebar
  | 'back'
  | 'more'
  // chart layer + view menus
  | 'layers'
  | 'view3d'
  | 'dropdown'
  // perio tooth panel
  | 'close'
  | 'check'
  | 'reset'

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

/** `accent` renders as a link-style call to action — e.g. an unscheduled next visit. */
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
  /**
   * Whether the practice ranks it first. The sidebar lists `primary` tabs
   * ahead of the rest; how many show before the "More" toggle is decided by
   * the space available, not by this flag.
   *
   * A record has seventeen sections and a sidebar has room for a handful, so
   * the split is DATA rather than a slice taken in the view — which section a
   * practice wants at the top level is a configuration question, not a layout
   * one, and slicing the first N would silently reorder as sections are added.
   */
  primary: boolean
  /**
   * Whether the section behind this tab exists yet. Only `charts` is built, so
   * every other tab renders as a labelled, hoverable, non-activating target
   * rather than a link that silently does nothing. A real backend (or a router)
   * flips these to `true` as sections land — the view reads the flag, so
   * nothing in the markup needs to change.
   */
  available: boolean
}

export interface Patient {
  name: string
  /** Record identifier, shown under the name as `<idLabel> <id>`. */
  id: string
  idLabel: string
  /**
   * As recorded on the chart; shown in full beside the date of birth, with
   * `icon` after the word as a decorative glyph.
   */
  sex: { label: string; icon: IconName }
  /** Names the bare date on hover — it is shown without a caption. */
  dateOfBirthLabel: string
  /**
   * Portrait on file, as a resolved URL. A real backend supplies one; here it
   * comes from a Vite asset import. Omitted when there is no photo.
   */
  photo?: string
  /** Initials stand in for the photo until one is uploaded. */
  initials: string
  /** Shown as a small badge beside the ID — text, not colour. */
  status: string
  /** MM.DD.YY, as the record writes it. */
  dateOfBirth: string
  /** Rendered as three two-row columns, in this order. */
  fields: PatientField[]
  actions: HeaderAction[]
  tabs: PatientTab[]
  activeTabId: string
  /**
   * Shown on hover/focus over a tab whose `available` is false. Copy lives here
   * rather than in the view so the sentence changes without touching markup.
   */
  unavailableTabHint: string
  /** The floating toggle that expands the list in place with the sections it had no room for. */
  moreLabel: string
  /** Collapses them again. */
  lessLabel: string
  /**
   * The trail above the navigation — a way back to the list this record was
   * opened from. Only the parent is named: the leaf is the patient's own name,
   * which is already on the record and must not be able to drift from it.
   */
  breadcrumb: { parent: string }
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

/**
 * The Universal (ADA) number for an FDI tooth — the 1–32 scheme.
 *
 * DERIVED, never stored. FDI stays the single source of truth on `Tooth.fdi`;
 * this is a projection of it for display. The two notations are NOT
 * interchangeable and a tooth carrying both numbers in the data is how they
 * drift apart: FDI 11 and Universal 8 are the same tooth, but Universal 11 is
 * a completely different one (the upper-left canine, FDI 23). Reading a chart
 * in the wrong notation puts a drill in the wrong tooth, so nothing here
 * renumbers or reorders the dataset — it only relabels it.
 *
 * Universal counts one continuous loop around the mouth, unlike FDI's four
 * quadrants: 1 at the patient's upper-RIGHT third molar, across to 16 at the
 * upper left, dropping to 17 at the lower LEFT third molar, and back round to
 * 32 at the lower right.
 */
export function universalFromFdi(fdi: number): number {
  const quadrant = Math.floor(fdi / 10)
  const position = fdi % 10
  switch (quadrant) {
    case 1:
      return 9 - position // upper right: 18 → 1 … 11 → 8
    case 2:
      return 8 + position // upper left:  21 → 9 … 28 → 16
    case 3:
      return 25 - position // lower left:  38 → 17 … 31 → 24
    default:
      return 24 + position // lower right: 41 → 25 … 48 → 32
  }
}

/**
 * Which side of the patient's mouth a tooth sits on — the R/L the badges carry.
 *
 * This is the PATIENT's right and left, never the viewer's. FDI quadrants 1
 * and 4 are the patient's right; 2 and 3 their left. Sitting across the chair
 * puts the patient's right on the clinician's left, and a chart that quietly
 * flipped to match the view would record the mirror image as fact — so this
 * derives from the quadrant and never from anything on screen.
 */
export function sideFromFdi(fdi: number): 'L' | 'R' {
  const quadrant = Math.floor(fdi / 10)
  return quadrant === 1 || quadrant === 4 ? 'R' : 'L'
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

/**
 * One probed site. Conditions are variadic so a healthy site reads as bare
 * numbers and only the sites with something wrong carry any extra words.
 */
function site(
  pocketDepth: number,
  recession: number,
  ...conditions: PerioCondition[]
): PerioSiteReading {
  return { pocketDepth, recession, conditions }
}

/**
 * One fully probed tooth, given as its two aspects.
 *
 * Both are fixed-length triples, distal → mesial, so a tooth cannot be
 * written into the dataset with five sites or seven. The order is the order a
 * probe walks the tooth.
 */
type SiteTriple = [PerioSiteReading, PerioSiteReading, PerioSiteReading]

function perioTooth(fdi: number, buccal: SiteTriple, lingual: SiteTriple): PerioToothReading {
  return {
    fdi,
    sites: {
      distoBuccal: buccal[0],
      buccal: buccal[1],
      mesioBuccal: buccal[2],
      distoLingual: lingual[0],
      lingual: lingual[1],
      mesioLingual: lingual[2],
    },
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

/**
 * One chart type in the tab strip at the top-right of the chart panel.
 *
 * `enabled` is what "only Dental is active" means in data: the other charts
 * exist as destinations but have no view behind them yet, so they render
 * disabled rather than switching the panel to nothing. Flip the flag when the
 * chart lands — the view needs no edit.
 */
export interface ChartTab extends ChartOption {
  enabled: boolean
  /** Optional trailing glyph, e.g. the visibility marker on "All". */
  icon?: IconName
}

// ─── PERIODONTAL CHART ────────────────────────────────────────────────────

/**
 * The perio layer that the "Perio Chart" tab lays over the SAME dentition.
 *
 * Nothing here replaces the odontogram: the 32 meshes, their positions and
 * their statuses are untouched. This adds two readings on top of them —
 * where the gingival margin sits, and how deep the sulcus probes.
 *
 * ⚠️ The figures below are SYNTHETIC placeholders. A periodontal chart is a
 * signed clinical record; these numbers were never probed on a patient and
 * must not be read as findings. `disclaimer` is rendered on screen for the
 * same reason.
 */

/**
 * The SIX sites a periodontal probe walks on every tooth.
 *
 * Six is the clinical standard, not a layout choice: a pocket can be 3 mm at
 * mid-facial and 8 mm at the disto-facial line angle of the same tooth, and a
 * chart that records one number per surface cannot see that. The names are
 * built from the two aspects (buccal, and the tongue side) crossed with
 * mesial / middle / distal.
 *
 * The tongue-side key is `lingual` throughout the DATA because one key must
 * mean one site everywhere. What it is CALLED depends on the arch — palatal on
 * the uppers, lingual on the lowers — which is why the words live in
 * `siteLabels` and never in a view.
 */
export type PerioSite =
  | 'distoBuccal'
  | 'buccal'
  | 'mesioBuccal'
  | 'distoLingual'
  | 'lingual'
  | 'mesioLingual'

/** The two aspects, and which sites sit on each. */
export const PERIO_BUCCAL_SITES = ['distoBuccal', 'buccal', 'mesioBuccal'] as const
export const PERIO_LINGUAL_SITES = ['distoLingual', 'lingual', 'mesioLingual'] as const

/**
 * Reading order for the panel — tongue side on top, cheek side below, distal
 * to mesial across each. This is the order a probe walks and the order a paper
 * chart prints, so the tiles read the way a clinician already scans them.
 */
export const PERIO_SITE_ORDER: PerioSite[] = [
  ...PERIO_LINGUAL_SITES,
  ...PERIO_BUCCAL_SITES,
]

/**
 * What was observed at a site beyond the two measurements.
 *
 * Each is a plain yes/no a clinician marks while probing. They are held as a
 * list rather than four booleans because that is how they are entered — you
 * tick what you saw — and it keeps a site with nothing wrong as an empty list
 * rather than four falses that have to be read one by one.
 */
export type PerioCondition = 'bleeding' | 'plaque' | 'pus' | 'tartar'

export interface PerioSiteReading {
  /** Millimetres from the gingival margin down to the base of the pocket. */
  pocketDepth: number
  /**
   * Millimetres the gingival margin sits APICAL of the cemento-enamel
   * junction — i.e. recession, root laid bare. `0` leaves the margin on the
   * CEJ, which is where the view draws it for every unprobed tooth. NEGATIVE
   * means the margin sits coronal of the junction, which is swelling rather
   * than recession — a real value on an inflamed site, and the reason this is
   * not clamped at zero.
   */
  recession: number
  conditions: PerioCondition[]
}

/** One tooth, fully probed. A tooth absent from the list was never probed. */
export interface PerioToothReading {
  fdi: number
  sites: Record<PerioSite, PerioSiteReading>
}

export interface PerioLegendItem {
  id: string
  label: string
  description: string
}

/** One measurement the pad can enter, and the values it offers. */
export interface PerioMeasure {
  id: 'pocketDepth' | 'recession'
  label: string
  /** Every value the pad offers, in the order it lays them out. */
  values: number[]
  /** Shown on the last key, standing for "deeper than the pad goes". */
  overflow?: { value: number; label: string }
}

/** One way of handling the 3D arch, e.g. drag → rotate. */
export interface ChartGesture {
  id: string
  /** The input, e.g. "Right-drag". */
  gesture: string
  /** Its effect as a short verb, for the one-line first-visit tip. */
  short: string
  /** Its effect in full, for the help popover. */
  action: string
}

export interface ChartHelp {
  title: string
  /** In order; the last is the tooth click, which a chart tab may re-word. */
  gestures: ChartGesture[]
  /** Heading of the one-time tip. */
  tipTitle: string
  /** Names the tip's close button. */
  dismissLabel: string
}

export interface PerioChart {
  /** Stated on screen — see the warning above. */
  disclaimer: string
  /** What clicking a tooth does while this layer is up — the last row of the chart help. */
  hint: string
  /** Probing depth at or above which a site reads as disease, in `unit`. */
  flagDepth: number
  /** Named once, so a figure and its unit can never drift apart. */
  unit: string
  legend: PerioLegendItem[]
  /**
   * Site names per arch — palatal on the uppers, lingual on the lowers. Both
   * spellings live here so no view has to know the rule.
   */
  siteLabels: Record<Arch, Record<PerioSite, string>>
  /** The two measurements, and the keypad for each. */
  measures: PerioMeasure[]
  /** The four observations, in the order the chips show them. */
  conditions: { id: PerioCondition; label: string }[]
  /** Copy for the panel that opens when a tooth is picked. */
  panel: {
    titlePrefix: string
    close: string
    toothRail: string
    /** Heading over the four condition toggles (bleeding, plaque, pus, tartar). */
    conditionsTitle: string
    /** Shown when the tooth has no readings at all — never probed. */
    unprobedTitle: string
    unprobedBody: string
    /**
     * Shown when the tooth WAS probed and nothing was found. Kept separate
     * from the unprobed copy on purpose: "we looked and it is fine" and "we
     * have not looked" are different clinical facts, and a panel that renders
     * them the same way invites the second to be read as the first.
     */
    healthyTitle: string
    healthyBody: string
  }
  /** Copy for the caption when a probed tooth is picked. */
  labels: {
    recession: string
    pocket: string
    bleeding: string
    noBleeding: string
    unprobed: string
    site: string
  }
  /**
   * Every tooth that has actually been probed. A tooth ABSENT from this list
   * has no readings — the panel says so in words rather than showing six
   * zeros, which would be indistinguishable from a healthy tooth that was
   * examined.
   */
  readings: PerioToothReading[]
}

/**
 * Readings indexed by tooth — DERIVED, like `universalFromFdi` above.
 *
 * The readings ship as a list because that is the shape a probing sequence is
 * recorded in, and the shape a backend would return. Every view that shows a
 * reading — the marks on the 3D arch, the tooth badges, the caption, the
 * panel — goes through this one projection, so a depth can never end up drawn
 * against one tooth and written against another.
 */
export function perioByFdi(readings: PerioToothReading[]): Map<number, PerioToothReading> {
  return new Map(readings.map((reading) => [reading.fdi, reading]))
}

/** The deepest site on one aspect — what the 3D patch for that aspect shows. */
export function deepestOnAspect(
  reading: PerioToothReading,
  sites: readonly PerioSite[],
): { site: PerioSite; reading: PerioSiteReading } {
  let worst = sites[0]
  for (const site of sites) {
    if (reading.sites[site].pocketDepth > reading.sites[worst].pocketDepth) worst = site
  }
  return { site: worst, reading: reading.sites[worst] }
}

/** The deepest site on the whole tooth — what the badge and caption lead with. */
export function deepestSite(
  reading: PerioToothReading,
): { site: PerioSite; reading: PerioSiteReading } {
  return deepestOnAspect(reading, PERIO_SITE_ORDER)
}

/** Whether anything on this tooth is worth flagging at all. */
export function hasPerioFindings(reading: PerioToothReading, flagDepth: number): boolean {
  return PERIO_SITE_ORDER.some(
    (site) =>
      reading.sites[site].pocketDepth >= flagDepth ||
      reading.sites[site].conditions.length > 0,
  )
}

// ─── CARIES ───────────────────────────────────────────────────────────────

/**
 * Carious lesions found on the dentition — a finding layer, like the perio
 * chart above.
 *
 * Deliberately NOT folded into `ToothStatus`. That field drives the enamel a
 * whole tooth is painted with, and a lesion is a mark on one SURFACE of one
 * tooth, not a repaint of it. Perio findings sit beside `status` for the same
 * reason: FDI 16 can carry a 6 mm pocket, an occlusal lesion and an unchanged
 * shell all at once, which is exactly how a real chart records it.
 *
 * ⚠️ Unlike the perio layer, this one is NOT tied to a chart tab. Caries is a
 * property of the tooth rather than a reading taken for one chart, so the mark
 * stays on the arch in every chart type — see `ToothArch.tsx`.
 *
 * ⚠️ The lesion below is a SYNTHETIC placeholder. Caries detection is a
 * diagnosis a clinician signs; the code, extent and note here were never
 * examined on a patient. `disclaimer` is rendered on screen for that reason.
 */

/**
 * Which face of the tooth the lesion sits on.
 *
 * The five surfaces a chart names. `occlusal` is the biting table and exists
 * only on molars and premolars — the anterior teeth bite on an incisal edge,
 * which is out of scope here because nothing in the placeholder set carries
 * a lesion on one.
 */
export type CariesSurface = 'occlusal' | 'mesial' | 'distal' | 'buccal' | 'lingual'

export interface CariesFinding {
  fdi: number
  /** Every surface involved. The first is the one the 3D mark is drawn on. */
  surfaces: CariesSurface[]
  /**
   * ICDAS II code, 0–6 — the international scale for how far a lesion has
   * got. Stored as the number so a backend can filter on it; the words shown
   * on screen come from `icdasLabels`, never from a bare number.
   */
  icdas: number
  /** How deep it has reached, in the words a clinician would write. */
  extent: string
  /** Free-text observation, as it would appear in the clinical note. */
  note: string
  /** When it was charted. */
  detectedOn: string
  /** Where it sits in the treatment plan. */
  plan: string
}

/** How far into the tooth the lesion has reached on one surface. */
export type CariesTissue = 'dentin' | 'enamel'

/** Whether that surface has broken down into a cavity. */
export type CariesCavitation = 'cavitated' | 'intact'

/**
 * The severity grade recorded per surface.
 *
 * ⚠️ The C1–C4 labels are carried over from the previous product's caries
 * form. What each grade means clinically — and how it relates to the ICDAS
 * code a finding also carries — is a clinician's definition, not this file's.
 */
export type CariesGrade = 'C1' | 'C2' | 'C3' | 'C4'

/** What is to be done about the tooth's lesions. */
export type CariesDecision = 'monitor' | 'treat'

/**
 * What is recorded for ONE surface. Each part is independent and may be unset:
 * a surface with nothing set has not been assessed, which is not the same as
 * a surface assessed and found sound.
 */
export interface CariesSurfaceAssessment {
  tissue: CariesTissue | null
  cavitation: CariesCavitation | null
  grade: CariesGrade | null
}

/**
 * One tooth's caries assessment, as the dental panel edits it.
 *
 * Per SURFACE, because a tooth can carry lesions of different depth on
 * different faces — the panel's five tiles each show their own grade for
 * exactly that reason. `decision` is per tooth: one plan for the tooth.
 */
export interface CariesToothAssessment {
  fdi: number
  surfaces: Partial<Record<CariesSurface, CariesSurfaceAssessment>>
  decision: CariesDecision | null
}

/** The five surfaces in the order the panel lays them out, as a cross. */
export const CARIES_SURFACE_ORDER: CariesSurface[] = [
  'buccal',
  'mesial',
  'occlusal',
  'distal',
  'lingual',
]

export interface CariesChart {
  /** Stated on screen — see the warning above. */
  disclaimer: string
  /** Row added to the legend beside the arch. */
  legend: PerioLegendItem
  /** Short text on the tooth badge, so the mark is never colour alone. */
  badge: string
  /** Heading on the panel that opens when a carious tooth is picked. */
  title: string
  /** Names for each surface, so the view holds no clinical vocabulary. */
  surfaceLabels: Record<CariesSurface, string>
  /** Names for the ICDAS codes actually used below. */
  icdasLabels: Record<number, string>
  labels: {
    surfaces: string
    icdas: string
    extent: string
    detected: string
    plan: string
  }
  findings: CariesFinding[]
  /** Copy and option lists for the panel that opens on the Dental tab. */
  panel: {
    titlePrefix: string
    close: string
    surfacesTitle: string
    tissueTitle: string
    cavitationTitle: string
    gradeTitle: string
    /** Names the footer's two buttons as a group. */
    decisionTitle: string
    tissues: { id: CariesTissue; label: string }[]
    cavitations: { id: CariesCavitation; label: string }[]
    grades: { id: CariesGrade; label: string }[]
    /**
     * `notice` is what the chart announces once the decision is made;
     * `{tooth}` is replaced with the tooth's name.
     */
    decisions: { id: CariesDecision; label: string; notice: string }[]
    /** Names the notice's close button. */
    dismissNotice: string
    /** Names the tooth list down the panel's left side. */
    toothRail: string
    /** Read out, after its number, for a tooth in that list that carries a finding. */
    toothRailFlag: string
    /** Read out for a tile that has no grade yet; the tile shows a dash. */
    ungraded: string
    /**
     * Two surfaces are named by where the tooth is: the tongue side of an
     * UPPER tooth faces the palate, and an ANTERIOR tooth bites on an incisal
     * edge rather than an occlusal table. The keys stay `lingual`/`occlusal`.
     */
    surfaceLabelOverrides: { upperLingual: string; anteriorOcclusal: string }
    /** Clears everything recorded for the tooth — asks first. */
    reset: string
    /** The confirmation it asks with. `{tooth}` is replaced with the tooth's name. */
    resetConfirm: { title: string; body: string; cancel: string; confirm: string }
  }
  /**
   * The per-surface assessment for each carious tooth — what the panel opens
   * with and edits. One entry per tooth in `findings`.
   */
  assessments: CariesToothAssessment[]
}

/**
 * Lesions indexed by tooth — DERIVED, like `perioByFdi` above.
 *
 * One tooth can carry more than one lesion, so this keeps them as a list
 * rather than collapsing to the first. Every consumer — the stain on the
 * model, the badge, the detail panel — reads this one projection, so a lesion
 * can never be drawn against one tooth and described against another.
 */
export function cariesByFdi(caries: CariesChart): Map<number, CariesFinding[]> {
  const found = new Map<number, CariesFinding[]>()
  for (const finding of caries.findings) {
    const list = found.get(finding.fdi)
    if (list) list.push(finding)
    else found.set(finding.fdi, [finding])
  }
  return found
}

// ─── ENDODONTICS ──────────────────────────────────────────────────────────

/**
 * The root canal system, and what is planned for it — the "Endo Chart" tab.
 *
 * TAB-SCOPED, like the perio layer and unlike caries and implants. The canal
 * anatomy is inside every tooth all the time, but showing it is a mode the user
 * chooses: thirty-two teeth with their pulps lit would drown the dental chart
 * it is drawn over. Selecting Endo Chart keeps the same dentition and turns the
 * pulp on, exactly as Perio Chart keeps it and turns the margins on.
 *
 * ⚠️ The DRAWN canals are a diagram, not this patient's anatomy. Canal number
 * and names come from the record below; their path through the root is laid out
 * from the tooth's own measured size, because there is no per-canal geometry in
 * `teeth.glb` to read one from. Real canals curve, split, join and rejoin, and
 * a canal that has been located on a radiograph is the only thing that settles
 * how many there are. Nothing here is a working length, and the layer must
 * never be read as one — `disclaimer` says so on screen.
 *
 * ⚠️ SYNTHETIC placeholder. Pulpal diagnosis is a clinician's call.
 */

/** Where the tooth has got to in endodontic treatment. */
export type EndoStatus = 'needed' | 'inProgress' | 'completed'

export interface EndoFinding {
  fdi: number
  /**
   * Canal names, in the order a chart lists them. The LENGTH is the canal
   * count — kept as one field rather than a count beside a list, because the
   * two drifting apart is how a tooth ends up drawn with three canals and
   * described with four.
   */
  canals: string[]
  status: EndoStatus
  /** Pulpal diagnosis, in the words a clinician would write. */
  diagnosis: string
  /** Periapical diagnosis, which is charted separately from the pulpal one. */
  periapical: string
  /** Free-text observation, as it would appear in the clinical note. */
  note: string
  /** When it was charted. */
  detectedOn: string
  /** Where it sits in the treatment plan. */
  plan: string
}

export interface EndoChart {
  /** Stated on screen — see the warning above. */
  disclaimer: string
  /** What clicking a tooth does while this tab is up — the last row of the chart help. */
  hint: string
  /** Tooltip over a tooth that has a canal record, while this tab is up. */
  hoverLabel: string
  /** Rows added to the legend beside the arch. */
  legend: PerioLegendItem[]
  /** Short text on the tooth badge, so the finding is never colour alone. */
  badge: string
  /** Heading on the panel that opens when a charted tooth is picked. */
  title: string
  /** Names for each status, so the view holds no clinical vocabulary. */
  statusLabels: Record<EndoStatus, string>
  labels: {
    canals: string
    status: string
    diagnosis: string
    periapical: string
    detected: string
    plan: string
  }
  findings: EndoFinding[]
}

/**
 * Endodontic findings indexed by tooth — DERIVED, like the projections above.
 *
 * One finding per tooth: a tooth has one canal system, however many canals are
 * in it. Every consumer reads this projection, so the pulp drawn on a tooth and
 * the diagnosis written beside it can never belong to different teeth.
 */
// ─── POST AND CORE ────────────────────────────────────────────────────────

/**
 * A post cemented into a treated root, carrying a core the crown is built on.
 *
 * Endodontic, not restorative, which is why it rides with the endo chart: a
 * post only exists in a tooth whose canal has already been treated, and it is
 * charted against that treatment. A tooth with a post but no root filling is a
 * contradiction the dataset should not be able to state — see the check in
 * `postCoreByFdi`.
 *
 * ⚠️ SYNTHETIC placeholder. A post's system, diameter and length come off the
 * restorative record; nothing here was measured on a patient, and the drawn
 * post is built from the two figures below rather than from any real product.
 * `disclaimer` is rendered on screen for that reason.
 */
export interface PostCoreRestoration {
  fdi: number
  /** Post system, as it would appear in the restorative note. */
  system: string
  /** Post diameter, millimetres — drives the drawn post's width. */
  diameter: number
  /** Post length inside the root, millimetres — drives how deep it is drawn. */
  length: number
  /** What the core is built up in. */
  material: string
  /** When it was placed. */
  placedOn: string
  /** Free-text observation, as it would appear in the clinical note. */
  note: string
  /** Where it sits in the treatment plan. */
  plan: string
}

export interface PostCoreChart {
  /** Stated on screen — see the warning above. */
  disclaimer: string
  /** Row added to the legend beside the arch. */
  legend: PerioLegendItem
  /** Short text on the tooth badge, so the post is never colour alone. */
  badge: string
  /** Heading on the panel that opens when a posted tooth is picked. */
  title: string
  /** Unit the two dimensions are in. */
  unit: string
  labels: {
    system: string
    post: string
    material: string
    placed: string
    plan: string
  }
  restorations: PostCoreRestoration[]
}

/**
 * Posts indexed by tooth — DERIVED, like every other finding projection here.
 *
 * A posted tooth IS root-treated — that is what a post is cemented into — but
 * the treatment is not charted twice. The post record carries it, and the pulp
 * system is left off those teeth in the endo chart, because the post occupies
 * the canal and drawing both would put two things in one space. That is why
 * this is a plain projection rather than a filter against `EndoChart`.
 */
export function postCoreByFdi(postCore: PostCoreChart): Map<number, PostCoreRestoration> {
  return new Map(postCore.restorations.map((restoration) => [restoration.fdi, restoration]))
}

export function endoByFdi(endo: EndoChart): Map<number, EndoFinding> {
  return new Map(endo.findings.map((finding) => [finding.fdi, finding]))
}

// ─── IMPLANTS ─────────────────────────────────────────────────────────────

/**
 * Endosseous implants — a fixture standing where a natural root used to.
 *
 * Modelled as a finding layer beside `perio` and `caries`, and for the same
 * reason: `ToothStatus` paints the whole tooth one colour, while this replaces
 * one PART of it. The crown above an implant can be sound, stained or watched
 * independently of the fixture under it, which is how a chart records the two.
 *
 * ⚠️ This layer is the one that changes what the ANATOMY looks like: the tooth
 * it names is drawn crown-only, with the fixture below it, because that is what
 * is in the jaw. It never renumbers or moves a tooth — FDI 44 keeps its node,
 * its position and its number, and only what is drawn below its neck changes.
 *
 * ⚠️ SYNTHETIC placeholder. A fixture's system, diameter and length come off
 * the surgical record and the radiograph; nothing here was measured on a
 * patient, and the drawn screw is built from the two figures below rather than
 * from any real implant's thread form. `disclaimer` is rendered on screen for
 * that reason, and the dimensions must be confirmed against the record before
 * anyone reads them as this patient's.
 */
export interface ImplantFixture {
  fdi: number
  /** Implant system, as it would appear on the sticker in the chart. */
  system: string
  /** Diameter at the platform, millimetres — drives the drawn fixture's width. */
  diameter: number
  /** Length below the platform, millimetres — drives the drawn fixture's depth. */
  length: number
  /** When it was placed. */
  placedOn: string
  /** What sits on top of it — a crown, a bridge abutment, a healing cap. */
  restoration: string
  /** Free-text observation, as it would appear in the clinical note. */
  note: string
  /** Where it sits in the treatment plan. */
  plan: string
}

export interface ImplantChart {
  /** Stated on screen — see the warning above. */
  disclaimer: string
  /** Row added to the legend beside the arch. */
  legend: PerioLegendItem
  /** Short text on the tooth badge, so the fixture is never colour alone. */
  badge: string
  /** Heading on the panel that opens when an implanted tooth is picked. */
  title: string
  /** Unit the two dimensions are in. */
  unit: string
  labels: {
    system: string
    fixture: string
    placed: string
    restoration: string
    plan: string
  }
  fixtures: ImplantFixture[]
}

/**
 * Fixtures indexed by tooth — DERIVED, like `perioByFdi` and `cariesByFdi`.
 *
 * One fixture per site, unlike caries: a tooth position holds a single
 * implant, so this collapses to the fixture rather than a list. Every consumer
 * reads this one projection, so the screw on the model and the record in the
 * panel can never describe different teeth.
 */
export function implantsByFdi(implants: ImplantChart): Map<number, ImplantFixture> {
  return new Map(implants.fixtures.map((fixture) => [fixture.fdi, fixture]))
}

// ─── CHART LAYERS ─────────────────────────────────────────────────────────

/**
 * What the "Chart Layers" menu can switch on and off.
 *
 * The four in `structure` are the broad strokes; the rest refine two of them.
 * A parent being off hides its whole group whatever the children say, which is
 * what makes the top four usable as a quick "just show me the teeth".
 *
 * ⚠️ `available` is the honest half of this menu. Several rows name marks this
 * app does not draw yet — there is no fracture model, no periapical lesion
 * mark, no post-and-core, and no tooth in the dataset carries a `restored` or
 * `missing` status. They are listed because a clinician expects to find them
 * here, and rendered DISABLED because a checkbox that silently changes nothing
 * is worse than one that says it is not ready. Flip the flag when the mark
 * lands; the menu needs no edit.
 */
export type ChartLayerId =
  | 'findings'
  | 'treatments'
  | 'labels'
  | 'measurements'
  | 'caries'
  | 'fractures'
  | 'lesions'
  | 'missing'
  | 'implants'
  | 'rootCanals'
  | 'restorations'
  | 'postCore'

/** Which mark to draw in the swatch beside a row, so it reads as its layer. */
export type ChartLayerSwatch =
  | 'caries'
  | 'implant'
  | 'endo'
  | 'label'
  | 'measure'
  | 'outline'
  | 'lesion'
  | 'fracture'
  | 'restoration'
  | 'postCore'

export interface ChartLayerItem {
  id: ChartLayerId
  label: string
  /** Second line under the label. Omitted on the refinement rows. */
  description?: string
  swatch: ChartLayerSwatch
  /** Whether anything is drawn behind it yet — see the warning above. */
  available: boolean
  /** Whether it starts switched on. */
  on: boolean
}

export interface ChartLayerGroup {
  id: string
  /** Heading above the group. The first group is unheaded. */
  title?: string
  items: ChartLayerItem[]
}

export interface ChartLayers {
  /** On the button that opens the menu. */
  buttonLabel: string
  title: string
  subtitle: string
  showAll: string
  reset: string
  /** Shown on a row nothing is drawn behind yet. */
  unavailableHint: string
  groups: ChartLayerGroup[]
}

/** Every layer's starting state, as the menu's own `on` flags declare it. */
export function defaultChartLayers(layers: ChartLayers): Record<ChartLayerId, boolean> {
  const state = {} as Record<ChartLayerId, boolean>
  for (const group of layers.groups) {
    for (const item of group.items) state[item.id] = item.available && item.on
  }
  return state
}

// ─── NAMED VIEWS ──────────────────────────────────────────────────────────

/**
 * The standing views the "View" menu flies the camera to.
 *
 * `direction` is where the camera sits relative to what it is looking at, in
 * the arch's own axes — +X the patient's LEFT, +Y up, +Z out of the face. It
 * is normalised by the view, so these read as directions rather than
 * distances; how far back the camera ends up is the framing's business, not
 * this list's.
 *
 * The occlusal pair is the reason `y` is never exactly ±1: a camera looking
 * straight down its own up-axis has no defined roll, and OrbitControls spins
 * on the spot when it gets one. The slight lean settles it.
 */
export interface ChartViewOption {
  id: string
  label: string
  direction: readonly [number, number, number]
}

export interface ChartViews {
  /** Prefixes the current view on the button — "View: Front". */
  buttonLabel: string
  activeId: string
  options: ChartViewOption[]
}

export interface Odontogram {
  upper: Tooth[]
  lower: Tooth[]
  /** What the Chart Layers menu offers. */
  layers: ChartLayers
  /** What the View menu offers, and which one it opens on. */
  views: ChartViews
  /** Chart types, top-right of the panel. */
  charts: ChartTab[]
  activeChartId: string
  archViews: ArchView[]
  activeArchView: ArchView
  /** Copy for the 3D arch, which is the whole odontogram. */
  model: {
    /**
     * How to drive the 3D arch. Lives behind the "?" corner button rather than
     * on a permanent line under the model, and is offered once, dismissibly,
     * on a first visit.
     */
    help: ChartHelp
    /** Prefixes the tooth number once one is. */
    toothLabel: string
    /** Category named when a tooth is selected — singular, one tooth is named. */
    typeLabels: Record<ToothType, string>
  }
  /**
   * The overlay the "Perio Chart" tab switches on. Held beside `model` rather
   * than inside it because it is a second reading OF the same dentition, not
   * another way of drawing it.
   */
  perio: PerioChart
  /**
   * The overlay the "Endo Chart" tab switches on. Tab-scoped like `perio` —
   * see the warning on `EndoChart` for why the pulp is not on by default.
   */
  endo: EndoChart
  /**
   * Posts and cores. Tab-scoped WITH the endo chart rather than on its own: a
   * post lives in a treated canal, so it belongs to the same reading as the
   * root filling round it — see `postCoreByFdi`.
   */
  postCore: PostCoreChart
  /**
   * Carious lesions. Held beside `perio` but NOT beside it in behaviour: the
   * perio layer belongs to one tab, this one is on in every chart type.
   */
  caries: CariesChart
  /**
   * Implant fixtures. Like `caries` this is a property of the site rather than
   * a reading for one tab, so it is drawn in every chart type.
   */
  implants: ImplantChart
  /** Corner affordances, bottom-left and bottom-right of the chart panel. */
  footerActions: { start: RailItem; end: RailItem }
  /** The legend's own heading, and its collapse toggle's two names. */
  legend: { title: string; hideLabel: string; showLabel: string }
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
    name: 'Julia Smith',
    // Stock portrait standing in for a patient photo — not a real patient.
    // Clearing this line drops the header back to the initials tile.
    photo: patientPhoto,
    initials: 'JS',
    // Synthetic record ID — a placeholder, not a real identifier format.
    id: '5340872',
    idLabel: 'ID',
    sex: { label: 'Female', icon: 'sexFemale' },
    dateOfBirthLabel: 'Date of birth',
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
    // Charts is the only section this frontend renders, so it is both the
    // default selection and the only `available: true` tab. The rest stay
    // listed — the row is the real information architecture — but they cannot
    // be activated until something exists behind them.
    activeTabId: 'charts',
    unavailableTabHint: 'Not built yet',
    moreLabel: 'More',
    lessLabel: 'Show less',
    breadcrumb: { parent: 'Patients' },
    /*
     * Four sections sit in the sidebar and the other thirteen fold under
     * "More". `available` and `primary` are independent on purpose: General,
     * Clinical notes and Imaging are top-level in the sidebar and STILL not
     * built, so they render as reachable, labelled, non-activating targets
     * rather than links that silently do nothing.
     */
    tabs: [
      { id: 'general', label: 'General', icon: 'general', available: false, primary: true },
      { id: 'charts', label: 'Charts', icon: 'charts', available: true, primary: true },
      {
        id: 'clinical-notes',
        label: 'Clinical notes',
        icon: 'clinicalNotes',
        available: false,
        primary: true,
      },
      { id: 'imaging', label: 'Imaging', icon: 'imaging', available: false, primary: true },
      { id: 'photos', label: 'Photos', icon: 'photos', available: false, primary: false },
      { id: 'eclaims', label: 'eClaims', icon: 'eclaims', available: false, primary: false },
      { id: 'ledger', label: 'Ledger', icon: 'ledger', available: false, primary: false },
      {
        id: 'implant-exam',
        label: 'Implant exam',
        icon: 'implantExam',
        available: false,
        primary: false,
      },
      { id: 'smile', label: 'Smile', icon: 'smile', available: false, primary: false },
      { id: 'checklists', label: 'Checklists', icon: 'checklists', available: false, primary: false },
      { id: 'lab', label: 'Lab', icon: 'lab', available: false, primary: false },
      { id: 'erx', label: 'eRx', icon: 'erx', available: false, primary: false },
      { id: 'docs', label: 'Docs', icon: 'docs', available: false, primary: false },
      { id: 'forms', label: 'Forms', icon: 'forms', available: false, primary: false },
      { id: 'alerts', label: 'Alerts', icon: 'alerts', available: false, primary: false },
      {
        id: 'shared-care',
        label: 'SharedCare',
        icon: 'sharedCare',
        available: false,
        primary: false,
      },
      { id: 's-pad', label: 'S Pad', icon: 'sPad', available: false, primary: false },
    ],
  },

  odontogram: {
    upper: UPPER_FDI.map(tooth),
    lower: LOWER_FDI.map(tooth),
    layers: {
      buttonLabel: 'Chart Layers',
      title: 'Chart Layers',
      subtitle: 'Choose what to show on the chart',
      showAll: 'Show all',
      reset: 'Reset',
      unavailableHint: 'Not charted yet — this mark is not drawn on the model',
      groups: [
        {
          id: 'structure',
          items: [
            {
              id: 'findings',
              label: 'Findings',
              description: 'Caries, fractures, lesions, missing',
              swatch: 'caries',
              available: true,
              on: true,
            },
            {
              id: 'treatments',
              label: 'Treatments',
              description: 'Implants, restorations, root canals',
              swatch: 'implant',
              available: true,
              on: true,
            },
            {
              id: 'labels',
              label: 'Tooth labels',
              description: 'Tooth numbers and quadrant',
              swatch: 'label',
              available: true,
              on: true,
            },
            {
              id: 'measurements',
              label: 'Measurements',
              description: 'Probing depth, recession, BOP',
              swatch: 'measure',
              available: true,
              on: true,
            },
          ],
        },
        {
          id: 'findings',
          title: 'Customize findings',
          items: [
            { id: 'caries', label: 'Caries', swatch: 'caries', available: true, on: true },
            {
              id: 'fractures',
              label: 'Fractures',
              swatch: 'fracture',
              available: false,
              on: false,
            },
            { id: 'lesions', label: 'Lesions', swatch: 'lesion', available: false, on: false },
            {
              id: 'missing',
              label: 'Missing teeth',
              swatch: 'outline',
              available: false,
              on: false,
            },
          ],
        },
        {
          id: 'treatments',
          title: 'Customize treatments',
          items: [
            { id: 'implants', label: 'Implants', swatch: 'implant', available: true, on: true },
            { id: 'rootCanals', label: 'Root canals', swatch: 'endo', available: true, on: true },
            {
              id: 'restorations',
              label: 'Crowns / Restorations',
              swatch: 'restoration',
              available: false,
              on: false,
            },
            { id: 'postCore', label: 'Post & Core', swatch: 'postCore', available: true, on: true },
          ],
        },
      ],
    },

    views: {
      buttonLabel: 'View',
      activeId: 'front',
      /*
       * +X is the patient's LEFT and +Z is out of the face, so a camera on
       * −X looks at the patient's right side. The lateral pair is named for
       * the PATIENT's side, never the viewer's — the same rule `sideFromFdi`
       * follows, and for the same reason.
       */
      options: [
        { id: 'front', label: 'Front', direction: [0, 0.18, 1] },
        { id: 'right', label: 'Right', direction: [-1, 0.18, 0.12] },
        { id: 'left', label: 'Left', direction: [1, 0.18, 0.12] },
        { id: 'back', label: 'Back', direction: [0, 0.18, -1] },
        // Looking UP at the uppers' biting surfaces, and DOWN at the lowers'.
        { id: 'upper-occlusal', label: 'Upper occlusal', direction: [0, -1, 0.16] },
        { id: 'lower-occlusal', label: 'Lower occlusal', direction: [0, 1, 0.16] },
      ],
    },
    activeChartId: 'dental',
    charts: [
      { id: 'dental', label: 'Dental', enabled: true },
      { id: 'perio', label: 'Perio Chart', enabled: true },
      { id: 'endo', label: 'Endo Chart', enabled: true },
    ],
    archViews: ['upper', 'both', 'lower'],
    activeArchView: 'both',
    model: {
      help: {
        title: 'Getting around the 3D chart',
        gestures: [
          { id: 'rotate', gesture: 'Drag', short: 'rotate', action: 'Rotate the arch' },
          { id: 'move', gesture: 'Right-drag', short: 'move', action: 'Move the arch' },
          { id: 'zoom', gesture: 'Scroll', short: 'zoom', action: 'Zoom in and out' },
          {
            id: 'select',
            gesture: 'Click a tooth',
            short: 'select it',
            action: 'Select it and show its findings',
          },
        ],
        tipTitle: 'Getting around',
        dismissLabel: 'Dismiss tip',
      },
      toothLabel: 'Tooth',
      typeLabels: {
        molar: 'Molar',
        premolar: 'Premolar',
        canine: 'Canine',
        incisor: 'Incisor',
      },
    },
    perio: {
      disclaimer: 'Sample readings — not a signed periodontal exam',
      hint: 'Open its probing readings',
      flagDepth: 4,
      unit: 'mm',
      legend: [
        {
          id: 'margin',
          label: 'Gingival margin',
          description: 'Traced on the cemento-enamel junction of every tooth',
        },
        {
          id: 'pocket',
          label: 'Probing depth 4 mm and over',
          description: 'Shaded from the margin down to the base of the pocket',
        },
      ],
      labels: {
        recession: 'Recession',
        pocket: 'Probing depth',
        bleeding: 'Bleeds on probing',
        noBleeding: 'No bleeding',
        unprobed: 'No probing recorded',
        site: 'Deepest site',
      },
      siteLabels: {
        // Uppers are probed against the palate, lowers against the tongue.
        // Same six sites, different word for one aspect.
        upper: {
          distoLingual: 'Disto Palatal',
          lingual: 'Palatal',
          mesioLingual: 'Mesio Palatal',
          distoBuccal: 'Disto Buccal',
          buccal: 'Buccal',
          mesioBuccal: 'Mesio Buccal',
        },
        lower: {
          distoLingual: 'Disto Lingual',
          lingual: 'Lingual',
          mesioLingual: 'Mesio Lingual',
          distoBuccal: 'Disto Buccal',
          buccal: 'Buccal',
          mesioBuccal: 'Mesio Buccal',
        },
      },
      measures: [
        {
          id: 'pocketDepth',
          label: 'Probing depth',
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          // A probe that bottoms out is recorded as "deeper than the scale",
          // not silently as 12 — the distinction matters to the diagnosis.
          overflow: { value: 13, label: '>12' },
        },
        {
          id: 'recession',
          label: 'Recession',
          // Runs negative: a margin sitting coronal of the junction is
          // swelling, and a scale starting at zero cannot record it.
          values: [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        },
      ],
      conditions: [
        { id: 'bleeding', label: 'Bleeding' },
        { id: 'plaque', label: 'Plaque' },
        { id: 'pus', label: 'Pus' },
        { id: 'tartar', label: 'Tartar' },
      ],
      panel: {
        titlePrefix: 'Tooth',
        close: 'Close tooth details',
        toothRail: 'Select a tooth',
        conditionsTitle: 'Findings',
        unprobedTitle: 'Not yet probed',
        unprobedBody:
          'No periodontal readings have been recorded for this tooth in the current exam.',
        healthyTitle: 'No issues found',
        healthyBody:
          'All six sites probe within normal limits, with no bleeding, plaque, pus or tartar recorded.',
      },
      /*
       * Ten teeth probed at six sites each — enough to show the layer and the
       * panel reading properly without implying a full-mouth exam has been
       * charted. Depths run 0–7 mm and recession −2 to 3 mm, which is the
       * range a real chart uses, but every value here is invented.
       *
       * The set deliberately covers all three states the panel has to tell
       * apart: teeth with real findings, teeth examined and FOUND HEALTHY
       * (11 and 21), and — by being absent — teeth never probed at all.
       */
      readings: [
        perioTooth(
          16,
          [site(5, 2, 'bleeding'), site(6, 2, 'bleeding', 'tartar'), site(4, 1)],
          [site(5, 1, 'bleeding'), site(4, 1), site(4, 1)],
        ),
        perioTooth(13, [site(3, 2), site(4, 3), site(3, 2)], [site(3, 1), site(2, 1), site(3, 1)]),
        // The reference tooth: swelling on the buccal rather than recession,
        // pus at mid-buccal, bleeding round the palatal.
        perioTooth(
          23,
          [site(1, -2), site(2, -2, 'pus'), site(0, 0)],
          [site(1, 0, 'bleeding'), site(2, 0), site(2, -1, 'bleeding', 'plaque')],
        ),
        perioTooth(
          24,
          [site(4, 1), site(5, 1, 'bleeding'), site(4, 1)],
          [site(3, 0), site(3, 0), site(4, 1, 'plaque')],
        ),
        perioTooth(
          26,
          [site(6, 0, 'bleeding', 'tartar'), site(7, 0, 'bleeding', 'pus'), site(5, 0, 'bleeding')],
          [site(5, 1), site(4, 1), site(5, 1, 'plaque')],
        ),
        perioTooth(
          36,
          [site(5, 2), site(6, 2, 'bleeding'), site(5, 2, 'bleeding')],
          [site(4, 1), site(4, 1, 'tartar'), site(4, 1)],
        ),
        perioTooth(
          43,
          [site(3, 2), site(4, 3), site(3, 2)],
          [site(3, 1, 'tartar'), site(3, 1, 'tartar'), site(3, 1)],
        ),
        perioTooth(46, [site(4, 1), site(5, 1), site(4, 1)], [site(4, 1), site(3, 0), site(4, 1)]),
        // Examined and sound — NOT the same as never probed, which is why
        // both states exist in the data and the panel words them differently.
        perioTooth(11, [site(2, 0), site(2, 0), site(3, 0)], [site(2, 0), site(3, 0), site(2, 0)]),
        perioTooth(21, [site(3, 0), site(2, 0), site(2, 0)], [site(2, 0), site(2, 0), site(3, 0)]),
      ],
    },
    caries: {
      disclaimer: 'Sample finding — not a signed caries diagnosis',
      badge: 'Caries',
      title: 'Caries found',
      legend: {
        id: 'caries',
        label: 'Carious lesion',
        description: 'Stained on the affected surface of the tooth',
      },
      surfaceLabels: {
        occlusal: 'Occlusal',
        mesial: 'Mesial',
        distal: 'Distal',
        buccal: 'Buccal',
        lingual: 'Lingual',
      },
      /*
       * Only the codes this dataset actually uses are named. ICDAS runs 0–6;
       * listing the two in play keeps the view from implying the chart knows
       * how to describe a scale it has never been given.
       */
      icdasLabels: {
        4: 'Dark shadow from underlying dentin',
      },
      labels: {
        surfaces: 'Surface',
        icdas: 'ICDAS',
        extent: 'Extent',
        detected: 'Detected',
        plan: 'Plan',
      },
      /*
       * Two lesions, both occlusal and both at the same ICDAS 4 — the upper-
       * right first molar (FDI 16, badged Universal 3) and the lower-left first
       * premolar (FDI 34, badged Universal 21). Occlusal caries at those two
       * sites is the commonest presentation there is, which is why they stand
       * as the examples, but every word of both is invented.
       *
       * The notes differ because the teeth do: a molar has a central fossa with
       * fissures running out of it in two directions, a lower first premolar has
       * one mesiodistal groove between two fossae. Copying the molar's wording
       * onto the premolar would have described anatomy that tooth does not have.
       */
      findings: [
        {
          fdi: 16,
          surfaces: ['occlusal'],
          icdas: 4,
          extent: 'Into dentin, no cavitation of the enamel surface',
          note: 'Staining through the central fossa and along both fissures. Catches on the probe.',
          detectedOn: '12.11.22',
          plan: 'Restoration planned — not yet scheduled',
        },
        {
          fdi: 34,
          surfaces: ['occlusal'],
          icdas: 4,
          extent: 'Into dentin, no cavitation of the enamel surface',
          note: 'Staining along the central groove, heaviest in the distal fossa. Catches on the probe.',
          detectedOn: '12.11.22',
          plan: 'Restoration planned — not yet scheduled',
        },
      ],
      panel: {
        titlePrefix: 'Tooth',
        close: 'Close tooth details',
        surfacesTitle: 'Surfaces',
        tissueTitle: 'Depth',
        cavitationTitle: 'Cavitation',
        gradeTitle: 'Grade',
        decisionTitle: 'Decision',
        tissues: [
          { id: 'dentin', label: 'Dentin' },
          { id: 'enamel', label: 'Enamel' },
        ],
        cavitations: [
          { id: 'cavitated', label: 'Cavitation' },
          { id: 'intact', label: 'No cavitation' },
        ],
        grades: [
          { id: 'C1', label: 'C1' },
          { id: 'C2', label: 'C2' },
          { id: 'C3', label: 'C3' },
          { id: 'C4', label: 'C4' },
        ],
        decisions: [
          { id: 'monitor', label: 'Monitor', notice: '{tooth} is set to be monitored' },
          { id: 'treat', label: 'Treat', notice: '{tooth} needs treatment' },
        ],
        dismissNotice: 'Dismiss',
        toothRail: 'Select a tooth',
        toothRailFlag: 'caries charted',
        ungraded: 'Not graded',
        surfaceLabelOverrides: { upperLingual: 'Palatal', anteriorOcclusal: 'Incisal' },
        reset: 'Reset',
        resetConfirm: {
          title: 'Reset caries details?',
          body: 'Everything recorded for {tooth} — every surface and the decision — will be cleared.',
          cancel: 'Cancel',
          confirm: 'Reset',
        },
      },
      /*
       * Seeded to agree with the two findings above: both occlusal, both "into
       * dentin, no cavitation", both planned for restoration. The C2 grade is a
       * PLACEHOLDER chosen to sit with that wording — it was not derived from
       * the ICDAS code, and a clinician decides how the two scales map.
       */
      assessments: [
        {
          fdi: 16,
          surfaces: { occlusal: { tissue: 'dentin', cavitation: 'intact', grade: 'C2' } },
          decision: 'treat',
        },
        {
          fdi: 34,
          surfaces: { occlusal: { tissue: 'dentin', cavitation: 'intact', grade: 'C2' } },
          decision: 'treat',
        },
      ],
    },
    endo: {
      disclaimer: 'Sample findings — canal paths are diagrammatic, not radiographic',
      hint: 'View its canal record',
      hoverLabel: 'View canal record',
      badge: 'Root canal',
      title: 'Root canal',
      legend: [
        {
          id: 'endo-canal',
          label: 'Root canal system',
          description: 'Pulp chamber and canals, drawn through the tooth',
        },
        {
          id: 'endo-needed',
          label: 'Treatment needed',
          description: 'Charted for root canal treatment, not yet started',
        },
      ],
      statusLabels: {
        needed: 'Treatment needed',
        inProgress: 'In progress',
        completed: 'Completed',
      },
      labels: {
        canals: 'Canals',
        status: 'Status',
        diagnosis: 'Pulpal',
        periapical: 'Periapical',
        detected: 'Charted',
        plan: 'Plan',
      },
      /*
       * Two teeth, both upper left — FDI 25 and 26, which the badges number
       * Universal 13 and 14. The canal counts are the textbook ones for those
       * two positions (a single canal in the second premolar, three in the
       * first molar), which is why they stand as the example, but this
       * patient's canals were never located on a radiograph and the drawn
       * paths are laid out from each tooth's measured size. See EndoChart.
       *
       * ⚠️ The two posted incisors (FDI 11 and 21) are deliberately NOT here.
       * A post occupies the canal it was cemented into, so drawing the pulp
       * system as well would show two things in one space — see PostCoreChart.
       */
      findings: [
        {
          fdi: 25,
          canals: ['Single canal'],
          status: 'needed',
          diagnosis: 'Symptomatic irreversible pulpitis',
          periapical: 'Symptomatic apical periodontitis',
          note: 'Lingering response to cold, tender to percussion. Canal count to be confirmed on the working radiograph.',
          detectedOn: '04.02.24',
          plan: 'Root canal treatment planned — not yet scheduled',
        },
        {
          fdi: 26,
          canals: ['Mesiobuccal', 'Distobuccal', 'Palatal'],
          status: 'needed',
          diagnosis: 'Pulp necrosis',
          periapical: 'Asymptomatic apical periodontitis',
          note: 'No response to cold. A second mesiobuccal canal is common at this site and is not charted until located.',
          detectedOn: '04.02.24',
          plan: 'Root canal treatment planned — not yet scheduled',
        },
      ],
    },
    postCore: {
      disclaimer: 'Sample restorative record — confirm against the clinical notes',
      badge: 'Post & core',
      title: 'Post and core',
      unit: 'mm',
      legend: {
        id: 'postCore',
        label: 'Post & core',
        description: 'Post drawn down the treated canal, under the core',
      },
      labels: {
        system: 'System',
        post: 'Post',
        material: 'Core',
        placed: 'Placed',
        plan: 'Plan',
      },
      /*
       * The two upper central incisors — FDI 11 and 21, which the badges
       * number Universal 8 and 9. Both are root-treated: a post is cemented
       * into a prepared canal and cannot exist without one. The treatment is
       * recorded HERE rather than as a second entry in the endo chart, so the
       * post is the only thing drawn in the canal it fills.
       *
       * The diameter and length are a common stock size rather than this
       * patient's, and they DRIVE THE DRAWN POST, so they are stated on the
       * panel instead of being left implicit in the model.
       */
      restorations: [
        {
          fdi: 11,
          system: 'Placeholder system — not taken from a record',
          diameter: 1.4,
          length: 9,
          material: 'Composite core',
          placedOn: '18.06.23',
          note: 'Post drawn from the charted diameter and length, not from a radiograph.',
          plan: 'Review at recall — no treatment planned',
        },
        {
          fdi: 21,
          system: 'Placeholder system — not taken from a record',
          diameter: 1.4,
          length: 9,
          material: 'Composite core',
          placedOn: '18.06.23',
          note: 'Post drawn from the charted diameter and length, not from a radiograph.',
          plan: 'Review at recall — no treatment planned',
        },
      ],
    },

    implants: {
      disclaimer: 'Sample fixture record — confirm against the surgical notes',
      badge: 'Implant',
      title: 'Implant fixture',
      unit: 'mm',
      legend: {
        id: 'implant',
        label: 'Implant fixture',
        description: 'Titanium screw drawn in place of the natural root',
      },
      labels: {
        system: 'System',
        fixture: 'Fixture',
        placed: 'Placed',
        restoration: 'Restoration',
        plan: 'Plan',
      },
      /*
       * Two fixtures: the lower-RIGHT first premolar (FDI 44, Universal 28)
       * and the lower-LEFT second molar (FDI 37, Universal 18) — which is what
       * the badges on those teeth read.
       *
       * The diameters and lengths are common stock sizes rather than this
       * patient's, and they DRIVE THE DRAWN SCREW: `ImplantLayer` builds the
       * fixture from these two figures, so the model and the panel can never
       * state different sizes. That is also why they are 13 mm rather than the
       * 8–10 mm a posterior mandible often takes — at the shorter lengths the
       * drawn screw stops well above the neighbouring roots and reads as a
       * peg rather than as a fixture in bone. 13 mm is a real orderable
       * length, but it is chosen here to sit at root depth, not clinically.
       */
      fixtures: [
        {
          fdi: 44,
          system: 'Placeholder system — not taken from a record',
          diameter: 4.1,
          length: 13,
          placedOn: '03.09.21',
          restoration: 'Screw-retained ceramic crown',
          note: 'Fixture drawn from the charted diameter and length, not from a radiograph.',
          plan: 'Review at recall — no treatment planned',
        },
        {
          fdi: 37,
          system: 'Placeholder system — not taken from a record',
          // Wider than the premolar's, which is the shape a molar site takes:
          // more room across the ridge. Still a stock size, not a measurement.
          diameter: 4.8,
          length: 13,
          placedOn: '11.04.22',
          restoration: 'Cement-retained ceramic crown',
          note: 'Fixture drawn from the charted diameter and length, not from a radiograph.',
          plan: 'Review at recall — no treatment planned',
        },
      ],
    },
    legend: { title: 'Legend', hideLabel: 'Hide legend', showLabel: 'Show legend' },
    footerActions: {
      start: { id: 'chart-history', label: 'Chart history', icon: 'history' },
      end: { id: 'chart-help', label: 'Charting help', icon: 'help' },
    },
  },
}

