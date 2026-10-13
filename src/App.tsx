import { useSyncExternalStore } from 'react'

import Login from './screens/Login.tsx'
import PatientChart from './screens/PatientChart.tsx'
import Patients from './screens/Patients.tsx'
import Schedule from './screens/Schedule.tsx'

/**
 * The product's five screens, mounted directly — no app-level chrome above
 * them. Each brings its own layout; the four inside the product bring the rail.
 *
 * There is still no router LIBRARY. Which screen is up lives in the URL's
 * hash (`#/login`, `#/schedule`, `#/patients`, `#/chart`, `#/details`) and the
 * screens ask to change it through callbacks: signing in opens the list, a row
 * in the list opens the chart, the chart's sidebar opens the patient's full
 * details, the breadcrumbs lead back, and the rail's Schedule and Patients
 * items lead to their screens from anywhere.
 *
 * It moved from a `useState` into the hash when the third screen arrived, for
 * two reasons that state could not cover: a reload has to stay on the screen
 * being worked on instead of dropping back to the login, and the browser's
 * Back button has to step between screens instead of leaving the app. A hash
 * needs no server rewrite, so it deploys as it is.
 *
 * ⚠ The hash is navigation, not access control. There is no authentication in
 *   this frontend: `#/chart` opens the chart whether or not the login form was
 *   ever submitted. Guarding a screen is a job for a real auth layer.
 *
 * When screens need parameters (which patient?) or nesting, that is the point
 * to adopt a router library rather than grow this.
 */
const SCREENS = ['login', 'schedule', 'patients', 'chart', 'imaging', 'details'] as const
type Screen = (typeof SCREENS)[number]

/** A fresh visit — no hash, or one that names nothing — starts at the login. */
function readScreen(): Screen {
  const id = window.location.hash.replace(/^#\/?/, '')
  return SCREENS.find((screen) => screen === id) ?? 'login'
}

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

function go(screen: Screen) {
  window.location.hash = `/${screen}`
}

export default function App() {
  const screen = useSyncExternalStore(subscribe, readScreen)

  /**
   * A rail item was picked. Two sections have a screen behind them, and Log
   * out — in the menu under the rail's avatar — leads back to the login. The
   * rest do not exist yet; the rail draws them disabled and never reports them.
   *
   * ⚠ "Log out" only changes screen. There is no session in this frontend to
   *   end — see the note on the hash above.
   */
  const navigate = (id: string) => {
    if (id === 'schedule' || id === 'patients') go(id)
    else if (id === 'log-out') go('login')
  }

  if (screen === 'login') return <Login onSignIn={() => go('patients')} />
  if (screen === 'schedule') {
    return <Schedule onOpenChart={() => go('chart')} onNavigate={navigate} />
  }
  if (screen === 'patients') {
    return <Patients onOpenChart={() => go('chart')} onNavigate={navigate} />
  }
  /*
   * The patient record. Its sections share ONE screen — the patient sidebar on
   * the left, the section on the right — so `#/chart`, `#/imaging` and
   * `#/details` are the same component told which section is up. That keeps the sidebar mounted
   * across the switch instead of redrawing it, and still gives each section an
   * address to reload on and to step Back to.
   */
  return (
    <PatientChart
      section={screen === 'imaging' ? 'imaging' : screen === 'details' ? 'details' : 'charts'}
      onOpenSection={(id) => go(id === 'imaging' ? 'imaging' : 'chart')}
      onOpenPatients={() => go('patients')}
      onOpenDetails={() => go('details')}
      onNavigate={navigate}
    />
  )
}
