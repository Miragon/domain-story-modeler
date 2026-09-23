# `@egon/modeler-core`

Host-independent Domain Story Modeler behavior. The package is split by feature
(`shared`, `story`, and `icons`) and uses `domain`, `service`, and
`infrastructure` folders only where those layers exist.

Host capabilities are expressed as `DocumentPort` and `ViewPort`. Their VS Code
implementations live in `apps/vscode-plugin`; this package must never import or
export a VS Code adapter. Consumers import only from `@egon/modeler-core`, not
from deep source paths.

`egon-core` is a separate upstream renderer used by the webview and is not part
of this workspace.
