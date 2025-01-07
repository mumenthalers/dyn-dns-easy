import process from 'node:process'
import childProcess from 'node:child_process'
import { getGithubBranchName, isGithubWorkflow } from './github.utils.js'
import { createStageInfo, StageInfo, StageName } from './stage-info.utils.js'

/**
 * we want branch names like `#1234-some-description` so we can map them to stages
 * - main -> `prod`
 * - test -> `test`
 * - next -> `next`
 * - 1-some-description -> `1`
 * - 1234-some-description -> `1234`
 */
const REGEX_BRANCH_NAME = /^(\d+)-(.*)$/

export function resolveBranchName(env: unknown): string {
  return isGithubWorkflow(env) ? getGithubBranchName(env) : gitBranchName()
}

export function gitBranchName(): string {
  return childProcess.execSync('git symbolic-ref --short -q HEAD', { encoding: 'utf8' }).trim()
}

/**
 * returns stage name according to branch name
 * prod -> main
 * #0-{whatever} -> test
 * #{num}-{whatever} --> xx{num}
 */
export function branchNameToStage(branchName: string): StageName {
  if (branchName === 'main') {
    return 'prod'
  }
  if (branchName === 'test') {
    return 'test'
  }
  const m = REGEX_BRANCH_NAME.exec(branchName)

  if (!m) {
    throw new Error(`branch name ${branchName} does not match the convention "<numeric-branch-id>-<description>"`)
  }
  // parse to remove leading zeros
  return `${Number(m[1])}`
}

export function resolveStageInfo(env: unknown = process.env): StageInfo {
  const branch = resolveBranchName(env)
  const stage = branchNameToStage(branch)
  return createStageInfo(stage)
}
