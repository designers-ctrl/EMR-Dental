import { useEffect, useMemo } from 'react'
import { invalidate } from '@react-three/fiber'
import { Color, FrontSide, ShaderMaterial } from 'three'

import { cariesByFdi, type CariesChart, type CariesFinding, type Tooth } from '../data/patientChart.ts'
import { toothModelByFdi } from '../data/toothModels.ts'
import {
  CARIES_PAINT,
  pocketGeometry,
  useGingivalRings,
  useToothGeometries,
} from './toothScene.ts'

/**
 * Carious lesions, stained onto the teeth that carry them.
 *
 * Like `PerioLayer`, this draws nothing anatomical of its own: the tooth is
 * the same mesh out of `teeth.glb` that `ToothArch.tsx` already renders, and
 * this puts a stain on its surface. No tooth is added, replaced, reshaped or
 * renumbered to make the mark land.
 *
 * ⚠️ Unlike the perio layer, this one is NOT gated on a chart tab. Caries is a
 * property of the tooth rather than a reading taken for one chart, so the
 * stain is on in every chart type — see the call site in `ToothArch.tsx`.
 *
 * The lesion is drawn as an overlay copy of the tooth rather than by repainting
 * its enamel, for the reason the perio patch is: `enamel()` hands out at most
 * eight materials shared by all 32 teeth, and giving one tooth its own painted
 * material would break that sharing for every view at once.
 */

/** Millimetres, the unit a chart speaks, as metres — the unit the scene does. */
const MM = 0.001

/** Clearance holding the stain off the enamel it sits on, metres. */
const STAIN_SWELL = 0.00004

/**
 * The shape of an occlusal lesion, in millimetres.
 *
 * Occlusal caries starts in the pits and fissures — the grooves that cannot be
 * cleaned by a brush — and spreads out along them, which is why these are
 * measured along the tooth's own axes rather than as one radius. `fissureLong`
 * runs mesiodistally (the central groove, the longer of the two) and
 * `fissureCross` buccolingually (the transverse grooves). `reach` is how far
 * down from the biting surface the stain is allowed to show at all, which is
 * what keeps it on the occlusal table instead of running down the crown.
 */
const LESION = {
  fossa: 1.4,
  fissureHalfWidth: 1.05,
  fissureLong: 4.4,
  fissureCross: 3.3,
  /** How far the diffuse discolouration spreads out around the grooves. */
  halo: 3.6,
  /**
   * The local origin is the tooth's biting TIP, so this is measured down from
   * the cusp tips — and a molar's central fossa sits a good 2–3 mm below them.
   * Sized to clear the whole occlusal table for that reason: cut short, the
   * window fades out exactly where the lesion is deepest and the stain
   * survives only as a thread across the cusps.
   */
  reach: 5.0,
}

/**
 * The band of staining round the side of the crown, in millimetres.
 *
 * Measured from the CEMENTO-ENAMEL JUNCTION, not from the tooth's tip — which
 * is why this layer asks `toothScene.ts` for the same gingival ring the perio
 * chart uses. The junction is where a crown's enamel gives way to root, it
 * scallops up over the proximal surfaces and dips at mid-facial, and staining
 * gathers along it. Anchoring the band to a fixed height instead would slide
 * it off the neck on the short molars and cut straight across the scallop.
 */
const CERVICAL = {
  /** How far down the crown the band fades out, coronal of the junction. */
  coronal: 3.4,
  /** How far it carries past the junction onto the root. */
  apical: 1.6,
  /** Peak strength, before the shared opacity below. */
  strength: 0.62,
}

/** Strength of the stain, and how far it recedes when another tooth is picked. */
const STAIN_OPACITY = 0.94
const DIMMED_OPACITY = 0.3

/**
 * The stain shader.
 *
 * Unlit, like the perio patch: a lesion this dark is barely moved by the
 * studio's key, and staying off the light rig keeps it from washing out at the
 * corners of the arch where the falloff is steepest.
 *
 * Everything is decided from POSITION in the tooth's own local space, never
 * from the interpolated normal. The export squares every tooth up with its
 * biting tip at the local origin, its root along local ±Y, its mesiodistal
 * width on local X and its buccolingual depth on local Z — so `h` below is
 * "how far down from the biting surface we are" and `x`/`z` are the two axes
 * the fissures actually run along. The meshes are light enough that a normal
 * turns over in visible facets, which is the same reason `PerioLayer` keys off
 * position too.
 */
const STAIN_VERTEX = /* glsl */ `
  attribute float aCej;
  uniform float uAxis;
  uniform float uSwell;
  varying vec3 vLocal;
  varying float vApical;

  void main() {
    vLocal = vec3(position.x, position.y * uAxis, position.z);
    // How far APICAL of this tooth's cemento-enamel junction the fragment is —
    // negative up the crown, positive down the root. Interpolated from a
    // per-vertex bake for the reason the perio patch does it: it keeps the
    // shader to plain arithmetic, with no uniform arrays or lookup textures.
    vApical = (position.y - aCej) * uAxis;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * uSwell, 1.0);
  }
`

const STAIN_FRAGMENT = /* glsl */ `
  uniform vec3 uHalo;
  uniform vec3 uCore;
  uniform float uFossa;
  uniform float uHalfWidth;
  uniform float uLong;
  uniform float uCross;
  uniform float uHaloRadius;
  uniform float uReach;
  uniform float uOpacity;
  uniform vec3 uCervical;
  uniform float uCervicalCoronal;
  uniform float uCervicalApical;
  uniform float uCervicalStrength;
  varying vec3 vLocal;
  varying float vApical;

  void main() {
    float around = atan(vLocal.z, vLocal.x);

    // ── The lesion on the biting surface ──────────────────────────────────
    // Depth below the biting surface. Cusp tips sit at 0 and the fossa a
    // little under them, so the stain is strongest across the whole occlusal
    // table and gone by the time it reaches the crown's walls.
    float occlusal = 1.0 - smoothstep(uReach * 0.62, uReach, vLocal.y);

    float lesion = 0.0;
    if (occlusal > 0.0) {
      float alongMesial = abs(vLocal.x);
      float alongFacial = abs(vLocal.z);
      float outward = length(vLocal.xz);

      // The pit at the centre of the table, where a lesion starts.
      float fossa = 1.0 - smoothstep(uFossa * 0.35, uFossa, outward);

      // The two grooves it spreads along: one running mesiodistally, one
      // across it. Each is narrow on the axis it crosses, long on the axis it
      // runs.
      float central =
        (1.0 - smoothstep(0.0, uHalfWidth, alongFacial)) *
        (1.0 - smoothstep(uFossa, uLong, alongMesial));
      float transverse =
        (1.0 - smoothstep(0.0, uHalfWidth, alongMesial)) *
        (1.0 - smoothstep(uFossa, uCross, alongFacial));

      // Demineralisation bleeding out of the grooves onto the cusp slopes.
      // Its border is deliberately NOT a circle — two low harmonics push it in
      // and out around the tooth, because a lesion with a compass-drawn edge
      // reads as a chart annotation rather than as decay.
      float wobble = 1.0 + 0.19 * sin(3.0 * around) + 0.11 * sin(5.0 * around + 1.7);
      float spread = 1.0 - smoothstep(uFossa, uHaloRadius * wobble, outward);

      lesion = max(spread * 0.46, max(fossa, max(central, transverse))) * occlusal;
    }

    // Two ramps, not one: the diffuse halo climbs to roughly half opacity and
    // stays translucent enamel, then the grooves and the pit carry it the rest
    // of the way to an opaque core. A single ramp either lost the halo or made
    // the whole table look painted.
    float lesionAlpha = (
      0.5 * smoothstep(0.02, 0.46, lesion) +
      0.5 * smoothstep(0.5, 0.94, lesion)
    ) * uOpacity;

    // Caries has no outline — the colour shades from a warm margin into the
    // near-black core, which is part of what separates this mark from the
    // perio patch's deliberate rim.
    vec3 lesionColour = mix(uHalo, uCore, smoothstep(0.42, 0.9, lesion));

    // ── The band round the side of the crown ──────────────────────────────
    // Centred on the cemento-enamel junction and falling away from it in both
    // directions, faster down the root than up the crown. Its lower edge is
    // pushed about by two harmonics for the same reason the lesion's is: a
    // stain that ends on a clean ring reads as a drawn band.
    float edge = 1.0 + 0.16 * sin(4.0 * around + 0.6) + 0.09 * sin(7.0 * around);
    float band =
      (1.0 - smoothstep(0.0, uCervicalCoronal * edge, -vApical)) *
      (1.0 - smoothstep(0.0, uCervicalApical, vApical));
    float bandAlpha = band * uCervicalStrength * uOpacity;

    // Source-over, lesion on top: where the two overlap near the neck of the
    // tooth the darker lesion has to win, and averaging them would wash it
    // into the band instead.
    float alpha = lesionAlpha + bandAlpha * (1.0 - lesionAlpha);
    if (alpha <= 0.004) discard;

    vec3 rgb =
      (lesionColour * lesionAlpha + uCervical * bandAlpha * (1.0 - lesionAlpha)) / alpha;

    gl_FragColor = vec4(rgb, alpha);
    #include <colorspace_fragment>
  }
`

/** Root direction along the tooth's own Y: uppers grow up from the bite, lowers down. */
const axisOf = (tooth: Tooth): 1 | -1 => (tooth.arch === 'upper' ? 1 : -1)

/**
 * Whether this layer draws a mark for a finding.
 *
 * Only the occlusal pattern above is modelled, because that is the only
 * surface the dataset carries a lesion on. A finding on a proximal or facial
 * surface is NOT silently dropped — it still reaches the tooth badge, the
 * caption and the detail panel, which is where the finding is stated in words.
 * It simply has no stain yet, and inventing one shaped like an occlusal lesion
 * would put a mark on the wrong part of the tooth.
 */
const isDrawable = (finding: CariesFinding) => finding.surfaces[0] === 'occlusal'

export function CariesLayer({
  teeth,
  caries,
  selectedFdi,
}: {
  teeth: Tooth[]
  caries: CariesChart
  selectedFdi: number | null
}) {
  const geometries = useToothGeometries()
  const rings = useGingivalRings()

  const stains = useMemo(() => {
    const halo = new Color(CARIES_PAINT.halo)
    const core = new Color(CARIES_PAINT.core)
    const cervical = new Color(CARIES_PAINT.cervical)
    const found = cariesByFdi(caries)

    return teeth.flatMap((tooth) => {
      // A missing tooth has no surface to stain, and a lesion floating where
      // one used to be would read as a finding on a tooth that is not there.
      if (tooth.status === 'missing') return []

      const findings = found.get(tooth.fdi)?.filter(isDrawable)
      if (!findings || findings.length === 0) return []

      const model = toothModelByFdi[tooth.fdi]
      const geometry = geometries.get(model.node)
      if (!geometry) return []

      // The band is measured from the cemento-enamel junction, so it needs the
      // copy of the tooth carrying that junction per vertex — the same cached
      // buffer the perio patch uses. Without a traced ring there is no
      // junction to measure from, and the band is dropped rather than pinned
      // to a height guessed for it; the occlusal lesion is unaffected.
      const ring = rings.get(model.node)
      const shell = ring ? pocketGeometry(geometry, ring) : geometry

      const dimmed = selectedFdi !== null && selectedFdi !== tooth.fdi
      const material = new ShaderMaterial({
        vertexShader: STAIN_VERTEX,
        fragmentShader: STAIN_FRAGMENT,
        uniforms: {
          uAxis: { value: axisOf(tooth) },
          uSwell: { value: STAIN_SWELL },
          uHalo: { value: halo },
          uCore: { value: core },
          uFossa: { value: LESION.fossa * MM },
          uHalfWidth: { value: LESION.fissureHalfWidth * MM },
          uLong: { value: LESION.fissureLong * MM },
          uCross: { value: LESION.fissureCross * MM },
          uHaloRadius: { value: LESION.halo * MM },
          uReach: { value: LESION.reach * MM },
          uOpacity: { value: dimmed ? DIMMED_OPACITY : STAIN_OPACITY },
          uCervical: { value: cervical },
          uCervicalCoronal: { value: CERVICAL.coronal * MM },
          uCervicalApical: { value: CERVICAL.apical * MM },
          // Zero without a traced junction, which switches the band off
          // rather than letting an absent `aCej` default it to the tooth's
          // biting tip and paint a ring across the cusps.
          uCervicalStrength: { value: ring ? CERVICAL.strength : 0 },
        },
        transparent: true,
        // The stain must be hidden by teeth in front of it, but must not
        // occlude anything itself.
        depthWrite: false,
        side: FrontSide,
      })

      return [{ key: tooth.fdi, geometry: shell, material, model }]
    })
  }, [teeth, caries, geometries, rings, selectedFdi])

  // The canvas only draws on demand, so a stain appearing, receding behind a
  // selection or losing its arch has to ask for the frame that shows it.
  useEffect(() => invalidate(), [stains])

  useEffect(
    () => () => {
      for (const stain of stains) stain.material.dispose()
    },
    [stains],
  )

  return (
    <group>
      {stains.map((stain) => (
        <mesh
          key={stain.key}
          geometry={stain.geometry}
          material={stain.material}
          position={stain.model.archPosition}
          quaternion={stain.model.archRotation}
          renderOrder={1}
          // The stain is drawn over the tooth; the click belongs to the tooth
          // underneath, which is what opens the finding.
          raycast={() => null}
        />
      ))}
    </group>
  )
}
