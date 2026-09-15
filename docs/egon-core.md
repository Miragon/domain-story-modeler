# egon-core

The diagram editor is consumed as the pinned `egon-core` package rather than
maintained in this repository. The webview imports its public `EgonClient` API
and bundled stylesheet while continuing to supply the `diagram-js-minimap`
integration.

For the client API, file-format behavior, architecture, and upstream development
instructions, see the [`egon-core` repository](https://github.com/Miragon/egon-core)
and its [client documentation](https://github.com/Miragon/egon-core/blob/v0.2.0/docs/Client.md).

This repository pins the built v0.2.0 release archive explicitly in
`apps/dst-webview/package.json`. Upgrade that URL and the lockfile together.
