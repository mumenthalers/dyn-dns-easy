export function assertNumber(value: unknown): number {
  if (typeof value !== 'number') {
    throw new Error(`Expected a number but got ${typeof value}`)
  }
  return value
}
