/**
 * A data-grid column header that carries its own filter: the label, and under
 * it a select reading "All" until it is narrowed.
 *
 * Shared by every table that filters from its headers — the Patients list
 * first, then the medication table in the tooth panel, which is when it moved
 * here out of `Patients.tsx`.
 *
 * The grid's own filtering is not used. Its community tier allows one filter
 * at a time, and these tables narrow by several columns at once, so each table
 * filters its rows itself and hands the grid what is left; this component is
 * only the control.
 *
 * ⚠ The select lives INSIDE a header the grid sorts on click and on Enter, and
 *   React bubbles events out of the select's portalled menu as if it were a
 *   child. Without the two `stop` handlers, picking an option would also sort
 *   the column.
 */

import type { SyntheticEvent } from 'react'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import type { FilterOption } from './filterOptions.ts'

export function HeaderFilter({
  title,
  label,
  allLabel,
  value,
  options,
  onChange,
}: {
  /** The column's visible name. */
  title: string
  /** The filter's accessible name — "Filter by status". */
  label: string
  /** The option that clears the filter. `''` is its value. */
  allLabel: string
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
}) {
  const stop = (event: SyntheticEvent) => event.stopPropagation()

  return (
    <Stack sx={{ minWidth: 0, alignItems: 'flex-start' }}>
      <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
        {title}
      </Typography>
      <Box onClick={stop} onKeyDown={stop} sx={{ maxWidth: '100%' }}>
        <Select
          variant="standard"
          disableUnderline
          displayEmpty
          value={value}
          onChange={(event) => onChange(event.target.value)}
          SelectDisplayProps={{ 'aria-label': label }}
          sx={{
            typography: 'caption',
            // A narrowed filter reads as set by its words, and is darkened to
            // match — never by colour alone.
            color: value ? 'text.primary' : 'text.secondary',
            fontWeight: value ? 600 : 400,
          }}
        >
          <MenuItem value="">{allLabel}</MenuItem>
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Stack>
  )
}
