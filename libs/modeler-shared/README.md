# `@egon/modeler-shared`

Private, browser-safe contracts shared by the VS Code host and EGN webview.
This package must not acquire VS Code or renderer dependencies.

## Host protocol

Messages are plain discriminated objects with stable `type` literals. The
`WebviewToHostMessage` and `HostToWebviewMessage` unions prevent sending a
message in the wrong direction. `parseWebviewToHostMessage` and
`parseHostToWebviewMessage` are the transport boundaries: callers must pass
received values as `unknown` and dispatch only the returned value.

The active protocol covers initialization, display, synchronization, and
debug/error diagnostics. Flush request, release, and response contracts are
reserved for issue #15; this package validates them but does not implement a
flush workflow.

Synchronization and non-empty display payloads must contain a supported EGN
envelope. The validator accepts legacy `domain`/`dst` and v4
`iconSet`/`domainStory` documents, preserves their original text and extension
fields, and leaves business-object semantics to `egon-core`. Empty display text
is allowed for a new document.

## Host state bridge

`HostApiImpl` adapts the injected VS Code-compatible API and acquires it once.
`MockHostApi` gives standalone previews the same behavior: missing state throws
`MissingStateError`, `setState` replaces, and `updateState` shallow-merges.
`WebviewState` retains `editorId` and a concrete four-field viewport.
