import { injectable as u } from "tsyringe";
import { Uri as h, workspace as p, WorkspaceEdit as y, Range as f } from "vscode";
class z {
  /**
   * Creates a new editor session.
   *
   * @param id - Unique identifier for this editor session
   * @param content - Initial content of the editor
   */
  constructor(t, e) {
    this.id = t, this.content = e;
  }
  /**
   * Returns the current content snapshot.
   *
   * @returns Current content of the editor
   */
  snapshot() {
    return this.content;
  }
  /**
   * Applies a local change to the content.
   *
   * This is called when the user directly edits the text document in VS Code.
   *
   * @param text - New content from the text editor
   * @returns Domain event indicating the content was updated locally
   */
  applyLocalChange(t) {
    return this.content = t, {
      type: "ContentUpdated",
      origin: "local",
      text: t
    };
  }
  /**
   * Applies a remote sync to the content.
   *
   * This is called when the webview sends updated content back to the document.
   *
   * @param text - New content from the webview
   * @returns Domain event indicating the content was synced remotely
   */
  applyRemoteSync(t) {
    return this.content = t, {
      type: "ContentUpdated",
      origin: "remote",
      text: t
    };
  }
}
class c {
  constructor(t) {
    this.value = t;
  }
  static fromFileName(t) {
    var o;
    const n = (o = (t.split("/").pop() ?? "").split(".")[0]) == null ? void 0 : o.trim();
    return n ? new c(n) : null;
  }
  static fromString(t) {
    const e = t.trim();
    return e ? new c(e) : null;
  }
}
var i = /* @__PURE__ */ ((s) => (s.Actor = "actors", s.WorkObject = "work-objects", s))(i || {});
const w = ".egon/icons", C = `${w}/actors`, M = `${w}/work-objects`;
function A(s) {
  const t = s.replace(/\\/g, "/");
  let e;
  if (t.includes(`/${C}/`))
    e = i.Actor;
  else if (t.includes(`/${M}/`))
    e = i.WorkObject;
  else
    return null;
  const n = c.fromFileName(t);
  return n ? { type: e, name: n } : null;
}
const H = {
  Person: '<svg viewBox="0 0 24 26" xmlns="http://www.w3.org/2000/svg"><path d="M12 5.9c1.16 0 2.1.94 2.1 2.1s-.94 2.1-2.1 2.1S9.9 9.16 9.9 8s.94-2.1 2.1-2.1m0 9c2.97 0 6.1 1.46 6.1 2.1v1.1H5.9V17c0-.64 3.13-2.1 6.1-2.1M12 4C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 9c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
  Group: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="48" viewBox="0 0 24 26"><path d="M0 0h24v24H0z" fill="none"/><path d="M16.5 13c-1.2 0-3.07.34-4.5 1-1.43-.67-3.3-1-4.5-1C5.33 13 1 14.08 1 16.25V19h22v-2.75c0-2.17-4.33-3.25-6.5-3.25zm-4 4.5h-10v-1.25c0-.54 2.56-1.75 5-1.75s5 1.21 5 1.75v1.25zm9 0H14v-1.25c0-.46-.2-.86-.52-1.22.88-.3 1.96-.53 3.02-.53 2.44 0 5 1.21 5 1.75v1.25zM7.5 12c1.93 0 3.5-1.57 3.5-3.5S9.43 5 7.5 5 4 6.57 4 8.5 5.57 12 7.5 12zm0-5.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 5.5c1.93 0 3.5-1.57 3.5-3.5S18.43 5 16.5 5 13 6.57 13 8.5s1.57 3.5 3.5 3.5zm0-5.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/></svg>',
  System: '<svg viewBox="0 0 24 26" xmlns="http://www.w3.org/2000/svg"><path d="M20,18c1.1,0,2-0.9,2-2V6c0-1.1-0.9-2-2-2H4C2.9,4,2,4.9,2,6v10c0,1.1,0.9,2,2,2H0v2h24v-2H20z M4,6h16v10H4V6z"/></svg>'
}, S = {
  Document: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 26"><path fill="none" d="M0 0h24v24H0V0z"/><path d="M8 16h8v2H8zm0-4h8v2H8zm6-10H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>',
  Folder: '<svg viewBox="0 0 24 26" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0,0h24v24H0V0z"/><path d="M9.17,6l2,2H20v10L4,18V6H9.17 M10,4H4C2.9,4,2.01,4.9,2.01,6L2,18c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V8c0-1.1-0.9-2-2-2 h-8L10,4L10,4z"/></svg>',
  Call: '<svg viewBox="0 0 24 26" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0,0h24v24H0V0z"/><path d="M6.54,5C6.6,5.89,6.75,6.76,6.99,7.59l-1.2,1.2C5.38,7.59,5.12,6.32,5.03,5H6.54 M16.4,17.02c0.85,0.24,1.72,0.39,2.6,0.45 v1.49c-1.32-0.09-2.59-0.35-3.8-0.75L16.4,17.02 M7.5,3H4C3.45,3,3,3.45,3,4c0,9.39,7.61,17,17,17c0.55,0,1-0.45,1-1v-3.49	c0-0.55-0.45-1-1-1c-1.24,0-2.45-0.2-3.57-0.57c-0.1-0.04-0.21-0.05-0.31-0.05c-0.26,0-0.51,0.1-0.71,0.29l-2.2,2.2 c-2.83-1.45-5.15-3.76-6.59-6.59l2.2-2.2C9.1,8.31,9.18,7.92,9.07,7.57C8.7,6.45,8.5,5.25,8.5,4C8.5,3.45,8.05,3,7.5,3L7.5,3z"/></svg>',
  Email: '<svg viewBox="0 0 24 26" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0,0h24v24H0V0z"/><path fill-opacity="0.9" d="M12,1.95c-5.52,0-10,4.48-10,10s4.48,10,10,10h5v-2h-5c-4.34,0-8-3.66-8-8s3.66-8,8-8s8,3.66,8,8v1.43 c0,0.79-0.71,1.57-1.5,1.57S17,14.17,17,13.38v-1.43c0-2.76-2.24-5-5-5s-5,2.24-5,5s2.24,5,5,5c1.38,0,2.64-0.56,3.54-1.47 c0.65,0.89,1.77,1.47,2.96,1.47c1.97,0,3.5-1.6,3.5-3.57v-1.43C22,6.43,17.52,1.95,12,1.95z M12,14.95c-1.66,0-3-1.34-3-3 s1.34-3,3-3s3,1.34,3,3S13.66,14.95,12,14.95z"/></svg>',
  Conversation: '<svg height="48" viewBox="0 0 24 26" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>',
  Info: '<svg height="48" viewBox="0 0 24 26" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/></svg>'
};
function O() {
  return {
    domain: {
      name: "default",
      actors: { ...H },
      workObjects: { ...S }
    },
    dst: [{ info: "" }, { version: "3.0.0" }]
  };
}
function d(s) {
  return !s || s.trim() === "" ? O() : JSON.parse(s);
}
function g(s) {
  return JSON.stringify(s, null, 2);
}
class m {
  constructor(t) {
    this.doc = t;
  }
  addOrUpdate(t) {
    const e = this.getMap(t.type);
    e[t.name.value] = t.svg;
  }
  delete(t, e) {
    const n = this.getMap(t);
    delete n[e.value];
  }
  applyChange(t) {
    switch (t.kind) {
      case "create":
      case "update":
        if (!t.svg) return;
        this.addOrUpdate({
          type: t.type,
          name: t.name,
          svg: t.svg
        });
        break;
      case "delete":
        this.delete(t.type, t.name);
        break;
    }
  }
  snapshot() {
    return this.doc;
  }
  getMap(t) {
    return t === i.Actor ? this.doc.domain.actors : this.doc.domain.workObjects;
  }
}
var x = Object.getOwnPropertyDescriptor, V = (s, t, e, n) => {
  for (var o = n > 1 ? void 0 : n ? x(t, e) : t, r = s.length - 1, l; r >= 0; r--)
    (l = s[r]) && (o = l(o) || o);
  return o;
};
let v = class {
  /**
   * Creates a new domain story editor service.
   *
   * @param docs - Port for document I/O operations
   */
  constructor(s) {
    this.docs = s, this.sessions = /* @__PURE__ */ new Map();
  }
  /**
   * Registers a new editor session.
   *
   * This should be called when a new editor is opened. If a session with the
   * same ID already exists, a new session is generated to avoid conflicts
   * with existing sessions.
   *
   * @param documentId - Unique identifier for the document (typically file path)
   * @param initialText - Initial content of the editor
   * @param view - View port for displaying content to the webview
   * @returns Unique identifier for the registered editor session
   *
   * @example
   * ```typescript
   * const documentId = document.uri.path;
   * const view = new VsCodeViewPort(webviewPanel);
   * const sessionId = service.registerSession(documentId, document.getText(), view);
   * ```
   */
  registerSession(s, t, e) {
    let n = 1, o = s + `:${n}`;
    for (; this.sessions.has(o); )
      n++, o = s + `:${n}`;
    return this.sessions.set(o, {
      guard: 0,
      session: new z(s, t),
      view: e
    }), o;
  }
  /**
   * Initializes the webview with the current editor content.
   *
   * This is typically called when the webview sends an initialization message
   * indicating it's ready to receive content.
   *
   * @param sessionId - Unique identifier for the editor session
   *
   * @example
   * ```typescript
   * webview.onDidReceiveMessage(async (cmd) => {
   *     if (cmd.TYPE === 'InitializeWebview') {
   *         await service.initialize(sessionId);
   *     }
   * });
   * ```
   */
  async initialize(s) {
    const t = this.get(s);
    t && await t.view.display(s, t.session.snapshot());
  }
  /**
   * Syncs content from the webview to the document.
   *
   * This is called when the webview sends updated content back to VS Code.
   * The method uses a guard mechanism to prevent echo loops - while this sync
   * is in progress, any document change events will be ignored.
   *
   * **Echo Prevention Flow:**
   * 1. Guard counter increments
   * 2. Document is updated (triggers onDidChangeTextDocument)
   * 3. onDocumentChanged sees guard > 0 and skips update
   * 4. Guard counter decrements
   *
   * @param sessionId - Unique identifier for the editor session
   * @param text - Updated content from the webview
   *
   * @example
   * ```typescript
   * webview.onDidReceiveMessage(async (cmd) => {
   *     if (cmd.TYPE === 'SyncDocument') {
   *         await service.syncFromWebview(cmd.sessionId, cmd.text);
   *     }
   * });
   * ```
   */
  async syncFromWebview(s, t) {
    const e = this.get(s);
    e && (e.guard++, e.session.applyRemoteSync(t), await this.docs.write(this.getDocumentIdFromSessionId(s), t), e.guard--);
  }
  /**
   * Handles document content changes from the text editor.
   *
   * This is called when the user edits the text document directly in VS Code.
   * If the guard is active (indicating a sync operation is in progress), this
   * method does nothing to prevent echo loops.
   *
   * **Echo Prevention:**
   * - If guard > 0: Change came from syncFromWebview, ignore it
   * - If guard = 0: Change came from user, update the webview
   *
   * @param sessionId - Unique identifier for the editor session
   * @param text - Updated content from the text editor
   *
   * @example
   * ```typescript
   * workspace.onDidChangeTextDocument(async (event) => {
   *     if (event.document.uri.path === document.uri.path && event.contentChanges.length > 0) {
   *         await service.onDocumentChanged(sessionId, event.document.getText());
   *     }
   * });
   * ```
   */
  async onDocumentChanged(s, t) {
    const e = this.get(s);
    !e || e.guard > 0 || (e.session.applyLocalChange(t), await e.view.display(s, t));
  }
  /**
   * Disposes of an editor session and cleans up resources.
   *
   * This should be called when the editor/webview is closed to prevent memory leaks.
   *
   * @param sessionId - Unique identifier for the editor session to dispose
   *
   * @example
   * ```typescript
   * webviewPanel.onDidDispose(() => {
   *     service.dispose(sessionId);
   * });
   * ```
   */
  dispose(s) {
    this.sessions.delete(s);
  }
  /**
   * Retrieves session state for a given id.
   * @param sessionId - Editor session identifier
   * @returns Session state if registered, undefined otherwise
   * @internal
   */
  get(s) {
    return this.sessions.get(s);
  }
  getDocumentIdFromSessionId(s) {
    return s.split(":")[0];
  }
};
v = V([
  u()
], v);
class B {
  execute(t, e) {
    const n = d(t), o = new m(n);
    return o.applyChange(e), g(o.snapshot());
  }
}
class P {
  execute(t, e) {
    const n = d(t), o = new m(n);
    for (const r of e)
      o.addOrUpdate(r);
    return g(o.snapshot());
  }
}
class D {
  /**
   * Reads the content of a VS Code document.
   *
   * @param documentId - File path of the document to read
   * @returns Promise resolving to the document's text content
   * @throws Error if the document cannot be opened
   */
  async read(t) {
    const e = h.file(t);
    return (await p.openTextDocument(e)).getText();
  }
  /**
   * Writes content to a VS Code document.
   *
   * This method replaces the entire document content (lines 0-9999) with the
   * provided text. The operation is performed through a WorkspaceEdit to ensure
   * proper integration with VS Code's undo/redo stack.
   *
   * @param documentId - File path of the document to write
   * @param text - Content to write to the document
   * @returns Promise that resolves when the write operation completes
   * @throws Error if the edit cannot be applied
   */
  async write(t, e) {
    const n = h.file(t), o = new y();
    o.replace(n, new f(0, 0, 9999, 0), e), await p.applyEdit(o);
  }
}
class a {
  constructor(t, e) {
    this.sessionId = t, this.text = e, this.TYPE = a.name;
  }
}
class _ {
  /**
   * Creates a new VS Code view port.
   *
   * @param panel - The webview panel to send messages to
   */
  constructor(t) {
    this.panel = t;
  }
  /**
   * Displays content in the webview by posting a message.
   *
   * Creates a `DisplayDomainStoryCommand` and sends it to the webview via
   * `postMessage`. The webview is expected to handle this command and update
   * its display accordingly.
   *
   * @param sessionId - Unique identifier for the editor session
   * @param text - Content to display in the webview
   * @returns Promise that resolves when the message is posted
   * @throws Error if the webview is disposed or the message cannot be sent
   */
  async display(t, e) {
    const n = new a(t, e);
    await this.panel.webview.postMessage(n);
  }
}
export {
  C as ACTOR_ICON_PATH,
  B as ApplyIconChange,
  v as DomainStoryEditorService,
  z as EditorSession,
  w as ICON_BASE_PATH,
  c as IconName,
  i as IconType,
  m as StoryIcons,
  P as SyncIconsFromSet,
  D as VsCodeDocumentPort,
  _ as VsCodeViewPort,
  M as WORK_OBJECT_ICON_PATH,
  O as createEmptyStory,
  d as parseStoryOrEmpty,
  g as serializeStory,
  A as tryParseIconPath
};
