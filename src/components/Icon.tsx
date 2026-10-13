/**
 * The icon layer shared by every screen.
 *
 * Datasets name an icon by SEMANTIC KEY (`IconName`); this file is the one
 * place a key becomes a component, so swapping a glyph is one edit here rather
 * than one per call site. It was extracted from `PatientChart.tsx` when the
 * Patients list became the second screen to need it.
 *
 * Glyphs are deep-imported one by one — never from the `@mui/icons-material`
 * barrel, which drags the whole icon set through the bundler.
 *
 * ⚠ `Storybook.tsx` still declares its own `ICONS` with a different key set.
 *   It is a separate app; fold it into this record when it next changes.
 */

import type { SvgIconComponent } from '@mui/icons-material'

import AddOutlined from '@mui/icons-material/AddOutlined'
import AddPhotoAlternateOutlined from '@mui/icons-material/AddPhotoAlternateOutlined'
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined'
import ArticleOutlined from '@mui/icons-material/ArticleOutlined'
import AssignmentIndOutlined from '@mui/icons-material/AssignmentIndOutlined'
import BarChartOutlined from '@mui/icons-material/BarChartOutlined'
import BuildOutlined from '@mui/icons-material/BuildOutlined'
import CachedOutlined from '@mui/icons-material/CachedOutlined'
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import CallOutlined from '@mui/icons-material/CallOutlined'
import CheckBoxOutlined from '@mui/icons-material/CheckBoxOutlined'
import CheckOutlined from '@mui/icons-material/CheckOutlined'
import CloseOutlined from '@mui/icons-material/CloseOutlined'
import ContactMailOutlined from '@mui/icons-material/ContactMailOutlined'
import ContactPageOutlined from '@mui/icons-material/ContactPageOutlined'
import ContentPasteOutlined from '@mui/icons-material/ContentPasteOutlined'
import CreditCardOutlined from '@mui/icons-material/CreditCardOutlined'
import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import DynamicFormOutlined from '@mui/icons-material/DynamicFormOutlined'
import EditNoteOutlined from '@mui/icons-material/EditNoteOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined'
import FemaleOutlined from '@mui/icons-material/FemaleOutlined'
import ForwardToInboxOutlined from '@mui/icons-material/ForwardToInboxOutlined'
import HelpOutlined from '@mui/icons-material/HelpOutlined'
import HistoryOutlined from '@mui/icons-material/HistoryOutlined'
import HubOutlined from '@mui/icons-material/HubOutlined'
import KeyboardTabOutlined from '@mui/icons-material/KeyboardTabOutlined'
import LayersOutlined from '@mui/icons-material/LayersOutlined'
import LibraryBooksOutlined from '@mui/icons-material/LibraryBooksOutlined'
import MaleOutlined from '@mui/icons-material/MaleOutlined'
import MedicationOutlined from '@mui/icons-material/MedicationOutlined'
import MenuBookOutlined from '@mui/icons-material/MenuBookOutlined'
import MoreHorizOutlined from '@mui/icons-material/MoreHorizOutlined'
import NearMeOutlined from '@mui/icons-material/NearMeOutlined'
import NotificationImportantOutlined from '@mui/icons-material/NotificationImportantOutlined'
import PersonOutlined from '@mui/icons-material/PersonOutlined'
import PhotoOutlined from '@mui/icons-material/PhotoOutlined'
import PostAddOutlined from '@mui/icons-material/PostAddOutlined'
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined'
import RestartAltOutlined from '@mui/icons-material/RestartAltOutlined'
import ScienceOutlined from '@mui/icons-material/ScienceOutlined'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import SentimentSatisfiedAltOutlined from '@mui/icons-material/SentimentSatisfiedAltOutlined'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'
import ShareOutlined from '@mui/icons-material/ShareOutlined'
import ShoppingBasketOutlined from '@mui/icons-material/ShoppingBasketOutlined'
import StickyNote2Outlined from '@mui/icons-material/StickyNote2Outlined'
import SupportAgentOutlined from '@mui/icons-material/SupportAgentOutlined'
import VaccinesOutlined from '@mui/icons-material/VaccinesOutlined'
import ViewInArOutlined from '@mui/icons-material/ViewInArOutlined'
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined'

import type { IconName } from '../data/patientChart.ts'

/** The one place icon names from the dataset become components. */
const ICONS: Record<IconName, SvgIconComponent> = {
  schedule: CalendarMonthOutlined,
  operations: HubOutlined,
  tasks: ContentPasteOutlined,
  billing: CreditCardOutlined,
  settings: SettingsOutlined,
  patients: ContactPageOutlined,
  referrals: LibraryBooksOutlined,
  contacts: ContactMailOutlined,
  treatmentPlans: EditNoteOutlined,
  inventory: ShoppingBasketOutlined,
  pharmacy: VaccinesOutlined,
  library: MenuBookOutlined,
  notes: StickyNote2Outlined,
  support: SupportAgentOutlined,
  // The arrow-to-a-bar glyph that used to mean "collapse menu", reused: it
  // reads as leaving, and no dedicated log-out glyph is in the set yet.
  logOut: KeyboardTabOutlined,
  recall: CachedOutlined,
  newForm: PostAddOutlined,
  message: ForwardToInboxOutlined,
  call: CallOutlined,
  sexFemale: FemaleOutlined,
  sexMale: MaleOutlined,
  general: PersonOutlined,
  photos: PhotoOutlined,
  charts: BarChartOutlined,
  eclaims: NearMeOutlined,
  ledger: DescriptionOutlined,
  implantExam: ReceiptLongOutlined,
  smile: SentimentSatisfiedAltOutlined,
  checklists: CheckBoxOutlined,
  lab: ScienceOutlined,
  imaging: AddPhotoAlternateOutlined,
  erx: MedicationOutlined,
  docs: ArticleOutlined,
  forms: DynamicFormOutlined,
  alerts: NotificationImportantOutlined,
  clinicalNotes: AssignmentIndOutlined,
  sharedCare: ShareOutlined,
  sPad: EditNoteOutlined,
  hidden: VisibilityOffOutlined,
  history: HistoryOutlined,
  help: HelpOutlined,
  close: CloseOutlined,
  check: CheckOutlined,
  add: AddOutlined,
  restoration: BuildOutlined,
  // The same glyph as `treatmentPlans` and `sPad` — no new icon, a new meaning.
  edit: EditNoteOutlined,
  pencil: EditOutlined,
  reset: RestartAltOutlined,
  back: ArrowBackOutlined,
  more: MoreHorizOutlined,
  layers: LayersOutlined,
  view3d: ViewInArOutlined,
  dropdown: ExpandMoreOutlined,
  search: SearchOutlined,
  remove: DeleteOutlined,
  // The same glyph as `recall` — the two arrows read as "again", which is what
  // putting a file up a second time is.
  reupload: CachedOutlined,
}

/**
 * `size` is px, or `'inherit'` to take the surrounding text's own size — for a
 * glyph set inline in a label, where it should track the type, not a number.
 */
export function Icon({ name, size = 22 }: { name: IconName; size?: number | 'inherit' }) {
  const Component = ICONS[name]
  return <Component sx={{ fontSize: size }} />
}
