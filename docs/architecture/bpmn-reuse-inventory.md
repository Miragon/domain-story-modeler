# BPMN Modeler reuse inventory

The immutable architecture reference is Miragon/bpmn-modeler commit
`08ea2c32ac05fdaeaab251229e56c5c0b2ae586b`. The Domain Story Modeler baseline
for the package split is `4feee0a39b92aec56c7ffe27b2275a8270dd5350`; the
explicit-composition work starts from `2b87472`.

## Implemented ports

| Reference source                                                                     | Reused pattern                                                                                                  | EGN adaptation                                                                                                                                                                    |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/vscode-plugin/src/composition/sharedDeps.ts`                                   | One explicit composition root creates shared adapters and services                                              | `apps/vscode-plugin/src/main.ts` constructs only EGN editor/icon dependencies and preserves view type `egon.io` and extension `egn`                                               |
| Registration functions near the composition root                                     | Constructors remain inactive; registration acquires and returns resources                                       | `registration.ts` owns the custom editor provider, icon watcher, and all watcher subscriptions                                                                                    |
| Host-independent disposable scopes                                                   | Nested lifetimes, late-resource disposal, idempotent teardown, and cleanup continuation                         | `DisposalScope` owns activation and editor resources without importing the BPMN participant framework                                                                             |
| Core host-capability ports                                                           | Application services depend on narrow interfaces                                                                | EGN adds workspace lookup, discovery, filesystem/text-document reads, filesystem writes, diagnostics, and notifications while retaining `DocumentPort` and `ViewPort`             |
| `ModelerEditorController.spec.ts` lifecycle regressions                              | Early dispatch gating, close during setup, replacement safety, and rejected-dispatch reporting                  | Ported to `WebviewController.spec.ts` with EGN commands and direct fakes; no participant or BPMN session model was imported                                                       |
| `libs/modeler-core/src/shared/infrastructure/WebviewMessageRouter.ts` and `.spec.ts` | Registration-based routing, ordered sequential handlers, unknown-message no-op, and propagated handler failures | Ported to `modeler-core` with generic discriminated-message/context typing; the controller retains logging and validates `unknown` transport input before routing                 |
| `libs/shared/src/lib/messages.ts`                                                    | Explicit `type` wire literals, diagnostics, and document-flush contracts                                        | Replaced EGN constructor-name commands with directional interfaces; retained only initialization, display, synchronization, debug/error diagnostics, and reserved flush contracts |
| `libs/shared/src/lib/host.ts`                                                        | `HostApi`, production adapter, missing-state error, replacement, and patch semantics                            | Ported to `modeler-shared`; added one-time API acquisition, concrete EGN viewport state, and identical preview merging                                                            |
| `apps/bpmn-webview/src/host.ts`                                                      | Environment-selected production/preview host bridge                                                             | Adapted in `apps/egn-webview/src/vscode/api.ts` and `mock.ts`; preview initialization emits display and synchronization is consumed without an echo                               |

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

## Stable protocol adaptations

The issue #12 port uses the same immutable BPMN source commit listed above.
Unlike the source router, EGN transport parsing validates direction, required
field types, session binding, and story envelopes before queueing or dispatch.
Supported story validation is intentionally shallow: legacy icon metadata and
`dst`, or v4 icon metadata and `domainStory` metadata/business-object arrays,
must be present; icon maps must contain string SVG values. Additional document
fields pass through unchanged and `egon-core` remains authoritative for model
semantics.

The source flush contracts are reserved with numeric tokens, destructive/export
flags, optional content/revision, and the four source statuses. No sender,
responder, timeout, mutation lock, or save participant was ported. Production
artifact tests load the minified extension and webview outputs, proving routing
uses wire literals rather than preserved constructor/function names.

## Deliberate exclusions

No BPMN/DMN models, participant framework, public API, feature-specific routing,
deployment, or reference-repository source was copied. Persistence range changes,
synchronization queues, revision tracking, URI redesign, and broader session
guard changes remain deferred to issue #13. Operational document flushing
remains deferred to issue #15. `egon-core` remains the independent webview
renderer.
