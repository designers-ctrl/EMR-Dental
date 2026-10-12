/**
 * The app rail — the icon column down the left edge of every screen.
 *
 * There is still no shared shell: each screen mounts its own `<Rail>` beside
 * its own content. What is shared is the rail itself, extracted from
 * `PatientChart.tsx` when the Patients list became the second screen to draw
 * one.
 *
 * The rail is dataset-driven like everything else: the screen hands it the
 * `AppRail` from its dataset. `onSelect` reports the item picked so the app
 * can change screen; the rail does not know which items lead anywhere.
 */

import { useState } from 'react'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'

import logo from '../assets/EMRdentallogo.svg'
import type { AppRail, RailItem } from '../data/patientChart.ts'
import { Icon } from './Icon.tsx'

export function Rail({
  rail,
  onSelect,
}: {
  rail: AppRail
  /** Called with the picked item's `id`, after the rail marks it active. */
  onSelect?: (id: string) => void
}) {
  const { groups, footer } = rail
  const [activeId, setActiveId] = useState(rail.activeItemId)

  return (
    <Stack
      component="nav"
      aria-label="Sections"
      sx={{
        width: (theme) => theme.layout.railWidth,
        flexShrink: 0,
        bgcolor: 'background.paper',
        borderRight: (theme) => `1px solid ${theme.palette.divider}`,
        overflowY: 'auto',
        py: 2,
        alignItems: 'center',
      }}
    >
      <Box sx={{ mb: 2, display: 'grid', placeItems: 'center' }}>
        <Box component="img" src={logo} alt="EMR Dental" sx={{ width: 34, height: 34 }} />
      </Box>

      {groups.map((group, index) => (
        <Stack key={group.id} sx={{ width: '100%', alignItems: 'center' }}>
          {index > 0 && <Divider flexItem sx={{ my: 1.5, mx: 2 }} />}
          {group.items.map((item) => (
            <RailButton
              key={item.id}
              item={item}
              active={item.id === activeId}
              onClick={() => {
                setActiveId(item.id)
                onSelect?.(item.id)
              }}
            />
          ))}
        </Stack>
      ))}

      <Box sx={{ flexGrow: 1, minHeight: 24 }} />
      <RailButton item={footer} active={false} onClick={() => {}} />
    </Stack>
  )
}

function RailButton({
  item,
  active,
  onClick,
}: {
  item: RailItem
  active: boolean
  onClick: () => void
}) {
  return (
    <Tooltip title={item.label} placement="right">
      <ButtonBase
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
        onClick={onClick}
        sx={{
          position: 'relative',
          width: (theme) => theme.layout.iconButton,
          height: (theme) => theme.layout.iconButton,
          my: 0.25,
          borderRadius: 1.5,
          color: active ? 'primary.main' : 'text.secondary',
          bgcolor: active ? 'action.selected' : 'transparent',
          transition: (theme) => theme.transitions.create(['background-color', 'color']),
          '&:hover': { bgcolor: active ? 'action.selected' : 'action.hover' },
          // The active item also gets a bar in the rail's left margin.
          '&::before': active
            ? {
                content: '""',
                position: 'absolute',
                left: (theme) => theme.spacing(-2),
                top: '50%',
                transform: 'translateY(-50%)',
                width: 2,
                height: 26,
                borderRadius: 1,
                bgcolor: 'primary.main',
              }
            : undefined,
        }}
      >
        <Icon name={item.icon} />
      </ButtonBase>
    </Tooltip>
  )
}
