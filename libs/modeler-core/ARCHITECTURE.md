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
    └── service/         # Icon reconciliation use cases
```

The core depends only on `@egon/modeler-types` and the existing composition
metadata dependency. Its ports point outward; host adapters point inward. The
architecture regression test scans production source and fails on any VS Code
import.

Current command names, session behavior, synchronization guards, and document
identity semantics are intentionally preserved. Follow-up issues own their
redesign and correctness changes.
