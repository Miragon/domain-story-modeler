# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Egon.io VS Code Extension - A Domain Story Modeler plugin that integrates the open source Egon.io tool into Visual Studio Code. Users create and edit `.egn` files to write domain stories visually using diagram-js.

## Build Commands

```bash
# Install dependencies (Yarn 4 workspaces)
yarn install

# Development (watch mode for all packages)
yarn dev

# Production build
yarn build

# Run all tests
yarn test

# Typecheck every workspace
yarn typecheck

# Run a single test file
yarn vitest run path/to/file.spec.ts

# Lint
yarn lint

# Serve webview for development (hot reload)
yarn serve
```

## Architecture

### Monorepo Structure (Yarn Workspaces)

- **apps/vscode-plugin** - VS Code extension entry point and VS Code adapters (Webpack)
- **apps/egn-webview** - Browser UI using the published `egon-core` renderer (Vite)
- **libs/modeler-core** - Host-independent domain, services, and host ports
- **libs/modeler-shared** - Private host/webview command protocol
- **libs/modeler-types** - Browser-safe EGN v4/legacy types and canonical defaults

### Modeler architecture

Three-layer architecture with explicit construction at the extension entry point:

1. **Domain Layer** - Pure business logic, no external dependencies

   - `EditorSession` - Aggregate root managing editor state and sync guards

2. **Application Layer** - Use case orchestration with port interfaces

   - `DomainStoryEditorService`, `IconService` - Session and icon orchestration
   - Narrow host ports for editor, workspace, file, diagnostics, and notifications

3. **Host Infrastructure** - `apps/vscode-plugin` implements the core ports
   - `VsCodeDocumentPort`, `VsCodeViewPort`, and `VsCodeIconHost` adapt VS Code APIs

### Modeler core

The diagram-js modeler is supplied by the pinned
[`egon-core`](https://github.com/Miragon/egon-core) release. Its public client
and stylesheet are consumed by `apps/egn-webview`; renderer internals are maintained
in the upstream repository.

### Plugin ↔ Webview Communication

Commands flow bidirectionally via `postMessage`:

- `InitializeWebviewCommand` - Webview requests initial content
- `DisplayDomainStoryCommand` - Extension sends content to webview
- `SyncDocumentCommand` - Webview sends changes to extension

Echo prevention uses per-session guards to prevent infinite sync loops.

## Key Patterns

- **Composition**: `apps/vscode-plugin/src/main.ts` explicitly constructs shared adapters and services; registration functions own resources
- **Custom Icons**: Users add SVGs to `.egon/icons/actors/` or `.egon/icons/work-objects/` in workspace
- **Semantic Commits**: Follow conventional commits (feat, fix, docs, etc.)

## Testing

Tests use Vitest projects for all five workspaces. The core architecture suite enforces the absence of VS Code imports.
