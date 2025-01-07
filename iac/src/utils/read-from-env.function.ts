import process from 'node:process'

export function readFromEnvOrDie(key: string): string {
  const val = readFromEnv(key)
  if (val === null) {
    // eslint-disable-next-line no-console
    console.error(`No env var present for key "${key}"`)
    process.exit(1)
  }
  return val
}

export function readFromEnv(key: string): string | null {
  const val = process.env[key]
  return val !== null && val !== undefined && val.trim() !== '' ? val : null
}
