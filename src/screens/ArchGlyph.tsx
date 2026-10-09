/**
 * The three-state arch selector beside the chart: a stylised arch where the
 * shown arches are filled and the hidden one is greyed.
 *
 * Lives apart from the teeth themselves because it is a control icon, not
 * anatomy — the odontogram it sits beside is the real 3D arch in
 * `ToothArch.tsx`, and a stylised glyph is what a 30px button needs.
 *
 * `both` stacks the upper arch over a mirrored lower one, so the middle
 * button previews exactly what it shows — the two rows its neighbours show
 * separately, joined into one dentition.
 */
const ARCH_HEIGHT = 12
/** Space between the two arches in the `both` glyph, in viewBox units. */
const ARCH_GAP = 2

function ArchTeeth({ filled }: { filled: boolean }) {
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((index) => {
        // Six teeth laid on a shallow parabola.
        const t = (index - 2.5) / 2.5
        const x = 14 + t * 11
        const y = 3 + t * t * 5
        return (
          <rect
            key={index}
            x={x - 1.9}
            y={y}
            width={3.8}
            height={5}
            rx={1.4}
            fill={filled ? 'currentColor' : '#D3D8DE'}
          />
        )
      })}
    </>
  )
}

export function ArchGlyph({ filled, both = false }: { filled: boolean; both?: boolean }) {
  if (!both) {
    return (
      <svg viewBox={`0 0 28 ${ARCH_HEIGHT}`} width="24" height="11" aria-hidden focusable="false">
        <ArchTeeth filled={filled} />
      </svg>
    )
  }

  const height = ARCH_HEIGHT * 2 + ARCH_GAP
  return (
    <svg viewBox={`0 0 28 ${height}`} width="24" height="22" aria-hidden focusable="false">
      <ArchTeeth filled={filled} />
      {/* The lower arch: the same row, flipped to curve the other way. */}
      <g transform={`translate(0 ${height}) scale(1 -1)`}>
        <ArchTeeth filled={filled} />
      </g>
    </svg>
  )
}
