import { describe, expect, it, vi } from "vitest";
import minimapModule from "diagram-js-minimap";
import { EgonClient } from "egon-core";
import { createEmptyStory } from "@egon/modeler-types";
import { bootstrap } from "./lifecycle";
import { WebviewHost } from "./communication";

function container(): HTMLDivElement {
  const element = document.createElement("div");
  Object.assign(element.style, {
    width: "800px",
    height: "600px",
    position: "relative",
  });
  document.body.appendChild(element);
  return element;
}

describe("real EgonClient lifecycle", () => {
  it("flushes a committed icon edit through the real client before an event is needed", async () => {
    document.body.innerHTML = '<div id="egon-io-container" style="width:800px;height:600px"></div>';
    let client: EgonClient | undefined;
    let state: unknown;
    const posted: unknown[] = [];
    const host: WebviewHost = {
      getState: () => state as never,
      setState: (next) => { state = next; },
      updateState: (patch) => { state = { ...(state as object), ...patch }; },
      postMessage: (message) => {
        posted.push(message);
        if (message.type === "InitializeWebviewCommand") {
          window.dispatchEvent(new MessageEvent("message", { data: {
            type: "DisplayDomainStoryCommand", sessionId: "real", text: JSON.stringify(createEmptyStory()), documentRevision: 0,
          } }));
        }
        if (message.type === "SyncDocumentCommand") {
          window.dispatchEvent(new MessageEvent("message", { data: {
            type: "SyncDocumentResultCommand", sessionId: "real", requestId: message.requestId,
            documentRevision: 1, status: "applied",
          } }));
        }
      },
    };
    const session = bootstrap(host, async (element) => {
      client = await EgonClient.create({ container: element, colorPicker: false }, [minimapModule]);
      return client;
    }, { debounceMs: 0 });
    try {
      await vi.waitFor(() => expect(client).toBeDefined());
      await vi.waitFor(() => expect(client?.export().domainStory.version).toBe("4.0.0"));
      client?.addIcon("actor", "Saved Actor", '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="5" r="5"/></svg>');
      window.dispatchEvent(new MessageEvent("message", { data: {
        type: "FlushDocumentQuery", token: 8, destructive: false, exportWhenClean: false,
      } }));
      await vi.waitFor(() => expect(posted).toContainEqual(expect.objectContaining({
        type: "DocumentFlushedCommand", token: 8, status: "flushed", documentRevision: 1,
      })));
      const reply = posted.find((message): message is { type: string; content: string } =>
        typeof message === "object" && message !== null && "type" in message && message.type === "DocumentFlushedCommand")!;
      expect(JSON.parse(reply.content).iconSet.actors).toHaveProperty("Saved Actor");
    } finally {
      session.dispose();
      document.body.innerHTML = "";
    }
  });

  it("cleans a rejected creation and permits a clean subsequent creation", async () => {
    const element = container();
    const failingModule = {
      __init__: ["creationFailure"],
      creationFailure: [
        "factory",
        () => {
          throw new Error("injected creation failure");
        },
      ],
    };

    await expect(
      EgonClient.create({ container: element, colorPicker: false }, [
        minimapModule,
        failingModule as never,
      ]),
    ).rejects.toThrow("injected creation failure");
    expect(element.querySelectorAll(".djs-container")).toHaveLength(0);
    expect(element.querySelectorAll("[data-egon-icons-css]")).toHaveLength(0);

    const client = await EgonClient.create(
      { container: element, colorPicker: false },
      [minimapModule],
    );
    client.import(createEmptyStory());
    expect(client.export().domainStory.version).toBe("4.0.0");
    client.destroy();
    expect(element.querySelectorAll(".djs-container")).toHaveLength(0);
    element.remove();
  });

  it("balances DOM and subscriptions across idempotent destruction", async () => {
    const element = container();
    const client = await EgonClient.create(
      { container: element, colorPicker: false },
      [minimapModule],
    );
    const changed = vi.fn();
    client.on("story.changed", changed);
    client.import(createEmptyStory());
    changed.mockClear();

    client.destroy();
    client.destroy();
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(changed).not.toHaveBeenCalled();
    expect(element.children).toHaveLength(0);
    element.remove();
  });
});
