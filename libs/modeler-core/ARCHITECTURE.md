# Modeler core architecture

The core is organized into three feature slices:

```text
src/
├── shared/
│   ├── domain/          # EditorSession and host ports
│   └── service/         # Session synchronization
├── story/
│   ├── domain/          # Story icon mutation
│   └── infrastructure/  # JSON parsing and serialization
└── icons/
    ├── domain/          # Icon values and path parsing
    └── service/         # Icon discovery, reconciliation, and propagation
```

The core depends only on `@egon/modeler-types`. Its narrow ports point outward;
VS Code adapters and the explicit activation composition root point inward. The
architecture regression tests reject VS Code, host-adapter, and runtime
dependency-injection imports.

`DisposalScope` provides host-independent, idempotent lifetime ownership.
`IconService` owns discovery, hierarchy selection, transformation, and
filesystem persistence decisions; the extension translates resources and
events without duplicating those policies.

Current command names, session behavior, synchronization guards, and document
identity semantics are intentionally preserved. Follow-up issues own their
redesign and correctness changes.
