export type FeatStageName = `${number}`
export type StageName = 'prod' | 'test' | FeatStageName

export interface StageInfo {
  stage: StageName
  isProd: boolean
  isTest: boolean
  isFeat: boolean
}

export function createStageInfo(stage: StageName): StageInfo {
  return {
    stage: stage,
    isProd: isStageProd(stage),
    isTest: isStageTest(stage),
    isFeat: isStageFeat(stage),
  }
}
export function isValidStageName(stage: string): stage is StageName {
  return isStageProd(stage) || isStageTest(stage) || isStageFeat(stage)
}
export function isStageProd(stage: string): stage is 'prod' {
  return stage === 'prod'
}
export function isStageTest(stage: string): stage is 'test' {
  return stage === 'test'
}
export function isStageFeat(stage: string): stage is FeatStageName {
  return /^\d+$/.test(stage)
}
