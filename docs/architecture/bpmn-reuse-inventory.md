# BPMN Modeler reuse inventory

The immutable architecture reference is Miragon/bpmn-modeler commit
`08ea2c32ac05fdaeaab251229e56c5c0b2ae586b`. The Domain Story Modeler baseline
for the package split is `4feee0a39b92aec56c7ffe27b2275a8270dd5350`; the
explicit-composition work starts from `2b87472`.

## Implemented ports

| Reference source                                        | Reused pattern                                                                                 | EGN adaptation                                                                                                                                                        |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/vscode-plugin/src/composition/sharedDeps.ts`      | One explicit composition root creates shared adapters and services                             | `apps/vscode-plugin/src/main.ts` constructs only EGN editor/icon dependencies and preserves view type `egon.io` and extension `egn`                                   |
| Registration functions near the composition root        | Constructors remain inactive; registration acquires and returns resources                      | `registration.ts` owns the custom editor provider, icon watcher, and all watcher subscriptions                                                                        |
| Host-independent disposable scopes                      | Nested lifetimes, late-resource disposal, idempotent teardown, and cleanup continuation        | `DisposalScope` owns activation and editor resources without importing the BPMN participant framework                                                                 |
| Core host-capability ports                              | Application services depend on narrow interfaces                                               | EGN adds workspace lookup, discovery, filesystem/text-document reads, filesystem writes, diagnostics, and notifications while retaining `DocumentPort` and `ViewPort` |
| `ModelerEditorController.spec.ts` lifecycle regressions | Early dispatch gating, close during setup, replacement safety, and rejected-dispatch reporting | Ported to `WebviewController.spec.ts` with EGN commands and direct fakes; no participant or BPMN session model was imported                                           |

## EGN-specific orchestration

`IconService` now owns custom-icon discovery, hierarchy filtering, story-format
selection, legacy/v4 transformation, and persistence decisions. `VsCodeIconHost`
only translates string resource identifiers to VS Code workspace operations.
The service preserves discovery order, `.egon/icons` visibility, empty-SVG event
handling, and workspace-wide writes to closed `.egn` documents.

The regression ports cover activation cleanup, constructor inactivity, early
handshake, delayed close/replacement, independent panels, initialization
fallback, late resources, icon create/update/delete, hierarchy filtering, empty
SVGs, closed-document writes, and legacy/v4 preservation.

## Deliberate exclusions

No BPMN/DMN models, participant framework, public API, routing, deployment, or
reference-repository source was copied. Persistence range changes,
synchronization queues, revision tracking, URI redesign, and broader session
guard changes remain deferred to issue #13. `egon-core` remains the independent
webview renderer.
