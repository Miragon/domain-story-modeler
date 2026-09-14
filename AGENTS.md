# AGENTS.md - Development Guide

## Commands

- **Build all**: `yarn build` (builds libs → webview → plugin sequentially)
- **Build libs**: `yarn build:libs` (builds all libraries in parallel)
- **Build webview**: `yarn build:webview`
- **Build plugin**: `yarn build:plugin`
- **Development mode (watch all)**: `yarn dev` (builds libs once, then watches everything; rebuilds to dist/ on file changes)
- **Test all**: `yarn test`
- **Lint all**: `yarn lint`

## Architecture

- **Monorepo**: Yarn workspace with apps/ and libs/ structure
- **Apps**: 
  - vscode/egon-modeler-plugin (VS Code extension) - built with Webpack
  - vscode/egon-modeler-webview (TypeScript webview) - built with Vite
- **Libs**: diagram-js-egon-plugin/ (core diagram.js plugin), vscode/ (shared VS Code library)
- **Framework**: VS Code, TypeScript, diagram.js for canvas rendering
- **Package Manager**: Yarn 4.18.0
- **Build Output**: 
  - Libraries: dist/libs/ (separate builds with .d.ts files)
  - Extension: dist/apps/vscode/egon-io/ (self-contained bundle, ready for vsce packaging)
- **Development**: Run `yarn dev` then press F5 in VS Code to launch Extension Host
- **Development Optimization**: In dev mode, apps import from pre-built libs in dist/libs/ for faster rebuilds
- **Production**: Apps bundle library sources directly (self-contained); library builds are separate artifacts
- **VS Code Plugin**: Simplified architecture with WebviewController handling communication between VS Code and webview

## Code Style

- **TypeScript**: Strict typing, interfaces for data structures
- **Imports**: Use relative imports for local files, absolute for dependencies
- **Naming**: camelCase for variables/functions, PascalCase for interfaces/classes
- **Formatting**: ESLint + Prettier configured
- **Testing**: Jest for unit tests, no empty functions allowed (@typescript-eslint/no-empty-function: off)
