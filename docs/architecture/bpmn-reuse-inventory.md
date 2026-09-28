# BPMN Modeler reuse inventory

The architecture reference is Miragon/bpmn-modeler commit
`08ea2c32ac05fdaeaab251229e56c5c0b2ae586b`. The Domain Story Modeler baseline
for this migration is `4feee0a39b92aec56c7ffe27b2275a8270dd5350`.

| Reference source | Reuse | EGN adaptation |
| --- | --- | --- |
| `libs/modeler-core/README.md` | Boundary rule and entrypoint-only consumption | Kept only EGN editor, story, and icon capabilities; `egon-core` remains the renderer |
| `libs/modeler-core/src/index.ts` | Explicit host-independent package barrel | Exports the existing EGN services, domain models, and ports; omits every BPMN/DMN feature |
| `libs/modeler-core/src/shared/domain/hostPorts.ts` | Local host-capability port pattern | Reused the existing `DocumentPort` and `ViewPort` contracts without changing synchronization semantics |
| `libs/shared/README.md` | Private host protocol boundary | Moved the existing command classes unchanged into `@egon/modeler-shared` |
| `libs/modeler-types/README.md` | Dependency-free browser type boundary | Added EGN v4, minimal legacy types, and the canonical EGN v4 empty story |
| `tsconfig.base.json` | Workspace source aliases | Added the three local `@egon/modeler-*` entrypoints for Vite, Webpack, tests, and typechecks |

No implementation or test was copied verbatim in this issue; the listed BPMN
files supplied boundary and build patterns. BPMN/DMN models, public APIs,
routing, deployment, linting, and other feature-specific code were deliberately
excluded.
