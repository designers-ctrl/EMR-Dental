import { useEffect, useMemo } from 'react'
import { invalidate } from '@react-three/fiber'
import { useColorScheme, useTheme, type Theme } from '@mui/material/styles'
import {
  type BufferGeometry,
  CatmullRomCurve3,
  Color,
  FrontSide,
  Matrix4,
  MeshBasicMaterial,
  Quaternion,
  ShaderMaterial,
  TubeGeometry,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import {
  deepestOnAspect,
  perioByFdi,
  PERIO_BUCCAL_SITES,
  PERIO_LINGUAL_SITES,
  type PerioChart,
  type PerioToothReading,
  type Tooth,
} from '../data/patientChart.ts'
import { toothModelByFdi, type ToothModel } from '../data/toothModels.ts'
import {
  pocketGeometry,
  ringPoints,
  useGingivalRings,
  useToothGeometries,
  type GingivalRing,
} from './toothScene.ts'
import { facialDirection } from './perioSites.ts'

/**
 * The periodontal layer — what the "Perio Chart" tab adds ON TOP of the arch.
 *
 * It draws nothing anatomical of its own. The dentition, its 32 meshes and
 * their positions are exactly what `ToothArch.tsx` already renders; this adds
 * the two marks a paper perio chart carries, both derived from the same
 * geometry:
 *
 *   1. the GINGIVAL MARGIN, a fine line traced round every tooth at its
 *      cemento-enamel junction, shifted apically wherever recession is
 *      recorded, and
 *   2. the PROBING DEPTH, a translucent patch on the probed surface running
 *      from that margin down to the base of the pocket.
 *
 * The margin's scallop — up over the proximal surfaces, down at mid-facial —
 * is not styled in. It is the real CEJ read out of the model's own crown/root
 * vertex colours by `toothScene.ts`, which is why the line sits on the neck of
 * every tooth including the short molars, and why it stays right when the user
 * orbits behind the arch.
 *
 * ⚠️ Colour alone never carries a finding here. The line and the patch are a
 * visual index into readings that are also written out — in the tooth badges,
 * in the caption under the arch and in the legend beside it. A clinician who
 * cannot separate the two hues loses nothing.
 */

/** Millimetres, the unit the dataset speaks, as metres — the unit the scene does. */
const MM = 0.001

/** Half-thickness of the margin line. ~0.26 mm across, so it reads when zoomed out. */
const LINE_RADIUS = 0.00013

/** Clearance holding each mark off the enamel it describes, metres. */
const LINE_SWELL = 0.00009
const BAND_SWELL = 0.00006

/**
 * How far round the tooth a probed surface is shaded, as a cosine of the angle
 * off that surface's own direction. 0.3 covers a little over half the facial
 * curve — enough to read as "this surface", narrow enough that a buccal
 * reading never bleeds round onto the lingual.
 */
const FACIAL_SPREAD = 0.3

/** Widths over which the patch fades into its own rim: metres, then cosine. */
const EDGE_FEATHER = 0.0005
const SIDE_FEATHER = 0.14

/** Fill and rim strength of the patch. The rim is what gives it a readable outline. */
const FILL_OPACITY = 0.34
const EDGE_OPACITY = 0.85

// `facialDirection` lives in `perioSites.ts`, shared with the site marker.

/** Puts a tooth-local geometry back where that tooth sits in the jaw. */
function seat(model: ToothModel): Matrix4 {
  return new Matrix4().compose(
    new Vector3(...model.archPosition),
    new Quaternion(...model.archRotation),
    new Vector3(1, 1, 1),
  )
}

/** Root direction along the tooth's own Y: uppers grow up from the bite, lowers down. */
const axisOf = (tooth: Tooth): 1 | -1 => (tooth.arch === 'upper' ? 1 : -1)

/**
 * Reads a channel off the scheme actually on screen.
 *
 * `theme.palette` cannot be used: under `cssVariables` it is frozen at
 * `defaultColorScheme`, and `theme.vars` yields a `var(--…)` string that means
 * nothing to WebGL. Both hexes have to be resolved in JS, which is the same
 * problem the charts have and the same fix.
 */
function channel(theme: Theme, dark: boolean, name: 'error' | 'info'): Color {
  const scheme = dark ? theme.colorSchemes?.dark : theme.colorSchemes?.light
  return new Color(scheme?.palette?.[name]?.main ?? theme.palette[name].main)
}

/**
 * The patch shader.
 *
 * Deliberately unlit and untone-mapped: this is a chart mark, not a material.
 * Lighting it would let the studio's key wash the fill out at the arch's
 * corners, and tone mapping would drag it off the palette hex — on a mark
 * whose whole job is to be recognised at a glance.
 *
 * `aCej` arrives per vertex from `pocketGeometry`, so `vApical` interpolates
 * into "how far apical of this tooth's junction we are, right here" — which is
 * exactly the axis a perio reading is measured on. The patch is then simply
 * everything between the margin and the pocket base that also lies on the
 * probed surface.
 *
 * "On the probed surface" is decided from the fragment's POSITION round the
 * tooth's long axis, not from its normal. The meshes are light — a few hundred
 * vertices each — so an interpolated normal turns over in visible facets, and
 * keying the edge off it cut the patch into a polygon with a staircase for a
 * border. The angle round the axis varies smoothly whatever the mesh density,
 * which is what gives the patch a clean edge. Nothing is lost by dropping the
 * normal: the tooth's own enamel writes depth, so the far side of the same
 * tooth is already hidden behind its front face.
 */
const PATCH_VERTEX = /* glsl */ `
  attribute float aCej;
  uniform float uAxis;
  uniform float uSwell;
  varying float vApical;
  varying vec2 vAround;

  void main() {
    vApical = (position.y - aCej) * uAxis;
    vAround = position.xz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * uSwell, 1.0);
  }
`

const PATCH_FRAGMENT = /* glsl */ `
  uniform vec3 uFill;
  uniform vec3 uEdge;
  uniform vec3 uFacial;
  uniform float uTop;
  uniform float uBottom;
  uniform float uSpread;
  uniform float uFillOpacity;
  uniform float uEdgeOpacity;
  varying float vApical;
  varying vec2 vAround;

  void main() {
    if (vApical < uTop || vApical > uBottom) discard;

    float reach = length(vAround);
    if (reach < 1e-6) discard;
    float facing = dot(vAround / reach, normalize(uFacial.xz));
    if (facing < uSpread) discard;

    // Distance to the nearest border of the patch, in each border's own
    // units, so the rim comes out an even width all the way round.
    float toEnd = min(vApical - uTop, uBottom - vApical) / ${EDGE_FEATHER.toFixed(6)};
    float toSide = (facing - uSpread) / ${SIDE_FEATHER.toFixed(4)};
    float rim = 1.0 - smoothstep(0.0, 1.0, min(toEnd, toSide));

    gl_FragColor = vec4(mix(uFill, uEdge, rim), mix(uFillOpacity, uEdgeOpacity, rim));
    #include <colorspace_fragment>
  }
`

export function PerioLayer({
  teeth,
  perio,
  readings: charted,
}: {
  teeth: Tooth[]
  perio: PerioChart
  /**
   * The readings as they stand NOW — passed in rather than read off `perio`,
   * because the panel edits them. The marks have to follow an entry the
   * moment it is made, or the model and the numbers beside it disagree.
   */
  readings: PerioToothReading[]
}) {
  const geometries = useToothGeometries()
  const rings = useGingivalRings()
  const theme = useTheme()
  const { mode, systemMode } = useColorScheme()
  const dark = (systemMode ?? mode) === 'dark'

  const readings = useMemo(() => perioByFdi(charted), [charted])

  /**
   * Every tooth's margin, merged into one geometry.
   *
   * A missing tooth is skipped rather than drawn: there is no junction to
   * measure from, and a margin floating where a tooth used to be would read as
   * a finding on a tooth that is not there.
   */
  const marginGeometry = useMemo(() => {
    const parts: BufferGeometry[] = []

    for (const tooth of teeth) {
      if (tooth.status === 'missing') continue
      const model = toothModelByFdi[tooth.fdi]
      const ring: GingivalRing | undefined = rings.get(model.node)
      if (!ring) continue

      const reading = readings.get(tooth.fdi)
      const facial = facialDirection(model)
      // The margin follows the WORST site on each aspect: a ring drawn from an
      // average would sit above the deepest recession on the tooth and read as
      // less attachment loss than was recorded.
      const buccal = reading
        ? deepestOnAspect(reading, PERIO_BUCCAL_SITES).reading.recession * MM
        : 0
      const lingual = reading
        ? deepestOnAspect(reading, PERIO_LINGUAL_SITES).reading.recession * MM
        : 0

      // Blend the two surfaces' recession round the tooth, so a ring carrying
      // a reading on one side only dips on that side.
      const apical = (angle: number) => {
        if (buccal === lingual) return buccal
        const towardsFacial = Math.cos(angle) * facial.x + Math.sin(angle) * facial.z
        const t = (towardsFacial + 1) / 2
        return lingual + (buccal - lingual) * t
      }

      const points = ringPoints(ring, { axis: axisOf(tooth), apical, swell: LINE_SWELL })
      const tube = new TubeGeometry(
        new CatmullRomCurve3(points, true),
        points.length * 2,
        LINE_RADIUS,
        6,
        true,
      )
      tube.applyMatrix4(seat(model))
      parts.push(tube)
    }

    if (parts.length === 0) return null
    const merged = mergeGeometries(parts)
    for (const part of parts) part.dispose()
    return merged
  }, [teeth, rings, readings])

  const marginMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: channel(theme, dark, 'error'),
        // Left off the tone map so the line keeps the palette's exact red.
        toneMapped: false,
      }),
    [theme, dark],
  )

  /**
   * One patch per DISEASED aspect, carrying that aspect's worst reading.
   *
   * Two patches per tooth at most, not six. The three sites on an aspect sit
   * within a couple of millimetres of each other on a surface a few
   * millimetres across, so drawing them separately produces overlapping
   * translucent slivers that read as noise rather than as three readings —
   * and the numbers themselves are already stated exactly, site by site, in
   * the panel. The patch's job is to show WHERE and ROUGHLY HOW FAR, so it
   * takes the deepest site on the aspect and leaves the precision to the text.
   *
   * A patch is drawn only at or past `flagDepth`, which is what the legend
   * promises — a healthy 2 mm sulcus is not shaded.
   */
  const patches = useMemo(() => {
    const fill = channel(theme, dark, 'info')
    const edge = fill.clone().offsetHSL(0, 0, dark ? 0.06 : -0.12)

    return teeth.flatMap((tooth) => {
      if (tooth.status === 'missing') return []
      const reading = readings.get(tooth.fdi)
      if (!reading) return []

      const model = toothModelByFdi[tooth.fdi]
      const ring = rings.get(model.node)
      const geometry = geometries.get(model.node)
      if (!ring || !geometry) return []

      const facial = facialDirection(model)

      return (
        [
          { aspect: 'buccal', sites: PERIO_BUCCAL_SITES, direction: facial },
          { aspect: 'lingual', sites: PERIO_LINGUAL_SITES, direction: facial.clone().negate() },
        ] as const
      ).flatMap(({ aspect, sites, direction }) => {
        const worst = deepestOnAspect(reading, sites).reading
        if (worst.pocketDepth < perio.flagDepth) return []

        const material = new ShaderMaterial({
          vertexShader: PATCH_VERTEX,
          fragmentShader: PATCH_FRAGMENT,
          uniforms: {
            uAxis: { value: axisOf(tooth) },
            uSwell: { value: BAND_SWELL },
            uFill: { value: fill },
            uEdge: { value: edge },
            uFacial: { value: direction },
            uTop: { value: worst.recession * MM },
            uBottom: { value: (worst.recession + worst.pocketDepth) * MM },
            uSpread: { value: FACIAL_SPREAD },
            uFillOpacity: { value: FILL_OPACITY },
            uEdgeOpacity: { value: EDGE_OPACITY },
          },
          transparent: true,
          // Translucent marks must not occlude each other or the teeth behind
          // them, but they DO have to be hidden by teeth in front.
          depthWrite: false,
          side: FrontSide,
        })

        return [
          {
            key: `${tooth.fdi}-${aspect}`,
            geometry: pocketGeometry(geometry, ring),
            material,
            model,
          },
        ]
      })
    })
  }, [perio, readings, teeth, rings, geometries, theme, dark])

  // The canvas only draws on demand, so a layer appearing, changing colour
  // scheme or losing an arch has to ask for the frame that shows it.
  useEffect(() => invalidate(), [marginGeometry, patches])

  useEffect(
    () => () => {
      marginGeometry?.dispose()
      marginMaterial.dispose()
      for (const patch of patches) patch.material.dispose()
    },
    [marginGeometry, marginMaterial, patches],
  )

  return (
    <group>
      {marginGeometry && (
        <mesh geometry={marginGeometry} material={marginMaterial} renderOrder={1} raycast={() => null} />
      )}

      {patches.map((patch) => (
        <mesh
          key={patch.key}
          geometry={patch.geometry}
          material={patch.material}
          position={patch.model.archPosition}
          quaternion={patch.model.archRotation}
          renderOrder={2}
          // The marks are decoration over the teeth; clicks belong to the
          // tooth underneath, which is what selects it.
          raycast={() => null}
        />
      ))}
    </group>
  )
}
