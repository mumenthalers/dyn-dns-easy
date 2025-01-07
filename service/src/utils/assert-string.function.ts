export function assertString(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error(`Expected a string but got ${typeof value}`)
  }
  return value
}
