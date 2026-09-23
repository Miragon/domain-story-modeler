# ADR 0001: Modeler package boundaries and local port reuse

- Status: Accepted
- Date: 2026-09-23

## Context

The former domain-story workspace mixed host-independent behavior with VS Code
adapters, while protocol commands and EGN defaults lived in host-specific or
duplicated locations. The alignment epic also needs patterns from BPMN Modeler
without coupling the two repositories or importing BPMN/DMN features.

## Decision

Use five flat workspaces with one-way dependencies:

```text
apps/vscode-plugin ──> modeler-core ──> modeler-types
        │                    │
        └────────────> modeler-shared <──── apps/egn-webview
                                             │
                                             ├──> modeler-types
                                             └──> egon-core
```

- `@egon/modeler-core` contains host-independent feature slices and host ports.
  It may export domain models, services, ports, and host-independent
  infrastructure, but never a VS Code adapter.
- `@egon/modeler-shared` contains the private host/webview command protocol.
- `@egon/modeler-types` contains dependency-free EGN types and defaults.
- `apps/vscode-plugin` owns composition and every `vscode` import.
- `apps/egn-webview` owns browser bootstrap and continues to use `egon-core` for
  rendering and modeling.

Reusable BPMN Modeler patterns are ported locally behind EGN-specific ports.
No cross-repository runtime package is introduced. Source aliases point at each
workspace entrypoint so app builds do not require prebuilt `dist/libs` output.

## Consequences

The core can be reused by another host, browser bundles cannot pull in VS Code
adapters through its barrel, and default EGN data has one owner. Protocol and
composition redesigns remain separate follow-up work.
