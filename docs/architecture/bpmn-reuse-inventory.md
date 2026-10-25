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
| Core host-capability ports                                                           | Application services depend on narrow interfaces                                                                | EGN adds workspace lookup, URI directory traversal, filesystem reads, diagnostics, and notifications while retaining `DocumentPort` and `ViewPort`                                  |
| `ModelerEditorController.spec.ts` lifecycle regressions                              | Early dispatch gating, close during setup, replacement safety, and rejected-dispatch reporting                  | Ported to `WebviewController.spec.ts` with EGN commands and direct fakes; no participant or BPMN session model was imported                                                       |
| `libs/modeler-core/src/shared/infrastructure/WebviewMessageRouter.ts` and `.spec.ts` | Registration-based routing, ordered sequential handlers, unknown-message no-op, and propagated handler failures | Ported to `modeler-core` with generic discriminated-message/context typing; the controller retains logging and validates `unknown` transport input before routing                 |
| `libs/shared/src/lib/messages.ts`                                                    | Explicit `type` wire literals, diagnostics, and document-flush contracts                                        | Replaced EGN constructor-name commands with directional interfaces; retained only initialization, display, synchronization, debug/error diagnostics, and reserved flush contracts |
| `libs/shared/src/lib/host.ts`                                                        | `HostApi`, production adapter, missing-state error, replacement, and patch semantics                            | Ported to `modeler-shared`; added one-time API acquisition, concrete EGN viewport state, and identical preview merging                                                            |
| `apps/bpmn-webview/src/host.ts`                                                      | Environment-selected production/preview host bridge                                                             | Adapted in `apps/egn-webview/src/vscode/api.ts` and `mock.ts`; preview initialization emits a revisioned display and synchronization receives a correlated result                 |

## EGN-specific orchestration

`IconService` owns ancestor discovery, deterministic category/name selection,
legacy/v4 reconciliation, and session-only source ownership. `VsCodeIconHost`
translates full URI identifiers to directory and file reads. `IconWatcherController`
tracks open buffers, watches icon directories per workspace root, coalesces
refreshes, and commits ownership after an accepted buffer edit or exact no-op.
`DomainStoryEditorService` queues those transforms with panel writes, while
`DocumentSaveFlushController` confirms initialized panel sessions before a
transform. Closed `.egn` files are never discovered or written.

The regression ports cover activation cleanup, constructor inactivity, early
handshake, delayed close/replacement, independent panels, late resources,
ancestor selection, empty SVGs, closed-buffer exclusion, and legacy/v4
preservation.

## Issue #16: buffer-safe icon synchronization

The pinned BPMN [ArtifactService](https://github.com/Miragon/bpmn-modeler/blob/08ea2c32ac05fdaeaab251229e56c5c0b2ae586b/libs/modeler-core/src/shared/service/ArtifactService.ts)
informed per-document artifact discovery and reconciliation. EGN adapts it to
`.egon/icons` category directories and preserves complete URI identity. The
core ports are `IconDirectoryPort`, `FileReadPort`, and `WorkspaceFolderPort`;
the VS Code adapter supplies URI joins, parent traversal, and directory reads.
The write boundary is the existing `DocumentPort` and its open-buffer,
version-checked `WorkspaceEdit`. No story-file filesystem write remains.

`IconService.spec.ts` tests ancestor precedence, collisions, containment,
deletion fallback, manual edits, no-ops, invalid envelopes, and missing SVGs.
`VsCodeIconHost.spec.ts` tests directory/file reads and missing-directory
handling. `VsCodeDocumentPort.spec.ts` tests open-only writes and version checks;
`DomainStoryEditorService.spec.ts`, `DocumentSaveFlushController.spec.ts`, and
`IconWatcherController.spec.ts` cover queued transforms and lifecycle behavior.

## Stable protocol adaptations

The issue #12 port uses the same immutable BPMN source commit listed above.
Unlike the source router, EGN transport parsing validates direction and
required transport fields before queueing or dispatch. Display content is
deliberately left to `egon-core`'s atomic import so a malformed newer snapshot
can invalidate the older canvas without being discarded at the transport edge.
Outbound story validation remains strict and intentionally shallow: legacy icon metadata and
`dst`, or v4 icon metadata and `domainStory` metadata/business-object arrays,
must be present; icon maps must contain string SVG values. Additional document
fields pass through unchanged and `egon-core` remains authoritative for model
semantics.

The flush contracts retain numeric tokens, destructive/export flags, and the
four source statuses. Operational `flushed` replies require validated EGN
content and an acknowledged document revision. Production artifact tests load
the minified extension and webview outputs, proving routing uses wire literals
rather than preserved constructor/function names.

## Deliberate exclusions

No BPMN/DMN models, participant framework, public API, feature-specific routing,
deployment, or reference-repository source was copied.
`egon-core` remains the independent webview renderer.

## Issue #15: save-time flushing

The [pinned `DocumentFlushService.ts`](https://github.com/Miragon/bpmn-modeler/blob/08ea2c32ac05fdaeaab251229e56c5c0b2ae586b/libs/modeler-core/src/shared/service/DocumentFlushService.ts), [shared responder](https://github.com/Miragon/bpmn-modeler/blob/08ea2c32ac05fdaeaab251229e56c5c0b2ae586b/libs/shared/src/lib/documentFlush.ts), and [save participant](https://github.com/Miragon/bpmn-modeler/blob/08ea2c32ac05fdaeaab251229e56c5c0b2ae586b/apps/vscode-plugin/src/modeler/editor-session/DocumentSaveFlushController.ts) supplied token correlation, request coalescing, interaction locks, and synchronous `waitUntil` participation. EGN uses narrow session/transport ports and one URI-wide queue across panels. The host requests all current sessions concurrently under one 500 ms deadline, drains already-posted writes, then verifies live session identities and the document snapshot. Source edits and accepted sibling writes continue to win through the existing revision checks.

The EGN responder compares a fresh, validated `EgonClient.export()` with the post-import or acknowledged baseline. It drains outstanding writes, submits changed exports through normal synchronization, and waits for the acknowledgment before reporting `flushed` with its revision. This keeps the normal path active if a flush reply is lost. Pending or intervening host displays prevent export. A destructive confirmed flush holds all participating canvases inert until the token-specific lease is released. Icon discovery runs before `withConfirmedFlush`; its callback queues a version-checked open-buffer transformation and releases the lease in `finally`.

Regression suites cover the host request service, responder, delayed `story.changed` export, queue draining, source updates, save registration, lease release, real-client Chromium flush, and minified artifact routing.

## Issue #13: document identity and synchronization

The [pinned `EditorSessionStore.ts`](https://github.com/Miragon/bpmn-modeler/blob/08ea2c32ac05fdaeaab251229e56c5c0b2ae586b/libs/modeler-core/src/shared/infrastructure/EditorSessionStore.ts) supplied the URI-keyed identity, exact-session currency checks, recoverable queues, host revision checks, and EOL-aware comparison patterns. EGN adapts them for several panels per document: `DomainStoryEditorService` owns one record, revision, host version, and write queue for each complete URI, while each panel has a monotonic opaque session ID. Writes keep their exact session and expected revision; matching host echoes are counted and suppressed; unrelated changes advance the shared revision and publish to all active panels. Document records remain until pending writes settle after a panel closes.

The EGN protocol adds required document revisions, per-session synchronization request IDs, and `applied`/`unchanged`/`stale`/`failed` results. The webview holds one outstanding write, queues its newest local snapshot, blocks export during a pending display, and reloads on conflicts. `VsCodeDocumentPort` uses full URIs, version and session checks, full-document ranges, EOL-aware verification, and writable-provider/permission checks. Icon reconciliation uses this same port for undoable buffer edits.

Regression coverage: `DomainStoryEditorService.spec.ts` (shared panels, echo guards, failure recovery, stale queues, close/reopen, duplicate events, distinct URIs, sibling failure), `VsCodeDocumentPort.spec.ts` (full range, read-only and writable provider behavior, stale version, rejected and incomplete edits), `WebviewController.spec.ts` (early tracking, shared events, spoofing, read-only initialization), `modeler-shared/src/index.spec.ts` (revision and request validation), `egn-webview/src/lifecycle.spec.ts` (acknowledgment correlation, pending edits, delayed creation and display), and `test/artifacts/protocol-artifacts.cjs` (built host and webview protocol).

## Issue #14: webview lifecycle and recovery

The reference `libs/modeler-types/src/asyncDebounce.ts` and its overlapping-run,
cancel, flush, and serialization regressions were ported to
`@egon/modeler-types`. EGN uses one serialized operation queue for imports,
exports, and repair acceptance, plus the reference 100 ms inbound debounce.
The BPMN bootstrap session-closure pattern became an explicit, idempotently
disposable `bootstrap()` handle; EGN separates it into transport, lifecycle,
synchronization, viewport-state, and public-EgonClient adapter modules.

The reference viewport manager's validate/defer/persist/hidden-flush behavior is
adapted to EgonClient's public `getViewport()` and `setViewport()` methods. EGN
has no process planes, selection, or properties panel, and deliberately keeps
EgonClient's default viewport when no valid state exists instead of fitting the
story. Reimports capture and restore the current viewport.

EGN-specific additions are correlated initialization/import/repair issues,
actionable VS Code notifications, explicit repair acceptance through normal
revision-checked synchronization, and an inert-but-preserved canvas during
failure or review. `lifecycle.spec.ts`, `viewportState.spec.ts`, the shared
protocol suite, `WebviewController.spec.ts`, and the Chromium real-client suite
cover immediate replies, delayed creation/disposal, newest-snapshot convergence,
malformed recovery, repair decisions, state normalization, and resource cleanup.
The standalone preview uses the same empty-story factory, protocol decisions,
and session-storage state rather than carrying a duplicated legacy fixture.

The exception-safe creation prerequisite was implemented in
[`egon-core` #164](https://github.com/Miragon/egon-core/pull/164) and is pinned
here through the immutable
[`v0.3.1` release archive](https://github.com/Miragon/egon-core/releases/tag/v0.3.1).
The Chromium suite exercises that published client and its public lifecycle,
viewport, event, and destruction APIs.
