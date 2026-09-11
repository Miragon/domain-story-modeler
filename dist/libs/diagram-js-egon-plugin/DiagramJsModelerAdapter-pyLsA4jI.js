import Diagram from "diagram-js";
import { E as EgonPlugin } from "./index-CwSJfhbD.js";
const DEFAULT_DEBOUNCE_MS = 100;
class DiagramJsModelerAdapter {
  constructor(container, width, height, additionalModules = []) {
    this.callbackRegistry = /* @__PURE__ */ new Map();
    this.initializeContainer(container);
    this.diagram = new Diagram({
      container,
      width,
      height,
      modules: [EgonPlugin, ...additionalModules]
    });
    this.eventBus = this.diagram.get("eventBus");
    this.canvas = this.diagram.get("canvas");
    this.initializeRootElement();
  }
  import(document2) {
    const importService = this.diagram.get(
      "domainStoryImportService"
    );
    importService.import(JSON.stringify(document2));
  }
  export() {
    const exportService = this.diagram.get(
      "domainStoryExportService"
    );
    return JSON.parse(exportService.export());
  }
  getViewport() {
    return this.canvas.viewbox();
  }
  setViewport(viewport) {
    this.canvas.viewbox(viewport);
  }
  onStoryChanged(callback) {
    const wrapped = (event) => this.createDebouncedCallback(() => callback())(event);
    this.callbackRegistry.set(callback, wrapped);
    this.eventBus.on("commandStack.changed", wrapped);
  }
  onViewportChanged(callback) {
    const wrapped = this.createDebouncedCallback(
      (event) => callback(event.viewbox)
    );
    this.callbackRegistry.set(callback, wrapped);
    this.eventBus.on("canvas.viewbox.changed", wrapped);
  }
  offStoryChanged(callback) {
    const wrapped = this.callbackRegistry.get(callback);
    if (wrapped) {
      this.eventBus.off("commandStack.changed", wrapped);
      this.callbackRegistry.delete(callback);
    }
  }
  offViewportChanged(callback) {
    const wrapped = this.callbackRegistry.get(callback);
    if (wrapped) {
      this.eventBus.off("canvas.viewbox.changed", wrapped);
      this.callbackRegistry.delete(callback);
    }
  }
  destroy() {
    this.callbackRegistry.clear();
    this.diagram.destroy();
  }
  /** Expose diagram instance for IconAdapter to access services */
  getDiagram() {
    return this.diagram;
  }
  initializeContainer(container) {
    if (!container.querySelector("#iconsCss")) {
      const style = document.createElement("style");
      style.id = "iconsCss";
      container.appendChild(style);
    }
  }
  initializeRootElement() {
    const elementFactory = this.diagram.get("elementFactory");
    const root = elementFactory.createRoot();
    this.canvas.setRootElement(root);
  }
  createDebouncedCallback(callback) {
    let timeoutId = null;
    return (event) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback(event), DEFAULT_DEBOUNCE_MS);
    };
  }
}
export {
  DiagramJsModelerAdapter
};
//# sourceMappingURL=DiagramJsModelerAdapter-pyLsA4jI.js.map
