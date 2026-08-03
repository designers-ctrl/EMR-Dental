import PatientChart from './screens/PatientChart.tsx'

/**
 * The product's main page, mounted directly — no app-level chrome above it.
 * PatientChart brings its own rail and header.
 *
 * There is no router. To bring a different screen up, swap the render below.
 */
export default function App() {
  return <PatientChart />
}
