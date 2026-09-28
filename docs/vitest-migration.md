# Vitest migration baseline and provenance

This document records the executable baseline and reuse inventory for issue #9,
the testing foundation for epic #8.

Issue #10 subsequently split the two libraries into the `modeler-core`,
`modeler-shared`, and `modeler-types` projects and renamed both app directories.
The baseline counts below remain the historical issue #9 result; current tests
are registered across five workspace projects.

## Pre-migration baseline

The baseline was captured at Domain Story Modeler commit `4f80a5e` before any
tooling edits. Full command output is retained locally under
`.context/vitest-migration-baseline/`.

| Check | Environment/command | Result |
|---|---|---|
| Runtime | `node --version`; `yarn --version` | Node `24.21.0`; Yarn `4.18.0` |
| Install | `yarn install --immutable` | Passed without lockfile changes |
| Tests | `yarn jest --coverage --coverageReporters=clover --coverageDirectory=.context/vitest-migration-baseline/coverage` | 5 suites and 71 tests passed; 0 snapshots |
| Lint | `yarn lint` | Passed without warnings or errors |
| Build | `yarn build` | Passed |

The baseline build emitted the existing Vite warnings that the two library
output directories are outside their project roots and will not be emptied. It
also reported the existing webview chunk above 500 kB. Webpack completed
successfully. There were no baseline failures.

Coverage was redirected into `.context/` so the baseline run did not overwrite
the tracked report that existed before this migration.

## Implemented migration

- Pinned `vitest` and `@vitest/coverage-v8` to `4.1.11` and removed the Jest
  runner, environments, types, transformer, and its `ts-node` configuration
  dependency.
- Registered the plugin, webview, domain-story library, and DTO library as named
  Node projects. Each project discovers only local tests and aliases workspace
  dependencies to source, so built libraries are not required.
- Migrated all five existing suites and 71 tests with explicit Vitest imports,
  typed mocks, hoist-safe factories, and constructible constructor doubles.
- Replaced the implicit JavaScript VS Code mock with the explicitly aliased
  TypeScript module at `test/mocks/vscode.ts`.
- Kept `reflect-metadata` in the domain-story setup and removed references to
  nonexistent app setup files.
- Unified `yarn test` on V8 coverage under the ignored root `coverage/`
  directory. Text, HTML, LCOV, Clover, and JSON reports are generated.
- Removed tracked generated coverage and updated CI, TypeScript, lint, and
  developer documentation for the single test runner.

The migrated baseline deliberately retains the document adapter's fixed
9,999-line replacement assertion and labels it as a known defect. Issue #13
owns changing that assertion alongside the persistence fix. BPMN's stronger
session-guard regression tests are also deferred to #13 because the session and
synchronization implementation they exercise is absent here.

## Reuse inventory

Reference repository: Miragon BPMN Modeler commit
`08ea2c32ac05fdaeaab251229e56c5c0b2ae586b`.
The configuration structure is adapted from that Apache-2.0-licensed project;
see its immutable
[`vitest.config.ts`](https://github.com/Miragon/bpmn-modeler/blob/08ea2c32ac05fdaeaab251229e56c5c0b2ae586b/vitest.config.ts).

| Reference | Reused pattern | EGN adaptation |
|---|---|---|
| Root `vitest.config.ts` | Root project list and V8 reporter set | Four current workspaces; one ignored root report; production-source inclusion; no BPMN projects or thresholds |
| `apps/vscode-plugin/vitest.config.ts` | Named Node project, local discovery, source aliases | Current `@egon/*` packages and the shared VS Code TypeScript test double |
| `libs/modeler-core/vitest.config.ts` | Per-library project boundary and setup pattern | Current domain-story layout and retained `reflect-metadata` setup |
| Existing Domain Story Modeler suites | Explicit Vitest APIs, `vi` mocks, typed helpers, and hoist-safe constructor doubles | Preserved legacy/v4 fixtures, EGN v4 defaults, sessions, writes, rejection paths, and webview messages |

No BPMN feature project or production module was copied. The referenced BPMN
`session.spec.ts` was reviewed for the future regression shape but was not
ported because its host-independent session implementation does not exist in
this repository yet.

## Post-migration validation

The final immutable installation, `yarn test`, `yarn lint`, and `yarn build`
all pass on the pinned runtime. Vitest executes the same five suites and 71
tests with no skipped tests. The build emits only the same outDir and webview
chunk-size warnings recorded in the pre-migration baseline.

Temporary passing probes in the plugin, webview, and DTO workspaces verified
root discovery across all four projects. A filtered project run verified name
selection, and a deliberately failing probe verified nonzero failure
propagation. After removing the probes, selecting an empty project exits with
code 1, preserving the no-tests failure. All probe files were removed.

All four test TypeScript configurations pass `tsc --noEmit`. Coverage regenerates
all configured report formats under the ignored `coverage/` directory without
adding generated files to Git.

## Epic reuse-inventory update

The workstream 1 row in epic #8 can now be updated from a planned port to this
completed result:

| Workstream | Source implementation/tests | Completed EGN adaptation |
|---|---|---|
| 1. Adopt Vitest and establish the regression baseline | BPMN Modeler `vitest.config.ts`, `libs/modeler-core/vitest.config.ts`, `apps/vscode-plugin/vitest.config.ts`, and `libs/modeler-core/src/shared/domain/session.spec.ts` at `08ea2c32ac05fdaeaab251229e56c5c0b2ae586b` | Ported root/per-workspace Vitest configuration, source aliases, coverage reporters, and test-double patterns across all four EGN workspaces. Migrated 5 suites/71 tests without behavior changes; removed generated coverage and the previous runner. BPMN session-guard regressions remain deferred to #13 because their implementation is not present. |
