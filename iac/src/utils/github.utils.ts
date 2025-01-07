/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Structure of the environment variables set by GitHub Actions
 * there are many more, see:
 *   https://help.github.com/en/github/automating-your-workflow-with-github-actions/using-environment-variables#default-environment-variables
 */
export interface GithubActionEnv {
  /** Always set to `true`. */
  CI: 'true'

  /**
   * Always set to `true` when GitHub Actions is running the workflow.
   * You can use this variable to differentiate when tests are being run locally or by GitHub Actions.
   */
  GITHUB_ACTIONS: 'true'

  /** The name of the action currently running, or the id of a step. */
  GITHUB_ACTION: string

  /** The name of the person or app that initiated the workflow. For example, `octocat`. */
  GITHUB_ACTOR: string

  /** The name of the event that triggered the workflow. For example, `workflow_dispatch`. */
  GITHUB_EVENT_NAME: string

  /**
   * The head ref or source branch of the pull request in a workflow run.
   * This property is only set when the event that triggers a workflow run is either `pull_request` or `pull_request_target`.
   * For example, `feature-branch-1`.
   */
  GITHUB_HEAD_REF?: string

  /**
   * The fully-formed ref of the branch or tag that triggered the workflow run.
   * For workflows triggered by `push`, this is the branch or tag ref that was pushed.
   * For workflows triggered by `pull_request`, this is the pull request merge branch.
   * For workflows triggered by `release`, this is the release tag created.
   * For other triggers, this is the branch or tag ref that triggered the workflow run.
   * This is only set if a branch or tag is available for the event type.
   * The ref given is fully-formed, meaning that
   * for branches the format is refs/heads/<branch_name>,
   * for pull requests it is refs/pull/<pr_number>/merge,
   * and for tags it is refs/tags/<tag_name>.
   * For example, refs/heads/feature-branch-1.
   */
  GITHUB_REF?: string

  /**
   * The short ref name of the branch or tag that triggered the workflow run.
   * This value matches the branch or tag name shown on GitHub.
   * For example, `feature-branch-1`.
   */
  GITHUB_REF_NAME?: string
}

export function isGithubWorkflow(envVars: unknown): envVars is GithubActionEnv {
  const flagKey = 'GITHUB_ACTIONS' as const satisfies keyof GithubActionEnv
  return !!envVars && typeof envVars === 'object' && flagKey in envVars && envVars[flagKey] === 'true'
}

export function isGithubPullRequest(env: GithubActionEnv): boolean {
  return env.GITHUB_EVENT_NAME === 'pull_request'
}

export function getGithubBranchName(env: GithubActionEnv): string {
  if (isGithubPullRequest(env)) {
    if (!env.GITHUB_HEAD_REF) {
      throw new Error('missing env var GITHUB_HEAD_REF')
    }
    return env.GITHUB_HEAD_REF
  } else {
    if (!env.GITHUB_REF_NAME) {
      throw new Error('missing env var GITHUB_REF_NAME')
    }
    return env.GITHUB_REF_NAME
  }
}
