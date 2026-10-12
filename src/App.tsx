import { useState } from 'react'

import PatientChart from './screens/PatientChart.tsx'
import Patients from './screens/Patients.tsx'

/**
 * The product's two screens, mounted directly — no app-level chrome above
 * them. Each brings its own rail and header.
 *
 * There is still no router. Which screen is up is one piece of state here, and
 * the screens ask to change it through callbacks: the chart's breadcrumb (and
 * its rail) lead back to the list, a row in the list opens the chart. That is
 * enough for two screens; it also means the URL never changes, so the browser's
 * Back button and a page reload both land on the chart. A third screen, or a
 * need for links, is the point to bring in a real router rather than grow this.
 */
type Screen = 'patients' | 'chart'

export default function App() {
  // Opens on the chart, as it did when the chart was the only screen.
  const [screen, setScreen] = useState<Screen>('chart')

  return screen === 'patients' ? (
    <Patients onOpenChart={() => setScreen('chart')} />
  ) : (
    <PatientChart onOpenPatients={() => setScreen('patients')} />
  )
}
