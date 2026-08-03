import { useEffect } from 'react'
import { invalidate, useThree } from '@react-three/fiber'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { PMREMGenerator } from 'three'

/**
 * Light rig for both tooth views — a three-quarter product shot, not a room.
 *
 * A near-white tooth on a white panel has no silhouette to fall back on, so
 * all the legibility has to come from shading: the key light alone says which
 * way a cusp faces. Ambient is therefore kept low — enough to keep the
 * shadowed side from going muddy and no more — because raising it is what
 * flattens the teeth into paper cut-outs.
 *
 * The generated room is here for the specular rather than the illumination: it
 * gives the enamel's clearcoat something to reflect, and without a source to
 * reflect the highlights that read as "wet" simply do not appear.
 */
export function Studio() {
  const { gl, scene } = useThree()

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl)
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = environment.texture
    scene.environmentIntensity = 0.42
    invalidate()
    return () => {
      scene.environment = null
      environment.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])

  return (
    <>
      <ambientLight intensity={0.16} />
      {/* Key, high and to the patient's right, so cusps cast their form down. */}
      <directionalLight position={[-0.55, 1, 0.75]} intensity={1.9} />
      {/* Fill, low and opposite, lifting the roots out of shadow. */}
      <directionalLight position={[0.85, -0.45, 0.5]} intensity={0.42} />
      {/* Rim from behind, which is what separates enamel from a white panel. */}
      <directionalLight position={[0.1, 0.5, -1]} intensity={0.5} />
    </>
  )
}
