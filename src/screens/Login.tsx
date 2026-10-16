/**
 * The Login screen — the way into the product.
 *
 * Two halves: the dentition on the brand colour, and the form on a card. The
 * model is the one memorable thing here, so the form beside it stays plain —
 * two fields, one button, and nothing that competes.
 *
 * Nothing is new to the design system. The card, fields, checkbox, button and
 * link are the ones the other screens and the Storybook already use, the mark
 * is the rail's, and the teeth are the chart's own meshes under the chart's
 * own lights.
 *
 * ⚠ There is NO authentication behind this form — see `src/data/login.ts`.
 *   Sign in calls `onSignIn` whatever the fields hold; nothing typed is
 *   checked, and nobody's credentials are.
 */

import { Suspense, useLayoutEffect, useState, type FormEvent } from 'react'
import { Canvas, invalidate, useThree } from '@react-three/fiber'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { NeutralToneMapping, Vector3, type PerspectiveCamera } from 'three'

import logo from '../assets/EMRdentallogo.svg'
import hexPattern from '../assets/hex-pattern.webp'
import { login } from '../data/login.ts'
import { ARCH_BOUNDS, toothModels } from '../data/toothModels.ts'
import { enamel, useToothGeometries } from './toothScene.ts'
import { Studio } from './ToothStudio.tsx'

// ─── THE DENTITION ────────────────────────────────────────────────────────

/** Middle of the dentition, and how big it is, in metres. */
const CENTRE = ARCH_BOUNDS.min.map((low, axis) => (low + ARCH_BOUNDS.max[axis]) / 2)
const SIZE = ARCH_BOUNDS.min.map((low, axis) => ARCH_BOUNDS.max[axis] - low)

/**
 * Three-quarter, a little above the bite. The chart opens square-on because a
 * chart is read from the front; this one is a picture, and a frontal arch with
 * nothing to orbit it reads as flat. Turned, the molars fall away behind the
 * incisors and it is plainly a solid thing.
 */
const VIEW_DIRECTION = new Vector3(0.62, 0.22, 1).normalize()

/** Air left round the arch, as a share of the distance that would just fit it. */
const FRAMING = 1.04

/**
 * Stands the camera back far enough to hold the whole arch, at any canvas
 * shape. Sized to the arch's horizontal diagonal, the widest it can look from
 * any side, and pushed further out when the canvas is taller than it is wide.
 */
function Framing() {
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const size = useThree((state) => state.size)

  useLayoutEffect(() => {
    const halfFov = (camera.fov * Math.PI) / 360
    const radius = Math.hypot(SIZE[0], SIZE[2]) / 2
    const aspect = size.width / size.height
    const distance = (radius / Math.tan(halfFov)) * Math.max(1, 1 / aspect) * FRAMING

    camera.position.copy(VIEW_DIRECTION).multiplyScalar(distance)
    camera.lookAt(0, 0, 0)
    // The canvas draws on demand, so a resize has to ask for its frame.
    invalidate()
  }, [camera, size])

  return null
}

/**
 * All 32 teeth, every one sound.
 *
 * Drawn from `toothModels` — the meshes and where each sits in the jaw — and
 * NOT from the patient chart: this is not anybody's mouth, so it carries no
 * missing teeth, findings or numbers. The teeth are the chart's meshes at the
 * chart's positions, untouched; nothing is reordered or invented to compose
 * the picture.
 */
function HealthyArch() {
  const geometries = useToothGeometries()
  const sound = enamel('sound', false)

  return (
    // The blend measures from the figure's feet; pulling the dentition back to
    // the origin is what lets the camera aim at it.
    <group position={[-CENTRE[0], -CENTRE[1], -CENTRE[2]]}>
      {toothModels.map((model) => {
        const geometry = geometries.get(model.node)
        if (!geometry) return null
        return (
          <mesh
            key={model.fdi}
            geometry={geometry}
            position={model.archPosition}
            quaternion={model.archRotation}
            material={sound}
          />
        )
      })}
    </group>
  )
}

function Dentition() {
  return (
    <Box role="img" aria-label={login.artLabel} sx={{ position: 'absolute', inset: 0 }}>
      <Canvas
        // A still picture: drawn when it loads and when it is resized, then quiet.
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ fov: 32, near: 0.005, far: 5 }}
        // `alpha` so the brand colour behind shows through; the same tone map
        // as the chart so the enamel is the same enamel.
        gl={{ antialias: true, alpha: true, toneMapping: NeutralToneMapping }}
        style={{ display: 'block' }}
      >
        <Studio />
        <Suspense fallback={null}>
          <HealthyArch />
        </Suspense>
        <Framing />
      </Canvas>
    </Box>
  )
}

// ─── THE BACKDROP ─────────────────────────────────────────────────────────

/**
 * Raised hexagons behind the teeth: the picture once from the top-left
 * corner, and once turned half round from the bottom-right, so the two
 * clusters frame the arch from opposite corners and leave its middle clear.
 *
 * The photo is a light grey relief. Blended `soft-light`, its own light and
 * shade carry over onto the blue field and its flat grey all but vanishes, so
 * the hexes read as pressed into the backdrop rather than pasted on it.
 *
 * Each copy fades out towards the middle. The bottom one needs more: its
 * strong corner lands against the window's bottom edge and the card's gutter,
 * where the backdrop is clipped — so it also fades off those two edges, and a
 * blur rises as it fades, so the hexes go soft before they go, into the navy.
 *
 * Purely decorative — hidden from assistive tech, and behind the canvas in
 * paint order so it never takes a pointer event from the model.
 */
function HexBackdrop() {
  const copy = {
    position: 'absolute',
    width: '100%',
    aspectRatio: '2000 / 1200',
  } as const
  const picture = {
    ...copy,
    backgroundImage: `url(${hexPattern})`,
    backgroundSize: 'cover',
    mixBlendMode: 'soft-light',
  } as const
  // In the copy's own frame: the bottom copy is turned half round, so its
  // `0 0` — and its left and top edges — are the window's bottom-right.
  const bottomFrame = { ...copy, bottom: 0, right: 0, transform: 'rotate(180deg)' } as const

  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        // Only the picture half: the card covers the other one.
        display: { xs: 'none', md: 'block' },
        width: '50%',
      }}
    >
      <Box
        sx={{
          ...picture,
          top: 0,
          left: 0,
          // Strongest in its own corner and gone before any edge of the copy,
          // so no seam shows where the picture stops.
          maskImage: 'radial-gradient(ellipse 100% 100% at 0 0, #000 25%, transparent 80%)',
        }}
      />
      <Box
        sx={{
          ...picture,
          ...bottomFrame,
          // Three fades, kept where all three agree: away from the corner,
          // and off the clipped edges (the copy's left = the card's gutter,
          // its top = the window's bottom).
          maskImage: [
            'radial-gradient(ellipse 110% 110% at 0 0, #000 25%, transparent 85%)',
            'linear-gradient(to right, transparent, #000 18%)',
            'linear-gradient(to bottom, transparent, #000 18%)',
          ].join(', '),
          maskComposite: 'intersect',
        }}
      />
      {/* The blur that rises as the bottom copy fades: nothing at its
          strongest, full where it is nearly gone. A backdrop blur, so it
          softens the hexes underneath; the gradient it also covers is smooth
          already and shows no change. */}
      <Box
        sx={{
          ...bottomFrame,
          backdropFilter: 'blur(6px)',
          maskImage: 'radial-gradient(ellipse 110% 110% at 0 0, transparent 35%, #000 75%)',
        }}
      />
    </Box>
  )
}

// ─── THE FORM ─────────────────────────────────────────────────────────────

function SignInForm({ onSignIn }: { onSignIn: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Nothing typed is checked — deliberately. With no account to check it
  // against, a rule about what the fields must hold would only be theatre, so
  // Sign in always goes through, filled in or not.
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSignIn()
  }

  return (
    // `noValidate` keeps the browser from running its own check on the email
    // field's type and blocking the submit.
    <Stack component="form" noValidate onSubmit={submit} spacing={2} sx={{ width: '100%' }}>
      <TextField
        type="email"
        name="email"
        autoComplete="email"
        label={login.fields.email.label}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        fullWidth
        slotProps={{ htmlInput: { spellCheck: false } }}
      />

      <Stack>
        <TextField
          type={showPassword ? 'text' : 'password'}
          name="password"
          autoComplete="current-password"
          label={login.fields.password.label}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          fullWidth
          slotProps={{ htmlInput: { spellCheck: false } }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
            />
          }
          label={login.showPassword}
        />
      </Stack>

      <Button type="submit" variant="contained" size="large" fullWidth>
        {login.submit}
      </Button>
    </Stack>
  )
}

// ─── SCREEN ───────────────────────────────────────────────────────────────

export default function Login({
  onSignIn,
}: {
  /** Enters the product — called whenever the form is submitted. */
  onSignIn: () => void
}) {
  return (
    <Box
      sx={(theme) => ({
        position: 'relative',
        display: 'flex',
        // A floor, not a ceiling: on a short window the card grows and the
        // page scrolls rather than clipping the form.
        minHeight: '100vh',
        p: theme.layout.gutter,
        gap: theme.layout.gutter,
        bgcolor: 'primary.main',
        // One radial light, centred on the model: the bright blue
        // (`info.main`, #0288d1 — asked for by name) right behind the teeth,
        // opening out into the brand navy, which holds everywhere else.
        // `info` is a status channel; it is borrowed here as a backdrop hue
        // only, where it carries no meaning.
        backgroundImage: `radial-gradient(circle at 27% 50%, ${theme.vars.palette.info.main} 0%, ${theme.vars.palette.primary.main} 50%)`,
      })}
    >
      <HexBackdrop />

      {/* The picture is the first thing dropped when there is no room for
          both: below `md` the form has the screen to itself. */}
      <Box
        sx={{
          position: 'relative',
          flex: 1,
          minWidth: 0,
          display: { xs: 'none', md: 'block' },
        }}
      >
        <Dentition />
      </Box>

      <Paper
        component="main"
        elevation={0}
        sx={{
          // Positioned, so it paints above the hex backdrop wherever they meet.
          position: 'relative',
          width: { xs: '100%', md: '50%' },
          flexShrink: 0,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: { xs: 3, sm: 6 },
          py: 5,
          gap: 4,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          {/* Decorative here: the name is written out right beside it. */}
          <Box component="img" src={logo} alt="" sx={{ width: 40, height: 40 }} />
          <Typography variant="h6" component="p" sx={{ fontWeight: 600 }}>
            {login.brand}
          </Typography>
        </Stack>

        <Stack
          spacing={4}
          sx={{ flexGrow: 1, width: '100%', maxWidth: 440, justifyContent: 'center' }}
        >
          <Stack spacing={1.5} sx={{ textAlign: 'center' }}>
            <Typography variant="h3" component="h1" sx={{ textWrap: 'balance' }}>
              {login.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ textWrap: 'balance' }}>
              {login.subtitle}
            </Typography>
          </Stack>

          <SignInForm onSignIn={onSignIn} />
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {login.signUp.prompt}{' '}
          <Link component="button" type="button" variant="body2" underline="hover" sx={{ fontWeight: 500 }}>
            {login.signUp.action}
          </Link>
        </Typography>
      </Paper>
    </Box>
  )
}
