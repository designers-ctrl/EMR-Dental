import { Matrix4, Quaternion, Vector3 } from 'three'

import type { PerioSite } from '../data/patientChart.ts'
import { ARCH_BOUNDS, toothModelByFdi, type ToothModel } from '../data/toothModels.ts'

/**
 * Where the six probing sites of a tooth are — on the tooth itself.
 *
 * A perio chart probes each tooth at six points round its neck: three on the
 * cheek side (disto-, mid- and mesio-buccal) and three on the tongue side.
 * This turns a site name into a direction in the tooth's OWN axes, which the
 * caller then reads the gingival ring at (`toothScene.ts`) to get a point on
 * the real margin.
 *
 * Pure geometry, no React and no loader, so it can be checked on its own.
 *
 * The axes come from the export (`tools/extract-teeth-3d.py`): every tooth
 * stands with its long axis on local Y, its mesiodistal width on local X and
 * its buccolingual depth on local Z. So "buccal" is ±Z and "mesial" is ±X —
 * the only open questions are the two signs, and both are DERIVED from where
 * the tooth sits in the arch rather than tabulated per quadrant, so a
 * re-export that flips a tooth cannot silently put a marker on the wrong side.
 */

/** Middle of the dentition — the same figure the arch frames itself from. */
const CENTRE = ARCH_BOUNDS.min.map((low, axis) => (low + ARCH_BOUNDS.max[axis]) / 2)

/** Which face of the tooth each site is on, and which end of it. */
const SITE_FACING: Record<PerioSite, { facial: 1 | -1; mesial: 1 | 0 | -1 }> = {
  distoBuccal: { facial: 1, mesial: -1 },
  buccal: { facial: 1, mesial: 0 },
  mesioBuccal: { facial: 1, mesial: 1 },
  distoLingual: { facial: -1, mesial: -1 },
  lingual: { facial: -1, mesial: 0 },
  mesioLingual: { facial: -1, mesial: 1 },
}

/**
 * How far round from mid-facial the proximal sites sit, as a share of the
 * angle to the crown's corner. The interproximal sites are probed at the line
 * angles, just short of the contact — so a little inside the diagonal of the
 * tooth's footprint, never past it onto the neighbour's side.
 */
const LINE_ANGLE_SHARE = 0.85

/**
 * Which way is out of the mouth for one tooth, in that tooth's own axes:
 * local +Z or −Z, whichever points away from the middle of the arch.
 */
export function facialDirection(model: ToothModel): Vector3 {
  const outward = new Vector3(
    model.archPosition[0] - CENTRE[0],
    0,
    model.archPosition[2] - CENTRE[2],
  ).normalize()

  const localZ = new Vector3(0, 0, 1).applyQuaternion(new Quaternion(...model.archRotation))
  return new Vector3(0, 0, localZ.dot(outward) < 0 ? -1 : 1)
}

/**
 * The tooth next to this one on its MESIAL side — towards the midline.
 *
 * FDI makes this arithmetic: position 1 is the central incisor, and its mesial
 * neighbour is the other central incisor across the midline (quadrant 1↔2,
 * 3↔4). Every other tooth's mesial neighbour is one position lower in the
 * same quadrant.
 */
function mesialNeighbour(fdi: number): number {
  const quadrant = Math.floor(fdi / 10)
  const position = fdi % 10
  if (position > 1) return quadrant * 10 + position - 1
  const across: Record<number, number> = { 1: 2, 2: 1, 3: 4, 4: 3 }
  return across[quadrant] * 10 + 1
}

/**
 * Which end of local X is mesial for one tooth: the end facing its mesial
 * neighbour, found by bringing the neighbour into this tooth's own axes.
 */
export function mesialSign(model: ToothModel): 1 | -1 {
  const neighbour = toothModelByFdi[mesialNeighbour(model.fdi)]
  const toward = new Vector3(
    neighbour.archPosition[0] - model.archPosition[0],
    neighbour.archPosition[1] - model.archPosition[1],
    neighbour.archPosition[2] - model.archPosition[2],
  ).applyQuaternion(new Quaternion(...model.archRotation).invert())
  return toward.x < 0 ? -1 : 1
}

/**
 * The site's direction round the tooth's long axis, in the tooth's own axes —
 * a unit vector in the local XZ plane.
 */
export function siteDirection(model: ToothModel, site: PerioSite): Vector3 {
  const { facial, mesial } = SITE_FACING[site]
  const z = facialDirection(model).z * facial
  const x = mesialSign(model) * mesial
  // The diagonal of the crown's footprint, measured off the facial axis.
  const corner = Math.atan2(model.size.width, model.size.depth)
  const off = mesial === 0 ? 0 : corner * LINE_ANGLE_SHARE
  return new Vector3(x * Math.sin(off), 0, z * Math.cos(off))
}

/** The angle a direction makes round the long axis, as the gingival ring indexes it. */
export const ringAngle = (direction: Vector3) => Math.atan2(direction.z, direction.x)

/**
 * Seat a point and a direction given in the tooth's own axes into the arch.
 *
 * `point` comes back in ARCH-CENTRED coordinates — the ones the arch is drawn
 * and orbited in, with the dentition's middle at the origin — and `outward` in
 * the arch's axes, pointing away from the tooth's surface at that site.
 */
export function seatSite(model: ToothModel, local: Vector3, direction: Vector3) {
  const rotation = new Quaternion(...model.archRotation)
  const point = local
    .clone()
    .applyMatrix4(
      new Matrix4().compose(new Vector3(...model.archPosition), rotation, new Vector3(1, 1, 1)),
    )
    .sub(new Vector3(CENTRE[0], CENTRE[1], CENTRE[2]))
  const outward = direction.clone().applyQuaternion(rotation).normalize()
  return { point, outward }
}
