# Testing

Run all five Vitest projects with coverage using `yarn test`, or run the core
project alone with:

```bash
yarn vitest run --project modeler-core
```

The regression suites cover editor sessions, synchronization, active icon
reconciliation, and the VS Code adapters. Boundary fixtures deliberately
violate every import rule, including alias/barrel indirection and cycles.
`IconService.spec.ts` checks legacy/v4 story and metadata preservation.

Run the packaged editor suite after a clean build:

```bash
yarn build && yarn test:artifacts && yarn package && yarn test:package
yarn test:extension
```

Linux CI runs the last command under Xvfb. The driver installs the VSIX into
isolated directories and uses VS Code APIs plus a Playwright connection to the
real webview. Failed scenarios save screenshots and browser/Extension Host logs
under `.context/extension-diagnostics`.

The fixed 9,999-line document replacement assertion remains a deliberate
regression baseline for the later persistence issue.
