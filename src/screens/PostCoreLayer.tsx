import { useEffect, useMemo } from 'react'
import { invalidate } from '@react-three/fiber'
import {
  type BufferGeometry,
  Color,
  Curve,
  CylinderGeometry,
  MeshPhysicalMaterial,
  TubeGeometry,
  Vector3,
} from 'three'

import {
  postCoreByFdi,
  type PostCoreChart,
  type PostCoreRestoration,
  type Tooth,
} from '../data/patientChart.ts'
import { toothModelByFdi, type ToothModel } from '../data/toothModels.ts'
import { DIMMED_ENAMEL, POST_PAINT, ringNeck, useGingivalRings } from './toothScene.ts'

/**
 * Posts and cores, drawn down the canals of the teeth that carry them.
 *
 * The restorative half of the endo chart: `EndoLayer` draws the canal systems
 * awaiting treatment, and this draws the posts already cemented into the ones
 * that have had it. It rides on the same tab for that reason.
 *
 * A posted tooth carries NO drawn canal. The post occupies the canal it was
 * cemented into, so drawing both would put two things in one space — which is
 * why the two upper central incisors are absent from the endo findings and
 * present here instead.
 *
 * ⚠️ The post is built from the CHARTED diameter and length, so the picture and
 * the panel can never state different sizes. Neither figure was measured on a
 * patient — see `PostCoreChart`.
 */

/** Millimetres, the unit a chart speaks, as metres — the unit the scene does. */
const MM = 0.001

/**
 * The post's proportions, as fractions of the charted diameter and length.
 *
 * Derived so that changing either figure in the dataset produces something
 * that still looks like a post, rather than a stretched copy of a shape tuned
 * for 1.4 × 9 mm.
 */
const POST = {
  /** Core height above the junction, as a fraction of the post's length. */
  coreHeight: 0.42,
  /** Core width at its base, as a multiple of the post radius. */
  coreWide: 2.5,
  /** And at its top, where it tapers in under the crown. */
  coreNarrow: 1.7,
  /** Shaft radius at the head and at the tip, as fractions of the radius. */
  shaftTop: 1,
  shaftTip: 0.62,
  /** Thread crest, as a fraction of the radius — how far it stands proud. */
  threadCrest: 0.22,
  /** Distance between thread crests, millimetres. A stock post is ~0.5. */
  pitch: 0.5,
  /**
   * Half-angle of the slot cut across the core head, radians.
   *
   * The core is drawn as two half-cylinders with this much missing from each
   * side, which reads as the driver slot a preformed post head carries. A
   * solid cylinder reads as a peg and loses the one detail that says "post"
   * rather than "some metal in a tooth".
   */
  slot: 0.16,
}

/** How far the metal recedes when another tooth is picked — see `enamel`. */
const DIMMED_MIX = 0.55

/**
 * A helix wrapped round the post's shaft, tapering with it.
 *
 * Three has no helical curve, and this is the whole of what a thread is: a
 * point going round while it goes down. Sweeping a round crest along it with
 * `TubeGeometry` is roughly a thread's profile.
 *
 * ⚠️ A near-twin of `ThreadPath` in `ImplantLayer`. Kept separate rather than
 * shared because the two threads differ in the ways that matter — a post is
 * parallel-sided where a fixture tapers, and its pitch is half as coarse — and
 * because merging them would mean one file's tuning moving the other's picture.
 * If a third thread ever appears, lift the common part into `toothScene.ts`.
 */
class PostThread extends Curve<Vector3> {
  // Plain fields assigned in the body: `tsconfig` runs `erasableSyntaxOnly`,
  // so constructor parameter properties are not available here.
  readonly top: number
  readonly tip: number
  readonly length: number
  readonly turns: number

  constructor(top: number, tip: number, length: number, turns: number) {
    super()
    this.top = top
    this.tip = tip
    this.length = length
    this.turns = turns
  }

  getPoint(t: number, target = new Vector3()) {
    const angle = t * this.turns * Math.PI * 2
    const radius = this.top + (this.tip - this.top) * t
    // Built along +Y from the core, towards the apex; the view turns it to
    // whichever way the tooth's root actually runs.
    return target.set(radius * Math.cos(angle), t * this.length, radius * Math.sin(angle))
  }
}

interface PostParts {
  core: BufferGeometry[]
  shaft: BufferGeometry
  thread: BufferGeometry
}

/**
 * One post's geometry, in metres, with the top of its core at the origin and
 * the shaft running along +Y.
 *
 * `neck` is the tooth's own measured junction, which is where the core sits —
 * a core is built on the root face, not at a height picked for the post.
 */
function buildPost(restoration: PostCoreRestoration): PostParts {
  const radius = (restoration.diameter / 2) * MM
  const length = restoration.length * MM
  const coreHeight = length * POST.coreHeight

  /*
   * The core, as two half-cylinders with a gap each side.
   *
   * `thetaLength` is what leaves the slot. Both halves are open-ended: the
   * crown closes the top and the shaft fills the bottom, so capping them would
   * only add faces nothing can see.
   */
  const half = Math.PI - POST.slot * 2
  const core = [0, Math.PI].map((rotation) => {
    const piece = new CylinderGeometry(
      radius * POST.coreNarrow,
      radius * POST.coreWide,
      coreHeight,
      18,
      1,
      false,
      rotation + POST.slot,
      half,
    )
    // Grown downward from the origin, so the core's top face is the origin and
    // everything below it is inside the tooth.
    piece.translate(0, coreHeight / 2, 0)
    return piece
  })

  const shaft = new CylinderGeometry(
    radius * POST.shaftTop,
    radius * POST.shaftTip,
    length,
    16,
    1,
    true,
  )
  shaft.translate(0, coreHeight + length / 2, 0)

  const turns = Math.max(3, Math.round(length / (POST.pitch * MM)))
  const thread = new TubeGeometry(
    new PostThread(radius * POST.shaftTop, radius * POST.shaftTip, length, turns),
    turns * 8,
    radius * POST.threadCrest,
    6,
    false,
  )
  thread.translate(0, coreHeight, 0)

  return { core, shaft, thread }
}

/** Titanium, cached per dim state — at most two materials for the whole arch. */
const materials = new Map<string, MeshPhysicalMaterial>()

function postMaterial(dimmed: boolean) {
  const key = String(dimmed)
  const cached = materials.get(key)
  if (cached) return cached

  const colour = new Color(POST_PAINT.metal)
  if (dimmed) colour.lerp(new Color(DIMMED_ENAMEL.tint), DIMMED_MIX)

  const material = new MeshPhysicalMaterial({
    color: colour,
    metalness: 0.95,
    roughness: POST_PAINT.roughness,
  })
  materials.set(key, material)
  return material
}

/** Root direction along the tooth's own Y: uppers grow up from the bite, lowers down. */
const axisOf = (tooth: Tooth): 1 | -1 => (tooth.arch === 'upper' ? 1 : -1)

export function PostCoreLayer({
  teeth,
  postCore,
  selectedFdi,
}: {
  teeth: Tooth[]
  postCore: PostCoreChart
  selectedFdi: number | null
}) {
  const rings = useGingivalRings()

  const posts = useMemo(() => {
    const charted = postCoreByFdi(postCore)

    return teeth.flatMap((tooth) => {
      // A missing tooth has no canal to post, and no root to hold one.
      if (tooth.status === 'missing') return []
      const restoration = charted.get(tooth.fdi)
      if (!restoration) return []

      const model: ToothModel = toothModelByFdi[tooth.fdi]
      const ring = rings.get(model.node)
      // No traced junction, no honest place to seat the core — the post is
      // dropped rather than hung at a height guessed for it, exactly as the
      // implant fixture is.
      if (!ring) return []

      const axis = axisOf(tooth)
      const neck = ringNeck(ring, axis)

      return [
        {
          key: tooth.fdi,
          parts: buildPost(restoration),
          model,
          axis,
          // The core's top sits a little coronal of the junction, up inside
          // the crown where a core is built.
          seat: neck.y * 0.55,
          dimmed: selectedFdi !== null && selectedFdi !== tooth.fdi,
        },
      ]
    })
  }, [teeth, postCore, rings, selectedFdi])

  // The canvas only draws on demand, so a post appearing, receding behind a
  // selection or losing its arch has to ask for the frame that shows it.
  useEffect(() => invalidate(), [posts])

  useEffect(
    () => () => {
      for (const post of posts) {
        for (const piece of post.parts.core) piece.dispose()
        post.parts.shaft.dispose()
        post.parts.thread.dispose()
      }
    },
    [posts],
  )

  return (
    <group>
      {posts.map((post) => (
        <group
          key={post.key}
          position={post.model.archPosition}
          quaternion={post.model.archRotation}
        >
          {/* Built along +Y and turned over for the lower arch, so one set of
              geometry serves both. A negative scale would flip the winding and
              turn every face inside out. */}
          <group
            position={[0, post.seat * post.axis, 0]}
            rotation={post.axis === 1 ? [0, 0, 0] : [Math.PI, 0, 0]}
          >
            {post.parts.core.map((piece, index) => (
              <mesh
                key={index}
                geometry={piece}
                material={postMaterial(post.dimmed)}
                raycast={() => null}
              />
            ))}
            <mesh
              geometry={post.parts.shaft}
              material={postMaterial(post.dimmed)}
              raycast={() => null}
            />
            <mesh
              geometry={post.parts.thread}
              material={postMaterial(post.dimmed)}
              raycast={() => null}
            />
          </group>
        </group>
      ))}
    </group>
  )
}
