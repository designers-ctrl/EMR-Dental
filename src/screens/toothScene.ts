import { useMemo } from 'react'
import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { type BufferGeometry, Color, type Mesh, MeshPhysicalMaterial } from 'three'

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
 * Teeth the selection is not pointing at recede — by draining their colour,
 * NOT by going translucent.
 *
 * Fading them out would be fine on teeth that never overlap, which is how the
 * 2D chart did it. In the arch they overlap constantly, and thirty-one
 * see-through teeth stacked front to back sort into mush. Washing the colour
 * out instead keeps every tooth solid at any angle. `missing` is the one
 * exception: being a ghost is the point of it.
 *
 * The tint is NEUTRAL rather than a warm white. Enamel is already near-white,
 * so fading it towards another white barely registers; draining the warmth is
 * what actually separates a picked tooth from its neighbours, since the dentin
 * in the roots is the most saturated thing on screen.
 */
const DIMMED_TINT = new Color('#EAEAEC')
const DIMMED_MIX = 0.82

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
    transparent: paint.opacity < 1,
    opacity: paint.opacity,
  })
  materials.set(key, material)
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
