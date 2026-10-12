import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react'
import { Canvas, invalidate, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  BackSide,
  Color,
  MeshBasicMaterial,
  MOUSE,
  NeutralToneMapping,
  type PerspectiveCamera,
  Quaternion,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

import {
  cariesByFdi,
  deepestSite,
  endoByFdi,
  implantsByFdi,
  perioByFdi,
  postCoreByFdi,
  sideFromFdi,
  universalFromFdi,
  type CariesChart,
  type CariesSurface,
  type EndoChart,
  type ImplantChart,
  type PerioChart,
  type PerioSite,
  type PerioToothReading,
  type PostCoreChart,
  type Tooth,
} from '../data/patientChart.ts'
import { ARCH_BOUNDS, toothModelByFdi } from '../data/toothModels.ts'
import { CariesLayer } from './CariesLayer.tsx'
import { EndoLayer } from './EndoLayer.tsx'
import { ImplantLayer } from './ImplantLayer.tsx'
import { PerioLayer } from './PerioLayer.tsx'
import { PostCoreLayer } from './PostCoreLayer.tsx'
import {
  crownOnlyEnamel,
  enamel,
  pocketGeometry,
  pulpWindowEnamel,
  ringHeightAt,
  ringNeck,
  ringRadiusAt,
  useGingivalRings,
  useToothGeometries,
} from './toothScene.ts'
import { Studio } from './ToothStudio.tsx'
import {
  ringAngle,
  seatSite,
  siteDirection,
  toothSurfaceDirection,
  toothSurfaceView,
} from './perioSites.ts'

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

/**
 * Straight on from the front, barely above the occlusal plane.
 *
 * Square to the arch rather than the three-quarter this opened with: a frontal
 * view is the one a chart is read from, it puts the midline down the centre of
 * the canvas, and it keeps the patient's right on the viewer's left all the way
 * across instead of foreshortening one side into the other. The arch still
 * reads as a curve because the posterior teeth recede in perspective.
 *
 * The slight lift is deliberate rather than dead-level: at zero the upper and
 * lower margins line up edge-on and cover each other. The user can still orbit
 * anywhere from here — this only decides where the view starts and where
 * re-framing returns to.
 */
const START_DIRECTION = new Vector3(0, 0.18, 1).normalize()

/**
 * How far above the occlusal plane a focused view sits.
 *
 * Deliberately a lift rather than dead level: at zero the upper and lower
 * gingival margins line up edge-on and hide each other, and those two lines
 * are the whole point of looking at the tooth.
 */
const FOCUS_LIFT = 0.22

/** How long the glide to the front view takes, seconds. */
const FLIGHT_SECONDS = 0.65

/** Slack left around the dentition once framed. */
const FRAMING = 1.06

/**
 * How close the default view sits, as a fraction of a bare fit.
 *
 * Only a hair inside a bare fit now, and that is a consequence of the layout.
 *
 * It was 0.805 — a deliberate 20% crop — while the chart sat under a full-width
 * header band: the stage was much wider than it was tall, so cropping ate empty
 * side space and nothing else. Moving the patient record into a sidebar turned
 * that stage nearly square, and the same 20% started cutting teeth off the top
 * and bottom instead. The crop was only ever free because of the shape of the
 * box, so it went when the shape did.
 *
 * Every label is drawn — see `ToothNumbers` — and the molar badges sit furthest
 * out, so the framing has to hold them too.
 *
 * Folded into `framingDistance` rather than into the `zoom` prop on purpose —
 * `zoom` only applies while flying to a tooth, so a default set there would
 * never reach the opening view.
 */
const DEFAULT_ZOOM = 0.94

/**
 * How far DOWN the dentition sits in the frame, as a fraction of the visible
 * height.
 *
 * Applied by raising the look-at point rather than by moving the model: the
 * arch's own coordinates stay exactly what the blend measured, and only the
 * camera's aim changes. Raising the target drops the subject on screen, which
 * is why the sign reads backwards from the name.
 *
 * Zero — the arch sits centred, 10% higher than the 0.1 it opened at. The lower
 * molar badges hang below the root tips and were running into the bottom of the
 * canvas; centring gives them the room, and the top has it to spare because
 * nothing is drawn above the upper root tips.
 */
const DEFAULT_DROP = 0

/**
 * Extra room left on the BADGE side of a focused tooth, as a fraction of the
 * visible height.
 *
 * A tooth's number — and its depth or caries tag under it — hangs off the ROOT
 * tip, which is above the tooth on the upper arch and below it on the lower.
 * Aiming at the tooth itself therefore pushes its own label out of frame, and
 * the label is half of what a focused tooth is there to show. This tips the
 * aim towards whichever end the label is on, so the camera leans down for an
 * upper tooth and up for a lower one.
 */
const FOCUS_BADGE_ROOM = 0.08

const ZOOM_RANGE = { min: 0.05, max: 0.4 }

/**
 * Clear air between a root tip and its number, in metres.
 *
 * Each number hangs off its OWN tooth rather than a shared plane per arch.
 * Tooth heights run 15–30 mm across the set, so a shared plane — while it
 * gives the tidy aligned row a paper chart uses — leaves the short teeth
 * stranded a centimetre from their label. Tracking each root instead keeps
 * every number against the tooth it names, which is what matters when the
 * arch is being read at a glance.
 */
const LABEL_CLEARANCE = 0.0015

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
function framingDistance(camera: PerspectiveCamera, width: number, height: number) {
  const halfFov = (camera.fov * Math.PI) / 360
  const aspect = width / height
  const radius = Math.hypot(SIZE[0], SIZE[2]) / 2

  return (radius / Math.tan(halfFov)) * Math.max(1, 1 / aspect) * FRAMING * DEFAULT_ZOOM
}

/**
 * What the camera aims at when no tooth is open.
 *
 * Sits ABOVE the middle of the dentition by `DEFAULT_DROP` of the visible
 * height, which is what puts the arch that far down the frame. Derived from
 * the distance and the field of view rather than given as a fixed offset in
 * metres, so the drop stays the same share of the canvas at any size.
 */
function defaultTarget(camera: PerspectiveCamera, distance: number) {
  const halfFov = (camera.fov * Math.PI) / 360
  const visibleHeight = 2 * distance * Math.tan(halfFov)
  return new Vector3(0, visibleHeight * DEFAULT_DROP, 0)
}

/** The opening view, in the same shape `focusPose` returns — a flight needs both. */
function defaultPose(camera: PerspectiveCamera, distance: number, direction: Vector3) {
  const target = defaultTarget(camera, distance)
  return { target, position: target.clone().addScaledVector(direction, distance) }
}

function frame(camera: PerspectiveCamera, width: number, height: number) {
  const distance = framingDistance(camera, width, height)
  const target = defaultTarget(camera, distance)

  camera.position.copy(target).addScaledVector(START_DIRECTION, distance)
  camera.lookAt(target)
  camera.updateProjectionMatrix()
  return target
}

/**
 * Where to look from, and at what, to put ONE tooth in the middle of the view.
 *
 * The look-at point is the tooth itself — offset by the same shift that brings
 * the dentition to the origin, so it lands in the coordinates the arch is
 * actually drawn in. Centring is the whole job: orbiting a fixed midpoint
 * leaves a third molar out at the edge of the frame no matter how far the
 * camera comes in.
 *
 * The direction is that tooth's OWN outward normal, taken as the way from the
 * middle of the arch to where it stands, not one fixed front-on angle. A perio
 * exam is read off the facial surface, and the facial surface of an upper
 * right molar faces the patient's right — square-on to the incisors would show
 * it edge-on, which is exactly the face being measured hidden from view.
 */
function focusPose(camera: PerspectiveCamera, fdi: number, distance: number) {
  const { archPosition, archRotation, arch, size } = toothModelByFdi[fdi]

  // The tooth's biting tip, in the coordinates the arch is drawn in.
  const bite = new Vector3(
    archPosition[0] - CENTRE[0],
    archPosition[1] - CENTRE[1],
    archPosition[2] - CENTRE[2],
  )

  /*
   * Where the label hangs: the root tip, found exactly the way `ToothNumbers`
   * finds it — the tooth's own height along its own axis, turned by the same
   * rotation that seats it in the jaw. Reusing that derivation rather than
   * approximating it is what keeps the camera framing the label a leaning
   * incisor actually has, not one straight above it.
   */
  const axis = arch === 'upper' ? 1 : -1
  const rootTip = bite
    .clone()
    .add(
      new Vector3(0, axis * (size.height / 1000 + LABEL_CLEARANCE), 0).applyQuaternion(
        new Quaternion(...archRotation),
      ),
    )

  // Centre the tooth between its two ends, then lean towards the label.
  const halfFov = (camera.fov * Math.PI) / 360
  const visibleHeight = 2 * distance * Math.tan(halfFov)
  const target = bite.clone().lerp(rootTip, 0.5)
  target.y += axis * visibleHeight * FOCUS_BADGE_ROOM

  const outward = new Vector3(archPosition[0] - CENTRE[0], 0, archPosition[2] - CENTRE[2])
  // A tooth sitting dead on the arch's axis has no outward direction to speak
  // of; the front of the mouth is the sane reading of "outward" there.
  if (outward.lengthSq() < 1e-12) outward.set(0, 0, 1)
  outward.normalize().setY(FOCUS_LIFT).normalize()

  return { target, position: target.clone().addScaledVector(outward, distance) }
}

// ─── PROBING SITE ─────────────────────────────────────────────────────────

/** Where the camera looks at a probing site from: a point, and the way back out from it. */
interface SiteFocus {
  target: Vector3
  direction: Vector3
  /**
   * Turn to face it WITHOUT changing how close the camera is — for a move
   * between views of the same tooth, where a jump in scale would read as the
   * tooth changing size. Left off, the flight goes to the standard focused
   * distance.
   */
  keepRange?: boolean
}

/** The marker's dot and its white halo, metres. ~1 mm across, so it reads on any tooth. */
const SITE_DOT = 0.00048
const SITE_HALO = 0.00078

/** How far out from the margin the dot's centre sits, so it rides on the gum line. */
const SITE_SWELL = 0.00022

/**
 * The selected probing site, as a dot on the tooth's gum line — and the camera
 * pose that looks straight at it.
 *
 * The point is read off the tooth's own gingival ring (the CEJ traced from the
 * mesh), at the site's angle round the long axis, then moved apically by that
 * site's recorded recession — the same shift the red margin line makes — so
 * the dot sits on the line the chart draws, not on a guess of it.
 *
 * Reports its pose up rather than steering the camera itself: the orbit lives
 * outside the Suspense boundary the rings load under.
 */
function SiteMarker({
  fdi,
  site,
  recession,
  onFocus,
}: {
  fdi: number
  site: PerioSite
  /** Millimetres, at this site. Positive is apical, as the dataset records it. */
  recession: number
  onFocus: (focus: SiteFocus | null) => void
}) {
  const rings = useGingivalRings()
  const theme = useTheme()
  const model = toothModelByFdi[fdi]
  const ring = rings.get(model.node)

  const pose = useMemo(() => {
    if (!ring) return null
    const direction = siteDirection(model, site)
    const angle = ringAngle(direction)
    const radius = ringRadiusAt(ring, angle) + SITE_SWELL
    const axis = model.arch === 'upper' ? 1 : -1
    const local = new Vector3(
      direction.x * radius,
      ringHeightAt(ring, angle) + axis * recession * 0.001,
      direction.z * radius,
    )
    return seatSite(model, local, direction)
  }, [ring, model, site, recession])

  useEffect(() => {
    if (!pose) {
      onFocus(null)
      return
    }
    // Look back along the site's own outward direction, with the same small
    // lift every focused view has — on both aspects. Steeper views of the
    // tongue side (from above or below) were tried and read worse.
    const direction = pose.outward.clone().setY(0).normalize().setY(FOCUS_LIFT).normalize()
    onFocus({ target: pose.point, direction })
    return () => onFocus(null)
  }, [pose, onFocus])

  // A neutral grey dot — MUI's own grey scale, so it does not spend the brand
  // colour on the model — with a white halo drawn from its BACK faces, so it
  // reads as an outlined point against enamel and gum alike. Unlit: a marker,
  // not a material.
  const dot = useMemo(
    () => new MeshBasicMaterial({ color: theme.palette.grey[600], toneMapped: false }),
    [theme.palette.grey],
  )
  const halo = useMemo(
    () => new MeshBasicMaterial({ color: '#ffffff', side: BackSide, toneMapped: false }),
    [],
  )
  useEffect(
    () => () => {
      dot.dispose()
      halo.dispose()
    },
    [dot, halo],
  )

  if (!pose) return null
  return (
    <group position={pose.point} renderOrder={10}>
      <mesh material={halo} raycast={() => null}>
        <sphereGeometry args={[SITE_HALO, 24, 16]} />
      </mesh>
      <mesh material={dot} raycast={() => null}>
        <sphereGeometry args={[SITE_DOT, 24, 16]} />
      </mesh>
    </group>
  )
}

// ─── CROWN SURFACE ────────────────────────────────────────────────────────

/** Width of the outline round a picked surface, metres. ~0.3 mm: a line, not a band. */
const SURFACE_LINE = 0.0003

/** How much of the crown, measured from the biting tip, counts as its biting surface. */
const OCCLUSAL_SHARE = 0.22

/** Where the side surfaces stop short of the gum line, as a share of the crown. */
const CERVICAL_SHARE = 0.96

/** Half the angle one side surface spans round the tooth — a touch under a quarter turn. */
const SURFACE_HALF_ANGLE = 0.74

/**
 * The outline shader.
 *
 * Drawn over the tooth's OWN mesh, so the line follows the real crown rather
 * than a box round it. A surface is a region of the crown — a quarter of the
 * way round its long axis for the four sides, the cap nearest the bite for the
 * biting surface — and only a thin band just inside that region's edge is
 * painted. Everything else is discarded, which is what leaves the enamel, a
 * caries stain and every other mark on the tooth exactly as visible as before.
 *
 * Distances to the edge are worked out in METRES (arc length round the axis,
 * height along it), so the line keeps one width all the way round instead of
 * thinning where the crown narrows.
 */
const SURFACE_VERTEX = /* glsl */ `
  varying vec3 vLocal;
  void main() {
    vLocal = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const SURFACE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform vec2 uDir;       // the surface's direction round the long axis (local x, z)
  uniform float uAxis;     // +1 upper, -1 lower: which way the root runs along local y
  uniform float uCrown;    // crown height, biting tip to gum line
  uniform float uBiting;   // 1 for the biting surface, 0 for a side
  uniform float uLine;
  uniform float uHalf;
  uniform float uOcclusal;
  uniform float uCervical;
  varying vec3 vLocal;

  void main() {
    // Distance from the biting tip towards the root.
    float h = vLocal.y * uAxis;
    float inside;

    if (uBiting > 0.5) {
      inside = uCrown * uOcclusal - h;
    } else {
      float r = length(vLocal.xz);
      vec2 d = r > 1e-6 ? vLocal.xz / r : uDir;
      float off = acos(clamp(dot(d, uDir), -1.0, 1.0));
      float arc = (uHalf - off) * r;
      inside = min(arc, min(h - uCrown * uOcclusal, uCrown * uCervical - h));
    }

    // Only the band just inside the edge: 0 at the edge, 1 a line-width in.
    float m = inside / uLine;
    if (m <= 0.0 || m >= 1.0) discard;
    float alpha = smoothstep(0.0, 0.25, m) * (1.0 - smoothstep(0.75, 1.0, m));
    gl_FragColor = vec4(uColor, alpha * uOpacity);
  }
`

/**
 * The crown surface picked in the dental panel: a light grey outline on the
 * tooth, and the camera pose that turns that surface to face the viewer.
 *
 * Both come from the tooth's own anatomy (`toothSurfaceDirection`), so "buccal"
 * is wherever THIS tooth's cheek side actually is in the arch — an incisor's
 * faces forward, a molar's faces sideways — never a fixed axis of the scene.
 *
 * Only one surface is ever outlined: the outline is this component, and it
 * renders whichever surface it is given.
 */
function SurfaceMarker({
  fdi,
  surface,
  onFocus,
}: {
  fdi: number
  surface: CariesSurface
  onFocus: (focus: SiteFocus | null) => void
}) {
  const geometries = useToothGeometries()
  const rings = useGingivalRings()
  const theme = useTheme()
  const model = toothModelByFdi[fdi]
  const geometry = geometries.get(model.node)
  const ring = rings.get(model.node)
  const axis = model.arch === 'upper' ? 1 : -1
  // Biting tip (local y = 0) to the gum line. Without a traced ring, the
  // anatomical rule of thumb stands in: the crown is about a third of a tooth.
  const crown = ring ? Math.abs(ringNeck(ring, axis).y) : (model.size.height / 1000) * 0.35

  const material = useMemo(() => {
    const direction = toothSurfaceDirection(model, surface)
    return new ShaderMaterial({
      vertexShader: SURFACE_VERTEX,
      fragmentShader: SURFACE_FRAGMENT,
      uniforms: {
        uColor: { value: new Color(theme.palette.grey[500]) },
        uOpacity: { value: 0.9 },
        uDir: { value: new Vector2(direction.x, direction.z) },
        uAxis: { value: axis },
        uCrown: { value: crown },
        uBiting: { value: surface === 'occlusal' ? 1 : 0 },
        uLine: { value: SURFACE_LINE },
        uHalf: { value: SURFACE_HALF_ANGLE },
        uOcclusal: { value: OCCLUSAL_SHARE },
        uCervical: { value: CERVICAL_SHARE },
      },
      transparent: true,
      depthWrite: false,
      // Pulled a hair towards the camera so it wins the depth test against the
      // enamel (and the hover wash) it lies on.
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      toneMapped: false,
    })
  }, [model, surface, axis, crown, theme.palette.grey])
  useEffect(() => () => material.dispose(), [material])

  useEffect(() => {
    // The tooth stays in the middle: aim at its own centre, half-way along its
    // long axis, and look back along the picked surface's view direction.
    const centre = new Vector3(0, (axis * model.size.height) / 2000, 0)
    const { point, outward } = seatSite(model, centre, toothSurfaceView(model, surface))
    // Side views get the same small lift every focused view has. The biting
    // surface is looked at along the tooth's axis, so it is left as it is.
    const direction =
      surface === 'occlusal' ? outward : outward.setY(0).normalize().setY(FOCUS_LIFT).normalize()
    onFocus({ target: point, direction, keepRange: true })
    return () => onFocus(null)
  }, [model, surface, axis, onFocus])

  if (!geometry) return null
  return (
    // The same offset the arch group applies, so the outline sits on its tooth.
    <group position={[-CENTRE[0], -CENTRE[1], -CENTRE[2]]}>
      <mesh
        geometry={geometry}
        position={model.archPosition}
        quaternion={model.archRotation}
        material={material}
        renderOrder={9}
        raycast={() => null}
      />
    </group>
  )
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
function Orbit({
  zoom,
  focusFdi,
  focusSite,
  viewDirection,
}: {
  zoom: number
  focusFdi: number | null
  /**
   * A probing site on the open tooth to look straight at, or `null` for the
   * tooth's usual facial view. Wins over `focusFdi`'s own framing when set.
   */
  focusSite: SiteFocus | null
  /** Where the View menu is pointing the camera, in the arch's own axes. */
  viewDirection: readonly [number, number, number]
}) {
  const { camera, gl, get, size } = useThree()
  const controls = useRef<OrbitControls | null>(null)
  /** The framed distance, kept so every zoom is measured from it, not compounded. */
  const framedDistance = useRef(0)

  /**
   * The glide. Being set is what marks a flight as running, and `from` is
   * where the camera stood when it was ordered so the interpolation has a
   * fixed pair of ends rather than chasing a moving start.
   *
   * Progress is timed off the WALL CLOCK, not off `useFrame`'s delta. The
   * canvas is `frameloop="demand"`, so the first delta after an idle spell is
   * the time since whatever last caused a render — often seconds. Feeding that
   * into the easing put the flight at 100% on its very first frame, which is
   * exactly the snap the animation exists to avoid.
   */
  const flight = useRef<{
    fromTarget: Vector3
    toTarget: Vector3
    /** Where the camera sat relative to its target, as direction and range. */
    fromDirection: Vector3
    rotation: Quaternion
    fromRange: number
    toRange: number
    startedAt: number
  } | null>(null)

  /** Reused each frame; a flight would otherwise allocate one per redraw. */
  const scratch = useRef({ turn: new Quaternion(), direction: new Vector3() })

  useEffect(() => {
    // Frame BEFORE the controls exist: OrbitControls reads the camera's
    // position once to seed its orbit, so moving the camera afterwards gets
    // snapped straight back on the next update.
    const { width, height } = get().size
    const target = frame(camera as PerspectiveCamera, width, height)
    // Measured from the TARGET, not the origin — the two are no longer the
    // same point now that the default view aims above the dentition.
    framedDistance.current = camera.position.distanceTo(target)

    const orbit = new OrbitControls(camera, gl.domElement)
    // Seeded before the first update, or the controls would pull the camera
    // back to an origin the framing never aimed at.
    orbit.target.copy(target)
    orbit.enableDamping = true
    orbit.dampingFactor = 0.12
    orbit.minDistance = ZOOM_RANGE.min
    orbit.maxDistance = ZOOM_RANGE.max
    orbit.rotateSpeed = 0.75
    orbit.zoomSpeed = 0.8
    /*
     * Left-drag turns the arch; right-drag slides it about the canvas.
     *
     * Panning was off, which is why a right-drag did nothing at all before —
     * Three maps RIGHT to `MOUSE.PAN` by default, but the handler bails on
     * `enablePan === false`. It is on now, and `screenSpacePanning` (Three's
     * own default) moves the model parallel to the screen rather than along
     * the ground plane, so it tracks the pointer whatever angle the arch has
     * been turned to.
     *
     * The mapping is spelled out rather than left implicit: two of the three
     * buttons are load-bearing here, and a silent change to Three's defaults
     * should not be able to take one of them away.
     *
     * OrbitControls already preventDefaults `contextmenu` on its own element,
     * so no menu pops up mid-drag and nothing extra is needed for that.
     */
    orbit.enablePan = true
    orbit.mouseButtons = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN }
    // Wrapped, not passed straight in: `invalidate` reads its first argument as
    // a renderer state, and the listener would hand it a DOM-ish event.
    const redraw = () => invalidate()
    orbit.addEventListener('change', redraw)
    // Touching the model cancels the glide. Fighting an animation for control
    // of the camera feels broken, and the user grabbing it is the clearest
    // possible statement that they want it where they are putting it.
    const abort = () => {
      flight.current = null
    }
    orbit.addEventListener('start', abort)
    controls.current = orbit
    invalidate()

    return () => {
      orbit.removeEventListener('change', redraw)
      orbit.removeEventListener('start', abort)
      orbit.dispose()
      controls.current = null
    }
  }, [camera, gl, get])

  /**
   * Keep the framed distance current — but never move the camera for it.
   *
   * The distance is derived from the aspect ratio, so it has to be recomputed
   * when the canvas changes shape or a later flight would aim at a distance
   * measured against a box that no longer exists. Recomputing is all that
   * happens here: a resize is not a request to reframe the user's view.
   */
  useEffect(() => {
    if (size.width === 0 || size.height === 0) return
    framedDistance.current = framingDistance(camera as PerspectiveCamera, size.width, size.height)

    // With no tooth open the view is still the default one, so its aim has to
    // follow the new canvas — the drop is a share of the visible height, and
    // that height moves with the box. Once a tooth IS open the target belongs
    // to that tooth and resizing must not pull it off it. A running flight is
    // left alone too, or the snap here would fight the glide.
    const orbit = controls.current
    if (!orbit || focusFdi !== null || flight.current) return
    orbit.target.copy(defaultTarget(camera as PerspectiveCamera, framedDistance.current))
    orbit.update()
    invalidate()
  }, [camera, focusFdi, size.width, size.height])

  /**
   * Fly onto whichever tooth is open, and back to the opening view when none
   * is.
   *
   * Re-runs for every new tooth — stepping along the arch with Next tooth
   * glides the view from one to the next rather than leaving the second one
   * off in the corner of the frame — and once more on deselect, which returns
   * the camera to exactly the pose the arch was framed at.
   *
   * ⚠️ This is why changing chart tab must NOT clear the selection. Tab
   * changes are supposed to leave the 3D exactly where it was, and clearing
   * would read here as a deselect and fly the view home. Holding the tooth
   * across the switch leaves `focusFdi` untouched, so no flight is ordered at
   * all — a chart type is a different reading of the SAME dentition, not a
   * different model to be re-introduced.
   */
  const settled = useRef(false)
  /** What the last flight was ordered for, to tell a site being let go from a move. */
  const last = useRef<{ fdi: number | null; site: SiteFocus | null }>({ fdi: null, site: null })

  useEffect(() => {
    const orbit = controls.current
    if (!orbit || framedDistance.current === 0) return

    // A site let go of while the SAME tooth stays open — the perio tab swapped
    // for another — is not a request to move: a tab change leaves the 3D
    // exactly where it is (see above).
    const releasedOnly =
      focusSite === null && last.current.site !== null && focusFdi === last.current.fdi
    // Turning between two views of the tooth already in focus keeps whatever
    // distance the camera is at — including one the user has zoomed to. A
    // newly opened tooth still flies to the standard focused distance.
    const holdRange =
      focusSite?.keepRange === true &&
      last.current.site !== null &&
      focusFdi === last.current.fdi
    last.current = { fdi: focusFdi, site: focusSite }
    if (releasedOnly) return

    // The opening view is already on screen at mount; animating to where the
    // camera already stands would just burn a frame budget on nothing.
    if (!settled.current) {
      settled.current = true
      if (focusFdi === null) return
    }

    const pose =
      focusFdi === null
        ? defaultPose(
            camera as PerspectiveCamera,
            framedDistance.current,
            new Vector3(...viewDirection).normalize(),
          )
        : focusSite
          ? {
              target: focusSite.target.clone(),
              position: focusSite.target
                .clone()
                .addScaledVector(
                  focusSite.direction,
                  holdRange
                    ? camera.position.distanceTo(orbit.target)
                    : framedDistance.current * zoom,
                ),
            }
          : focusPose(camera as PerspectiveCamera, focusFdi, framedDistance.current * zoom)

    /*
     * Stored as a ROTATION rather than a pair of endpoints.
     *
     * Interpolating the camera's position straight from one to the other draws
     * a chord, and the chord between opposite sides of the arch runs through
     * the middle of it — the camera dives in among the roots on its way past.
     * Swinging the offset round instead keeps it on an arc at a sane range
     * throughout, which is what "orbiting to the next tooth" should look like.
     */
    const fromTarget = orbit.target.clone()
    const fromOffset = camera.position.clone().sub(fromTarget)
    const toOffset = pose.position.clone().sub(pose.target)
    const fromRange = fromOffset.length() || framedDistance.current
    const fromDirection = fromOffset.normalize()

    flight.current = {
      fromTarget,
      toTarget: pose.target,
      fromDirection,
      rotation: new Quaternion().setFromUnitVectors(fromDirection, toOffset.clone().normalize()),
      fromRange,
      toRange: toOffset.length(),
      startedAt: performance.now(),
    }
    invalidate()
  }, [camera, zoom, focusFdi, focusSite, viewDirection])

  useFrame(() => {
    const orbit = controls.current
    const run = flight.current

    if (orbit && run) {
      const t = Math.min(1, (performance.now() - run.startedAt) / (FLIGHT_SECONDS * 1000))
      // Ease in and out. A linear flight starts and stops dead, which reads as
      // the model being snapped rather than moved.
      const eased = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2

      // Both ends move: the target slides along the arch to the new tooth
      // while the camera swings round to its facial side. Moving only the
      // camera would swing the view past a tooth still pinned at the middle.
      orbit.target.lerpVectors(run.fromTarget, run.toTarget, eased)

      // Turn the offset along its arc, and close the range separately, so the
      // camera rides round the outside of the arch instead of cutting through.
      scratch.current.turn.identity().slerp(run.rotation, eased)
      scratch.current.direction.copy(run.fromDirection).applyQuaternion(scratch.current.turn)
      camera.position
        .copy(orbit.target)
        .addScaledVector(scratch.current.direction, run.fromRange + (run.toRange - run.fromRange) * eased)
      orbit.update()
      if (t >= 1) flight.current = null
      invalidate()
      return
    }

    if (orbit?.update()) invalidate()
  })

  return null
}

/**
 * Which marks the Chart Layers menu is asking for.
 *
 * Already resolved: the menu's own parent/child rule (findings off hides
 * caries whatever the caries row says) is applied by the caller, so nothing in
 * the scene has to know the menu's shape — only whether to draw.
 */
export interface ChartLayerVisibility {
  caries: boolean
  implants: boolean
  rootCanals: boolean
  postCore: boolean
  measurements: boolean
  labels: boolean
}

function Arch({
  teeth,
  selectedFdi,
  perio,
  perioReadings,
  caries,
  implants,
  endo,
  postCore,
  show,
  onSelect,
  hoveredFdi,
  onHover,
}: {
  teeth: Tooth[]
  selectedFdi: number | null
  perio: PerioChart | null
  perioReadings: PerioToothReading[]
  caries: CariesChart
  implants: ImplantChart
  endo: EndoChart | null
  postCore: PostCoreChart
  show: ChartLayerVisibility
  onSelect: (fdi: number | null) => void
  hoveredFdi: number | null
  onHover: Dispatch<SetStateAction<number | null>>
}) {
  const geometries = useToothGeometries()
  const theme = useTheme()
  /*
   * The hover highlight: a translucent wash of the brand colour laid over the
   * tooth's own surface, rather than a change to its enamel material. The
   * enamel materials are cached per status (see `enamel()`), so tinting one
   * would tint every tooth sharing it. `polygonOffset` pulls the wash a hair
   * towards the camera so it wins the depth test against the tooth beneath.
   *
   * Read from `theme.palette` because WebGL needs a resolved colour, not a CSS
   * variable — light scheme only, like the rest of the scene's paint.
   */
  const hoverWash = useMemo(
    () =>
      new MeshBasicMaterial({
        color: theme.palette.primary.main,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    [theme.palette.primary.main],
  )
  useEffect(() => () => hoverWash.dispose(), [hoverWash])
  const rings = useGingivalRings()
  const fixtures = useMemo(() => implantsByFdi(implants), [implants])
  const canals = useMemo(() => (endo ? endoByFdi(endo) : null), [endo])
  const posted = useMemo(() => (endo ? postCoreByFdi(postCore) : null), [endo, postCore])

  return (
    // The blend measures from the figure's feet, so the dentition sits 1.67 m
    // up. Pulling it back to the origin is what makes it orbitable.
    <group position={[-CENTRE[0], -CENTRE[1], -CENTRE[2]]}>
      {teeth.map((tooth) => {
        const model = toothModelByFdi[tooth.fdi]
        const geometry = geometries.get(model.node)
        if (!geometry) return null

        // An implanted site has a crown and a fixture and NO natural root, so
        // the tooth is cut at its cemento-enamel junction and `ImplantLayer`
        // draws what is really under it. The cut reads the per-vertex bake of
        // that junction; with no traced ring the tooth is left intact rather
        // than sliced at a height guessed for it — and the fixture is dropped
        // on the same condition, so the two can never disagree about the site.
        const ring = rings.get(model.node)
        const implanted = fixtures.has(tooth.fdi) && ring !== undefined
        const dimmed = selectedFdi !== null && selectedFdi !== tooth.fdi
        const axis: 1 | -1 = tooth.arch === 'upper' ? 1 : -1

        /*
         * On the endo tab, a tooth turns to glass so the hardware inside it can
         * be seen — either the pulp `EndoLayer` draws, or the post
         * `PostCoreLayer` does. A post is entirely enclosed by the crown, so
         * without this it is drawn perfectly and then hidden by the tooth
         * around it.
         *
         * Gated on the LAYER as well as the finding: switching root canals or
         * posts off in the Chart Layers menu should return the tooth to solid
         * enamel, not leave a window onto nothing.
         *
         * ONLY these teeth — see `pulpWindowEnamel` for why a whole transparent
         * arch sorts into mush. An implant wins if a site somehow carries both:
         * the crown-only cut is a statement about what is in the jaw, and
         * softening it to show a canal a fixture does not have would be worse
         * than either.
         */
        const glass =
          !implanted &&
          ((show.rootCanals && canals?.has(tooth.fdi) === true) ||
            (show.postCore && posted?.has(tooth.fdi) === true))

        const shape = implanted && ring ? pocketGeometry(geometry, ring) : geometry

        return (
          <group key={tooth.fdi}>
            <mesh
              geometry={shape}
              position={model.archPosition}
              quaternion={model.archRotation}
              material={
                implanted
                  ? crownOnlyEnamel(tooth.status, dimmed, axis)
                  : glass
                    ? pulpWindowEnamel(tooth.status, dimmed)
                    : enamel(tooth.status, dimmed)
              }
              onClick={(event) => {
                event.stopPropagation()
                onSelect(selectedFdi === tooth.fdi ? null : tooth.fdi)
              }}
              onPointerOver={(event) => {
                event.stopPropagation()
                onHover(tooth.fdi)
              }}
              // Only clears if THIS tooth is still the hovered one — moving
              // straight onto a neighbour fires its `over` before this `out`.
              onPointerOut={() => onHover((current) => (current === tooth.fdi ? null : current))}
            />
            {hoveredFdi === tooth.fdi && (
              <mesh
                geometry={shape}
                position={model.archPosition}
                quaternion={model.archRotation}
                material={hoverWash}
                // Never a raycast target of its own, or it would steal the
                // pointer from the tooth it sits on and flicker the hover.
                raycast={() => null}
              />
            )}
          </group>
        )
      })}

      {/*
        Inside the arch group, so the marks ride the same offset that brings
        the dentition to the origin — and stay welded to their teeth through
        every orbit.
      */}
      {perio && show.measurements && <PerioLayer teeth={teeth} perio={perio} readings={perioReadings} />}

      {/*
        NOT gated on a chart tab, unlike the perio layer above. A lesion is a
        property of the tooth rather than a reading taken for one chart, so it
        is on in Dental, in Perio and in every chart type added later — the
        caller passes it unconditionally.
      */}
      {show.caries && <CariesLayer teeth={teeth} caries={caries} selectedFdi={selectedFdi} />}

      {/*
        Also unconditional, and for the same reason — a fixture is hardware in
        the jaw, not a reading. It is drawn last of the three because it is the
        only one that replaces anatomy rather than marking it: the teeth above
        have already been cut back to their crowns for it.
      */}
      {show.implants && <ImplantLayer teeth={teeth} implants={implants} selectedFdi={selectedFdi} />}

      {/*
        Tab-scoped like the perio layer above, and for the same kind of reason:
        the canal system is inside every tooth all the time, but showing it is a
        mode the user chooses rather than a finding that belongs on every chart.
      */}
      {endo && show.rootCanals && <EndoLayer teeth={teeth} endo={endo} selectedFdi={selectedFdi} />}

      {/*
        Tab-scoped WITH the endo chart: a post sits in a treated canal, so it
        appears alongside the root filling rather than on its own.
      */}
      {endo && show.postCore && (
        <PostCoreLayer teeth={teeth} postCore={postCore} selectedFdi={selectedFdi} />
      )}
    </group>
  )
}

type LabelNodes = RefObject<Map<number, HTMLElement>>

/**
 * The tooth numbers, drawn as HTML over the canvas rather than inside it.
 *
 * Three ways exist to put text in a WebGL scene, and only this one keeps the
 * numbers as real text: a sprite bakes them into a raster that blurs the
 * moment the user zooms in, and extruded text geometry needs a font loaded and
 * meshed for what is ultimately a label. HTML keeps Inter, the DS type scale
 * and the theme's colours — which matters here, because a misread tooth number
 * is a clinical error, not a cosmetic one.
 *
 * The cost is that screen position has to be recomputed as the camera moves.
 * That is done imperatively, straight onto `style.transform`, because routing
 * 32 positions through React state would re-render the whole overlay on every
 * frame of a drag. `frameloop="demand"` means this runs only while something
 * is actually moving.
 */
function ToothNumbers({
  teeth,
  selectedFdi,
  nodes,
}: {
  teeth: Tooth[]
  selectedFdi: number | null
  nodes: LabelNodes
}) {
  const { camera, size } = useThree()

  const anchors = useMemo(
    () =>
      new Map(
        teeth.map((tooth) => {
          const { archPosition, archRotation, size } = toothModelByFdi[tooth.fdi]
          // The export stands each tooth with its biting tip at the local
          // origin and its root along local +Y for uppers, −Y for lowers. So
          // the root tip is that far along the tooth's own axis — turned by
          // the same rotation that seats it in the jaw, which is what keeps
          // the number tracking a leaning incisor instead of floating
          // straight above it.
          const reach = size.height / 1000 + LABEL_CLEARANCE
          const anchor = new Vector3(0, tooth.arch === 'upper' ? reach : -reach, 0)
            .applyQuaternion(new Quaternion(...archRotation))
            .add(new Vector3(archPosition[0], archPosition[1], archPosition[2]))
          // Same offset the arch group applies, so the label rides with it.
          return [
            tooth.fdi,
            anchor.sub(new Vector3(CENTRE[0], CENTRE[1], CENTRE[2])),
          ] as const
        }),
      ),
    [teeth],
  )

  // Reused every frame: allocating 32 vectors per frame would churn the
  // collector through the whole of a drag.
  const scratch = useMemo(() => ({ screen: new Vector3() }), [])

  useFrame(() => {
    for (const tooth of teeth) {
      const element = nodes.current.get(tooth.fdi)
      const anchor = anchors.get(tooth.fdi)
      if (!element || !anchor) continue

      // EVERY number stays on screen, including the far half of the ring.
      //
      // The far half used to be hidden outright, on the reasoning that
      // thirty-two numbers around a 68 mm arch collide when seen edge-on. That
      // holds looking along the arch, but it costs all twelve molars at the
      // frontal view the chart now opens at — and a tooth chart that silently
      // stops numbering the molars is worse than one whose labels crowd.
      //
      // Overlaps are resolved by DEPTH instead: each badge is stacked by how
      // near its tooth is, so where two collide the nearer one is whole and on
      // top rather than the two blending into an unreadable number. The badges
      // are opaque with their own background, so the one in front stays
      // legible. The selected tooth is lifted above everything.
      scratch.screen.copy(anchor).project(camera)
      const x = (scratch.screen.x * 0.5 + 0.5) * size.width
      const y = (-scratch.screen.y * 0.5 + 0.5) * size.height

      // `screen.z` is normalised depth, 0 near to 1 far, so this counts down
      // from the front. Clamped into a small band that cannot escape the
      // stacking context the overlay already sits in.
      element.style.zIndex =
        tooth.fdi === selectedFdi
          ? '1000'
          : String(Math.round(900 - Math.min(1, Math.max(0, scratch.screen.z)) * 800))
      // Uppers hang above their anchor and lowers below it, so every number
      // sits outside the arch with its leader pointing back at its tooth.
      const shift = tooth.arch === 'upper' ? '-100%' : '0'
      element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, ${shift})`
    }
  })

  return null
}

/**
 * A probed tooth's deepest reading, written out beside its number.
 *
 * This is the text half of the perio layer. The patch on the tooth shows
 * WHERE the pocket is and roughly how far it runs; this says how deep, in
 * millimetres, and whether the site bled — neither of which a shaded region
 * can state precisely, and neither of which should depend on telling blue
 * from anything else. `BOP` is the standard abbreviation on a perio chart, so
 * it is spelled out in the tooltip-free caption rather than glossed here.
 */
function DepthTag({ reading, perio }: { reading: PerioToothReading; perio: PerioChart }) {
  const deepest = deepestSite(reading).reading
  const flagged = deepest.pocketDepth >= perio.flagDepth
  const bleeds = deepest.conditions.includes('bleeding')

  return (
    <Typography
      variant="caption"
      component="span"
      sx={{
        px: 0.5,
        py: 0.125,
        borderRadius: 0.5,
        lineHeight: 1.3,
        fontVariantNumeric: 'tabular-nums',
        fontWeight: flagged ? 700 : 500,
        whiteSpace: 'nowrap',
        color: flagged ? 'error.dark' : 'text.secondary',
        bgcolor: (theme) =>
          flagged
            ? `rgba(${theme.vars.palette.error.mainChannel} / 0.16)`
            : theme.vars.palette.background.paper,
      }}
    >
      {`${deepest.pocketDepth} ${perio.unit}`}
      {bleeds && (
        <Box component="span" sx={{ fontSize: '0.8em', fontWeight: 500, ml: 0.375 }}>
          BOP
        </Box>
      )}
    </Typography>
  )
}

/**
 * That a tooth carries a lesion, written beside its number.
 *
 * The text half of the caries layer, and the reason the stain is allowed to be
 * a realistic brown rather than a palette colour: what the mark MEANS is
 * carried by this word, not by the hue. A clinician who cannot separate brown
 * from enamel still sees "Caries" against the tooth, and the full finding is
 * one click away in the panel beside the arch.
 */
function CariesTag({ label }: { label: string }) {
  return (
    <Typography
      variant="caption"
      component="span"
      sx={{
        px: 0.5,
        py: 0.125,
        borderRadius: 0.5,
        lineHeight: 1.3,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        color: 'warning.dark',
        // `vars` rather than `alpha(palette…)`, for the reason the number
        // badge gives: under cssVariables a tint computed in JS is frozen at
        // the default scheme and would not follow a light/dark swap.
        bgcolor: (theme) => `rgba(${theme.vars.palette.warning.mainChannel} / 0.2)`,
      }}
    >
      {label}
    </Typography>
  )
}

/**
 * That a site carries an implant, written beside its number.
 *
 * The text half of the implant layer. A fixture is the most visually obvious
 * thing on the arch — it is the one mark that changes the tooth's silhouette —
 * but "that shape is metal" is still a colour-and-form judgement, and the fact
 * that a site is implanted has to survive a greyscale print and a clinician who
 * is not orbiting the model. So the word rides the badge like the other two.
 */
/**
 * That a tooth carries a post, written beside its number.
 *
 * The text half of the post layer, and the reason the post is allowed to be
 * metal rather than a palette colour. A post sits INSIDE the crown, so it is
 * the one piece of hardware here that can be hidden entirely by the tooth
 * around it at most angles — which makes the written badge the only thing
 * guaranteed to say the tooth has one.
 */
function PostCoreTag({ label }: { label: string }) {
  return (
    <Typography
      variant="caption"
      component="span"
      sx={{
        px: 0.5,
        py: 0.125,
        borderRadius: 0.5,
        lineHeight: 1.3,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        // Neutral like the implant's, and for the same reason: a post is a
        // fact about how the tooth was restored, not a finding to be alarmed
        // by, so it takes no status channel.
        color: 'text.primary',
        bgcolor: (theme) => `rgba(${theme.vars.palette.text.primaryChannel} / 0.12)`,
      }}
    >
      {label}
    </Typography>
  )
}

function ImplantTag({ label }: { label: string }) {
  return (
    <Typography
      variant="caption"
      component="span"
      sx={{
        px: 0.5,
        py: 0.125,
        borderRadius: 0.5,
        lineHeight: 1.3,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        // `text.secondary` on a neutral tint rather than a status channel: an
        // implant is a fact about the site, not a finding to be alarmed by, and
        // spending `error` or `warning` on it would say otherwise.
        color: 'text.primary',
        bgcolor: (theme) => `rgba(${theme.vars.palette.text.primaryChannel} / 0.12)`,
      }}
    >
      {label}
    </Typography>
  )
}

/**
 * That a tooth is charted for endodontic treatment, written beside its number.
 *
 * The text half of the endo layer. The red canals are the most legible mark on
 * the arch, but what they mean — that this tooth is charted for a root canal —
 * is exactly the thing a red shape cannot say. The word does, and the canal
 * count and diagnosis follow in the panel.
 */
function EndoTag({ label }: { label: string }) {
  return (
    <Typography
      variant="caption"
      component="span"
      sx={{
        px: 0.5,
        py: 0.125,
        borderRadius: 0.5,
        lineHeight: 1.3,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        // The `error` channel, unlike the implant badge's neutral: a tooth
        // charted for a root canal is an open treatment need, which is what
        // this channel means everywhere else on the screen.
        color: 'error.dark',
        bgcolor: (theme) => `rgba(${theme.vars.palette.error.mainChannel} / 0.18)`,
      }}
    >
      {label}
    </Typography>
  )
}

export function ToothArch3D({
  teeth,
  selectedFdi,
  perio = null,
  perioReadings = [],
  caries,
  cariesGrades,
  implants,
  endo = null,
  postCore,
  zoom = 1,
  focusFdi = null,
  focusSite = null,
  focusSurface = null,
  viewDirection,
  show,
  onSelect,
}: {
  teeth: Tooth[]
  selectedFdi: number | null
  /** The perio overlay, or `null` for the plain dental chart. */
  perio?: PerioChart | null
  /** Readings as they stand now, edited by the panel. Empty off the perio tab. */
  perioReadings?: PerioToothReading[]
  /** Carious lesions. Always supplied — the stain is not tab-scoped. */
  caries: CariesChart
  /** The grades recorded on each carious tooth's surfaces, shown in its badge. */
  cariesGrades?: ReadonlyMap<number, readonly string[]>
  /** Implant fixtures. Always supplied — hardware is not tab-scoped either. */
  implants: ImplantChart
  /** The endo overlay, or `null` off the endo chart. */
  endo?: EndoChart | null
  /** Posts and cores. Drawn only where `endo` is also on — see PostCoreLayer. */
  postCore: PostCoreChart
  /** Fraction of the framed distance to sit at. Below 1 pulls the camera in. */
  zoom?: number
  /**
   * The tooth to centre the view on, or `null` to leave the camera alone.
   * Set while a tooth is open for charting.
   */
  focusFdi?: number | null
  /**
   * The probing site picked in the perio panel, on the `focusFdi` tooth. Marked
   * on the gum line, and the camera turns to face it.
   */
  focusSite?: PerioSite | null
  /**
   * The crown surface picked in the dental panel, on the `focusFdi` tooth.
   * Outlined on the tooth, and the camera turns it to face the viewer. Never
   * set together with `focusSite` — the two belong to different chart tabs.
   */
  focusSurface?: CariesSurface | null
  /** Where the View menu is pointing the camera, in the arch's own axes. */
  viewDirection: readonly [number, number, number]
  /** Which marks to draw, already resolved from the Chart Layers menu. */
  show: ChartLayerVisibility
  onSelect: (fdi: number | null) => void
}) {
  const labels = useRef<Map<number, HTMLElement>>(new Map())
  // Where the site marker says the camera should look; see `SiteMarker`.
  const [siteFocus, setSiteFocus] = useState<SiteFocus | null>(null)
  const [hoveredFdi, setHoveredFdi] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)

  // A drag can end anywhere — off the canvas, over a menu — so the release is
  // listened for on the window, not on the canvas that saw it start.
  useEffect(() => {
    if (!dragging) return
    const release = () => setDragging(false)
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    return () => {
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
    }
  }, [dragging])

  /*
   * One cursor, owned here. It used to be split — `grab` on the canvas and
   * `pointer` written onto <body> by each tooth — and the canvas's own value
   * always won, so the pointer never showed. Grabbing beats everything while
   * a drag is live; otherwise a tooth under the pointer says "click me".
   */
  const cursor = dragging ? 'grabbing' : hoveredFdi !== null ? 'pointer' : 'grab'

  // The badges carry the readings as TEXT, beside the marks that carry them
  // as colour. That is the requirement, not a nicety: a probing depth shown
  // only as a blue patch is a finding a colourblind clinician cannot read.
  const readings = useMemo(
    () => (perio ? perioByFdi(perioReadings) : null),
    [perio, perioReadings],
  )

  // Same rule for the stain: a brown patch on a tooth is not a diagnosis a
  // clinician can read off colour, so every stained tooth carries the word
  // beside its number as well.
  const lesions = useMemo(() => cariesByFdi(caries), [caries])

  // And for the fixture: the screw is unmistakable on screen, but "implanted"
  // must still be readable as a word beside the number.
  const fixtures = useMemo(() => implantsByFdi(implants), [implants])

  // And for the pulp: red canals through a tooth are a picture, not a record.
  // The count and the diagnosis are text, here and in the panel.
  const canals = useMemo(() => (endo ? endoByFdi(endo) : null), [endo])

  // And for the post, which is the one piece of hardware the tooth can hide
  // completely — filtered against the root fillings, so the badge cannot
  // appear on a tooth the model declined to draw a post in.
  const posts = useMemo(
    () => (endo ? postCoreByFdi(postCore) : null),
    [postCore, endo],
  )

  // Names what a click will do, on the one chart where a tooth opens a record
  // of its own: a tooth with a canal finding, on the endo tab. Hidden mid-drag,
  // when the pointer is turning the arch rather than pointing at a tooth.
  const hoverTip =
    !dragging && endo && hoveredFdi !== null && canals?.has(hoveredFdi) ? endo.hoverLabel : ''

  return (
    <Tooltip title={hoverTip} open={hoverTip !== ''} followCursor describeChild disableInteractive>
      <Box
        sx={{ position: 'relative', width: '100%', height: '100%' }}
        onPointerDownCapture={() => setDragging(true)}
        onPointerLeave={() => setHoveredFdi(null)}
      >
        <Canvas
          frameloop="demand"
          dpr={[1, 2]}
          camera={{ fov: 32, near: 0.005, far: 5 }}
          gl={{ antialias: true, alpha: true, toneMapping: NeutralToneMapping }}
          // Clicking empty space clears the selection, the way the number row's
          // second click does in the flat chart.
          onPointerMissed={() => onSelect(null)}
          style={{ display: 'block', cursor }}
        >
          <Studio />
          <Suspense fallback={null}>
            <Arch
              teeth={teeth}
              selectedFdi={selectedFdi}
              perio={perio}
              perioReadings={perioReadings}
              caries={caries}
              implants={implants}
              endo={endo}
              postCore={postCore}
              show={show}
              onSelect={onSelect}
              hoveredFdi={hoveredFdi}
              onHover={setHoveredFdi}
            />
            {focusFdi !== null && focusSite && (
              <SiteMarker
                fdi={focusFdi}
                site={focusSite}
                recession={readings?.get(focusFdi)?.sites[focusSite].recession ?? 0}
                onFocus={setSiteFocus}
              />
            )}
            {focusFdi !== null && focusSurface && (
              <SurfaceMarker fdi={focusFdi} surface={focusSurface} onFocus={setSiteFocus} />
            )}
          </Suspense>
          <Orbit
            zoom={zoom}
            focusFdi={focusFdi}
            focusSite={focusSite || focusSurface ? siteFocus : null}
            viewDirection={viewDirection}
          />
          {/* Skipped outright when labels are off — this projects 32 anchors on
              every frame of a drag, and none of it is wanted if nothing shows. */}
          {show.labels && <ToothNumbers teeth={teeth} selectedFdi={selectedFdi} nodes={labels} />}
        </Canvas>

        {/*
          `aria-hidden` because these numbers add nothing a screen reader can
          currently reach: the WebGL arch puts no teeth in the accessibility tree
          at all, so announcing 32 bare digits would be noise rather than access.
          The selected tooth is already announced by the aria-live caption beside
          the canvas. Making the dentition keyboard-navigable is the real fix and
          is a bigger job than labelling.
        */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            // Numbers must never eat a drag meant for the model underneath.
            pointerEvents: 'none',
          }}
        >
          {show.labels &&
            teeth.map((tooth) => {
            const side = sideFromFdi(tooth.fdi)
            // Laterality is carried by the CHANNEL, not by a hex, so both colour
            // schemes stay contrast-checked and a rebrand moves it. The letter
            // is what actually says which side — colour only reinforces it,
            // because a tooth's side must never depend on seeing a hue.
            const channel = side === 'R' ? 'info' : 'warning'
            const selected = tooth.fdi === selectedFdi
            const reading = readings?.get(tooth.fdi)
            const lesion = lesions.get(tooth.fdi)
            const fixture = fixtures.get(tooth.fdi)
            const canal = canals?.get(tooth.fdi)
            const post = posts?.get(tooth.fdi)

            return (
              <Box
                key={tooth.fdi}
                ref={(element: HTMLElement | null) => {
                  if (element) labels.current.set(tooth.fdi, element)
                  else labels.current.delete(tooth.fdi)
                }}
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  display: 'flex',
                  // Children are [leader, badge]; reversing on the upper arch
                  // puts the badge outermost and the leader nearest its tooth.
                  flexDirection: tooth.arch === 'upper' ? 'column-reverse' : 'column',
                  alignItems: 'center',
                  gap: 0.25,
                  willChange: 'transform',
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: '1px',
                    height: (theme) => theme.spacing(0.75),
                    bgcolor: 'divider',
                  }}
                />
                <Typography
                  variant="caption"
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'baseline',
                    gap: 0.25,
                    px: 0.5,
                    py: 0.125,
                    borderRadius: 0.5,
                    lineHeight: 1.4,
                    // Digits share a width, so a turning arch doesn't make the
                    // badges shimmer as they re-lay out.
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: selected ? 700 : 500,
                    color: `${channel}.dark`,
                    // `vars` rather than `alpha(palette…)`: under cssVariables the
                    // palette object is frozen at the default scheme, so a tint
                    // computed in JS would not follow a light/dark swap.
                    bgcolor: (theme) =>
                      `rgba(${theme.vars.palette[channel].mainChannel} / ${selected ? 0.34 : 0.16})`,
                    outline: selected ? '2px solid' : 'none',
                    outlineColor: `${channel}.main`,
                    transition: (theme) =>
                      theme.transitions.create(['background-color', 'outline-color']),
                  }}
                >
                  {universalFromFdi(tooth.fdi)}
                  <Box
                    component="span"
                    sx={{
                      // Relative to the badge's own size rather than a second
                      // point on the type scale, so it tracks the caption
                      // variant wherever that lands.
                      fontSize: '0.8em',
                      fontWeight: 400,
                      opacity: 0.8,
                    }}
                  >
                    {side}
                  </Box>
                </Typography>

                {reading && perio && <DepthTag reading={reading} perio={perio} />}

                {lesion && lesion.length > 0 && (
                  // The grades ride in the badge once any are recorded, so the
                  // arch says how far the tooth's lesions have got without the
                  // panel: "Caries, C2" — or "Caries, C2, C3" where surfaces differ.
                  <CariesTag
                    label={[caries.badge, ...(cariesGrades?.get(tooth.fdi) ?? [])].join(', ')}
                  />
                )}

                {fixture && <ImplantTag label={implants.badge} />}

                {canal && endo && <EndoTag label={endo.badge} />}

                {post && <PostCoreTag label={postCore.badge} />}
              </Box>
              )
            })}
        </Box>
      </Box>
    </Tooltip>
  )
}
