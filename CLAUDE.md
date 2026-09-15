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

# Run a single test file
yarn test --testPathPattern="<pattern>"

# Lint
yarn lint

# Serve webview for development (hot reload)
yarn serve
```

## Architecture

### Monorepo Structure (Yarn Workspaces)

- **apps/dst-plugin** - VS Code extension entry point (webpack bundled)
- **apps/dst-webview** - Webview UI that renders the diagram-js canvas with `egon-core` (Vite bundled)
- **libs/vscode/domain-story** - Application layer with DDD architecture (domain, application, infrastructure)
- **libs/vscode/data-transfer-objects** - Command DTOs for plugin ↔ webview communication

### DDD Architecture (libs/vscode/domain-story)

Three-layer architecture with dependency injection via tsyringe:

1. **Domain Layer** - Pure business logic, no external dependencies
   - `EditorSession` - Aggregate root managing editor state and sync guards

2. **Application Layer** - Use case orchestration with port interfaces
   - `DomainStoryEditorService` - Session management and sync coordination
   - `DocumentPort`, `ViewPort` - Interfaces for infrastructure

3. **Infrastructure Layer** - VS Code API implementations
   - `VsCodeDocumentPort`, `VsCodeViewPort` - Adapt VS Code APIs to ports

### Modeler core

The diagram-js modeler is supplied by the pinned
[`egon-core`](https://github.com/Miragon/egon-core) release. Its public client
and stylesheet are consumed by `apps/dst-webview`; core internals are maintained
in the upstream repository.

### Plugin ↔ Webview Communication

Commands flow bidirectionally via `postMessage`:
- `InitializeWebviewCommand` - Webview requests initial content
- `DisplayDomainStoryCommand` - Extension sends content to webview
- `SyncDocumentCommand` - Webview sends changes to extension

Echo prevention uses per-session guards to prevent infinite sync loops.

## Key Patterns

- **Dependency Injection**: tsyringe container configured in `main.config.ts`
- **Custom Icons**: Users add SVGs to `.egon/icons/actors/` or `.egon/icons/work-objects/` in workspace
- **Semantic Commits**: Follow conventional commits (feat, fix, docs, etc.)

## Testing

Tests use Jest. The `libs/vscode/domain-story` library has comprehensive unit tests demonstrating the testing patterns for each layer.
