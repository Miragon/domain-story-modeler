# Modeler core architecture

The core is organized into three feature slices:

```text
src/
├── shared/
│   ├── domain/          # EditorSession and host ports
│   └── service/         # Session synchronization
├── story/
│   ├── domain/          # Reserved for story domain behavior
│   └── infrastructure/  # Reserved for host-independent persistence
└── icons/
    ├── domain/          # Icon values and path parsing
    └── service/         # Icon discovery, reconciliation, and propagation
```

The core depends on `@egon/modeler-types` and `@egon/modeler-shared`. Its narrow ports point outward;
VS Code adapters and the explicit activation composition root point inward. The
shared TypeScript import-graph tests enforce workspace direction, named package
entrypoints, acyclic file imports, host isolation, and domain/service layers.

`DisposalScope` provides host-independent, idempotent lifetime ownership.
`IconService` owns discovery, hierarchy selection, and open-buffer
reconciliation; the extension translates resources and events without
duplicating those policies. The old story icon mutation and serialization
helpers were removed because no production caller used them.

Current command names, session behavior, synchronization guards, and document
identity semantics are preserved.
