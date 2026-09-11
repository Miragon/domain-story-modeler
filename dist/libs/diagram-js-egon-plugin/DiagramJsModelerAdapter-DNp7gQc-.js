import s from "diagram-js";
import { E as o } from "./index-CJeCCeD3.js";
const r = 100;
class d {
  constructor(e, t, i, a = []) {
    this.callbackRegistry = /* @__PURE__ */ new Map(), this.initializeContainer(e), this.diagram = new s({
      container: e,
      width: t,
      height: i,
      modules: [o, ...a]
    }), this.eventBus = this.diagram.get("eventBus"), this.canvas = this.diagram.get("canvas"), this.initializeRootElement();
  }
  import(e) {
    this.diagram.get(
      "domainStoryImportService"
    ).import(JSON.stringify(e));
  }
  export() {
    const e = this.diagram.get(
      "domainStoryExportService"
    );
    return JSON.parse(e.export());
  }
  getViewport() {
    return this.canvas.viewbox();
  }
  setViewport(e) {
    this.canvas.viewbox(e);
  }
  onStoryChanged(e) {
    const t = (i) => this.createDebouncedCallback(() => e())(i);
    this.callbackRegistry.set(e, t), this.eventBus.on("commandStack.changed", t);
  }
  onViewportChanged(e) {
    const t = this.createDebouncedCallback(
      (i) => e(i.viewbox)
    );
    this.callbackRegistry.set(e, t), this.eventBus.on("canvas.viewbox.changed", t);
  }
  offStoryChanged(e) {
    const t = this.callbackRegistry.get(e);
    t && (this.eventBus.off("commandStack.changed", t), this.callbackRegistry.delete(e));
  }
  offViewportChanged(e) {
    const t = this.callbackRegistry.get(e);
    t && (this.eventBus.off("canvas.viewbox.changed", t), this.callbackRegistry.delete(e));
  }
  destroy() {
    this.callbackRegistry.clear(), this.diagram.destroy();
  }
  /** Expose diagram instance for IconAdapter to access services */
  getDiagram() {
    return this.diagram;
  }
  initializeContainer(e) {
    if (!e.querySelector("#iconsCss")) {
      const t = document.createElement("style");
      t.id = "iconsCss", e.appendChild(t);
    }
  }
  initializeRootElement() {
    const t = this.diagram.get("elementFactory").createRoot();
    this.canvas.setRootElement(t);
  }
  createDebouncedCallback(e) {
    let t = null;
    return (i) => {
      t && clearTimeout(t), t = setTimeout(() => e(i), r);
    };
  }
}
export {
  d as DiagramJsModelerAdapter
};
