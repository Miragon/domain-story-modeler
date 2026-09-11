import { a as c, D as i } from "./index-CJeCCeD3.js";
const s = 100;
class h {
  constructor(t) {
    this.callbackRegistry = /* @__PURE__ */ new Map(), this.iconDictionaryService = t.get(
      "domainStoryIconDictionaryService"
    ), this.iconSetImportExportService = t.get(
      "domainStoryIconSetImportExportService"
    ), this.eventBus = t.get("eventBus");
  }
  loadIcons(t) {
    const e = this.iconSetImportExportService.createIconSetConfiguration(
      {
        actors: t.actors ?? {},
        workObjects: t.workObjects ?? {}
      }
    );
    this.iconSetImportExportService.loadConfiguration(e), this.fireIconsChangedEvent();
  }
  addIcon(t, e, o) {
    const n = this.toElementType(t);
    this.iconDictionaryService.addIMGToIconDictionary(o, e), this.iconDictionaryService.registerIconForType(n, e, o), this.addIconToCss(e, o), this.fireIconsChangedEvent();
  }
  removeIcon(t, e) {
    const o = this.toElementType(t);
    this.iconDictionaryService.unregisterIconForType(o, e), this.fireIconsChangedEvent();
  }
  getIcons() {
    const t = this.iconSetImportExportService.getCurrentConfigurationForExport();
    return {
      actors: (t == null ? void 0 : t.actors) ?? {},
      workObjects: (t == null ? void 0 : t.workObjects) ?? {}
    };
  }
  hasIcon(t, e) {
    const o = this.getIcons(), n = t === "actor" ? o.actors : o.workObjects;
    return e in n;
  }
  onIconsChanged(t) {
    const e = this.createDebouncedCallback(() => t(this.getIcons()));
    this.callbackRegistry.set(t, e), this.eventBus.on("dst.config.changed", e);
  }
  offIconsChanged(t) {
    const e = this.callbackRegistry.get(t);
    e && (this.eventBus.off("dst.config.changed", e), this.callbackRegistry.delete(t));
  }
  toElementType(t) {
    return t === "actor" ? c.ACTOR : c.WORKOBJECT;
  }
  addIconToCss(t, e) {
    const o = new i();
    o.add(e, t), this.iconDictionaryService.addIconsToCss(o);
  }
  fireIconsChangedEvent() {
    this.eventBus.fire("dst.config.changed", { iconSet: this.getIcons() });
  }
  createDebouncedCallback(t) {
    let e = null;
    return (o) => {
      e && clearTimeout(e), e = setTimeout(() => t(o), s);
    };
  }
}
export {
  h as DiagramJsIconAdapter
};
