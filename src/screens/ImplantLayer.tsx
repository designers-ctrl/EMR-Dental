import { useEffect, useMemo } from 'react'
import { invalidate } from '@react-three/fiber'
import {
  type BufferGeometry,
  Color,
  Curve,
  CylinderGeometry,
  MeshPhysicalMaterial,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three'

import {
  implantsByFdi,
  type ImplantChart,
  type ImplantFixture,
  type Tooth,
} from '../data/patientChart.ts'
import { toothModelByFdi } from '../data/toothModels.ts'
import { DIMMED_ENAMEL, IMPLANT_PAINT, ringNeck, useGingivalRings } from './toothScene.ts'

/**
 * Implant fixtures, drawn where the natural roots are not.
 *
 * This is the one layer that changes the ANATOMY rather than marking it. The
 * perio and caries layers both draw over a tooth that is still whole; an
 * implant site has no root at all, so `ToothArch.tsx` renders the tooth
 * crown-only (`crownOnlyEnamel`) and this puts the fixture under it. Nothing is
 * renumbered or moved: FDI 44 keeps its node, its arch position and its number,
 * and only what sits below its neck changes.
 *
 * ⚠️ The screw is BUILT FROM THE CHART, not modelled from an implant. Its
 * diameter and length are the two figures the dataset carries, and the thread
 * form around them is generic. It shows that a site is implanted and roughly
 * how much fixture is in the bone — it is not a radiograph and must not be read
 * as one, which is why the panel beside the arch states both dimensions in
 * words and carries the disclaimer.
 */

/** Millimetres, the unit a chart speaks, as metres — the unit the scene does. */
const MM = 0.001

/**
 * The fixture's proportions, as fractions of the charted diameter and length.
 *
 * Everything is derived so that changing `diameter` or `length` in the dataset
 * produces a fixture that still looks like one, rather than a stretched copy of
 * a shape tuned for 4.1 × 10 mm.
 */
const FIXTURE = {
  /** Height of the flared collar joining the crown's neck to the platform. */
  collarHeight: 1.5,
  /** Body radius at the platform and at the apex, as fractions of the radius. */
  bodyTop: 0.86,
  bodyApex: 0.58,
  /** Thread crest, as a fraction of the radius — how far it stands proud. */
  threadCrest: 0.16,
  /** Distance between thread crests, millimetres. A stock fixture is ~0.8. */
  pitch: 0.8,
  /** Plain, unthreaded collar under the platform, millimetres. */
  neckBand: 0.9,
}

/** How far the fixture pushes up into the crown, so no gap opens at the cut. */
const SEAT = 0.25 * MM

/** How far the metal recedes when another tooth is picked — see `enamel`. */
const DIMMED_MIX = 0.55

/**
 * A helix wrapped around the fixture body, tapering with it.
 *
 * Three has no helical curve, and this is the whole of what a thread is: a
 * point going round while it goes down. Feeding it to `TubeGeometry` sweeps a
 * round crest along it, which is what a real thread's profile roughly is.
 */
class ThreadPath extends Curve<Vector3> {
  // Plain fields assigned in the body: `tsconfig` runs `erasableSyntaxOnly`,
  // so constructor parameter properties are not available here.
  readonly top: number
  readonly apex: number
  readonly length: number
  readonly turns: number

  constructor(top: number, apex: number, length: number, turns: number) {
    super()
    this.top = top
    this.apex = apex
    this.length = length
    this.turns = turns
  }

  getPoint(t: number, target = new Vector3()) {
    const angle = t * this.turns * Math.PI * 2
    const radius = this.top + (this.apex - this.top) * t
    // Built along −Y from the platform; the view flips it for the uppers.
    return target.set(radius * Math.cos(angle), -t * this.length, radius * Math.sin(angle))
  }
}

interface FixtureParts {
  collar: BufferGeometry
  body: BufferGeometry
  thread: BufferGeometry
  apex: BufferGeometry
}

/**
 * One fixture's geometry, in metres, hanging from a platform at the origin.
 *
 * Four pieces rather than one merged mesh: they carry two different materials
 * (the collar is darker so the platform reads as a joint rather than as more
 * screw), and at one fixture per implanted site the extra draw calls are not
 * worth merging away.
 *
 * `neckRadius` is the tooth's own measured neck, so the collar emerges at the
 * width of the crown above it instead of at a width picked for the fixture.
 */
function buildFixture(fixture: ImplantFixture, neckRadius: number): FixtureParts {
  const radius = (fixture.diameter / 2) * MM
  const length = fixture.length * MM
  const collarHeight = FIXTURE.collarHeight * MM
  const band = FIXTURE.neckBand * MM

  const bodyTop = radius * FIXTURE.bodyTop
  const bodyApex = radius * FIXTURE.bodyApex
  const bodyLength = length - band

  // The collar tapers from the crown's neck down to the platform. Its top is
  // pushed a hair into the crown so the cut edge has metal behind it.
  const collar = new CylinderGeometry(neckRadius, radius, collarHeight, 48, 1, true)
  collar.translate(0, SEAT - collarHeight / 2, 0)

  const body = new CylinderGeometry(bodyTop, bodyApex, bodyLength, 48)
  body.translate(0, -band - bodyLength / 2, 0)

  const turns = Math.max(2, Math.round(bodyLength / (FIXTURE.pitch * MM)))
  const crest = radius * FIXTURE.threadCrest
  const path = new ThreadPath(bodyTop, bodyApex, bodyLength, turns)
  // Sixteen samples a turn keeps the crest round rather than faceted at the
  // zoom the arch allows; the tube's own 8 sides are plenty for a 0.3 mm bead.
  const thread = new TubeGeometry(path, turns * 16, crest, 8, false)
  thread.translate(0, -band, 0)

  // A blunt dome, not a point: a fixture's apex is rounded, and a cone would
  // read as a natural root tip — the exact thing this layer exists to replace.
  const apex = new SphereGeometry(bodyApex, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)
  apex.translate(0, -band - bodyLength, 0)

  return { collar, body, thread, apex }
}

/** Titanium, drained towards neutral when the selection is elsewhere. */
function metal(colour: string, dimmed: boolean) {
  const tint = new Color(colour)
  if (dimmed) tint.lerp(new Color(DIMMED_ENAMEL.tint), DIMMED_MIX)

  return new MeshPhysicalMaterial({
    color: tint,
    metalness: 1,
    roughness: dimmed ? IMPLANT_PAINT.roughness + 0.18 : IMPLANT_PAINT.roughness,
  })
}

export function ImplantLayer({
  teeth,
  implants,
  selectedFdi,
}: {
  teeth: Tooth[]
  implants: ImplantChart
  selectedFdi: number | null
}) {
  const rings = useGingivalRings()

  // Geometry is deliberately NOT memoised on the selection. Sweeping the thread
  // is the expensive part of this layer, and rebuilding it every time somebody
  // clicks a tooth would churn a few thousand triangles for what is only a
  // colour change. Only the materials below depend on what is picked.
  const placed = useMemo(() => {
    const found = implantsByFdi(implants)

    return teeth.flatMap((tooth) => {
      const fixture = found.get(tooth.fdi)
      if (!fixture) return []

      const model = toothModelByFdi[tooth.fdi]
      // No traced junction means no measured neck to seat the collar on. The
      // fixture is dropped rather than hung at a height guessed for it — the
      // site is still stated on the badge, in the caption and in the panel.
      const ring = rings.get(model.node)
      if (!ring) return []

      const axis: 1 | -1 = tooth.arch === 'upper' ? 1 : -1
      const neck = ringNeck(ring, axis)

      return [
        {
          key: tooth.fdi,
          model,
          axis,
          seatY: neck.y,
          parts: buildFixture(fixture, neck.radius),
        },
      ]
    })
  }, [teeth, implants, rings])

  /**
   * Two materials per state, shared by every fixture on screen — the same deal
   * `enamel()` makes for the teeth. Only the picked fixture keeps full metal;
   * the rest drain towards the neutral tint with their neighbours.
   */
  const finish = useMemo(
    () => ({
      lit: { body: metal(IMPLANT_PAINT.metal, false), collar: metal(IMPLANT_PAINT.collar, false) },
      dim: { body: metal(IMPLANT_PAINT.metal, true), collar: metal(IMPLANT_PAINT.collar, true) },
    }),
    [],
  )

  // The canvas only draws on demand, so a fixture appearing, receding behind a
  // selection or losing its arch has to ask for the frame that shows it.
  useEffect(() => invalidate(), [placed, selectedFdi])

  useEffect(
    () => () => {
      for (const implant of placed) {
        for (const part of Object.values(implant.parts)) part.dispose()
      }
    },
    [placed],
  )

  useEffect(
    () => () => {
      for (const state of Object.values(finish)) {
        state.body.dispose()
        state.collar.dispose()
      }
    },
    [finish],
  )

  return (
    <group>
      {placed.map((implant) => {
        const paint = selectedFdi !== null && selectedFdi !== implant.key ? finish.dim : finish.lit

        return (
          <group
            key={implant.key}
            position={implant.model.archPosition}
            quaternion={implant.model.archRotation}
          >
            {/*
              The fixture is built hanging along −Y, which is apical for a lower
              tooth. Half a turn about X points it the other way for an upper —
              a rotation rather than a negative scale, which would turn every
              normal inside out and light the screw from within.
            */}
            <group
              position={[0, implant.seatY, 0]}
              rotation={implant.axis === 1 ? [Math.PI, 0, 0] : [0, 0, 0]}
            >
              <mesh geometry={implant.parts.collar} material={paint.collar} raycast={() => null} />
              <mesh geometry={implant.parts.body} material={paint.body} raycast={() => null} />
              <mesh geometry={implant.parts.thread} material={paint.body} raycast={() => null} />
              <mesh geometry={implant.parts.apex} material={paint.body} raycast={() => null} />
            </group>
          </group>
        )
      })}
    </group>
  )
}
