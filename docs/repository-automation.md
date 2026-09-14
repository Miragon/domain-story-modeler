# Repository automation

This repository uses pinned tooling, GitHub Actions CI, Dependabot, and Release Please. Releases create a Git tag and GitHub release notes; they do not publish the VS Code extension or attach a VSIX.

## Local toolchain

Use Node `24.21.0`, Corepack `0.36.0`, and Yarn `4.18.0`. The repository records Node in `.nvmrc`, Corepack in `devDependencies`, and Yarn in `packageManager`.

```sh
nvm install
nvm use
npm install --global corepack@0.36.0
corepack enable
corepack install --global yarn@4.18.0
yarn install --immutable
```

Yarn uses the `node-modules` linker. New dependency declarations default to exact versions, and CI rejects `^` or `~` ranges in dependencies, development dependencies, and optional dependencies. Compatibility ranges such as `engines.vscode` remain ranges.

Before opening a pull request, run:

```sh
yarn lint
yarn test
yarn build
yarn npm audit --all --severity high
yarn npm audit --all --recursive --severity critical
```

## Continuous integration

`.github/workflows/ci.yml` runs for pull requests, pushes to `main`, merge queues, and manual dispatches. It checks linting, the Jest and Vitest suites, the complete build, exact dependency pins, changed dependencies on pull requests, and high/critical dependency advisories.

Branch protection should require the aggregate `ci` job. It succeeds only when every required job succeeds; the dependency-review job may be skipped only outside pull requests. Also require `Validate Conventional Commit title`.

Pull request titles must use one of these Conventional Commit types:

- `feat`
- `fix`
- `refactor`
- `docs`
- `chore`

Scopes are optional and a breaking change may use `!`, for example `feat(editor)!: replace legacy story format`.

## Dependency updates

Dependabot checks the Yarn workspace and GitHub Actions weekly. Dependencies remain exact after updates, and action references remain pinned to full commit SHAs. Review lockfile changes and keep action version comments synchronized with their pinned SHAs.

## Releases

Release Please manages one repository-wide Node release. Changes anywhere in the application or shared libraries contribute to the same release. The baseline is `0.2.1`, and commit `0cba33c1200f65457a78992b08fb05fb0c2a2fbd` is the bootstrap boundary. A release PR updates the private root package version, the VS Code extension version, and `CHANGELOG.md`. Merging it creates a `vX.Y.Z` tag and a GitHub release.

Before `1.0.0`, version changes follow these rules:

- `feat` increments the minor version.
- `fix` increments the patch version.
- A breaking change increments the minor version.

The release workflow runs on pushes to `main` and can also be dispatched manually. It authenticates as a repository-scoped GitHub App so release pull requests trigger the normal CI workflows.

## One-time GitHub setup

1. In the Miragon organization’s installed GitHub Apps, grant the release automation App access to `domain-story-modeler`. If a new App is needed, give it repository Contents, Pull requests, and Issues read/write permissions and disable webhooks.
2. In **Settings → Secrets and variables → Actions**, add the variable `RELEASE_PLEASE_APP_CLIENT_ID` and the secret `RELEASE_PLEASE_APP_PRIVATE_KEY`. Organization-level credentials are also suitable when this repository is granted access.
3. In **Settings → General → Pull Requests**, enable squash merging, select the pull request title as the default squash commit message, and disable merge commits and rebase merging.
4. After the first successful workflows, protect `main`: require pull requests and require the `ci` and `Validate Conventional Commit title` checks.
5. Merge a real `fix:` or `feat:` pull request. Review and merge the generated release pull request, then confirm that the root and extension versions agree and that the tag, changelog, and GitHub release were created.

## Troubleshooting

If an immutable install fails, run `yarn install` with the pinned toolchain, review the manifest and lockfile changes, and commit both. If Release Please cannot create or update its pull request, first check the App installation scope and the two Actions credentials. If a dependency audit fails, update the affected direct dependency or resolution rather than lowering the audit threshold.
