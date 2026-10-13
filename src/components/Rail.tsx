/**
 * The app rail — the icon column down the left edge of every screen.
 *
 * There is still no shared shell: each screen mounts its own `<Rail>` beside
 * its own content. What is shared is the rail itself, extracted from
 * `PatientChart.tsx` when the Patients list became the second screen to draw
 * one.
 *
 * Two parts. The sections on top are where you can go; the avatar at the
 * bottom is who is signed in, and opens the menu that belongs to them —
 * Settings, Support and, always last, Log out.
 *
 * The rail is dataset-driven like everything else: the screen hands it the
 * `AppRail` from its dataset. `onSelect` reports the item picked — the menu's
 * Log out included — so the app can change screen; the rail does not know
 * which items lead anywhere. What it DOES know is which ones lead nowhere yet
 * (`available: false`), and it draws those disabled.
 */

import { useId, useState } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'

import logo from '../assets/EMRdentallogo.svg'
import type { AppRail, RailAccount, RailSection } from '../data/patientChart.ts'
import { Icon } from './Icon.tsx'

/**
 * The keyboard's focus ring. `ButtonBase` ships no visible focus state of its
 * own — it leaves that to whoever styles it — so without this a keyboard user
 * cannot see where they are in a column of identical icon buttons.
 */
const FOCUS_RING = {
  '&.Mui-focusVisible': {
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: 2,
  },
} as const

export function Rail({
  rail,
  onSelect,
}: {
  rail: AppRail
  /** Called with the picked item's `id`, after the rail marks it active. */
  onSelect?: (id: string) => void
}) {
  const { groups, account } = rail
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
              unavailableHint={rail.unavailableHint}
              onClick={() => {
                setActiveId(item.id)
                onSelect?.(item.id)
              }}
            />
          ))}
        </Stack>
      ))}

      <Box sx={{ flexGrow: 1, minHeight: 24 }} />
      <AccountMenu account={account} onSelect={onSelect} />
    </Stack>
  )
}

function RailButton({
  item,
  active,
  unavailableHint,
  onClick,
}: {
  item: RailSection
  active: boolean
  unavailableHint: string
  onClick: () => void
}) {
  // The rail shows icons only, so the tooltip is the item's label. A section
  // with no screen behind it says so in the same breath, to sighted and
  // screen-reader users alike.
  const name = item.available ? item.label : `${item.label} — ${unavailableHint}`

  return (
    <Tooltip title={name} placement="right">
      {/* A section that is not built yet is `aria-disabled`, not `disabled`:
          it keeps its place in the tab order and its hover, so the tooltip —
          the only place this icon is named — still opens. It carries no
          handler, so a click and Enter/Space both do nothing. */}
      <ButtonBase
        aria-label={name}
        aria-current={active ? 'page' : undefined}
        aria-disabled={item.available ? undefined : true}
        disableRipple={!item.available}
        onClick={item.available ? onClick : undefined}
        sx={[
          {
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
          },
          FOCUS_RING,
          // The theme's own disabled ink, and no hover wash: nothing here
          // invites a click.
          !item.available && {
            color: 'action.disabled',
            cursor: 'default',
            '&:hover': { bgcolor: 'transparent' },
          },
        ]}
      >
        <Icon name={item.icon} />
      </ButtonBase>
    </Tooltip>
  )
}

/**
 * The signed-in user's avatar, and the menu it opens.
 *
 * The menu opens to the RIGHT of the avatar and grows upward from its bottom
 * edge: the avatar sits in the bottom-left corner of the window, so there is
 * no room below it and none to its left.
 */
function AccountMenu({
  account,
  onSelect,
}: {
  account: RailAccount
  onSelect?: (id: string) => void
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const menuId = useId()
  const open = Boolean(anchor)

  const pick = (id: string) => {
    setAnchor(null)
    onSelect?.(id)
  }

  return (
    <>
      {/* No tooltip while the menu is up — it would sit on top of it. */}
      <Tooltip title={open ? '' : account.name} placement="right">
        <ButtonBase
          aria-label={`${account.menuLabel}: ${account.name}`}
          aria-haspopup="menu"
          aria-expanded={open ? true : undefined}
          aria-controls={open ? menuId : undefined}
          onClick={(event) => setAnchor(event.currentTarget)}
          sx={[{ borderRadius: '50%' }, FOCUS_RING]}
        >
          <Avatar sx={{ bgcolor: 'primary.main', typography: 'body2', fontWeight: 500 }}>
            {account.initials}
          </Avatar>
        </ButtonBase>
      </Tooltip>

      <Menu
        id={menuId}
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          paper: { sx: { ml: 1.5, minWidth: 220, borderRadius: 1.5 } },
          list: { 'aria-label': account.menuLabel },
        }}
      >
        {account.items.map((item) => (
          // Listed even when there is nothing behind them yet, and disabled
          // for the same reason the rail's sections are.
          <MenuItem key={item.id} disabled={!item.available} onClick={() => pick(item.id)}>
            <ListItemIcon>
              <Icon name={item.icon} size={20} />
            </ListItemIcon>
            {item.label}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={() => pick(account.logOut.id)}>
          <ListItemIcon>
            <Icon name={account.logOut.icon} size={20} />
          </ListItemIcon>
          {account.logOut.label}
        </MenuItem>
      </Menu>
    </>
  )
}
