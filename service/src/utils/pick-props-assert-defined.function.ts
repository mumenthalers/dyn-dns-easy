export type PickedPropsDefined<T, K extends keyof T> = {
  [key in K]-?: NonNullable<T[key]>
}

/**
 * returns an object containing the provided props with their respective value. throws if their value is null or undefined
 */
export function pickPropsAssertDefined<T, K extends keyof T>(obj: T, props: K[]): PickedPropsDefined<T, K> {
  const entries = props.map((p) => {
    if (obj[p] === null || obj[p] === undefined) {
      throw new Error(`Expected property "${String(p)}" to be defined. Was "${String(obj[p])}" instead`)
    }
    return [p, obj[p]]
  })
  return Object.fromEntries(entries)
}
