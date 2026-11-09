# Repository automation

This repository uses pinned tooling, GitHub Actions CI, Dependabot, and Release Please. Releases create a Git tag and GitHub release notes and publish the VS Code extension to the VS Code Marketplace and Open VSX with trusted publishing.

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
yarn typecheck
yarn lint
yarn test
yarn test:browser
yarn build
yarn test:artifacts
yarn package
yarn test:package
yarn test:extension
yarn npm audit --all --severity high
yarn npm audit --all --recursive --severity critical
```

## Continuous integration

`.github/workflows/ci.yml` runs for pull requests, pushes to `main`, merge queues, and manual dispatches. It checks linting, production and test typechecking, Vitest, Chromium, the clean build, minified artifacts, VSIX contracts, and the installed extension on Linux under Xvfb. It also checks exact dependency pins, changed dependencies on pull requests, and high/critical dependency advisories. The extension job uploads its tested VSIX and failure diagnostics.

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

Release Please manages one repository-wide Node release. Changes anywhere in the application or shared libraries contribute to the same release. The baseline is `0.3.0`, the last version published to both marketplaces from the predecessor repository `Miragon/egon.io`, and commit `0cba33c1200f65457a78992b08fb05fb0c2a2fbd` is the bootstrap boundary. A release PR updates the private root package version, the VS Code extension version, and `CHANGELOG.md`. Merging it creates a `vX.Y.Z` tag and a GitHub release.

Before `1.0.0`, version changes follow these rules:

- `feat` increments the minor version.
- `fix` increments the patch version.
- A breaking change increments the minor version.

The release workflow runs on pushes to `main` and can also be dispatched manually. It authenticates as a repository-scoped GitHub App so release pull requests trigger the normal CI workflows.

When a release is created, the workflow takes three steps:

1. `build / vsix` builds, packages, and checks the VSIX like CI's extension job, without an environment, and uploads it as the artifact `vsix`.
2. The environment `vscode-marketplace` asks for one approval.
3. `publish / vscode-marketplace` and `publish / open-vsx` upload that very VSIX with `vsce publish --oidc` and `ovsx publish --trusted-publishing`, both with `--skip-duplicate`, so a re-run passes a marketplace that has the version already.

A manual dispatch with `dry_run` runs only the build step, on any branch, and releases nothing.

### Trusted publishing on the VS Code Marketplace and Open VSX

Both marketplaces trade the publish job's GitHub OIDC token (`id-token: write`) for a short-lived publishing token, so the repository stores no token for either. Both bind to the workflow file name and the environment: renaming `release-please.yml` or `vscode-marketplace` breaks publishing until the registrations below are updated.

The **VS Code Marketplace** (`vsce publish --oidc`, vsce 4.1.0 or later) needs a Trusted Publishing policy on the publisher `miragon-gmbh` (publisher management page → Trusted Publishing → Create):

| Field            | Value                  |
| ---------------- | ---------------------- |
| Repository owner | `Miragon`              |
| Repository       | `domain-story-modeler` |
| Workflow         | `release-please.yml`   |
| Environment      | `vscode-marketplace`   |

**Open VSX** (`ovsx publish --trusted-publishing`, ovsx 1.3.0 or later) needs a trusted publisher for the extension `miragon-gmbh.egon-vscode-extension`: as a namespace owner of `miragon-gmbh`, Settings → Trusted Publishers (`https://open-vsx.org/user-settings/trusted-publishers`), provider GitHub Actions, with the same four values (organization `Miragon`, repository `domain-story-modeler`, workflow filename `release-please.yml`, environment `vscode-marketplace`). A registration cannot be edited, only deleted and created again. The extension exists on Open VSX already, so no manual bootstrap publish is needed.

## One-time GitHub setup

1. In the Miragon organization’s installed GitHub Apps, grant the release automation App access to `domain-story-modeler`. If a new App is needed, give it repository Contents, Pull requests, and Issues read/write permissions and disable webhooks.
2. In **Settings → Secrets and variables → Actions**, add the variable `RELEASE_PLEASE_APP_CLIENT_ID` and the secret `RELEASE_PLEASE_APP_PRIVATE_KEY`. Organization-level credentials are also suitable when this repository is granted access.
3. In **Settings → General → Pull Requests**, enable squash merging, select the pull request title as the default squash commit message, and disable merge commits and rebase merging.
4. After the first successful workflows, protect `main`: require pull requests and require the `ci` and `Validate Conventional Commit title` checks.
5. In **Settings → Environments**, create `vscode-marketplace` with required reviewers and restrict its deployment branches to `main`. Register trusted publishing on both marketplaces as described in [Trusted publishing](#trusted-publishing-on-the-vs-code-marketplace-and-open-vsx).
6. Merge a real `fix:` or `feat:` pull request. Review and merge the generated release pull request, approve the `vscode-marketplace` deployment, then confirm that the root and extension versions agree, that the tag, changelog, and GitHub release were created, and that both marketplaces list the new version.

## Troubleshooting

The root resolution pins `@azure/msal-node` to `7.1.0` to fix
[GHSA-xcx6-jx8p-x3h5](https://github.com/advisories/GHSA-xcx6-jx8p-x3h5)
in the `@vscode/vsce` → `@azure/identity` packaging dependency chain. Remove
the override once the upstream dependency range requires a patched release.

If an immutable install fails, run `yarn install` with the pinned toolchain, review the manifest and lockfile changes, and commit both. If Release Please cannot create or update its pull request, first check the App installation scope and the two Actions credentials. If a publish job fails to authenticate, compare the marketplace's trusted publishing registration with the repository, workflow file name, and environment; a re-run after fixing it publishes the same VSIX. If a dependency audit fails, update the affected direct dependency or resolution rather than lowering the audit threshold.
