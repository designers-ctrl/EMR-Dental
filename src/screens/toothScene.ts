import { useMemo } from 'react'
import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import {
  BufferAttribute,
  type BufferGeometry,
  Color,
  DoubleSide,
  type Mesh,
  MeshPhysicalMaterial,
  Vector3,
} from 'three'

import type { ToothStatus } from '../data/patientChart.ts'
import teethUrl from '../assets/teeth/teeth.glb?url'

/**
 * What the arch view is built from: the teeth themselves and the enamel they
 * are painted with. The light they are lit by is `ToothStudio.tsx`.
 *
 * The 32 meshes come out of `teeth.glb`, and `ToothArch.tsx` puts them back in
 * the jaw. Kept apart from that view because loading and painting the geometry
 * is a different job from framing and orbiting it.
 */

/**
 * Enamel per treatment state, matching the palette the SVG glyphs used:
 * restored reads as a cold inlay, watch as a warm stain, missing as a ghost of
 * the tooth that is gone.
 */
const STATUS_PAINT: Record<ToothStatus, { color: string; roughness: number; opacity: number }> = {
  sound: { color: '#EFE7D5', roughness: 0.3, opacity: 1 },
  restored: { color: '#B4C9DA', roughness: 0.14, opacity: 1 },
  watch: { color: '#E8BE96', roughness: 0.46, opacity: 1 },
  missing: { color: '#C6CAD0', roughness: 0.6, opacity: 0.16 },
}

/**
 * The stain a carious lesion leaves on enamel.
 *
 * These are PATHOLOGY, not palette — the brown of demineralised enamel and the
 * near-black of a lesion deep in a fissure, the same pair a clinical photo
 * shows. They deliberately do NOT come from a theme channel: `warning` amber
 * would read as a chart annotation laid over a healthy tooth rather than as
 * decay in it, and the whole point of the mark is that it looks like the thing
 * it is.
 *
 * They sit here beside `STATUS_PAINT` because that is where this file's other
 * hardcoded, non-theme-driven tooth colours already live — so the known open
 * item of making the enamel follow the palette picks these up with it, rather
 * than finding a second set hidden in a view.
 *
 * ⚠️ A lesion is never left to colour alone. The stain is the visual index
 * into a finding that is also written out — on the tooth badge, in the caption
 * under the arch, in the legend and in the panel that opens when the tooth is
 * picked.
 */
export const CARIES_PAINT = {
  /** Where demineralised enamel first discolours, at the lesion's margin. */
  halo: '#9A6533',
  /** The core of it, down in the fissure. */
  core: '#2A1708',
  /**
   * The band round the side of the crown, heaviest towards the neck of the
   * tooth and fading out as it runs down the axial wall. Lighter and warmer
   * than the lesion's own margin — this is staining spread over a surface,
   * not the lesion itself, so it must not read as more decay.
   */
  cervical: '#B5833F',
}

/**
 * The pulp, drawn through the tooth on the endo chart.
 *
 * Coral, because that is what a pulp IS — the vascular tissue in the middle of
 * the tooth, which reads salmon in every anatomical model and textbook plate.
 * Like `CARIES_PAINT` these are anatomy rather than palette, so they do not come
 * from a theme channel: `error.main` would read as an alarm state attached to
 * the tooth rather than as the tissue inside it.
 *
 * ⚠️ The canals are never left to colour alone. A charted tooth carries the
 * word on its badge, in the caption under the arch, in the legend and in the
 * panel that opens when it is picked — and the canal COUNT, which the drawing
 * cannot state precisely, is written out in all but the badge.
 */
export const ENDO_PAINT = {
  /**
   * The pulp itself. A soft coral rather than the pillar-box red this started
   * as: the reference models, and the tissue, are salmon — a saturated red
   * reads as an alarm painted on the tooth instead of as what is inside it.
   */
  canal: '#DEA08D',
  /** Its margin, where the tissue meets dentin — used by the legend swatch. */
  margin: '#EFC6B8',
}

/**
 * The metal an implant fixture is drawn in.
 *
 * Titanium, which is what an endosseous fixture is — a warm-neutral grey that
 * goes bright at a glancing angle and dark face-on, because a metal reflects
 * its surroundings rather than scattering light the way enamel does. Like
 * `CARIES_PAINT` these are DELIBERATELY not theme channels: the fixture reads
 * as metal because it looks like metal, and a `primary` navy screw would read
 * as a UI annotation drawn over the arch rather than as hardware in the bone.
 *
 * They sit here with this file's other hardcoded tooth colours so the known
 * open item — making the enamel follow the palette — finds them together.
 *
 * ⚠️ The fixture is never left to metal alone. An implanted site is also
 * written out on the tooth badge, in the caption under the arch, in the legend
 * and in the panel that opens when the tooth is picked.
 */
export const IMPLANT_PAINT = {
  /** The fixture body and its thread. */
  metal: '#B6BBC1',
  /** The abutment collar at the neck, a shade darker so the platform reads. */
  collar: '#9BA1A8',
  roughness: 0.32,
}

/**
 * The metal a prefabricated post is drawn in.
 *
 * A shade brighter and glossier than the implant's titanium, because a post is
 * usually a polished alloy sitting INSIDE a translucent crown rather than a
 * grit-blasted fixture in bone — and because the two must be told apart at a
 * glance on the same arch. Like the rest of this file's hardware colours these
 * are deliberately not theme channels: the post reads as metal because it
 * looks like metal.
 *
 * ⚠️ Never left to metal alone. A posted tooth is also written out on the
 * tooth badge, in the caption under the arch, in the legend and in the panel
 * that opens when the tooth is picked.
 */
export const POST_PAINT = {
  metal: '#C8CDD3',
  roughness: 0.18,
}

/**
 * Teeth the selection is not pointing at recede — by draining their colour
 * AND by washing out under a veil of the background.
 *
 * The colour drain came first and does most of the work. The veil was added
 * afterwards because draining alone tops out: enamel is already near-white, so
 * past a certain mix the unpicked teeth stop receding any further and the arch
 * still reads as thirty-two similar shapes.
 *
 * ⚠️ The veil is NOT ordinary transparency, and the difference is the whole
 * reason this is safe. It keeps `depthWrite` ON, so every tooth still occludes
 * the ones behind it and the arch stays sorted front to back. Turning depth
 * writing off — the usual way to make something see-through — is what put
 * thirty-one overlapping shells into each other and sorted the arch into mush
 * the first time this was tried. With depth intact each tooth simply blends
 * towards the card behind it and keeps its silhouette at any angle.
 *
 * `missing` is untouched: it is already a ghost at 0.16, and that IS the point
 * of it, so it must not be washed twice.
 *
 * The tint is NEUTRAL rather than a warm white. Draining the warmth is what
 * separates a picked tooth from its neighbours, since the dentin in the roots
 * is the most saturated thing on screen.
 */
export const DIMMED_ENAMEL = { tint: '#EAEAEC' }

const DIMMED_TINT = new Color(DIMMED_ENAMEL.tint)
/**
 * Pushed high on purpose. With the detail panel open the picked tooth is the
 * subject of the whole screen, so its neighbours drain nearly to the tint and
 * only the one in hand keeps its dentin warmth. Below about 0.85 the arch
 * still reads as thirty-two similar teeth and the selection stops carrying.
 */
const DIMMED_MIX = 0.92

/**
 * How much of an unpicked tooth survives the veil.
 *
 * Held high deliberately. The unpicked teeth are context, not clutter — a
 * clinician reads a tooth against its neighbours, and a chart that fades them
 * to near-nothing has thrown away what the picked tooth is being compared to.
 *
 * It is also what keeps the OLD warning at bay. Depth writing stops the arch
 * sorting into mush, but a low opacity still lets four or five crowded molars
 * read through one another at the back of the arch, which is the same
 * complaint in milder form. 0.74 pushes the unpicked teeth back a clear plane
 * while each still reads as one solid tooth; much below that and the posterior
 * segments start to blur together.
 */
const DIMMED_OPACITY = 0.74

/**
 * At most eight materials exist for the whole screen — one per state, dimmed
 * or not — and they are shared across every row, arch and canvas.
 */
const materials = new Map<string, MeshPhysicalMaterial>()

export function enamel(status: ToothStatus, dimmed: boolean) {
  const key = `${status}:${dimmed}`
  const cached = materials.get(key)
  if (cached) return cached

  const paint = STATUS_PAINT[status]
  const colour = new Color(paint.color)
  if (dimmed) colour.lerp(DIMMED_TINT, DIMMED_MIX)

  const material = new MeshPhysicalMaterial({
    color: colour,
    roughness: paint.roughness,
    metalness: 0,
    // Enamel is a wet, glossy shell over duller dentin; a clearcoat is a cheap
    // stand-in for that without paying for real transmission.
    clearcoat: 0.6,
    clearcoatRoughness: 0.3,
    // The GLB carries the crown/root split as baked vertex colours, which is
    // what keeps all 32 teeth on this handful of shared materials.
    vertexColors: true,
    /*
     * A dimmed tooth takes the veil on top of its drained colour — unless it
     * is already a ghost, which carries its own opacity and must not be washed
     * twice.
     *
     * `depthWrite` stays true, which is what keeps this from becoming the
     * see-through mush described above: the tooth blends towards the card
     * behind it while still hiding whatever it stands in front of.
     */
    transparent: paint.opacity < 1 || dimmed,
    opacity: paint.opacity < 1 ? paint.opacity : dimmed ? DIMMED_OPACITY : 1,
    depthWrite: true,
  })
  materials.set(key, material)
  return material
}

/**
 * The same enamel, with everything apical of the cemento-enamel junction
 * discarded — the crown of an implanted tooth, with no root under it.
 *
 * An implant site has a crown and a fixture and NO natural root, so drawing
 * one would state something false about the anatomy. The cut follows the real
 * scalloped junction rather than a flat plane, because it is the same per-
 * vertex `aCej` bake the perio and caries layers already use: pair this
 * material with `pocketGeometry()` or the attribute is missing and nothing is
 * discarded.
 *
 * `DoubleSide` because the cut leaves the crown open at the neck. The inside
 * of the shell showing there reads as a solid crown; front faces alone would
 * leave a hole looking straight up into it. The fixture's collar covers the
 * edge itself.
 *
 * Cached on the same key as `enamel` plus the axis, so the implanted teeth on
 * screen share materials exactly as the intact ones do.
 */
const crownMaterials = new Map<string, MeshPhysicalMaterial>()

export function crownOnlyEnamel(status: ToothStatus, dimmed: boolean, axis: 1 | -1) {
  const key = `${status}:${dimmed}:${axis}`
  const cached = crownMaterials.get(key)
  if (cached) return cached

  const material = enamel(status, dimmed).clone()
  material.side = DoubleSide
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uAxis = { value: axis }
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         attribute float aCej;
         uniform float uAxis;
         varying float vApical;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vApical = (position.y - aCej) * uAxis;`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n varying float vApical;`)
      // After three's own clipping, so this reads as one more clip rather than
      // shading a fragment that was going to be thrown away anyway.
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
         if (vApical > 0.0) discard;`,
      )
  }
  // Without this every material sharing the base program would be handed this
  // one's compiled shader — three keys its program cache on the material type
  // and defines, not on an `onBeforeCompile` closure.
  material.customProgramCacheKey = () => `crown-only:${axis}`

  crownMaterials.set(key, material)
  return material
}

/**
 * The same enamel, turned to glass so the pulp inside can be seen.
 *
 * Used by the endo chart on the FEW teeth carrying a canal finding, never on
 * the whole arch. The warning on `DIMMED_ENAMEL` is the reason: thirty-two
 * see-through teeth stacked front to back sort into mush, because a transparent
 * surface writes no depth and the painter's-algorithm ordering that replaces it
 * cannot resolve teeth that overlap. Two or three of them, with opaque
 * neighbours around to give the eye something solid, is a completely different
 * proposition — and it is the only way to see a structure that is genuinely
 * inside the tooth.
 *
 * `depthWrite: false` is what lets the canal geometry show through: with it on,
 * the shell would occlude the pulp it is meant to reveal. That also means the
 * teeth BEHIND one of these show through it, which is the honest cost and part
 * of why this is not the default.
 */
const glassMaterials = new Map<string, MeshPhysicalMaterial>()

/**
 * How much enamel is left once it is turned to glass.
 *
 * Stated as OPACITY, so halving the transparency doubles this and then some:
 * the shell was 26% opaque — 74% transparent — and is now 63% opaque, leaving
 * 37% transparency. The pulp reads fainter for it, which is the trade: the
 * tooth has to still look like a tooth.
 */
const PULP_WINDOW_OPACITY = 0.63

export function pulpWindowEnamel(status: ToothStatus, dimmed: boolean) {
  const key = `${status}:${dimmed}`
  const cached = glassMaterials.get(key)
  if (cached) return cached

  const material = enamel(status, dimmed).clone()
  material.transparent = true
  material.opacity = PULP_WINDOW_OPACITY
  material.depthWrite = false
  // Kept glossy: the clearcoat is what stops the shell reading as a flat wash
  // and keeps it looking like a tooth being seen into.
  material.clearcoat = 0.9

  glassMaterials.set(key, material)
  return material
}

/**
 * The GLB's 32 meshes, by node name.
 *
 * `useLoader` caches per URL across every canvas, so the file is fetched and
 * parsed once no matter how many views are on screen. The geometries are
 * shared between them; only the `mesh` nodes wrapping them are per-canvas,
 * since a single object cannot live in two scene graphs.
 */
export function useToothGeometries(): Map<string, BufferGeometry> {
  const gltf = useLoader(GLTFLoader, teethUrl)
  return useMemo(() => {
    const found = new Map<string, BufferGeometry>()
    gltf.scene.traverse((node) => {
      const mesh = node as Mesh
      if (mesh.isMesh) found.set(mesh.name, mesh.geometry)
    })
    return found
  }, [gltf])
}

// ─── THE CEMENTO-ENAMEL JUNCTION ──────────────────────────────────────────

/**
 * Where each tooth's crown ends and its root begins — measured off the mesh,
 * not guessed.
 *
 * The perio layer needs one landmark: the CEJ, the line a periodontal chart
 * measures attachment from. Rather than approximate it as "some fraction of
 * the crown height" — which would put it visibly off the real neck on the
 * short molars — it is read straight out of the geometry the app already
 * loads. `teeth.glb` bakes the crown/root split as VERTEX COLOURS (near-white
 * enamel against warm dentin, see `enamel` above), so every triangle edge
 * that crosses between the two classes sits on the junction. Collecting those
 * crossings traces the CEJ exactly, including its natural scallop — the rise
 * over the proximal surfaces and dip at mid-facial that makes a gum line read
 * as a gum line rather than a flat band.
 *
 * That scallop is the whole reason for doing it this way: it is anatomy the
 * blend already contains, so nothing here invents, renumbers or reshapes a
 * tooth to make the overlay land.
 */

/**
 * Angular samples around each tooth. Seventy-two is a 5° step — fine enough
 * that the proximal peaks survive, coarse enough that mesh noise averages out
 * instead of showing up as a ragged line.
 */
export const RING_SECTORS = 72

/**
 * How far a vertex's red must lead its blue to count as root.
 *
 * The two baked colours are far apart (dentin ≈ #EEDCBD, enamel ≈ #FFFFFF),
 * so anything past a hair of separation classifies cleanly; the margin only
 * has to survive the handful of blended vertices along the junction itself.
 */
const ROOT_WARMTH = 0.05

/**
 * One tooth's CEJ, in that tooth's OWN local space.
 *
 * Sector `s` stands for the angle `(s + 0.5) / RING_SECTORS` of a turn around
 * the tooth's long axis, starting at −π. Stored decomposed rather than as
 * points because both consumers want it that way: the gum line rebuilds
 * points from it after shifting them apically, and the pocket shading looks
 * up `y` alone.
 */
export interface GingivalRing {
  /** Height along the tooth's long axis at each sector, metres. */
  y: Float32Array
  /** Distance out from that axis at each sector, metres. */
  radius: Float32Array
}

/** Sector holding `angle`, as a continuous coordinate for interpolation. */
function sectorOf(angle: number) {
  return ((angle + Math.PI) / (2 * Math.PI)) * RING_SECTORS - 0.5
}

/**
 * Trace one tooth's CEJ by finding every edge that crosses the crown/root
 * colour split, then averaging those crossings into angular sectors.
 *
 * Returns `null` for geometry carrying no vertex colours — there is no
 * junction to read, and a fabricated one would be worse than none.
 */
function ringFromGeometry(geometry: BufferGeometry): GingivalRing | null {
  const position = geometry.getAttribute('position')
  const colour = geometry.getAttribute('color')
  const index = geometry.getIndex()
  if (!position || !colour || !index) return null

  // Warm = dentin = root. `getX`/`getZ` denormalise the stored uint16s, so
  // both channels arrive on 0–1 whatever the accessor's storage type.
  const isRoot = (vertex: number) =>
    colour.getX(vertex) - colour.getZ(vertex) > ROOT_WARMTH

  const sumY = new Float64Array(RING_SECTORS)
  const sumRadius = new Float64Array(RING_SECTORS)
  const hits = new Uint32Array(RING_SECTORS)

  const record = (a: number, b: number) => {
    if (isRoot(a) === isRoot(b)) return
    // The split is a binary classification, so there is no scalar field to
    // solve along the edge — the midpoint is the best estimate available, and
    // at this mesh density it lands within a fraction of a millimetre.
    const x = (position.getX(a) + position.getX(b)) / 2
    const y = (position.getY(a) + position.getY(b)) / 2
    const z = (position.getZ(a) + position.getZ(b)) / 2
    const sector = Math.floor(sectorOf(Math.atan2(z, x)) + 0.5)
    const slot = ((sector % RING_SECTORS) + RING_SECTORS) % RING_SECTORS
    sumY[slot] += y
    sumRadius[slot] += Math.hypot(x, z)
    hits[slot] += 1
  }

  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i)
    const b = index.getX(i + 1)
    const c = index.getX(i + 2)
    record(a, b)
    record(b, c)
    record(c, a)
  }

  const y = new Float32Array(RING_SECTORS)
  const radius = new Float32Array(RING_SECTORS)
  let filled = 0
  for (let s = 0; s < RING_SECTORS; s += 1) {
    if (hits[s] === 0) continue
    y[s] = sumY[s] / hits[s]
    radius[s] = sumRadius[s] / hits[s]
    filled += 1
  }
  if (filled < RING_SECTORS / 4) return null

  // Sectors the junction happened to skip are bridged from their nearest
  // filled neighbours, walking the ring both ways so the seam at ±π closes
  // like any other gap.
  if (filled < RING_SECTORS) {
    const known: number[] = []
    for (let s = 0; s < RING_SECTORS; s += 1) if (hits[s] > 0) known.push(s)

    for (let s = 0; s < RING_SECTORS; s += 1) {
      if (hits[s] > 0) continue
      let before = known[known.length - 1]
      let after = known[0]
      for (const k of known) {
        if (k < s) before = k
        else {
          after = k
          break
        }
      }
      // Distances measured the short way round the ring.
      const gapBefore = ((s - before + RING_SECTORS) % RING_SECTORS) || RING_SECTORS
      const gapAfter = ((after - s + RING_SECTORS) % RING_SECTORS) || RING_SECTORS
      const t = gapBefore / (gapBefore + gapAfter)
      y[s] = y[before] * (1 - t) + y[after] * t
      radius[s] = radius[before] * (1 - t) + radius[after] * t
    }
  }

  return { y, radius }
}

/**
 * Every tooth's CEJ, keyed by the node name in `teeth.glb`.
 *
 * Derived from the same cached geometries the arch draws, and memoised on the
 * loaded file, so the trace runs once per session no matter how many views
 * ask for it.
 */
export function useGingivalRings(): Map<string, GingivalRing> {
  const geometries = useToothGeometries()
  return useMemo(() => {
    const rings = new Map<string, GingivalRing>()
    for (const [node, geometry] of geometries) {
      const ring = ringFromGeometry(geometry)
      if (ring) rings.set(node, ring)
    }
    return rings
  }, [geometries])
}

/**
 * The neck of the tooth as one measurement: where the junction is at its most
 * CORONAL, and how wide the tooth is there.
 *
 * The implant layer seats its collar on this. The junction scallops by a
 * millimetre or so around the tooth, so a collar placed at the average height
 * would leave the cut edge of the crown hanging in the air over the deepest
 * sectors; taking the coronal extreme puts the collar behind the whole scallop
 * instead. `radius` is the mean because the collar is round — it is the
 * emergence profile, not a copy of the junction.
 */
export function ringNeck(ring: GingivalRing, axis: 1 | -1) {
  let coronal = ring.y[0]
  let sum = 0
  for (let s = 0; s < RING_SECTORS; s += 1) {
    // Coronal is DOWN the local axis: uppers grow their roots along +Y, so
    // their crowns — and the most coronal junction with them — are the lower y.
    if (axis === 1 ? ring.y[s] < coronal : ring.y[s] > coronal) coronal = ring.y[s]
    sum += ring.radius[s]
  }
  return { y: coronal, radius: sum / RING_SECTORS }
}

/** The ring's `y` at an arbitrary angle, interpolated across sectors. */
export function ringHeightAt(ring: GingivalRing, angle: number): number {
  const at = sectorOf(angle)
  const low = Math.floor(at)
  const t = at - low
  const a = ((low % RING_SECTORS) + RING_SECTORS) % RING_SECTORS
  const b = (a + 1) % RING_SECTORS
  return ring.y[a] * (1 - t) + ring.y[b] * t
}

/**
 * The ring as points, ready for a curve.
 *
 * `apical` shifts it along the tooth's own axis towards the root — which is
 * what recession IS, the margin migrating apically off the enamel. It is
 * asked per angle rather than given as one number because recession is
 * measured per surface: a tooth can have lost 3 mm on the cheek side and none
 * on the tongue side, and a single ring has to show both. `swell` pushes the
 * points a hair out from the axis so the line rides just clear of the surface
 * instead of z-fighting it.
 */
export function ringPoints(
  ring: GingivalRing,
  {
    axis,
    apical,
    swell,
  }: { axis: 1 | -1; apical: (angle: number) => number; swell: number },
): Vector3[] {
  const points: Vector3[] = []
  for (let s = 0; s < RING_SECTORS; s += 1) {
    const angle = ((s + 0.5) / RING_SECTORS) * 2 * Math.PI - Math.PI
    const radius = ring.radius[s] + swell
    points.push(
      new Vector3(
        radius * Math.cos(angle),
        ring.y[s] + axis * apical(angle),
        radius * Math.sin(angle),
      ),
    )
  }
  return points
}

/**
 * A copy of the tooth carrying its own CEJ height per vertex, as `aCej`.
 *
 * The pocket shading needs to know, at every fragment, how far apical of the
 * junction it has got. Baking that per vertex and letting the rasteriser
 * interpolate keeps the shader to plain arithmetic — no uniform arrays with
 * their dynamic-indexing rules, and no lookup texture with its filtering and
 * float-format caveats.
 *
 * Cached per geometry: only probed teeth ever ask for one, and the same tooth
 * asked twice gets the same buffer back.
 */
const pocketGeometries = new WeakMap<BufferGeometry, BufferGeometry>()

export function pocketGeometry(geometry: BufferGeometry, ring: GingivalRing): BufferGeometry {
  const cached = pocketGeometries.get(geometry)
  if (cached) return cached

  const position = geometry.getAttribute('position')
  const cej = new Float32Array(position.count)
  for (let v = 0; v < position.count; v += 1) {
    cej[v] = ringHeightAt(ring, Math.atan2(position.getZ(v), position.getX(v)))
  }

  // Shares the source's buffers — only the one new attribute is allocated.
  const shell = geometry.clone()
  shell.setAttribute('aCej', new BufferAttribute(cej, 1))
  pocketGeometries.set(geometry, shell)
  return shell
}
