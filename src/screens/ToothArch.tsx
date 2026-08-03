import { Suspense, useEffect, useRef } from 'react'
import { Canvas, invalidate, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { NeutralToneMapping, type PerspectiveCamera, Vector3 } from 'three'

import type { Tooth } from '../data/patientChart.ts'
import { ARCH_BOUNDS, toothModelByFdi } from '../data/toothModels.ts'
import { enamel, useToothGeometries } from './toothScene.ts'
import { Studio } from './ToothStudio.tsx'

/**
 * The dentition as it actually sits in the jaw — the whole odontogram.
 *
 * The 32 meshes from `teeth.glb`, put back where they came from. The export
 * squares every tooth up at the origin and records the transform it removed;
 * setting that transform back on the node restores the real arch exactly, down
 * to the lean of each incisor. No arch
 * curve is modelled or guessed here — this IS the patient's anatomy from the
 * blend, which is the whole reason for the tab.
 *
 * One canvas, one WebGL context, and `frameloop="demand"`: frames are drawn
 * while the user is dragging and while the orbit is still gliding to a stop,
 * then it goes quiet.
 */

/** Middle of the dentition, and how big it is, in metres. */
const CENTRE = ARCH_BOUNDS.min.map((low, axis) => (low + ARCH_BOUNDS.max[axis]) / 2)
const SIZE = ARCH_BOUNDS.min.map((low, axis) => ARCH_BOUNDS.max[axis] - low)

/** Front three-quarter, above the occlusal plane so the arch reads as a curve. */
const START_DIRECTION = new Vector3(0.38, 0.58, 0.9).normalize()

/** Slack left around the dentition once framed. */
const FRAMING = 1.06

const ZOOM_RANGE = { min: 0.05, max: 0.4 }

/**
 * Back the camera off far enough to hold the whole dentition.
 *
 * Sized from the real measured bounds rather than a hand-picked distance, so
 * the teeth fill the stage on any panel.
 *
 * The radius is the arch's HORIZONTAL diagonal, not its longest side: the user
 * can spin the dentition to any yaw and tip it flat, and looking straight down
 * at a 68 × 60 mm arch turned corner-on needs the 90 mm across it. Sizing to
 * the longest side instead lets the molars slide off the top the moment
 * somebody rotates to the occlusal view. The full 3D diagonal would also cover
 * it, but only by starting the view too far out to be worth it.
 */
function frame(camera: PerspectiveCamera, width: number, height: number) {
  const halfFov = (camera.fov * Math.PI) / 360
  const aspect = width / height
  const radius = Math.hypot(SIZE[0], SIZE[2]) / 2

  const distance = (radius / Math.tan(halfFov)) * Math.max(1, 1 / aspect) * FRAMING
  camera.position.copy(START_DIRECTION).multiplyScalar(distance)
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()
}

/**
 * Mouse-driven orbit.
 *
 * Three's own controls rather than a helper library — this is the only place
 * the app needs them, and the wiring is mostly telling a demand-driven canvas
 * when to redraw. `update()` reports whether the camera actually moved, which
 * is what keeps the damped glide rendering after the pointer is released and
 * lets it stop cleanly instead of holding a permanent 60fps loop.
 */
function Orbit() {
  const { camera, gl, get } = useThree()
  const controls = useRef<OrbitControls | null>(null)

  useEffect(() => {
    // Frame BEFORE the controls exist: OrbitControls reads the camera's
    // position once to seed its orbit, so moving the camera afterwards gets
    // snapped straight back on the next update.
    const { width, height } = get().size
    frame(camera as PerspectiveCamera, width, height)

    const orbit = new OrbitControls(camera, gl.domElement)
    orbit.enableDamping = true
    orbit.dampingFactor = 0.12
    orbit.enablePan = false
    orbit.minDistance = ZOOM_RANGE.min
    orbit.maxDistance = ZOOM_RANGE.max
    orbit.rotateSpeed = 0.75
    orbit.zoomSpeed = 0.8
    // Wrapped, not passed straight in: `invalidate` reads its first argument as
    // a renderer state, and the listener would hand it a DOM-ish event.
    const redraw = () => invalidate()
    orbit.addEventListener('change', redraw)
    controls.current = orbit
    invalidate()

    return () => {
      orbit.removeEventListener('change', redraw)
      orbit.dispose()
      controls.current = null
    }
  }, [camera, gl, get])

  useFrame(() => {
    if (controls.current?.update()) invalidate()
  })

  return null
}

function Arch({
  teeth,
  selectedFdi,
  onSelect,
}: {
  teeth: Tooth[]
  selectedFdi: number | null
  onSelect: (fdi: number | null) => void
}) {
  const geometries = useToothGeometries()

  return (
    // The blend measures from the figure's feet, so the dentition sits 1.67 m
    // up. Pulling it back to the origin is what makes it orbitable.
    <group position={[-CENTRE[0], -CENTRE[1], -CENTRE[2]]}>
      {teeth.map((tooth) => {
        const model = toothModelByFdi[tooth.fdi]
        const geometry = geometries.get(model.node)
        if (!geometry) return null

        return (
          <mesh
            key={tooth.fdi}
            geometry={geometry}
            position={model.archPosition}
            quaternion={model.archRotation}
            material={enamel(tooth.status, selectedFdi !== null && selectedFdi !== tooth.fdi)}
            onClick={(event) => {
              event.stopPropagation()
              onSelect(selectedFdi === tooth.fdi ? null : tooth.fdi)
            }}
            onPointerOver={(event) => {
              event.stopPropagation()
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              document.body.style.cursor = ''
            }}
          />
        )
      })}
    </group>
  )
}

export function ToothArch3D({
  teeth,
  selectedFdi,
  onSelect,
}: {
  teeth: Tooth[]
  selectedFdi: number | null
  onSelect: (fdi: number | null) => void
}) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ fov: 32, near: 0.005, far: 5 }}
      gl={{ antialias: true, alpha: true, toneMapping: NeutralToneMapping }}
      // Clicking empty space clears the selection, the way the number row's
      // second click does in the flat chart.
      onPointerMissed={() => onSelect(null)}
      style={{ display: 'block', cursor: 'grab' }}
    >
      <Studio />
      <Suspense fallback={null}>
        <Arch teeth={teeth} selectedFdi={selectedFdi} onSelect={onSelect} />
      </Suspense>
      <Orbit />
    </Canvas>
  )
}
