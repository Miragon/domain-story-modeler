# Testing

Run all five Vitest projects with coverage using `yarn test`, or run the core
project alone with:

```bash
yarn vitest run --project modeler-core
```

The relocated regression suites cover editor sessions, synchronization, icon
operations, and the two VS Code adapters. Additional boundary suites cover the
canonical default story, legacy/v4 preservation, package entrypoints, and the
absence of VS Code imports from modeler core.

The fixed 9,999-line document replacement assertion remains a deliberate
regression baseline for the later persistence issue.
