import { describe, expect, it, vi } from "vitest";
import minimapModule from "diagram-js-minimap";
import { EgonClient } from "egon-core";
import { createEmptyStory } from "@egon/modeler-types";

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
