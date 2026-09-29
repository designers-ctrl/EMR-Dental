import { useEffect, useMemo } from 'react'
import { invalidate } from '@react-three/fiber'
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  MeshPhysicalMaterial,
  Vector3,
} from 'three'

import {
  endoByFdi,
  type EndoChart,
  type EndoFinding,
  type Tooth,
  type ToothType,
} from '../data/patientChart.ts'
import { toothModelByFdi, type ToothModel } from '../data/toothModels.ts'
import { DIMMED_ENAMEL, ENDO_PAINT, ringNeck, useGingivalRings } from './toothScene.ts'

/**
 * The root canal system, drawn as real geometry INSIDE the teeth that carry a
 * finding.
 *
 * Unlike the perio, caries and implant layers, this one is not a mark on a
 * surface — it is a structure in the middle of the tooth, and that difference
 * decides the whole approach. An earlier version of this file painted the pulp
 * onto the tooth's shell with a shader, the way `CariesLayer` stains enamel,
 * and it was almost invisible: a fragment on the OUTSIDE of a tooth is a whole
 * tooth-radius away from the canal running down its middle, so the distance
 * test that lights a lesion never fired. A structure inside the tooth has to be
 * modelled inside the tooth, and the tooth over it has to turn to glass —
 * `pulpWindowEnamel` in `toothScene.ts`, applied by `ToothArch.tsx` to these
 * teeth only.
 *
 * A cutaway section was tried after this and taken back out: clipping the tooth
 * with a camera-facing plane gave crisper edges, but the cut face has no true
 * cap without a stencil pass, and an opened tooth read worse in the arch than a
 * closed one seen into.
 *
 * ⚠️ TAB-SCOPED. The pulp shows on the Endo Chart tab only — see `EndoChart` in
 * the dataset for why thirty-two lit pulps is not a default, and
 * `pulpWindowEnamel` for why thirty-two glass teeth is not either.
 *
 * ⚠️ The canals are LAID OUT, not measured. `teeth.glb` carries no pulp
 * geometry, so their paths are built from each tooth's own measured size and
 * the canal names in the record. That makes the drawing honest about the count
 * and roughly where the canals sit, and silent about everything a radiograph
 * would settle — curvature, working length, where a canal splits or rejoins.
 * The panel beside the arch states the count in words and carries the
 * disclaimer for exactly that reason.
 */

/** Millimetres, the unit a chart speaks, as metres — the unit the scene does. */
const MM = 0.001

/**
 * The canal system's proportions, as fractions of the tooth's measured size.
 *
 * Derived rather than fixed so a canal in a 30 mm molar and one in a 21 mm
 * incisor are both in proportion to the tooth holding them, instead of a single
 * millimetre figure that suits one and not the other.
 */
const CANAL = {
  /** Fallback chamber depth when no junction was traced, as a fraction of height. */
  roof: 0.3,
  /** How far towards the apex the canals run, as a fraction of height. */
  reach: 0.9,
  /**
   * Where the pulp chamber sits between the biting tip (0) and the cemento-
   * enamel junction (1). Just coronal of the junction, which is where a chamber
   * is — up in the crown, not down at the neck.
   */
  chamberAt: 0.82,
  /**
   * The chamber's half-extents, as fractions of the tooth's own dimensions.
   *
   * WIDE and FLAT. A pulp chamber is a slab, not a ball: broad mesiodistally
   * and buccolingually, shallow occluso-apically, with its corners drawn out
   * into the horns. Seen from the biting surface it reads as a four-pointed
   * star, which is the single most recognisable thing about it and the thing a
   * sphere cannot express at any size.
   */
  chamberWide: 0.18,
  chamberDeep: 0.18,
  chamberTall: 0.17,
  /**
   * How far the chamber's corners are drawn out towards the horns, as a
   * fraction of its own radius. This is what makes the star.
   */
  chamberLobe: 0.32,
  /** How much the chamber flares from roof to floor, where the orifices are. */
  chamberFlare: 0.28,
  /**
   * Pulp horns — the points running into the cusps, one per cusp rather than
   * one per canal. An upper molar has four cusps and three canals, so tying
   * horns to canals put the wrong number on the tooth.
   */
  hornAt: 0.46,
  /**
   * Where the horns sit, as a multiple of the chamber's half-width. Matched to
   * the lobe peak — a horn has to continue the star's point, and anything less
   * puts it on a flat face inside the chamber's own footprint.
   */
  hornSpread: 1.3,
  hornWide: 0.3,
  /**
   * Canal radius at the ORIFICE, as a fraction of tooth width. A canal is a
   * thread: a few tenths of a millimetre for most of its length, flaring only
   * where it leaves the chamber floor.
   */
  wide: 0.045,
  /**
   * How much of the orifice width a canal keeps once it is into the root.
   * Well under a third — the reference's canals are hairlines by mid-root, and
   * the previous value drew them as tubes.
   */
  hold: 0.24,
  /** How far a multi-canal system's canals sit off the axis, at the chamber. */
  spread: 0.17,
  /** How much further apart they are at the apex — a molar's roots splay. */
  splay: 1.55,
  /** How far a canal bows out on its way down. Real canals are never straight. */
  bow: 0.16,
}

/** Cusps per tooth type, which is what sets the number of pulp horns. */
const HORNS: Record<ToothType, number> = { molar: 4, premolar: 2, canine: 1, incisor: 3 }

/** Rings along a canal, and sides to each ring. Enough to read as smooth. */
const CANAL_RINGS = 26
const CANAL_SIDES = 12

/** Rings and sides for the chamber's lofted star. */
const CHAMBER_RINGS = 12
const CHAMBER_SIDES = 48

/** How far the pulp drains towards neutral when another tooth is picked. */
const DIMMED_MIX = 0.62

/**
 * Where this tooth's canals run, in its own LOCAL space.
 *
 * Laid out from the tooth's measured height and width and the number of canals
 * the record names — see the warning at the top of this file for what that does
 * and does not claim. The chamber is pinned to the measured cemento-enamel
 * junction where one was traced, because that is roughly where a canal system
 * starts, and it keeps the pulp from running up into the crown on the short
 * molars.
 *
 * `axis` puts the result back into the tooth's real local frame: the layout is
 * done with the root running down +Y for every tooth, then flipped for the
 * uppers, whose roots run the other way.
 */
function canalPaths(finding: EndoFinding, model: ToothModel, cej: number | null, axis: 1 | -1) {
  const height = model.size.height * MM
  const width = model.size.width * MM
  const depth = model.size.depth * MM

  const start = cej !== null ? Math.abs(cej) : height * CANAL.roof
  const apex = height * CANAL.reach
  const spread = CANAL.spread

  // One canal runs the tooth's own long axis. More than one splays off it: a
  // group fanned across one face and a lone canal opposite them, which is the
  // ARRANGEMENT of an upper molar's canal system — two together and one on its
  // own across the tooth.
  //
  // ⚠️ Which of those two faces is buccal is NOT asserted. The export documents
  // local Z as the buccolingual axis but not which sign points at the cheek,
  // and this layer has no way to check, so the drawing claims the pattern and
  // not the laterality. That is why the panel names each canal — "Mesiobuccal",
  // "Palatal" — instead of leaving a reader to work out which drawn canal is
  // which from where it sits. Confirm the sign against the blend before any
  // reading is taken off the picture.
  const offsets: [number, number][] =
    finding.canals.length === 1
      ? [[0, 0]]
      : finding.canals.map((_, index, all) => {
          const lone = index === all.length - 1
          const grouped = all.length - 1
          const across = grouped > 1 ? (index / (grouped - 1)) * 2 - 1 : 0
          return lone ? [0, -depth * spread] : [across * width * spread, depth * spread * 0.8]
        })

  // The chamber sits just CORONAL of the junction — up in the crown, which is
  // where a pulp chamber is. Seating it at the junction, as the first version
  // did, put the widest part of the pulp down at the neck of the tooth.
  const chamberY = start * CANAL.chamberAt

  // Horns rise towards the CUSPS — one per cusp, from the tooth's type, not one
  // per canal. An upper molar has four cusps and three canals, so driving the
  // horns off the canal list put three horns on a four-cusped tooth.
  //
  // They sit at the chamber's corners, which is where the lofted star's points
  // are, so each horn continues a point of the slab instead of sprouting from
  // a flat face.
  const hornY = start * CANAL.hornAt
  const hornRadiusX = width * CANAL.chamberWide * CANAL.hornSpread
  const hornRadiusZ = depth * CANAL.chamberDeep * CANAL.hornSpread
  const hornCount = HORNS[model.type]
  const horns: [number, number][] = Array.from({ length: hornCount }, (_, index) => {
    // Same phase as the chamber's lobes, so horn and point line up.
    const angle = (index / hornCount) * Math.PI * 2 + Math.PI / hornCount
    return [hornRadiusX * Math.cos(angle), hornRadiusZ * Math.sin(angle)]
  })

  return {
    chamber: new Vector3(0, chamberY * axis, 0),
    horns: horns.map(([x, z]) => ({
      base: new Vector3(x * 0.55, chamberY * axis, z * 0.55),
      tip: new Vector3(x, hornY * axis, z),
    })),
    canals: offsets.map(([x, z]) => ({
      // Canals leave from inside the chamber, so the two forms merge rather
      // than meeting at a visible seam.
      top: new Vector3(x * 0.7, chamberY * axis, z * 0.7),
      apex: new Vector3(x * CANAL.splay, apex * axis, z * CANAL.splay),
    })),
  }
}

/**
 * A tube swept along a path with a radius that varies down it.
 *
 * The whole reason this exists rather than a `CylinderGeometry`: a canal is not
 * a cone. It leaves the chamber wide, holds much of that width through the
 * coronal third, then runs down to a point fine enough to disappear at the
 * foramen — and it bows on the way. A cylinder can express none of that, which
 * is exactly what made the first version read as red rods stuck in a tooth.
 *
 * Rings are framed off the local tangent with an arbitrary but STABLE reference
 * axis, so a bowed path does not twist as it goes. Both ends come to a true
 * point (radius 0), so no cap is needed and nothing ends in a flat disc.
 */
function sweep(at: (t: number) => Vector3, radius: (t: number) => number): BufferGeometry {
  const positions: number[] = []
  const indices: number[] = []

  const tangent = new Vector3()
  const across = new Vector3()
  const through = new Vector3()
  const reference = new Vector3()

  for (let ring = 0; ring <= CANAL_RINGS; ring += 1) {
    const t = ring / CANAL_RINGS
    const centre = at(t)
    // Central difference, clamped at the ends — the path is smooth, so this is
    // a better tangent than a one-sided difference at the tip.
    const ahead = at(Math.min(1, t + 0.01))
    const behind = at(Math.max(0, t - 0.01))
    tangent.subVectors(ahead, behind).normalize()

    // Any axis not parallel to the tangent will do; picking by the tangent's
    // smallest component is what keeps the choice stable ring to ring.
    reference.set(
      Math.abs(tangent.x) < 0.9 ? 1 : 0,
      Math.abs(tangent.x) < 0.9 ? 0 : 1,
      0,
    )
    across.crossVectors(tangent, reference).normalize()
    through.crossVectors(tangent, across).normalize()

    const r = radius(t)
    for (let side = 0; side < CANAL_SIDES; side += 1) {
      const angle = (side / CANAL_SIDES) * Math.PI * 2
      positions.push(
        centre.x + (across.x * Math.cos(angle) + through.x * Math.sin(angle)) * r,
        centre.y + (across.y * Math.cos(angle) + through.y * Math.sin(angle)) * r,
        centre.z + (across.z * Math.cos(angle) + through.z * Math.sin(angle)) * r,
      )
    }
  }

  for (let ring = 0; ring < CANAL_RINGS; ring += 1) {
    for (let side = 0; side < CANAL_SIDES; side += 1) {
      const a = ring * CANAL_SIDES + side
      const b = ring * CANAL_SIDES + ((side + 1) % CANAL_SIDES)
      const c = a + CANAL_SIDES
      const d = b + CANAL_SIDES
      indices.push(a, c, b, b, c, d)
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

/**
 * One canal, from its orifice in the chamber to a point at the apex.
 *
 * `bow` pushes the middle of the run out sideways, away from the tooth's long
 * axis. Straight canals do not exist, and a set of perfectly straight ones
 * reads as engineering rather than anatomy.
 */
function canalGeometry(top: Vector3, apex: Vector3, wide: number): BufferGeometry {
  const run = new Vector3().subVectors(apex, top)
  const length = run.length()

  // Bow outwards from the axis where the canal already leans, so a splayed
  // molar canal curves the way its root does rather than in a random direction.
  const lean = new Vector3(top.x, 0, top.z)
  const sideways =
    lean.lengthSq() > 1e-12 ? lean.normalize() : new Vector3(1, 0, 0)
  const bow = sideways.multiplyScalar(length * CANAL.bow)

  return sweep(
    (t) => {
      // Quadratic through the bowed midpoint.
      const straight = new Vector3().copy(top).addScaledVector(run, t)
      return straight.addScaledVector(bow, 4 * t * (1 - t) * 0.5)
    },
    // A funnel, then a thread. The orifice flares where the canal leaves the
    // chamber floor and drops away fast to a hairline that runs most of the
    // root, closing at the foramen. A single power curve — what this replaced —
    // spends the whole root getting thinner and reads as a tapered tube the
    // width of a root canal file handle rather than of a canal.
    (t) =>
      wide *
      (CANAL.hold + (1 - CANAL.hold) * Math.pow(1 - t, 3.2)) *
      (1 - Math.pow(t, 7)),
  )
}

/**
 * A pulp horn: the point of the chamber that runs up into a cusp.
 *
 * Short, and coming to nothing at the tip — the horns are what separate a pulp
 * chamber from a bead, and on a molar they are the landmark an access cavity is
 * cut to.
 */
function hornGeometry(base: Vector3, tip: Vector3, wide: number): BufferGeometry {
  const run = new Vector3().subVectors(tip, base)
  return sweep(
    (t) => new Vector3().copy(base).addScaledVector(run, t),
    (t) => wide * Math.pow(1 - t, 1.35),
  )
}

/**
 * The pulp chamber: a flat slab with its corners drawn out into the horns.
 *
 * Lofted from a STAR cross-section rather than scaled from a sphere, and that
 * is the whole point. Look at a molar chamber from the biting surface and it is
 * a four-pointed star — a rounded quadrilateral pulled out towards each cusp —
 * flat enough that its height is a fraction of its width. An ellipsoid gets the
 * flatness and misses the star, which is the feature that makes the shape
 * recognisable as a pulp chamber at all.
 *
 * `lobes` is the cusp count, so a molar gets four points and a premolar two.
 * The section also FLARES from roof to floor, because the floor is where the
 * canal orifices are and they sit out at the corners.
 */
function chamberGeometry(at: Vector3, half: Vector3, lobes: number, axis: 1 | -1): BufferGeometry {
  const positions: number[] = []
  const indices: number[] = []

  // Peak the lobes at the corners — 45°, 135°, … for four — rather than square
  // on the axes, which is where a molar's cusps actually sit.
  const phase = Math.PI

  for (let ring = 0; ring <= CHAMBER_RINGS; ring += 1) {
    const t = ring / CHAMBER_RINGS
    // Roof (occlusal) to floor (apical). The chamber's own axis follows the
    // tooth's, so an upper's chamber is built the other way up.
    const y = at.y + axis * (-half.y + 2 * half.y * t)
    const flare = 1 - CANAL.chamberFlare + CANAL.chamberFlare * t

    for (let side = 0; side < CHAMBER_SIDES; side += 1) {
      const angle = (side / CHAMBER_SIDES) * Math.PI * 2
      const lobe = 1 + CANAL.chamberLobe * Math.cos(lobes * angle - phase)
      const reach = flare * lobe
      positions.push(
        at.x + half.x * reach * Math.cos(angle),
        y,
        at.z + half.z * reach * Math.sin(angle),
      )
    }
  }

  for (let ring = 0; ring < CHAMBER_RINGS; ring += 1) {
    for (let side = 0; side < CHAMBER_SIDES; side += 1) {
      const a = ring * CHAMBER_SIDES + side
      const b = ring * CHAMBER_SIDES + ((side + 1) % CHAMBER_SIDES)
      indices.push(a, a + CHAMBER_SIDES, b, b, a + CHAMBER_SIDES, b + CHAMBER_SIDES)
    }
  }

  // Fan both ends shut. The chamber is a solid, and an open roof would show its
  // inside through the tooth as a dark hollow.
  const roofCentre = positions.length / 3
  positions.push(at.x, at.y - axis * half.y, at.z)
  const floorCentre = positions.length / 3
  positions.push(at.x, at.y + axis * half.y, at.z)

  const lastRing = CHAMBER_RINGS * CHAMBER_SIDES
  for (let side = 0; side < CHAMBER_SIDES; side += 1) {
    const next = (side + 1) % CHAMBER_SIDES
    indices.push(roofCentre, side, next)
    indices.push(floorCentre, lastRing + next, lastRing + side)
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

/**
 * The pulp's own material.
 *
 * LIT, unlike the flat overlays the other layers use. Those are marks on a
 * surface and shading them would have implied a depth they do not have; this is
 * an actual solid inside a translucent tooth, and letting the studio light it
 * is what makes it sit *in* the tooth rather than floating as a red decal.
 */
function pulpMaterial(colour: string, dimmed: boolean) {
  const tint = new Color(colour)
  if (dimmed) tint.lerp(new Color(DIMMED_ENAMEL.tint), DIMMED_MIX)

  return new MeshPhysicalMaterial({
    color: tint,
    roughness: 0.55,
    metalness: 0,
    clearcoat: 0.25,
  })
}

export function EndoLayer({
  teeth,
  endo,
  selectedFdi,
}: {
  teeth: Tooth[]
  endo: EndoChart
  selectedFdi: number | null
}) {
  const rings = useGingivalRings()

  // Geometry does not depend on the selection — only the two materials below
  // do, so clicking a tooth never rebuilds a canal.
  const pulps = useMemo(() => {
    const found = endoByFdi(endo)

    return teeth.flatMap((tooth) => {
      // A missing tooth has no pulp to show, and canals floating where one used
      // to be would read as a finding on a tooth that is not there.
      if (tooth.status === 'missing') return []

      const finding = found.get(tooth.fdi)
      if (!finding) return []

      const model = toothModelByFdi[tooth.fdi]
      const axis: 1 | -1 = tooth.arch === 'upper' ? 1 : -1
      const ring = rings.get(model.node)
      const paths = canalPaths(finding, model, ring ? ringNeck(ring, axis).y : null, axis)

      const wide = model.size.width * MM * CANAL.wide
      const half = new Vector3(
        model.size.width * MM * CANAL.chamberWide,
        // Measured against the CROWN's length, not the whole tooth: the
        // chamber lives in the crown, so a molar's short crown gets a short
        // chamber instead of one sized off its long roots. Kept well under the
        // two lateral extents — the slab is flat, and that is not incidental.
        Math.abs(paths.chamber.y) * CANAL.chamberTall,
        model.size.depth * MM * CANAL.chamberDeep,
      )

      return [
        {
          key: tooth.fdi,
          model,
          parts: [
            chamberGeometry(paths.chamber, half, HORNS[model.type], axis),
            ...paths.horns.map((horn) =>
              hornGeometry(horn.base, horn.tip, wide * CANAL.hornWide),
            ),
            ...paths.canals.map((canal) => canalGeometry(canal.top, canal.apex, wide)),
          ],
        },
      ]
    })
  }, [teeth, endo, rings])

  /** One material per state, shared by every canal on screen. */
  const paint = useMemo(
    () => ({
      lit: pulpMaterial(ENDO_PAINT.canal, false),
      dim: pulpMaterial(ENDO_PAINT.canal, true),
    }),
    [],
  )

  // The canvas only draws on demand, so a pulp appearing, receding behind a
  // selection or losing its tab has to ask for the frame that shows it.
  useEffect(() => invalidate(), [pulps, selectedFdi])

  useEffect(
    () => () => {
      for (const pulp of pulps) for (const part of pulp.parts) part.dispose()
    },
    [pulps],
  )

  useEffect(
    () => () => {
      paint.lit.dispose()
      paint.dim.dispose()
    },
    [paint],
  )

  return (
    <group>
      {pulps.map((pulp) => {
        const material = selectedFdi !== null && selectedFdi !== pulp.key ? paint.dim : paint.lit

        return (
          <group
            key={pulp.key}
            position={pulp.model.archPosition}
            quaternion={pulp.model.archRotation}
          >
            {pulp.parts.map((part, index) => (
              <mesh
                key={index}
                geometry={part}
                material={material}
                // The pulp is opaque and the tooth over it is not, so this is
                // drawn in the opaque pass and the glass shell lands on top of
                // it — which is the whole reason it can be seen at all.
                // The click belongs to the tooth, which is what opens the
                // record.
                raycast={() => null}
              />
            ))}
          </group>
        )
      })}
    </group>
  )
}
