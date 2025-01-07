export function createStackName(appId: string, ...suffixes: string[]) {
  return `${appId}-${suffixes.join('-')}`
}
