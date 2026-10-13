import { useEffect, useMemo } from 'react'
import { invalidate } from '@react-three/fiber'
import { Color, FrontSide, ShaderMaterial, Vector2, Vector4 } from 'three'

import type { CariesSurface, Tooth } from '../data/patientChart.ts'
import { toothModelByFdi } from '../data/toothModels.ts'
import { toothSurfaceDirection } from './perioSites.ts'
import {
  CARIES_PAINT,
  pocketGeometry,
  ringNeck,
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
 * THE STAIN FOLLOWS THE FORM. What is drawn is what the dental panel has
 * recorded, surface by surface: a stain on each surface with something
 * entered for it, in that surface's own place on the crown, and darker and
 * wider the higher the grade recorded there. Change a tile and the tooth
 * changes with it; empty the form and the tooth is bare. It used to be drawn
 * from the dataset's list of findings instead — one fixed occlusal pattern per
 * carious tooth, whatever the form said — which is exactly the disagreement
 * between picture and record this layer must not have.
 *
 * ⚠️ A DIAGRAM, NOT A PICTURE OF THE LESION. Where a stain sits on a surface,
 * how big it is and how dark are drawing conventions — "this surface, about
 * this severe" — not the lesion's real position, extent or colour. Nobody
 * measured those. The grade is stated in words on the tooth badge and in the
 * panel; the stain is the visual index into them, never the record.
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

/**
 * What to stain on one tooth: a level per surface that carries a lesion, from
 * just above 0 (something recorded, no grade yet) to 1 (the highest grade).
 * A surface that is absent is not stained.
 */
export type CariesStain = Partial<Record<CariesSurface, number>>

/** Millimetres, the unit a chart speaks, as metres — the unit the scene does. */
const MM = 0.001

/** Clearance holding the stain off the enamel it sits on, metres. */
const STAIN_SWELL = 0.00004

/**
 * The shape of an occlusal lesion at full size, in millimetres.
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
 * A lesion on one of the crown's four walls, at full size, in millimetres.
 *
 * A patch on that wall, with a dark middle and a soft, uneven edge. Where on
 * the wall it sits is measured UP FROM THE GUM LINE as a share of the crown's
 * height, because that is where smooth-surface caries gathers: on the cheek
 * and tongue sides, low on the crown near the gum; between the teeth, higher —
 * just under where a tooth touches its neighbour.
 */
const WALL = {
  /** Half the patch's width, measured round the crown. */
  halfWidth: 2.3,
  /** Half its height, along the tooth. */
  halfHeight: 1.6,
  /** Centre of a cheek- or tongue-side patch, as a share of crown height above the gum line. */
  facialCentre: 0.3,
  /** Centre of a mesial or distal patch, likewise. */
  proximalCentre: 0.58,
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
 * width on local X and its buccolingual depth on local Z — so `vLocal.y` below
 * is "how far down from the biting surface we are" and `x`/`z` are the two
 * axes the fissures actually run along. The meshes are light enough that a
 * normal turns over in visible facets, which is the same reason `PerioLayer`
 * keys off position too.
 *
 * One pass draws every stained surface of the tooth: the biting surface from
 * the fissure pattern, each wall from a patch facing that wall's direction.
 * Where two overlap, the stronger wins — they are not added, so two light
 * stains never sum to something that reads as a deep one.
 *
 * A level does three things at once, so a higher grade cannot be mistaken for
 * a lower one by any single cue: the stain is WIDER, it is more OPAQUE, and
 * its middle is DARKER — the warm margin colour at the lowest level, the
 * near-black core at the highest.
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
    // shader to plain arithmetic, with no lookup textures.
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
  uniform float uOcclusalLevel; // 0 none … 1 the highest grade
  uniform vec4 uWallLevel;      // likewise: cheek side, tongue side, mesial, distal
  uniform vec2 uFacial;         // the cheek side's direction round the long axis (local x, z)
  uniform vec2 uMesial;         // the mesial side's
  uniform float uCrown;         // crown height, biting tip to gum line
  uniform float uUseCej;        // 1 when the mesh carries the junction bake
  uniform float uWallHalfWidth;
  uniform float uWallHalfHeight;
  uniform float uFacialCentre;
  uniform float uProximalCentre;
  varying vec3 vLocal;
  varying float vApical;

  // How far a stain spreads, and how solid it gets, at a level.
  float spreadAt(float level) { return mix(0.62, 1.12, level); }
  float weightAt(float level) { return mix(0.42, 1.0, level); }

  // One wall's patch: 1 at its middle, falling to 0 at an uneven edge.
  float wall(vec2 dir, float level, float centre, float coronal) {
    if (level <= 0.0) return 0.0;
    float r = length(vLocal.xz);
    if (r < 1e-6) return 0.0;
    vec2 d = vLocal.xz / r;
    // Signed, so the patch is not a mirror image of itself left to right.
    float off = acos(clamp(dot(d, dir), -1.0, 1.0)) * sign(dir.x * d.y - dir.y * d.x);
    float size = spreadAt(level);
    // Round the crown as an arc length, along it as a height — both in
    // metres, so the patch keeps its shape where the crown narrows.
    vec2 p = vec2(
      off * r / (uWallHalfWidth * size),
      (coronal - centre * uCrown) / (uWallHalfHeight * size)
    );
    // Not an ellipse: a lesion with a compass-drawn edge reads as a chart
    // annotation rather than as decay.
    float turn = atan(p.y, p.x);
    float wobble = 1.0 + 0.15 * sin(3.0 * turn + 0.8) + 0.08 * sin(5.0 * turn);
    float reach = length(p) / wobble;
    // Kept on the crown: enamel stops at the gum line.
    return (1.0 - smoothstep(0.2, 1.0, reach)) * smoothstep(0.0, 0.0005, coronal);
  }

  // Lays one stain over what is there, if it is the stronger of the two.
  void lay(float lesion, float level, inout float alpha, inout vec3 rgb) {
    if (level <= 0.0 || lesion <= 0.0) return;
    // Two ramps, not one: the diffuse halo climbs to roughly half strength and
    // stays translucent enamel, then the middle carries it the rest of the
    // way. A single ramp either lost the halo or made the surface look painted.
    float a = (
      0.5 * smoothstep(0.02, 0.46, lesion) +
      0.5 * smoothstep(0.5, 0.94, lesion)
    ) * weightAt(level);
    if (a <= alpha) return;
    alpha = a;
    // Caries has no outline — the colour shades from a warm margin into the
    // core, and how near black that core gets is the level.
    rgb = mix(uHalo, uCore, smoothstep(0.42, 0.9, lesion) * mix(0.2, 1.0, level));
  }

  void main() {
    float alpha = 0.0;
    vec3 rgb = uHalo;

    // ── The biting surface ────────────────────────────────────────────────
    if (uOcclusalLevel > 0.0) {
      float size = spreadAt(uOcclusalLevel);
      // Depth below the biting surface. Cusp tips sit at 0 and the fossa a
      // little under them, so the stain is strongest across the whole occlusal
      // table and gone by the time it reaches the crown's walls.
      float occlusal = 1.0 - smoothstep(uReach * 0.62, uReach, vLocal.y);
      if (occlusal > 0.0) {
        float around = atan(vLocal.z, vLocal.x);
        float alongMesial = abs(vLocal.x);
        float alongFacial = abs(vLocal.z);
        float outward = length(vLocal.xz);

        // The pit at the centre of the table, where a lesion starts.
        float fossa = 1.0 - smoothstep(uFossa * 0.35 * size, uFossa * size, outward);

        // The two grooves it spreads along: one running mesiodistally, one
        // across it. Each is narrow on the axis it crosses, long on the axis
        // it runs.
        float central =
          (1.0 - smoothstep(0.0, uHalfWidth * size, alongFacial)) *
          (1.0 - smoothstep(uFossa * size, uLong * size, alongMesial));
        float transverse =
          (1.0 - smoothstep(0.0, uHalfWidth * size, alongMesial)) *
          (1.0 - smoothstep(uFossa * size, uCross * size, alongFacial));

        // Demineralisation bleeding out of the grooves onto the cusp slopes.
        // Its border is deliberately NOT a circle — two low harmonics push it
        // in and out around the tooth.
        float wobble = 1.0 + 0.19 * sin(3.0 * around) + 0.11 * sin(5.0 * around + 1.7);
        float spread = 1.0 - smoothstep(uFossa * size, uHaloRadius * size * wobble, outward);

        float lesion = max(spread * 0.46, max(fossa, max(central, transverse))) * occlusal;
        lay(lesion, uOcclusalLevel, alpha, rgb);
      }
    }

    // ── The four walls ────────────────────────────────────────────────────
    // Height above the gum line: off the real junction where the mesh carries
    // it, off the flat crown height where it does not.
    float coronal = uUseCej > 0.5 ? -vApical : uCrown - vLocal.y;
    lay(wall(uFacial, uWallLevel.x, uFacialCentre, coronal), uWallLevel.x, alpha, rgb);
    lay(wall(-uFacial, uWallLevel.y, uFacialCentre, coronal), uWallLevel.y, alpha, rgb);
    lay(wall(uMesial, uWallLevel.z, uProximalCentre, coronal), uWallLevel.z, alpha, rgb);
    lay(wall(-uMesial, uWallLevel.w, uProximalCentre, coronal), uWallLevel.w, alpha, rgb);

    alpha *= uOpacity;
    if (alpha <= 0.004) discard;

    gl_FragColor = vec4(rgb, alpha);
    #include <colorspace_fragment>
  }
`

/** Root direction along the tooth's own Y: uppers grow up from the bite, lowers down. */
const axisOf = (tooth: Tooth): 1 | -1 => (tooth.arch === 'upper' ? 1 : -1)

export function CariesLayer({
  teeth,
  stains,
  selectedFdi,
}: {
  teeth: Tooth[]
  /** What to stain, by tooth — built by the caller from what the form holds. */
  stains: ReadonlyMap<number, CariesStain>
  selectedFdi: number | null
}) {
  const geometries = useToothGeometries()
  const rings = useGingivalRings()

  const marks = useMemo(() => {
    const halo = new Color(CARIES_PAINT.halo)
    const core = new Color(CARIES_PAINT.core)

    return teeth.flatMap((tooth) => {
      if (tooth.status === 'missing') return []

      const stain = stains.get(tooth.fdi)
      if (!stain) return []

      const model = toothModelByFdi[tooth.fdi]
      const geometry = geometries.get(model.node)
      if (!geometry) return []

      const ring = rings.get(model.node)
      const shell = ring ? pocketGeometry(geometry, ring) : geometry
      const axis = axisOf(tooth)
      // Biting tip to the gum line. Without a traced ring, the anatomical rule
      // of thumb stands in: the crown is about a third of a tooth.
      const crown = ring ? Math.abs(ringNeck(ring, axis).y) : model.size.height * MM * 0.35
      // Where THIS tooth's cheek side and mesial side are — an incisor's cheek
      // side faces forward, a molar's sideways, and mesial flips at the midline.
      const facial = toothSurfaceDirection(model, 'buccal')
      const mesial = toothSurfaceDirection(model, 'mesial')

      const dimmed = selectedFdi !== null && selectedFdi !== tooth.fdi
      const material = new ShaderMaterial({
        vertexShader: STAIN_VERTEX,
        fragmentShader: STAIN_FRAGMENT,
        uniforms: {
          uAxis: { value: axis },
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
          uOcclusalLevel: { value: stain.occlusal ?? 0 },
          uWallLevel: {
            value: new Vector4(
              stain.buccal ?? 0,
              stain.lingual ?? 0,
              stain.mesial ?? 0,
              stain.distal ?? 0,
            ),
          },
          uFacial: { value: new Vector2(facial.x, facial.z) },
          uMesial: { value: new Vector2(mesial.x, mesial.z) },
          uCrown: { value: crown },
          uUseCej: { value: ring ? 1 : 0 },
          uWallHalfWidth: { value: WALL.halfWidth * MM },
          uWallHalfHeight: { value: WALL.halfHeight * MM },
          uFacialCentre: { value: WALL.facialCentre },
          uProximalCentre: { value: WALL.proximalCentre },
        },
        transparent: true,
        depthWrite: false,
        side: FrontSide,
      })

      return [{ key: tooth.fdi, geometry: shell, material, model }]
    })
  }, [teeth, stains, geometries, rings, selectedFdi])

  // The canvas renders on demand, so a stain appearing, changing or dimming
  // has to ask for the frame that shows it.
  useEffect(() => invalidate(), [marks])

  useEffect(
    () => () => {
      for (const mark of marks) mark.material.dispose()
    },
    [marks],
  )

  return (
    <group>
      {marks.map((mark) => (
        <mesh
          key={mark.key}
          geometry={mark.geometry}
          material={mark.material}
          position={mark.model.archPosition}
          quaternion={mark.model.archRotation}
          // After the restoration patches (9), so a lesion recorded on a
          // restored surface shows ON the filling instead of vanishing under
          // its colour — decay at a restoration is exactly what must not hide.
          renderOrder={10}
          raycast={() => null}
        />
      ))}
    </group>
  )
}
