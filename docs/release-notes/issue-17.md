# Architecture and editor validation

The extension now checks its workspace boundaries and strict webview types in
CI. Releases are packaged with a pinned local VSIX tool, and the packaged
extension runs end-to-end scenarios in a real VS Code Extension Host.

Custom icon synchronization changes open story buffers. Those changes appear
in undo history and can be saved with the document. Closed story files remain
untouched. Legacy stories can still be imported and saved as EGN v4 documents.
