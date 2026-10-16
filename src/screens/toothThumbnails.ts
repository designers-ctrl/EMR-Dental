import { useEffect, useState } from 'react'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import {
  AmbientLight,
  type BufferGeometry,
  DirectionalLight,
  type Material,
  Mesh,
  NeutralToneMapping,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'

import teethUrl from '../assets/teeth/teeth.glb?url'

/**
 * Small still pictures of single teeth — the mini tooth on each card down the
 * chart's left edge.
 *
 * A canvas per card would cost a WebGL context each, and browsers cap those at
 * around sixteen a page, the chart's own included. So ONE offscreen renderer
 * draws each tooth once, the picture is kept as an image URL, and every card
 * after that is a plain `<img>`. The meshes are the chart's own, from the same
 * `teeth.glb`, under a light rig matching `ToothStudio.tsx` — this is the tooth
 * the chart draws, not a drawing of a tooth.
 *
 * Nothing about a tooth is invented here: the mesh is the tooth's own node,
 * shown whole and upright. An upper tooth is turned crown-down, the way a
 * dental chart draws the upper arch, so a card reads the same way up as the
 * mouth.
 */

/** Edge of the square picture in CSS px; drawn at twice that for sharp screens. */
const EDGE = 64
const SCALE = 2

let geometries: Promise<Map<string, BufferGeometry>> | null = null

/** The GLB's meshes by node name — fetched once, shared by every picture. */
function loadGeometries() {
  geometries ??= new GLTFLoader().loadAsync(teethUrl).then((gltf) => {
    const found = new Map<string, BufferGeometry>()
    gltf.scene.traverse((node) => {
      const mesh = node as Mesh
      if (mesh.isMesh) found.set(mesh.name, mesh.geometry)
    })
    return found
  })
  return geometries
}

let stage: { renderer: WebGLRenderer; scene: Scene; camera: PerspectiveCamera } | null = null

/** The one renderer, built on first use. */
function getStage() {
  if (stage) return stage
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(SCALE)
  renderer.setSize(EDGE, EDGE, false)
  // The chart's own tone map, so the enamel is the same enamel.
  renderer.toneMapping = NeutralToneMapping

  const scene = new Scene()
  const pmrem = new PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.42
  pmrem.dispose()
  // The studio's three lights, as `ToothStudio.tsx` sets them.
  scene.add(new AmbientLight(0xffffff, 0.16))
  const key = new DirectionalLight(0xffffff, 1.9)
  key.position.set(-0.55, 1, 0.75)
  const fill = new DirectionalLight(0xffffff, 0.42)
  fill.position.set(0.85, -0.45, 0.5)
  const rim = new DirectionalLight(0xffffff, 0.5)
  rim.position.set(0.1, 0.5, -1)
  scene.add(key, fill, rim)

  const camera = new PerspectiveCamera(24, 1, 0.0001, 10)
  stage = { renderer, scene, camera }
  return stage
}

/** Finished pictures, by node and whether turned crown-down. */
const pictures = new Map<string, string>()

/** Draws one tooth and returns it as an image URL. */
function draw(geometry: BufferGeometry, material: Material, crownDown: boolean) {
  const { renderer, scene, camera } = getStage()
  const mesh = new Mesh(geometry, material)
  if (crownDown) mesh.rotation.z = Math.PI

  geometry.computeBoundingSphere()
  const sphere = geometry.boundingSphere
  const centre = sphere ? sphere.center.clone() : new Vector3()
  if (crownDown) centre.applyEuler(mesh.rotation)
  mesh.position.copy(centre).negate()
  const radius = sphere?.radius ?? 0.01

  // Square on, a little from the side, so a cusp reads as a cusp; stood back
  // just far enough to hold the whole tooth.
  const distance = (radius / Math.sin((camera.fov * Math.PI) / 360)) * 0.92
  camera.position.copy(new Vector3(0.35, 0.12, 1).normalize().multiplyScalar(distance))
  camera.lookAt(0, 0, 0)

  scene.add(mesh)
  renderer.render(scene, camera)
  scene.remove(mesh)
  return renderer.domElement.toDataURL('image/png')
}

/**
 * The picture of one tooth, or `null` until it is ready (the GLB loads once,
 * then each tooth is drawn the first time it is asked for).
 */
export function useToothThumbnail(node: string | undefined, material: Material, crownDown: boolean) {
  const key = node ? `${node}:${material.uuid}:${crownDown}` : ''
  const [url, setUrl] = useState<string | null>(() => pictures.get(key) ?? null)

  useEffect(() => {
    if (!node) return
    const ready = pictures.get(key)
    if (ready) {
      setUrl(ready)
      return
    }
    let live = true
    loadGeometries().then((found) => {
      const geometry = found.get(node)
      if (!geometry || !live) return
      const picture = pictures.get(key) ?? draw(geometry, material, crownDown)
      pictures.set(key, picture)
      setUrl(picture)
    })
    return () => {
      live = false
    }
  }, [node, key, material, crownDown])

  return url
}
