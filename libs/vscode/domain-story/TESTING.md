# Testing Guide

The repository uses Vitest projects so every workspace has an explicit test
boundary, including the workspaces that do not contain tests yet. All projects
run in Node and resolve shared workspace packages directly to source.

## Commands

Run all workspace tests with V8 coverage:

```bash
yarn test
```

Run without coverage or in watch mode:

```bash
yarn vitest run
yarn vitest
```

Run only the domain-story project or one test file:

```bash
yarn vitest run --project domain-story
yarn vitest run libs/vscode/domain-story/src/domain/EditorSession.spec.ts
```

Coverage reports are generated in the ignored root `coverage/` directory in
text, HTML, LCOV, Clover, and JSON formats.

## Project layout

The root `vitest.config.ts` registers these named projects:

- `egon-modeler-plugin`
- `egon-modeler-webview`
- `domain-story`
- `data-transfer-objects`

Each workspace owns a `vitest.config.ts` with local test discovery and source
aliases. The domain-story setup imports `reflect-metadata` before decorated
source is loaded. The shared `test/mocks/vscode.ts` module supplies the VS Code
runtime test double through an explicit alias.

## Regression baseline

The domain-story project contains five suites and 71 tests:

| Test file | Tests | Focus |
|---|---:|---|
| `application/DomainStoryEditorService.spec.ts` | 28 | Sessions, synchronization, disposal, and edge cases |
| `application/icons/IconOperations.spec.ts` | 9 | Legacy/v4 icon operations and EGN v4 defaults |
| `domain/EditorSession.spec.ts` | 13 | Local and remote content changes |
| `infrastructure/VsCodeDocumentPort.spec.ts` | 10 | Document reads, writes, and failures |
| `infrastructure/VsCodeViewPort.spec.ts` | 11 | Webview messages and failures |

The document-port assertion for the fixed line 9,999 replacement range is a
known-defect baseline. Issue #13 owns replacing it together with the production
fix. The stronger BPMN session-guard regression scenarios are also deferred to
#13 because their corresponding synchronization implementation is not present
in this codebase yet.

## Writing tests

Import the APIs a test uses explicitly from `vitest`:

```typescript
import { describe, expect, it, vi } from "vitest";
```

Keep domain tests pure. Use small port fakes for application tests, and use
`vi.mock`, `vi.fn`, and `vi.mocked` for host adapters. Mock factories are
hoisted, so create factory dependencies with `vi.hoisted` when needed. Mocked
constructors must use constructible functions or classes rather than arrow
functions.

Run `yarn lint`, the applicable TypeScript configuration, and `yarn test` after
changing tests or test infrastructure.
