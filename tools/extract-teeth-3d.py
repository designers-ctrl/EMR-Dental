"""
Cut the 32 real teeth out of `teeth_skeleton_ligaments.blend` into a web GLB.

The blend is a whole-body anatomy scene. Two of its meshes matter here:
`upper_teeth` and `lower_teeth`, and each one splits into exactly 16 loose
parts — a complete adult dentition, every tooth its own island of geometry.
So unlike the removed 2D sprite pipeline, nothing has to be faked:
all 32 teeth are separate, real, and correctly proportioned. Spot checks
against the anatomy hold up — the canine is the longest tooth in the arch, the
central incisor is wider than the lateral, the upper first premolar is longer
than the second.

WHAT COMES OUT

    src/assets/teeth/teeth.glb   32 meshes, nodes named `T11`…`T48` (FDI)
    src/data/toothModels.ts      per-tooth metrics, generated, do not edit

NUMBERING

Islands sort by world X, and `L_femur` sits at +X while `R_femur` sits at −X,
so −X is the patient's RIGHT. Sorted ascending, the 16 islands therefore run
from the patient's upper right third molar to the upper left third molar —
FDI 18…11, 21…28 — which is also the left-to-right order the odontogram draws
them in. No mirroring, no reuse.

ORIENTATION

Each tooth is exported standing on its own, ready to drop into a chart column,
rather than in its arch position:

  • Yawed so its BUCCAL face (cheek side) points at the camera. Anatomical
    yaw is recovered per tooth from the arch itself — the line through its two
    neighbours is the mesiodistal tangent, and buccal is the perpendicular
    that points away from the arch centre. A molar seen in its raw arch pose
    would show its side to the viewer; this turns it to face front.
  • Anchored with the OCCLUSAL extreme (the biting tip) at the origin, roots
    running +Y for uppers and −Y for lowers. Pinning that one point puts all
    16 crowns of a row on a shared occlusal plane whatever the tooth's length
    — the 3D counterpart of the flush-to-canvas-edge trick the sprites use.
  • Centred mesiodistally and buccolingually on its bounding box.

Axes below are Blender's (Z up). The glTF exporter rewrites them to the glTF
convention on the way out, so in the browser the tooth's up is +Y and its
buccal face looks down +Z, straight into a default camera.

SCALE

Blend units read as millimetres under the scene's 0.01 object scale, which
puts the figure at 1.68 m and an upper central incisor at 26 mm — both right.
The GLB is written in metres, per the glTF convention.

RUN

    /Applications/Blender.app/Contents/MacOS/Blender -b teeth_skeleton_ligaments.blend \
        --python tools/extract-teeth-3d.py
"""
import math
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parent.parent
GLB_OUT = ROOT / 'src/assets/teeth/teeth.glb'
DATA_OUT = ROOT / 'src/data/toothModels.ts'

SOURCES = {'upper': 'upper_teeth', 'lower': 'lower_teeth'}

# FDI quadrant digits, (patient's right, patient's left) — and the patient's
# right is −X, so it comes first once islands are sorted by ascending X.
QUADRANTS = {'upper': (1, 2), 'lower': (4, 3)}

# One blend world unit is 10 cm; glTF wants metres.
WORLD_TO_M = 0.1

# FDI's second digit encodes position in the quadrant, same table the chart uses.
TYPE_BY_POSITION = {
    1: 'incisor', 2: 'incisor', 3: 'canine', 4: 'premolar',
    5: 'premolar', 6: 'molar', 7: 'molar', 8: 'molar',
}


def fdi_codes(arch):
    """The 16 FDI codes of an arch, patient's right to left."""
    right, left = QUADRANTS[arch]
    return [right * 10 + (8 - i) for i in range(8)] + [left * 10 + (i + 1) for i in range(8)]


def islands(mesh):
    """Split a mesh into connected components, as lists of vertex indices."""
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.verts.ensure_lookup_table()

    seen, parts = set(), []
    for start in bm.verts:
        if start.index in seen:
            continue
        stack, part = [start], []
        seen.add(start.index)
        while stack:
            v = stack.pop()
            part.append(v.index)
            for edge in v.link_edges:
                other = edge.other_vert(v)
                if other.index not in seen:
                    seen.add(other.index)
                    stack.append(other)
        parts.append(part)

    bm.free()
    return parts


def long_axis(coords, arch):
    """
    The tooth's own crown-to-root axis.

    Teeth do not stand upright in the jaw — upper incisors lean forward some
    twenty degrees — so an occlusal view taken straight down the arch's axis
    looks past the crown and catches the root sticking out behind it. Standing
    each tooth on its own axis is what a chart draws anyway.

    Taken as the line joining the centroids of the crown third and the root
    third, then re-measured along that line a few times. Cheaper than a proper
    inertia tensor and, more to the point, unbothered by the crown carrying far
    more vertices than the root — which is exactly the bias that would tip a
    naive principal-axis fit.
    """
    axis = Vector((0.0, 0.0, 1.0 if arch == 'upper' else -1.0))
    for _ in range(4):
        along = [p.dot(axis) for p in coords]
        low, high = min(along), max(along)
        third = (high - low) / 3
        crown = [p for p, t in zip(coords, along) if t <= low + third]
        root = [p for p, t in zip(coords, along) if t >= high - third]
        axis = (sum(root, Vector()) / len(root) - sum(crown, Vector()) / len(crown)).normalized()
    return axis


def basis(third, buccal, up):
    """A rotation matrix with the given axes as its columns."""
    return Matrix((
        (third.x, buccal.x, up.x),
        (third.y, buccal.y, up.y),
        (third.z, buccal.z, up.z),
    ))


def buccal_directions(centres):
    """
    The outward-facing (cheek side) direction of every tooth in an arch.

    Read off the arch rather than the tooth: the chord through a tooth's two
    neighbours is the mesiodistal tangent, so the horizontal perpendicular to
    it is the buccolingual axis. Of that axis's two directions, buccal is the
    one pointing away from the centre of the arch. The end teeth have only one
    neighbour, so they use a one-sided chord.
    """
    flat = [Vector((c.x, c.y)) for c in centres]
    middle = sum(flat, Vector((0, 0))) / len(flat)

    out = []
    for i, centre in enumerate(flat):
        before = flat[max(i - 1, 0)]
        after = flat[min(i + 1, len(flat) - 1)]
        tangent = (after - before).normalized()
        normal = Vector((tangent.y, -tangent.x))
        if normal.dot(centre - middle) < 0:
            normal = -normal
        out.append(Vector((normal.x, normal.y, 0.0)))
    return out


def tooth_matrix(coords, buccal_hint, arch):
    """
    Build the transform that stands one tooth up on its own, and the metrics
    that describe where it came from.

    `coords` are the tooth's vertices already in world space. The tooth is
    rebuilt on its own anatomical frame — long axis vertical, buccal face
    towards −Y (which the exporter maps to glTF +Z, straight at the camera) —
    which both squares it up for the buccal row and lines the occlusal row up
    down the tooth's own axis.
    """
    axis = long_axis(coords, arch)
    # Drop whatever part of the arch's buccal hint runs along the tooth's axis,
    # leaving a buccal direction square to it.
    buccal = (buccal_hint - axis * buccal_hint.dot(axis)).normalized()

    up = Vector((0.0, 0.0, 1.0 if arch == 'upper' else -1.0))
    target_buccal = Vector((0.0, -1.0, 0.0))
    rotation = basis(up.cross(target_buccal), target_buccal, up) @ basis(
        axis.cross(buccal), buccal, axis
    ).transposed()

    centre = sum(coords, Vector()) / len(coords)
    turn = Matrix.Translation(centre) @ rotation.to_4x4() @ Matrix.Translation(-centre)

    turned = [turn @ c for c in coords]
    xs = [c.x for c in turned]
    ys = [c.y for c in turned]
    zs = [c.z for c in turned]

    # Upper crowns hang down from their roots, lower crowns stand up from
    # theirs, so the biting tip is whichever end of Z faces the other arch.
    occlusal = min(zs) if arch == 'upper' else max(zs)
    anchor = Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, occlusal))

    matrix = Matrix.Scale(WORLD_TO_M, 4) @ Matrix.Translation(-anchor) @ turn

    # Undo the whole thing, so an arch view can put the tooth back in the skull:
    # exported metres in, anatomical metres out. Composed as a literal inverse
    # rather than derived by hand — the turn happens about the tooth's own
    # centre, so the placement is NOT just the anchor, and writing it out
    # longhand is how that goes quietly wrong by a few millimetres.
    anatomical = Matrix.Scale(WORLD_TO_M, 4) @ matrix.inverted()
    place, spin, _ = anatomical.decompose()

    # Cheap guard on the above: a point put through the export and back should
    # land where it started, give or take float noise.
    check = anatomical @ (matrix @ centre) - centre * WORLD_TO_M
    if check.length > 1e-6:
        raise SystemExit(f'placement does not invert the export: off by {check.length}')

    metrics = {
        'size': {
            # Mesiodistal, occlusogingival, buccolingual — millimetres.
            'width': (max(xs) - min(xs)) * WORLD_TO_M * 1000,
            'height': (max(zs) - min(zs)) * WORLD_TO_M * 1000,
            'depth': (max(ys) - min(ys)) * WORLD_TO_M * 1000,
        },
        'archPosition': to_gltf_point(place),
        'archRotation': to_gltf_quaternion(spin.to_matrix()),
        # Reported only so a run can be eyeballed: how far off vertical the
        # tooth stood. Anterior teeth should come out around 15–30°.
        'upright': math.degrees(axis.angle(up)),
    }
    return matrix, metrics


# Blender is Z-up, glTF is Y-up: (x, y, z) becomes (x, z, −y).
TO_GLTF = Matrix(((1, 0, 0), (0, 0, 1), (0, -1, 0)))


def to_gltf_quaternion(rotation):
    """Re-express a Blender-axis rotation in glTF axes, as (x, y, z, w)."""
    q = (TO_GLTF @ rotation @ TO_GLTF.transposed()).to_quaternion()
    return {'x': q.x, 'y': q.y, 'z': q.z, 'w': q.w}


def to_gltf_point(v):
    """Re-express a Blender-axis point in glTF axes."""
    return {'x': v.x, 'y': v.z, 'z': -v.y}


# Crown as a share of the whole tooth's length, by type. The blend draws each
# tooth as one undivided shell with no cementoenamel junction to find, and the
# neck is a gradual narrowing rather than a crease, so there is nothing in the
# geometry to detect — these are the textbook proportions instead.
CROWN_FRACTION = {'incisor': 0.40, 'canine': 0.35, 'premolar': 0.36, 'molar': 0.32}

# Multiplied over whatever colour the app paints a tooth. Enamel leaves it
# alone; the root pulls it towards dentin. Linear, as glTF vertex colours are.
ENAMEL_TINT = (1.0, 1.0, 1.0)
DENTIN_TINT = (0.93, 0.86, 0.74)

# Metres over which one fades into the other, in place of a hard gum line.
CERVICAL_BLEND = 0.0022

# How much higher up the tooth the boundary sits at the mesial and distal edges
# than at the middle of the face, as a share of crown length. Enamel caps a
# tooth in a curve, not a ring; a flat cut reads as a tooth dipped in paint.
CERVICAL_CURVE = 0.16


def paint(mesh, kind):
    """
    Shade the crown as enamel and the root as dentin, into vertex colours.

    The 2D chart this replaces drew crowns and roots in different colours, and
    without that a tooth is one undifferentiated white blob. Baking it per
    vertex keeps the whole chart on a single shared material — the alternative,
    a per-tooth uniform, would cost 32 of them.

    Runs after the transform, so a vertex's distance from the biting tip is
    just its height above the origin.
    """
    height = max(abs(v.co.z) for v in mesh.vertices)
    crown = height * CROWN_FRACTION[kind]
    half_width = max(abs(v.co.x) for v in mesh.vertices)

    colours = mesh.color_attributes.new(name='enamel', type='FLOAT_COLOR', domain='POINT')
    for vertex, slot in zip(mesh.vertices, colours.data):
        across = vertex.co.x / half_width if half_width else 0.0
        here = crown * (1 - CERVICAL_CURVE * across * across)
        t = (abs(vertex.co.z) - here) / CERVICAL_BLEND
        t = min(max(t, 0.0), 1.0)
        t = t * t * (3 - 2 * t)  # smoothstep, so the neck has no visible seam
        slot.color = (*(e + (d - e) * t for e, d in zip(ENAMEL_TINT, DENTIN_TINT)), 1.0)


def cut(source, part, name, matrix, kind):
    """Copy the source mesh, strip it down to one island, and bake the transform."""
    mesh = source.data.copy()
    mesh.name = name
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    keep = set(part)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.index not in keep], context='VERTS')
    bm.to_mesh(mesh)
    bm.free()

    mesh.materials.clear()  # the app paints teeth by status; the blend's flat grey would fight it
    mesh.transform(matrix)
    paint(mesh, kind)
    return obj


def build():
    made = []
    # Every tooth's world extent, accumulated as we go. The placement written
    # for each tooth restores its original world position exactly, so the
    # dentition's anatomical bounding box is simply the bounds of the source
    # geometry — which is what an arch view needs in order to frame itself.
    low = Vector((math.inf,) * 3)
    high = Vector((-math.inf,) * 3)

    for arch, source_name in SOURCES.items():
        source = bpy.data.objects[source_name]
        world = source.matrix_world
        parts = islands(source.data)
        if len(parts) != 16:
            raise SystemExit(f'{source_name}: expected 16 teeth, found {len(parts)}')

        verts = source.data.vertices
        coords = [[world @ verts[i].co for i in part] for part in parts]
        centres = [sum(c, Vector()) / len(c) for c in coords]

        order = sorted(range(16), key=lambda i: centres[i].x)
        parts = [parts[i] for i in order]
        coords = [coords[i] for i in order]
        centres = [centres[i] for i in order]

        for fdi, part, points, buccal in zip(
            fdi_codes(arch), parts, coords, buccal_directions(centres)
        ):
            name = f'T{fdi}'
            kind = TYPE_BY_POSITION[fdi % 10]
            matrix, metrics = tooth_matrix(points, buccal, arch)
            # Mesh copies carry the source's LOCAL coordinates, so the bake has
            # to walk them out to world space before applying the tooth's own.
            cut(source, part, name, matrix @ world, kind)
            made.append({
                'fdi': fdi,
                'arch': arch,
                'node': name,
                'type': kind,
                **metrics,
            })
            print(f'{name}  {metrics["size"]["width"]:5.1f} × {metrics["size"]["height"]:5.1f}'
                  f' × {metrics["size"]["depth"]:5.1f} mm   stood up {metrics["upright"]:4.1f}°')

            for point in points:
                low = Vector(map(min, low, point))
                high = Vector(map(max, high, point))

    # The axis swap turns the box inside out on one axis, so rebuild it from
    # the two converted corners rather than converting min and max in place.
    corners = [to_gltf_point(low * WORLD_TO_M), to_gltf_point(high * WORLD_TO_M)]
    bounds = {
        'min': {axis: min(c[axis] for c in corners) for axis in 'xyz'},
        'max': {axis: max(c[axis] for c in corners) for axis in 'xyz'},
    }
    return made, bounds


def export(made):
    GLB_OUT.parent.mkdir(parents=True, exist_ok=True)

    bpy.ops.object.select_all(action='DESELECT')
    names = {t['node'] for t in made}
    for obj in bpy.data.objects:
        obj.select_set(obj.name in names)
    bpy.context.view_layer.objects.active = bpy.data.objects[made[0]['node']]

    bpy.ops.export_scene.gltf(
        filepath=str(GLB_OUT),
        export_format='GLB',
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_normals=True,
        export_texcoords=False,
        export_materials='NONE',
        # Carries the baked enamel/dentin shading; without it the teeth arrive
        # as flat white, since the meshes ship with no material at all.
        export_vertex_color='ACTIVE',
        export_cameras=False,
        export_lights=False,
        export_animations=False,
        export_skins=False,
        export_extras=False,
    )
    print(f'\n{GLB_OUT.relative_to(ROOT)}  {GLB_OUT.stat().st_size / 1024:.0f} KB')


def write_dataset(made, bounds):
    rows = []
    for tooth in made:
        size = tooth['size']
        pos = tooth['archPosition']
        rot = tooth['archRotation']
        rows.append(
            f"  {{\n"
            f"    fdi: {tooth['fdi']},\n"
            f"    node: '{tooth['node']}',\n"
            f"    arch: '{tooth['arch']}',\n"
            f"    type: '{tooth['type']}',\n"
            f"    size: {{ width: {size['width']:.2f}, height: {size['height']:.2f},"
            f" depth: {size['depth']:.2f} }},\n"
            f"    archPosition: [{pos['x']:.5f}, {pos['y']:.5f}, {pos['z']:.5f}],\n"
            f"    archRotation: [{rot['x']:.5f}, {rot['y']:.5f}, {rot['z']:.5f},"
            f" {rot['w']:.5f}],\n"
            f"  }},"
        )

    widest = max(t['size']['width'] for t in made)
    tallest = max(t['size']['height'] for t in made)
    deepest = max(t['size']['depth'] for t in made)

    DATA_OUT.write_text(
        "/**\n"
        " * Measurements of the 32 teeth in `src/assets/teeth/teeth.glb`.\n"
        " *\n"
        " * GENERATED by `tools/extract-teeth-3d.py` from\n"
        " * `teeth_skeleton_ligaments.blend`. Do not edit by hand — re-run the\n"
        " * script instead. See its docstring for how the meshes are oriented.\n"
        " *\n"
        " * Unlike the rest of `src/data/`, this is not placeholder content: the\n"
        " * figures are measured off the real geometry the chart draws.\n"
        " */\n\n"
        "import type { Arch, ToothType } from './patientChart.ts'\n\n"
        "export interface ToothModel {\n"
        "  /** FDI two-digit notation, matching `Tooth.fdi`. */\n"
        "  fdi: number\n"
        "  /** Name of this tooth's node inside `teeth.glb`. */\n"
        "  node: string\n"
        "  arch: Arch\n"
        "  type: ToothType\n"
        "  /** Millimetres: mesiodistal, occlusogingival, buccolingual. */\n"
        "  size: { width: number; height: number; depth: number }\n"
        "  /**\n"
        "   * Where the tooth stood in the skull — metres, glTF axes. The GLB\n"
        "   * ships every tooth squared up at the origin instead, so an\n"
        "   * anatomical view sets these two on the node to put it back. They\n"
        "   * are the export's transform inverted, so applying both restores\n"
        "   * the real arch exactly.\n"
        "   */\n"
        "  archPosition: [number, number, number]\n"
        "  archRotation: [number, number, number, number]\n"
        "}\n\n"
        "/**\n"
        " * The set's largest tooth on each axis, millimetres. A chart row scales\n"
        " * itself so this fits, which keeps every tooth in the row at ONE shared\n"
        " * scale — the whole point of using the real meshes, since it is what\n"
        " * makes a molar read as bigger than an incisor.\n"
        " */\n"
        f"export const TOOTH_EXTENT = {{ width: {widest:.2f}, height: {tallest:.2f},"
        f" depth: {deepest:.2f} }}\n\n"
        "/**\n"
        " * The whole dentition's extent once every tooth is back in its\n"
        " * `archPosition` — metres, glTF axes, roots included.\n"
        " *\n"
        " * The blend measures from the figure's feet, so this sits about 1.67 m\n"
        " * up. An arch view offsets by the centre of this box to bring the teeth\n"
        " * to the origin where they can be orbited, and sizes its camera from the\n"
        " * box's dimensions rather than a distance somebody guessed.\n"
        " */\n"
        "export const ARCH_BOUNDS = {\n"
        f"  min: [{bounds['min']['x']:.5f}, {bounds['min']['y']:.5f},"
        f" {bounds['min']['z']:.5f}] as [number, number, number],\n"
        f"  max: [{bounds['max']['x']:.5f}, {bounds['max']['y']:.5f},"
        f" {bounds['max']['z']:.5f}] as [number, number, number],\n"
        "}\n\n"
        "export const toothModels: ToothModel[] = [\n"
        + "\n".join(rows)
        + "\n]\n\n"
        "export const toothModelByFdi: Record<number, ToothModel> = Object.fromEntries(\n"
        "  toothModels.map((model) => [model.fdi, model]),\n"
        ")\n"
    )
    print(f'{DATA_OUT.relative_to(ROOT)}  {len(made)} teeth')


if __name__ == '__main__':
    made, bounds = build()
    export(made)
    write_dataset(made, bounds)
