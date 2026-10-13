/**
 * What a header filter offers, and the usual way to build it.
 *
 * Kept apart from `HeaderFilter.tsx` so that file exports a component and
 * nothing else — which is what lets it hot-reload.
 */

export interface FilterOption {
  value: string
  label: string
}

/**
 * The options a column offers when they are simply whatever values its rows
 * hold: each once, in alphabetical order. An option built this way can never
 * lead to an empty table on its own.
 */
export function distinctOptions(values: (string | null)[]): FilterOption[] {
  return [...new Set(values.filter((value): value is string => value !== null))]
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value }))
}
