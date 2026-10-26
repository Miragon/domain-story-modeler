# Development

This Yarn monorepo builds the Egon.io VS Code extension and its browser
webview. The workspace layout is:

- `apps/vscode-plugin`: extension composition, controllers, and VS Code
  adapters; bundled with Webpack.
- `apps/egn-webview`: browser bootstrap around the published `egon-core`
  renderer; bundled with Vite.
- `libs/modeler-core`: host-independent editor, story, and icon behavior plus
  host capability ports.
- `libs/modeler-shared`: private extension/webview command protocol.
- `libs/modeler-types`: browser-safe EGN v4 and legacy types plus the canonical
  empty story.

All consumers import libraries through their `@egon/modeler-*` entrypoints.
TypeScript path aliases let Vite and Webpack bundle library sources directly,
so app builds work without pre-existing `dist/libs` artifacts.

## Commands

```bash
yarn install --immutable
yarn typecheck
yarn lint
yarn test
yarn test:browser
yarn build
yarn test:artifacts
yarn package
yarn test:package
yarn test:extension
```

`yarn typecheck` checks all production sources, workspace test sources, and the
strict Node integration harness. `yarn build` builds the three libraries,
removes the old extension output once, then builds the webview and extension in
parallel.
Output is written to `dist/libs/*` and the self-contained extension directory
`dist/apps/vscode-plugin`. Run `yarn dev` to watch all workspaces, then press
F5 in VS Code to launch an Extension Host. Run `yarn serve` to serve the
webview separately.

## Boundaries

The TypeScript import-graph test resolves aliases, re-exports, type imports,
dynamic imports, and `require`. It rejects workspace dependency violations,
relative boundary crossings, cycles, host imports in libraries or webview, and
domain/service imports of higher layers. Cross-workspace imports use named
`@egon/modeler-*` entrypoints. The webview uses `@egon/modeler-types` for
default EGN data and `egon-core` for rendering.

See [ADR 0001](architecture/decisions/0001-modeler-package-boundaries.md) for
the dependency decision and the [reuse inventory](architecture/bpmn-reuse-inventory.md)
for the pinned BPMN sources and adaptations.

## Packaging

After `yarn build`, package and validate the generated extension:

```bash
yarn package
yarn test:package
```

The VSIX is `dist/egon-vscode-extension.vsix`, outside the packaging input
directory. The packaged manifest retains the `egon-vscode-extension` name,
`miragon-gmbh` publisher, `egon.io` custom editor view type, and `*.egn`
selector. `yarn test:extension` installs that VSIX into isolated VS Code
directories and exercises the real editor and webview on pinned VS Code
`1.100.3`. On Linux, run it with `xvfb-run -a yarn test:extension`.

## Platform smoke checks

The complete packaged suite is required on Linux for every PR. For macOS and
Windows release checks, run `yarn build`, `yarn package`, and
`yarn test:package`, install `dist/egon-vscode-extension.vsix` into an isolated
VS Code profile, then open a v4 `.egn` story. Create an actor on the canvas,
save and reopen it; edit the source and confirm the canvas updates. Add, change,
and delete an SVG in `.egon/icons/actors`, checking undo/save in the open
document and confirming a closed story file stays unchanged. Split a story into
two editor groups, pan/zoom, hide and reveal a panel, and reopen a legacy story
after saving it as v4. Record the VS Code version, platform, VSIX checksum, and
any observed failures with screenshots.
