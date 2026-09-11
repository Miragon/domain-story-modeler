import { a as ElementTypes, D as Dictionary } from "./index-CJtcfruv.js";
const DEFAULT_DEBOUNCE_MS = 100;
class DiagramJsIconAdapter {
  constructor(diagram) {
    this.callbackRegistry = /* @__PURE__ */ new Map();
    this.iconDictionaryService = diagram.get(
      "domainStoryIconDictionaryService"
    );
    this.iconSetImportExportService = diagram.get(
      "domainStoryIconSetImportExportService"
    );
    this.eventBus = diagram.get("eventBus");
  }
  loadIcons(icons) {
    const iconSetConfig = this.iconSetImportExportService.createIconSetConfiguration(
      {
        actors: icons.actors ?? {},
        workObjects: icons.workObjects ?? {}
      }
    );
    this.iconSetImportExportService.loadConfiguration(iconSetConfig);
    this.fireIconsChangedEvent();
  }
  addIcon(category, name, svg) {
    const elementType = this.toElementType(category);
    this.iconDictionaryService.addIMGToIconDictionary(svg, name);
    this.iconDictionaryService.registerIconForType(elementType, name, svg);
    this.addIconToCss(name, svg);
    this.fireIconsChangedEvent();
  }
  removeIcon(category, name) {
    const elementType = this.toElementType(category);
    this.iconDictionaryService.unregisterIconForType(elementType, name);
    this.fireIconsChangedEvent();
  }
  getIcons() {
    const config = this.iconSetImportExportService.getCurrentConfigurationForExport();
    return {
      actors: (config == null ? void 0 : config.actors) ?? {},
      workObjects: (config == null ? void 0 : config.workObjects) ?? {}
    };
  }
  hasIcon(category, name) {
    const icons = this.getIcons();
    const iconMap = category === "actor" ? icons.actors : icons.workObjects;
    return name in iconMap;
  }
  onIconsChanged(callback) {
    const wrapped = this.createDebouncedCallback(() => callback(this.getIcons()));
    this.callbackRegistry.set(callback, wrapped);
    this.eventBus.on("dst.config.changed", wrapped);
  }
  offIconsChanged(callback) {
    const wrapped = this.callbackRegistry.get(callback);
    if (wrapped) {
      this.eventBus.off("dst.config.changed", wrapped);
      this.callbackRegistry.delete(callback);
    }
  }
  toElementType(category) {
    return category === "actor" ? ElementTypes.ACTOR : ElementTypes.WORKOBJECT;
  }
  addIconToCss(name, svg) {
    const dict = new Dictionary();
    dict.add(svg, name);
    this.iconDictionaryService.addIconsToCss(dict);
  }
  fireIconsChangedEvent() {
    this.eventBus.fire("dst.config.changed", { iconSet: this.getIcons() });
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
  DiagramJsIconAdapter
};
//# sourceMappingURL=DiagramJsIconAdapter-Cx0MVnq9.js.map
