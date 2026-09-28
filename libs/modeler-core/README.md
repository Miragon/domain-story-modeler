# `@egon/modeler-core`

Host-independent Domain Story Modeler behavior. The package is split by feature
(`shared`, `story`, and `icons`) and uses `domain`, `service`, and
`infrastructure` folders only where those layers exist.

Host capabilities are expressed as narrow editor, workspace, discovery,
file-I/O, logging, and notification ports. Their VS Code implementations live
in `apps/vscode-plugin`; this package must never import or export a VS Code
adapter. Consumers import only from `@egon/modeler-core`, not from deep source
paths.

Construction is explicit. `DomainStoryEditorService` and `IconService` receive
ports in their constructors, while registration and resource ownership remain
in the extension composition root.

`egon-core` is a separate upstream renderer used by the webview and is not part
of this workspace.
