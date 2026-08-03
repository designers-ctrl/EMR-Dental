/**
 * The three-state arch selector beside the chart: a stylised arch where the
 * shown arches are filled and the hidden one is greyed.
 *
 * Lives apart from the teeth themselves because it is a control icon, not
 * anatomy — the odontogram it sits beside is the real 3D arch in
 * `ToothArch.tsx`, and a stylised glyph is what a 30px button needs.
 */
export function ArchGlyph({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 28 12" width="24" height="11" aria-hidden focusable="false">
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
    </svg>
  )
}
