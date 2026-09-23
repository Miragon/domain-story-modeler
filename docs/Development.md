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
yarn build
```

`yarn build` builds the three libraries first, then the webview and extension.
Output is written to `dist/libs/*` and the self-contained extension directory
`dist/apps/vscode-plugin`. Run `yarn dev` to watch all workspaces, then press
F5 in VS Code to launch an Extension Host. Run `yarn serve` to serve the
webview separately.

## Boundaries

`libs/modeler-core` must not import `vscode`; host implementations belong in
`apps/vscode-plugin/src/infrastructure`. `libs/modeler-shared` and
`libs/modeler-types` must remain browser-safe. The webview uses
`@egon/modeler-types` for default EGN data and `egon-core` for rendering.

See [ADR 0001](architecture/decisions/0001-modeler-package-boundaries.md) for
the dependency decision and the [reuse inventory](architecture/bpmn-reuse-inventory.md)
for the pinned BPMN sources and adaptations.

## Packaging

After `yarn build`, package from the generated extension directory:

```bash
cd dist/apps/vscode-plugin
vsce package --out egon-io.vsix --yarn --no-dependencies
```

The packaged manifest retains the `egon-vscode-extension` name,
`miragon-gmbh` publisher, `egon.io` custom editor view type, and `*.egn`
selector.
