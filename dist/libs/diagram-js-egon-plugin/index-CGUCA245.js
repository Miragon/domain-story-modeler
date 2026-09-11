var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s;
import { isArray as isArray$1, forEach, isFunction, assign, bind, isNumber, find, filter, isUndefined, isObject, groupBy, has, flatten, size, matchPattern, every, sortBy, debounce, reduce, uniqueBy, isDefined, some, map, omit, pick, values, isNil } from "min-dash";
import { event, classes, closest, queryAll, query, delegate, assignStyle, domify, matches, clear as clear$1, attr as attr$1, remove as remove$2 } from "min-dom";
import { create as create$1, attr, remove as remove$1, append, clear, classes as classes$1, clone as clone$1, createTransform, transform as transform$1 } from "tiny-svg";
import minimapModule from "diagram-js-minimap";
import { BehaviorSubject } from "rxjs";
import Ids$1 from "ids";
import DirectEditingModule from "diagram-js-direct-editing";
class EgonClient {
  constructor(modelerPort, iconPort, viewport) {
    this.modelerPort = modelerPort;
    this.iconPort = iconPort;
    if (viewport) {
      this.setViewport(viewport);
    }
  }
  /**
   * Creates a new EgonClient instance.
   *
   * @param config - Configuration options for the client
   * @param additionalModules - Optional array of additional diagram-js modules
   * @param ports - Optional port injection for testing (bypasses adapter creation)
   */
  static async create(config, additionalModules = [], ports) {
    if (ports) {
      return new EgonClient(ports.modelerPort, ports.iconPort, config.viewport);
    }
    const { DiagramJsModelerAdapter } = await import("./DiagramJsModelerAdapter-DSMKm8dl.js");
    const { DiagramJsIconAdapter } = await import("./DiagramJsIconAdapter-l9vQDpf3.js");
    const modelerAdapter = new DiagramJsModelerAdapter(
      config.container,
      config.width ?? "100%",
      config.height ?? "100%",
      additionalModules
    );
    const iconAdapter = new DiagramJsIconAdapter(modelerAdapter.getDiagram());
    return new EgonClient(modelerAdapter, iconAdapter, config.viewport);
  }
  // --- Document Operations ---
  /**
   * Import a domain story document into the diagram.
   * Icons from the document's domain section are automatically loaded.
   */
  import(document2) {
    this.modelerPort.import(document2);
  }
  /**
   * Export the current diagram state as a domain story document.
   */
  export() {
    return this.modelerPort.export();
  }
  // --- Event Subscription ---
  /**
   * Subscribe to an event.
   */
  on(event2, callback) {
    switch (event2) {
      case "story.changed":
        this.modelerPort.onStoryChanged(
          callback
        );
        break;
      case "viewport.changed":
        this.modelerPort.onViewportChanged(
          callback
        );
        break;
      case "icons.changed":
        this.iconPort.onIconsChanged(callback);
        break;
    }
  }
  /**
   * Unsubscribe from an event.
   */
  off(event2, callback) {
    switch (event2) {
      case "story.changed":
        this.modelerPort.offStoryChanged(
          callback
        );
        break;
      case "viewport.changed":
        this.modelerPort.offViewportChanged(
          callback
        );
        break;
      case "icons.changed":
        this.iconPort.offIconsChanged(callback);
        break;
    }
  }
  // --- Viewport Operations ---
  /**
   * Get the current viewport.
   */
  getViewport() {
    return this.modelerPort.getViewport();
  }
  /**
   * Set the viewport.
   */
  setViewport(viewport) {
    this.modelerPort.setViewport(viewport);
  }
  // --- Icon Management ---
  /**
   * Load a set of icons (actors and/or work objects).
   * Merges with existing icons; existing icons with the same name are overwritten.
   */
  loadIcons(icons) {
    this.iconPort.loadIcons(icons);
  }
  /**
   * Add a single icon.
   */
  addIcon(category, name, svg) {
    this.iconPort.addIcon(category, name, svg);
  }
  /**
   * Remove a single icon.
   */
  removeIcon(category, name) {
    this.iconPort.removeIcon(category, name);
  }
  /**
   * Get all currently registered icons.
   */
  getIcons() {
    return this.iconPort.getIcons();
  }
  /**
   * Check if a specific icon is registered.
   */
  hasIcon(category, name) {
    return this.iconPort.hasIcon(category, name);
  }
  // --- Lifecycle ---
  /**
   * Destroy the client and clean up resources.
   */
  destroy() {
    this.modelerPort.destroy();
  }
}
var NOT_REGISTERED_ERROR = "is not a registered action", IS_REGISTERED_ERROR = "is already registered";
function EditorActions(eventBus, injector) {
  this._actions = {};
  var self = this;
  eventBus.on("diagram.init", function() {
    self._registerDefaultActions(injector);
    eventBus.fire("editorActions.init", {
      editorActions: self
    });
  });
}
EditorActions.$inject = [
  "eventBus",
  "injector"
];
EditorActions.prototype._registerDefaultActions = function(injector) {
  var commandStack = injector.get("commandStack", false);
  var modeling = injector.get("modeling", false);
  var selection = injector.get("selection", false);
  var zoomScroll = injector.get("zoomScroll", false);
  var copyPaste = injector.get("copyPaste", false);
  var canvas = injector.get("canvas", false);
  var rules = injector.get("rules", false);
  var keyboardMove = injector.get("keyboardMove", false);
  var keyboardMoveSelection = injector.get("keyboardMoveSelection", false);
  if (commandStack) {
    this.register("undo", function() {
      commandStack.undo();
    });
    this.register("redo", function() {
      commandStack.redo();
    });
  }
  if (copyPaste && selection) {
    this.register("copy", function() {
      var selectedElements = selection.get();
      if (selectedElements.length) {
        return copyPaste.copy(selectedElements);
      }
    });
  }
  if (copyPaste) {
    this.register("paste", function() {
      copyPaste.paste();
    });
  }
  if (zoomScroll) {
    this.register("stepZoom", function(opts) {
      zoomScroll.stepZoom(opts.value);
    });
  }
  if (canvas) {
    this.register("zoom", function(opts) {
      canvas.zoom(opts.value);
    });
  }
  if (modeling && selection && rules) {
    this.register("removeSelection", function() {
      var selectedElements = selection.get();
      if (!selectedElements.length) {
        return;
      }
      var allowed = rules.allowed("elements.delete", { elements: selectedElements }), removableElements;
      if (allowed === false) {
        return;
      } else if (isArray$1(allowed)) {
        removableElements = allowed;
      } else {
        removableElements = selectedElements;
      }
      if (removableElements.length) {
        modeling.removeElements(removableElements.slice());
      }
    });
  }
  if (keyboardMove) {
    this.register("moveCanvas", function(opts) {
      keyboardMove.moveCanvas(opts);
    });
  }
  if (keyboardMoveSelection) {
    this.register("moveSelection", function(opts) {
      keyboardMoveSelection.moveSelection(opts.direction, opts.accelerated);
    });
  }
};
EditorActions.prototype.trigger = function(action, opts) {
  if (!this._actions[action]) {
    throw error(action, NOT_REGISTERED_ERROR);
  }
  return this._actions[action](opts);
};
EditorActions.prototype.register = function(actions, listener) {
  var self = this;
  if (typeof actions === "string") {
    return this._registerAction(actions, listener);
  }
  forEach(actions, function(listener2, action) {
    self._registerAction(action, listener2);
  });
};
EditorActions.prototype._registerAction = function(action, listener) {
  if (this.isRegistered(action)) {
    throw error(action, IS_REGISTERED_ERROR);
  }
  this._actions[action] = listener;
};
EditorActions.prototype.unregister = function(action) {
  if (!this.isRegistered(action)) {
    throw error(action, NOT_REGISTERED_ERROR);
  }
  this._actions[action] = void 0;
};
EditorActions.prototype.getActions = function() {
  return Object.keys(this._actions);
};
EditorActions.prototype.isRegistered = function(action) {
  return !!this._actions[action];
};
function error(action, message) {
  return new Error(action + " " + message);
}
const EditorActionsModule = {
  __init__: ["editorActions"],
  editorActions: ["type", EditorActions]
};
var KEYS_COPY = ["c", "C"];
var KEYS_PASTE = ["v", "V"];
var KEYS_REDO = ["y", "Y"];
var KEYS_UNDO = ["z", "Z"];
function hasModifier(event2) {
  return event2.ctrlKey || event2.metaKey || event2.shiftKey || event2.altKey;
}
function isCmd(event2) {
  if (event2.altKey) {
    return false;
  }
  return event2.ctrlKey || event2.metaKey;
}
function isKey(keys, event2) {
  keys = isArray$1(keys) ? keys : [keys];
  return keys.indexOf(event2.key) !== -1 || keys.indexOf(event2.code) !== -1;
}
function isShift(event2) {
  return event2.shiftKey;
}
function isCopy(event2) {
  return isCmd(event2) && isKey(KEYS_COPY, event2);
}
function isPaste(event2) {
  return isCmd(event2) && isKey(KEYS_PASTE, event2);
}
function isUndo(event2) {
  return isCmd(event2) && !isShift(event2) && isKey(KEYS_UNDO, event2);
}
function isRedo(event2) {
  return isCmd(event2) && (isKey(KEYS_REDO, event2) || isKey(KEYS_UNDO, event2) && isShift(event2));
}
var KEYDOWN_EVENT = "keyboard.keydown", KEYUP_EVENT = "keyboard.keyup";
var DEFAULT_PRIORITY$5 = 1e3;
var compatMessage = "Keyboard binding is now implicit; explicit binding to an element got removed. For more information, see https://github.com/bpmn-io/diagram-js/issues/661";
function Keyboard(config, eventBus) {
  var self = this;
  this._config = config = config || {};
  this._eventBus = eventBus;
  this._keydownHandler = this._keydownHandler.bind(this);
  this._keyupHandler = this._keyupHandler.bind(this);
  eventBus.on("diagram.destroy", function() {
    self._fire("destroy");
    self.unbind();
  });
  if (config.bindTo) {
    console.error("unsupported configuration <keyboard.bindTo>", new Error(compatMessage));
  }
  var bind2 = config && config.bind !== false;
  eventBus.on("canvas.init", function(event2) {
    self._target = event2.svg;
    if (bind2) {
      self.bind();
    }
    self._fire("init");
  });
}
Keyboard.$inject = [
  "config.keyboard",
  "eventBus"
];
Keyboard.prototype._keydownHandler = function(event2) {
  this._keyHandler(event2, KEYDOWN_EVENT);
};
Keyboard.prototype._keyupHandler = function(event2) {
  this._keyHandler(event2, KEYUP_EVENT);
};
Keyboard.prototype._keyHandler = function(event2, type) {
  var eventBusResult;
  if (this._isEventIgnored(event2)) {
    return;
  }
  var context = {
    keyEvent: event2
  };
  eventBusResult = this._eventBus.fire(type || KEYDOWN_EVENT, context);
  if (eventBusResult) {
    event2.preventDefault();
  }
};
Keyboard.prototype._isEventIgnored = function(event2) {
  return false;
};
Keyboard.prototype.bind = function(node) {
  if (node) {
    console.error("unsupported argument <node>", new Error(compatMessage));
  }
  this.unbind();
  node = this._node = this._target;
  event.bind(node, "keydown", this._keydownHandler);
  event.bind(node, "keyup", this._keyupHandler);
  this._fire("bind");
};
Keyboard.prototype.getBinding = function() {
  return this._node;
};
Keyboard.prototype.unbind = function() {
  var node = this._node;
  if (node) {
    this._fire("unbind");
    event.unbind(node, "keydown", this._keydownHandler);
    event.unbind(node, "keyup", this._keyupHandler);
  }
  this._node = null;
};
Keyboard.prototype._fire = function(event2) {
  this._eventBus.fire("keyboard." + event2, { node: this._node });
};
Keyboard.prototype.addListener = function(priority, listener, type) {
  if (isFunction(priority)) {
    type = listener;
    listener = priority;
    priority = DEFAULT_PRIORITY$5;
  }
  this._eventBus.on(type || KEYDOWN_EVENT, priority, listener);
};
Keyboard.prototype.removeListener = function(listener, type) {
  this._eventBus.off(type || KEYDOWN_EVENT, listener);
};
Keyboard.prototype.hasModifier = hasModifier;
Keyboard.prototype.isCmd = isCmd;
Keyboard.prototype.isShift = isShift;
Keyboard.prototype.isKey = isKey;
var LOW_PRIORITY$a = 500;
function KeyboardBindings(eventBus, keyboard) {
  var self = this;
  eventBus.on("editorActions.init", LOW_PRIORITY$a, function(event2) {
    var editorActions = event2.editorActions;
    self.registerBindings(keyboard, editorActions);
  });
}
KeyboardBindings.$inject = [
  "eventBus",
  "keyboard"
];
KeyboardBindings.prototype.registerBindings = function(keyboard, editorActions) {
  function addListener(action, fn) {
    if (editorActions.isRegistered(action)) {
      keyboard.addListener(fn);
    }
  }
  addListener("undo", function(context) {
    var event2 = context.keyEvent;
    if (isUndo(event2)) {
      editorActions.trigger("undo");
      return true;
    }
  });
  addListener("redo", function(context) {
    var event2 = context.keyEvent;
    if (isRedo(event2)) {
      editorActions.trigger("redo");
      return true;
    }
  });
  addListener("copy", function(context) {
    var event2 = context.keyEvent;
    if (isCopy(event2)) {
      editorActions.trigger("copy");
      return true;
    }
  });
  addListener("paste", function(context) {
    var event2 = context.keyEvent;
    if (isPaste(event2)) {
      editorActions.trigger("paste");
      return true;
    }
  });
  addListener("stepZoom", function(context) {
    var event2 = context.keyEvent;
    if (isKey(["+", "Add", "="], event2) && isCmd(event2)) {
      editorActions.trigger("stepZoom", { value: 1 });
      return true;
    }
  });
  addListener("stepZoom", function(context) {
    var event2 = context.keyEvent;
    if (isKey(["-", "Subtract"], event2) && isCmd(event2)) {
      editorActions.trigger("stepZoom", { value: -1 });
      return true;
    }
  });
  addListener("zoom", function(context) {
    var event2 = context.keyEvent;
    if (isKey("0", event2) && isCmd(event2)) {
      editorActions.trigger("zoom", { value: 1 });
      return true;
    }
  });
  addListener("removeSelection", function(context) {
    var event2 = context.keyEvent;
    if (isKey(["Backspace", "Delete", "Del"], event2)) {
      editorActions.trigger("removeSelection");
      return true;
    }
  });
};
const KeyboardBindingsModule = {
  __init__: ["keyboard", "keyboardBindings"],
  keyboard: ["type", Keyboard],
  keyboardBindings: ["type", KeyboardBindings]
};
var CURSOR_CLS_PATTERN = /^djs-cursor-.*$/;
function set(mode) {
  var classes$12 = classes(document.body);
  classes$12.removeMatching(CURSOR_CLS_PATTERN);
  if (mode) {
    classes$12.add("djs-cursor-" + mode);
  }
}
function unset() {
  set(null);
}
var TRAP_PRIORITY = 5e3;
function install(eventBus, eventName) {
  eventName = eventName || "element.click";
  function trap() {
    return false;
  }
  eventBus.once(eventName, TRAP_PRIORITY, trap);
  return function() {
    eventBus.off(eventName, trap);
  };
}
function center(bounds) {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2
  };
}
function delta(a2, b) {
  return {
    x: a2.x - b.x,
    y: a2.y - b.y
  };
}
function __stopPropagation(event2) {
  if (!event2 || typeof event2.stopPropagation !== "function") {
    return;
  }
  event2.stopPropagation();
}
function getOriginal$1(event2) {
  return event2.originalEvent || event2.srcEvent;
}
function stopPropagation(event2) {
  __stopPropagation(event2);
  __stopPropagation(getOriginal$1(event2));
}
function toPoint(event2) {
  if (event2.pointers && event2.pointers.length) {
    event2 = event2.pointers[0];
  }
  if (event2.touches && event2.touches.length) {
    event2 = event2.touches[0];
  }
  return event2 ? {
    x: event2.clientX,
    y: event2.clientY
  } : null;
}
var THRESHOLD = 15;
function MoveCanvas(eventBus, canvas) {
  var context;
  function handleMousedown(event2) {
    return handleStart(event2.originalEvent);
  }
  eventBus.on("canvas.focus.changed", function(event2) {
    if (event2.focused) {
      eventBus.on("element.mousedown", 500, handleMousedown);
    } else {
      eventBus.off("element.mousedown", handleMousedown);
    }
  });
  function handleMove(event2) {
    var start = context.start, button = context.button, position = toPoint(event2), delta$1 = delta(position, start);
    if (!context.dragging && length(delta$1) > THRESHOLD) {
      context.dragging = true;
      if (button === 0) {
        install(eventBus);
      }
      set("grab");
    }
    if (context.dragging) {
      var lastPosition = context.last || context.start;
      delta$1 = delta(position, lastPosition);
      canvas.scroll({
        dx: delta$1.x,
        dy: delta$1.y
      });
      context.last = position;
    }
    event2.preventDefault();
  }
  function handleEnd(event$1) {
    event.unbind(document, "mousemove", handleMove);
    event.unbind(document, "mouseup", handleEnd);
    context = null;
    unset();
  }
  function handleStart(event$1) {
    if (closest(event$1.target, ".djs-draggable")) {
      return;
    }
    var button = event$1.button;
    if (button >= 2 || event$1.ctrlKey || event$1.shiftKey || event$1.altKey) {
      return;
    }
    context = {
      button,
      start: toPoint(event$1)
    };
    event.bind(document, "mousemove", handleMove);
    event.bind(document, "mouseup", handleEnd);
    return true;
  }
  this.isActive = function() {
    return !!context;
  };
}
MoveCanvas.$inject = [
  "eventBus",
  "canvas"
];
function length(point) {
  return Math.sqrt(Math.pow(point.x, 2) + Math.pow(point.y, 2));
}
const MoveCanvasModule = {
  __init__: ["moveCanvas"],
  moveCanvas: ["type", MoveCanvas]
};
var DEFAULT_CONFIG = {
  moveSpeed: 50,
  moveSpeedAccelerated: 200
};
function KeyboardMove(config, keyboard, canvas) {
  var self = this;
  this._config = assign({}, DEFAULT_CONFIG, config || {});
  keyboard.addListener(arrowsListener);
  function arrowsListener(context) {
    var event2 = context.keyEvent, config2 = self._config;
    if (!keyboard.isCmd(event2)) {
      return;
    }
    if (keyboard.isKey([
      "ArrowLeft",
      "Left",
      "ArrowUp",
      "Up",
      "ArrowDown",
      "Down",
      "ArrowRight",
      "Right"
    ], event2)) {
      var speed = keyboard.isShift(event2) ? config2.moveSpeedAccelerated : config2.moveSpeed;
      var direction;
      switch (event2.key) {
        case "ArrowLeft":
        case "Left":
          direction = "left";
          break;
        case "ArrowUp":
        case "Up":
          direction = "up";
          break;
        case "ArrowRight":
        case "Right":
          direction = "right";
          break;
        case "ArrowDown":
        case "Down":
          direction = "down";
          break;
      }
      self.moveCanvas({
        speed,
        direction
      });
      return true;
    }
  }
  this.moveCanvas = function(options) {
    var dx = 0, dy = 0, speed = options.speed;
    var actualSpeed = speed / Math.min(Math.sqrt(canvas.viewbox().scale), 1);
    switch (options.direction) {
      case "left":
        dx = actualSpeed;
        break;
      case "up":
        dy = actualSpeed;
        break;
      case "right":
        dx = -actualSpeed;
        break;
      case "down":
        dy = -actualSpeed;
        break;
    }
    canvas.scroll({
      dx,
      dy
    });
  };
}
KeyboardMove.$inject = [
  "config.keyboardMove",
  "keyboard",
  "canvas"
];
const KeyboardMoveModule = {
  __depends__: [
    KeyboardBindingsModule
  ],
  __init__: ["keyboardMove"],
  keyboardMove: ["type", KeyboardMove]
};
function log10(x2) {
  return Math.log(x2) / Math.log(10);
}
function getStepSize(range, steps) {
  var minLinearRange = log10(range.min), maxLinearRange = log10(range.max);
  var absoluteLinearRange = Math.abs(minLinearRange) + Math.abs(maxLinearRange);
  return absoluteLinearRange / steps;
}
function cap(range, scale) {
  return Math.max(range.min, Math.min(range.max, scale));
}
function isMac() {
  return /mac/i.test(navigator.platform);
}
var sign = Math.sign || function(n2) {
  return n2 >= 0 ? 1 : -1;
};
var RANGE = { min: 0.2, max: 4 }, NUM_STEPS = 10;
var DELTA_THRESHOLD = 0.1;
var DEFAULT_SCALE = 0.75;
function ZoomScroll(config, eventBus, canvas) {
  config = config || {};
  this._enabled = false;
  this._canvas = canvas;
  this._container = canvas._container;
  this._handleWheel = bind(this._handleWheel, this);
  this._totalDelta = 0;
  this._scale = config.scale || DEFAULT_SCALE;
  var self = this;
  eventBus.on("canvas.focus.changed", function(event2) {
    self._init(event2.focused && config.enabled !== false);
  });
}
ZoomScroll.$inject = [
  "config.zoomScroll",
  "eventBus",
  "canvas"
];
ZoomScroll.prototype.scroll = function scroll(delta2) {
  this._canvas.scroll(delta2);
};
ZoomScroll.prototype.reset = function reset() {
  this._canvas.zoom("fit-viewport");
};
ZoomScroll.prototype.zoom = function zoom(delta2, position) {
  var stepSize = getStepSize(RANGE, NUM_STEPS * 2);
  this._totalDelta += delta2;
  if (Math.abs(this._totalDelta) > DELTA_THRESHOLD) {
    this._zoom(delta2, position, stepSize);
    this._totalDelta = 0;
  }
};
ZoomScroll.prototype._handleWheel = function handleWheel(event2) {
  if (!this._canvas.isFocused()) {
    return;
  }
  var element = this._container;
  event2.preventDefault();
  var isZoom = event2.ctrlKey || isMac() && event2.metaKey;
  var isHorizontalScroll = event2.shiftKey;
  var factor = -1 * this._scale, delta2;
  if (isZoom) {
    factor *= event2.deltaMode === 0 ? 0.02 : 0.32;
  } else {
    factor *= event2.deltaMode === 0 ? 1 : 16;
  }
  if (isZoom) {
    var elementRect = element.getBoundingClientRect();
    var offset = {
      x: event2.clientX - elementRect.left,
      y: event2.clientY - elementRect.top
    };
    delta2 = Math.sqrt(
      Math.pow(event2.deltaY, 2) + Math.pow(event2.deltaX, 2)
    ) * sign(event2.deltaY) * factor;
    this.zoom(delta2, offset);
  } else {
    if (isHorizontalScroll) {
      delta2 = {
        dx: factor * event2.deltaY,
        dy: 0
      };
    } else {
      delta2 = {
        dx: factor * event2.deltaX,
        dy: factor * event2.deltaY
      };
    }
    this.scroll(delta2);
  }
};
ZoomScroll.prototype.stepZoom = function stepZoom(delta2, position) {
  var stepSize = getStepSize(RANGE, NUM_STEPS);
  this._zoom(delta2, position, stepSize);
};
ZoomScroll.prototype._zoom = function(delta2, position, stepSize) {
  var canvas = this._canvas;
  var direction = delta2 > 0 ? 1 : -1;
  var currentLinearZoomLevel = log10(canvas.zoom());
  var newLinearZoomLevel = Math.round(currentLinearZoomLevel / stepSize) * stepSize;
  newLinearZoomLevel += stepSize * direction;
  var newLogZoomLevel = Math.pow(10, newLinearZoomLevel);
  canvas.zoom(cap(RANGE, newLogZoomLevel), position);
};
ZoomScroll.prototype.toggle = function toggle(newEnabled) {
  var element = this._container;
  var handleWheel2 = this._handleWheel;
  var oldEnabled = this._enabled;
  if (typeof newEnabled === "undefined") {
    newEnabled = !oldEnabled;
  }
  if (oldEnabled !== newEnabled) {
    event[newEnabled ? "bind" : "unbind"](element, "wheel", handleWheel2, false);
  }
  this._enabled = newEnabled;
  return newEnabled;
};
ZoomScroll.prototype._init = function(newEnabled) {
  this.toggle(newEnabled);
};
const ZoomScrollModule = {
  __init__: ["zoomScroll"],
  zoomScroll: ["type", ZoomScroll]
};
function isButton(event2, button) {
  return (getOriginal$1(event2) || event2).button === button;
}
function isPrimaryButton(event2) {
  return isButton(event2, 0);
}
function isAuxiliaryButton(event2) {
  return isButton(event2, 1);
}
function hasPrimaryModifier(event2) {
  var originalEvent = getOriginal$1(event2) || event2;
  if (!isPrimaryButton(event2)) {
    return false;
  }
  if (isMac()) {
    return originalEvent.metaKey;
  } else {
    return originalEvent.ctrlKey;
  }
}
function hasSecondaryModifier(event2) {
  var originalEvent = getOriginal$1(event2) || event2;
  return isPrimaryButton(event2) && originalEvent.shiftKey;
}
function componentsToPath(elements) {
  return elements.flat().join(",").replace(/,?([A-Za-z]),?/g, "$1");
}
function move(point) {
  return ["M", point.x, point.y];
}
function lineTo(point) {
  return ["L", point.x, point.y];
}
function curveTo(p1, p2, p3) {
  return ["C", p1.x, p1.y, p2.x, p2.y, p3.x, p3.y];
}
function drawPath(waypoints, cornerRadius) {
  const pointCount = waypoints.length;
  const path = [move(waypoints[0])];
  for (let i2 = 1; i2 < pointCount; i2++) {
    const pointBefore = waypoints[i2 - 1];
    const point = waypoints[i2];
    const pointAfter = waypoints[i2 + 1];
    if (!pointAfter || !cornerRadius) {
      path.push(lineTo(point));
      continue;
    }
    const effectiveRadius = Math.min(
      cornerRadius,
      vectorLength$1(point.x - pointBefore.x, point.y - pointBefore.y),
      vectorLength$1(pointAfter.x - point.x, pointAfter.y - point.y)
    );
    if (!effectiveRadius) {
      path.push(lineTo(point));
      continue;
    }
    const beforePoint = getPointAtLength(point, pointBefore, effectiveRadius);
    const beforePoint2 = getPointAtLength(point, pointBefore, effectiveRadius * 0.5);
    const afterPoint = getPointAtLength(point, pointAfter, effectiveRadius);
    const afterPoint2 = getPointAtLength(point, pointAfter, effectiveRadius * 0.5);
    path.push(lineTo(beforePoint));
    path.push(curveTo(beforePoint2, afterPoint2, afterPoint));
  }
  return path;
}
function getPointAtLength(start, end, length2) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const totalLength = vectorLength$1(deltaX, deltaY);
  const percent = length2 / totalLength;
  return {
    x: start.x + deltaX * percent,
    y: start.y + deltaY * percent
  };
}
function vectorLength$1(x2, y2) {
  return Math.sqrt(Math.pow(x2, 2) + Math.pow(y2, 2));
}
function createLine(points, attrs, radius) {
  if (isNumber(attrs)) {
    radius = attrs;
    attrs = null;
  }
  if (!attrs) {
    attrs = {};
  }
  const line = create$1("path", attrs);
  if (isNumber(radius)) {
    line.dataset.cornerRadius = String(radius);
  }
  return updateLine(line, points);
}
function updateLine(gfx, points) {
  const cornerRadius = parseInt(gfx.dataset.cornerRadius, 10) || 0;
  attr(gfx, {
    d: componentsToPath(drawPath(points, cornerRadius))
  });
  return gfx;
}
function allowAll(event2) {
  return true;
}
function allowPrimaryAndAuxiliary(event2) {
  return isPrimaryButton(event2) || isAuxiliaryButton(event2);
}
var LOW_PRIORITY$9 = 500;
function InteractionEvents(eventBus, elementRegistry, styles) {
  var self = this;
  function fire(type, event2, element) {
    if (isIgnored(type, event2)) {
      return;
    }
    var target, gfx, returnValue;
    if (!element) {
      target = event2.delegateTarget || event2.target;
      if (target) {
        gfx = target;
        element = elementRegistry.get(gfx);
      }
    } else {
      gfx = elementRegistry.getGraphics(element);
    }
    if (!gfx || !element) {
      return;
    }
    returnValue = eventBus.fire(type, {
      element,
      gfx,
      originalEvent: event2
    });
    if (returnValue === false) {
      event2.stopPropagation();
      event2.preventDefault();
    }
  }
  var handlers = {};
  function mouseHandler(localEventName) {
    return handlers[localEventName];
  }
  function isIgnored(localEventName, event2) {
    var filter2 = ignoredFilters[localEventName] || isPrimaryButton;
    return !filter2(event2);
  }
  var bindings = {
    click: "element.click",
    contextmenu: "element.contextmenu",
    dblclick: "element.dblclick",
    mousedown: "element.mousedown",
    mousemove: "element.mousemove",
    mouseover: "element.hover",
    mouseout: "element.out",
    mouseup: "element.mouseup"
  };
  var ignoredFilters = {
    "element.contextmenu": allowAll,
    "element.mousedown": allowPrimaryAndAuxiliary,
    "element.mouseup": allowPrimaryAndAuxiliary,
    "element.click": allowPrimaryAndAuxiliary,
    "element.dblclick": allowPrimaryAndAuxiliary
  };
  function triggerMouseEvent(eventName, event2, targetElement) {
    var localEventName = bindings[eventName];
    if (!localEventName) {
      throw new Error("unmapped DOM event name <" + eventName + ">");
    }
    return fire(localEventName, event2, targetElement);
  }
  var ELEMENT_SELECTOR2 = "svg, .djs-element";
  function registerEvent(node, event2, localEvent, ignoredFilter) {
    var handler = handlers[localEvent] = function(event3) {
      fire(localEvent, event3);
    };
    if (ignoredFilter) {
      ignoredFilters[localEvent] = ignoredFilter;
    }
    handler.$delegate = delegate.bind(node, ELEMENT_SELECTOR2, event2, handler);
  }
  function unregisterEvent(node, event2, localEvent) {
    var handler = mouseHandler(localEvent);
    if (!handler) {
      return;
    }
    delegate.unbind(node, event2, handler.$delegate);
  }
  function registerEvents(svg) {
    forEach(bindings, function(val, key) {
      registerEvent(svg, key, val);
    });
  }
  function unregisterEvents(svg) {
    forEach(bindings, function(val, key) {
      unregisterEvent(svg, key, val);
    });
  }
  eventBus.on("canvas.destroy", function(event2) {
    unregisterEvents(event2.svg);
  });
  eventBus.on("canvas.init", function(event2) {
    registerEvents(event2.svg);
  });
  eventBus.on(["shape.added", "connection.added"], function(event2) {
    var element = event2.element, gfx = event2.gfx;
    eventBus.fire("interactionEvents.createHit", { element, gfx });
  });
  eventBus.on([
    "shape.changed",
    "connection.changed"
  ], LOW_PRIORITY$9, function(event2) {
    var element = event2.element, gfx = event2.gfx;
    eventBus.fire("interactionEvents.updateHit", { element, gfx });
  });
  eventBus.on("interactionEvents.createHit", LOW_PRIORITY$9, function(event2) {
    var element = event2.element, gfx = event2.gfx;
    self.createDefaultHit(element, gfx);
  });
  eventBus.on("interactionEvents.updateHit", function(event2) {
    var element = event2.element, gfx = event2.gfx;
    self.updateDefaultHit(element, gfx);
  });
  var STROKE_HIT_STYLE = createHitStyle("djs-hit djs-hit-stroke");
  var CLICK_STROKE_HIT_STYLE = createHitStyle("djs-hit djs-hit-click-stroke");
  var ALL_HIT_STYLE = createHitStyle("djs-hit djs-hit-all");
  var NO_MOVE_HIT_STYLE = createHitStyle("djs-hit djs-hit-no-move");
  var HIT_TYPES = {
    "all": ALL_HIT_STYLE,
    "click-stroke": CLICK_STROKE_HIT_STYLE,
    "stroke": STROKE_HIT_STYLE,
    "no-move": NO_MOVE_HIT_STYLE
  };
  function createHitStyle(classNames, attrs) {
    attrs = assign({
      stroke: "white",
      strokeWidth: 15
    }, attrs || {});
    return styles.cls(classNames, ["no-fill", "no-border"], attrs);
  }
  function applyStyle(hit, type) {
    var attrs = HIT_TYPES[type];
    if (!attrs) {
      throw new Error("invalid hit type <" + type + ">");
    }
    attr(hit, attrs);
    return hit;
  }
  function appendHit(gfx, hit) {
    append(gfx, hit);
  }
  this.removeHits = function(gfx) {
    var hits = queryAll(".djs-hit", gfx);
    forEach(hits, remove$1);
  };
  this.createDefaultHit = function(element, gfx) {
    var waypoints = element.waypoints, isFrame = element.isFrame, boxType;
    if (waypoints) {
      return this.createWaypointsHit(gfx, waypoints);
    } else {
      boxType = isFrame ? "stroke" : "all";
      return this.createBoxHit(gfx, boxType, {
        width: element.width,
        height: element.height
      });
    }
  };
  this.createWaypointsHit = function(gfx, waypoints) {
    var hit = createLine(waypoints);
    applyStyle(hit, "stroke");
    appendHit(gfx, hit);
    return hit;
  };
  this.createBoxHit = function(gfx, type, attrs) {
    attrs = assign({
      x: 0,
      y: 0
    }, attrs);
    var hit = create$1("rect");
    applyStyle(hit, type);
    attr(hit, attrs);
    appendHit(gfx, hit);
    return hit;
  };
  this.updateDefaultHit = function(element, gfx) {
    var hit = query(".djs-hit", gfx);
    if (!hit) {
      return;
    }
    if (element.waypoints) {
      updateLine(hit, element.waypoints);
    } else {
      attr(hit, {
        width: element.width,
        height: element.height
      });
    }
    return hit;
  };
  this.fire = fire;
  this.triggerMouseEvent = triggerMouseEvent;
  this.mouseHandler = mouseHandler;
  this.registerEvent = registerEvent;
  this.unregisterEvent = unregisterEvent;
}
InteractionEvents.$inject = [
  "eventBus",
  "elementRegistry",
  "styles"
];
const InteractionEventsModule = {
  __init__: ["interactionEvents"],
  interactionEvents: ["type", InteractionEvents]
};
function Selection(eventBus, canvas) {
  this._eventBus = eventBus;
  this._canvas = canvas;
  this._selectedElements = [];
  var self = this;
  eventBus.on(["shape.remove", "connection.remove"], function(e2) {
    var element = e2.element;
    self.deselect(element);
  });
  eventBus.on(["diagram.clear", "root.set"], function(e2) {
    self.select(null);
  });
}
Selection.$inject = ["eventBus", "canvas"];
Selection.prototype.deselect = function(element) {
  var selectedElements = this._selectedElements;
  var idx = selectedElements.indexOf(element);
  if (idx !== -1) {
    var oldSelection = selectedElements.slice();
    selectedElements.splice(idx, 1);
    this._eventBus.fire("selection.changed", { oldSelection, newSelection: selectedElements });
  }
};
Selection.prototype.get = function() {
  return this._selectedElements;
};
Selection.prototype.isSelected = function(element) {
  return this._selectedElements.indexOf(element) !== -1;
};
Selection.prototype.select = function(elements, add2) {
  var selectedElements = this._selectedElements, oldSelection = selectedElements.slice();
  if (!isArray$1(elements)) {
    elements = elements ? [elements] : [];
  }
  var canvas = this._canvas;
  var rootElement = canvas.getRootElement();
  elements = elements.filter(function(element) {
    var elementRoot = canvas.findRoot(element);
    return rootElement === elementRoot;
  });
  if (add2) {
    forEach(elements, function(element) {
      if (selectedElements.indexOf(element) !== -1) {
        return;
      } else {
        selectedElements.push(element);
      }
    });
  } else {
    this._selectedElements = selectedElements = elements.slice();
  }
  this._eventBus.fire("selection.changed", { oldSelection, newSelection: selectedElements });
};
var MARKER_HOVER = "hover", MARKER_SELECTED = "selected";
function SelectionVisuals(canvas, eventBus) {
  this._canvas = canvas;
  function addMarker(e2, cls) {
    canvas.addMarker(e2, cls);
  }
  function removeMarker(e2, cls) {
    canvas.removeMarker(e2, cls);
  }
  eventBus.on("element.hover", function(event2) {
    addMarker(event2.element, MARKER_HOVER);
  });
  eventBus.on("element.out", function(event2) {
    removeMarker(event2.element, MARKER_HOVER);
  });
  eventBus.on("selection.changed", function(event2) {
    function deselect(s2) {
      removeMarker(s2, MARKER_SELECTED);
    }
    function select(s2) {
      addMarker(s2, MARKER_SELECTED);
    }
    var oldSelection = event2.oldSelection, newSelection = event2.newSelection;
    forEach(oldSelection, function(e2) {
      if (newSelection.indexOf(e2) === -1) {
        deselect(e2);
      }
    });
    forEach(newSelection, function(e2) {
      if (oldSelection.indexOf(e2) === -1) {
        select(e2);
      }
    });
  });
}
SelectionVisuals.$inject = [
  "canvas",
  "eventBus"
];
function SelectionBehavior(eventBus, selection, canvas, elementRegistry) {
  eventBus.on("create.end", 500, function(event2) {
    var context = event2.context, canExecute = context.canExecute, elements = context.elements, hints = context.hints || {}, autoSelect = hints.autoSelect;
    if (canExecute) {
      if (autoSelect === false) {
        return;
      }
      if (isArray$1(autoSelect)) {
        selection.select(autoSelect);
      } else {
        selection.select(elements.filter(isShown));
      }
    }
  });
  eventBus.on("connect.end", 500, function(event2) {
    var context = event2.context, connection = context.connection;
    if (connection) {
      selection.select(connection);
    }
  });
  eventBus.on("shape.move.end", 500, function(event2) {
    var previousSelection = event2.previousSelection || [];
    var shape = elementRegistry.get(event2.context.shape.id);
    var isSelected = find(previousSelection, function(selectedShape) {
      return shape.id === selectedShape.id;
    });
    if (!isSelected) {
      selection.select(shape);
    }
  });
  eventBus.on("element.click", function(event2) {
    if (!isPrimaryButton(event2)) {
      return;
    }
    var element = event2.element;
    if (element === canvas.getRootElement()) {
      element = null;
    }
    var isSelected = selection.isSelected(element), isMultiSelect = selection.get().length > 1;
    var add2 = hasSecondaryModifier(event2);
    if (isSelected && isMultiSelect) {
      if (add2) {
        return selection.deselect(element);
      } else {
        return selection.select(element);
      }
    } else if (!isSelected) {
      selection.select(element, add2);
    } else {
      selection.deselect(element);
    }
  });
}
SelectionBehavior.$inject = [
  "eventBus",
  "selection",
  "canvas",
  "elementRegistry"
];
function isShown(element) {
  return !element.hidden;
}
const SelectionModule = {
  __init__: ["selectionVisuals", "selectionBehavior"],
  __depends__: [
    InteractionEventsModule
  ],
  selection: ["type", Selection],
  selectionVisuals: ["type", SelectionVisuals],
  selectionBehavior: ["type", SelectionBehavior]
};
function getParents(elements) {
  return filter(elements, function(element) {
    return !find(elements, function(e2) {
      return e2 !== element && getParent(element, e2);
    });
  });
}
function getParent(element, parent) {
  if (!parent) {
    return;
  }
  if (element === parent) {
    return parent;
  }
  if (!element.parent) {
    return;
  }
  return getParent(element.parent, parent);
}
function add$1(elements, element, unique) {
  var canAdd = true;
  {
    elements.push(element);
  }
  return canAdd;
}
function eachElement(elements, fn, depth) {
  depth = depth || 0;
  if (!isArray$1(elements)) {
    elements = [elements];
  }
  forEach(elements, function(s2, i2) {
    var filter2 = fn(s2, i2, depth);
    if (isArray$1(filter2) && filter2.length) {
      eachElement(filter2, fn, depth + 1);
    }
  });
}
function selfAndChildren(elements, unique, maxDepth) {
  var result = [], processedChildren = [];
  eachElement(elements, function(element, i2, depth) {
    add$1(result, element);
    var children = element.children;
    {
      if (children && add$1(processedChildren, children)) {
        return children;
      }
    }
  });
  return result;
}
function selfAndAllChildren(elements, allowDuplicates) {
  return selfAndChildren(elements);
}
function getClosure(elements, isTopLevel, closure) {
  if (isUndefined(isTopLevel)) {
    isTopLevel = true;
  }
  if (isObject(isTopLevel)) {
    closure = isTopLevel;
    isTopLevel = true;
  }
  closure = closure || {};
  var allShapes = copyObject(closure.allShapes), allConnections = copyObject(closure.allConnections), enclosedElements = copyObject(closure.enclosedElements), enclosedConnections = copyObject(closure.enclosedConnections);
  var topLevel = copyObject(
    closure.topLevel,
    isTopLevel && groupBy(elements, function(e2) {
      return e2.id;
    })
  );
  function handleConnection(c2) {
    if (topLevel[c2.source.id] && topLevel[c2.target.id]) {
      topLevel[c2.id] = [c2];
    }
    if (allShapes[c2.source.id] && allShapes[c2.target.id]) {
      enclosedConnections[c2.id] = enclosedElements[c2.id] = c2;
    }
    allConnections[c2.id] = c2;
  }
  function handleElement(element) {
    enclosedElements[element.id] = element;
    if (element.waypoints) {
      enclosedConnections[element.id] = allConnections[element.id] = element;
    } else {
      allShapes[element.id] = element;
      forEach(element.incoming, handleConnection);
      forEach(element.outgoing, handleConnection);
      return element.children;
    }
  }
  eachElement(elements, handleElement);
  return {
    allShapes,
    allConnections,
    topLevel,
    enclosedConnections,
    enclosedElements
  };
}
function getBBox(elements, stopRecursion) {
  stopRecursion = !!stopRecursion;
  if (!isArray$1(elements)) {
    elements = [elements];
  }
  var minX, minY, maxX, maxY;
  forEach(elements, function(element) {
    var bbox = element;
    if (element.waypoints && !stopRecursion) {
      bbox = getBBox(element.waypoints, true);
    }
    var x2 = bbox.x, y2 = bbox.y, height = bbox.height || 0, width = bbox.width || 0;
    if (x2 < minX || minX === void 0) {
      minX = x2;
    }
    if (y2 < minY || minY === void 0) {
      minY = y2;
    }
    if (x2 + width > maxX || maxX === void 0) {
      maxX = x2 + width;
    }
    if (y2 + height > maxY || maxY === void 0) {
      maxY = y2 + height;
    }
  });
  return {
    x: minX,
    y: minY,
    height: maxY - minY,
    width: maxX - minX
  };
}
function getEnclosedElements(elements, bbox) {
  var filteredElements = {};
  forEach(elements, function(element) {
    var e2 = element;
    if (e2.waypoints) {
      e2 = getBBox(e2);
    }
    if (!isNumber(bbox.y) && e2.x > bbox.x) {
      filteredElements[element.id] = element;
    }
    if (!isNumber(bbox.x) && e2.y > bbox.y) {
      filteredElements[element.id] = element;
    }
    if (e2.x > bbox.x && e2.y > bbox.y) {
      if (isNumber(bbox.width) && isNumber(bbox.height) && e2.width + e2.x < bbox.width + bbox.x && e2.height + e2.y < bbox.height + bbox.y) {
        filteredElements[element.id] = element;
      } else if (!isNumber(bbox.width) || !isNumber(bbox.height)) {
        filteredElements[element.id] = element;
      }
    }
  });
  return filteredElements;
}
function getType(element) {
  if ("waypoints" in element) {
    return "connection";
  }
  if ("x" in element) {
    return "shape";
  }
  return "root";
}
function copyObject(src1, src2) {
  return assign({}, src1 || {}, src2 || {});
}
var LOW_PRIORITY$8 = 500;
var DEFAULT_PRIORITY$4 = 1e3;
function Outline(eventBus, styles) {
  this._eventBus = eventBus;
  this.offset = 5;
  var OUTLINE_STYLE = styles.cls("djs-outline", ["no-fill"]);
  var self = this;
  function createOutline(gfx) {
    var outline = create$1("rect");
    attr(outline, assign({
      x: 0,
      y: 0,
      rx: 4,
      width: 100,
      height: 100
    }, OUTLINE_STYLE));
    return outline;
  }
  eventBus.on(["shape.added", "shape.changed"], LOW_PRIORITY$8, function(event2) {
    var element = event2.element, gfx = event2.gfx;
    var outline = query(".djs-outline", gfx);
    if (!outline) {
      outline = self.getOutline(element) || createOutline();
      append(gfx, outline);
    }
    self.updateShapeOutline(outline, element);
  });
  eventBus.on(["connection.added", "connection.changed"], function(event2) {
    var element = event2.element, gfx = event2.gfx;
    var outline = query(".djs-outline", gfx);
    if (!outline) {
      outline = createOutline();
      append(gfx, outline);
    }
    self.updateConnectionOutline(outline, element);
  });
}
Outline.prototype.updateShapeOutline = function(outline, element) {
  var updated = false;
  var providers = this._getProviders();
  if (providers.length) {
    forEach(providers, function(provider) {
      updated = updated || provider.updateOutline(element, outline);
    });
  }
  if (!updated) {
    attr(outline, {
      x: -this.offset,
      y: -this.offset,
      width: element.width + this.offset * 2,
      height: element.height + this.offset * 2
    });
  }
};
Outline.prototype.updateConnectionOutline = function(outline, connection) {
  var bbox = getBBox(connection);
  attr(outline, {
    x: bbox.x - this.offset,
    y: bbox.y - this.offset,
    width: bbox.width + this.offset * 2,
    height: bbox.height + this.offset * 2
  });
};
Outline.prototype.registerProvider = function(priority, provider) {
  if (!provider) {
    provider = priority;
    priority = DEFAULT_PRIORITY$4;
  }
  this._eventBus.on("outline.getProviders", priority, function(event2) {
    event2.providers.push(provider);
  });
};
Outline.prototype._getProviders = function() {
  var event2 = this._eventBus.createEvent({
    type: "outline.getProviders",
    providers: []
  });
  this._eventBus.fire(event2);
  return event2.providers;
};
Outline.prototype.getOutline = function(element) {
  var outline;
  var providers = this._getProviders();
  forEach(providers, function(provider) {
    if (!isFunction(provider.getOutline)) {
      return;
    }
    outline = outline || provider.getOutline(element);
  });
  return outline;
};
Outline.$inject = ["eventBus", "styles", "elementRegistry"];
var SELECTION_OUTLINE_PADDING = 6;
function MultiSelectionOutline(eventBus, canvas, selection) {
  this._canvas = canvas;
  var self = this;
  eventBus.on("element.changed", function(event2) {
    if (selection.isSelected(event2.element)) {
      self._updateMultiSelectionOutline(selection.get());
    }
  });
  eventBus.on("selection.changed", function(event2) {
    var newSelection = event2.newSelection;
    self._updateMultiSelectionOutline(newSelection);
  });
}
MultiSelectionOutline.prototype._updateMultiSelectionOutline = function(selection) {
  var layer = this._canvas.getLayer("selectionOutline");
  clear(layer);
  var enabled = selection.length > 1;
  var container = this._canvas.getContainer();
  classes$1(container)[enabled ? "add" : "remove"]("djs-multi-select");
  if (!enabled) {
    return;
  }
  var bBox = addSelectionOutlinePadding(getBBox(selection));
  var rect = create$1("rect");
  attr(rect, assign({
    rx: 3
  }, bBox));
  classes$1(rect).add("djs-selection-outline");
  append(layer, rect);
};
MultiSelectionOutline.$inject = ["eventBus", "canvas", "selection"];
function addSelectionOutlinePadding(bBox) {
  return {
    x: bBox.x - SELECTION_OUTLINE_PADDING,
    y: bBox.y - SELECTION_OUTLINE_PADDING,
    width: bBox.width + SELECTION_OUTLINE_PADDING * 2,
    height: bBox.height + SELECTION_OUTLINE_PADDING * 2
  };
}
const OutlineModule = {
  __depends__: [
    SelectionModule
  ],
  __init__: ["outline", "multiSelectionOutline"],
  outline: ["type", Outline],
  multiSelectionOutline: ["type", MultiSelectionOutline]
};
function Rules(injector) {
  this._commandStack = injector.get("commandStack", false);
}
Rules.$inject = ["injector"];
Rules.prototype.allowed = function(action, context) {
  var allowed = true;
  var commandStack = this._commandStack;
  if (commandStack) {
    allowed = commandStack.canExecute(action, context);
  }
  return allowed === void 0 ? true : allowed;
};
const RulesModule = {
  __init__: ["rules"],
  rules: ["type", Rules]
};
var HIGH_PRIORITY$7 = 1500;
function HoverFix(elementRegistry, eventBus, injector) {
  var self = this;
  var dragging = injector.get("dragging", false);
  function ensureHover(event2) {
    if (event2.hover) {
      return;
    }
    var originalEvent = event2.originalEvent;
    var gfx = self._findTargetGfx(originalEvent);
    var element = gfx && elementRegistry.get(gfx);
    if (gfx && element) {
      event2.stopPropagation();
      dragging.hover({ element, gfx });
      dragging.move(originalEvent);
    }
  }
  if (dragging) {
    eventBus.on("drag.start", function(event2) {
      eventBus.once("drag.move", HIGH_PRIORITY$7, function(event3) {
        ensureHover(event3);
      });
    });
  }
  (function() {
    var hoverGfx;
    var hover;
    eventBus.on("element.hover", function(event2) {
      hoverGfx = event2.gfx;
      hover = event2.element;
    });
    eventBus.on("element.hover", HIGH_PRIORITY$7, function(event2) {
      if (hover) {
        eventBus.fire("element.out", {
          element: hover,
          gfx: hoverGfx
        });
      }
    });
    eventBus.on("element.out", function() {
      hoverGfx = null;
      hover = null;
    });
  })();
  this._findTargetGfx = function(event2) {
    var position, target;
    if (!(event2 instanceof MouseEvent)) {
      return;
    }
    position = toPoint(event2);
    target = document.elementFromPoint(position.x, position.y);
    return getGfx(target);
  };
}
HoverFix.$inject = [
  "elementRegistry",
  "eventBus",
  "injector"
];
function getGfx(target) {
  return closest(target, "svg, .djs-element", true);
}
const HoverFixModule = {
  __init__: [
    "hoverFix"
  ],
  hoverFix: ["type", HoverFix]
};
var round$8 = Math.round;
var DRAG_ACTIVE_CLS = "djs-drag-active";
function preventDefault(event2) {
  event2.preventDefault();
}
function isTouchEvent(event2) {
  return typeof TouchEvent !== "undefined" && event2 instanceof TouchEvent;
}
function getLength(point) {
  return Math.sqrt(Math.pow(point.x, 2) + Math.pow(point.y, 2));
}
function Dragging(eventBus, canvas, selection, elementRegistry) {
  var defaultOptions = {
    threshold: 5,
    trapClick: true
  };
  var context;
  function toLocalPoint(globalPosition) {
    var viewbox = canvas.viewbox();
    var clientRect = canvas._container.getBoundingClientRect();
    return {
      x: viewbox.x + (globalPosition.x - clientRect.left) / viewbox.scale,
      y: viewbox.y + (globalPosition.y - clientRect.top) / viewbox.scale
    };
  }
  function fire(type, dragContext) {
    dragContext = dragContext || context;
    var event2 = eventBus.createEvent(
      assign(
        {},
        dragContext.payload,
        dragContext.data,
        { isTouch: dragContext.isTouch }
      )
    );
    if (eventBus.fire("drag." + type, event2) === false) {
      return false;
    }
    return eventBus.fire(dragContext.prefix + "." + type, event2);
  }
  function restoreSelection(previousSelection) {
    var existingSelection = previousSelection.filter(function(element) {
      return elementRegistry.get(element.id);
    });
    existingSelection.length && selection.select(existingSelection);
  }
  function move2(event2, activate) {
    var payload = context.payload, displacement = context.displacement;
    var globalStart = context.globalStart, globalCurrent = toPoint(event2), globalDelta = delta(globalCurrent, globalStart);
    var localStart = context.localStart, localCurrent = toLocalPoint(globalCurrent), localDelta = delta(localCurrent, localStart);
    if (!context.active && (activate || getLength(globalDelta) > context.threshold)) {
      assign(payload, {
        x: round$8(localStart.x + displacement.x),
        y: round$8(localStart.y + displacement.y),
        dx: 0,
        dy: 0
      }, { originalEvent: event2 });
      if (false === fire("start")) {
        return cancel();
      }
      context.active = true;
      if (!context.keepSelection) {
        payload.previousSelection = selection.get();
        selection.select(null);
      }
      if (context.cursor) {
        set(context.cursor);
      }
      canvas.addMarker(canvas.getRootElement(), DRAG_ACTIVE_CLS);
    }
    stopPropagation(event2);
    if (context.active) {
      assign(payload, {
        x: round$8(localCurrent.x + displacement.x),
        y: round$8(localCurrent.y + displacement.y),
        dx: round$8(localDelta.x),
        dy: round$8(localDelta.y)
      }, { originalEvent: event2 });
      fire("move");
    }
  }
  function end(event2) {
    var previousContext, returnValue = true;
    if (context.active) {
      if (event2) {
        context.payload.originalEvent = event2;
        stopPropagation(event2);
      }
      returnValue = fire("end");
    }
    if (returnValue === false) {
      fire("rejected");
    }
    previousContext = cleanup(returnValue !== true);
    fire("ended", previousContext);
  }
  function checkCancel(event2) {
    if (isKey("Escape", event2)) {
      preventDefault(event2);
      cancel();
    }
  }
  function trapClickAndEnd(event2) {
    var untrap;
    if (context.active) {
      untrap = install(eventBus);
      setTimeout(untrap, 400);
      preventDefault(event2);
    }
    end(event2);
  }
  function trapTouch(event2) {
    move2(event2);
  }
  function hover(event2) {
    var payload = context.payload;
    payload.hoverGfx = event2.gfx;
    payload.hover = event2.element;
    fire("hover");
  }
  function out(event2) {
    fire("out");
    var payload = context.payload;
    payload.hoverGfx = null;
    payload.hover = null;
  }
  function cancel(restore) {
    var previousContext;
    if (!context) {
      return;
    }
    var wasActive = context.active;
    if (wasActive) {
      fire("cancel");
    }
    previousContext = cleanup(restore);
    if (wasActive) {
      fire("canceled", previousContext);
    }
  }
  function cleanup(restore) {
    var previousContext, endDrag;
    fire("cleanup");
    unset();
    if (context.trapClick) {
      endDrag = trapClickAndEnd;
    } else {
      endDrag = end;
    }
    event.unbind(document, "mousemove", move2);
    event.unbind(document, "dragstart", preventDefault);
    event.unbind(document, "selectstart", preventDefault);
    event.unbind(document, "mousedown", endDrag, true);
    event.unbind(document, "mouseup", endDrag, true);
    event.unbind(document, "keyup", checkCancel);
    event.unbind(document, "touchstart", trapTouch, true);
    event.unbind(document, "touchcancel", cancel, true);
    event.unbind(document, "touchmove", move2, true);
    event.unbind(document, "touchend", end, true);
    eventBus.off("element.hover", hover);
    eventBus.off("element.out", out);
    canvas.removeMarker(canvas.getRootElement(), DRAG_ACTIVE_CLS);
    var previousSelection = context.payload.previousSelection;
    if (restore !== false && previousSelection && !selection.get().length) {
      restoreSelection(previousSelection);
    }
    previousContext = context;
    context = null;
    return previousContext;
  }
  function init(event$1, relativeTo, prefix, options) {
    if (context) {
      cancel(false);
    }
    if (typeof relativeTo === "string") {
      options = prefix;
      prefix = relativeTo;
      relativeTo = null;
    }
    options = assign({}, defaultOptions, options || {});
    var data = options.data || {}, originalEvent, globalStart, localStart, endDrag, isTouch;
    if (options.trapClick) {
      endDrag = trapClickAndEnd;
    } else {
      endDrag = end;
    }
    if (event$1) {
      originalEvent = getOriginal$1(event$1) || event$1;
      globalStart = toPoint(event$1);
      stopPropagation(event$1);
      if (originalEvent.type === "dragstart") {
        preventDefault(originalEvent);
      }
    } else {
      originalEvent = null;
      globalStart = { x: 0, y: 0 };
    }
    localStart = toLocalPoint(globalStart);
    if (!relativeTo) {
      relativeTo = localStart;
    }
    isTouch = isTouchEvent(originalEvent);
    context = assign({
      prefix,
      data,
      payload: {},
      globalStart,
      displacement: delta(relativeTo, localStart),
      localStart,
      isTouch
    }, options);
    if (!options.manual) {
      if (isTouch) {
        event.bind(document, "touchstart", trapTouch, true);
        event.bind(document, "touchcancel", cancel, true);
        event.bind(document, "touchmove", move2, true);
        event.bind(document, "touchend", end, true);
      } else {
        event.bind(document, "mousemove", move2);
        event.bind(document, "dragstart", preventDefault);
        event.bind(document, "selectstart", preventDefault);
        event.bind(document, "mousedown", endDrag, true);
        event.bind(document, "mouseup", endDrag, true);
      }
      event.bind(document, "keyup", checkCancel);
      eventBus.on("element.hover", hover);
      eventBus.on("element.out", out);
    }
    fire("init");
    if (options.autoActivate) {
      move2(event$1, true);
    }
  }
  eventBus.on("diagram.destroy", cancel);
  this.init = init;
  this.move = move2;
  this.hover = hover;
  this.out = out;
  this.end = end;
  this.cancel = cancel;
  this.context = function() {
    return context;
  };
  this.setOptions = function(options) {
    assign(defaultOptions, options);
  };
}
Dragging.$inject = [
  "eventBus",
  "canvas",
  "selection",
  "elementRegistry"
];
const DraggingModule = {
  __depends__: [
    HoverFixModule,
    SelectionModule
  ],
  dragging: ["type", Dragging]
};
function getVisual(gfx) {
  return gfx.childNodes[0];
}
function IdGenerator(prefix) {
  this._counter = 0;
  this._prefix = (prefix ? prefix + "-" : "") + Math.floor(Math.random() * 1e9) + "-";
}
IdGenerator.prototype.next = function() {
  return this._prefix + ++this._counter;
};
const cloneIds = new IdGenerator("ps");
var MARKER_TYPES = [
  "marker-start",
  "marker-mid",
  "marker-end"
];
var NODES_CAN_HAVE_MARKER = [
  "circle",
  "ellipse",
  "line",
  "path",
  "polygon",
  "polyline",
  "path",
  "rect"
];
function PreviewSupport(elementRegistry, eventBus, canvas, styles) {
  this._elementRegistry = elementRegistry;
  this._canvas = canvas;
  this._styles = styles;
}
PreviewSupport.$inject = [
  "elementRegistry",
  "eventBus",
  "canvas",
  "styles"
];
PreviewSupport.prototype.cleanUp = function() {
  console.warn("PreviewSupport#cleanUp is deprecated and will be removed in future versions. You do not need to manually clean up previews anymore. cf. https://github.com/bpmn-io/diagram-js/pull/906");
};
PreviewSupport.prototype.getGfx = function(element) {
  return this._elementRegistry.getGraphics(element);
};
PreviewSupport.prototype.addDragger = function(element, group, gfx, className = "djs-dragger") {
  gfx = gfx || this.getGfx(element);
  var dragger = clone$1(gfx);
  var bbox = gfx.getBoundingClientRect();
  this._cloneMarkers(getVisual(dragger), className);
  attr(dragger, this._styles.cls(className, [], {
    x: bbox.top,
    y: bbox.left
  }));
  append(group, dragger);
  attr(dragger, "data-preview-support-element-id", element.id);
  return dragger;
};
PreviewSupport.prototype.addFrame = function(shape, group) {
  var frame = create$1("rect", {
    class: "djs-resize-overlay",
    width: shape.width,
    height: shape.height,
    x: shape.x,
    y: shape.y
  });
  append(group, frame);
  attr(frame, "data-preview-support-element-id", shape.id);
  return frame;
};
PreviewSupport.prototype._cloneMarkers = function(gfx, className = "djs-dragger", rootGfx = gfx) {
  var self = this;
  if (gfx.childNodes) {
    gfx.childNodes.forEach((childNode) => {
      self._cloneMarkers(childNode, className, rootGfx);
    });
  }
  if (!canHaveMarker(gfx)) {
    return;
  }
  MARKER_TYPES.forEach(function(markerType) {
    if (attr(gfx, markerType)) {
      var marker = getMarker(gfx, markerType, self._canvas.getContainer());
      marker && self._cloneMarker(rootGfx, gfx, marker, markerType, className);
    }
  });
};
PreviewSupport.prototype._cloneMarker = function(parentGfx, gfx, marker, markerType, className = "djs-dragger") {
  var clonedMarkerId = [marker.id, className, cloneIds.next()].join("-");
  var copiedMarker = query("marker#" + marker.id, parentGfx);
  parentGfx = parentGfx || this._canvas._svg;
  var clonedMarker = copiedMarker || clone$1(marker);
  clonedMarker.id = clonedMarkerId;
  classes$1(clonedMarker).add(className);
  var defs = query(":scope > defs", parentGfx);
  if (!defs) {
    defs = create$1("defs");
    append(parentGfx, defs);
  }
  append(defs, clonedMarker);
  var reference = idToReference(clonedMarker.id);
  attr(gfx, markerType, reference);
};
function getMarker(node, markerType, parentNode) {
  var id = referenceToId(attr(node, markerType));
  return query("marker#" + id, parentNode || document);
}
function referenceToId(reference) {
  return reference.match(/url\(['"]?#([^'"]*)['"]?\)/)[1];
}
function idToReference(id) {
  return "url(#" + id + ")";
}
function canHaveMarker(node) {
  return NODES_CAN_HAVE_MARKER.indexOf(node.nodeName) !== -1;
}
const PreviewSupportModule = {
  __init__: ["previewSupport"],
  previewSupport: ["type", PreviewSupport]
};
var LOW_PRIORITY$7 = 500, MEDIUM_PRIORITY = 1250, HIGH_PRIORITY$6 = 1500;
var round$7 = Math.round;
function mid$1(element) {
  return {
    x: element.x + round$7(element.width / 2),
    y: element.y + round$7(element.height / 2)
  };
}
function MoveEvents(eventBus, dragging, modeling, selection, rules) {
  function canMove(shapes, delta2, position, target) {
    return rules.allowed("elements.move", {
      shapes,
      delta: delta2,
      position,
      target
    });
  }
  eventBus.on("shape.move.start", HIGH_PRIORITY$6, function(event2) {
    var context = event2.context, shape = event2.shape, shapes = selection.get().slice();
    if (shapes.indexOf(shape) === -1) {
      shapes = [shape];
    }
    shapes = removeNested(shapes);
    assign(context, {
      shapes,
      validatedShapes: shapes,
      shape
    });
  });
  eventBus.on("shape.move.start", MEDIUM_PRIORITY, function(event2) {
    var context = event2.context, validatedShapes = context.validatedShapes, canExecute;
    canExecute = context.canExecute = canMove(validatedShapes);
    if (!canExecute) {
      return false;
    }
  });
  eventBus.on("shape.move.move", LOW_PRIORITY$7, function(event2) {
    var context = event2.context, validatedShapes = context.validatedShapes, hover = event2.hover, delta2 = { x: event2.dx, y: event2.dy }, position = { x: event2.x, y: event2.y }, canExecute;
    canExecute = canMove(validatedShapes, delta2, position, hover);
    context.delta = delta2;
    context.canExecute = canExecute;
    if (canExecute === null) {
      context.target = null;
      return;
    }
    context.target = hover;
  });
  eventBus.on("shape.move.end", function(event2) {
    var context = event2.context;
    var delta2 = context.delta, canExecute = context.canExecute, isAttach = canExecute === "attach", shapes = context.shapes;
    if (canExecute === false) {
      return false;
    }
    delta2.x = round$7(delta2.x);
    delta2.y = round$7(delta2.y);
    if (delta2.x === 0 && delta2.y === 0) {
      return;
    }
    modeling.moveElements(shapes, delta2, context.target, {
      primaryShape: context.shape,
      attach: isAttach
    });
  });
  eventBus.on("element.mousedown", function(event2) {
    if (!isPrimaryButton(event2)) {
      return;
    }
    var originalEvent = getOriginal$1(event2);
    if (!originalEvent) {
      throw new Error("must supply DOM mousedown event");
    }
    return start(originalEvent, event2.element);
  });
  function start(event2, element, activate, context) {
    if (isObject(activate)) {
      context = activate;
      activate = false;
    }
    if (element.waypoints || !element.parent) {
      return;
    }
    if (classes$1(event2.target).has("djs-hit-no-move")) {
      return;
    }
    var referencePoint = mid$1(element);
    dragging.init(event2, referencePoint, "shape.move", {
      cursor: "grabbing",
      autoActivate: activate,
      data: {
        shape: element,
        context: context || {}
      }
    });
    return true;
  }
  this.start = start;
}
MoveEvents.$inject = [
  "eventBus",
  "dragging",
  "modeling",
  "selection",
  "rules"
];
function removeNested(elements) {
  var ids = groupBy(elements, "id");
  return filter(elements, function(element) {
    while (element = element.parent) {
      if (ids[element.id]) {
        return false;
      }
    }
    return true;
  });
}
function transform(gfx, x2, y2, angle, amount) {
  var translate2 = createTransform();
  translate2.setTranslate(x2, y2);
  var rotate2 = createTransform();
  rotate2.setRotate(0, 0, 0);
  var scale = createTransform();
  scale.setScale(1, 1);
  transform$1(gfx, [translate2, rotate2, scale]);
}
function translate$1(gfx, x2, y2) {
  var translate2 = createTransform();
  translate2.setTranslate(x2, y2);
  transform$1(gfx, translate2);
}
function rotate(gfx, angle) {
  var rotate2 = createTransform();
  rotate2.setRotate(angle, 0, 0);
  transform$1(gfx, rotate2);
}
function isConnection$1(value) {
  return isObject(value) && has(value, "waypoints");
}
function isLabel$1(value) {
  return isObject(value) && has(value, "labelTarget");
}
var LOW_PRIORITY$6 = 499;
var MARKER_DRAGGING$1 = "djs-dragging", MARKER_OK$3 = "drop-ok", MARKER_NOT_OK$3 = "drop-not-ok", MARKER_NEW_PARENT$1 = "new-parent", MARKER_ATTACH$1 = "attach-ok";
function MovePreview(eventBus, canvas, styles, previewSupport) {
  function getVisualDragShapes(shapes) {
    var elements = getAllDraggedElements(shapes);
    var filteredElements = removeEdges(elements);
    return filteredElements;
  }
  function getAllDraggedElements(shapes) {
    var allShapes = selfAndAllChildren(shapes);
    var allConnections = allShapes.flatMap(
      (shape) => (shape.incoming || []).concat(shape.outgoing || [])
    );
    var allElements = allShapes.concat(allConnections);
    var uniqueElements = [...new Set(allElements)];
    return uniqueElements;
  }
  function setMarker(element, marker) {
    [MARKER_ATTACH$1, MARKER_OK$3, MARKER_NOT_OK$3, MARKER_NEW_PARENT$1].forEach(function(m2) {
      if (m2 === marker) {
        canvas.addMarker(element, m2);
      } else {
        canvas.removeMarker(element, m2);
      }
    });
  }
  function makeDraggable(context, element, addMarker) {
    previewSupport.addDragger(element, context.dragGroup);
    if (addMarker) {
      canvas.addMarker(element, MARKER_DRAGGING$1);
    }
    if (context.allDraggedElements) {
      context.allDraggedElements.push(element);
    } else {
      context.allDraggedElements = [element];
    }
  }
  eventBus.on("shape.move.start", LOW_PRIORITY$6, function(event2) {
    var context = event2.context, dragShapes = context.shapes, allDraggedElements = context.allDraggedElements;
    var visuallyDraggedShapes = getVisualDragShapes(dragShapes);
    if (!context.dragGroup) {
      var dragGroup = create$1("g");
      attr(dragGroup, styles.cls("djs-drag-group", ["no-events"]));
      var activeLayer = canvas.getActiveLayer();
      append(activeLayer, dragGroup);
      context.dragGroup = dragGroup;
    }
    visuallyDraggedShapes.forEach(function(shape) {
      previewSupport.addDragger(shape, context.dragGroup);
    });
    if (!allDraggedElements) {
      allDraggedElements = getAllDraggedElements(dragShapes);
    } else {
      allDraggedElements = flatten([
        allDraggedElements,
        getAllDraggedElements(dragShapes)
      ]);
    }
    forEach(allDraggedElements, function(e2) {
      canvas.addMarker(e2, MARKER_DRAGGING$1);
    });
    context.allDraggedElements = allDraggedElements;
    context.differentParents = haveDifferentParents(dragShapes);
  });
  eventBus.on("shape.move.move", LOW_PRIORITY$6, function(event2) {
    var context = event2.context, dragGroup = context.dragGroup, target = context.target, parent = context.shape.parent, canExecute = context.canExecute;
    if (target) {
      if (canExecute === "attach") {
        setMarker(target, MARKER_ATTACH$1);
      } else if (context.canExecute && parent && target.id !== parent.id) {
        setMarker(target, MARKER_NEW_PARENT$1);
      } else {
        setMarker(target, context.canExecute ? MARKER_OK$3 : MARKER_NOT_OK$3);
      }
    }
    translate$1(dragGroup, event2.dx, event2.dy);
  });
  eventBus.on(["shape.move.out", "shape.move.cleanup"], function(event2) {
    var context = event2.context, target = context.target;
    if (target) {
      setMarker(target, null);
    }
  });
  eventBus.on("shape.move.cleanup", function(event2) {
    var context = event2.context, allDraggedElements = context.allDraggedElements, dragGroup = context.dragGroup;
    forEach(allDraggedElements, function(e2) {
      canvas.removeMarker(e2, MARKER_DRAGGING$1);
    });
    if (dragGroup) {
      remove$1(dragGroup);
    }
  });
  this.makeDraggable = makeDraggable;
}
MovePreview.$inject = [
  "eventBus",
  "canvas",
  "styles",
  "previewSupport"
];
function removeEdges(elements) {
  var filteredElements = filter(elements, function(element) {
    if (!isConnection$1(element)) {
      return true;
    } else {
      return find(elements, matchPattern({ id: element.source.id })) && find(elements, matchPattern({ id: element.target.id }));
    }
  });
  return filteredElements;
}
function haveDifferentParents(elements) {
  return size(groupBy(elements, function(e2) {
    return e2.parent && e2.parent.id;
  })) !== 1;
}
const MoveModule = {
  __depends__: [
    InteractionEventsModule,
    SelectionModule,
    OutlineModule,
    RulesModule,
    DraggingModule,
    PreviewSupportModule
  ],
  __init__: [
    "move",
    "movePreview"
  ],
  move: ["type", MoveEvents],
  movePreview: ["type", MovePreview]
};
function pointDistance(a2, b) {
  if (!a2 || !b) {
    return -1;
  }
  return Math.sqrt(
    Math.pow(a2.x - b.x, 2) + Math.pow(a2.y - b.y, 2)
  );
}
function pointsOnLine(p2, q2, r2, accuracy) {
  if (typeof accuracy === "undefined") {
    accuracy = 5;
  }
  if (!p2 || !q2 || !r2) {
    return false;
  }
  var val = (q2.x - p2.x) * (r2.y - p2.y) - (q2.y - p2.y) * (r2.x - p2.x), dist = pointDistance(p2, q2);
  return Math.abs(val / dist) <= accuracy;
}
var ALIGNED_THRESHOLD = 2;
function pointsAligned(a2, b) {
  var points = Array.from(arguments).flat();
  const axisMap = {
    "x": "v",
    "y": "h"
  };
  for (const [axis, orientation] of Object.entries(axisMap)) {
    if (pointsAlignedOnAxis(axis, points)) {
      return orientation;
    }
  }
  return false;
}
function pointsAlignedOnAxis(axis, points) {
  const referencePoint = points[0];
  return every(points, function(point) {
    return Math.abs(referencePoint[axis] - point[axis]) <= ALIGNED_THRESHOLD;
  });
}
function getMidPoint(p2, q2) {
  return {
    x: Math.round(p2.x + (q2.x - p2.x) / 2),
    y: Math.round(p2.y + (q2.y - p2.y) / 2)
  };
}
var p2s = /,?([a-z]),?/gi, toFloat = parseFloat, math = Math, PI = math.PI, mmin = math.min, mmax = math.max, pow = math.pow, abs$3 = math.abs, pathCommand = /([a-z])[\s,]*((-?\d*\.?\d*(?:e[-+]?\d+)?[\s]*,?[\s]*)+)/ig, pathValues = /(-?\d*\.?\d*(?:e[-+]?\d+)?)[\s]*,?[\s]*/ig;
var isArray = Array.isArray || function(o2) {
  return o2 instanceof Array;
};
function hasProperty(obj, property) {
  return Object.prototype.hasOwnProperty.call(obj, property);
}
function clone(obj) {
  if (typeof obj == "function" || Object(obj) !== obj) {
    return obj;
  }
  var res = new obj.constructor();
  for (var key in obj) {
    if (hasProperty(obj, key)) {
      res[key] = clone(obj[key]);
    }
  }
  return res;
}
function repush(array, item) {
  for (var i2 = 0, ii = array.length; i2 < ii; i2++) if (array[i2] === item) {
    return array.push(array.splice(i2, 1)[0]);
  }
}
function cacher(f2) {
  function newf() {
    var arg = Array.prototype.slice.call(arguments, 0), args = arg.join("␀"), cache = newf.cache = newf.cache || {}, count = newf.count = newf.count || [];
    if (hasProperty(cache, args)) {
      repush(count, args);
      return cache[args];
    }
    count.length >= 1e3 && delete cache[count.shift()];
    count.push(args);
    cache[args] = f2(...arguments);
    return cache[args];
  }
  return newf;
}
function parsePathString(pathString) {
  if (!pathString) {
    return null;
  }
  var pth = paths(pathString);
  if (pth.arr) {
    return clone(pth.arr);
  }
  var paramCounts = { a: 7, c: 6, h: 1, l: 2, m: 2, q: 4, s: 4, t: 2, v: 1, z: 0 }, data = [];
  if (isArray(pathString) && isArray(pathString[0])) {
    data = clone(pathString);
  }
  if (!data.length) {
    String(pathString).replace(pathCommand, function(a2, b, c2) {
      var params = [], name = b.toLowerCase();
      c2.replace(pathValues, function(a3, b2) {
        b2 && params.push(+b2);
      });
      if (name == "m" && params.length > 2) {
        data.push([b, ...params.splice(0, 2)]);
        name = "l";
        b = b == "m" ? "l" : "L";
      }
      while (params.length >= paramCounts[name]) {
        data.push([b, ...params.splice(0, paramCounts[name])]);
        if (!paramCounts[name]) {
          break;
        }
      }
    });
  }
  data.toString = paths.toString;
  pth.arr = clone(data);
  return data;
}
function paths(ps) {
  var p2 = paths.ps = paths.ps || {};
  if (p2[ps]) {
    p2[ps].sleep = 100;
  } else {
    p2[ps] = {
      sleep: 100
    };
  }
  setTimeout(function() {
    for (var key in p2) {
      if (hasProperty(p2, key) && key != ps) {
        p2[key].sleep--;
        !p2[key].sleep && delete p2[key];
      }
    }
  });
  return p2[ps];
}
function rectBBox(x2, y2, width, height) {
  if (arguments.length === 1) {
    y2 = x2.y;
    width = x2.width;
    height = x2.height;
    x2 = x2.x;
  }
  return {
    x: x2,
    y: y2,
    width,
    height,
    x2: x2 + width,
    y2: y2 + height
  };
}
function pathToString() {
  return this.join(",").replace(p2s, "$1");
}
function pathClone(pathArray) {
  var res = clone(pathArray);
  res.toString = pathToString;
  return res;
}
function findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t2) {
  var t1 = 1 - t2, t13 = pow(t1, 3), t12 = pow(t1, 2), t22 = t2 * t2, t3 = t22 * t2, x2 = t13 * p1x + t12 * 3 * t2 * c1x + t1 * 3 * t2 * t2 * c2x + t3 * p2x, y2 = t13 * p1y + t12 * 3 * t2 * c1y + t1 * 3 * t2 * t2 * c2y + t3 * p2y;
  return {
    x: fixError(x2),
    y: fixError(y2)
  };
}
function bezierBBox(points) {
  var bbox = curveBBox(...points);
  return rectBBox(
    bbox.x0,
    bbox.y0,
    bbox.x1 - bbox.x0,
    bbox.y1 - bbox.y0
  );
}
function isPointInsideBBox(bbox, x2, y2) {
  return x2 >= bbox.x && x2 <= bbox.x + bbox.width && y2 >= bbox.y && y2 <= bbox.y + bbox.height;
}
function isBBoxIntersect(bbox1, bbox2) {
  bbox1 = rectBBox(bbox1);
  bbox2 = rectBBox(bbox2);
  return isPointInsideBBox(bbox2, bbox1.x, bbox1.y) || isPointInsideBBox(bbox2, bbox1.x2, bbox1.y) || isPointInsideBBox(bbox2, bbox1.x, bbox1.y2) || isPointInsideBBox(bbox2, bbox1.x2, bbox1.y2) || isPointInsideBBox(bbox1, bbox2.x, bbox2.y) || isPointInsideBBox(bbox1, bbox2.x2, bbox2.y) || isPointInsideBBox(bbox1, bbox2.x, bbox2.y2) || isPointInsideBBox(bbox1, bbox2.x2, bbox2.y2) || (bbox1.x < bbox2.x2 && bbox1.x > bbox2.x || bbox2.x < bbox1.x2 && bbox2.x > bbox1.x) && (bbox1.y < bbox2.y2 && bbox1.y > bbox2.y || bbox2.y < bbox1.y2 && bbox2.y > bbox1.y);
}
function base3(t2, p1, p2, p3, p4) {
  var t1 = -3 * p1 + 9 * p2 - 9 * p3 + 3 * p4, t22 = t2 * t1 + 6 * p1 - 12 * p2 + 6 * p3;
  return t2 * t22 - 3 * p1 + 3 * p2;
}
function bezlen(x1, y1, x2, y2, x3, y3, x4, y4, z2) {
  if (z2 == null) {
    z2 = 1;
  }
  z2 = z2 > 1 ? 1 : z2 < 0 ? 0 : z2;
  var z22 = z2 / 2, n2 = 12, Tvalues = [-0.1252, 0.1252, -0.3678, 0.3678, -0.5873, 0.5873, -0.7699, 0.7699, -0.9041, 0.9041, -0.9816, 0.9816], Cvalues = [0.2491, 0.2491, 0.2335, 0.2335, 0.2032, 0.2032, 0.1601, 0.1601, 0.1069, 0.1069, 0.0472, 0.0472], sum = 0;
  for (var i2 = 0; i2 < n2; i2++) {
    var ct = z22 * Tvalues[i2] + z22, xbase = base3(ct, x1, x2, x3, x4), ybase = base3(ct, y1, y2, y3, y4), comb = xbase * xbase + ybase * ybase;
    sum += Cvalues[i2] * math.sqrt(comb);
  }
  return z22 * sum;
}
function intersectLines(x1, y1, x2, y2, x3, y3, x4, y4) {
  if (mmax(x1, x2) < mmin(x3, x4) || mmin(x1, x2) > mmax(x3, x4) || mmax(y1, y2) < mmin(y3, y4) || mmin(y1, y2) > mmax(y3, y4)) {
    return;
  }
  var nx = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4), ny = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4), denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (!denominator) {
    return;
  }
  var px = fixError(nx / denominator), py = fixError(ny / denominator), px2 = +px.toFixed(2), py2 = +py.toFixed(2);
  if (px2 < +mmin(x1, x2).toFixed(2) || px2 > +mmax(x1, x2).toFixed(2) || px2 < +mmin(x3, x4).toFixed(2) || px2 > +mmax(x3, x4).toFixed(2) || py2 < +mmin(y1, y2).toFixed(2) || py2 > +mmax(y1, y2).toFixed(2) || py2 < +mmin(y3, y4).toFixed(2) || py2 > +mmax(y3, y4).toFixed(2)) {
    return;
  }
  return { x: px, y: py };
}
function fixError(number) {
  return Math.round(number * 1e11) / 1e11;
}
function findBezierIntersections(bez1, bez2, justCount) {
  var bbox1 = bezierBBox(bez1), bbox2 = bezierBBox(bez2);
  if (!isBBoxIntersect(bbox1, bbox2)) {
    return [];
  }
  var l1 = bezlen(...bez1), l2 = bezlen(...bez2), n1 = isLine(bez1) ? 1 : ~~(l1 / 5) || 1, n2 = isLine(bez2) ? 1 : ~~(l2 / 5) || 1, dots1 = [], dots2 = [], xy = {}, res = [];
  for (var i2 = 0; i2 < n1 + 1; i2++) {
    var p2 = findDotsAtSegment(...bez1, i2 / n1);
    dots1.push({ x: p2.x, y: p2.y, t: i2 / n1 });
  }
  for (i2 = 0; i2 < n2 + 1; i2++) {
    p2 = findDotsAtSegment(...bez2, i2 / n2);
    dots2.push({ x: p2.x, y: p2.y, t: i2 / n2 });
  }
  for (i2 = 0; i2 < n1; i2++) {
    for (var j2 = 0; j2 < n2; j2++) {
      var di = dots1[i2], di1 = dots1[i2 + 1], dj = dots2[j2], dj1 = dots2[j2 + 1], ci = abs$3(di1.x - di.x) < 0.01 ? "y" : "x", cj = abs$3(dj1.x - dj.x) < 0.01 ? "y" : "x", is2 = intersectLines(di.x, di.y, di1.x, di1.y, dj.x, dj.y, dj1.x, dj1.y), key;
      if (is2) {
        key = is2.x.toFixed(9) + "#" + is2.y.toFixed(9);
        if (xy[key]) {
          continue;
        }
        xy[key] = true;
        var t1 = di.t + abs$3((is2[ci] - di[ci]) / (di1[ci] - di[ci])) * (di1.t - di.t), t2 = dj.t + abs$3((is2[cj] - dj[cj]) / (dj1[cj] - dj[cj])) * (dj1.t - dj.t);
        if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
          {
            res.push({
              x: is2.x,
              y: is2.y,
              t1,
              t2
            });
          }
        }
      }
    }
  }
  return res;
}
function findPathIntersections(path1, path2, justCount) {
  path1 = pathToCurve(path1);
  path2 = pathToCurve(path2);
  var x1, y1, x2, y2, x1m, y1m, x2m, y2m, bez1, bez2, res = justCount ? 0 : [];
  for (var i2 = 0, ii = path1.length; i2 < ii; i2++) {
    var pi = path1[i2];
    if (pi[0] == "M") {
      x1 = x1m = pi[1];
      y1 = y1m = pi[2];
    } else {
      if (pi[0] == "C") {
        bez1 = [x1, y1, ...pi.slice(1)];
        x1 = bez1[6];
        y1 = bez1[7];
      } else {
        bez1 = [x1, y1, x1, y1, x1m, y1m, x1m, y1m];
        x1 = x1m;
        y1 = y1m;
      }
      for (var j2 = 0, jj = path2.length; j2 < jj; j2++) {
        var pj = path2[j2];
        if (pj[0] == "M") {
          x2 = x2m = pj[1];
          y2 = y2m = pj[2];
        } else {
          if (pj[0] == "C") {
            bez2 = [x2, y2, ...pj.slice(1)];
            x2 = bez2[6];
            y2 = bez2[7];
          } else {
            bez2 = [x2, y2, x2, y2, x2m, y2m, x2m, y2m];
            x2 = x2m;
            y2 = y2m;
          }
          var intr = findBezierIntersections(bez1, bez2);
          {
            for (var k2 = 0, kk = intr.length; k2 < kk; k2++) {
              intr[k2].segment1 = i2;
              intr[k2].segment2 = j2;
              intr[k2].bez1 = bez1;
              intr[k2].bez2 = bez2;
            }
            res = res.concat(intr);
          }
        }
      }
    }
  }
  return res;
}
function pathToAbsolute(pathArray) {
  var pth = paths(pathArray);
  if (pth.abs) {
    return pathClone(pth.abs);
  }
  if (!isArray(pathArray) || !isArray(pathArray && pathArray[0])) {
    pathArray = parsePathString(pathArray);
  }
  if (!pathArray || !pathArray.length) {
    return [["M", 0, 0]];
  }
  var res = [], x2 = 0, y2 = 0, mx = 0, my = 0, start = 0, pa0;
  if (pathArray[0][0] == "M") {
    x2 = +pathArray[0][1];
    y2 = +pathArray[0][2];
    mx = x2;
    my = y2;
    start++;
    res[0] = ["M", x2, y2];
  }
  for (var r2, pa, i2 = start, ii = pathArray.length; i2 < ii; i2++) {
    res.push(r2 = []);
    pa = pathArray[i2];
    pa0 = pa[0];
    if (pa0 != pa0.toUpperCase()) {
      r2[0] = pa0.toUpperCase();
      switch (r2[0]) {
        case "A":
          r2[1] = pa[1];
          r2[2] = pa[2];
          r2[3] = pa[3];
          r2[4] = pa[4];
          r2[5] = pa[5];
          r2[6] = +pa[6] + x2;
          r2[7] = +pa[7] + y2;
          break;
        case "V":
          r2[1] = +pa[1] + y2;
          break;
        case "H":
          r2[1] = +pa[1] + x2;
          break;
        case "M":
          mx = +pa[1] + x2;
          my = +pa[2] + y2;
        default:
          for (var j2 = 1, jj = pa.length; j2 < jj; j2++) {
            r2[j2] = +pa[j2] + (j2 % 2 ? x2 : y2);
          }
      }
    } else {
      for (var k2 = 0, kk = pa.length; k2 < kk; k2++) {
        r2[k2] = pa[k2];
      }
    }
    pa0 = pa0.toUpperCase();
    switch (r2[0]) {
      case "Z":
        x2 = +mx;
        y2 = +my;
        break;
      case "H":
        x2 = r2[1];
        break;
      case "V":
        y2 = r2[1];
        break;
      case "M":
        mx = r2[r2.length - 2];
        my = r2[r2.length - 1];
      default:
        x2 = r2[r2.length - 2];
        y2 = r2[r2.length - 1];
    }
  }
  res.toString = pathToString;
  pth.abs = pathClone(res);
  return res;
}
function isLine(bez) {
  return bez[0] === bez[2] && bez[1] === bez[3] && bez[4] === bez[6] && bez[5] === bez[7];
}
function lineToCurve(x1, y1, x2, y2) {
  return [
    x1,
    y1,
    x2,
    y2,
    x2,
    y2
  ];
}
function qubicToCurve(x1, y1, ax, ay, x2, y2) {
  var _13 = 1 / 3, _23 = 2 / 3;
  return [
    _13 * x1 + _23 * ax,
    _13 * y1 + _23 * ay,
    _13 * x2 + _23 * ax,
    _13 * y2 + _23 * ay,
    x2,
    y2
  ];
}
function arcToCurve(x1, y1, rx, ry, angle, large_arc_flag, sweep_flag, x2, y2, recursive) {
  var _120 = PI * 120 / 180, rad = PI / 180 * (+angle || 0), res = [], xy, rotate2 = cacher(function(x4, y4, rad2) {
    var X = x4 * math.cos(rad2) - y4 * math.sin(rad2), Y = x4 * math.sin(rad2) + y4 * math.cos(rad2);
    return { x: X, y: Y };
  });
  if (!recursive) {
    xy = rotate2(x1, y1, -rad);
    x1 = xy.x;
    y1 = xy.y;
    xy = rotate2(x2, y2, -rad);
    x2 = xy.x;
    y2 = xy.y;
    var x3 = (x1 - x2) / 2, y3 = (y1 - y2) / 2;
    var h2 = x3 * x3 / (rx * rx) + y3 * y3 / (ry * ry);
    if (h2 > 1) {
      h2 = math.sqrt(h2);
      rx = h2 * rx;
      ry = h2 * ry;
    }
    var rx2 = rx * rx, ry2 = ry * ry, k2 = (large_arc_flag == sweep_flag ? -1 : 1) * math.sqrt(abs$3((rx2 * ry2 - rx2 * y3 * y3 - ry2 * x3 * x3) / (rx2 * y3 * y3 + ry2 * x3 * x3))), cx = k2 * rx * y3 / ry + (x1 + x2) / 2, cy = k2 * -ry * x3 / rx + (y1 + y2) / 2, f1 = math.asin(((y1 - cy) / ry).toFixed(9)), f2 = math.asin(((y2 - cy) / ry).toFixed(9));
    f1 = x1 < cx ? PI - f1 : f1;
    f2 = x2 < cx ? PI - f2 : f2;
    f1 < 0 && (f1 = PI * 2 + f1);
    f2 < 0 && (f2 = PI * 2 + f2);
    if (sweep_flag && f1 > f2) {
      f1 = f1 - PI * 2;
    }
    if (!sweep_flag && f2 > f1) {
      f2 = f2 - PI * 2;
    }
  } else {
    f1 = recursive[0];
    f2 = recursive[1];
    cx = recursive[2];
    cy = recursive[3];
  }
  var df = f2 - f1;
  if (abs$3(df) > _120) {
    var f2old = f2, x2old = x2, y2old = y2;
    f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1);
    x2 = cx + rx * math.cos(f2);
    y2 = cy + ry * math.sin(f2);
    res = arcToCurve(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old, [f2, f2old, cx, cy]);
  }
  df = f2 - f1;
  var c1 = math.cos(f1), s1 = math.sin(f1), c2 = math.cos(f2), s2 = math.sin(f2), t2 = math.tan(df / 4), hx = 4 / 3 * rx * t2, hy = 4 / 3 * ry * t2, m1 = [x1, y1], m2 = [x1 + hx * s1, y1 - hy * c1], m3 = [x2 + hx * s2, y2 - hy * c2], m4 = [x2, y2];
  m2[0] = 2 * m1[0] - m2[0];
  m2[1] = 2 * m1[1] - m2[1];
  if (recursive) {
    return [m2, m3, m4].concat(res);
  } else {
    res = [m2, m3, m4].concat(res).join().split(",");
    var newres = [];
    for (var i2 = 0, ii = res.length; i2 < ii; i2++) {
      newres[i2] = i2 % 2 ? rotate2(res[i2 - 1], res[i2], rad).y : rotate2(res[i2], res[i2 + 1], rad).x;
    }
    return newres;
  }
}
function curveBBox(x0, y0, x1, y1, x2, y2, x3, y3) {
  var tvalues = [], bounds = [[], []], a2, b, c2, t2, t1, t22, b2ac, sqrtb2ac;
  for (var i2 = 0; i2 < 2; ++i2) {
    if (i2 == 0) {
      b = 6 * x0 - 12 * x1 + 6 * x2;
      a2 = -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3;
      c2 = 3 * x1 - 3 * x0;
    } else {
      b = 6 * y0 - 12 * y1 + 6 * y2;
      a2 = -3 * y0 + 9 * y1 - 9 * y2 + 3 * y3;
      c2 = 3 * y1 - 3 * y0;
    }
    if (abs$3(a2) < 1e-12) {
      if (abs$3(b) < 1e-12) {
        continue;
      }
      t2 = -c2 / b;
      if (0 < t2 && t2 < 1) {
        tvalues.push(t2);
      }
      continue;
    }
    b2ac = b * b - 4 * c2 * a2;
    sqrtb2ac = math.sqrt(b2ac);
    if (b2ac < 0) {
      continue;
    }
    t1 = (-b + sqrtb2ac) / (2 * a2);
    if (0 < t1 && t1 < 1) {
      tvalues.push(t1);
    }
    t22 = (-b - sqrtb2ac) / (2 * a2);
    if (0 < t22 && t22 < 1) {
      tvalues.push(t22);
    }
  }
  var j2 = tvalues.length, jlen = j2, mt;
  while (j2--) {
    t2 = tvalues[j2];
    mt = 1 - t2;
    bounds[0][j2] = mt * mt * mt * x0 + 3 * mt * mt * t2 * x1 + 3 * mt * t2 * t2 * x2 + t2 * t2 * t2 * x3;
    bounds[1][j2] = mt * mt * mt * y0 + 3 * mt * mt * t2 * y1 + 3 * mt * t2 * t2 * y2 + t2 * t2 * t2 * y3;
  }
  bounds[0][jlen] = x0;
  bounds[1][jlen] = y0;
  bounds[0][jlen + 1] = x3;
  bounds[1][jlen + 1] = y3;
  bounds[0].length = bounds[1].length = jlen + 2;
  return {
    x0: mmin(...bounds[0]),
    y0: mmin(...bounds[1]),
    x1: mmax(...bounds[0]),
    y1: mmax(...bounds[1])
  };
}
function pathToCurve(path) {
  var pth = paths(path);
  if (pth.curve) {
    return pathClone(pth.curve);
  }
  var curvedPath = pathToAbsolute(path), attrs = { x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null }, processPath = function(path2, d2, pathCommand3) {
    var nx, ny;
    if (!path2) {
      return ["C", d2.x, d2.y, d2.x, d2.y, d2.x, d2.y];
    }
    !(path2[0] in { T: 1, Q: 1 }) && (d2.qx = d2.qy = null);
    switch (path2[0]) {
      case "M":
        d2.X = path2[1];
        d2.Y = path2[2];
        break;
      case "A":
        path2 = ["C", ...arcToCurve(d2.x, d2.y, ...path2.slice(1))];
        break;
      case "S":
        if (pathCommand3 == "C" || pathCommand3 == "S") {
          nx = d2.x * 2 - d2.bx;
          ny = d2.y * 2 - d2.by;
        } else {
          nx = d2.x;
          ny = d2.y;
        }
        path2 = ["C", nx, ny, ...path2.slice(1)];
        break;
      case "T":
        if (pathCommand3 == "Q" || pathCommand3 == "T") {
          d2.qx = d2.x * 2 - d2.qx;
          d2.qy = d2.y * 2 - d2.qy;
        } else {
          d2.qx = d2.x;
          d2.qy = d2.y;
        }
        path2 = ["C", ...qubicToCurve(d2.x, d2.y, d2.qx, d2.qy, path2[1], path2[2])];
        break;
      case "Q":
        d2.qx = path2[1];
        d2.qy = path2[2];
        path2 = ["C", ...qubicToCurve(d2.x, d2.y, path2[1], path2[2], path2[3], path2[4])];
        break;
      case "L":
        path2 = ["C", ...lineToCurve(d2.x, d2.y, path2[1], path2[2])];
        break;
      case "H":
        path2 = ["C", ...lineToCurve(d2.x, d2.y, path2[1], d2.y)];
        break;
      case "V":
        path2 = ["C", ...lineToCurve(d2.x, d2.y, d2.x, path2[1])];
        break;
      case "Z":
        path2 = ["C", ...lineToCurve(d2.x, d2.y, d2.X, d2.Y)];
        break;
    }
    return path2;
  }, fixArc = function(pp, i3) {
    if (pp[i3].length > 7) {
      pp[i3].shift();
      var pi = pp[i3];
      while (pi.length) {
        pathCommands[i3] = "A";
        pp.splice(i3++, 0, ["C", ...pi.splice(0, 6)]);
      }
      pp.splice(i3, 1);
      ii = curvedPath.length;
    }
  }, pathCommands = [], pfirst = "", pathCommand2 = "";
  for (var i2 = 0, ii = curvedPath.length; i2 < ii; i2++) {
    curvedPath[i2] && (pfirst = curvedPath[i2][0]);
    if (pfirst != "C") {
      pathCommands[i2] = pfirst;
      i2 && (pathCommand2 = pathCommands[i2 - 1]);
    }
    curvedPath[i2] = processPath(curvedPath[i2], attrs, pathCommand2);
    if (pathCommands[i2] != "A" && pfirst == "C") pathCommands[i2] = "C";
    fixArc(curvedPath, i2);
    var seg = curvedPath[i2], seglen = seg.length;
    attrs.x = seg[seglen - 2];
    attrs.y = seg[seglen - 1];
    attrs.bx = toFloat(seg[seglen - 4]) || attrs.x;
    attrs.by = toFloat(seg[seglen - 3]) || attrs.y;
  }
  pth.curve = pathClone(curvedPath);
  return curvedPath;
}
var round$6 = Math.round, max$2 = Math.max;
function circlePath(center2, r2) {
  var x2 = center2.x, y2 = center2.y;
  return [
    ["M", x2, y2],
    ["m", 0, -10],
    ["a", r2, r2, 0, 1, 1, 0, 2 * r2],
    ["a", r2, r2, 0, 1, 1, 0, -2 * r2],
    ["z"]
  ];
}
function linePath(points) {
  var segments = [];
  points.forEach(function(p2, idx) {
    segments.push([idx === 0 ? "M" : "L", p2.x, p2.y]);
  });
  return segments;
}
var INTERSECTION_THRESHOLD = 10;
function getBendpointIntersection(waypoints, reference) {
  var i2, w2;
  for (i2 = 0; w2 = waypoints[i2]; i2++) {
    if (pointDistance(w2, reference) <= INTERSECTION_THRESHOLD) {
      return {
        point: waypoints[i2],
        bendpoint: true,
        index: i2
      };
    }
  }
  return null;
}
function getPathIntersection(waypoints, reference) {
  var intersections = findPathIntersections(circlePath(reference, INTERSECTION_THRESHOLD), linePath(waypoints));
  var a2 = intersections[0], b = intersections[intersections.length - 1], idx;
  if (!a2) {
    return null;
  }
  if (a2 !== b) {
    if (a2.segment2 !== b.segment2) {
      idx = max$2(a2.segment2, b.segment2) - 1;
      return {
        point: waypoints[idx],
        bendpoint: true,
        index: idx
      };
    }
    return {
      point: {
        x: round$6(a2.x + b.x) / 2,
        y: round$6(a2.y + b.y) / 2
      },
      index: a2.segment2
    };
  }
  return {
    point: {
      x: round$6(a2.x),
      y: round$6(a2.y)
    },
    index: a2.segment2
  };
}
function getApproxIntersection(waypoints, reference) {
  return getBendpointIntersection(waypoints, reference) || getPathIntersection(waypoints, reference);
}
function vectorLength(vector) {
  return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
}
function solveLambaSystem(a2, b, c2) {
  var system = [
    { n: a2[0] - c2[0], lambda: b[0] },
    { n: a2[1] - c2[1], lambda: b[1] }
  ];
  var n2 = system[0].n * b[0] + system[1].n * b[1], l2 = system[0].lambda * b[0] + system[1].lambda * b[1];
  return -n2 / l2;
}
function perpendicularFoot(point, line) {
  var a2 = line[0], b = line[1];
  var bd = { x: b.x - a2.x, y: b.y - a2.y };
  var r2 = solveLambaSystem([a2.x, a2.y], [bd.x, bd.y], [point.x, point.y]);
  return { x: a2.x + r2 * bd.x, y: a2.y + r2 * bd.y };
}
function getDistancePointLine(point, line) {
  var pfPoint = perpendicularFoot(point, line);
  var connectionVector = {
    x: pfPoint.x - point.x,
    y: pfPoint.y - point.y
  };
  return vectorLength(connectionVector);
}
var BENDPOINT_CLS = "djs-bendpoint";
var SEGMENT_DRAGGER_CLS = "djs-segment-dragger";
function toCanvasCoordinates(canvas, event2) {
  var position = toPoint(event2), clientRect = canvas._container.getBoundingClientRect(), offset;
  offset = {
    x: clientRect.left,
    y: clientRect.top
  };
  var viewbox = canvas.viewbox();
  return {
    x: viewbox.x + (position.x - offset.x) / viewbox.scale,
    y: viewbox.y + (position.y - offset.y) / viewbox.scale
  };
}
function getConnectionIntersection(canvas, waypoints, event2) {
  var localPosition = toCanvasCoordinates(canvas, event2), intersection = getApproxIntersection(waypoints, localPosition);
  return intersection;
}
function addBendpoint(parentGfx, cls) {
  var groupGfx = create$1("g");
  classes$1(groupGfx).add(BENDPOINT_CLS);
  append(parentGfx, groupGfx);
  var visual = create$1("circle");
  attr(visual, {
    cx: 0,
    cy: 0,
    r: 4
  });
  classes$1(visual).add("djs-visual");
  append(groupGfx, visual);
  var hit = create$1("circle");
  attr(hit, {
    cx: 0,
    cy: 0,
    r: 10
  });
  classes$1(hit).add("djs-hit");
  append(groupGfx, hit);
  if (cls) {
    classes$1(groupGfx).add(cls);
  }
  return groupGfx;
}
function createParallelDragger(parentGfx, segmentStart, segmentEnd, alignment) {
  var draggerGfx = create$1("g");
  append(parentGfx, draggerGfx);
  var width = 18, height = 6, padding = 11, hitWidth = calculateHitWidth(segmentStart, segmentEnd, alignment), hitHeight = height + padding;
  var visual = create$1("rect");
  attr(visual, {
    x: -18 / 2,
    y: -6 / 2,
    width,
    height
  });
  classes$1(visual).add("djs-visual");
  append(draggerGfx, visual);
  var hit = create$1("rect");
  attr(hit, {
    x: -hitWidth / 2,
    y: -17 / 2,
    width: hitWidth,
    height: hitHeight
  });
  classes$1(hit).add("djs-hit");
  append(draggerGfx, hit);
  rotate(draggerGfx, alignment === "v" ? 90 : 0);
  return draggerGfx;
}
function addSegmentDragger(parentGfx, segmentStart, segmentEnd) {
  var groupGfx = create$1("g"), mid2 = getMidPoint(segmentStart, segmentEnd), alignment = pointsAligned(segmentStart, segmentEnd);
  append(parentGfx, groupGfx);
  createParallelDragger(groupGfx, segmentStart, segmentEnd, alignment);
  classes$1(groupGfx).add(SEGMENT_DRAGGER_CLS);
  classes$1(groupGfx).add(alignment === "h" ? "horizontal" : "vertical");
  translate$1(groupGfx, mid2.x, mid2.y);
  return groupGfx;
}
function calculateSegmentMoveRegion(segmentLength) {
  return Math.abs(Math.round(segmentLength * 2 / 3));
}
function getClosestPointOnConnection(position, connection) {
  var segment = getClosestSegment(position, connection);
  return perpendicularFoot(position, segment);
}
function calculateHitWidth(segmentStart, segmentEnd, alignment) {
  var segmentLengthXAxis = segmentEnd.x - segmentStart.x, segmentLengthYAxis = segmentEnd.y - segmentStart.y;
  return alignment === "h" ? calculateSegmentMoveRegion(segmentLengthXAxis) : calculateSegmentMoveRegion(segmentLengthYAxis);
}
function getClosestSegment(position, connection) {
  var waypoints = connection.waypoints;
  var minDistance = Infinity, segmentIndex;
  for (var i2 = 0; i2 < waypoints.length - 1; i2++) {
    var start = waypoints[i2], end = waypoints[i2 + 1], distance2 = getDistancePointLine(position, [start, end]);
    if (distance2 < minDistance) {
      minDistance = distance2;
      segmentIndex = i2;
    }
  }
  return [waypoints[segmentIndex], waypoints[segmentIndex + 1]];
}
function escapeCSS(str) {
  return CSS.escape(str);
}
function Bendpoints(eventBus, canvas, interactionEvents, bendpointMove, connectionSegmentMove) {
  function isIntersectionMiddle(intersection, waypoints, treshold) {
    var idx = intersection.index, p2 = intersection.point, p0, p1, mid2, aligned, xDelta, yDelta;
    if (idx <= 0 || intersection.bendpoint) {
      return false;
    }
    p0 = waypoints[idx - 1];
    p1 = waypoints[idx];
    mid2 = getMidPoint(p0, p1), aligned = pointsAligned(p0, p1);
    xDelta = Math.abs(p2.x - mid2.x);
    yDelta = Math.abs(p2.y - mid2.y);
    return aligned && xDelta <= treshold && yDelta <= treshold;
  }
  function calculateIntersectionThreshold(connection, intersection) {
    var waypoints = connection.waypoints, relevantSegment, alignment, segmentLength, threshold;
    if (intersection.index <= 0 || intersection.bendpoint) {
      return null;
    }
    relevantSegment = {
      start: waypoints[intersection.index - 1],
      end: waypoints[intersection.index]
    };
    alignment = pointsAligned(relevantSegment.start, relevantSegment.end);
    if (!alignment) {
      return null;
    }
    if (alignment === "h") {
      segmentLength = relevantSegment.end.x - relevantSegment.start.x;
    } else {
      segmentLength = relevantSegment.end.y - relevantSegment.start.y;
    }
    threshold = calculateSegmentMoveRegion(segmentLength) / 2;
    return threshold;
  }
  function activateBendpointMove(event2, connection) {
    var waypoints = connection.waypoints, intersection = getConnectionIntersection(canvas, waypoints, event2), threshold;
    if (!intersection) {
      return;
    }
    threshold = calculateIntersectionThreshold(connection, intersection);
    if (isIntersectionMiddle(intersection, waypoints, threshold)) {
      connectionSegmentMove.start(event2, connection, intersection.index);
    } else {
      bendpointMove.start(event2, connection, intersection.index, !intersection.bendpoint);
    }
    return true;
  }
  function bindInteractionEvents(node, eventName, element) {
    event.bind(node, eventName, function(event2) {
      interactionEvents.triggerMouseEvent(eventName, event2, element);
      event2.stopPropagation();
    });
  }
  function getBendpointsContainer(element, create2) {
    var layer = canvas.getLayer("overlays"), gfx = query('.djs-bendpoints[data-element-id="' + escapeCSS(element.id) + '"]', layer);
    if (!gfx && create2) {
      gfx = create$1("g");
      attr(gfx, { "data-element-id": element.id });
      classes$1(gfx).add("djs-bendpoints");
      append(layer, gfx);
      bindInteractionEvents(gfx, "mousedown", element);
      bindInteractionEvents(gfx, "click", element);
      bindInteractionEvents(gfx, "dblclick", element);
    }
    return gfx;
  }
  function getSegmentDragger(idx, parentGfx) {
    return query(
      '.djs-segment-dragger[data-segment-idx="' + idx + '"]',
      parentGfx
    );
  }
  function createBendpoints(gfx, connection) {
    connection.waypoints.forEach(function(p2, idx) {
      var bendpoint = addBendpoint(gfx);
      append(gfx, bendpoint);
      translate$1(bendpoint, p2.x, p2.y);
    });
    addBendpoint(gfx, "floating");
  }
  function createSegmentDraggers(gfx, connection) {
    var waypoints = connection.waypoints;
    var segmentStart, segmentEnd, segmentDraggerGfx;
    for (var i2 = 1; i2 < waypoints.length; i2++) {
      segmentStart = waypoints[i2 - 1];
      segmentEnd = waypoints[i2];
      if (pointsAligned(segmentStart, segmentEnd)) {
        segmentDraggerGfx = addSegmentDragger(gfx, segmentStart, segmentEnd);
        attr(segmentDraggerGfx, { "data-segment-idx": i2 });
        bindInteractionEvents(segmentDraggerGfx, "mousemove", connection);
      }
    }
  }
  function clearBendpoints(gfx) {
    forEach(queryAll("." + BENDPOINT_CLS, gfx), function(node) {
      remove$1(node);
    });
  }
  function clearSegmentDraggers(gfx) {
    forEach(queryAll("." + SEGMENT_DRAGGER_CLS, gfx), function(node) {
      remove$1(node);
    });
  }
  function addHandles(connection) {
    var gfx = getBendpointsContainer(connection);
    if (!gfx) {
      gfx = getBendpointsContainer(connection, true);
      createBendpoints(gfx, connection);
      createSegmentDraggers(gfx, connection);
    }
    return gfx;
  }
  function updateHandles(connection) {
    var gfx = getBendpointsContainer(connection);
    if (gfx) {
      clearSegmentDraggers(gfx);
      clearBendpoints(gfx);
      createSegmentDraggers(gfx, connection);
      createBendpoints(gfx, connection);
    }
  }
  function updateFloatingBendpointPosition(parentGfx, intersection) {
    var floating = query(".floating", parentGfx), point = intersection.point;
    if (!floating) {
      return;
    }
    translate$1(floating, point.x, point.y);
  }
  function updateSegmentDraggerPosition(parentGfx, intersection, waypoints) {
    var draggerGfx = getSegmentDragger(intersection.index, parentGfx), segmentStart = waypoints[intersection.index - 1], segmentEnd = waypoints[intersection.index], point = intersection.point, mid2 = getMidPoint(segmentStart, segmentEnd), alignment = pointsAligned(segmentStart, segmentEnd), draggerVisual, relativePosition;
    if (!draggerGfx) {
      return;
    }
    draggerVisual = getDraggerVisual(draggerGfx);
    relativePosition = {
      x: point.x - mid2.x,
      y: point.y - mid2.y
    };
    if (alignment === "v") {
      relativePosition = {
        x: relativePosition.y,
        y: relativePosition.x
      };
    }
    translate$1(draggerVisual, relativePosition.x, relativePosition.y);
  }
  eventBus.on("connection.changed", function(event2) {
    updateHandles(event2.element);
  });
  eventBus.on("connection.remove", function(event2) {
    var gfx = getBendpointsContainer(event2.element);
    if (gfx) {
      remove$1(gfx);
    }
  });
  eventBus.on("element.marker.update", function(event2) {
    var element = event2.element, bendpointsGfx;
    if (!element.waypoints) {
      return;
    }
    bendpointsGfx = addHandles(element);
    if (event2.add) {
      classes$1(bendpointsGfx).add(event2.marker);
    } else {
      classes$1(bendpointsGfx).remove(event2.marker);
    }
  });
  eventBus.on("element.mousemove", function(event2) {
    var element = event2.element, waypoints = element.waypoints, bendpointsGfx, intersection;
    if (waypoints) {
      bendpointsGfx = getBendpointsContainer(element, true);
      intersection = getConnectionIntersection(canvas, waypoints, event2.originalEvent);
      if (!intersection) {
        return;
      }
      updateFloatingBendpointPosition(bendpointsGfx, intersection);
      if (!intersection.bendpoint) {
        updateSegmentDraggerPosition(bendpointsGfx, intersection, waypoints);
      }
    }
  });
  eventBus.on("element.mousedown", function(event2) {
    if (!isPrimaryButton(event2)) {
      return;
    }
    var originalEvent = event2.originalEvent, element = event2.element;
    if (!element.waypoints) {
      return;
    }
    return activateBendpointMove(originalEvent, element);
  });
  eventBus.on("selection.changed", function(event2) {
    var newSelection = event2.newSelection, primary = newSelection[0];
    if (primary && primary.waypoints) {
      addHandles(primary);
    }
  });
  eventBus.on("element.hover", function(event2) {
    var element = event2.element;
    if (element.waypoints) {
      addHandles(element);
      interactionEvents.registerEvent(event2.gfx, "mousemove", "element.mousemove");
    }
  });
  eventBus.on("element.out", function(event2) {
    interactionEvents.unregisterEvent(event2.gfx, "mousemove", "element.mousemove");
  });
  eventBus.on("element.updateId", function(context) {
    var element = context.element, newId = context.newId;
    if (element.waypoints) {
      var bendpointContainer = getBendpointsContainer(element);
      if (bendpointContainer) {
        attr(bendpointContainer, { "data-element-id": newId });
      }
    }
  });
  this.addHandles = addHandles;
  this.updateHandles = updateHandles;
  this.getBendpointsContainer = getBendpointsContainer;
  this.getSegmentDragger = getSegmentDragger;
}
Bendpoints.$inject = [
  "eventBus",
  "canvas",
  "interactionEvents",
  "bendpointMove",
  "connectionSegmentMove"
];
function getDraggerVisual(draggerGfx) {
  return query(".djs-visual", draggerGfx);
}
function roundBounds(bounds) {
  return {
    x: Math.round(bounds.x),
    y: Math.round(bounds.y),
    width: Math.round(bounds.width),
    height: Math.round(bounds.height)
  };
}
function roundPoint(point) {
  return {
    x: Math.round(point.x),
    y: Math.round(point.y)
  };
}
function asTRBL(bounds) {
  return {
    top: bounds.y,
    right: bounds.x + (bounds.width || 0),
    bottom: bounds.y + (bounds.height || 0),
    left: bounds.x
  };
}
function asBounds(trbl) {
  return {
    x: trbl.left,
    y: trbl.top,
    width: trbl.right - trbl.left,
    height: trbl.bottom - trbl.top
  };
}
function getBoundsMid(bounds) {
  return roundPoint({
    x: bounds.x + (bounds.width || 0) / 2,
    y: bounds.y + (bounds.height || 0) / 2
  });
}
function getConnectionMid(connection) {
  var waypoints = connection.waypoints;
  var parts = waypoints.reduce(function(parts2, point, index) {
    var lastPoint = waypoints[index - 1];
    if (lastPoint) {
      var lastPart = parts2[parts2.length - 1];
      var startLength = lastPart && lastPart.endLength || 0;
      var length2 = distance(lastPoint, point);
      parts2.push({
        start: lastPoint,
        end: point,
        startLength,
        endLength: startLength + length2,
        length: length2
      });
    }
    return parts2;
  }, []);
  var totalLength = parts.reduce(function(length2, part) {
    return length2 + part.length;
  }, 0);
  var midLength = totalLength / 2;
  var i2 = 0;
  var midSegment = parts[i2];
  while (midSegment.endLength < midLength) {
    midSegment = parts[++i2];
  }
  var segmentProgress = (midLength - midSegment.startLength) / midSegment.length;
  var midPoint = {
    x: midSegment.start.x + (midSegment.end.x - midSegment.start.x) * segmentProgress,
    y: midSegment.start.y + (midSegment.end.y - midSegment.start.y) * segmentProgress
  };
  return midPoint;
}
function getMid(element) {
  if (isConnection$1(element)) {
    return getConnectionMid(element);
  }
  return getBoundsMid(element);
}
function getOrientation(rect, reference, padding) {
  padding = padding || 0;
  if (!isObject(padding)) {
    padding = { x: padding, y: padding };
  }
  var rectOrientation = asTRBL(rect), referenceOrientation = asTRBL(reference);
  var top = rectOrientation.bottom + padding.y <= referenceOrientation.top, right = rectOrientation.left - padding.x >= referenceOrientation.right, bottom = rectOrientation.top - padding.y >= referenceOrientation.bottom, left = rectOrientation.right + padding.x <= referenceOrientation.left;
  var vertical = top ? "top" : bottom ? "bottom" : null, horizontal = left ? "left" : right ? "right" : null;
  if (horizontal && vertical) {
    return vertical + "-" + horizontal;
  } else {
    return horizontal || vertical || "intersect";
  }
}
function getElementLineIntersection(elementPath, linePath2, cropStart) {
  var intersections = getIntersections(elementPath, linePath2);
  if (intersections.length === 1) {
    return roundPoint(intersections[0]);
  } else if (intersections.length === 2 && pointDistance(intersections[0], intersections[1]) < 1) {
    return roundPoint(intersections[0]);
  } else if (intersections.length > 1) {
    intersections = sortBy(intersections, function(i2) {
      var distance2 = Math.floor(i2.t2 * 100) || 1;
      distance2 = 100 - distance2;
      distance2 = (distance2 < 10 ? "0" : "") + distance2;
      return i2.segment2 + "#" + distance2;
    });
    return roundPoint(intersections[cropStart ? 0 : intersections.length - 1]);
  }
  return null;
}
function getIntersections(a2, b) {
  return findPathIntersections(a2, b);
}
function filterRedundantWaypoints(waypoints) {
  waypoints = waypoints.slice();
  var idx = 0, point, previousPoint, nextPoint;
  while (waypoints[idx]) {
    point = waypoints[idx];
    previousPoint = waypoints[idx - 1];
    nextPoint = waypoints[idx + 1];
    if (pointDistance(point, nextPoint) === 0 || pointsOnLine(previousPoint, nextPoint, point)) {
      waypoints.splice(idx, 1);
    } else {
      idx++;
    }
  }
  return waypoints;
}
function distance(a2, b) {
  return Math.sqrt(Math.pow(a2.x - b.x, 2) + Math.pow(a2.y - b.y, 2));
}
var round$5 = Math.round;
var RECONNECT_START$1 = "reconnectStart", RECONNECT_END$1 = "reconnectEnd", UPDATE_WAYPOINTS$1 = "updateWaypoints";
function BendpointMove(injector, eventBus, canvas, dragging, rules, modeling) {
  this._injector = injector;
  this.start = function(event2, connection, bendpointIndex, insert) {
    var gfx = canvas.getGraphics(connection), source = connection.source, target = connection.target, waypoints = connection.waypoints, type;
    if (!insert && bendpointIndex === 0) {
      type = RECONNECT_START$1;
    } else if (!insert && bendpointIndex === waypoints.length - 1) {
      type = RECONNECT_END$1;
    } else {
      type = UPDATE_WAYPOINTS$1;
    }
    var command = type === UPDATE_WAYPOINTS$1 ? "connection.updateWaypoints" : "connection.reconnect";
    var allowed = rules.allowed(command, {
      connection,
      source,
      target
    });
    if (allowed === false) {
      allowed = rules.allowed(command, {
        connection,
        source: target,
        target: source
      });
    }
    if (allowed === false) {
      return;
    }
    dragging.init(event2, "bendpoint.move", {
      data: {
        connection,
        connectionGfx: gfx,
        context: {
          allowed,
          bendpointIndex,
          connection,
          source,
          target,
          insert,
          type
        }
      }
    });
  };
  eventBus.on("bendpoint.move.hover", function(event2) {
    var context = event2.context, connection = context.connection, source = connection.source, target = connection.target, hover = event2.hover, type = context.type;
    context.hover = hover;
    var allowed;
    if (!hover) {
      return;
    }
    var command = type === UPDATE_WAYPOINTS$1 ? "connection.updateWaypoints" : "connection.reconnect";
    allowed = context.allowed = rules.allowed(command, {
      connection,
      source: type === RECONNECT_START$1 ? hover : source,
      target: type === RECONNECT_END$1 ? hover : target
    });
    if (allowed) {
      context.source = type === RECONNECT_START$1 ? hover : source;
      context.target = type === RECONNECT_END$1 ? hover : target;
      return;
    }
    if (allowed === false) {
      allowed = context.allowed = rules.allowed(command, {
        connection,
        source: type === RECONNECT_END$1 ? hover : target,
        target: type === RECONNECT_START$1 ? hover : source
      });
    }
    if (allowed) {
      context.source = type === RECONNECT_END$1 ? hover : target;
      context.target = type === RECONNECT_START$1 ? hover : source;
    }
  });
  eventBus.on(["bendpoint.move.out", "bendpoint.move.cleanup"], function(event2) {
    var context = event2.context, type = context.type;
    context.hover = null;
    context.source = null;
    context.target = null;
    if (type !== UPDATE_WAYPOINTS$1) {
      context.allowed = false;
    }
  });
  eventBus.on("bendpoint.move.end", function(event2) {
    var context = event2.context, allowed = context.allowed, bendpointIndex = context.bendpointIndex, connection = context.connection, insert = context.insert, newWaypoints = connection.waypoints.slice(), source = context.source, target = context.target, type = context.type, hints = context.hints || {};
    var docking = {
      x: round$5(event2.x),
      y: round$5(event2.y)
    };
    if (!allowed) {
      return false;
    }
    if (type === UPDATE_WAYPOINTS$1) {
      if (insert) {
        newWaypoints.splice(bendpointIndex, 0, docking);
      } else {
        newWaypoints[bendpointIndex] = docking;
      }
      hints.bendpointMove = {
        insert,
        bendpointIndex
      };
      newWaypoints = this.cropWaypoints(connection, newWaypoints);
      modeling.updateWaypoints(connection, filterRedundantWaypoints(newWaypoints), hints);
    } else {
      if (type === RECONNECT_START$1) {
        hints.docking = "source";
        if (isReverse$1(context)) {
          hints.docking = "target";
          hints.newWaypoints = newWaypoints.reverse();
        }
      } else if (type === RECONNECT_END$1) {
        hints.docking = "target";
        if (isReverse$1(context)) {
          hints.docking = "source";
          hints.newWaypoints = newWaypoints.reverse();
        }
      }
      modeling.reconnect(connection, source, target, docking, hints);
    }
  }, this);
}
BendpointMove.$inject = [
  "injector",
  "eventBus",
  "canvas",
  "dragging",
  "rules",
  "modeling"
];
BendpointMove.prototype.cropWaypoints = function(connection, newWaypoints) {
  var connectionDocking = this._injector.get("connectionDocking", false);
  if (!connectionDocking) {
    return newWaypoints;
  }
  var waypoints = connection.waypoints;
  connection.waypoints = newWaypoints;
  connection.waypoints = connectionDocking.getCroppedWaypoints(connection);
  newWaypoints = connection.waypoints;
  connection.waypoints = waypoints;
  return newWaypoints;
};
function isReverse$1(context) {
  var hover = context.hover, source = context.source, target = context.target, type = context.type;
  if (type === RECONNECT_START$1) {
    return hover && target && hover === target && source !== target;
  }
  if (type === RECONNECT_END$1) {
    return hover && source && hover === source && source !== target;
  }
}
var RECONNECT_START = "reconnectStart", RECONNECT_END = "reconnectEnd", UPDATE_WAYPOINTS = "updateWaypoints";
var MARKER_OK$2 = "connect-ok", MARKER_NOT_OK$2 = "connect-not-ok", MARKER_CONNECT_HOVER$1 = "connect-hover", MARKER_CONNECT_UPDATING$1 = "djs-updating", MARKER_DRAGGER = "djs-dragging";
var HIGH_PRIORITY$5 = 1100;
function BendpointMovePreview(bendpointMove, injector, eventBus, canvas) {
  this._injector = injector;
  var connectionPreview = injector.get("connectionPreview", false);
  eventBus.on("bendpoint.move.start", function(event2) {
    var context = event2.context, bendpointIndex = context.bendpointIndex, connection = context.connection, insert = context.insert, waypoints = connection.waypoints, newWaypoints = waypoints.slice();
    context.waypoints = waypoints;
    if (insert) {
      newWaypoints.splice(bendpointIndex, 0, { x: event2.x, y: event2.y });
    }
    connection.waypoints = newWaypoints;
    var draggerGfx = context.draggerGfx = addBendpoint(canvas.getLayer("overlays"));
    classes$1(draggerGfx).add("djs-dragging");
    canvas.addMarker(connection, MARKER_DRAGGER);
    canvas.addMarker(connection, MARKER_CONNECT_UPDATING$1);
  });
  eventBus.on("bendpoint.move.hover", function(event2) {
    var context = event2.context, allowed = context.allowed, hover = context.hover, type = context.type;
    if (hover) {
      canvas.addMarker(hover, MARKER_CONNECT_HOVER$1);
      if (type === UPDATE_WAYPOINTS) {
        return;
      }
      if (allowed) {
        canvas.removeMarker(hover, MARKER_NOT_OK$2);
        canvas.addMarker(hover, MARKER_OK$2);
      } else if (allowed === false) {
        canvas.removeMarker(hover, MARKER_OK$2);
        canvas.addMarker(hover, MARKER_NOT_OK$2);
      }
    }
  });
  eventBus.on([
    "bendpoint.move.out",
    "bendpoint.move.cleanup"
  ], HIGH_PRIORITY$5, function(event2) {
    var context = event2.context, hover = context.hover, target = context.target;
    if (hover) {
      canvas.removeMarker(hover, MARKER_CONNECT_HOVER$1);
      canvas.removeMarker(hover, target ? MARKER_OK$2 : MARKER_NOT_OK$2);
    }
  });
  eventBus.on("bendpoint.move.move", function(event2) {
    var context = event2.context, allowed = context.allowed, bendpointIndex = context.bendpointIndex, draggerGfx = context.draggerGfx, hover = context.hover, type = context.type, connection = context.connection, source = connection.source, target = connection.target, newWaypoints = connection.waypoints.slice(), bendpoint = { x: event2.x, y: event2.y }, hints = context.hints || {}, drawPreviewHints = {};
    if (connectionPreview) {
      if (hints.connectionStart) {
        drawPreviewHints.connectionStart = hints.connectionStart;
      }
      if (hints.connectionEnd) {
        drawPreviewHints.connectionEnd = hints.connectionEnd;
      }
      if (type === RECONNECT_START) {
        if (isReverse$1(context)) {
          drawPreviewHints.connectionEnd = drawPreviewHints.connectionEnd || bendpoint;
          drawPreviewHints.source = target;
          drawPreviewHints.target = hover || source;
          newWaypoints = newWaypoints.reverse();
        } else {
          drawPreviewHints.connectionStart = drawPreviewHints.connectionStart || bendpoint;
          drawPreviewHints.source = hover || source;
          drawPreviewHints.target = target;
        }
      } else if (type === RECONNECT_END) {
        if (isReverse$1(context)) {
          drawPreviewHints.connectionStart = drawPreviewHints.connectionStart || bendpoint;
          drawPreviewHints.source = hover || target;
          drawPreviewHints.target = source;
          newWaypoints = newWaypoints.reverse();
        } else {
          drawPreviewHints.connectionEnd = drawPreviewHints.connectionEnd || bendpoint;
          drawPreviewHints.source = source;
          drawPreviewHints.target = hover || target;
        }
      } else {
        drawPreviewHints.noCropping = true;
        drawPreviewHints.noLayout = true;
        newWaypoints[bendpointIndex] = bendpoint;
      }
      if (type === UPDATE_WAYPOINTS) {
        newWaypoints = bendpointMove.cropWaypoints(connection, newWaypoints);
      }
      drawPreviewHints.waypoints = newWaypoints;
      connectionPreview.drawPreview(context, allowed, drawPreviewHints);
    }
    translate$1(draggerGfx, event2.x, event2.y);
  }, this);
  eventBus.on([
    "bendpoint.move.end",
    "bendpoint.move.cancel"
  ], HIGH_PRIORITY$5, function(event2) {
    var context = event2.context, connection = context.connection, draggerGfx = context.draggerGfx, hover = context.hover, target = context.target, waypoints = context.waypoints;
    connection.waypoints = waypoints;
    remove$1(draggerGfx);
    canvas.removeMarker(connection, MARKER_CONNECT_UPDATING$1);
    canvas.removeMarker(connection, MARKER_DRAGGER);
    if (hover) {
      canvas.removeMarker(hover, MARKER_OK$2);
      canvas.removeMarker(hover, target ? MARKER_OK$2 : MARKER_NOT_OK$2);
    }
    if (connectionPreview) {
      connectionPreview.cleanUp(context);
    }
  });
}
BendpointMovePreview.$inject = [
  "bendpointMove",
  "injector",
  "eventBus",
  "canvas"
];
var MARKER_CONNECT_HOVER = "connect-hover", MARKER_CONNECT_UPDATING = "djs-updating";
function axisAdd(point, axis, delta2) {
  return axisSet(point, axis, point[axis] + delta2);
}
function axisSet(point, axis, value) {
  return {
    x: axis === "x" ? value : point.x,
    y: axis === "y" ? value : point.y
  };
}
function axisFenced(position, segmentStart, segmentEnd, axis) {
  var maxValue = Math.max(segmentStart[axis], segmentEnd[axis]), minValue = Math.min(segmentStart[axis], segmentEnd[axis]);
  var padding = 20;
  var fencedValue = Math.min(Math.max(minValue + padding, position[axis]), maxValue - padding);
  return axisSet(segmentStart, axis, fencedValue);
}
function flipAxis(axis) {
  return axis === "x" ? "y" : "x";
}
function getDocking$1(point, referenceElement, moveAxis) {
  var referenceMid, inverseAxis;
  if (point.original) {
    return point.original;
  } else {
    referenceMid = getMid(referenceElement);
    inverseAxis = flipAxis(moveAxis);
    return axisSet(point, inverseAxis, referenceMid[inverseAxis]);
  }
}
function ConnectionSegmentMove(injector, eventBus, canvas, dragging, graphicsFactory, modeling) {
  var connectionDocking = injector.get("connectionDocking", false);
  this.start = function(event2, connection, idx) {
    var context, gfx = canvas.getGraphics(connection), segmentStartIndex = idx - 1, segmentEndIndex = idx, waypoints = connection.waypoints, segmentStart = waypoints[segmentStartIndex], segmentEnd = waypoints[segmentEndIndex], intersection = getConnectionIntersection(canvas, waypoints, event2), direction, axis, dragPosition;
    direction = pointsAligned(segmentStart, segmentEnd);
    if (!direction) {
      return;
    }
    axis = direction === "v" ? "x" : "y";
    if (segmentStartIndex === 0) {
      segmentStart = getDocking$1(segmentStart, connection.source, axis);
    }
    if (segmentEndIndex === waypoints.length - 1) {
      segmentEnd = getDocking$1(segmentEnd, connection.target, axis);
    }
    if (intersection) {
      dragPosition = intersection.point;
    } else {
      dragPosition = {
        x: (segmentStart.x + segmentEnd.x) / 2,
        y: (segmentStart.y + segmentEnd.y) / 2
      };
    }
    context = {
      connection,
      segmentStartIndex,
      segmentEndIndex,
      segmentStart,
      segmentEnd,
      axis,
      dragPosition
    };
    dragging.init(event2, dragPosition, "connectionSegment.move", {
      cursor: axis === "x" ? "resize-ew" : "resize-ns",
      data: {
        connection,
        connectionGfx: gfx,
        context
      }
    });
  };
  function cropConnection(connection, newWaypoints) {
    if (!connectionDocking) {
      return newWaypoints;
    }
    var oldWaypoints = connection.waypoints, croppedWaypoints;
    connection.waypoints = newWaypoints;
    croppedWaypoints = connectionDocking.getCroppedWaypoints(connection);
    connection.waypoints = oldWaypoints;
    return croppedWaypoints;
  }
  function redrawConnection(data) {
    graphicsFactory.update("connection", data.connection, data.connectionGfx);
  }
  function updateDragger(context, segmentOffset, event2) {
    var newWaypoints = context.newWaypoints, segmentStartIndex = context.segmentStartIndex + segmentOffset, segmentStart = newWaypoints[segmentStartIndex], segmentEndIndex = context.segmentEndIndex + segmentOffset, segmentEnd = newWaypoints[segmentEndIndex], axis = flipAxis(context.axis);
    var draggerPosition = axisFenced(event2, segmentStart, segmentEnd, axis);
    translate$1(context.draggerGfx, draggerPosition.x, draggerPosition.y);
  }
  function filterRedundantWaypoints2(waypoints, segmentStartIndex) {
    var segmentOffset = 0;
    var filteredWaypoints = waypoints.filter(function(r2, idx) {
      if (pointsOnLine(waypoints[idx - 1], waypoints[idx + 1], r2)) {
        segmentOffset = idx <= segmentStartIndex ? segmentOffset - 1 : segmentOffset;
        return false;
      }
      return true;
    });
    return {
      waypoints: filteredWaypoints,
      segmentOffset
    };
  }
  eventBus.on("connectionSegment.move.start", function(event2) {
    var context = event2.context, connection = event2.connection, layer = canvas.getLayer("overlays");
    context.originalWaypoints = connection.waypoints.slice();
    context.draggerGfx = addSegmentDragger(layer, context.segmentStart, context.segmentEnd);
    classes$1(context.draggerGfx).add("djs-dragging");
    canvas.addMarker(connection, MARKER_CONNECT_UPDATING);
  });
  eventBus.on("connectionSegment.move.move", function(event2) {
    var context = event2.context, connection = context.connection, segmentStartIndex = context.segmentStartIndex, segmentEndIndex = context.segmentEndIndex, segmentStart = context.segmentStart, segmentEnd = context.segmentEnd, axis = context.axis;
    var newWaypoints = context.originalWaypoints.slice(), newSegmentStart = axisAdd(segmentStart, axis, event2["d" + axis]), newSegmentEnd = axisAdd(segmentEnd, axis, event2["d" + axis]);
    var waypointCount = newWaypoints.length, segmentOffset = 0;
    newWaypoints[segmentStartIndex] = newSegmentStart;
    newWaypoints[segmentEndIndex] = newSegmentEnd;
    var sourceToSegmentOrientation, targetToSegmentOrientation;
    if (segmentStartIndex < 2) {
      sourceToSegmentOrientation = getOrientation(connection.source, newSegmentStart);
      if (segmentStartIndex === 1) {
        if (sourceToSegmentOrientation === "intersect") {
          newWaypoints.shift();
          newWaypoints[0] = newSegmentStart;
          segmentOffset--;
        }
      } else {
        if (sourceToSegmentOrientation !== "intersect") {
          newWaypoints.unshift(segmentStart);
          segmentOffset++;
        }
      }
    }
    if (segmentEndIndex > waypointCount - 3) {
      targetToSegmentOrientation = getOrientation(connection.target, newSegmentEnd);
      if (segmentEndIndex === waypointCount - 2) {
        if (targetToSegmentOrientation === "intersect") {
          newWaypoints.pop();
          newWaypoints[newWaypoints.length - 1] = newSegmentEnd;
        }
      } else {
        if (targetToSegmentOrientation !== "intersect") {
          newWaypoints.push(segmentEnd);
        }
      }
    }
    context.newWaypoints = connection.waypoints = cropConnection(connection, newWaypoints);
    updateDragger(context, segmentOffset, event2);
    context.newSegmentStartIndex = segmentStartIndex + segmentOffset;
    redrawConnection(event2);
  });
  eventBus.on("connectionSegment.move.hover", function(event2) {
    event2.context.hover = event2.hover;
    canvas.addMarker(event2.hover, MARKER_CONNECT_HOVER);
  });
  eventBus.on([
    "connectionSegment.move.out",
    "connectionSegment.move.cleanup"
  ], function(event2) {
    var hover = event2.context.hover;
    if (hover) {
      canvas.removeMarker(hover, MARKER_CONNECT_HOVER);
    }
  });
  eventBus.on("connectionSegment.move.cleanup", function(event2) {
    var context = event2.context, connection = context.connection;
    if (context.draggerGfx) {
      remove$1(context.draggerGfx);
    }
    canvas.removeMarker(connection, MARKER_CONNECT_UPDATING);
  });
  eventBus.on([
    "connectionSegment.move.cancel",
    "connectionSegment.move.end"
  ], function(event2) {
    var context = event2.context, connection = context.connection;
    connection.waypoints = context.originalWaypoints;
    redrawConnection(event2);
  });
  eventBus.on("connectionSegment.move.end", function(event2) {
    var context = event2.context, connection = context.connection, newWaypoints = context.newWaypoints, newSegmentStartIndex = context.newSegmentStartIndex;
    newWaypoints = newWaypoints.map(function(p2) {
      return {
        original: p2.original,
        x: Math.round(p2.x),
        y: Math.round(p2.y)
      };
    });
    var filtered = filterRedundantWaypoints2(newWaypoints, newSegmentStartIndex);
    var filteredWaypoints = filtered.waypoints, croppedWaypoints = cropConnection(connection, filteredWaypoints), segmentOffset = filtered.segmentOffset;
    var hints = {
      segmentMove: {
        segmentStartIndex: context.segmentStartIndex,
        newSegmentStartIndex: newSegmentStartIndex + segmentOffset
      }
    };
    modeling.updateWaypoints(connection, croppedWaypoints, hints);
  });
}
ConnectionSegmentMove.$inject = [
  "injector",
  "eventBus",
  "canvas",
  "dragging",
  "graphicsFactory",
  "modeling"
];
var abs$2 = Math.abs, round$4 = Math.round;
function snapTo(value, values2, tolerance) {
  tolerance = tolerance === void 0 ? 10 : tolerance;
  var idx, snapValue;
  for (idx = 0; idx < values2.length; idx++) {
    snapValue = values2[idx];
    if (abs$2(snapValue - value) <= tolerance) {
      return snapValue;
    }
  }
}
function topLeft(bounds) {
  return {
    x: bounds.x,
    y: bounds.y
  };
}
function bottomRight(bounds) {
  return {
    x: bounds.x + bounds.width,
    y: bounds.y + bounds.height
  };
}
function mid(bounds, defaultValue) {
  if (!bounds || isNaN(bounds.x) || isNaN(bounds.y)) {
    return defaultValue;
  }
  return {
    x: round$4(bounds.x + bounds.width / 2),
    y: round$4(bounds.y + bounds.height / 2)
  };
}
function isSnapped(event2, axis) {
  var snapped = event2.snapped;
  if (!snapped) {
    return false;
  }
  if (typeof axis === "string") {
    return snapped[axis];
  }
  return snapped.x && snapped.y;
}
function setSnapped(event2, axis, value) {
  if (typeof axis !== "string") {
    throw new Error("axis must be in [x, y]");
  }
  if (typeof value !== "number" && value !== false) {
    throw new Error("value must be Number or false");
  }
  var delta2, previousValue = event2[axis];
  var snapped = event2.snapped = event2.snapped || {};
  if (value === false) {
    snapped[axis] = false;
  } else {
    snapped[axis] = true;
    delta2 = value - previousValue;
    event2[axis] += delta2;
    event2["d" + axis] += delta2;
  }
  return previousValue;
}
function getChildren(parent) {
  return parent.children || [];
}
var abs$1 = Math.abs, round$3 = Math.round;
var TOLERANCE = 10;
function BendpointSnapping(eventBus) {
  function snapTo2(values2, value) {
    if (isArray$1(values2)) {
      var i2 = values2.length;
      while (i2--) if (abs$1(values2[i2] - value) <= TOLERANCE) {
        return values2[i2];
      }
    } else {
      values2 = +values2;
      var rem = value % values2;
      if (rem < TOLERANCE) {
        return value - rem;
      }
      if (rem > values2 - TOLERANCE) {
        return value - rem + values2;
      }
    }
    return value;
  }
  function getSnapPoint(element, event2) {
    if (element.waypoints) {
      return getClosestPointOnConnection(event2, element);
    }
    if (element.width) {
      return {
        x: round$3(element.width / 2 + element.x),
        y: round$3(element.height / 2 + element.y)
      };
    }
  }
  function getConnectionSegmentSnaps(event2) {
    var context = event2.context, snapPoints = context.snapPoints, connection = context.connection, waypoints = connection.waypoints, segmentStart = context.segmentStart, segmentStartIndex = context.segmentStartIndex, segmentEnd = context.segmentEnd, segmentEndIndex = context.segmentEndIndex, axis = context.axis;
    if (snapPoints) {
      return snapPoints;
    }
    var referenceWaypoints = [
      waypoints[segmentStartIndex - 1],
      segmentStart,
      segmentEnd,
      waypoints[segmentEndIndex + 1]
    ];
    if (segmentStartIndex < 2) {
      referenceWaypoints.unshift(getSnapPoint(connection.source, event2));
    }
    if (segmentEndIndex > waypoints.length - 3) {
      referenceWaypoints.unshift(getSnapPoint(connection.target, event2));
    }
    context.snapPoints = snapPoints = { horizontal: [], vertical: [] };
    forEach(referenceWaypoints, function(p2) {
      if (p2) {
        p2 = p2.original || p2;
        if (axis === "y") {
          snapPoints.horizontal.push(p2.y);
        }
        if (axis === "x") {
          snapPoints.vertical.push(p2.x);
        }
      }
    });
    return snapPoints;
  }
  eventBus.on("connectionSegment.move.move", 1500, function(event2) {
    var snapPoints = getConnectionSegmentSnaps(event2), x2 = event2.x, y2 = event2.y, sx, sy;
    if (!snapPoints) {
      return;
    }
    sx = snapTo2(snapPoints.vertical, x2);
    sy = snapTo2(snapPoints.horizontal, y2);
    var cx = x2 - sx, cy = y2 - sy;
    assign(event2, {
      dx: event2.dx - cx,
      dy: event2.dy - cy,
      x: sx,
      y: sy
    });
    if (cx || snapPoints.vertical.indexOf(x2) !== -1) {
      setSnapped(event2, "x", sx);
    }
    if (cy || snapPoints.horizontal.indexOf(y2) !== -1) {
      setSnapped(event2, "y", sy);
    }
  });
  function getBendpointSnaps(context) {
    var snapPoints = context.snapPoints, waypoints = context.connection.waypoints, bendpointIndex = context.bendpointIndex;
    if (snapPoints) {
      return snapPoints;
    }
    var referenceWaypoints = [waypoints[bendpointIndex - 1], waypoints[bendpointIndex + 1]];
    context.snapPoints = snapPoints = { horizontal: [], vertical: [] };
    forEach(referenceWaypoints, function(p2) {
      if (p2) {
        p2 = p2.original || p2;
        snapPoints.horizontal.push(p2.y);
        snapPoints.vertical.push(p2.x);
      }
    });
    return snapPoints;
  }
  eventBus.on([
    "connect.hover",
    "connect.move",
    "connect.end"
  ], 1500, function(event2) {
    var context = event2.context, hover = context.hover, hoverMid = hover && getSnapPoint(hover, event2);
    if (!isConnection$1(hover) || !hoverMid || !hoverMid.x || !hoverMid.y) {
      return;
    }
    setSnapped(event2, "x", hoverMid.x);
    setSnapped(event2, "y", hoverMid.y);
  });
  eventBus.on(["bendpoint.move.move", "bendpoint.move.end"], 1500, function(event2) {
    var context = event2.context, snapPoints = getBendpointSnaps(context), hover = context.hover, hoverMid = hover && getSnapPoint(hover, event2), x2 = event2.x, y2 = event2.y, sx, sy;
    if (!snapPoints) {
      return;
    }
    sx = snapTo2(hoverMid ? snapPoints.vertical.concat([hoverMid.x]) : snapPoints.vertical, x2);
    sy = snapTo2(hoverMid ? snapPoints.horizontal.concat([hoverMid.y]) : snapPoints.horizontal, y2);
    var cx = x2 - sx, cy = y2 - sy;
    assign(event2, {
      dx: event2.dx - cx,
      dy: event2.dy - cy,
      x: event2.x - cx,
      y: event2.y - cy
    });
    if (cx || snapPoints.vertical.indexOf(x2) !== -1) {
      setSnapped(event2, "x", sx);
    }
    if (cy || snapPoints.horizontal.indexOf(y2) !== -1) {
      setSnapped(event2, "y", sy);
    }
  });
}
BendpointSnapping.$inject = ["eventBus"];
const BendpointsModule = {
  __depends__: [
    DraggingModule,
    RulesModule
  ],
  __init__: ["bendpoints", "bendpointSnapping", "bendpointMovePreview"],
  bendpoints: ["type", Bendpoints],
  bendpointMove: ["type", BendpointMove],
  bendpointMovePreview: ["type", BendpointMovePreview],
  connectionSegmentMove: ["type", ConnectionSegmentMove],
  bendpointSnapping: ["type", BendpointSnapping]
};
var MARKER_CONNECTION_PREVIEW = "djs-dragger";
function ConnectionPreview(injector, canvas, graphicsFactory, elementFactory) {
  this._canvas = canvas;
  this._graphicsFactory = graphicsFactory;
  this._elementFactory = elementFactory;
  this._connectionDocking = injector.get("connectionDocking", false);
  this._layouter = injector.get("layouter", false);
}
ConnectionPreview.$inject = [
  "injector",
  "canvas",
  "graphicsFactory",
  "elementFactory"
];
ConnectionPreview.prototype.drawPreview = function(context, canConnect2, hints) {
  hints = hints || {};
  var connectionPreviewGfx = context.connectionPreviewGfx, getConnection = context.getConnection, source = hints.source, target = hints.target, waypoints = hints.waypoints, connectionStart = hints.connectionStart, connectionEnd = hints.connectionEnd, noLayout = hints.noLayout, noCropping = hints.noCropping, noNoop = hints.noNoop, connection;
  var self = this;
  if (!connectionPreviewGfx) {
    connectionPreviewGfx = context.connectionPreviewGfx = this.createConnectionPreviewGfx();
  }
  clear(connectionPreviewGfx);
  if (!getConnection) {
    getConnection = context.getConnection = cacheReturnValues(function(canConnect3, source2, target2) {
      return self.getConnection(canConnect3, source2, target2);
    });
  }
  if (canConnect2) {
    connection = getConnection(canConnect2, source, target);
  }
  if (!connection) {
    !noNoop && this.drawNoopPreview(connectionPreviewGfx, hints);
    return;
  }
  connection.waypoints = waypoints || [];
  if (this._layouter && !noLayout) {
    connection.waypoints = this._layouter.layoutConnection(connection, {
      source,
      target,
      connectionStart,
      connectionEnd,
      waypoints: hints.waypoints || connection.waypoints
    });
  }
  if (!connection.waypoints || !connection.waypoints.length) {
    connection.waypoints = [
      source ? getMid(source) : connectionStart,
      target ? getMid(target) : connectionEnd
    ];
  }
  if (this._connectionDocking && (source || target) && !noCropping) {
    connection.waypoints = this._connectionDocking.getCroppedWaypoints(connection, source, target);
  }
  this._graphicsFactory.drawConnection(connectionPreviewGfx, connection, {
    stroke: "var(--element-dragger-color)"
  });
};
ConnectionPreview.prototype.drawNoopPreview = function(connectionPreviewGfx, hints) {
  var source = hints.source, target = hints.target, start = hints.connectionStart || getMid(source), end = hints.connectionEnd || getMid(target);
  var waypoints = this.cropWaypoints(start, end, source, target);
  var connection = this.createNoopConnection(waypoints[0], waypoints[1]);
  append(connectionPreviewGfx, connection);
};
ConnectionPreview.prototype.cropWaypoints = function(start, end, source, target) {
  var graphicsFactory = this._graphicsFactory, sourcePath = source && graphicsFactory.getShapePath(source), targetPath = target && graphicsFactory.getShapePath(target), connectionPath = graphicsFactory.getConnectionPath({ waypoints: [start, end] });
  start = source && getElementLineIntersection(sourcePath, connectionPath, true) || start;
  end = target && getElementLineIntersection(targetPath, connectionPath, false) || end;
  return [start, end];
};
ConnectionPreview.prototype.cleanUp = function(context) {
  if (context && context.connectionPreviewGfx) {
    remove$1(context.connectionPreviewGfx);
  }
};
ConnectionPreview.prototype.getConnection = function(canConnect2) {
  var attrs = ensureConnectionAttrs(canConnect2);
  return this._elementFactory.createConnection(attrs);
};
ConnectionPreview.prototype.createConnectionPreviewGfx = function() {
  var gfx = create$1("g");
  attr(gfx, {
    pointerEvents: "none"
  });
  classes$1(gfx).add(MARKER_CONNECTION_PREVIEW);
  append(this._canvas.getActiveLayer(), gfx);
  return gfx;
};
ConnectionPreview.prototype.createNoopConnection = function(start, end) {
  return createLine([start, end], {
    "stroke": "#333",
    "strokeDasharray": [1],
    "strokeWidth": 2,
    "pointer-events": "none"
  });
};
function cacheReturnValues(fn) {
  var returnValues = {};
  return function(firstArgument) {
    var key = JSON.stringify(firstArgument);
    var returnValue = returnValues[key];
    if (!returnValue) {
      returnValue = returnValues[key] = fn.apply(null, arguments);
    }
    return returnValue;
  };
}
function ensureConnectionAttrs(canConnect2) {
  if (isObject(canConnect2)) {
    return canConnect2;
  } else {
    return {};
  }
}
const ConnectionPreviewModule = {
  __init__: ["connectionPreview"],
  connectionPreview: ["type", ConnectionPreview]
};
function SnapContext() {
  this._targets = {};
  this._snapOrigins = {};
  this._snapLocations = [];
  this._defaultSnaps = {};
}
SnapContext.prototype.getSnapOrigin = function(snapLocation) {
  return this._snapOrigins[snapLocation];
};
SnapContext.prototype.setSnapOrigin = function(snapLocation, snapOrigin) {
  this._snapOrigins[snapLocation] = snapOrigin;
  if (this._snapLocations.indexOf(snapLocation) === -1) {
    this._snapLocations.push(snapLocation);
  }
};
SnapContext.prototype.addDefaultSnap = function(snapLocation, point) {
  var snapValues = this._defaultSnaps[snapLocation];
  if (!snapValues) {
    snapValues = this._defaultSnaps[snapLocation] = [];
  }
  snapValues.push(point);
};
SnapContext.prototype.getSnapLocations = function() {
  return this._snapLocations;
};
SnapContext.prototype.setSnapLocations = function(snapLocations) {
  this._snapLocations = snapLocations;
};
SnapContext.prototype.pointsForTarget = function(target) {
  var targetId = target.id || target;
  var snapPoints = this._targets[targetId];
  if (!snapPoints) {
    snapPoints = this._targets[targetId] = new SnapPoints();
    snapPoints.initDefaults(this._defaultSnaps);
  }
  return snapPoints;
};
function SnapPoints() {
  this._snapValues = {};
}
SnapPoints.prototype.add = function(snapLocation, point) {
  var snapValues = this._snapValues[snapLocation];
  if (!snapValues) {
    snapValues = this._snapValues[snapLocation] = { x: [], y: [] };
  }
  if (snapValues.x.indexOf(point.x) === -1) {
    snapValues.x.push(point.x);
  }
  if (snapValues.y.indexOf(point.y) === -1) {
    snapValues.y.push(point.y);
  }
};
SnapPoints.prototype.snap = function(point, snapLocation, axis, tolerance) {
  var snappingValues = this._snapValues[snapLocation];
  return snappingValues && snapTo(point[axis], snappingValues[axis], tolerance);
};
SnapPoints.prototype.initDefaults = function(defaultSnaps) {
  var self = this;
  forEach(defaultSnaps || {}, function(snapPoints, snapLocation) {
    forEach(snapPoints, function(point) {
      self.add(snapLocation, point);
    });
  });
};
var HIGHER_PRIORITY$1 = 1250;
function CreateMoveSnapping(elementRegistry, eventBus, snapping) {
  var self = this;
  this._elementRegistry = elementRegistry;
  eventBus.on([
    "create.start",
    "shape.move.start"
  ], function(event2) {
    self.initSnap(event2);
  });
  eventBus.on([
    "create.move",
    "create.end",
    "shape.move.move",
    "shape.move.end"
  ], HIGHER_PRIORITY$1, function(event2) {
    var context = event2.context, shape = context.shape, snapContext = context.snapContext, target = context.target;
    if (event2.originalEvent && isCmd(event2.originalEvent)) {
      return;
    }
    if (isSnapped(event2) || !target) {
      return;
    }
    var snapPoints = snapContext.pointsForTarget(target);
    if (!snapPoints.initialized) {
      snapPoints = self.addSnapTargetPoints(snapPoints, shape, target);
      snapPoints.initialized = true;
    }
    snapping.snap(event2, snapPoints);
  });
  eventBus.on([
    "create.cleanup",
    "shape.move.cleanup"
  ], function() {
    snapping.hide();
  });
}
CreateMoveSnapping.$inject = [
  "elementRegistry",
  "eventBus",
  "snapping"
];
CreateMoveSnapping.prototype.initSnap = function(event2) {
  var elementRegistry = this._elementRegistry;
  var context = event2.context, shape = context.shape, snapContext = context.snapContext;
  if (!snapContext) {
    snapContext = context.snapContext = new SnapContext();
  }
  var shapeMid;
  if (elementRegistry.get(shape.id)) {
    shapeMid = mid(shape, event2);
  } else {
    shapeMid = {
      x: event2.x + mid(shape).x,
      y: event2.y + mid(shape).y
    };
  }
  var shapeTopLeft = {
    x: shapeMid.x - shape.width / 2,
    y: shapeMid.y - shape.height / 2
  }, shapeBottomRight = {
    x: shapeMid.x + shape.width / 2,
    y: shapeMid.y + shape.height / 2
  };
  snapContext.setSnapOrigin("mid", {
    x: shapeMid.x - event2.x,
    y: shapeMid.y - event2.y
  });
  if (isLabel$1(shape)) {
    return snapContext;
  }
  snapContext.setSnapOrigin("top-left", {
    x: shapeTopLeft.x - event2.x,
    y: shapeTopLeft.y - event2.y
  });
  snapContext.setSnapOrigin("bottom-right", {
    x: shapeBottomRight.x - event2.x,
    y: shapeBottomRight.y - event2.y
  });
  return snapContext;
};
CreateMoveSnapping.prototype.addSnapTargetPoints = function(snapPoints, shape, target) {
  var snapTargets = this.getSnapTargets(shape, target);
  forEach(snapTargets, function(snapTarget) {
    if (isLabel$1(snapTarget)) {
      if (isLabel$1(shape)) {
        snapPoints.add("mid", mid(snapTarget));
      }
      return;
    }
    if (isConnection$1(snapTarget)) {
      if (snapTarget.waypoints.length < 3) {
        return;
      }
      var waypoints = snapTarget.waypoints.slice(1, -1);
      forEach(waypoints, function(waypoint) {
        snapPoints.add("mid", waypoint);
      });
      return;
    }
    snapPoints.add("mid", mid(snapTarget));
  });
  if (!isNumber(shape.x) || !isNumber(shape.y)) {
    return snapPoints;
  }
  if (this._elementRegistry.get(shape.id)) {
    snapPoints.add("mid", mid(shape));
  }
  return snapPoints;
};
CreateMoveSnapping.prototype.getSnapTargets = function(shape, target) {
  return getChildren(target).filter(function(child) {
    return !isHidden$1(child);
  });
};
function isHidden$1(element) {
  return !!element.hidden;
}
var HIGHER_PRIORITY = 1250;
function ResizeSnapping(eventBus, snapping) {
  var self = this;
  eventBus.on(["resize.start"], function(event2) {
    self.initSnap(event2);
  });
  eventBus.on([
    "resize.move",
    "resize.end"
  ], HIGHER_PRIORITY, function(event2) {
    var context = event2.context, shape = context.shape, parent = shape.parent, direction = context.direction, snapContext = context.snapContext;
    if (event2.originalEvent && isCmd(event2.originalEvent)) {
      return;
    }
    if (isSnapped(event2)) {
      return;
    }
    var snapPoints = snapContext.pointsForTarget(parent);
    if (!snapPoints.initialized) {
      snapPoints = self.addSnapTargetPoints(snapPoints, shape, parent, direction);
      snapPoints.initialized = true;
    }
    if (isHorizontal(direction)) {
      setSnapped(event2, "x", event2.x);
    }
    if (isVertical(direction)) {
      setSnapped(event2, "y", event2.y);
    }
    snapping.snap(event2, snapPoints);
  });
  eventBus.on(["resize.cleanup"], function() {
    snapping.hide();
  });
}
ResizeSnapping.prototype.initSnap = function(event2) {
  var context = event2.context, shape = context.shape, direction = context.direction, snapContext = context.snapContext;
  if (!snapContext) {
    snapContext = context.snapContext = new SnapContext();
  }
  var snapOrigin = getSnapOrigin(shape, direction);
  snapContext.setSnapOrigin("corner", {
    x: snapOrigin.x - event2.x,
    y: snapOrigin.y - event2.y
  });
  return snapContext;
};
ResizeSnapping.prototype.addSnapTargetPoints = function(snapPoints, shape, target, direction) {
  var snapTargets = this.getSnapTargets(shape, target);
  forEach(snapTargets, function(snapTarget) {
    snapPoints.add("corner", bottomRight(snapTarget));
    snapPoints.add("corner", topLeft(snapTarget));
  });
  snapPoints.add("corner", getSnapOrigin(shape, direction));
  return snapPoints;
};
ResizeSnapping.$inject = [
  "eventBus",
  "snapping"
];
ResizeSnapping.prototype.getSnapTargets = function(shape, target) {
  return getChildren(target).filter(function(child) {
    return !isAttached(child, shape) && !isConnection$1(child) && !isHidden(child) && !isLabel$1(child);
  });
};
function getSnapOrigin(shape, direction) {
  var mid2 = getMid(shape), trbl = asTRBL(shape);
  var snapOrigin = {
    x: mid2.x,
    y: mid2.y
  };
  if (direction.indexOf("n") !== -1) {
    snapOrigin.y = trbl.top;
  } else if (direction.indexOf("s") !== -1) {
    snapOrigin.y = trbl.bottom;
  }
  if (direction.indexOf("e") !== -1) {
    snapOrigin.x = trbl.right;
  } else if (direction.indexOf("w") !== -1) {
    snapOrigin.x = trbl.left;
  }
  return snapOrigin;
}
function isAttached(element, host) {
  return element.host === host;
}
function isHidden(element) {
  return !!element.hidden;
}
function isHorizontal(direction) {
  return direction === "n" || direction === "s";
}
function isVertical(direction) {
  return direction === "e" || direction === "w";
}
var SNAP_TOLERANCE = 7;
var SNAP_LINE_HIDE_DELAY = 1e3;
function Snapping(canvas) {
  this._canvas = canvas;
  this._asyncHide = debounce(bind(this.hide, this), SNAP_LINE_HIDE_DELAY);
}
Snapping.$inject = ["canvas"];
Snapping.prototype.snap = function(event2, snapPoints) {
  var context = event2.context, snapContext = context.snapContext, snapLocations = snapContext.getSnapLocations();
  var snapping = {
    x: isSnapped(event2, "x"),
    y: isSnapped(event2, "y")
  };
  forEach(snapLocations, function(location) {
    var snapOrigin = snapContext.getSnapOrigin(location);
    var snapCurrent = {
      x: event2.x + snapOrigin.x,
      y: event2.y + snapOrigin.y
    };
    forEach(["x", "y"], function(axis) {
      var locationSnapping;
      if (!snapping[axis]) {
        locationSnapping = snapPoints.snap(snapCurrent, location, axis, SNAP_TOLERANCE);
        if (locationSnapping !== void 0) {
          snapping[axis] = {
            value: locationSnapping,
            originValue: locationSnapping - snapOrigin[axis]
          };
        }
      }
    });
    if (snapping.x && snapping.y) {
      return false;
    }
  });
  this.showSnapLine("vertical", snapping.x && snapping.x.value);
  this.showSnapLine("horizontal", snapping.y && snapping.y.value);
  forEach(["x", "y"], function(axis) {
    var axisSnapping = snapping[axis];
    if (isObject(axisSnapping)) {
      setSnapped(event2, axis, axisSnapping.originValue);
    }
  });
};
Snapping.prototype._createLine = function(orientation) {
  var root = this._canvas.getLayer("snap");
  var line = create$1("path");
  attr(line, { d: "M0,0 L0,0" });
  classes$1(line).add("djs-snap-line");
  append(root, line);
  return {
    update: function(position) {
      if (!isNumber(position)) {
        attr(line, { display: "none" });
      } else {
        if (orientation === "horizontal") {
          attr(line, {
            d: "M-100000," + position + " L+100000," + position,
            display: ""
          });
        } else {
          attr(line, {
            d: "M " + position + ",-100000 L " + position + ", +100000",
            display: ""
          });
        }
      }
    }
  };
};
Snapping.prototype._createSnapLines = function() {
  this._snapLines = {
    horizontal: this._createLine("horizontal"),
    vertical: this._createLine("vertical")
  };
};
Snapping.prototype.showSnapLine = function(orientation, position) {
  var line = this.getSnapLine(orientation);
  if (line) {
    line.update(position);
  }
  this._asyncHide();
};
Snapping.prototype.getSnapLine = function(orientation) {
  if (!this._snapLines) {
    this._createSnapLines();
  }
  return this._snapLines[orientation];
};
Snapping.prototype.hide = function() {
  forEach(this._snapLines, function(snapLine) {
    snapLine.update();
  });
};
const SnappingModule = {
  __init__: [
    "createMoveSnapping",
    "resizeSnapping",
    "snapping"
  ],
  createMoveSnapping: ["type", CreateMoveSnapping],
  resizeSnapping: ["type", ResizeSnapping],
  snapping: ["type", Snapping]
};
function e$3(e2, t2) {
  t2 && (e2.super_ = t2, e2.prototype = Object.create(t2.prototype, { constructor: { value: e2, enumerable: false, writable: true, configurable: true } }));
}
function extend(collection, refs, property, target) {
  var inverseProperty = property.inverse;
  Object.defineProperty(collection, "remove", {
    value: function(element) {
      var idx = this.indexOf(element);
      if (idx !== -1) {
        this.splice(idx, 1);
        refs.unset(element, inverseProperty, target);
      }
      return element;
    }
  });
  Object.defineProperty(collection, "contains", {
    value: function(element) {
      return this.indexOf(element) !== -1;
    }
  });
  Object.defineProperty(collection, "add", {
    value: function(element, idx) {
      var currentIdx = this.indexOf(element);
      if (typeof idx === "undefined") {
        if (currentIdx !== -1) {
          return;
        }
        idx = this.length;
      }
      if (currentIdx !== -1) {
        this.splice(currentIdx, 1);
      }
      this.splice(idx, 0, element);
      if (currentIdx === -1) {
        refs.set(element, inverseProperty, target);
      }
    }
  });
  Object.defineProperty(collection, "__refs_collection", {
    value: true
  });
  return collection;
}
function isExtended(collection) {
  return collection.__refs_collection === true;
}
function hasOwnProperty(e2, property) {
  return Object.prototype.hasOwnProperty.call(e2, property.name || property);
}
function defineCollectionProperty(ref, property, target) {
  var collection = extend(target[property.name] || [], ref, property, target);
  Object.defineProperty(target, property.name, {
    enumerable: property.enumerable,
    value: collection
  });
  if (collection.length) {
    collection.forEach(function(o2) {
      ref.set(o2, property.inverse, target);
    });
  }
}
function defineProperty(ref, property, target) {
  var inverseProperty = property.inverse;
  var _value = target[property.name];
  Object.defineProperty(target, property.name, {
    configurable: property.configurable,
    enumerable: property.enumerable,
    get: function() {
      return _value;
    },
    set: function(value) {
      if (value === _value) {
        return;
      }
      var old = _value;
      _value = null;
      if (old) {
        ref.unset(old, inverseProperty, target);
      }
      _value = value;
      ref.set(_value, inverseProperty, target);
    }
  });
}
function Refs(a2, b) {
  if (!(this instanceof Refs)) {
    return new Refs(a2, b);
  }
  a2.inverse = b;
  b.inverse = a2;
  this.props = {};
  this.props[a2.name] = a2;
  this.props[b.name] = b;
}
Refs.prototype.bind = function(target, property) {
  if (typeof property === "string") {
    if (!this.props[property]) {
      throw new Error("no property <" + property + "> in ref");
    }
    property = this.props[property];
  }
  if (property.collection) {
    defineCollectionProperty(this, property, target);
  } else {
    defineProperty(this, property, target);
  }
};
Refs.prototype.ensureRefsCollection = function(target, property) {
  var collection = target[property.name];
  if (!isExtended(collection)) {
    defineCollectionProperty(this, property, target);
  }
  return collection;
};
Refs.prototype.ensureBound = function(target, property) {
  if (!hasOwnProperty(target, property)) {
    this.bind(target, property);
  }
};
Refs.prototype.unset = function(target, property, value) {
  if (target) {
    this.ensureBound(target, property);
    if (property.collection) {
      this.ensureRefsCollection(target, property).remove(value);
    } else {
      target[property.name] = void 0;
    }
  }
};
Refs.prototype.set = function(target, property, value) {
  if (target) {
    this.ensureBound(target, property);
    if (property.collection) {
      this.ensureRefsCollection(target, property).add(value);
    } else {
      target[property.name] = value;
    }
  }
};
var parentRefs = new Refs({ name: "children", enumerable: true, collection: true }, { name: "parent" }), labelRefs = new Refs({ name: "labels", enumerable: true, collection: true }, { name: "labelTarget" }), attacherRefs = new Refs({ name: "attachers", collection: true }, { name: "host" }), outgoingRefs = new Refs({ name: "outgoing", collection: true }, { name: "source" }), incomingRefs = new Refs({ name: "incoming", collection: true }, { name: "target" });
function ElementImpl() {
  Object.defineProperty(this, "businessObject", {
    writable: true
  });
  Object.defineProperty(this, "label", {
    get: function() {
      return this.labels[0];
    },
    set: function(newLabel) {
      var label = this.label, labels = this.labels;
      if (!newLabel && label) {
        labels.remove(label);
      } else {
        labels.add(newLabel, 0);
      }
    }
  });
  parentRefs.bind(this, "parent");
  labelRefs.bind(this, "labels");
  outgoingRefs.bind(this, "outgoing");
  incomingRefs.bind(this, "incoming");
}
function ShapeImpl() {
  ElementImpl.call(this);
  parentRefs.bind(this, "children");
  attacherRefs.bind(this, "host");
  attacherRefs.bind(this, "attachers");
}
e$3(ShapeImpl, ElementImpl);
function RootImpl() {
  ElementImpl.call(this);
  parentRefs.bind(this, "children");
}
e$3(RootImpl, ShapeImpl);
function LabelImpl() {
  ShapeImpl.call(this);
  labelRefs.bind(this, "labelTarget");
}
e$3(LabelImpl, ShapeImpl);
function ConnectionImpl() {
  ElementImpl.call(this);
  outgoingRefs.bind(this, "source");
  incomingRefs.bind(this, "target");
}
e$3(ConnectionImpl, ElementImpl);
var types = {
  connection: ConnectionImpl,
  shape: ShapeImpl,
  label: LabelImpl,
  root: RootImpl
};
function create(type, attrs) {
  var Type = types[type];
  if (!Type) {
    throw new Error("unknown type: <" + type + ">");
  }
  return assign(new Type(), attrs);
}
function isModelElement(obj) {
  return obj instanceof ElementImpl;
}
function ElementFactory() {
  this._uid = 12;
}
ElementFactory.prototype.createRoot = function(attrs) {
  return this.create("root", attrs);
};
ElementFactory.prototype.createLabel = function(attrs) {
  return this.create("label", attrs);
};
ElementFactory.prototype.createShape = function(attrs) {
  return this.create("shape", attrs);
};
ElementFactory.prototype.createConnection = function(attrs) {
  return this.create("connection", attrs);
};
ElementFactory.prototype.create = function(type, attrs) {
  attrs = assign({}, attrs || {});
  if (!attrs.id) {
    attrs.id = type + "_" + this._uid++;
  }
  return create(type, attrs);
};
var ElementTypes = /* @__PURE__ */ ((ElementTypes2) => {
  ElementTypes2["ACTIVITY"] = "domainStory:activity";
  ElementTypes2["CONNECTION"] = "domainStory:connection";
  ElementTypes2["ACTOR"] = "domainStory:actor";
  ElementTypes2["WORKOBJECT"] = "domainStory:workObject";
  ElementTypes2["GROUP"] = "domainStory:group";
  ElementTypes2["TEXTANNOTATION"] = "domainStory:textAnnotation";
  return ElementTypes2;
})(ElementTypes || {});
function getIconId(type) {
  if (type.startsWith(
    "domainStory:actor"
    /* ACTOR */
  )) {
    return type.replace("domainStory:actor", "");
  } else if (type.startsWith(
    "domainStory:workObject"
    /* WORKOBJECT */
  )) {
    return type.replace("domainStory:workObject", "");
  }
  return "";
}
let DomainStoryElementFactory$1 = (_a = class extends ElementFactory {
  constructor(domainStoryIdFactory) {
    super();
    this.domainStoryIdFactory = domainStoryIdFactory;
  }
  create(type, attrs) {
    if (!attrs) {
      return super.create(type, attrs);
    }
    if (!(attrs == null ? void 0 : attrs.businessObject)) {
      attrs.businessObject = {
        type: attrs["type"],
        name: attrs["name"] ? attrs["name"] : ""
      };
    }
    if (attrs.id) {
      this.domainStoryIdFactory.registerId(attrs.id);
    } else {
      attrs.id = this.domainStoryIdFactory.getId(type);
    }
    assign(attrs.businessObject, {
      id: attrs.id
    });
    const id = attrs.id;
    attrs.businessObject.get = function(key) {
      if (key === "id") {
        return id;
      } else {
        return void 0;
      }
    };
    attrs.businessObject.set = function(key, value) {
      if (key === "id") {
        assign(attrs.businessObject, { id: value });
      }
    };
    if (type === "shape") {
      const alreadyHasSize = attrs.height || attrs.width;
      if (!alreadyHasSize) {
        assign(attrs, this.getShapeSize(attrs["type"]));
      }
    }
    if (!("$instanceOf" in attrs.businessObject)) {
      Object.defineProperty(attrs.businessObject, "$instanceOf", {
        value: function(type2) {
          return this.type === type2;
        }
      });
    }
    return super.create(type, attrs);
  }
  getShapeSize(dstElementType) {
    const shapes = {
      __default: { width: 75, height: 75 },
      [ElementTypes.TEXTANNOTATION]: { width: 100, height: 30 },
      [ElementTypes.GROUP]: { width: 300, height: 200 }
    };
    return shapes[dstElementType] || shapes["__default"];
  }
}, _a.$inject = ["domainStoryIdFactory"], _a);
let DomainStoryIdFactory$1 = class DomainStoryIdFactory {
  getId(type) {
    return this.generateId(type);
  }
  registerId(id) {
    idList.push(id);
  }
  generateId(type) {
    let idNumber = this.fourDigitsId();
    let id = `${type}_${this.idSuffix(idNumber)}`;
    while (containsId(id)) {
      idNumber += 1;
      id = `${type}_${this.idSuffix(idNumber)}`;
    }
    idList.push(id);
    return id;
  }
  fourDigitsId() {
    return Math.floor(Math.random() * 1e4);
  }
  idSuffix(idNumber) {
    let id;
    if (idNumber > 9999) {
      id = "0";
    } else if (idNumber < 10) {
      id = "000" + idNumber;
    } else if (idNumber < 100) {
      id = "00" + idNumber;
    } else if (idNumber < 1e3) {
      id = "0" + idNumber;
    } else {
      id = "" + idNumber;
    }
    return id;
  }
};
function containsId(id) {
  let same = false;
  idList.forEach((element) => {
    if (id === element) {
      same = true;
    }
  });
  return same;
}
const idList = [];
const DomainStoryIdFactory2 = {
  __init__: ["domainStoryIdFactory"],
  domainStoryIdFactory: ["type", DomainStoryIdFactory$1]
};
const DomainStoryElementFactory = {
  __depends__: [DomainStoryIdFactory2],
  elementFactory: ["type", DomainStoryElementFactory$1]
};
var DEFAULT_BOX_PADDING = 0;
var DEFAULT_LABEL_SIZE = {
  width: 150,
  height: 50
};
function parseAlign(align) {
  var parts = align.split("-");
  return {
    horizontal: parts[0] || "center",
    vertical: parts[1] || "top"
  };
}
function parsePadding(padding) {
  if (isObject(padding)) {
    return assign({ top: 0, left: 0, right: 0, bottom: 0 }, padding);
  } else {
    return {
      top: padding,
      left: padding,
      right: padding,
      bottom: padding
    };
  }
}
function getTextBBox(text, fakeText) {
  fakeText.textContent = text;
  var textBBox;
  try {
    var bbox, emptyLine = text === "";
    fakeText.textContent = emptyLine ? "dummy" : text;
    textBBox = fakeText.getBBox();
    bbox = {
      width: textBBox.width + textBBox.x * 2,
      height: textBBox.height
    };
    if (emptyLine) {
      bbox.width = 0;
    }
    return bbox;
  } catch (e2) {
    console.log(e2);
    return { width: 0, height: 0 };
  }
}
function layoutNext(lines, maxWidth, fakeText) {
  var originalLine = lines.shift(), fitLine = originalLine;
  var textBBox;
  for (; ; ) {
    textBBox = getTextBBox(fitLine, fakeText);
    textBBox.width = fitLine ? textBBox.width : 0;
    if (fitLine === " " || fitLine === "" || textBBox.width < Math.round(maxWidth) || fitLine.length < 2) {
      return fit(lines, fitLine, originalLine, textBBox);
    }
    fitLine = shortenLine(fitLine, textBBox.width, maxWidth);
  }
}
function fit(lines, fitLine, originalLine, textBBox) {
  if (fitLine.length < originalLine.length) {
    var remainder = originalLine.slice(fitLine.length).trim();
    lines.unshift(remainder);
  }
  return {
    width: textBBox.width,
    height: textBBox.height,
    text: fitLine
  };
}
var SOFT_BREAK = "­";
function semanticShorten(line, maxLength) {
  var parts = line.split(/(\s|-|\u00AD)/g), part, shortenedParts = [], length2 = 0;
  if (parts.length > 1) {
    while (part = parts.shift()) {
      if (part.length + length2 < maxLength) {
        shortenedParts.push(part);
        length2 += part.length;
      } else {
        if (part === "-" || part === SOFT_BREAK) {
          shortenedParts.pop();
        }
        break;
      }
    }
  }
  var last = shortenedParts[shortenedParts.length - 1];
  if (last && last === SOFT_BREAK) {
    shortenedParts[shortenedParts.length - 1] = "-";
  }
  return shortenedParts.join("");
}
function shortenLine(line, width, maxWidth) {
  var length2 = Math.max(line.length * (maxWidth / width), 1);
  var shortenedLine = semanticShorten(line, length2);
  if (!shortenedLine) {
    shortenedLine = line.slice(0, Math.max(Math.round(length2 - 1), 1));
  }
  return shortenedLine;
}
function getHelperSvg() {
  var helperSvg = document.getElementById("helper-svg");
  if (!helperSvg) {
    helperSvg = create$1("svg");
    attr(helperSvg, {
      id: "helper-svg"
    });
    assignStyle(helperSvg, {
      visibility: "hidden",
      position: "fixed",
      width: 0,
      height: 0
    });
    document.body.appendChild(helperSvg);
  }
  return helperSvg;
}
function Text(config) {
  this._config = assign({}, {
    size: DEFAULT_LABEL_SIZE,
    padding: DEFAULT_BOX_PADDING,
    style: {},
    align: "center-top"
  }, config || {});
}
Text.prototype.createText = function(text, options) {
  return this.layoutText(text, options).element;
};
Text.prototype.getDimensions = function(text, options) {
  return this.layoutText(text, options).dimensions;
};
Text.prototype.layoutText = function(text, options) {
  var box = assign({}, this._config.size, options.box), style = assign({}, this._config.style, options.style), align = parseAlign(options.align || this._config.align), padding = parsePadding(options.padding !== void 0 ? options.padding : this._config.padding), fitBox = options.fitBox || false;
  var lineHeight = getLineHeight(style);
  var lines = text.split(/\u00AD?\r?\n/), layouted = [];
  var maxWidth = box.width - padding.left - padding.right;
  var helperText = create$1("text");
  attr(helperText, { x: 0, y: 0 });
  attr(helperText, style);
  var helperSvg = getHelperSvg();
  append(helperSvg, helperText);
  while (lines.length) {
    layouted.push(layoutNext(lines, maxWidth, helperText));
  }
  if (align.vertical === "middle") {
    padding.top = padding.bottom = 0;
  }
  var totalHeight = reduce(layouted, function(sum, line, idx) {
    return sum + (lineHeight || line.height);
  }, 0) + padding.top + padding.bottom;
  var maxLineWidth = reduce(layouted, function(sum, line, idx) {
    return line.width > sum ? line.width : sum;
  }, 0);
  var y2 = padding.top;
  if (align.vertical === "middle") {
    y2 += (box.height - totalHeight) / 2;
  }
  y2 -= (lineHeight || layouted[0].height) / 4;
  var textElement = create$1("text");
  attr(textElement, style);
  forEach(layouted, function(line) {
    var x2;
    y2 += lineHeight || line.height;
    switch (align.horizontal) {
      case "left":
        x2 = padding.left;
        break;
      case "right":
        x2 = (fitBox ? maxLineWidth : maxWidth) - padding.right - line.width;
        break;
      default:
        x2 = Math.max(((fitBox ? maxLineWidth : maxWidth) - line.width) / 2 + padding.left, 0);
    }
    var tspan = create$1("tspan");
    attr(tspan, { x: x2, y: y2 });
    tspan.textContent = line.text;
    append(textElement, tspan);
  });
  remove$1(helperText);
  var dimensions = {
    width: maxLineWidth,
    height: totalHeight
  };
  return {
    dimensions,
    element: textElement
  };
};
function getLineHeight(style) {
  if ("fontSize" in style && "lineHeight" in style) {
    return style.lineHeight * parseInt(style.fontSize, 10);
  }
}
const DEFAULT_FONT_SIZE = 12;
const LINE_HEIGHT_RATIO = 1.2;
const MIN_TEXT_ANNOTATION_HEIGHT = 30;
let DomainStoryTextRenderer$1 = (_b = class {
  constructor() {
    const defaultStyle = {
      fontFamily: "Arial, sans-serif",
      fontSize: DEFAULT_FONT_SIZE,
      fontWeight: "normal",
      lineHeight: LINE_HEIGHT_RATIO
    };
    const externalStyle = assign(
      defaultStyle,
      {
        fontSize: defaultStyle.fontSize - 1
      }
      // (config && config.externalStyle) || {},
    );
    this.config = {
      defaultStyle,
      externalStyle
    };
    this.textUtil = new Text({
      style: this.config.defaultStyle
    });
  }
  /**
   * Get the new bounds of an externally rendered and arranged label.
   */
  getExternalLabelBounds(bounds, text) {
    const layoutDimensions = this.textUtil.getDimensions(text, {
      box: {
        width: 90,
        height: 30
      },
      style: this.config.externalStyle
    });
    return {
      x: Math.round(bounds.x + bounds.width / 2 - layoutDimensions.width / 2),
      y: Math.round(bounds.y),
      width: Math.ceil(layoutDimensions.width),
      height: Math.ceil(layoutDimensions.height)
    };
  }
  /**
   * Get the new bounds of text annotation.
   */
  getTextAnnotationBounds(bounds, text) {
    const layoutDimensions = this.textUtil.getDimensions(text, {
      box: bounds,
      style: this.config.defaultStyle,
      align: "center-top",
      padding: 5
    });
    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: Math.max(
        MIN_TEXT_ANNOTATION_HEIGHT,
        Math.round(layoutDimensions.height)
      )
    };
  }
  /**
   * Create an arranged text element.
   *
   * @param {string} text
   * @param {TextLayoutConfig} [options]
   *
   * @return {SVGElement} rendered text
   */
  createText(text, options) {
    return this.textUtil.createText(text, options || {});
  }
  /**
   * Get the default text style.
   */
  getDefaultStyle() {
    return this.config.defaultStyle;
  }
  /**
   * Get the external text style.
   */
  getExternalStyle() {
    return this.config.externalStyle;
  }
}, _b.$inject = ["config.textRenderer"], _b);
const DomainStoryTextRenderer = {
  __init__: ["domainStoryTextRenderer"],
  domainStoryTextRenderer: ["type", DomainStoryTextRenderer$1]
};
let ElementRegistryService$1 = (_c = class {
  constructor(registry) {
    this.registry = registry;
    this.fullyInitialized = false;
  }
  /**
   * Initially, the registry has only the root-Element.
   * Once the canvas has bees initialized, we adjust the reference to point to the elements on the canvas for convenience
   */
  correctInitialize() {
    if (!this.fullyInitialized) {
      const root = this.registry.find(
        (element) => element.id.startsWith("__implicitroot")
      );
      if (root) {
        this.fullyInitialized = true;
      }
    }
  }
  clear() {
    this.fullyInitialized = false;
  }
  createObjectListForDSTDownload() {
    if (this.registry) {
      const allObjectsFromCanvas = this.getAllCanvasObjects();
      const groups = this.getAllGroups();
      const objectList = [];
      this.fillListOfCanvasObjects(allObjectsFromCanvas, objectList, groups);
      return objectList;
    }
    return [];
  }
  getAllActivities() {
    const activities = [];
    this.getAllCanvasObjects().forEach((element) => {
      if (element.type.includes(ElementTypes.ACTIVITY)) {
        activities.push(element);
      }
    });
    return activities;
  }
  getAllCanvasObjects() {
    var _a2;
    const allObjects = [];
    const groupObjects = [];
    this.checkChildForGroup(groupObjects, allObjects);
    while (groupObjects.length >= 1) {
      const currentGroup = groupObjects.pop();
      (_a2 = currentGroup == null ? void 0 : currentGroup.children) == null ? void 0 : _a2.forEach((child) => {
        const type = child.type;
        if (type.includes(ElementTypes.GROUP)) {
          groupObjects.push(child);
        }
      });
    }
    return allObjects;
  }
  // returns all groups on the canvas and inside other groups
  getAllGroups() {
    var _a2;
    const groupObjects = [];
    const allObjects = [];
    this.checkChildForGroup(groupObjects, allObjects);
    for (const group of groupObjects) {
      (_a2 = group.children) == null ? void 0 : _a2.forEach((child) => {
        if (child.type.includes(ElementTypes.GROUP)) {
          groupObjects.push(child);
        }
      });
    }
    const seenIds = /* @__PURE__ */ new Set();
    return groupObjects.filter((groupObject) => {
      const isNewId = !seenIds.has(groupObject.id);
      if (isNewId) {
        seenIds.add(groupObject.id);
      }
      return isNewId;
    });
  }
  // get a list of activities, that originate from an actor-type
  getActivitiesFromActors() {
    const activitiesFromActors = [];
    const activities = this.getAllActivities();
    activities.forEach((activity) => {
      var _a2;
      if ((_a2 = activity.source) == null ? void 0 : _a2.type.includes(ElementTypes.ACTOR)) {
        activitiesFromActors.push(activity);
      }
    });
    activitiesFromActors.sort(
      (activityCanvasA, activityCanvasB) => {
        const activityNumberA = Number(activityCanvasA.businessObject.number);
        const activityNumberB = Number(activityCanvasB.businessObject.number);
        return activityNumberA - activityNumberB;
      }
    );
    return activitiesFromActors;
  }
  getActivityFromActorById(id) {
    return this.getActivitiesFromActors().find((activity) => activity.id === id);
  }
  getUsedIcons() {
    const actors = this.getAllActors();
    const workobjects = this.getAllWorkobjects();
    return {
      actors: actors.map((a2) => a2.type.replace(ElementTypes.ACTOR, "")),
      workobjects: workobjects.map(
        (w2) => w2.type.replace(ElementTypes.WORKOBJECT, "")
      )
    };
  }
  getAllWorkobjects() {
    return this.getAllCanvasObjects().filter(
      (co) => co.type.includes(ElementTypes.WORKOBJECT)
    );
  }
  fillListOfCanvasObjects(allObjectsFromCanvas, objectList, groups) {
    allObjectsFromCanvas.forEach((canvasElement) => {
      if (canvasElement.type === ElementTypes.ACTIVITY) {
        objectList.push(canvasElement);
      } else {
        if (canvasElement.type === ElementTypes.TEXTANNOTATION) {
          canvasElement.businessObject.width = canvasElement.width;
          canvasElement.businessObject.height = canvasElement.height;
        }
        if (!objectList.includes(canvasElement)) {
          objectList.unshift(canvasElement);
        }
      }
    });
    groups.forEach((group) => {
      objectList.push(group);
    });
  }
  checkChildForGroup(groupObjects, allObjects) {
    const registryElementNames = this.registry.getAll();
    for (const entry of registryElementNames) {
      if (entry.businessObject) {
        const type = entry["type"];
        if (type && type.includes(ElementTypes.GROUP)) {
          groupObjects.push(entry);
        } else if (type) {
          allObjects.push(entry);
        }
      }
    }
  }
  getAllActors() {
    return this.getAllCanvasObjects().filter(
      (co) => co.type.includes(ElementTypes.ACTOR)
    );
  }
}, _c.$inject = ["elementRegistry"], _c);
const _DirtyFlagService = class _DirtyFlagService {
  constructor() {
    this.isDirtySubject = new BehaviorSubject(false);
    this.dirty$ = this.isDirtySubject.asObservable();
  }
  get dirty() {
    return this.isDirtySubject.value;
  }
  makeDirty() {
    this.isDirtySubject.next(true);
  }
  makeClean() {
    this.isDirtySubject.next(false);
  }
};
_DirtyFlagService.$inject = [];
let DirtyFlagService = _DirtyFlagService;
const ElementRegistryService = {
  __init__: ["domainStoryElementRegistryService", "domainStoryDirtyFlagService"],
  domainStoryElementRegistryService: ["type", ElementRegistryService$1],
  domainStoryDirtyFlagService: ["type", DirtyFlagService]
};
class Dictionary {
  constructor() {
    this.entries = [];
  }
  get length() {
    return this.entries.length;
  }
  all() {
    return this.entries;
  }
  size() {
    return this.entries.length;
  }
  isEmpty() {
    return this.entries.length <= 0;
  }
  has(key) {
    return this.entries.some((entry) => entry.key === key);
  }
  set(key, value) {
    if (!this.has(key)) {
      this.entries.push(new Entry(value, key));
    }
  }
  add(value, key) {
    this.set(key, value);
  }
  putEntry(entry) {
    if (!this.has(entry.key)) {
      this.entries.push(entry);
    }
  }
  keysArray() {
    return this.entries.map((entry) => entry.key);
  }
  addEach(object) {
    Object.keys(object).forEach((key) => {
      this.set(key, object[key]);
    });
  }
  addBuiltInIcons(builtInIcons) {
    builtInIcons.entries.forEach((entry) => {
      if (!this.has(entry.key)) {
        this.entries.push(entry);
      }
    });
  }
  appendDict(dict) {
    dict.entries.forEach((entry) => this.putEntry(entry));
  }
  clear() {
    this.entries = [];
  }
  delete(key) {
    this.entries = this.entries.filter((entry) => entry.key !== key);
  }
  get(key) {
    const found = this.entries.filter((entry) => entry.key === key);
    return found[0] ? found[0].value : null;
  }
}
class Entry {
  constructor(value, key, keyWords = []) {
    this.value = value;
    this.key = key;
    this.keyWords = keyWords;
  }
}
function sanitizeTextForSVGExport(str) {
  return str.replaceAll("--", "––");
}
function sanitizeIconName(name) {
  if (!name) {
    return "";
  }
  const nameWithoutFileEnding = name.lastIndexOf(".") > 0 ? name.substring(0, name.lastIndexOf(".")) : name;
  const map2 = {
    "/": "",
    "\\": "",
    ":": "",
    "*": "",
    "?": "",
    '"': "",
    "<": "",
    ">": "",
    "|": "",
    "(": "",
    ")": "",
    " ": "-"
  };
  const reg = /[/\\:*?"<>|() ]/gi;
  return nameWithoutFileEnding.trim().replace(reg, (match) => map2[match]);
}
const ICON_CSS_CLASS_PREFIX = "icon-domain-story-";
const customIcons = new Dictionary();
const _IconDictionaryService = class _IconDictionaryService {
  constructor() {
    this.selectedActorsDictionary = new Dictionary();
    this.selectedWorkObjectsDictionary = new Dictionary();
  }
  /** Load Icons from Configuration **/
  addIconsFromIconSetConfiguration(dictionaryType, iconTypes) {
    let collection;
    if (dictionaryType === ElementTypes.ACTOR) {
      collection = this.selectedActorsDictionary;
    } else if (dictionaryType === ElementTypes.WORKOBJECT) {
      collection = this.selectedWorkObjectsDictionary;
    }
    const allTypes = new Dictionary();
    allTypes.appendDict(customIcons);
    iconTypes.forEach((name) => {
      if (!collection.has(name)) {
        const src = allTypes.get(name);
        if (src) {
          this.registerIconForType(dictionaryType, name, src);
        }
      }
    });
  }
  addIconsToTypeDictionary(actorIcons, workObjectIcons) {
    if (!this.allInTypeDictionary(ElementTypes.ACTOR, actorIcons)) {
      this.addIconsFromIconSetConfiguration(
        ElementTypes.ACTOR,
        actorIcons.map((element) => getIconId(element.type))
      );
    }
    if (!this.allInTypeDictionary(ElementTypes.WORKOBJECT, workObjectIcons)) {
      this.addIconsFromIconSetConfiguration(
        ElementTypes.WORKOBJECT,
        workObjectIcons.map((element) => getIconId(element.type))
      );
    }
  }
  registerIconForType(type, name, src) {
    if (name.includes(type)) {
      throw new Error("Name should not include type!");
    }
    let collection = new Dictionary();
    if (type === ElementTypes.ACTOR) {
      collection = this.selectedActorsDictionary;
    } else if (type === ElementTypes.WORKOBJECT) {
      collection = this.selectedWorkObjectsDictionary;
    }
    collection.add(src, name);
  }
  unregisterIconForType(type, name) {
    if (name.includes(type)) {
      throw new Error("Name should not include type!");
    }
    let collection = new Dictionary();
    if (type === ElementTypes.ACTOR) {
      collection = this.selectedActorsDictionary;
    } else if (type === ElementTypes.WORKOBJECT) {
      collection = this.selectedWorkObjectsDictionary;
    }
    collection.delete(name);
  }
  updateIconRegistries(actors, workObjects, config) {
    const newIcons = new Dictionary();
    this.extractCustomIconsFromDictionary(config.actors, newIcons);
    this.extractCustomIconsFromDictionary(config.workObjects, newIcons);
    newIcons.keysArray().forEach((key) => {
      const custom = newIcons.get(key);
      this.addIMGToIconDictionary(custom, key);
    });
    const allCurrentIcons = new Dictionary();
    allCurrentIcons.appendDict(config.actors);
    allCurrentIcons.appendDict(config.workObjects);
    this.addIconsToCss(allCurrentIcons);
    this.addIconsToTypeDictionary(actors, workObjects);
  }
  addIMGToIconDictionary(input, name) {
    customIcons.set(name, input);
  }
  addIconsToCss(customIcons2) {
    const sheetEl = document.getElementById("iconsCss");
    customIcons2.keysArray().forEach((key) => {
      var _a2;
      let src = customIcons2.get(key);
      src = src.replace(/<svg[^>]+>/, (match) => {
        return match.replace(/ (width|height)="[^"]*"/g, "");
      });
      const base64Src = btoa(src);
      const iconStyle = `
                .${ICON_CSS_CLASS_PREFIX}${sanitizeIconName(key.toLowerCase())}::before {
                  mask-image: url('data:image/svg+xml;base64,${base64Src}');
                }
            `;
      (_a2 = sheetEl == null ? void 0 : sheetEl.sheet) == null ? void 0 : _a2.insertRule(iconStyle, sheetEl.sheet.cssRules.length);
    });
  }
  /** Getter & Setter **/
  getFullDictionary() {
    const fullDictionary = new Dictionary();
    fullDictionary.appendDict(customIcons);
    return fullDictionary;
  }
  getIconsAssignedAs(type) {
    if (type === ElementTypes.ACTOR) {
      return this.selectedActorsDictionary;
    } else if (type === ElementTypes.WORKOBJECT) {
      return this.selectedWorkObjectsDictionary;
    }
    return new Dictionary();
  }
  getTypeIconSRC(type, name) {
    if (type === ElementTypes.ACTOR) {
      return this.selectedActorsDictionary.get(name);
    } else if (type === ElementTypes.WORKOBJECT) {
      return this.selectedWorkObjectsDictionary.get(name);
    }
    throw new Error(`[IconDictionaryService] Unsupported value type: ${type}`);
  }
  getCSSClassOfIcon(name) {
    return ICON_CSS_CLASS_PREFIX + sanitizeIconName(name.toLowerCase());
  }
  getIconSource(name) {
    if (customIcons.has(name)) {
      return customIcons.get(name);
    }
    throw new Error(`[IconDictionaryService] Unsupported value name: ${name}`);
  }
  getActorsDictionary() {
    return this.selectedActorsDictionary;
  }
  getWorkObjectsDictionary() {
    return this.selectedWorkObjectsDictionary;
  }
  setIconSet(iconSet) {
    this.selectedActorsDictionary = iconSet.actors;
    this.selectedWorkObjectsDictionary = iconSet.workObjects;
  }
  allInTypeDictionary(type, elements) {
    let collection;
    if (type === ElementTypes.ACTOR) {
      collection = this.selectedActorsDictionary;
    } else if (type === ElementTypes.WORKOBJECT) {
      collection = this.selectedWorkObjectsDictionary;
    }
    let allIn = true;
    if (elements) {
      elements.forEach((element) => {
        if (!collection.has(getIconId(element.type))) {
          allIn = false;
        }
      });
    } else {
      return false;
    }
    return allIn;
  }
  extractCustomIconsFromDictionary(elementDictionary, customIcons2) {
    elementDictionary.keysArray().forEach((name) => {
      const sanitizedName = sanitizeIconName(name);
      if (!this.getFullDictionary().has(sanitizedName)) {
        customIcons2.add(elementDictionary.get(name), sanitizedName);
      }
    });
  }
};
_IconDictionaryService.$inject = [];
let IconDictionaryService = _IconDictionaryService;
let IconSetImportExportService$1 = (_d = class {
  constructor(iconDictionaryService) {
    this.iconDictionaryService = iconDictionaryService;
  }
  createIconSetConfiguration(fileConfiguration) {
    if (fileConfiguration === void 0) {
      return {
        actors: new Dictionary(),
        workObjects: new Dictionary()
      };
    }
    const actorsDict = new Dictionary();
    const workObjectsDict = new Dictionary();
    Object.keys(fileConfiguration.actors).forEach((key) => {
      const icon = fileConfiguration.actors[key];
      if (icon) {
        actorsDict.add(icon, sanitizeIconName(key));
      }
    });
    Object.keys(fileConfiguration.workObjects).forEach((key) => {
      const icon = fileConfiguration.workObjects[key];
      if (icon) {
        workObjectsDict.add(icon, sanitizeIconName(key));
      }
    });
    return {
      actors: actorsDict,
      workObjects: workObjectsDict
    };
  }
  loadConfiguration(customConfig) {
    let actorDict = new Dictionary();
    let workObjectDict = new Dictionary();
    if (customConfig.actors.keysArray()) {
      actorDict = customConfig.actors;
      workObjectDict = customConfig.workObjects;
    } else {
      actorDict.addEach(customConfig.actors);
      workObjectDict.addEach(customConfig.workObjects);
    }
    const actorKeys = actorDict.keysArray();
    const workObjectKeys = workObjectDict.keysArray();
    this.iconDictionaryService.updateIconRegistries([], [], customConfig);
    this.iconDictionaryService.addIconsFromIconSetConfiguration(
      ElementTypes.ACTOR,
      actorKeys
    );
    this.iconDictionaryService.addIconsFromIconSetConfiguration(
      ElementTypes.WORKOBJECT,
      workObjectKeys
    );
  }
  getCurrentConfigurationForExport() {
    const currentConfiguration = this.getCurrentConfiguration();
    if (currentConfiguration) {
      const actors = {};
      const workObjects = {};
      currentConfiguration.actors.all().forEach((entry) => {
        actors[entry.key] = entry.value;
      });
      currentConfiguration.workObjects.all().forEach((entry) => {
        workObjects[entry.key] = entry.value;
      });
      return {
        actors,
        workObjects
      };
    }
    return;
  }
  getCurrentConfiguration() {
    const actors = this.iconDictionaryService.getActorsDictionary();
    const workObjects = this.iconDictionaryService.getWorkObjectsDictionary();
    let iconSetConfiguration;
    if (actors.size() > 0 && workObjects.size() > 0) {
      iconSetConfiguration = this.createConfigFromDictionaries(
        actors,
        workObjects
      );
    }
    return iconSetConfiguration;
  }
  createConfigFromDictionaries(actorsDict, workObjectsDict) {
    const actorNames = actorsDict.keysArray();
    const workobjectNames = workObjectsDict.keysArray();
    const newActors = new Dictionary();
    const newWorkobjects = new Dictionary();
    actorNames.forEach((actor) => {
      newActors.add(actorsDict.get(actor), actor.replace(ElementTypes.ACTOR, ""));
    });
    workobjectNames.forEach((workObject) => {
      newWorkobjects.add(
        workObjectsDict.get(workObject),
        workObject.replace(ElementTypes.WORKOBJECT, "")
      );
    });
    return {
      actors: newActors,
      workObjects: newWorkobjects
    };
  }
}, _d.$inject = ["domainStoryIconDictionaryService"], _d);
const IconSetImportExportService = {
  __init__: [
    "domainStoryIconDictionaryService",
    "domainStoryIconSetImportExportService"
  ],
  domainStoryIconDictionaryService: ["type", IconDictionaryService],
  domainStoryIconSetImportExportService: ["type", IconSetImportExportService$1]
};
var DEFAULT_RENDER_PRIORITY = 1e3;
function BaseRenderer(eventBus, renderPriority) {
  var self = this;
  renderPriority = renderPriority || DEFAULT_RENDER_PRIORITY;
  eventBus.on(["render.shape", "render.connection"], renderPriority, function(evt, context) {
    var type = evt.type, element = context.element, visuals = context.gfx, attrs = context.attrs;
    if (self.canRender(element)) {
      if (type === "render.shape") {
        return self.drawShape(visuals, element, attrs);
      } else {
        return self.drawConnection(visuals, element, attrs);
      }
    }
  });
  eventBus.on(["render.getShapePath", "render.getConnectionPath"], renderPriority, function(evt, element) {
    if (self.canRender(element)) {
      if (evt.type === "render.getShapePath") {
        return self.getShapePath(element);
      } else {
        return self.getConnectionPath(element);
      }
    }
  });
}
BaseRenderer.prototype.canRender = function(element) {
};
BaseRenderer.prototype.drawShape = function(visuals, shape) {
};
BaseRenderer.prototype.drawConnection = function(visuals, connection) {
};
BaseRenderer.prototype.getShapePath = function(shape) {
};
BaseRenderer.prototype.getConnectionPath = function(connection) {
};
function is(element, type) {
  if (!element) {
    return false;
  }
  const bo = getBusinessObject(element);
  return bo && bo.type === type;
}
function getBusinessObject(element) {
  return element && element.businessObject || element;
}
function reworkGroupElements(parent, shape) {
  parent.children.slice().forEach((innerShape) => {
    if (innerShape.id !== shape.id) {
      if (innerShape.x >= shape.x && innerShape.x <= shape.x + shape.width) {
        if (innerShape.y >= shape.y && innerShape.y <= shape.y + shape.height) {
          if (innerShape.children.includes(shape)) {
            innerShape.children.remove(shape);
          }
          innerShape.parent = shape;
          if (!shape.children.includes(innerShape)) {
            shape.children.push(innerShape);
          }
        }
      }
    }
  });
}
function undoGroupRework(parent, shape) {
  var _a2, _b2;
  const superParent = parent.parent;
  parent.children.remove(shape);
  superParent.children.add(shape);
  shape.parent = superParent;
  const svgShape = (_a2 = document.querySelector(
    "[data-element-id=" + shape.id + "]"
  )) == null ? void 0 : _a2.parentElement;
  if (!svgShape) {
    throw new Error("No element with id " + shape.id + " found.");
  }
  const svgGroup = svgShape.parentElement;
  const svgGroupParent = (_b2 = svgGroup == null ? void 0 : svgGroup.parentElement) == null ? void 0 : _b2.parentElement;
  svgGroup == null ? void 0 : svgGroup.removeChild(svgShape);
  svgGroupParent == null ? void 0 : svgGroupParent.appendChild(svgShape);
}
function isCustomIcon(icon) {
  return icon.startsWith("data");
}
function isCustomSvgIcon(icon) {
  return icon.startsWith("data:image/svg");
}
function getScaledPath(param) {
  const rawPath = {
    d: "m {mx}, {my} m 10,0 l -10,0 l 0,{e.y0} l 10,0",
    height: 30,
    width: 10,
    heightElements: [30],
    widthElements: [10]
  };
  let mx, my;
  if (param.abspos) {
    mx = param.abspos.x;
    my = param.abspos.y;
  } else {
    mx = param.containerWidth * param.position.mx;
    my = param.containerHeight * param.position.my;
  }
  const coordinates = {};
  if (param.position) {
    const heightRatio = param.containerHeight / rawPath.height * param.yScaleFactor;
    const widthRatio = param.containerWidth / rawPath.width * param.xScaleFactor;
    for (let heightIndex = 0; heightIndex < rawPath.heightElements.length; heightIndex++) {
      coordinates["y" + heightIndex] = rawPath.heightElements[heightIndex] * heightRatio;
    }
    for (let widthIndex = 0; widthIndex < rawPath.widthElements.length; widthIndex++) {
      coordinates["x" + widthIndex] = rawPath.widthElements[widthIndex] * widthRatio;
    }
  }
  return format(rawPath.d, {
    mx,
    my,
    e: coordinates
  });
}
function format(str, obj) {
  return str.replace(tokenRegex, function(all, key) {
    return replacer(all, key, obj);
  });
}
const tokenRegex = /\{([^{}]+)}/g, objNotationRegex = /(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[(['"])(.+?)\2])(\(\))?/g;
function replacer(all, key, obj) {
  let res = obj;
  key.replace(
    objNotationRegex,
    function(_all, name, _quote, quotedName, isFunc) {
      name = name || quotedName;
      if (res) {
        if (name in res) {
          res = res[name];
        }
        return typeof res == "function" && isFunc && (res = res());
      }
    }
  );
  res = (res == null || res == obj ? all : res) + "";
  return res;
}
function getLabelAttr(semantic) {
  if (semantic.type.includes(ElementTypes.ACTOR) || semantic.type.includes(ElementTypes.WORKOBJECT) || semantic.type.includes(ElementTypes.ACTIVITY) || semantic.type.includes(ElementTypes.GROUP)) {
    return "name";
  }
  if (semantic.type.includes(ElementTypes.TEXTANNOTATION)) {
    return "text";
  } else {
    return "";
  }
}
function getNumberAttr(semantic) {
  if (is(semantic, ElementTypes.ACTIVITY)) {
    return "number";
  } else {
    return "";
  }
}
function getLabel(element) {
  let semantic;
  if (element.businessObject) {
    semantic = element.businessObject;
  } else {
    semantic = element;
  }
  const attr2 = getLabelAttr(semantic);
  if (attr2 && semantic) {
    return semantic[attr2] || "";
  }
}
function getNumber(element) {
  const semantic = element.businessObject, attr2 = getNumberAttr(semantic);
  if (attr2) {
    return semantic[attr2] || "";
  }
}
function setLabel(element, text) {
  let semantic;
  if (element.businessObject) {
    semantic = element.businessObject;
  } else {
    semantic = element;
  }
  const attr2 = getLabelAttr(semantic);
  if (attr2) {
    semantic[attr2] = text;
  }
  return element;
}
function setNumber(element, textNumber) {
  const semantic = element.businessObject, attr2 = getNumberAttr(semantic);
  if (attr2) {
    semantic[attr2] = textNumber;
  }
  return element;
}
function selectPartOfActivity(waypoints, angleActivity) {
  const lineLength = 49;
  let selectedActivity = 0;
  for (let i2 = 0; i2 < waypoints.length; i2++) {
    if (angleActivity[i2] === 0 || angleActivity[i2] === 180) {
      const length2 = Math.abs(waypoints[i2].x - waypoints[i2 + 1].x);
      if (length2 > lineLength) {
        selectedActivity = i2;
      }
    }
  }
  return selectedActivity;
}
function calculateTextWidth(text) {
  if (!text) {
    return 0;
  }
  let fontsize = text.length * 5.1;
  fontsize = fontsize / 2;
  fontsize += 20;
  return fontsize;
}
function autocomplete(input, workObjectNames, element, eventBus) {
  closeAllLists();
  let currentFocus, filteredWorkObjectNames;
  input.addEventListener("input", function() {
    var _a2;
    if (workObjectNames.length === 0) {
      return;
    }
    if (element["type"].includes(ElementTypes.WORKOBJECT)) {
      this.value = this.innerHTML;
    }
    const val = this.value;
    let autocompleteItem;
    closeAllLists();
    currentFocus = -1;
    const autocompleteList = document.createElement("DIV");
    autocompleteList.setAttribute("id", "autocomplete-list");
    autocompleteList.setAttribute("class", "autocomplete-items");
    (_a2 = this.parentNode) == null ? void 0 : _a2.appendChild(autocompleteList);
    filteredWorkObjectNames = [];
    for (const name of workObjectNames) {
      if (val) {
        if (name.substring(0, val.length).toUpperCase() === val.toUpperCase()) {
          autocompleteItem = document.createElement("DIV");
          autocompleteItem.innerHTML = "<strong>" + name.substring(0, val.length) + "</strong>" + name.substring(val.length);
          autocompleteItem.innerHTML += "<input type='hidden' value='" + name + "'>";
          autocompleteList.appendChild(autocompleteItem);
          filteredWorkObjectNames.push(name);
        }
      }
    }
    if (element["type"].includes(ElementTypes.ACTOR)) {
      autocompleteList.style.visibility = "hidden";
    }
  });
  input.onkeydown = function(e2) {
    let autocompleteList = document.getElementById("autocomplete-list");
    if (autocompleteList) {
      autocompleteList = autocompleteList.getElementsByTagName("div");
    } else {
      return;
    }
    switch (e2.key) {
      case "40": {
        currentFocus++;
        addActive(autocompleteList);
        break;
      }
      case "38": {
        currentFocus--;
        addActive(autocompleteList);
        break;
      }
      case "13": {
        e2.preventDefault();
        if (currentFocus > -1) {
          element.businessObject.name = filteredWorkObjectNames[currentFocus];
          eventBus.fire("element.changed", { element });
        }
        break;
      }
    }
  };
  function addActive(autocompleteList) {
    if (!autocompleteList || autocompleteList.length < 1) return false;
    removeActive(autocompleteList);
    if (currentFocus >= autocompleteList.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = autocompleteList.length - 1;
    autocompleteList[currentFocus].classList.add("autocomplete-active");
    return true;
  }
  function removeActive(autocompleteList) {
    if (autocompleteList.length > 1) {
      Array.from(autocompleteList).forEach((item) => {
        item.classList.remove("autocomplete-active");
      });
    }
  }
  function closeAllLists(survivor) {
    const autocompleteList = document.getElementsByClassName("autocomplete-items");
    Array.from(autocompleteList).forEach((item) => {
      var _a2;
      if (survivor != item && survivor != input) {
        (_a2 = item.parentNode) == null ? void 0 : _a2.removeChild(item);
      }
    });
  }
  document.addEventListener("click", function(e2) {
    closeAllLists(e2.target);
  });
}
const NULL_DIMENSIONS = {
  width: 0,
  height: 0
};
const _DomainStoryUpdateLabelHandler = class _DomainStoryUpdateLabelHandler {
  constructor(modeling, domainStoryTextRenderer) {
    this.modeling = modeling;
    this.domainStoryTextRenderer = domainStoryTextRenderer;
  }
  execute(context) {
    context.oldLabel = getLabel(context.element);
    context.oldNumber = getNumber(context.element);
    return this.setText(context.element, context.newLabel, context.newNumber);
  }
  revert(context) {
    return this.setText(context.element, context.oldLabel, context.oldNumber);
  }
  postExecute(context) {
    const element = context.element, label = element.label || element;
    let newBounds = context.newBounds;
    if (is(element, ElementTypes.TEXTANNOTATION)) {
      const bo = getBusinessObject(label);
      const text = bo.name || bo.text;
      if (!text) {
        return;
      }
      if (typeof newBounds === "undefined") {
        newBounds = this.domainStoryTextRenderer.getExternalLabelBounds(
          label,
          text
        );
      }
      if (newBounds) {
        this.modeling.resizeShape(label, newBounds, NULL_DIMENSIONS);
      }
    }
  }
  setText(element, text, textNumber) {
    const label = element.label || element;
    const number = element["number"] || element;
    const labelTarget = element["labelTarget"] || element;
    const numberTarget = element["numberTarget"] || element;
    setLabel(label, text);
    setNumber(number, textNumber);
    return [label, labelTarget, number, numberTarget];
  }
};
_DomainStoryUpdateLabelHandler.$inject = ["modeling", "domainStoryTextRenderer"];
let DomainStoryUpdateLabelHandler = _DomainStoryUpdateLabelHandler;
var DEFAULT_PRIORITY$3 = 1e3;
function CommandInterceptor(eventBus) {
  this._eventBus = eventBus;
}
CommandInterceptor.$inject = ["eventBus"];
function unwrapEvent(fn, that) {
  return function(event2) {
    return fn.call(that || null, event2.context, event2.command, event2);
  };
}
CommandInterceptor.prototype.on = function(events, hook, priority, handlerFn, unwrap, that) {
  if (isFunction(hook) || isNumber(hook)) {
    that = unwrap;
    unwrap = handlerFn;
    handlerFn = priority;
    priority = hook;
    hook = null;
  }
  if (isFunction(priority)) {
    that = unwrap;
    unwrap = handlerFn;
    handlerFn = priority;
    priority = DEFAULT_PRIORITY$3;
  }
  if (isObject(unwrap)) {
    that = unwrap;
    unwrap = false;
  }
  if (!isFunction(handlerFn)) {
    throw new Error("handlerFn must be a function");
  }
  if (!isArray$1(events)) {
    events = [events];
  }
  var eventBus = this._eventBus;
  forEach(events, function(event2) {
    var fullEvent = ["commandStack", event2, hook].filter(function(e2) {
      return e2;
    }).join(".");
    eventBus.on(fullEvent, priority, unwrap ? unwrapEvent(handlerFn, that) : handlerFn, that);
  });
};
CommandInterceptor.prototype.canExecute = createHook("canExecute");
CommandInterceptor.prototype.preExecute = createHook("preExecute");
CommandInterceptor.prototype.preExecuted = createHook("preExecuted");
CommandInterceptor.prototype.execute = createHook("execute");
CommandInterceptor.prototype.executed = createHook("executed");
CommandInterceptor.prototype.postExecute = createHook("postExecute");
CommandInterceptor.prototype.postExecuted = createHook("postExecuted");
CommandInterceptor.prototype.revert = createHook("revert");
CommandInterceptor.prototype.reverted = createHook("reverted");
function createHook(hook) {
  const hookFn = function(events, priority, handlerFn, unwrap, that) {
    if (isFunction(events) || isNumber(events)) {
      that = unwrap;
      unwrap = handlerFn;
      handlerFn = priority;
      priority = events;
      events = null;
    }
    this.on(events, hook, priority, handlerFn, unwrap, that);
  };
  return hookFn;
}
function RuleProvider(eventBus) {
  CommandInterceptor.call(this, eventBus);
  this.init();
}
RuleProvider.$inject = ["eventBus"];
e$3(RuleProvider, CommandInterceptor);
RuleProvider.prototype.addRule = function(actions, priority, fn) {
  var self = this;
  if (typeof actions === "string") {
    actions = [actions];
  }
  actions.forEach(function(action) {
    self.canExecute(action, priority, function(context, action2, event2) {
      return fn(context);
    }, true);
  });
};
RuleProvider.prototype.init = function() {
};
const HIGH_PRIORITY$4 = 1500;
const MIN_SIZE = 125;
function isGroup(element) {
  return element && /^domainStory:group/.test(element["type"]);
}
function isActor(element) {
  return element && /^domainStory:actor\w*/.test(element["type"]);
}
function isWorkObject(element) {
  return element && /^domainStory:workObject/.test(element["type"]);
}
function isActivity(element) {
  return element && /^domainStory:activity/.test(element["type"]);
}
function isConnection(element) {
  return element && /^domainStory:connection/.test(element["type"]);
}
function isAnnotation(element) {
  return element && /^domainStory:textAnnotation/.test(element["type"]);
}
function isBackground(element) {
  return element && /^__implicitroot/.test(element.id);
}
function isLabel(element) {
  var _a2;
  return element && !!((_a2 = element.label) == null ? void 0 : _a2.labelTarget);
}
function nonExistingOrLabel(element) {
  return !element || isLabel(element);
}
function canStartConnection(element) {
  if (nonExistingOrLabel(element)) {
    return null;
  }
  return false;
}
function canConnect(source, target) {
  if (isBackground(target) || isBackground(source)) {
    return false;
  }
  if (isGroup(target)) {
    return false;
  }
  if (source === target) {
    return false;
  }
  if (isActor(source) && isActor(target)) {
    return false;
  }
  if (isActivity(source) || isActivity(target)) {
    return false;
  }
  if (isConnection(source) || isConnection(target)) {
    return false;
  }
  if (isAnnotation(target)) {
    return { type: ElementTypes.CONNECTION };
  }
  return { type: ElementTypes.ACTIVITY };
}
function canResize(shape, newBounds) {
  if (is(shape, ElementTypes.GROUP)) {
    if (newBounds) {
      const lowerLeft = { x: shape.x, y: shape.y + shape.height };
      const lowerRight = { x: shape.x + shape.width, y: shape.y + shape.height };
      const upperRight = { x: shape.x + shape.width, y: shape.y };
      if (newBounds.x !== shape.x && newBounds.y !== shape.y) {
        if (newBounds.x > lowerRight.x - MIN_SIZE) {
          assign(newBounds, { x: lowerRight.x - MIN_SIZE });
        }
        if (newBounds.y > lowerRight.y - MIN_SIZE) {
          assign(newBounds, { y: lowerRight.y - MIN_SIZE });
        }
      }
      if (newBounds.x !== shape.x && newBounds.y === shape.y) {
        if (newBounds.x > upperRight.x - MIN_SIZE) {
          assign(newBounds, { x: upperRight.x - MIN_SIZE });
        }
      }
      if (newBounds.x === shape.x && newBounds.y !== shape.y) {
        if (newBounds.y > lowerLeft.y - MIN_SIZE) {
          assign(newBounds, { y: lowerLeft.y - MIN_SIZE });
        }
      }
      if (newBounds.height < MIN_SIZE) {
        assign(newBounds, {
          height: MIN_SIZE
        });
      }
      if (newBounds.width < MIN_SIZE) {
        assign(newBounds, {
          width: MIN_SIZE
        });
      }
    }
    return true;
  }
  return false;
}
function canConnectToAnnotation(source, target, connection) {
  if (isActivity(connection) && isAnnotation(target)) {
    return false;
  }
  if (isConnection(connection) && isAnnotation(source) && isAnnotation(target)) {
    return false;
  }
  return !(isConnection(connection) && !isAnnotation(target) && (isActor(source) || isWorkObject(source)));
}
let DomainStoryRules$1 = (_e = class extends RuleProvider {
  constructor(eventBus) {
    super(eventBus);
  }
  init() {
    this.addRule("elements.create", (context) => {
      const elements = context.elements, target = context.target;
      return every(elements, (element) => {
        if (isConnection(element)) {
          if (!element.source || !element.target) {
            return false;
          }
          return canConnect(element.source, element.target);
        }
        return this.canCreate(element, target);
      });
    });
    this.addRule("elements.move", HIGH_PRIORITY$4, (context) => {
      const target = context.target, shapes = context.shapes;
      return reduce(
        shapes,
        (result, s2) => {
          if (result === false) {
            return false;
          }
          return this.canCreate(s2, target);
        },
        void 0
      );
    });
    this.addRule("shape.create", HIGH_PRIORITY$4, (context) => {
      const target = context.target, shape = context.shape;
      return this.canCreate(shape, target);
    });
    this.addRule("connection.create", HIGH_PRIORITY$4, (context) => {
      const source = context.source, target = context.target;
      return canConnect(source, target);
    });
    this.addRule("connection.reconnect", HIGH_PRIORITY$4, (context) => {
      const connection = context.connection, source = context.hover || context.source, target = context.target;
      const result = canConnectToAnnotation(source, target, connection);
      if (!result) {
        return void 0;
      }
      return canConnect(source, target);
    });
    this.addRule("shape.resize", function(context) {
      const shape = context.shape, newBounds = context.newBounds;
      return canResize(shape, newBounds);
    });
    this.addRule("connection.start", function(context) {
      const source = context.source;
      return canStartConnection(source);
    });
    this.addRule("connection.updateWaypoints", function(context) {
      return {
        type: context.connection.type
      };
    });
    this.addRule("element.copy", function() {
      return true;
    });
  }
  /**
   * can a shape be created on target?
   */
  canCreate(shape, target) {
    return isBackground(target) || isGroup(shape) || isGroup(target);
  }
}, _e.$inject = ["eventBus"], _e);
let numberStash = 0;
let stashUse = false;
function getNumberStash() {
  const number = { use: stashUse, number: numberStash };
  stashUse = false;
  return number;
}
function focusElement(element) {
  setTimeout(() => element.focus(), 0);
}
const _DomainStoryLabelEditingProvider = class _DomainStoryLabelEditingProvider {
  constructor(modeling, domainStoryTextRenderer, labelDictionaryService, eventBus, canvas, directEditing, resizeHandles, commandStack) {
    this.modeling = modeling;
    this.domainStoryTextRenderer = domainStoryTextRenderer;
    this.labelDictionaryService = labelDictionaryService;
    this.eventBus = eventBus;
    this.canvas = canvas;
    this.directEditing = directEditing;
    commandStack.registerHandler(
      "element.updateLabel",
      DomainStoryUpdateLabelHandler
    );
    this.directEditing.registerProvider(this);
    eventBus.on("element.dblclick", (event2) => {
      this.activateDirectEdit(event2.element);
      if (is(event2.element, ElementTypes.ACTIVITY)) {
        numberStash = event2.element.businessObject.number;
        stashUse = false;
        this.directEditing.complete();
      }
    });
    eventBus.on(
      [
        "element.mousedown",
        "drag.init",
        "canvas.viewbox.changing",
        "autoPlace",
        "popupMenu.open"
      ],
      () => {
        if (this.directEditing.isActive()) {
          this.directEditing.complete();
        }
      }
    );
    eventBus.on(["commandStack.changed"], () => {
      if (this.directEditing.isActive()) {
        this.directEditing.cancel();
      }
    });
    eventBus.on("directEditing.activate", (event2) => {
      resizeHandles.removeResizers();
      const element = event2.active.element;
      this.createAutocomplete(element);
    });
    eventBus.on("create.end", 500, (event2) => {
      const element = event2.shape, canExecute = event2.context.canExecute;
      if (!canExecute) {
        return;
      }
      if (!is(element, ElementTypes.ACTIVITY)) {
        this.activateDirectEdit(element);
      }
      const editingBox = document.getElementsByClassName(
        "djs-direct-editing-content"
      );
      focusElement(editingBox.item(0));
    });
    eventBus.on("autoPlace.end", 500, (event2) => {
      this.activateDirectEdit(event2.shape);
    });
  }
  /**
   * activate direct editing for activities and text annotations.
   * @return an object with properties bounds (position and size), text and options
   */
  activate(element) {
    if (isBackground(element)) {
      return;
    }
    const text = getLabel(element);
    if (text === void 0) {
      return;
    }
    const context = {
      text
    };
    const bounds = this.getEditingBBox(element);
    assign(context, bounds);
    const options = {};
    if (is(element, ElementTypes.TEXTANNOTATION)) {
      assign(options, {
        resizable: true,
        autoResize: true
      });
    }
    assign(context, {
      options
    });
    return context;
  }
  /**
   * get the editing bounding box based on the element's size and position
   * @return an object containing information about position
   *         and size (fixed or minimum and/or maximum)
   */
  getEditingBBox(element) {
    var _a2, _b2;
    const target = element.label || element;
    const bbox = this.canvas.getAbsoluteBBox(target);
    const bounds = { x: bbox.x, y: bbox.y };
    const zoom2 = this.canvas.zoom();
    const defaultStyle = this.domainStoryTextRenderer.getDefaultStyle();
    const defaultFontSize = ((defaultStyle == null ? void 0 : defaultStyle.fontSize) ?? 1) * zoom2, defaultLineHeight = defaultStyle == null ? void 0 : defaultStyle.lineHeight;
    const style = {
      fontFamily: (_a2 = this.domainStoryTextRenderer.getDefaultStyle()) == null ? void 0 : _a2.fontFamily,
      fontWeight: (_b2 = this.domainStoryTextRenderer.getDefaultStyle()) == null ? void 0 : _b2.fontWeight
    };
    if (is(element, ElementTypes.GROUP)) {
      assign(bounds, {
        minWidth: bbox.width / 2.5 > 125 ? bbox.width / 2.5 : 125,
        maxWidth: bbox.width,
        minHeight: 30 * zoom2,
        x: bbox.x,
        y: bbox.y
      });
      assign(style, {
        fontSize: defaultFontSize + "px",
        lineHeight: defaultLineHeight,
        paddingTop: 7 * zoom2 + "px",
        paddingBottom: 7 * zoom2 + "px",
        paddingLeft: 5 * zoom2 + "px",
        paddingRight: 5 * zoom2 + "px",
        textAlign: "left"
      });
    }
    if (
      // we can't use util's is() function here because the type contains the name of the icon
      /^domainStory:actor\w*/.test(element["type"]) || /^domainStory:workObject\w*/.test(element["type"])
    ) {
      assign(bounds, {
        width: bbox.width,
        minHeight: 30,
        y: bbox.y + bbox.height - 20,
        x: bbox.x
      });
      assign(style, {
        fontSize: defaultFontSize + "px",
        lineHeight: defaultLineHeight,
        paddingTop: 7 * zoom2 + "px",
        paddingBottom: 7 * zoom2 + "px",
        paddingLeft: 5 * zoom2 + "px",
        paddingRight: 5 * zoom2 + "px"
      });
    }
    if (is(element, ElementTypes.TEXTANNOTATION)) {
      assign(bounds, {
        width: bbox.width,
        height: bbox.height,
        minWidth: 30 * zoom2,
        minHeight: 10 * zoom2
      });
      assign(style, {
        textAlign: "left",
        paddingTop: 7 * zoom2 + "px",
        paddingBottom: 7 * zoom2 + "px",
        paddingLeft: 5 * zoom2 + "px",
        paddingRight: 5 * zoom2 + "px",
        fontSize: defaultFontSize + "px",
        lineHeight: defaultLineHeight
      });
    }
    return { bounds, style };
  }
  update(element, newLabel, bounds) {
    const bbox = this.canvas.getAbsoluteBBox(element);
    let newBounds;
    if (!is(element, ElementTypes.TEXTANNOTATION)) {
      newBounds = {
        x: element.x,
        y: element.y,
        width: element.width / bbox.width * bounds.width,
        height: element.height / bbox.height * bounds.height
      };
    }
    this.modeling.updateLabel(
      element,
      sanitizeTextForSVGExport(newLabel),
      newBounds
    );
  }
  activateDirectEdit(element) {
    this.directEditing.activate(element);
  }
  createAutocomplete(element) {
    const editingBox = document.getElementsByClassName("djs-direct-editing-content");
    focusElement(editingBox.item(0));
    autocomplete(
      editingBox[0],
      this.labelDictionaryService.getUniqueWorkObjectNames(),
      element,
      this.eventBus
    );
  }
};
_DomainStoryLabelEditingProvider.$inject = [
  "modeling",
  "domainStoryTextRenderer",
  "domainStoryLabelDictionaryService",
  "eventBus",
  "canvas",
  "directEditing",
  "resizeHandles",
  "commandStack"
];
let DomainStoryLabelEditingProvider = _DomainStoryLabelEditingProvider;
function degrees(radians) {
  return radians * 180 / Math.PI;
}
function angleBetween(startPoint, endPoint) {
  let quadrant;
  if (startPoint.x <= endPoint.x) {
    if (startPoint.y >= endPoint.y) {
      quadrant = 0;
    } else {
      quadrant = 3;
    }
  } else {
    if (startPoint.y >= endPoint.y) {
      quadrant = 1;
    } else {
      quadrant = 2;
    }
  }
  const adjacent = Math.abs(startPoint.y - endPoint.y);
  const opposite = Math.abs(startPoint.x - endPoint.x);
  if (quadrant === 0) {
    return 90 - degrees(Math.atan2(opposite, adjacent));
  }
  if (quadrant === 1) {
    return 90 + degrees(Math.atan2(opposite, adjacent));
  }
  if (quadrant === 2) {
    return 270 - degrees(Math.atan2(opposite, adjacent));
  }
  if (quadrant === 3) {
    return 270 + degrees(Math.atan2(opposite, adjacent));
  }
  throw new Error("The value of quadrant is invalid.");
}
function numberBoxDefinitions(element) {
  const alignment = "center";
  const boxWidth = 30;
  const boxHeight = 30;
  let angle = 0;
  if (element.waypoints.length > 1) {
    angle = angleBetween(
      // Start of a first arrow segment
      element.waypoints[0],
      // End of a first arrow segment
      element.waypoints[1]
    ) ?? 0;
  }
  let x2 = element.waypoints[0].x;
  let y2 = element.waypoints[0].y;
  let fixedOffsetX = 0;
  let fixedOffsetY = 0;
  let angleDependantOffsetX = 0;
  let angleDependantOffsetY = 0;
  if (angle >= 0 && angle <= 45) {
    fixedOffsetX = 25;
    angleDependantOffsetY = 20 * (1 - angle / 45);
  } else if (angle <= 90) {
    fixedOffsetX = 5;
    angleDependantOffsetX = 15 * (1 - (angle - 45) / 45);
  } else if (angle <= 135) {
    fixedOffsetX = 5;
    angleDependantOffsetX = -20 * ((angle - 90) / 45);
  } else if (angle <= 180) {
    fixedOffsetX = -15;
    angleDependantOffsetY = 20 * ((angle - 135) / 45);
  } else if (angle <= 225) {
    fixedOffsetX = -15;
    fixedOffsetY = 15;
    angleDependantOffsetY = 25 * ((angle - 180) / 45);
  } else if (angle <= 270) {
    fixedOffsetX = 5;
    angleDependantOffsetX = -20 * (1 - (angle - 225) / 45);
    fixedOffsetY = 40;
  } else if (angle <= 315) {
    fixedOffsetX = 5;
    angleDependantOffsetX = 25 * ((angle - 270) / 45);
    fixedOffsetY = 40;
  } else {
    fixedOffsetX = 25;
    fixedOffsetY = 20;
    angleDependantOffsetY = 15 * (1 - (angle - 315) / 45);
  }
  x2 = x2 + fixedOffsetX + angleDependantOffsetX;
  y2 = y2 + fixedOffsetY + angleDependantOffsetY;
  return {
    textAlign: alignment,
    width: boxWidth,
    height: boxHeight,
    x: x2,
    y: y2
  };
}
function countLines(str) {
  return str.split(/\r\n|\r|\n/).length;
}
function labelPosition(waypoints, lines = 1) {
  const amountWaypoints = waypoints.length;
  let determinedPosition;
  let xPos;
  let yPos;
  if (amountWaypoints > 2) {
    const angleActivity = new Array(amountWaypoints - 1);
    for (let i2 = 0; i2 < amountWaypoints - 1; i2++) {
      angleActivity[i2] = angleBetween(waypoints[i2], waypoints[i2 + 1]);
    }
    const selectedActivity = selectPartOfActivity(waypoints, angleActivity);
    xPos = labelPositionX(
      waypoints[selectedActivity],
      waypoints[selectedActivity + 1]
    );
    yPos = labelPositionY(
      waypoints[selectedActivity],
      waypoints[selectedActivity + 1],
      lines
    );
    determinedPosition = {
      x: xPos,
      y: yPos,
      selected: selectedActivity
    };
    return determinedPosition;
  } else {
    xPos = labelPositionX(waypoints[0], waypoints[1]);
    yPos = labelPositionY(waypoints[0], waypoints[1], lines);
    determinedPosition = {
      x: xPos,
      y: yPos,
      selected: 0
    };
    return determinedPosition;
  }
}
function labelPositionX(startPoint, endPoint) {
  const angle = angleBetween(startPoint, endPoint);
  let offsetX = 0;
  let scaledAngle = 0;
  if (angle === 0 || angle === 180 || angle === 90 || angle === 270) {
    offsetX = 0;
  } else if (angle > 0 && angle < 90) {
    offsetX = 5 - angle / 6;
  } else if (angle > 90 && angle < 180) {
    scaledAngle = angle - 90;
    offsetX = 5 - scaledAngle / 18;
  } else if (angle > 180 && angle < 270) {
    scaledAngle = angle - 180;
    offsetX = scaledAngle / 18;
  } else if (angle > 270) {
    scaledAngle = angle - 270;
    offsetX = 5 - scaledAngle / 6;
  }
  return offsetX + (startPoint.x + endPoint.x) / 2;
}
function labelPositionY(startPoint, endPoint, lines = 1) {
  const angle = angleBetween(startPoint, endPoint);
  let offsetY = 0;
  let scaledAngle = 0;
  if (angle === 0 || angle === 180) {
    offsetY = 15;
  } else if (angle === 90 || angle === 270) {
    offsetY = 0;
  } else if (angle > 0 && angle < 90) {
    offsetY = 15 - angle / 6;
  } else if (angle > 90 && angle < 180) {
    scaledAngle = angle - 90;
    offsetY = -scaledAngle / 9 * lines;
  } else if (angle > 180 && angle < 270) {
    scaledAngle = angle - 180;
    offsetY = 15 - scaledAngle / 3;
  } else if (angle > 270) {
    scaledAngle = angle - 270;
    offsetY = -scaledAngle / 9 * lines;
  }
  return offsetY + (startPoint.y + endPoint.y) / 2;
}
const RENDERER_IDS = new Ids$1();
const numbers = [];
const DEFAULT_COLOR = "#000000";
let DomainStoryRenderer$1 = (_f = class extends BaseRenderer {
  constructor(eventBus, styles, canvas, domainStoryTextRenderer, domainStoryNumberingRegistry, elementRegistryService, dirtyFlagService, iconDictionaryService) {
    super(eventBus, 2e3);
    this.styles = styles;
    this.canvas = canvas;
    this.domainStoryTextRenderer = domainStoryTextRenderer;
    this.domainStoryNumberingRegistry = domainStoryNumberingRegistry;
    this.elementRegistryService = elementRegistryService;
    this.dirtyFlagService = dirtyFlagService;
    this.iconDictionaryService = iconDictionaryService;
    this.rendererId = RENDERER_IDS.next();
    this.markers = {};
    eventBus.on("bendpoint.move.start", 200, function(event2) {
      classes$1(event2.context.draggerGfx).add("bendpoint-dragging");
      canvas.addMarker(event2.context.connection, "djs-element-hidden");
    });
    eventBus.on("bendpoint.move.end", 2e3, function(event2) {
      canvas.removeMarker(event2.context.connection, "djs-element-hidden");
    });
  }
  canRender(element) {
    return /^domainStory:/.test(element["type"]);
  }
  drawShape(visuals, shape) {
    if (!String.prototype.startsWith) {
      Object.defineProperty(String.prototype, "startsWith", {
        value: function(search2, pos) {
          pos = !pos || pos < 0 ? 0 : +pos;
          return this.substring(pos, pos + search2.length) === search2;
        }
      });
    }
    const type = shape["type"];
    shape.businessObject.type = type;
    this.elementRegistryService.correctInitialize();
    this.dirtyFlagService.makeDirty();
    if (type.includes(ElementTypes.ACTOR)) {
      return this.drawActor(visuals, shape);
    } else if (type.includes(ElementTypes.WORKOBJECT)) {
      return this.drawWorkObject(visuals, shape);
    } else if (type.includes(ElementTypes.TEXTANNOTATION)) {
      return this.drawAnnotation(visuals, shape);
    } else if (type.includes(ElementTypes.GROUP)) {
      return this.drawGroup(visuals, shape);
    }
    throw new Error("[DomainStoryRenderer] The type of the shape is invalid.");
  }
  getShapePath(shape) {
    const type = shape["type"];
    if (type.includes(ElementTypes.ACTOR)) {
      return this.getPath(shape);
    } else if (type.includes(ElementTypes.WORKOBJECT)) {
      return this.getPath(shape);
    } else if (type.includes(ElementTypes.GROUP)) {
      return this.getPath(shape);
    } else if (type.includes(ElementTypes.TEXTANNOTATION)) {
      return this.getPath(shape);
    } else {
      return super.getShapePath(shape);
    }
  }
  drawConnection(visuals, connection) {
    const type = connection["type"];
    this.dirtyFlagService.makeDirty();
    if (!connection.businessObject.type) {
      connection.businessObject.type = type;
    }
    if (type === ElementTypes.ACTIVITY) {
      return this.drawActivity(visuals, connection);
    } else if (type === ElementTypes.CONNECTION) {
      return this.drawDSConnection(visuals, connection);
    } else {
      return super.drawConnection(visuals, connection);
    }
  }
  drawActor(parent, element) {
    const svgDynamicSizeAttributes = {
      width: element.width,
      height: element.height
    };
    let iconSRC = this.iconDictionaryService.getTypeIconSRC(
      ElementTypes.ACTOR,
      getIconId(element["type"])
    );
    iconSRC = this.getIconSvg(iconSRC, element);
    const actor = create$1(iconSRC);
    attr(actor, svgDynamicSizeAttributes);
    append(parent, actor);
    this.renderActorAndWorkObjectLabel(parent, element, "center", -5);
    return actor;
  }
  drawWorkObject(parent, element) {
    const svgDynamicSizeAttributes = {
      width: element.width * 0.65,
      height: element.height * 0.65,
      x: element.width / 2 - 25,
      y: element.height / 2 - 25
    };
    let iconSRC = this.iconDictionaryService.getTypeIconSRC(
      ElementTypes.WORKOBJECT,
      getIconId(element["type"])
    ) ?? "";
    iconSRC = this.getIconSvg(iconSRC, element);
    const workObject = create$1(iconSRC);
    attr(workObject, svgDynamicSizeAttributes);
    append(parent, workObject);
    this.renderActorAndWorkObjectLabel(parent, element, "center", -5);
    return workObject;
  }
  drawGroup(parentGfx, element) {
    if (!element.businessObject.pickedColor) {
      element.businessObject.pickedColor = DEFAULT_COLOR;
    }
    const rect = this.drawRect(
      parentGfx,
      element.width,
      element.height,
      0,
      0,
      assign(
        {
          fill: "none",
          stroke: element.businessObject.pickedColor
        },
        element["attrs"]
      )
    );
    this.renderActorAndWorkObjectLabel(parentGfx, element, "left-top", 8);
    return rect;
  }
  drawActivity(visuals, element) {
    this.adjustForTextOverlap(element);
    const attrs = this.useColorForActivity(element);
    const x2 = append(visuals, createLine(element.waypoints, attrs));
    this.renderActivityLabel(visuals, element);
    this.renderExternalNumber(visuals, element);
    this.fixConnectionInHTML(visuals.parentElement);
    if (visuals.getAttribute("djs-dragger")) {
      classes$1(visuals).remove("djs-dragger");
      classes$1(visuals).add("djs-connection-preview");
    }
    return x2;
  }
  drawDSConnection(visuals, element) {
    let attrs = "";
    attrs = this.styles.computeStyle(attrs, {
      stroke: element.businessObject.pickedColor ?? "black",
      strokeWidth: 1.5,
      strokeLinejoin: "round",
      strokeDasharray: "5, 5"
    });
    return append(visuals, createLine(element.waypoints, attrs));
  }
  drawAnnotation(parentGfx, element) {
    const style = {
      fill: "none",
      stroke: "none"
    };
    const text = element.businessObject.text || "";
    if (element.businessObject.text) {
      let height = element.height ?? 0;
      if (height === 0 && element.businessObject.number) {
        height = element.businessObject.number;
      }
      assign(element, {
        height
      });
      assign(element.businessObject, {
        number: height
      });
    }
    const textElement = this.drawRect(
      parentGfx,
      element.width,
      element.height,
      0,
      0,
      style
    );
    const textPathData = getScaledPath({
      xScaleFactor: 1,
      yScaleFactor: 1,
      containerWidth: element.width,
      containerHeight: element.height,
      position: {
        mx: 0,
        my: 0
      }
    });
    this.drawPath(parentGfx, textPathData, {
      stroke: element.businessObject.pickedColor ?? "black"
    });
    this.renderLabel(parentGfx, text, {
      box: element,
      align: "left-top",
      padding: 5,
      style: {
        fill: element.businessObject.pickedColor ?? "black"
      }
    });
    return textElement;
  }
  getActivityPath(connection) {
    const waypoints = connection.waypoints.map(function(p2) {
      return p2;
    });
    const activityPath = [["M", waypoints[0].x, waypoints[0].y]];
    waypoints.forEach(function(waypoint, index) {
      if (index !== 0) {
        activityPath.push(["L", waypoint.x, waypoint.y]);
      }
    });
    return componentsToPath(activityPath);
  }
  getPath(shape) {
    const rectangle = this.getRectPath(shape);
    return componentsToPath(rectangle);
  }
  drawRect(parentGfx, width, height, r2, offset, attrs) {
    if (isObject(offset)) {
      attrs = offset;
      offset = 0;
    }
    offset = offset || 0;
    attrs = this.styles.computeStyle(attrs, {
      stroke: "black",
      strokeWidth: 2,
      fill: "white"
    });
    const rect = create$1("rect");
    attr(rect, {
      x: offset,
      y: offset,
      width: width - offset * 2,
      height: height - offset * 2,
      rx: r2,
      ry: r2
    });
    attr(rect, attrs);
    append(parentGfx, rect);
    return rect;
  }
  drawPath(parentGfx, d2, attrs) {
    attrs = this.styles.computeStyle(attrs, ["no-fill"], {
      strokeWidth: 2,
      stroke: "black"
    });
    const path = create$1("path");
    attr(path, { d: d2 });
    attr(path, attrs);
    append(parentGfx, path);
    return path;
  }
  /**
   * creates an SVG path that describes a rectangle which encloses the given shape.
   */
  getRectPath(shape) {
    const offset = 5;
    const x2 = shape.x, y2 = shape.y, width = shape.width / 2 + offset, height = shape.height / 2 + offset;
    return [
      ["M", x2, y2],
      ["l", width, 0],
      ["l", width, height],
      ["l", -width, height],
      ["l", -width, 0],
      ["z"]
    ];
  }
  getIconSvg(icon, element) {
    const pickedColor = element.businessObject.pickedColor;
    if (isCustomIcon(icon)) {
      let dataURL;
      if (isCustomSvgIcon(icon)) {
        dataURL = this.applyColorToCustomSvgIcon(pickedColor, icon);
      } else {
        dataURL = icon;
        if (pickedColor && pickedColor !== DEFAULT_COLOR) {
          document.dispatchEvent(new CustomEvent("errorColoringOnlySvg"));
        }
      }
      return '<svg viewBox="0 0 24 24" width="48" height="48" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><image width="24" height="24" xlink:href="' + dataURL + '"/></svg>';
    } else {
      return this.applyColorToIcon(pickedColor, icon);
    }
  }
  applyColorToCustomSvgIcon(pickedColor, iconSvg) {
    if (!pickedColor) {
      return iconSvg;
    }
    const [rest, base64Svg] = iconSvg.split("base64,");
    const svg = atob(base64Svg);
    const coloredSvg = this.applyColorToIcon(pickedColor, svg);
    const encodedColoredSvg = btoa(coloredSvg);
    return rest + "base64," + encodedColoredSvg;
  }
  applyColorToIcon(pickedColor = DEFAULT_COLOR, iconSvg) {
    const match = iconSvg.match(/fill=\s*"(?!none).*?"|fill:\s*[#r]\w*[;\s]{1}/);
    if (match && match.some((it) => it)) {
      return iconSvg.replaceAll(/fill=\s*"(?!none).*?"/g, `fill="${pickedColor}"`).replaceAll(/fill:\s*[#r]\w*[;\s]{1}/g, `fill:${pickedColor};`);
    } else {
      const index = iconSvg.indexOf("<svg ") + 5;
      return iconSvg.substring(0, index) + ' fill=" ' + pickedColor + '" ' + iconSvg.substring(index);
    }
  }
  adjustForTextOverlap(element) {
    const source = element.source;
    const target = element.target;
    const waypoints = element.waypoints;
    const startPoint = waypoints[0];
    const endPoint = waypoints[waypoints.length - 1];
    if (startPoint && endPoint && source && target) {
      this.checkIfPointOverlapsText(startPoint, source);
      this.checkIfPointOverlapsText(endPoint, source);
    }
  }
  useColorForActivity(element) {
    if (!element.businessObject.pickedColor) {
      element.businessObject.pickedColor = "black";
    }
    const attrs = "";
    return this.styles.computeStyle(attrs, {
      stroke: element.businessObject.pickedColor,
      fill: "none",
      strokeWidth: 1.5,
      strokeLinejoin: "round",
      markerEnd: this.marker(
        "activity",
        "black",
        element.businessObject.pickedColor
      )
    });
  }
  renderActivityLabel(parentGfx, element) {
    const semantic = element.businessObject;
    const waypoints = element.waypoints;
    const lines = countLines(semantic.name);
    const position = labelPosition(waypoints, lines);
    const startPoint = element.waypoints[position.selected];
    const endPoint = element.waypoints[position.selected + 1];
    const angle = angleBetween(startPoint, endPoint);
    let alignment = "left";
    let boxWidth = 500;
    let xStart = position.x;
    if (angle === 0 || angle === 180) {
      boxWidth = Math.abs(startPoint.x - endPoint.x);
      alignment = "center";
      xStart = (startPoint.x + endPoint.x) / 2 - calculateTextWidth(semantic.name);
    }
    const box = {
      textAlign: alignment,
      width: boxWidth,
      height: 30,
      x: xStart,
      y: position.y
    };
    if (semantic.name && semantic.name.length) {
      return this.renderLabel(
        parentGfx,
        semantic.name,
        {
          box,
          fitBox: true,
          style: assign({}, this.domainStoryTextRenderer.getExternalStyle(), {
            fill: "black",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            hyphens: "auto"
          })
        },
        element["type"]
      );
    }
    return void 0;
  }
  checkIfPointOverlapsText(point, source) {
    if (point.y > source["y"] + 60) {
      if (point.x > source["x"] + 3 && point.x < source["x"] + 72) {
        const lineOffset = this.getLineOffset(source);
        if (source["y"] + 75 + lineOffset > point.y) {
          point.y += lineOffset;
        }
      }
    }
  }
  getLineOffset(element) {
    var _a2;
    const id = element.id;
    let offset = 0;
    const objects = document.getElementsByClassName("djs-element djs-shape");
    for (let i2 = 0; i2 < objects.length; i2++) {
      const data_id = (_a2 = objects.item(i2)) == null ? void 0 : _a2.getAttribute("data-element-id");
      if (data_id === id) {
        const object = objects.item(i2);
        const text = object == null ? void 0 : object.getElementsByTagName("text")[0];
        const tspans = text == null ? void 0 : text.getElementsByTagName("tspan");
        if (tspans) {
          const tspan = tspans[tspans.length - 1];
          offset = parseInt(tspan.getAttribute("y") ?? "0");
        }
      }
    }
    return offset - 70;
  }
  fixConnectionInHTML(wantedConnection) {
    if (wantedConnection) {
      const polylines = wantedConnection.getElementsByTagName("polyline");
      if (polylines.length > 1) {
        polylines[1].setAttribute(
          "points",
          polylines[0].getAttribute("points")
        );
      }
    }
  }
  /**
   * marker functions ("markers" are arrowheads of activities)
   */
  marker(type, fill, stroke) {
    const id = type + "-" + fill + "-" + stroke + "-" + this.rendererId;
    if (!this.markers[id]) {
      this.createMarker(type, fill, stroke);
    }
    return "url(#" + id + ")";
  }
  createMarker(type, fill, stroke) {
    const id = type + "-" + fill + "-" + stroke + "-" + this.rendererId;
    if (type === "activity") {
      const activityArrow = create$1("path");
      attr(activityArrow, { d: "M 1 5 L 11 10 L 1 15 Z" });
      this.addMarker(id, {
        element: activityArrow,
        ref: { x: 11, y: 10 },
        scale: 0.5,
        attrs: {
          fill: stroke,
          stroke
        }
      });
    }
  }
  addMarker(id, options) {
    const attrs = assign(
      {
        fill: "black",
        strokeWidth: 1,
        strokeLinecap: "round",
        strokeDasharray: "none"
      },
      options.attrs
    );
    const ref = options.ref || { x: 0, y: 0 };
    const scale = options.scale || 1;
    if (attrs.strokeDasharray === "none") {
      attrs.strokeDasharray = [1e4, 1];
    }
    const marker = create$1("marker");
    attr(options.element, attrs);
    append(marker, options.element);
    attr(marker, {
      id,
      viewBox: "0 0 20 20",
      refX: ref.x,
      refY: ref.y,
      markerWidth: 20 * scale,
      markerHeight: 20 * scale,
      orient: "auto"
    });
    let defs = query("defs", this.canvas._svg);
    if (!defs) {
      defs = create$1("defs");
      append(this.canvas._svg, defs);
    }
    append(defs, marker);
    this.markers[id] = marker;
  }
  /**
   * Generate the automatic Number for an activity originating from an actor
   */
  generateActivityNumber(parentGfx, element, box) {
    const numberStash2 = getNumberStash();
    const semantic = element.businessObject;
    if (numberStash2.use) {
      semantic.number = numberStash2.number;
    }
    numbers[semantic.number] = true;
    box.x -= 26;
    box.y -= 16;
    if (semantic.number < 10) {
      box.x += 3;
    }
    const newRenderedNumber = this.renderNumber(
      parentGfx,
      semantic.number,
      this.numberStyle(box),
      element["type"]
    );
    this.domainStoryNumberingRegistry.add(newRenderedNumber, semantic.number);
  }
  renderNumber(parentGfx, number, options, type) {
    const text = this.domainStoryTextRenderer.createText(String(number), options);
    classes$1(text).add("djs-labelNumber");
    this.setCoordinates(type, text, options, parentGfx);
    const circle = create$1("path");
    const radius = 11;
    const x2 = options.box.x + 18 + (number > 9 ? 3 : 0);
    const y2 = options.box.y - radius + 7;
    attr(circle, {
      d: `
      M ${x2} ${y2}
      m ${radius},0
      a ${radius},${radius} 0 1,0 ${-11 * 2},0
      a ${radius},${radius} 0 1,0 ${radius * 2},0
      `,
      fill: "white",
      stroke: "black"
    });
    append(parentGfx, circle);
    append(parentGfx, text);
    return text;
  }
  /**
   * render the number associated with an activity
   */
  renderExternalNumber(parentGfx, element) {
    if (element && element.source) {
      const semantic = element.businessObject;
      const box = numberBoxDefinitions(element);
      if (semantic.number == null && element.source["type"] && element.source["type"].includes(ElementTypes.ACTOR)) {
        this.domainStoryNumberingRegistry.generateAutomaticNumber(element);
      }
      if (semantic.number && element.source["type"].includes(ElementTypes.ACTOR)) {
        this.generateActivityNumber(parentGfx, element, box);
      } else {
        semantic.number = null;
      }
    }
  }
  numberStyle(box) {
    return {
      box,
      fitBox: true,
      style: assign({}, this.domainStoryTextRenderer.getExternalStyle(), {
        fill: "black",
        position: "absolute"
      })
    };
  }
  setCoordinates(type, text, options, parentGfx) {
    var _a2, _b2;
    if (/:activity$/.test(type)) {
      text.innerHTML = this.manipulateInnerHTMLXLabel(
        text.children,
        options.box.x,
        0
      );
      text.innerHTML = this.manipulateInnerHTMLYLabel(
        text.children,
        options.box.y,
        0
      );
    } else if (/:actor/.test(type)) {
      const h2 = ((_a2 = parentGfx.firstChild) == null ? void 0 : _a2.getAttribute("height")) ?? "";
      text.innerHTML = this.manipulateInnerHTMLYLabel(text.children, h2, 0);
    } else if (/:workObject/.test(type)) {
      const h2 = ((_b2 = parentGfx.firstChild) == null ? void 0 : _b2.getAttribute("height")) ?? "";
      text.innerHTML = this.manipulateInnerHTMLYLabel(text.children, h2, 26);
    }
  }
  /**
   * render a label on the canvas
   */
  renderLabel(parentGfx, label, options, type) {
    const text = this.domainStoryTextRenderer.createText(label || "", options);
    classes$1(text).add("djs-label");
    this.setCoordinates(type ?? "", text, options, parentGfx);
    append(parentGfx, text);
    return text;
  }
  renderActorAndWorkObjectLabel(parentGfx, element, align, padding) {
    const businessObject = element.businessObject;
    return this.renderLabel(
      parentGfx,
      businessObject.name,
      {
        box: element,
        align,
        padding: padding ? padding : 0,
        style: {
          fill: "#000000"
        }
      },
      element["type"]
    );
  }
  /**
   * determine the X-coordinate of the label / number to be rendered
   */
  manipulateInnerHTMLXLabel(children, x2, offset) {
    if (!children) {
      throw new Error("[DomainStoryRenderer] Parameter children is undefined!");
    }
    let result = "";
    for (let i2 = 0; i2 < children.length; i2++) {
      result += children[i2].outerHTML.replace(
        /x="-?\d*.\d*"/,
        'x="' + (Number(x2) + offset + 14) + '"'
      );
    }
    return result;
  }
  /**
   * determine the Y-coordinate of the label / number to be rendered
   */
  manipulateInnerHTMLYLabel(children, y2, offset) {
    let result = "";
    for (let i2 = 0; i2 < children.length; i2++) {
      result += children[i2].outerHTML.replace(
        /y="-?\d*.\d*"/,
        'y="' + (Number(y2) + offset + 14 * i2) + '"'
      );
    }
    return result;
  }
}, _f.$inject = [
  "eventBus",
  "styles",
  "canvas",
  "domainStoryTextRenderer",
  "domainStoryNumberingRegistry",
  "domainStoryElementRegistryService",
  "domainStoryDirtyFlagService",
  "domainStoryIconDictionaryService"
], _f);
function CommandStack$1(eventBus, injector) {
  this._handlerMap = {};
  this._stack = [];
  this._stackIdx = -1;
  this._currentExecution = {
    actions: [],
    dirty: [],
    trigger: null
  };
  this._injector = injector;
  this._eventBus = eventBus;
  this._uid = 1;
  eventBus.on([
    "diagram.destroy",
    "diagram.clear"
  ], function() {
    this.clear(false);
  }, this);
}
CommandStack$1.$inject = ["eventBus", "injector"];
CommandStack$1.prototype.execute = function(command, context) {
  if (!command) {
    throw new Error("command required");
  }
  this._currentExecution.trigger = "execute";
  const action = { command, context };
  this._pushAction(action);
  this._internalExecute(action);
  this._popAction();
};
CommandStack$1.prototype.canExecute = function(command, context) {
  const action = { command, context };
  const handler = this._getHandler(command);
  let result = this._fire(command, "canExecute", action);
  if (result === void 0) {
    if (!handler) {
      return false;
    }
    if (handler.canExecute) {
      result = handler.canExecute(context);
    }
  }
  return result;
};
CommandStack$1.prototype.clear = function(emit) {
  this._stack.length = 0;
  this._stackIdx = -1;
  if (emit !== false) {
    this._fire("changed", { trigger: "clear" });
  }
};
CommandStack$1.prototype.undo = function() {
  let action = this._getUndoAction(), next;
  if (action) {
    this._currentExecution.trigger = "undo";
    this._pushAction(action);
    while (action) {
      this._internalUndo(action);
      next = this._getUndoAction();
      if (!next || next.id !== action.id) {
        break;
      }
      action = next;
    }
    this._popAction();
  }
};
CommandStack$1.prototype.redo = function() {
  let action = this._getRedoAction(), next;
  if (action) {
    this._currentExecution.trigger = "redo";
    this._pushAction(action);
    while (action) {
      this._internalExecute(action, true);
      next = this._getRedoAction();
      if (!next || next.id !== action.id) {
        break;
      }
      action = next;
    }
    this._popAction();
  }
};
CommandStack$1.prototype.register = function(command, handler) {
  this._setHandler(command, handler);
};
CommandStack$1.prototype.registerHandler = function(command, handlerCls) {
  if (!command || !handlerCls) {
    throw new Error("command and handlerCls must be defined");
  }
  const handler = this._injector.instantiate(handlerCls);
  this.register(command, handler);
};
CommandStack$1.prototype.canUndo = function() {
  return !!this._getUndoAction();
};
CommandStack$1.prototype.canRedo = function() {
  return !!this._getRedoAction();
};
CommandStack$1.prototype._getRedoAction = function() {
  return this._stack[this._stackIdx + 1];
};
CommandStack$1.prototype._getUndoAction = function() {
  return this._stack[this._stackIdx];
};
CommandStack$1.prototype._internalUndo = function(action) {
  const command = action.command, context = action.context;
  const handler = this._getHandler(command);
  this._atomicDo(() => {
    this._fire(command, "revert", action);
    if (handler.revert) {
      this._markDirty(handler.revert(context));
    }
    this._revertedAction(action);
    this._fire(command, "reverted", action);
  });
};
CommandStack$1.prototype._fire = function(command, qualifier, event2) {
  if (arguments.length < 3) {
    event2 = qualifier;
    qualifier = null;
  }
  const names = qualifier ? [command + "." + qualifier, qualifier] : [command];
  let result;
  event2 = this._eventBus.createEvent(event2);
  for (const name of names) {
    result = this._eventBus.fire("commandStack." + name, event2);
    if (event2.cancelBubble) {
      break;
    }
  }
  return result;
};
CommandStack$1.prototype._createId = function() {
  return this._uid++;
};
CommandStack$1.prototype._atomicDo = function(fn) {
  const execution = this._currentExecution;
  execution.atomic = true;
  try {
    fn();
  } finally {
    execution.atomic = false;
  }
};
CommandStack$1.prototype._internalExecute = function(action, redo) {
  const command = action.command, context = action.context;
  const handler = this._getHandler(command);
  if (!handler) {
    throw new Error("no command handler registered for <" + command + ">");
  }
  this._pushAction(action);
  if (!redo) {
    this._fire(command, "preExecute", action);
    if (handler.preExecute) {
      handler.preExecute(context);
    }
    this._fire(command, "preExecuted", action);
  }
  this._atomicDo(() => {
    this._fire(command, "execute", action);
    if (handler.execute) {
      this._markDirty(handler.execute(context));
    }
    this._executedAction(action, redo);
    this._fire(command, "executed", action);
  });
  if (!redo) {
    this._fire(command, "postExecute", action);
    if (handler.postExecute) {
      handler.postExecute(context);
    }
    this._fire(command, "postExecuted", action);
  }
  this._popAction();
};
CommandStack$1.prototype._pushAction = function(action) {
  const execution = this._currentExecution, actions = execution.actions;
  const baseAction = actions[0];
  if (execution.atomic) {
    throw new Error("illegal invocation in <execute> or <revert> phase (action: " + action.command + ")");
  }
  if (!action.id) {
    action.id = baseAction && baseAction.id || this._createId();
  }
  actions.push(action);
};
CommandStack$1.prototype._popAction = function() {
  const execution = this._currentExecution, trigger = execution.trigger, actions = execution.actions, dirty = execution.dirty;
  actions.pop();
  if (!actions.length) {
    this._eventBus.fire("elements.changed", { elements: uniqueBy("id", dirty.reverse()) });
    dirty.length = 0;
    this._fire("changed", { trigger });
    execution.trigger = null;
  }
};
CommandStack$1.prototype._markDirty = function(elements) {
  const execution = this._currentExecution;
  if (!elements) {
    return;
  }
  elements = isArray$1(elements) ? elements : [elements];
  execution.dirty = execution.dirty.concat(elements);
};
CommandStack$1.prototype._executedAction = function(action, redo) {
  const stackIdx = ++this._stackIdx;
  if (!redo) {
    this._stack.splice(stackIdx, this._stack.length, action);
  }
};
CommandStack$1.prototype._revertedAction = function(action) {
  this._stackIdx--;
};
CommandStack$1.prototype._getHandler = function(command) {
  return this._handlerMap[command];
};
CommandStack$1.prototype._setHandler = function(command, handler) {
  if (!command || !handler) {
    throw new Error("command and handler required");
  }
  if (this._handlerMap[command]) {
    throw new Error("overriding handler for command <" + command + ">");
  }
  this._handlerMap[command] = handler;
};
const CommandStack = {
  commandStack: ["type", CommandStack$1]
};
const DomainStoryRenderer = {
  __depends__: [
    DomainStoryTextRenderer,
    ElementRegistryService,
    ElementRegistryService,
    IconSetImportExportService,
    CommandStack
  ],
  __init__: ["domainStoryRenderer"],
  domainStoryRenderer: ["type", DomainStoryRenderer$1]
};
function ChangeSupport(eventBus, canvas, elementRegistry, graphicsFactory) {
  eventBus.on("element.changed", function(event2) {
    var element = event2.element;
    if (element.parent || element === canvas.getRootElement()) {
      event2.gfx = elementRegistry.getGraphics(element);
    }
    if (!event2.gfx) {
      return;
    }
    eventBus.fire(getType(element) + ".changed", event2);
  });
  eventBus.on("elements.changed", function(event2) {
    var elements = event2.elements;
    elements.forEach(function(e2) {
      eventBus.fire("element.changed", { element: e2 });
    });
    graphicsFactory.updateContainments(elements);
  });
  eventBus.on("shape.changed", function(event2) {
    graphicsFactory.update("shape", event2.element, event2.gfx);
  });
  eventBus.on("connection.changed", function(event2) {
    graphicsFactory.update("connection", event2.element, event2.gfx);
  });
}
ChangeSupport.$inject = [
  "eventBus",
  "canvas",
  "elementRegistry",
  "graphicsFactory"
];
const ChangeSupportModule = {
  __init__: ["changeSupport"],
  changeSupport: ["type", ChangeSupport]
};
function AlignElements(modeling, canvas) {
  this._modeling = modeling;
  this._canvas = canvas;
}
AlignElements.$inject = ["modeling", "canvas"];
AlignElements.prototype.preExecute = function(context) {
  var modeling = this._modeling;
  var elements = context.elements, alignment = context.alignment;
  forEach(elements, function(element) {
    var delta2 = {
      x: 0,
      y: 0
    };
    if (isDefined(alignment.left)) {
      delta2.x = alignment.left - element.x;
    } else if (isDefined(alignment.right)) {
      delta2.x = alignment.right - element.width - element.x;
    } else if (isDefined(alignment.center)) {
      delta2.x = alignment.center - Math.round(element.width / 2) - element.x;
    } else if (isDefined(alignment.top)) {
      delta2.y = alignment.top - element.y;
    } else if (isDefined(alignment.bottom)) {
      delta2.y = alignment.bottom - element.height - element.y;
    } else if (isDefined(alignment.middle)) {
      delta2.y = alignment.middle - Math.round(element.height / 2) - element.y;
    }
    modeling.moveElements([element], delta2, element.parent);
  });
};
AlignElements.prototype.postExecute = function(context) {
};
function AppendShapeHandler(modeling) {
  this._modeling = modeling;
}
AppendShapeHandler.$inject = ["modeling"];
AppendShapeHandler.prototype.preExecute = function(context) {
  var source = context.source;
  if (!source) {
    throw new Error("source required");
  }
  var target = context.target || source.parent, shape = context.shape, hints = context.hints || {};
  shape = context.shape = this._modeling.createShape(
    shape,
    context.position,
    target,
    { attach: hints.attach }
  );
  context.shape = shape;
};
AppendShapeHandler.prototype.postExecute = function(context) {
  var hints = context.hints || {};
  if (!existsConnection(context.source, context.shape)) {
    if (hints.connectionTarget === context.source) {
      this._modeling.connect(context.shape, context.source, context.connection);
    } else {
      this._modeling.connect(context.source, context.shape, context.connection);
    }
  }
};
function existsConnection(source, target) {
  return some(source.outgoing, function(c2) {
    return c2.target === target;
  });
}
function CreateConnectionHandler(canvas, layouter) {
  this._canvas = canvas;
  this._layouter = layouter;
}
CreateConnectionHandler.$inject = ["canvas", "layouter"];
CreateConnectionHandler.prototype.execute = function(context) {
  var connection = context.connection, source = context.source, target = context.target, parent = context.parent, parentIndex = context.parentIndex, hints = context.hints;
  if (!source || !target) {
    throw new Error("source and target required");
  }
  if (!parent) {
    throw new Error("parent required");
  }
  connection.source = source;
  connection.target = target;
  if (!connection.waypoints) {
    connection.waypoints = this._layouter.layoutConnection(connection, hints);
  }
  this._canvas.addConnection(connection, parent, parentIndex);
  return connection;
};
CreateConnectionHandler.prototype.revert = function(context) {
  var connection = context.connection;
  this._canvas.removeConnection(connection);
  connection.source = null;
  connection.target = null;
  return connection;
};
var round$2 = Math.round;
function CreateElementsHandler(modeling) {
  this._modeling = modeling;
}
CreateElementsHandler.$inject = [
  "modeling"
];
CreateElementsHandler.prototype.preExecute = function(context) {
  var elements = context.elements, parent = context.parent, parentIndex = context.parentIndex, position = context.position, hints = context.hints;
  var modeling = this._modeling;
  forEach(elements, function(element) {
    if (!isNumber(element.x)) {
      element.x = 0;
    }
    if (!isNumber(element.y)) {
      element.y = 0;
    }
  });
  var visibleElements = filter(elements, function(element) {
    return !element.hidden;
  });
  var bbox = getBBox(visibleElements);
  forEach(elements, function(element) {
    if (isConnection$1(element)) {
      element.waypoints = map(element.waypoints, function(waypoint) {
        return {
          x: round$2(waypoint.x - bbox.x - bbox.width / 2 + position.x),
          y: round$2(waypoint.y - bbox.y - bbox.height / 2 + position.y)
        };
      });
    }
    assign(element, {
      x: round$2(element.x - bbox.x - bbox.width / 2 + position.x),
      y: round$2(element.y - bbox.y - bbox.height / 2 + position.y)
    });
  });
  var parents = getParents(elements);
  var cache = {};
  forEach(elements, function(element) {
    if (isConnection$1(element)) {
      cache[element.id] = isNumber(parentIndex) ? modeling.createConnection(
        cache[element.source.id],
        cache[element.target.id],
        parentIndex,
        element,
        element.parent || parent,
        hints
      ) : modeling.createConnection(
        cache[element.source.id],
        cache[element.target.id],
        element,
        element.parent || parent,
        hints
      );
      return;
    }
    var createShapeHints = assign({}, hints);
    if (parents.indexOf(element) === -1) {
      createShapeHints.autoResize = false;
    }
    if (isLabel$1(element)) {
      createShapeHints = omit(createShapeHints, ["attach"]);
    }
    cache[element.id] = isNumber(parentIndex) ? modeling.createShape(
      element,
      pick(element, ["x", "y", "width", "height"]),
      element.parent || parent,
      parentIndex,
      createShapeHints
    ) : modeling.createShape(
      element,
      pick(element, ["x", "y", "width", "height"]),
      element.parent || parent,
      createShapeHints
    );
  });
  context.elements = values(cache);
};
var round$1 = Math.round;
function CreateShapeHandler(canvas) {
  this._canvas = canvas;
}
CreateShapeHandler.$inject = ["canvas"];
CreateShapeHandler.prototype.execute = function(context) {
  var shape = context.shape, positionOrBounds = context.position, parent = context.parent, parentIndex = context.parentIndex;
  if (!parent) {
    throw new Error("parent required");
  }
  if (!positionOrBounds) {
    throw new Error("position required");
  }
  if (positionOrBounds.width !== void 0) {
    assign(shape, positionOrBounds);
  } else {
    assign(shape, {
      x: positionOrBounds.x - round$1(shape.width / 2),
      y: positionOrBounds.y - round$1(shape.height / 2)
    });
  }
  this._canvas.addShape(shape, parent, parentIndex);
  return shape;
};
CreateShapeHandler.prototype.revert = function(context) {
  var shape = context.shape;
  this._canvas.removeShape(shape);
  return shape;
};
function CreateLabelHandler(canvas) {
  CreateShapeHandler.call(this, canvas);
}
e$3(CreateLabelHandler, CreateShapeHandler);
CreateLabelHandler.$inject = ["canvas"];
var originalExecute = CreateShapeHandler.prototype.execute;
CreateLabelHandler.prototype.execute = function(context) {
  var label = context.shape;
  ensureValidDimensions(label);
  label.labelTarget = context.labelTarget;
  return originalExecute.call(this, context);
};
var originalRevert = CreateShapeHandler.prototype.revert;
CreateLabelHandler.prototype.revert = function(context) {
  context.shape.labelTarget = null;
  return originalRevert.call(this, context);
};
function ensureValidDimensions(label) {
  ["width", "height"].forEach(function(prop) {
    if (typeof label[prop] === "undefined") {
      label[prop] = 0;
    }
  });
}
function remove(collection, element) {
  if (!collection || !element) {
    return -1;
  }
  var idx = collection.indexOf(element);
  if (idx !== -1) {
    collection.splice(idx, 1);
  }
  return idx;
}
function add(collection, element, idx) {
  if (!collection || !element) {
    return;
  }
  if (typeof idx !== "number") {
    idx = -1;
  }
  var currentIdx = collection.indexOf(element);
  if (currentIdx !== -1) {
    if (currentIdx === idx) {
      return;
    } else {
      if (idx !== -1) {
        collection.splice(currentIdx, 1);
      } else {
        return;
      }
    }
  }
  if (idx !== -1) {
    collection.splice(idx, 0, element);
  } else {
    collection.push(element);
  }
}
function indexOf(collection, element) {
  if (!collection || !element) {
    return -1;
  }
  return collection.indexOf(element);
}
function saveClear(collection, removeFn) {
  if (typeof removeFn !== "function") {
    throw new Error("removeFn iterator must be a function");
  }
  if (!collection) {
    return;
  }
  var e2;
  while (e2 = collection[0]) {
    removeFn(e2);
  }
  return collection;
}
function DeleteConnectionHandler(canvas, modeling) {
  this._canvas = canvas;
  this._modeling = modeling;
}
DeleteConnectionHandler.$inject = [
  "canvas",
  "modeling"
];
DeleteConnectionHandler.prototype.preExecute = function(context) {
  var modeling = this._modeling;
  var connection = context.connection;
  saveClear(connection.incoming, function(connection2) {
    modeling.removeConnection(connection2, { nested: true });
  });
  saveClear(connection.outgoing, function(connection2) {
    modeling.removeConnection(connection2, { nested: true });
  });
};
DeleteConnectionHandler.prototype.execute = function(context) {
  var connection = context.connection, parent = connection.parent;
  context.parent = parent;
  context.parentIndex = indexOf(parent.children, connection);
  context.source = connection.source;
  context.target = connection.target;
  this._canvas.removeConnection(connection);
  connection.source = null;
  connection.target = null;
  return connection;
};
DeleteConnectionHandler.prototype.revert = function(context) {
  var connection = context.connection, parent = context.parent, parentIndex = context.parentIndex;
  connection.source = context.source;
  connection.target = context.target;
  add(parent.children, connection, parentIndex);
  this._canvas.addConnection(connection, parent);
  return connection;
};
function DeleteElementsHandler(modeling, elementRegistry) {
  this._modeling = modeling;
  this._elementRegistry = elementRegistry;
}
DeleteElementsHandler.$inject = [
  "modeling",
  "elementRegistry"
];
DeleteElementsHandler.prototype.postExecute = function(context) {
  var modeling = this._modeling, elementRegistry = this._elementRegistry, elements = context.elements;
  forEach(elements, function(element) {
    if (!elementRegistry.get(element.id)) {
      return;
    }
    if (element.waypoints) {
      modeling.removeConnection(element);
    } else {
      modeling.removeShape(element);
    }
  });
};
function DeleteShapeHandler(canvas, modeling) {
  this._canvas = canvas;
  this._modeling = modeling;
}
DeleteShapeHandler.$inject = ["canvas", "modeling"];
DeleteShapeHandler.prototype.preExecute = function(context) {
  var modeling = this._modeling;
  var shape = context.shape;
  saveClear(shape.incoming, function(connection) {
    modeling.removeConnection(connection, { nested: true });
  });
  saveClear(shape.outgoing, function(connection) {
    modeling.removeConnection(connection, { nested: true });
  });
  saveClear(shape.children, function(child) {
    if (isConnection$1(child)) {
      modeling.removeConnection(child, { nested: true });
    } else {
      modeling.removeShape(child, { nested: true });
    }
  });
};
DeleteShapeHandler.prototype.execute = function(context) {
  var canvas = this._canvas;
  var shape = context.shape, oldParent = shape.parent;
  context.oldParent = oldParent;
  context.oldParentIndex = indexOf(oldParent.children, shape);
  canvas.removeShape(shape);
  return shape;
};
DeleteShapeHandler.prototype.revert = function(context) {
  var canvas = this._canvas;
  var shape = context.shape, oldParent = context.oldParent, oldParentIndex = context.oldParentIndex;
  add(oldParent.children, shape, oldParentIndex);
  canvas.addShape(shape, oldParent);
  return shape;
};
function DistributeElements(modeling) {
  this._modeling = modeling;
}
DistributeElements.$inject = ["modeling"];
var OFF_AXIS = {
  x: "y",
  y: "x"
};
DistributeElements.prototype.preExecute = function(context) {
  var modeling = this._modeling;
  var groups = context.groups, axis = context.axis, dimension = context.dimension;
  function updateRange(group, element) {
    group.range.min = Math.min(element[axis], group.range.min);
    group.range.max = Math.max(element[axis] + element[dimension], group.range.max);
  }
  function center2(element) {
    return element[axis] + element[dimension] / 2;
  }
  function lastIdx(arr) {
    return arr.length - 1;
  }
  function rangeDiff(range) {
    return range.max - range.min;
  }
  function centerElement(refCenter, element) {
    var delta2 = { y: 0 };
    delta2[axis] = refCenter - center2(element);
    if (delta2[axis]) {
      delta2[OFF_AXIS[axis]] = 0;
      modeling.moveElements([element], delta2, element.parent);
    }
  }
  var firstGroup = groups[0], lastGroupIdx = lastIdx(groups), lastGroup = groups[lastGroupIdx];
  var margin, spaceInBetween, groupsSize = 0;
  forEach(groups, function(group, idx) {
    var sortedElements, refElem, refCenter;
    if (group.elements.length < 2) {
      if (idx && idx !== groups.length - 1) {
        updateRange(group, group.elements[0]);
        groupsSize += rangeDiff(group.range);
      }
      return;
    }
    sortedElements = sortBy(group.elements, axis);
    refElem = sortedElements[0];
    if (idx === lastGroupIdx) {
      refElem = sortedElements[lastIdx(sortedElements)];
    }
    refCenter = center2(refElem);
    group.range = null;
    forEach(sortedElements, function(element) {
      centerElement(refCenter, element);
      if (group.range === null) {
        group.range = {
          min: element[axis],
          max: element[axis] + element[dimension]
        };
        return;
      }
      updateRange(group, element);
    });
    if (idx && idx !== groups.length - 1) {
      groupsSize += rangeDiff(group.range);
    }
  });
  spaceInBetween = Math.abs(lastGroup.range.min - firstGroup.range.max);
  margin = Math.round((spaceInBetween - groupsSize) / (groups.length - 1));
  if (margin < groups.length - 1) {
    return;
  }
  forEach(groups, function(group, groupIdx) {
    var delta2 = {}, prevGroup;
    if (group === firstGroup || group === lastGroup) {
      return;
    }
    prevGroup = groups[groupIdx - 1];
    group.range.max = 0;
    forEach(group.elements, function(element, idx) {
      delta2[OFF_AXIS[axis]] = 0;
      delta2[axis] = prevGroup.range.max - element[axis] + margin;
      if (group.range.min !== element[axis]) {
        delta2[axis] += element[axis] - group.range.min;
      }
      if (delta2[axis]) {
        modeling.moveElements([element], delta2, element.parent);
      }
      group.range.max = Math.max(element[axis] + element[dimension], idx ? group.range.max : 0);
    });
  });
};
DistributeElements.prototype.postExecute = function(context) {
};
function LayoutConnectionHandler(layouter, canvas) {
  this._layouter = layouter;
  this._canvas = canvas;
}
LayoutConnectionHandler.$inject = ["layouter", "canvas"];
LayoutConnectionHandler.prototype.execute = function(context) {
  var connection = context.connection;
  var oldWaypoints = connection.waypoints;
  assign(context, {
    oldWaypoints
  });
  connection.waypoints = this._layouter.layoutConnection(connection, context.hints);
  return connection;
};
LayoutConnectionHandler.prototype.revert = function(context) {
  var connection = context.connection;
  connection.waypoints = context.oldWaypoints;
  return connection;
};
function MoveConnectionHandler() {
}
MoveConnectionHandler.prototype.execute = function(context) {
  var connection = context.connection, delta2 = context.delta;
  var newParent = context.newParent || connection.parent, newParentIndex = context.newParentIndex, oldParent = connection.parent;
  context.oldParent = oldParent;
  context.oldParentIndex = remove(oldParent.children, connection);
  add(newParent.children, connection, newParentIndex);
  connection.parent = newParent;
  forEach(connection.waypoints, function(p2) {
    p2.x += delta2.x;
    p2.y += delta2.y;
    if (p2.original) {
      p2.original.x += delta2.x;
      p2.original.y += delta2.y;
    }
  });
  return connection;
};
MoveConnectionHandler.prototype.revert = function(context) {
  var connection = context.connection, newParent = connection.parent, oldParent = context.oldParent, oldParentIndex = context.oldParentIndex, delta2 = context.delta;
  remove(newParent.children, connection);
  add(oldParent.children, connection, oldParentIndex);
  connection.parent = oldParent;
  forEach(connection.waypoints, function(p2) {
    p2.x -= delta2.x;
    p2.y -= delta2.y;
    if (p2.original) {
      p2.original.x -= delta2.x;
      p2.original.y -= delta2.y;
    }
  });
  return connection;
};
function getNewAttachPoint(point, oldBounds, newBounds) {
  var oldCenter = center(oldBounds), newCenter = center(newBounds), oldDelta = delta(point, oldCenter);
  var newDelta = {
    x: oldDelta.x * (newBounds.width / oldBounds.width),
    y: oldDelta.y * (newBounds.height / oldBounds.height)
  };
  return roundPoint({
    x: newCenter.x + newDelta.x,
    y: newCenter.y + newDelta.y
  });
}
function getResizedSourceAnchor(connection, shape, oldBounds) {
  var waypoints = safeGetWaypoints(connection), waypointsInsideNewBounds = getWaypointsInsideBounds(waypoints, shape), oldAnchor = waypoints[0];
  if (waypointsInsideNewBounds.length) {
    return waypointsInsideNewBounds[waypointsInsideNewBounds.length - 1];
  }
  return getNewAttachPoint(oldAnchor.original || oldAnchor, oldBounds, shape);
}
function getResizedTargetAnchor(connection, shape, oldBounds) {
  var waypoints = safeGetWaypoints(connection), waypointsInsideNewBounds = getWaypointsInsideBounds(waypoints, shape), oldAnchor = waypoints[waypoints.length - 1];
  if (waypointsInsideNewBounds.length) {
    return waypointsInsideNewBounds[0];
  }
  return getNewAttachPoint(oldAnchor.original || oldAnchor, oldBounds, shape);
}
function getMovedSourceAnchor(connection, source, moveDelta) {
  var waypoints = safeGetWaypoints(connection), oldBounds = subtract(source, moveDelta), oldAnchor = waypoints[0];
  return getNewAttachPoint(oldAnchor.original || oldAnchor, oldBounds, source);
}
function getMovedTargetAnchor(connection, target, moveDelta) {
  var waypoints = safeGetWaypoints(connection), oldBounds = subtract(target, moveDelta), oldAnchor = waypoints[waypoints.length - 1];
  return getNewAttachPoint(oldAnchor.original || oldAnchor, oldBounds, target);
}
function subtract(bounds, delta2) {
  return {
    x: bounds.x - delta2.x,
    y: bounds.y - delta2.y,
    width: bounds.width,
    height: bounds.height
  };
}
function safeGetWaypoints(connection) {
  var waypoints = connection.waypoints;
  if (!waypoints.length) {
    throw new Error("connection#" + connection.id + ": no waypoints");
  }
  return waypoints;
}
function getWaypointsInsideBounds(waypoints, bounds) {
  var originalWaypoints = map(waypoints, getOriginal);
  return filter(originalWaypoints, function(waypoint) {
    return isInsideBounds(waypoint, bounds);
  });
}
function isInsideBounds(point, bounds) {
  return getOrientation(bounds, point, 1) === "intersect";
}
function getOriginal(point) {
  return point.original || point;
}
function MoveClosure() {
  this.allShapes = {};
  this.allConnections = {};
  this.enclosedElements = {};
  this.enclosedConnections = {};
  this.topLevel = {};
}
MoveClosure.prototype.add = function(element, isTopLevel) {
  return this.addAll([element], isTopLevel);
};
MoveClosure.prototype.addAll = function(elements, isTopLevel) {
  var newClosure = getClosure(elements, !!isTopLevel, this);
  assign(this, newClosure);
  return this;
};
function MoveHelper(modeling) {
  this._modeling = modeling;
}
MoveHelper.prototype.moveRecursive = function(elements, delta2, newParent) {
  if (!elements) {
    return [];
  } else {
    return this.moveClosure(this.getClosure(elements), delta2, newParent);
  }
};
MoveHelper.prototype.moveClosure = function(closure, delta2, newParent, newHost, primaryShape) {
  var modeling = this._modeling;
  var allShapes = closure.allShapes, allConnections = closure.allConnections, enclosedConnections = closure.enclosedConnections, topLevel = closure.topLevel, keepParent = false;
  if (primaryShape && primaryShape.parent === newParent) {
    keepParent = true;
  }
  forEach(allShapes, function(shape) {
    modeling.moveShape(shape, delta2, topLevel[shape.id] && !keepParent && newParent, {
      recurse: false,
      layout: false
    });
  });
  forEach(allConnections, function(c2) {
    var sourceMoved = !!allShapes[c2.source.id], targetMoved = !!allShapes[c2.target.id];
    if (enclosedConnections[c2.id] && sourceMoved && targetMoved) {
      modeling.moveConnection(c2, delta2, topLevel[c2.id] && !keepParent && newParent);
    } else {
      modeling.layoutConnection(c2, {
        connectionStart: sourceMoved && getMovedSourceAnchor(c2, c2.source, delta2),
        connectionEnd: targetMoved && getMovedTargetAnchor(c2, c2.target, delta2)
      });
    }
  });
};
MoveHelper.prototype.getClosure = function(elements) {
  return new MoveClosure().addAll(elements, true);
};
function MoveElementsHandler(modeling) {
  this._helper = new MoveHelper(modeling);
}
MoveElementsHandler.$inject = ["modeling"];
MoveElementsHandler.prototype.preExecute = function(context) {
  context.closure = this._helper.getClosure(context.shapes);
};
MoveElementsHandler.prototype.postExecute = function(context) {
  var hints = context.hints, primaryShape;
  if (hints && hints.primaryShape) {
    primaryShape = hints.primaryShape;
    hints.oldParent = primaryShape.parent;
  }
  this._helper.moveClosure(
    context.closure,
    context.delta,
    context.newParent,
    context.newHost,
    primaryShape
  );
};
function MoveShapeHandler(modeling) {
  this._modeling = modeling;
  this._helper = new MoveHelper(modeling);
}
MoveShapeHandler.$inject = ["modeling"];
MoveShapeHandler.prototype.execute = function(context) {
  var shape = context.shape, delta2 = context.delta, newParent = context.newParent || shape.parent, newParentIndex = context.newParentIndex, oldParent = shape.parent;
  context.oldBounds = pick(shape, ["x", "y", "width", "height"]);
  context.oldParent = oldParent;
  context.oldParentIndex = remove(oldParent.children, shape);
  add(newParent.children, shape, newParentIndex);
  assign(shape, {
    parent: newParent,
    x: shape.x + delta2.x,
    y: shape.y + delta2.y
  });
  return shape;
};
MoveShapeHandler.prototype.postExecute = function(context) {
  var shape = context.shape, delta2 = context.delta, hints = context.hints;
  var modeling = this._modeling;
  if (hints.layout !== false) {
    forEach(shape.incoming, function(c2) {
      modeling.layoutConnection(c2, {
        connectionEnd: getMovedTargetAnchor(c2, shape, delta2)
      });
    });
    forEach(shape.outgoing, function(c2) {
      modeling.layoutConnection(c2, {
        connectionStart: getMovedSourceAnchor(c2, shape, delta2)
      });
    });
  }
  if (hints.recurse !== false) {
    this.moveChildren(context);
  }
};
MoveShapeHandler.prototype.revert = function(context) {
  var shape = context.shape, oldParent = context.oldParent, oldParentIndex = context.oldParentIndex, delta2 = context.delta;
  add(oldParent.children, shape, oldParentIndex);
  assign(shape, {
    parent: oldParent,
    x: shape.x - delta2.x,
    y: shape.y - delta2.y
  });
  return shape;
};
MoveShapeHandler.prototype.moveChildren = function(context) {
  var delta2 = context.delta, shape = context.shape;
  this._helper.moveRecursive(shape.children, delta2, null);
};
MoveShapeHandler.prototype.getNewParent = function(context) {
  return context.newParent || context.shape.parent;
};
function ReconnectConnectionHandler(modeling) {
  this._modeling = modeling;
}
ReconnectConnectionHandler.$inject = ["modeling"];
ReconnectConnectionHandler.prototype.execute = function(context) {
  var newSource = context.newSource, newTarget = context.newTarget, connection = context.connection, dockingOrPoints = context.dockingOrPoints;
  if (!newSource && !newTarget) {
    throw new Error("newSource or newTarget required");
  }
  if (isArray$1(dockingOrPoints)) {
    context.oldWaypoints = connection.waypoints;
    connection.waypoints = dockingOrPoints;
  }
  if (newSource) {
    context.oldSource = connection.source;
    connection.source = newSource;
  }
  if (newTarget) {
    context.oldTarget = connection.target;
    connection.target = newTarget;
  }
  return connection;
};
ReconnectConnectionHandler.prototype.postExecute = function(context) {
  var connection = context.connection, newSource = context.newSource, newTarget = context.newTarget, dockingOrPoints = context.dockingOrPoints, hints = context.hints || {};
  var layoutConnectionHints = {};
  if (hints.connectionStart) {
    layoutConnectionHints.connectionStart = hints.connectionStart;
  }
  if (hints.connectionEnd) {
    layoutConnectionHints.connectionEnd = hints.connectionEnd;
  }
  if (hints.layoutConnection === false) {
    return;
  }
  if (newSource && (!newTarget || hints.docking === "source")) {
    layoutConnectionHints.connectionStart = layoutConnectionHints.connectionStart || getDocking(isArray$1(dockingOrPoints) ? dockingOrPoints[0] : dockingOrPoints);
  }
  if (newTarget && (!newSource || hints.docking === "target")) {
    layoutConnectionHints.connectionEnd = layoutConnectionHints.connectionEnd || getDocking(isArray$1(dockingOrPoints) ? dockingOrPoints[dockingOrPoints.length - 1] : dockingOrPoints);
  }
  if (hints.newWaypoints) {
    layoutConnectionHints.waypoints = hints.newWaypoints;
  }
  this._modeling.layoutConnection(connection, layoutConnectionHints);
};
ReconnectConnectionHandler.prototype.revert = function(context) {
  var oldSource = context.oldSource, oldTarget = context.oldTarget, oldWaypoints = context.oldWaypoints, connection = context.connection;
  if (oldSource) {
    connection.source = oldSource;
  }
  if (oldTarget) {
    connection.target = oldTarget;
  }
  if (oldWaypoints) {
    connection.waypoints = oldWaypoints;
  }
  return connection;
};
function getDocking(point) {
  return point.original || point;
}
function ReplaceShapeHandler(modeling, rules) {
  this._modeling = modeling;
  this._rules = rules;
}
ReplaceShapeHandler.$inject = ["modeling", "rules"];
ReplaceShapeHandler.prototype.preExecute = function(context) {
  var self = this, modeling = this._modeling, rules = this._rules;
  var oldShape = context.oldShape, newData = context.newData, hints = context.hints || {}, newShape;
  function canReconnect(source, target, connection) {
    return rules.allowed("connection.reconnect", {
      connection,
      source,
      target
    });
  }
  var position = {
    x: newData.x,
    y: newData.y
  };
  var oldBounds = {
    x: oldShape.x,
    y: oldShape.y,
    width: oldShape.width,
    height: oldShape.height
  };
  newShape = context.newShape = context.newShape || self.createShape(newData, position, oldShape.parent, hints);
  if (oldShape.host) {
    modeling.updateAttachment(newShape, oldShape.host);
  }
  var children;
  if (hints.moveChildren !== false) {
    children = oldShape.children.slice();
    modeling.moveElements(children, { x: 0, y: 0 }, newShape, hints);
  }
  var incoming = oldShape.incoming.slice(), outgoing = oldShape.outgoing.slice();
  forEach(incoming, function(connection) {
    var source = connection.source, allowed = canReconnect(source, newShape, connection);
    if (allowed) {
      self.reconnectEnd(
        connection,
        newShape,
        getResizedTargetAnchor(connection, newShape, oldBounds),
        hints
      );
    }
  });
  forEach(outgoing, function(connection) {
    var target = connection.target, allowed = canReconnect(newShape, target, connection);
    if (allowed) {
      self.reconnectStart(
        connection,
        newShape,
        getResizedSourceAnchor(connection, newShape, oldBounds),
        hints
      );
    }
  });
};
ReplaceShapeHandler.prototype.postExecute = function(context) {
  var oldShape = context.oldShape;
  this._modeling.removeShape(oldShape);
};
ReplaceShapeHandler.prototype.execute = function(context) {
};
ReplaceShapeHandler.prototype.revert = function(context) {
};
ReplaceShapeHandler.prototype.createShape = function(shape, position, target, hints) {
  return this._modeling.createShape(shape, position, target, hints);
};
ReplaceShapeHandler.prototype.reconnectStart = function(connection, newSource, dockingPoint, hints) {
  this._modeling.reconnectStart(connection, newSource, dockingPoint, hints);
};
ReplaceShapeHandler.prototype.reconnectEnd = function(connection, newTarget, dockingPoint, hints) {
  this._modeling.reconnectEnd(connection, newTarget, dockingPoint, hints);
};
function ResizeShapeHandler(modeling) {
  this._modeling = modeling;
}
ResizeShapeHandler.$inject = ["modeling"];
ResizeShapeHandler.prototype.execute = function(context) {
  var shape = context.shape, newBounds = context.newBounds, minBounds = context.minBounds;
  if (newBounds.x === void 0 || newBounds.y === void 0 || newBounds.width === void 0 || newBounds.height === void 0) {
    throw new Error("newBounds must have {x, y, width, height} properties");
  }
  if (minBounds && (newBounds.width < minBounds.width || newBounds.height < minBounds.height)) {
    throw new Error("width and height cannot be less than minimum height and width");
  } else if (!minBounds && newBounds.width < 10 || newBounds.height < 10) {
    throw new Error("width and height cannot be less than 10px");
  }
  context.oldBounds = {
    width: shape.width,
    height: shape.height,
    x: shape.x,
    y: shape.y
  };
  assign(shape, {
    width: newBounds.width,
    height: newBounds.height,
    x: newBounds.x,
    y: newBounds.y
  });
  return shape;
};
ResizeShapeHandler.prototype.postExecute = function(context) {
  var modeling = this._modeling;
  var shape = context.shape, oldBounds = context.oldBounds, hints = context.hints || {};
  if (hints.layout === false) {
    return;
  }
  forEach(shape.incoming, function(c2) {
    modeling.layoutConnection(c2, {
      connectionEnd: getResizedTargetAnchor(c2, shape, oldBounds)
    });
  });
  forEach(shape.outgoing, function(c2) {
    modeling.layoutConnection(c2, {
      connectionStart: getResizedSourceAnchor(c2, shape, oldBounds)
    });
  });
};
ResizeShapeHandler.prototype.revert = function(context) {
  var shape = context.shape, oldBounds = context.oldBounds;
  assign(shape, {
    width: oldBounds.width,
    height: oldBounds.height,
    x: oldBounds.x,
    y: oldBounds.y
  });
  return shape;
};
function getDirection(axis, delta2) {
  if (axis === "x") {
    if (delta2 > 0) {
      return "e";
    }
    if (delta2 < 0) {
      return "w";
    }
  }
  if (axis === "y") {
    if (delta2 > 0) {
      return "s";
    }
    if (delta2 < 0) {
      return "n";
    }
  }
  return null;
}
function getWaypointsUpdatingConnections(movingShapes, resizingShapes) {
  var waypointsUpdatingConnections = [];
  forEach(movingShapes.concat(resizingShapes), function(shape) {
    var incoming = shape.incoming, outgoing = shape.outgoing;
    forEach(incoming.concat(outgoing), function(connection) {
      var source = connection.source, target = connection.target;
      if (includes$2(movingShapes, source) || includes$2(movingShapes, target) || includes$2(resizingShapes, source) || includes$2(resizingShapes, target)) {
        if (!includes$2(waypointsUpdatingConnections, connection)) {
          waypointsUpdatingConnections.push(connection);
        }
      }
    });
  });
  return waypointsUpdatingConnections;
}
function includes$2(array, item) {
  return array.indexOf(item) !== -1;
}
function resizeBounds$1(bounds, direction, delta2) {
  var x2 = bounds.x, y2 = bounds.y, width = bounds.width, height = bounds.height, dx = delta2.x, dy = delta2.y;
  switch (direction) {
    case "n":
      return {
        x: x2,
        y: y2 + dy,
        width,
        height: height - dy
      };
    case "s":
      return {
        x: x2,
        y: y2,
        width,
        height: height + dy
      };
    case "w":
      return {
        x: x2 + dx,
        y: y2,
        width: width - dx,
        height
      };
    case "e":
      return {
        x: x2,
        y: y2,
        width: width + dx,
        height
      };
    default:
      throw new Error("unknown direction: " + direction);
  }
}
function SpaceToolHandler(modeling) {
  this._modeling = modeling;
}
SpaceToolHandler.$inject = ["modeling"];
SpaceToolHandler.prototype.preExecute = function(context) {
  var delta2 = context.delta, direction = context.direction, movingShapes = context.movingShapes, resizingShapes = context.resizingShapes, start = context.start, oldBounds = {};
  this.moveShapes(movingShapes, delta2);
  forEach(resizingShapes, function(shape) {
    oldBounds[shape.id] = getBounds(shape);
  });
  this.resizeShapes(resizingShapes, delta2, direction);
  this.updateConnectionWaypoints(
    getWaypointsUpdatingConnections(movingShapes, resizingShapes),
    delta2,
    direction,
    start,
    movingShapes,
    resizingShapes,
    oldBounds
  );
};
SpaceToolHandler.prototype.execute = function() {
};
SpaceToolHandler.prototype.revert = function() {
};
SpaceToolHandler.prototype.moveShapes = function(shapes, delta2) {
  var self = this;
  forEach(shapes, function(element) {
    self._modeling.moveShape(element, delta2, null, {
      autoResize: false,
      layout: false,
      recurse: false
    });
  });
};
SpaceToolHandler.prototype.resizeShapes = function(shapes, delta2, direction) {
  var self = this;
  forEach(shapes, function(shape) {
    var newBounds = resizeBounds$1(shape, direction, delta2);
    self._modeling.resizeShape(shape, newBounds, null, {
      attachSupport: false,
      autoResize: false,
      layout: false
    });
  });
};
SpaceToolHandler.prototype.updateConnectionWaypoints = function(connections, delta2, direction, start, movingShapes, resizingShapes, oldBounds) {
  var self = this, affectedShapes = movingShapes.concat(resizingShapes);
  forEach(connections, function(connection) {
    var source = connection.source, target = connection.target, waypoints = copyWaypoints$1(connection), axis = getAxisFromDirection(direction), layoutHints = {};
    if (includes$1(affectedShapes, source) && includes$1(affectedShapes, target)) {
      waypoints = map(waypoints, function(waypoint) {
        if (shouldMoveWaypoint(waypoint, start, direction)) {
          waypoint[axis] = waypoint[axis] + delta2[axis];
        }
        if (waypoint.original && shouldMoveWaypoint(waypoint.original, start, direction)) {
          waypoint.original[axis] = waypoint.original[axis] + delta2[axis];
        }
        return waypoint;
      });
      self._modeling.updateWaypoints(connection, waypoints, {
        labelBehavior: false
      });
    } else if (includes$1(affectedShapes, source) || includes$1(affectedShapes, target)) {
      if (includes$1(movingShapes, source)) {
        layoutHints.connectionStart = getMovedSourceAnchor(connection, source, delta2);
      } else if (includes$1(movingShapes, target)) {
        layoutHints.connectionEnd = getMovedTargetAnchor(connection, target, delta2);
      } else if (includes$1(resizingShapes, source)) {
        layoutHints.connectionStart = getResizedSourceAnchor(
          connection,
          source,
          oldBounds[source.id]
        );
      } else if (includes$1(resizingShapes, target)) {
        layoutHints.connectionEnd = getResizedTargetAnchor(
          connection,
          target,
          oldBounds[target.id]
        );
      }
      self._modeling.layoutConnection(connection, layoutHints);
    }
  });
};
function copyWaypoint$1(waypoint) {
  return assign({}, waypoint);
}
function copyWaypoints$1(connection) {
  return map(connection.waypoints, function(waypoint) {
    waypoint = copyWaypoint$1(waypoint);
    if (waypoint.original) {
      waypoint.original = copyWaypoint$1(waypoint.original);
    }
    return waypoint;
  });
}
function getAxisFromDirection(direction) {
  switch (direction) {
    case "n":
      return "y";
    case "w":
      return "x";
    case "s":
      return "y";
    case "e":
      return "x";
  }
}
function shouldMoveWaypoint(waypoint, start, direction) {
  var relevantAxis = getAxisFromDirection(direction);
  if (/e|s/.test(direction)) {
    return waypoint[relevantAxis] > start;
  } else if (/n|w/.test(direction)) {
    return waypoint[relevantAxis] < start;
  }
}
function includes$1(array, item) {
  return array.indexOf(item) !== -1;
}
function getBounds(shape) {
  return {
    x: shape.x,
    y: shape.y,
    height: shape.height,
    width: shape.width
  };
}
function ToggleShapeCollapseHandler(modeling) {
  this._modeling = modeling;
}
ToggleShapeCollapseHandler.$inject = ["modeling"];
ToggleShapeCollapseHandler.prototype.execute = function(context) {
  var shape = context.shape, children = shape.children;
  context.oldChildrenVisibility = getElementsVisibilityRecursive(children);
  shape.collapsed = !shape.collapsed;
  var result = setHiddenRecursive(children, shape.collapsed);
  return [shape].concat(result);
};
ToggleShapeCollapseHandler.prototype.revert = function(context) {
  var shape = context.shape, oldChildrenVisibility = context.oldChildrenVisibility;
  var children = shape.children;
  var result = restoreVisibilityRecursive(children, oldChildrenVisibility);
  shape.collapsed = !shape.collapsed;
  return [shape].concat(result);
};
function getElementsVisibilityRecursive(elements) {
  var result = {};
  forEach(elements, function(element) {
    result[element.id] = element.hidden;
    if (element.children) {
      result = assign({}, result, getElementsVisibilityRecursive(element.children));
    }
  });
  return result;
}
function setHiddenRecursive(elements, newHidden) {
  var result = [];
  forEach(elements, function(element) {
    element.hidden = newHidden;
    result = result.concat(element);
    if (element.children) {
      result = result.concat(setHiddenRecursive(element.children, element.collapsed || newHidden));
    }
  });
  return result;
}
function restoreVisibilityRecursive(elements, lastState) {
  var result = [];
  forEach(elements, function(element) {
    element.hidden = lastState[element.id];
    result = result.concat(element);
    if (element.children) {
      result = result.concat(restoreVisibilityRecursive(element.children, lastState));
    }
  });
  return result;
}
function UpdateAttachmentHandler(modeling) {
  this._modeling = modeling;
}
UpdateAttachmentHandler.$inject = ["modeling"];
UpdateAttachmentHandler.prototype.execute = function(context) {
  var shape = context.shape, newHost = context.newHost, oldHost = shape.host;
  context.oldHost = oldHost;
  context.attacherIdx = removeAttacher(oldHost, shape);
  addAttacher(newHost, shape);
  shape.host = newHost;
  return shape;
};
UpdateAttachmentHandler.prototype.revert = function(context) {
  var shape = context.shape, newHost = context.newHost, oldHost = context.oldHost, attacherIdx = context.attacherIdx;
  shape.host = oldHost;
  removeAttacher(newHost, shape);
  addAttacher(oldHost, shape, attacherIdx);
  return shape;
};
function removeAttacher(host, attacher) {
  return remove(host && host.attachers, attacher);
}
function addAttacher(host, attacher, idx) {
  if (!host) {
    return;
  }
  var attachers = host.attachers;
  if (!attachers) {
    host.attachers = attachers = [];
  }
  add(attachers, attacher, idx);
}
function UpdateWaypointsHandler() {
}
UpdateWaypointsHandler.prototype.execute = function(context) {
  var connection = context.connection, newWaypoints = context.newWaypoints;
  context.oldWaypoints = connection.waypoints;
  connection.waypoints = newWaypoints;
  return connection;
};
UpdateWaypointsHandler.prototype.revert = function(context) {
  var connection = context.connection, oldWaypoints = context.oldWaypoints;
  connection.waypoints = oldWaypoints;
  return connection;
};
function Modeling(eventBus, elementFactory, commandStack) {
  this._eventBus = eventBus;
  this._elementFactory = elementFactory;
  this._commandStack = commandStack;
  var self = this;
  eventBus.on("diagram.init", function() {
    self.registerHandlers(commandStack);
  });
}
Modeling.$inject = ["eventBus", "elementFactory", "commandStack"];
Modeling.prototype.getHandlers = function() {
  return {
    "shape.append": AppendShapeHandler,
    "shape.create": CreateShapeHandler,
    "shape.delete": DeleteShapeHandler,
    "shape.move": MoveShapeHandler,
    "shape.resize": ResizeShapeHandler,
    "shape.replace": ReplaceShapeHandler,
    "shape.toggleCollapse": ToggleShapeCollapseHandler,
    "spaceTool": SpaceToolHandler,
    "label.create": CreateLabelHandler,
    "connection.create": CreateConnectionHandler,
    "connection.delete": DeleteConnectionHandler,
    "connection.move": MoveConnectionHandler,
    "connection.layout": LayoutConnectionHandler,
    "connection.updateWaypoints": UpdateWaypointsHandler,
    "connection.reconnect": ReconnectConnectionHandler,
    "elements.create": CreateElementsHandler,
    "elements.move": MoveElementsHandler,
    "elements.delete": DeleteElementsHandler,
    "elements.distribute": DistributeElements,
    "elements.align": AlignElements,
    "element.updateAttachment": UpdateAttachmentHandler
  };
};
Modeling.prototype.registerHandlers = function(commandStack) {
  forEach(this.getHandlers(), function(handler, id) {
    commandStack.registerHandler(id, handler);
  });
};
Modeling.prototype.moveShape = function(shape, delta2, newParent, newParentIndex, hints) {
  if (typeof newParentIndex === "object") {
    hints = newParentIndex;
    newParentIndex = null;
  }
  var context = {
    shape,
    delta: delta2,
    newParent,
    newParentIndex,
    hints: hints || {}
  };
  this._commandStack.execute("shape.move", context);
};
Modeling.prototype.updateAttachment = function(shape, newHost) {
  var context = {
    shape,
    newHost
  };
  this._commandStack.execute("element.updateAttachment", context);
};
Modeling.prototype.moveElements = function(shapes, delta2, target, hints) {
  hints = hints || {};
  var attach = hints.attach;
  var newParent = target, newHost;
  if (attach === true) {
    newHost = target;
    newParent = target.parent;
  } else if (attach === false) {
    newHost = null;
  }
  var context = {
    shapes,
    delta: delta2,
    newParent,
    newHost,
    hints
  };
  this._commandStack.execute("elements.move", context);
};
Modeling.prototype.moveConnection = function(connection, delta2, newParent, newParentIndex, hints) {
  if (typeof newParentIndex === "object") {
    hints = newParentIndex;
    newParentIndex = void 0;
  }
  var context = {
    connection,
    delta: delta2,
    newParent,
    newParentIndex,
    hints: hints || {}
  };
  this._commandStack.execute("connection.move", context);
};
Modeling.prototype.layoutConnection = function(connection, hints) {
  var context = {
    connection,
    hints: hints || {}
  };
  this._commandStack.execute("connection.layout", context);
};
Modeling.prototype.createConnection = function(source, target, parentIndex, connection, parent, hints) {
  if (typeof parentIndex === "object") {
    hints = parent;
    parent = connection;
    connection = parentIndex;
    parentIndex = void 0;
  }
  connection = this._create("connection", connection);
  var context = {
    source,
    target,
    parent,
    parentIndex,
    connection,
    hints
  };
  this._commandStack.execute("connection.create", context);
  return context.connection;
};
Modeling.prototype.createShape = function(shape, position, target, parentIndex, hints) {
  if (typeof parentIndex !== "number") {
    hints = parentIndex;
    parentIndex = void 0;
  }
  hints = hints || {};
  var attach = hints.attach, parent, host;
  shape = this._create("shape", shape);
  if (attach) {
    parent = target.parent;
    host = target;
  } else {
    parent = target;
  }
  var context = {
    position,
    shape,
    parent,
    parentIndex,
    host,
    hints
  };
  this._commandStack.execute("shape.create", context);
  return context.shape;
};
Modeling.prototype.createElements = function(elements, position, parent, parentIndex, hints) {
  if (!isArray$1(elements)) {
    elements = [elements];
  }
  if (typeof parentIndex !== "number") {
    hints = parentIndex;
    parentIndex = void 0;
  }
  hints = hints || {};
  var context = {
    position,
    elements,
    parent,
    parentIndex,
    hints
  };
  this._commandStack.execute("elements.create", context);
  return context.elements;
};
Modeling.prototype.createLabel = function(labelTarget, position, label, parent) {
  label = this._create("label", label);
  var context = {
    labelTarget,
    position,
    parent: parent || labelTarget.parent,
    shape: label
  };
  this._commandStack.execute("label.create", context);
  return context.shape;
};
Modeling.prototype.appendShape = function(source, shape, position, target, hints) {
  hints = hints || {};
  shape = this._create("shape", shape);
  var context = {
    source,
    position,
    target,
    shape,
    connection: hints.connection,
    connectionParent: hints.connectionParent,
    hints
  };
  this._commandStack.execute("shape.append", context);
  return context.shape;
};
Modeling.prototype.removeElements = function(elements) {
  var context = {
    elements
  };
  this._commandStack.execute("elements.delete", context);
};
Modeling.prototype.distributeElements = function(groups, axis, dimension) {
  var context = {
    groups,
    axis,
    dimension
  };
  this._commandStack.execute("elements.distribute", context);
};
Modeling.prototype.removeShape = function(shape, hints) {
  var context = {
    shape,
    hints: hints || {}
  };
  this._commandStack.execute("shape.delete", context);
};
Modeling.prototype.removeConnection = function(connection, hints) {
  var context = {
    connection,
    hints: hints || {}
  };
  this._commandStack.execute("connection.delete", context);
};
Modeling.prototype.replaceShape = function(oldShape, newShape, hints) {
  var context = {
    oldShape,
    newData: newShape,
    hints: hints || {}
  };
  this._commandStack.execute("shape.replace", context);
  return context.newShape;
};
Modeling.prototype.alignElements = function(elements, alignment) {
  var context = {
    elements,
    alignment
  };
  this._commandStack.execute("elements.align", context);
};
Modeling.prototype.resizeShape = function(shape, newBounds, minBounds, hints) {
  var context = {
    shape,
    newBounds,
    minBounds,
    hints
  };
  this._commandStack.execute("shape.resize", context);
};
Modeling.prototype.createSpace = function(movingShapes, resizingShapes, delta2, direction, start) {
  var context = {
    delta: delta2,
    direction,
    movingShapes,
    resizingShapes,
    start
  };
  this._commandStack.execute("spaceTool", context);
};
Modeling.prototype.updateWaypoints = function(connection, newWaypoints, hints) {
  var context = {
    connection,
    newWaypoints,
    hints: hints || {}
  };
  this._commandStack.execute("connection.updateWaypoints", context);
};
Modeling.prototype.reconnect = function(connection, source, target, dockingOrPoints, hints) {
  var context = {
    connection,
    newSource: source,
    newTarget: target,
    dockingOrPoints,
    hints: hints || {}
  };
  this._commandStack.execute("connection.reconnect", context);
};
Modeling.prototype.reconnectStart = function(connection, newSource, dockingOrPoints, hints) {
  if (!hints) {
    hints = {};
  }
  this.reconnect(connection, newSource, connection.target, dockingOrPoints, assign(hints, {
    docking: "source"
  }));
};
Modeling.prototype.reconnectEnd = function(connection, newTarget, dockingOrPoints, hints) {
  if (!hints) {
    hints = {};
  }
  this.reconnect(connection, connection.source, newTarget, dockingOrPoints, assign(hints, {
    docking: "target"
  }));
};
Modeling.prototype.connect = function(source, target, attrs, hints) {
  return this.createConnection(source, target, attrs || {}, source.parent, hints);
};
Modeling.prototype._create = function(type, attrs) {
  if (isModelElement(attrs)) {
    return attrs;
  } else {
    return this._elementFactory.create(type, attrs);
  }
};
Modeling.prototype.toggleCollapse = function(shape, hints) {
  var context = {
    shape,
    hints: hints || {}
  };
  this._commandStack.execute("shape.toggleCollapse", context);
};
function BaseLayouter() {
}
BaseLayouter.prototype.layoutConnection = function(connection, hints) {
  hints = hints || {};
  return [
    hints.connectionStart || getMid(hints.source || connection.source),
    hints.connectionEnd || getMid(hints.target || connection.target)
  ];
};
const ModelingModule = {
  __depends__: [
    CommandStack,
    ChangeSupportModule,
    SelectionModule,
    RulesModule
  ],
  __init__: ["modeling"],
  modeling: ["type", Modeling],
  layouter: ["type", BaseLayouter]
};
const DomainStoryRules = {
  __init__: ["domainStoryRules"],
  domainStoryRules: ["type", DomainStoryRules$1]
};
let DomainStoryModeling$1 = (_g = class extends Modeling {
  constructor(eventBus, elementFactory, commandStack) {
    super(eventBus, elementFactory, commandStack);
    this.commandStack = commandStack;
  }
  replaceShape(oldShape, newData, hints) {
    const context = {
      oldShape,
      newData,
      hints: hints || {}
    };
    this.commandStack.execute("shape.replace", context);
    return context.newShape;
  }
  updateLabel(element, newLabel, newBounds) {
    if (element.businessObject ? newLabel !== element.businessObject.name : newLabel !== element["name"]) {
      this.commandStack.execute("element.updateLabel", {
        element,
        newLabel,
        newBounds
      });
    }
  }
  updateNumber(element, newNumber, newBounds) {
    if (element.businessObject ? newNumber !== element.businessObject.number : newNumber !== element["number"]) {
      this.commandStack.execute("element.updateLabel", {
        element,
        newNumber,
        newBounds
      });
    }
  }
  removeGroup(element) {
    this.commandStack.execute("shape.removeGroupWithoutChildren", {
      element
    });
    this.removeElements([element]);
  }
}, _g.$inject = [
  "eventBus",
  "elementFactory",
  "commandStack",
  "domainStoryRules"
], _g);
const DomainStoryModeling = {
  __depends__: [DomainStoryRules, ModelingModule],
  modeling: ["type", DomainStoryModeling$1]
};
function dockingToPoint(docking) {
  return assign({ original: docking.point.original || docking.point }, docking.actual);
}
function CroppingConnectionDocking(elementRegistry, graphicsFactory) {
  this._elementRegistry = elementRegistry;
  this._graphicsFactory = graphicsFactory;
}
CroppingConnectionDocking.$inject = ["elementRegistry", "graphicsFactory"];
CroppingConnectionDocking.prototype.getCroppedWaypoints = function(connection, source, target) {
  source = source || connection.source;
  target = target || connection.target;
  var sourceDocking = this.getDockingPoint(connection, source, true), targetDocking = this.getDockingPoint(connection, target);
  var croppedWaypoints = connection.waypoints.slice(sourceDocking.idx + 1, targetDocking.idx);
  croppedWaypoints.unshift(dockingToPoint(sourceDocking));
  croppedWaypoints.push(dockingToPoint(targetDocking));
  return croppedWaypoints;
};
CroppingConnectionDocking.prototype.getDockingPoint = function(connection, shape, dockStart) {
  var waypoints = connection.waypoints, dockingIdx, dockingPoint, croppedPoint;
  dockingIdx = dockStart ? 0 : waypoints.length - 1;
  dockingPoint = waypoints[dockingIdx];
  croppedPoint = this._getIntersection(shape, connection, dockStart);
  return {
    point: dockingPoint,
    actual: croppedPoint || dockingPoint,
    idx: dockingIdx
  };
};
CroppingConnectionDocking.prototype._getIntersection = function(shape, connection, takeFirst) {
  var shapePath = this._getShapePath(shape), connectionPath = this._getConnectionPath(connection);
  return getElementLineIntersection(shapePath, connectionPath, takeFirst);
};
CroppingConnectionDocking.prototype._getConnectionPath = function(connection) {
  return this._graphicsFactory.getConnectionPath(connection);
};
CroppingConnectionDocking.prototype._getShapePath = function(shape) {
  return this._graphicsFactory.getShapePath(shape);
};
CroppingConnectionDocking.prototype._getGfx = function(element) {
  return this._elementRegistry.getGraphics(element);
};
let DomainStoryUpdater$1 = (_h = class extends CommandInterceptor {
  constructor(eventBus, elementRegistry, connectionDocking) {
    super(eventBus);
    this.elementRegistry = elementRegistry;
    this.connectionDocking = connectionDocking;
    this.executed(["connection.layout", "connection.create"], this.cropConnection());
    this.reverted(["connection.layout"], function(e2) {
      delete e2.context.cropped;
    });
    this.executed(
      [
        "shape.create",
        "shape.move",
        "shape.delete",
        "shape.resize",
        "shape.removeGroupWithChildren"
      ],
      this.updateElement()
    );
    this.reverted(
      [
        "shape.create",
        "shape.move",
        "shape.delete",
        "shape.resize",
        "shape.removeGroupWithChildren"
      ],
      this.updateElement()
    );
    this.executed(
      [
        "connection.create",
        "connection.reconnect",
        "connection.updateWaypoints",
        "connection.delete",
        "connection.layout",
        "connection.move"
      ],
      this.updateConnection()
    );
    this.reverted(
      [
        "connection.create",
        "connection.reconnect",
        "connection.updateWaypoints",
        "connection.delete",
        "connection.layout",
        "connection.move"
      ],
      this.updateConnection()
    );
  }
  updateElement() {
    return (event2) => {
      const context = event2.context, shape = context.shape;
      if (!shape) {
        return;
      }
      const businessObject = shape.businessObject;
      const parent = shape.parent;
      const elements = this.elementRegistry.filter(
        (element) => !element.id.startsWith("root")
      );
      if (!parent) {
        remove(elements, businessObject);
      } else {
        add(elements, businessObject);
      }
      assign(businessObject, pick(shape, ["x", "y"]));
      if (shape["type"] === ElementTypes.GROUP) {
        assign(businessObject, pick(shape, ["height", "width"]));
        if (parent) {
          if (isBackground(parent) || isGroup(parent)) {
            reworkGroupElements(parent, shape);
          } else {
            shape.parent = parent.parent;
            reworkGroupElements(parent.parent, shape);
          }
        }
      }
      if (shape && shape.parent && "type" in shape.parent && shape.parent["type"] === ElementTypes.GROUP) {
        assign(businessObject, {
          parent: shape.parent.id
        });
      }
    };
  }
  updateConnection() {
    return (event2) => {
      const context = event2.context, connection = context.connection, businessObject = connection.businessObject;
      let source = connection.source, target = connection.target;
      if (event2.newTarget) {
        target = event2.newTarget;
      }
      if (event2.newSource) {
        source = event2.newSource;
      }
      const parent = connection.parent;
      const elements = this.elementRegistry.filter(
        (element) => !element.id.startsWith("root")
      );
      if (!parent) {
        remove(elements, businessObject);
      } else {
        add(elements, businessObject);
      }
      assign(businessObject, {
        waypoints: this.copyWaypoints(connection)
      });
      if (source) {
        if (!businessObject.source) {
          assign(businessObject, { source: source.id });
        } else {
          businessObject.source = source.id;
        }
      }
      if (target) {
        if (!businessObject.target) {
          assign(businessObject, { target: target.id });
        } else {
          businessObject.target = target.id;
        }
      }
    };
  }
  // crop connection ends during create/update
  cropConnection() {
    return (event2) => {
      const context = event2.context, hints = context.hints || {};
      if (!context.cropped && hints.createElementsBehavior !== false) {
        const connection = context.connection;
        connection.waypoints = this.connectionDocking.getCroppedWaypoints(
          connection,
          connection.source,
          connection.target
        );
        context.cropped = true;
      }
    };
  }
  copyWaypoints(connection) {
    return connection.waypoints.map(function(p2) {
      const original = p2.original;
      if (original) {
        return {
          original: {
            x: original.x,
            y: original.y
          },
          x: p2.x,
          y: p2.y
        };
      } else {
        return {
          x: p2.x,
          y: p2.y
        };
      }
    });
  }
}, _h.$inject = [
  "eventBus",
  "elementRegistry",
  "connectionDocking"
], _h);
const DomainStoryUpdater = {
  __init__: ["domainStoryUpdater"],
  domainStoryUpdater: ["type", DomainStoryUpdater$1],
  connectionDocking: ["type", CroppingConnectionDocking]
};
var LOW_PRIORITY$5 = 250;
function ToolManager(eventBus) {
  this._eventBus = eventBus;
  this._tools = [];
  this._active = null;
}
ToolManager.$inject = ["eventBus"];
ToolManager.prototype.registerTool = function(name, events) {
  var tools = this._tools;
  if (!events) {
    throw new Error(`A tool has to be registered with it's "events"`);
  }
  tools.push(name);
  this.bindEvents(name, events);
};
ToolManager.prototype.isActive = function(tool) {
  return tool && this._active === tool;
};
ToolManager.prototype.length = function(tool) {
  return this._tools.length;
};
ToolManager.prototype.setActive = function(tool) {
  var eventBus = this._eventBus;
  if (this._active !== tool) {
    this._active = tool;
    eventBus.fire("tool-manager.update", { tool });
  }
};
ToolManager.prototype.bindEvents = function(name, events) {
  var eventBus = this._eventBus;
  var eventsToRegister = [];
  eventBus.on(events.tool + ".init", function(event2) {
    var context = event2.context;
    if (!context.reactivate && this.isActive(name)) {
      this.setActive(null);
      return;
    }
    this.setActive(name);
  }, this);
  forEach(events, function(event2) {
    eventsToRegister.push(event2 + ".ended");
    eventsToRegister.push(event2 + ".canceled");
  });
  eventBus.on(eventsToRegister, LOW_PRIORITY$5, function(event2) {
    if (!this._active) {
      return;
    }
    if (isPaletteClick(event2)) {
      return;
    }
    this.setActive(null);
  }, this);
};
function isPaletteClick(event2) {
  var target = event2.originalEvent && event2.originalEvent.target;
  return target && closest(target, '.group[data-group="tools"]');
}
const ToolManagerModule = {
  __depends__: [
    DraggingModule
  ],
  __init__: ["toolManager"],
  toolManager: ["type", ToolManager]
};
function Mouse(eventBus) {
  var self = this;
  this._lastMoveEvent = null;
  function setLastMoveEvent(mousemoveEvent) {
    self._lastMoveEvent = mousemoveEvent;
  }
  eventBus.on("canvas.init", function(context) {
    var svg = self._svg = context.svg;
    svg.addEventListener("mousemove", setLastMoveEvent);
  });
  eventBus.on("canvas.destroy", function() {
    self._lastMouseEvent = null;
    self._svg.removeEventListener("mousemove", setLastMoveEvent);
  });
}
Mouse.$inject = ["eventBus"];
Mouse.prototype.getLastMoveEvent = function() {
  return this._lastMoveEvent || createMoveEvent(0, 0);
};
function createMoveEvent(x2, y2) {
  var event2 = document.createEvent("MouseEvent");
  var screenX = x2, screenY = y2, clientX = x2, clientY = y2;
  if (event2.initMouseEvent) {
    event2.initMouseEvent(
      "mousemove",
      true,
      true,
      window,
      0,
      screenX,
      screenY,
      clientX,
      clientY,
      false,
      false,
      false,
      false,
      0,
      null
    );
  }
  return event2;
}
const MouseModule = {
  __init__: ["mouse"],
  mouse: ["type", Mouse]
};
var abs = Math.abs, round = Math.round;
var AXIS_TO_DIMENSION = {
  x: "width",
  y: "height"
};
var CURSOR_CROSSHAIR = "crosshair";
var DIRECTION_TO_TRBL = {
  n: "top",
  w: "left",
  s: "bottom",
  e: "right"
};
var HIGH_PRIORITY$3 = 1500;
var DIRECTION_TO_OPPOSITE = {
  n: "s",
  w: "e",
  s: "n",
  e: "w"
};
var PADDING = 20;
function SpaceTool$1(canvas, dragging, eventBus, modeling, rules, toolManager, mouse) {
  this._canvas = canvas;
  this._dragging = dragging;
  this._eventBus = eventBus;
  this._modeling = modeling;
  this._rules = rules;
  this._toolManager = toolManager;
  this._mouse = mouse;
  var self = this;
  toolManager.registerTool("space", {
    tool: "spaceTool.selection",
    dragging: "spaceTool"
  });
  eventBus.on("spaceTool.selection.end", function(event2) {
    eventBus.once("spaceTool.selection.ended", function() {
      self.activateMakeSpace(event2.originalEvent);
    });
  });
  eventBus.on("spaceTool.move", HIGH_PRIORITY$3, function(event2) {
    var context = event2.context, initialized = context.initialized;
    if (!initialized) {
      initialized = context.initialized = self.init(event2, context);
    }
    if (initialized) {
      ensureConstraints$2(event2);
    }
  });
  eventBus.on("spaceTool.end", function(event2) {
    var context = event2.context, axis = context.axis, direction = context.direction, movingShapes = context.movingShapes, resizingShapes = context.resizingShapes, start = context.start;
    if (!context.initialized) {
      return;
    }
    ensureConstraints$2(event2);
    var delta2 = {
      x: 0,
      y: 0
    };
    delta2[axis] = round(event2["d" + axis]);
    self.makeSpace(movingShapes, resizingShapes, delta2, direction, start);
    eventBus.once("spaceTool.ended", function(event3) {
      self.activateSelection(event3.originalEvent, true, true);
    });
  });
}
SpaceTool$1.$inject = [
  "canvas",
  "dragging",
  "eventBus",
  "modeling",
  "rules",
  "toolManager",
  "mouse"
];
SpaceTool$1.prototype.activateSelection = function(event2, autoActivate, reactivate) {
  this._dragging.init(event2, "spaceTool.selection", {
    autoActivate,
    cursor: CURSOR_CROSSHAIR,
    data: {
      context: {
        reactivate
      }
    },
    trapClick: false
  });
};
SpaceTool$1.prototype.activateMakeSpace = function(event2) {
  this._dragging.init(event2, "spaceTool", {
    autoActivate: true,
    cursor: CURSOR_CROSSHAIR,
    data: {
      context: {}
    }
  });
};
SpaceTool$1.prototype.makeSpace = function(movingShapes, resizingShapes, delta2, direction, start) {
  return this._modeling.createSpace(movingShapes, resizingShapes, delta2, direction, start);
};
SpaceTool$1.prototype.init = function(event2, context) {
  var axis = abs(event2.dx) > abs(event2.dy) ? "x" : "y", delta2 = event2["d" + axis], start = event2[axis] - delta2;
  if (abs(delta2) < 5) {
    return false;
  }
  if (delta2 < 0) {
    delta2 *= -1;
  }
  if (hasPrimaryModifier(event2)) {
    delta2 *= -1;
  }
  var direction = getDirection(axis, delta2);
  var root = this._canvas.getRootElement();
  if (!hasSecondaryModifier(event2) && event2.hover) {
    root = event2.hover;
  }
  var children = [
    ...selfAndAllChildren(root),
    ...root.attachers || []
  ];
  var elements = this.calculateAdjustments(children, axis, delta2, start);
  var minDimensions = this._eventBus.fire("spaceTool.getMinDimensions", {
    axis,
    direction,
    shapes: elements.resizingShapes,
    start
  });
  var spaceToolConstraints = getSpaceToolConstraints(elements, axis, direction, start, minDimensions);
  assign(
    context,
    elements,
    {
      axis,
      direction,
      spaceToolConstraints,
      start
    }
  );
  set("resize-" + (axis === "x" ? "ew" : "ns"));
  return true;
};
SpaceTool$1.prototype.calculateAdjustments = function(elements, axis, delta2, start) {
  var rules = this._rules;
  var movingShapes = [], resizingShapes = [];
  var attachers = [], connections = [];
  function moveShape(shape) {
    if (!movingShapes.includes(shape)) {
      movingShapes.push(shape);
    }
    var label = shape.label;
    if (label && !movingShapes.includes(label)) {
      movingShapes.push(label);
    }
  }
  function resizeShape(shape) {
    if (!resizingShapes.includes(shape)) {
      resizingShapes.push(shape);
    }
  }
  forEach(elements, function(element) {
    if (!element.parent || isLabel$1(element)) {
      return;
    }
    if (isConnection$1(element)) {
      connections.push(element);
      return;
    }
    var shapeStart = element[axis], shapeEnd = shapeStart + element[AXIS_TO_DIMENSION[axis]];
    if (isAttacher$1(element) && (delta2 > 0 && getMid(element)[axis] > start || delta2 < 0 && getMid(element)[axis] < start)) {
      attachers.push(element);
      return;
    }
    if (delta2 > 0 && shapeStart > start || delta2 < 0 && shapeEnd < start) {
      moveShape(element);
      return;
    }
    if (shapeStart < start && shapeEnd > start && rules.allowed("shape.resize", { shape: element })) {
      resizeShape(element);
      return;
    }
  });
  forEach(movingShapes, function(shape) {
    var attachers2 = shape.attachers;
    if (attachers2) {
      forEach(attachers2, function(attacher) {
        moveShape(attacher);
      });
    }
  });
  var allShapes = movingShapes.concat(resizingShapes);
  forEach(attachers, function(attacher) {
    var host = attacher.host;
    if (includes(allShapes, host)) {
      moveShape(attacher);
    }
  });
  allShapes = movingShapes.concat(resizingShapes);
  forEach(connections, function(connection) {
    var source = connection.source, target = connection.target, label = connection.label;
    if (includes(allShapes, source) && includes(allShapes, target) && label) {
      moveShape(label);
    }
  });
  return {
    movingShapes,
    resizingShapes
  };
};
SpaceTool$1.prototype.toggle = function() {
  if (this.isActive()) {
    return this._dragging.cancel();
  }
  var mouseEvent = this._mouse.getLastMoveEvent();
  this.activateSelection(mouseEvent, !!mouseEvent);
};
SpaceTool$1.prototype.isActive = function() {
  var context = this._dragging.context();
  if (context) {
    return /^spaceTool/.test(context.prefix);
  }
  return false;
};
function addPadding$1(trbl) {
  return {
    top: trbl.top - PADDING,
    right: trbl.right + PADDING,
    bottom: trbl.bottom + PADDING,
    left: trbl.left - PADDING
  };
}
function ensureConstraints$2(event2) {
  var context = event2.context, spaceToolConstraints = context.spaceToolConstraints;
  if (!spaceToolConstraints) {
    return;
  }
  var x2, y2;
  if (isNumber(spaceToolConstraints.left)) {
    x2 = Math.max(event2.x, spaceToolConstraints.left);
    event2.dx = event2.dx + x2 - event2.x;
    event2.x = x2;
  }
  if (isNumber(spaceToolConstraints.right)) {
    x2 = Math.min(event2.x, spaceToolConstraints.right);
    event2.dx = event2.dx + x2 - event2.x;
    event2.x = x2;
  }
  if (isNumber(spaceToolConstraints.top)) {
    y2 = Math.max(event2.y, spaceToolConstraints.top);
    event2.dy = event2.dy + y2 - event2.y;
    event2.y = y2;
  }
  if (isNumber(spaceToolConstraints.bottom)) {
    y2 = Math.min(event2.y, spaceToolConstraints.bottom);
    event2.dy = event2.dy + y2 - event2.y;
    event2.y = y2;
  }
}
function getSpaceToolConstraints(elements, axis, direction, start, minDimensions) {
  var movingShapes = elements.movingShapes, resizingShapes = elements.resizingShapes;
  if (!resizingShapes.length) {
    return;
  }
  var spaceToolConstraints = {}, min2, max2;
  forEach(resizingShapes, function(resizingShape) {
    var attachers = resizingShape.attachers, children = resizingShape.children;
    var resizingShapeBBox = asTRBL(resizingShape);
    var nonMovingResizingChildren = filter(children, function(child) {
      return !isConnection$1(child) && !isLabel$1(child) && !includes(movingShapes, child) && !includes(resizingShapes, child);
    });
    var movingChildren = filter(children, function(child) {
      return !isConnection$1(child) && !isLabel$1(child) && includes(movingShapes, child);
    });
    var minOrMax, nonMovingResizingChildrenBBox, movingChildrenBBox, movingAttachers = [], nonMovingAttachers = [], movingAttachersBBox, movingAttachersConstraint, nonMovingAttachersBBox, nonMovingAttachersConstraint;
    if (nonMovingResizingChildren.length) {
      nonMovingResizingChildrenBBox = addPadding$1(asTRBL(getBBox(nonMovingResizingChildren)));
      minOrMax = start - resizingShapeBBox[DIRECTION_TO_TRBL[direction]] + nonMovingResizingChildrenBBox[DIRECTION_TO_TRBL[direction]];
      if (direction === "n") {
        spaceToolConstraints.bottom = max2 = isNumber(max2) ? Math.min(max2, minOrMax) : minOrMax;
      } else if (direction === "w") {
        spaceToolConstraints.right = max2 = isNumber(max2) ? Math.min(max2, minOrMax) : minOrMax;
      } else if (direction === "s") {
        spaceToolConstraints.top = min2 = isNumber(min2) ? Math.max(min2, minOrMax) : minOrMax;
      } else if (direction === "e") {
        spaceToolConstraints.left = min2 = isNumber(min2) ? Math.max(min2, minOrMax) : minOrMax;
      }
    }
    if (movingChildren.length) {
      movingChildrenBBox = addPadding$1(asTRBL(getBBox(movingChildren)));
      minOrMax = start - movingChildrenBBox[DIRECTION_TO_TRBL[DIRECTION_TO_OPPOSITE[direction]]] + resizingShapeBBox[DIRECTION_TO_TRBL[DIRECTION_TO_OPPOSITE[direction]]];
      if (direction === "n") {
        spaceToolConstraints.bottom = max2 = isNumber(max2) ? Math.min(max2, minOrMax) : minOrMax;
      } else if (direction === "w") {
        spaceToolConstraints.right = max2 = isNumber(max2) ? Math.min(max2, minOrMax) : minOrMax;
      } else if (direction === "s") {
        spaceToolConstraints.top = min2 = isNumber(min2) ? Math.max(min2, minOrMax) : minOrMax;
      } else if (direction === "e") {
        spaceToolConstraints.left = min2 = isNumber(min2) ? Math.max(min2, minOrMax) : minOrMax;
      }
    }
    if (attachers && attachers.length) {
      attachers.forEach(function(attacher) {
        if (includes(movingShapes, attacher)) {
          movingAttachers.push(attacher);
        } else {
          nonMovingAttachers.push(attacher);
        }
      });
      if (movingAttachers.length) {
        movingAttachersBBox = asTRBL(getBBox(movingAttachers.map(getMid)));
        movingAttachersConstraint = resizingShapeBBox[DIRECTION_TO_TRBL[DIRECTION_TO_OPPOSITE[direction]]] - (movingAttachersBBox[DIRECTION_TO_TRBL[DIRECTION_TO_OPPOSITE[direction]]] - start);
      }
      if (nonMovingAttachers.length) {
        nonMovingAttachersBBox = asTRBL(getBBox(nonMovingAttachers.map(getMid)));
        nonMovingAttachersConstraint = nonMovingAttachersBBox[DIRECTION_TO_TRBL[direction]] - (resizingShapeBBox[DIRECTION_TO_TRBL[direction]] - start);
      }
      if (direction === "n") {
        minOrMax = Math.min(movingAttachersConstraint || Infinity, nonMovingAttachersConstraint || Infinity);
        spaceToolConstraints.bottom = max2 = isNumber(max2) ? Math.min(max2, minOrMax) : minOrMax;
      } else if (direction === "w") {
        minOrMax = Math.min(movingAttachersConstraint || Infinity, nonMovingAttachersConstraint || Infinity);
        spaceToolConstraints.right = max2 = isNumber(max2) ? Math.min(max2, minOrMax) : minOrMax;
      } else if (direction === "s") {
        minOrMax = Math.max(movingAttachersConstraint || -Infinity, nonMovingAttachersConstraint || -Infinity);
        spaceToolConstraints.top = min2 = isNumber(min2) ? Math.max(min2, minOrMax) : minOrMax;
      } else if (direction === "e") {
        minOrMax = Math.max(movingAttachersConstraint || -Infinity, nonMovingAttachersConstraint || -Infinity);
        spaceToolConstraints.left = min2 = isNumber(min2) ? Math.max(min2, minOrMax) : minOrMax;
      }
    }
    var resizingShapeMinDimensions = minDimensions && minDimensions[resizingShape.id];
    if (resizingShapeMinDimensions) {
      if (direction === "n") {
        minOrMax = start + resizingShape[AXIS_TO_DIMENSION[axis]] - resizingShapeMinDimensions[AXIS_TO_DIMENSION[axis]];
        spaceToolConstraints.bottom = max2 = isNumber(max2) ? Math.min(max2, minOrMax) : minOrMax;
      } else if (direction === "w") {
        minOrMax = start + resizingShape[AXIS_TO_DIMENSION[axis]] - resizingShapeMinDimensions[AXIS_TO_DIMENSION[axis]];
        spaceToolConstraints.right = max2 = isNumber(max2) ? Math.min(max2, minOrMax) : minOrMax;
      } else if (direction === "s") {
        minOrMax = start - resizingShape[AXIS_TO_DIMENSION[axis]] + resizingShapeMinDimensions[AXIS_TO_DIMENSION[axis]];
        spaceToolConstraints.top = min2 = isNumber(min2) ? Math.max(min2, minOrMax) : minOrMax;
      } else if (direction === "e") {
        minOrMax = start - resizingShape[AXIS_TO_DIMENSION[axis]] + resizingShapeMinDimensions[AXIS_TO_DIMENSION[axis]];
        spaceToolConstraints.left = min2 = isNumber(min2) ? Math.max(min2, minOrMax) : minOrMax;
      }
    }
  });
  return spaceToolConstraints;
}
function includes(array, item) {
  return array.indexOf(item) !== -1;
}
function isAttacher$1(element) {
  return !!element.host;
}
var MARKER_DRAGGING = "djs-dragging", MARKER_RESIZING$1 = "djs-resizing";
var LOW_PRIORITY$4 = 250;
var max$1 = Math.max;
function SpaceToolPreview(eventBus, elementRegistry, canvas, styles, previewSupport) {
  function addPreviewGfx(collection, dragGroup) {
    forEach(collection, function(element) {
      previewSupport.addDragger(element, dragGroup);
      canvas.addMarker(element, MARKER_DRAGGING);
    });
  }
  eventBus.on("spaceTool.selection.start", function(event2) {
    var space = canvas.getLayer("space"), context = event2.context;
    var orientation = {
      x: "M 0,-10000 L 0,10000",
      y: "M -10000,0 L 10000,0"
    };
    var crosshairGroup = create$1("g");
    attr(crosshairGroup, styles.cls("djs-crosshair-group", ["no-events"]));
    append(space, crosshairGroup);
    var pathX = create$1("path");
    attr(pathX, "d", orientation.x);
    classes$1(pathX).add("djs-crosshair");
    append(crosshairGroup, pathX);
    var pathY = create$1("path");
    attr(pathY, "d", orientation.y);
    classes$1(pathY).add("djs-crosshair");
    append(crosshairGroup, pathY);
    context.crosshairGroup = crosshairGroup;
  });
  eventBus.on("spaceTool.selection.move", function(event2) {
    var crosshairGroup = event2.context.crosshairGroup;
    translate$1(crosshairGroup, event2.x, event2.y);
  });
  eventBus.on("spaceTool.selection.cleanup", function(event2) {
    var context = event2.context, crosshairGroup = context.crosshairGroup;
    if (crosshairGroup) {
      remove$1(crosshairGroup);
    }
  });
  eventBus.on("spaceTool.move", LOW_PRIORITY$4, function(event2) {
    var context = event2.context, line = context.line, axis = context.axis, movingShapes = context.movingShapes, resizingShapes = context.resizingShapes;
    if (!context.initialized) {
      return;
    }
    if (!context.dragGroup) {
      var spaceLayer = canvas.getLayer("space");
      line = create$1("path");
      attr(line, "d", "M0,0 L0,0");
      classes$1(line).add("djs-crosshair");
      append(spaceLayer, line);
      context.line = line;
      var dragGroup = create$1("g");
      attr(dragGroup, styles.cls("djs-drag-group", ["no-events"]));
      append(canvas.getActiveLayer(), dragGroup);
      addPreviewGfx(movingShapes, dragGroup);
      var movingConnections = context.movingConnections = elementRegistry.filter(function(element) {
        var sourceIsMoving = false;
        forEach(movingShapes, function(shape) {
          forEach(shape.outgoing, function(connection) {
            if (element === connection) {
              sourceIsMoving = true;
            }
          });
        });
        var targetIsMoving = false;
        forEach(movingShapes, function(shape) {
          forEach(shape.incoming, function(connection) {
            if (element === connection) {
              targetIsMoving = true;
            }
          });
        });
        var sourceIsResizing = false;
        forEach(resizingShapes, function(shape) {
          forEach(shape.outgoing, function(connection) {
            if (element === connection) {
              sourceIsResizing = true;
            }
          });
        });
        var targetIsResizing = false;
        forEach(resizingShapes, function(shape) {
          forEach(shape.incoming, function(connection) {
            if (element === connection) {
              targetIsResizing = true;
            }
          });
        });
        return isConnection$1(element) && (sourceIsMoving || sourceIsResizing) && (targetIsMoving || targetIsResizing);
      });
      addPreviewGfx(movingConnections, dragGroup);
      context.dragGroup = dragGroup;
    }
    if (!context.frameGroup) {
      var frameGroup = create$1("g");
      attr(frameGroup, styles.cls("djs-frame-group", ["no-events"]));
      append(canvas.getActiveLayer(), frameGroup);
      var frames = [];
      forEach(resizingShapes, function(shape) {
        var frame = previewSupport.addFrame(shape, frameGroup);
        var initialBounds = frame.getBBox();
        frames.push({
          element: frame,
          initialBounds
        });
        canvas.addMarker(shape, MARKER_RESIZING$1);
      });
      context.frameGroup = frameGroup;
      context.frames = frames;
    }
    var orientation = {
      x: "M" + event2.x + ", -10000 L" + event2.x + ", 10000",
      y: "M -10000, " + event2.y + " L 10000, " + event2.y
    };
    attr(line, { d: orientation[axis] });
    var opposite = { x: "y", y: "x" };
    var delta2 = { x: event2.dx, y: event2.dy };
    delta2[opposite[context.axis]] = 0;
    translate$1(context.dragGroup, delta2.x, delta2.y);
    forEach(context.frames, function(frame) {
      var element = frame.element, initialBounds = frame.initialBounds, width, height;
      if (context.direction === "e") {
        attr(element, {
          width: max$1(initialBounds.width + delta2.x, 5)
        });
      } else {
        width = max$1(initialBounds.width - delta2.x, 5);
        attr(element, {
          width,
          x: initialBounds.x + initialBounds.width - width
        });
      }
      if (context.direction === "s") {
        attr(element, {
          height: max$1(initialBounds.height + delta2.y, 5)
        });
      } else {
        height = max$1(initialBounds.height - delta2.y, 5);
        attr(element, {
          height,
          y: initialBounds.y + initialBounds.height - height
        });
      }
    });
  });
  eventBus.on("spaceTool.cleanup", function(event2) {
    var context = event2.context, movingShapes = context.movingShapes, movingConnections = context.movingConnections, resizingShapes = context.resizingShapes, line = context.line, dragGroup = context.dragGroup, frameGroup = context.frameGroup;
    forEach(movingShapes, function(shape) {
      canvas.removeMarker(shape, MARKER_DRAGGING);
    });
    forEach(movingConnections, function(connection) {
      canvas.removeMarker(connection, MARKER_DRAGGING);
    });
    if (dragGroup) {
      remove$1(line);
      remove$1(dragGroup);
    }
    forEach(resizingShapes, function(shape) {
      canvas.removeMarker(shape, MARKER_RESIZING$1);
    });
    if (frameGroup) {
      remove$1(frameGroup);
    }
  });
}
SpaceToolPreview.$inject = [
  "eventBus",
  "elementRegistry",
  "canvas",
  "styles",
  "previewSupport"
];
const SpaceTool = {
  __init__: ["spaceToolPreview"],
  __depends__: [
    DraggingModule,
    RulesModule,
    ToolManagerModule,
    PreviewSupportModule,
    MouseModule
  ],
  spaceTool: ["type", SpaceTool$1],
  spaceToolPreview: ["type", SpaceToolPreview]
};
var LASSO_TOOL_CURSOR = "crosshair";
function LassoTool(eventBus, canvas, dragging, elementRegistry, selection, toolManager, mouse) {
  this._selection = selection;
  this._dragging = dragging;
  this._mouse = mouse;
  var self = this;
  var visuals = {
    create: function(context) {
      var container = canvas.getActiveLayer(), frame;
      frame = context.frame = create$1("rect");
      attr(frame, {
        class: "djs-lasso-overlay",
        width: 1,
        height: 1,
        x: 0,
        y: 0
      });
      append(container, frame);
    },
    update: function(context) {
      var frame = context.frame, bbox = context.bbox;
      attr(frame, {
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height
      });
    },
    remove: function(context) {
      if (context.frame) {
        remove$1(context.frame);
      }
    }
  };
  toolManager.registerTool("lasso", {
    tool: "lasso.selection",
    dragging: "lasso"
  });
  eventBus.on("lasso.selection.end", function(event2) {
    var target = event2.originalEvent.target;
    if (!event2.hover && !(target instanceof SVGElement)) {
      return;
    }
    eventBus.once("lasso.selection.ended", function() {
      self.activateLasso(event2.originalEvent, true);
    });
  });
  eventBus.on("lasso.end", 0, function(event2) {
    var context = event2.context;
    var bbox = toBBox(event2);
    var elements = elementRegistry.filter(function(element) {
      return element;
    });
    var add2 = hasSecondaryModifier(event2);
    self.select(elements, bbox, add2 ? context.selection : []);
  });
  eventBus.on("lasso.start", function(event2) {
    var context = event2.context;
    context.bbox = toBBox(event2);
    visuals.create(context);
    context.selection = selection.get();
  });
  eventBus.on("lasso.move", function(event2) {
    var context = event2.context;
    context.bbox = toBBox(event2);
    visuals.update(context);
  });
  eventBus.on("lasso.cleanup", function(event2) {
    var context = event2.context;
    visuals.remove(context);
  });
  eventBus.on("element.mousedown", 1500, function(event2) {
    if (!hasSecondaryModifier(event2)) {
      return;
    }
    self.activateLasso(event2.originalEvent);
    return true;
  });
}
LassoTool.$inject = [
  "eventBus",
  "canvas",
  "dragging",
  "elementRegistry",
  "selection",
  "toolManager",
  "mouse"
];
LassoTool.prototype.activateLasso = function(event2, autoActivate) {
  this._dragging.init(event2, "lasso", {
    autoActivate,
    cursor: LASSO_TOOL_CURSOR,
    data: {
      context: {}
    }
  });
};
LassoTool.prototype.activateSelection = function(event2, autoActivate) {
  this._dragging.init(event2, "lasso.selection", {
    trapClick: false,
    autoActivate,
    cursor: LASSO_TOOL_CURSOR,
    data: {
      context: {}
    },
    keepSelection: true
  });
};
LassoTool.prototype.select = function(elements, bbox, previousSelection = []) {
  var selectedElements = getEnclosedElements(elements, bbox);
  this._selection.select([
    ...previousSelection,
    ...values(selectedElements)
  ]);
};
LassoTool.prototype.toggle = function() {
  if (this.isActive()) {
    return this._dragging.cancel();
  }
  var mouseEvent = this._mouse.getLastMoveEvent();
  this.activateSelection(mouseEvent, !!mouseEvent);
};
LassoTool.prototype.isActive = function() {
  var context = this._dragging.context();
  return context && /^lasso/.test(context.prefix);
};
function toBBox(event2) {
  var start = {
    x: event2.x - event2.dx,
    y: event2.y - event2.dy
  };
  var end = {
    x: event2.x,
    y: event2.y
  };
  var bbox;
  if (start.x <= end.x && start.y < end.y || start.x < end.x && start.y <= end.y) {
    bbox = {
      x: start.x,
      y: start.y,
      width: end.x - start.x,
      height: end.y - start.y
    };
  } else if (start.x >= end.x && start.y < end.y || start.x > end.x && start.y <= end.y) {
    bbox = {
      x: end.x,
      y: start.y,
      width: start.x - end.x,
      height: end.y - start.y
    };
  } else if (start.x <= end.x && start.y > end.y || start.x < end.x && start.y >= end.y) {
    bbox = {
      x: start.x,
      y: end.y,
      width: end.x - start.x,
      height: start.y - end.y
    };
  } else if (start.x >= end.x && start.y > end.y || start.x > end.x && start.y >= end.y) {
    bbox = {
      x: end.x,
      y: end.y,
      width: start.x - end.x,
      height: start.y - end.y
    };
  } else {
    bbox = {
      x: end.x,
      y: end.y,
      width: 0,
      height: 0
    };
  }
  return bbox;
}
const LassoToolModule = {
  __depends__: [
    ToolManagerModule,
    MouseModule
  ],
  __init__: ["lassoTool"],
  lassoTool: ["type", LassoTool]
};
var TOGGLE_SELECTOR = ".djs-palette-toggle", ENTRY_SELECTOR = ".entry", ELEMENT_SELECTOR = TOGGLE_SELECTOR + ", " + ENTRY_SELECTOR;
var PALETTE_PREFIX = "djs-palette-", PALETTE_SHOWN_CLS = "shown", PALETTE_OPEN_CLS = "open", PALETTE_TWO_COLUMN_CLS = "two-column";
var DEFAULT_PRIORITY$2 = 1e3;
function Palette(eventBus, canvas) {
  this._eventBus = eventBus;
  this._canvas = canvas;
  var self = this;
  eventBus.on("tool-manager.update", function(event2) {
    var tool = event2.tool;
    self.updateToolHighlight(tool);
  });
  eventBus.on("i18n.changed", function() {
    self._update();
  });
  eventBus.on("diagram.init", function() {
    self._diagramInitialized = true;
    self._rebuild();
  });
}
Palette.$inject = ["eventBus", "canvas"];
Palette.prototype.registerProvider = function(priority, provider) {
  if (!provider) {
    provider = priority;
    priority = DEFAULT_PRIORITY$2;
  }
  this._eventBus.on("palette.getProviders", priority, function(event2) {
    event2.providers.push(provider);
  });
  this._rebuild();
};
Palette.prototype.getEntries = function() {
  var providers = this._getProviders();
  return providers.reduce(addPaletteEntries, {});
};
Palette.prototype._rebuild = function() {
  if (!this._diagramInitialized) {
    return;
  }
  var providers = this._getProviders();
  if (!providers.length) {
    return;
  }
  if (!this._container) {
    this._init();
  }
  this._update();
};
Palette.prototype._init = function() {
  var self = this;
  var eventBus = this._eventBus;
  var parentContainer = this._getParentContainer();
  var container = this._container = domify(Palette.HTML_MARKUP);
  parentContainer.appendChild(container);
  classes(parentContainer).add(PALETTE_PREFIX + PALETTE_SHOWN_CLS);
  delegate.bind(container, ELEMENT_SELECTOR, "click", function(event2) {
    var target = event2.delegateTarget;
    if (matches(target, TOGGLE_SELECTOR)) {
      return self.toggle();
    }
    self.trigger("click", event2);
  });
  event.bind(container, "mousedown", function(event2) {
    event2.stopPropagation();
  });
  delegate.bind(container, ENTRY_SELECTOR, "dragstart", function(event2) {
    self.trigger("dragstart", event2);
  });
  eventBus.on("canvas.resized", this._layoutChanged, this);
  eventBus.fire("palette.create", {
    container
  });
};
Palette.prototype._getProviders = function(id) {
  var event2 = this._eventBus.createEvent({
    type: "palette.getProviders",
    providers: []
  });
  this._eventBus.fire(event2);
  return event2.providers;
};
Palette.prototype._toggleState = function(state) {
  state = state || {};
  var parent = this._getParentContainer(), container = this._container;
  var eventBus = this._eventBus;
  var twoColumn;
  var cls = classes(container), parentCls = classes(parent);
  if ("twoColumn" in state) {
    twoColumn = state.twoColumn;
  } else {
    twoColumn = this._needsCollapse(parent.clientHeight, this._entries || {});
  }
  cls.toggle(PALETTE_TWO_COLUMN_CLS, twoColumn);
  parentCls.toggle(PALETTE_PREFIX + PALETTE_TWO_COLUMN_CLS, twoColumn);
  if ("open" in state) {
    cls.toggle(PALETTE_OPEN_CLS, state.open);
    parentCls.toggle(PALETTE_PREFIX + PALETTE_OPEN_CLS, state.open);
  }
  eventBus.fire("palette.changed", {
    twoColumn,
    open: this.isOpen()
  });
};
Palette.prototype._update = function() {
  var entriesContainer = query(".djs-palette-entries", this._container), entries = this._entries = this.getEntries();
  clear$1(entriesContainer);
  forEach(entries, function(entry, id) {
    var grouping = entry.group || "default";
    var container = query("[data-group=" + escapeCSS(grouping) + "]", entriesContainer);
    if (!container) {
      container = domify('<div class="group"></div>');
      attr$1(container, "data-group", grouping);
      entriesContainer.appendChild(container);
    }
    var html = entry.html || (entry.separator ? '<hr class="separator" />' : '<div class="entry" draggable="true"></div>');
    var control = domify(html);
    container.appendChild(control);
    if (!entry.separator) {
      attr$1(control, "data-action", id);
      if (entry.title) {
        attr$1(control, "title", entry.title);
      }
      if (entry.className) {
        addClasses$1(control, entry.className);
      }
      if (entry.imageUrl) {
        var image = domify("<img>");
        attr$1(image, "src", entry.imageUrl);
        control.appendChild(image);
      }
    }
  });
  this.open();
};
Palette.prototype.trigger = function(action, event2, autoActivate) {
  var entry, originalEvent, button = event2.delegateTarget || event2.target;
  if (!button) {
    return event2.preventDefault();
  }
  entry = attr$1(button, "data-action");
  originalEvent = event2.originalEvent || event2;
  return this.triggerEntry(entry, action, originalEvent, autoActivate);
};
Palette.prototype.triggerEntry = function(entryId, action, event2, autoActivate) {
  var entries = this._entries, entry, handler;
  entry = entries[entryId];
  if (!entry) {
    return;
  }
  handler = entry.action;
  if (this._eventBus.fire("palette.trigger", { entry, event: event2 }) === false) {
    return;
  }
  if (isFunction(handler)) {
    if (action === "click") {
      return handler(event2, autoActivate);
    }
  } else {
    if (handler[action]) {
      return handler[action](event2, autoActivate);
    }
  }
  event2.preventDefault();
};
Palette.prototype._layoutChanged = function() {
  this._toggleState({});
};
Palette.prototype._needsCollapse = function(availableHeight, entries) {
  var margin = 20 + 10 + 20;
  var entriesHeight = Object.keys(entries).length * 46;
  return availableHeight < entriesHeight + margin;
};
Palette.prototype.close = function() {
  this._toggleState({
    open: false,
    twoColumn: false
  });
};
Palette.prototype.open = function() {
  this._toggleState({ open: true });
};
Palette.prototype.toggle = function() {
  if (this.isOpen()) {
    this.close();
  } else {
    this.open();
  }
};
Palette.prototype.isActiveTool = function(tool) {
  return tool && this._activeTool === tool;
};
Palette.prototype.updateToolHighlight = function(name) {
  var entriesContainer, toolsContainer;
  if (!this._toolsContainer) {
    entriesContainer = query(".djs-palette-entries", this._container);
    this._toolsContainer = query("[data-group=tools]", entriesContainer);
  }
  toolsContainer = this._toolsContainer;
  forEach(toolsContainer.children, function(tool) {
    var actionName = tool.getAttribute("data-action");
    if (!actionName) {
      return;
    }
    var toolClasses = classes(tool);
    actionName = actionName.replace("-tool", "");
    if (toolClasses.contains("entry") && actionName === name) {
      toolClasses.add("highlighted-entry");
    } else {
      toolClasses.remove("highlighted-entry");
    }
  });
};
Palette.prototype.isOpen = function() {
  return classes(this._container).has(PALETTE_OPEN_CLS);
};
Palette.prototype._getParentContainer = function() {
  return this._canvas.getContainer();
};
Palette.HTML_MARKUP = '<div class="djs-palette"><div class="djs-palette-entries"></div><div class="djs-palette-toggle"></div></div>';
function addClasses$1(element, classNames) {
  var classes$12 = classes(element);
  var actualClassNames = isArray$1(classNames) ? classNames : classNames.split(/\s+/g);
  actualClassNames.forEach(function(cls) {
    classes$12.add(cls);
  });
}
function addPaletteEntries(entries, provider) {
  var entriesOrUpdater = provider.getPaletteEntries();
  if (isFunction(entriesOrUpdater)) {
    return entriesOrUpdater(entries);
  }
  forEach(entriesOrUpdater, function(entry, id) {
    entries[id] = entry;
  });
  return entries;
}
const PaletteModule = {
  __init__: ["palette"],
  palette: ["type", Palette]
};
var MARKER_OK$1 = "drop-ok", MARKER_NOT_OK$1 = "drop-not-ok", MARKER_ATTACH = "attach-ok", MARKER_NEW_PARENT = "new-parent";
var PREFIX = "create";
var HIGH_PRIORITY$2 = 2e3;
function Create(canvas, dragging, eventBus, modeling, rules) {
  function canCreate(elements, target, position, source, hints) {
    if (!target) {
      return false;
    }
    elements = filter(elements, function(element) {
      var labelTarget = element.labelTarget;
      return !element.parent && !(isLabel$1(element) && elements.indexOf(labelTarget) !== -1);
    });
    var shape = find(elements, function(element) {
      return !isConnection$1(element);
    });
    var attach = false, connect = false, create2 = false;
    if (isSingleShape(elements)) {
      attach = rules.allowed("shape.attach", {
        position,
        shape,
        target
      });
    }
    if (!attach) {
      if (isSingleShape(elements)) {
        create2 = rules.allowed("shape.create", {
          position,
          shape,
          source,
          target
        });
      } else {
        create2 = rules.allowed("elements.create", {
          elements,
          position,
          target
        });
      }
    }
    var connectionTarget = hints.connectionTarget;
    if (create2 || attach) {
      if (shape && source) {
        connect = rules.allowed("connection.create", {
          source: connectionTarget === source ? shape : source,
          target: connectionTarget === source ? source : shape,
          hints: {
            targetParent: target,
            targetAttach: attach
          }
        });
      }
      return {
        attach,
        connect
      };
    }
    if (create2 === null || attach === null) {
      return null;
    }
    return false;
  }
  function setMarker(element, marker) {
    [MARKER_ATTACH, MARKER_OK$1, MARKER_NOT_OK$1, MARKER_NEW_PARENT].forEach(function(m2) {
      if (m2 === marker) {
        canvas.addMarker(element, m2);
      } else {
        canvas.removeMarker(element, m2);
      }
    });
  }
  eventBus.on(["create.move", "create.hover"], function(event2) {
    var context = event2.context, elements = context.elements, hover = event2.hover, source = context.source, hints = context.hints || {};
    if (!hover) {
      context.canExecute = false;
      context.target = null;
      return;
    }
    ensureConstraints$1(event2);
    var position = {
      x: event2.x,
      y: event2.y
    };
    var canExecute = context.canExecute = hover && canCreate(elements, hover, position, source, hints);
    if (hover && canExecute !== null) {
      context.target = hover;
      if (canExecute && canExecute.attach) {
        setMarker(hover, MARKER_ATTACH);
      } else {
        setMarker(hover, canExecute ? MARKER_NEW_PARENT : MARKER_NOT_OK$1);
      }
    }
  });
  eventBus.on(["create.end", "create.out", "create.cleanup"], function(event2) {
    var hover = event2.hover;
    if (hover) {
      setMarker(hover, null);
    }
  });
  eventBus.on("create.end", function(event2) {
    var context = event2.context, source = context.source, shape = context.shape, elements = context.elements, target = context.target, canExecute = context.canExecute, attach = canExecute && canExecute.attach, connect = canExecute && canExecute.connect, hints = context.hints || {};
    if (canExecute === false || !target) {
      return false;
    }
    ensureConstraints$1(event2);
    var position = {
      x: event2.x,
      y: event2.y
    };
    if (connect) {
      shape = modeling.appendShape(source, shape, position, target, {
        attach,
        connection: connect === true ? {} : connect,
        connectionTarget: hints.connectionTarget
      });
    } else {
      elements = modeling.createElements(elements, position, target, assign({}, hints, {
        attach
      }));
      shape = find(elements, function(element) {
        return !isConnection$1(element);
      });
    }
    assign(context, {
      elements,
      shape
    });
    assign(event2, {
      elements,
      shape
    });
  });
  function cancel() {
    var context = dragging.context();
    if (context && context.prefix === PREFIX) {
      dragging.cancel();
    }
  }
  eventBus.on("create.init", function() {
    eventBus.on("elements.changed", cancel);
    eventBus.once(["create.cancel", "create.end"], HIGH_PRIORITY$2, function() {
      eventBus.off("elements.changed", cancel);
    });
  });
  this.start = function(event2, elements, context) {
    if (!isArray$1(elements)) {
      elements = [elements];
    }
    var shape = find(elements, function(element) {
      return !isConnection$1(element);
    });
    if (!shape) {
      return;
    }
    context = assign({
      elements,
      hints: {},
      shape
    }, context || {});
    forEach(elements, function(element) {
      if (!isNumber(element.x)) {
        element.x = 0;
      }
      if (!isNumber(element.y)) {
        element.y = 0;
      }
    });
    var visibleElements = filter(elements, function(element) {
      return !element.hidden;
    });
    var bbox = getBBox(visibleElements);
    forEach(elements, function(element) {
      if (isConnection$1(element)) {
        element.waypoints = map(element.waypoints, function(waypoint) {
          return {
            x: waypoint.x - bbox.x - bbox.width / 2,
            y: waypoint.y - bbox.y - bbox.height / 2
          };
        });
      }
      assign(element, {
        x: element.x - bbox.x - bbox.width / 2,
        y: element.y - bbox.y - bbox.height / 2
      });
    });
    dragging.init(event2, PREFIX, {
      cursor: "grabbing",
      autoActivate: true,
      data: {
        shape,
        elements,
        context
      }
    });
  };
}
Create.$inject = [
  "canvas",
  "dragging",
  "eventBus",
  "modeling",
  "rules"
];
function ensureConstraints$1(event2) {
  var context = event2.context, createConstraints = context.createConstraints;
  if (!createConstraints) {
    return;
  }
  if (createConstraints.left) {
    event2.x = Math.max(event2.x, createConstraints.left);
  }
  if (createConstraints.right) {
    event2.x = Math.min(event2.x, createConstraints.right);
  }
  if (createConstraints.top) {
    event2.y = Math.max(event2.y, createConstraints.top);
  }
  if (createConstraints.bottom) {
    event2.y = Math.min(event2.y, createConstraints.bottom);
  }
}
function isSingleShape(elements) {
  return elements && elements.length === 1 && !isConnection$1(elements[0]);
}
var LOW_PRIORITY$3 = 750;
function CreatePreview(canvas, eventBus, graphicsFactory, previewSupport, styles) {
  function createDragGroup(elements) {
    var dragGroup = create$1("g");
    attr(dragGroup, styles.cls("djs-drag-group", ["no-events"]));
    var childrenGfx = create$1("g");
    elements.forEach(function(element) {
      var gfx;
      if (element.hidden) {
        return;
      }
      if (element.waypoints) {
        gfx = graphicsFactory._createContainer("connection", childrenGfx);
        graphicsFactory.drawConnection(getVisual(gfx), element);
      } else {
        gfx = graphicsFactory._createContainer("shape", childrenGfx);
        graphicsFactory.drawShape(getVisual(gfx), element);
        translate$1(gfx, element.x, element.y);
      }
      previewSupport.addDragger(element, dragGroup, gfx);
    });
    return dragGroup;
  }
  eventBus.on("create.move", LOW_PRIORITY$3, function(event2) {
    var hover = event2.hover, context = event2.context, elements = context.elements, dragGroup = context.dragGroup;
    if (!dragGroup) {
      dragGroup = context.dragGroup = createDragGroup(elements);
    }
    var activeLayer;
    if (hover) {
      if (!dragGroup.parentNode) {
        activeLayer = canvas.getActiveLayer();
        append(activeLayer, dragGroup);
      }
      translate$1(dragGroup, event2.x, event2.y);
    } else {
      remove$1(dragGroup);
    }
  });
  eventBus.on("create.cleanup", function(event2) {
    var context = event2.context, dragGroup = context.dragGroup;
    if (dragGroup) {
      remove$1(dragGroup);
    }
  });
}
CreatePreview.$inject = [
  "canvas",
  "eventBus",
  "graphicsFactory",
  "previewSupport",
  "styles"
];
const CreateModule = {
  __depends__: [
    DraggingModule,
    PreviewSupportModule,
    RulesModule,
    SelectionModule
  ],
  __init__: [
    "create",
    "createPreview"
  ],
  create: ["type", Create],
  createPreview: ["type", CreatePreview]
};
let DomainStoryPaletteProvider$1 = (_i = class {
  constructor(palette, eventBus, create2, elementFactory, spaceTool, lassoTool, iconDictionaryService) {
    this.create = create2;
    this.elementFactory = elementFactory;
    this.spaceTool = spaceTool;
    this.lassoTool = lassoTool;
    this.iconDictionaryService = iconDictionaryService;
    palette.registerProvider(this);
    eventBus.on("dst.config.changed", () => {
      palette._update();
    });
  }
  getPaletteEntries() {
    return this.initPalette();
  }
  initPalette() {
    const actions = {};
    const actorTypes = this.iconDictionaryService.getIconsAssignedAs(
      ElementTypes.ACTOR
    );
    actorTypes == null ? void 0 : actorTypes.keysArray().forEach((name) => {
      const entries = this.addCanvasObjectTypes(name, "actor", ElementTypes.ACTOR);
      Object.entries(entries).forEach(([key, value]) => {
        actions[key] = value;
      });
    });
    actions["actor-separator"] = {
      group: "actor",
      separator: true,
      action: () => {
      }
    };
    const workObjectTypes = this.iconDictionaryService.getIconsAssignedAs(
      ElementTypes.WORKOBJECT
    );
    workObjectTypes == null ? void 0 : workObjectTypes.keysArray().forEach((name) => {
      const entries = this.addCanvasObjectTypes(
        name,
        "actor",
        ElementTypes.WORKOBJECT
      );
      Object.entries(entries).forEach(([key, value]) => {
        actions[key] = value;
      });
    });
    actions["workObject-separator"] = {
      group: "workObject",
      separator: true,
      action: () => {
      }
    };
    actions["domainStory-group"] = this.createAction(
      ElementTypes.GROUP,
      "group",
      "icon-domain-story-tool-group",
      "group",
      {}
    );
    actions["group-separator"] = {
      group: "group",
      separator: true,
      action: () => {
      }
    };
    actions["lasso-tool"] = {
      group: "tools",
      className: "bpmn-icon-lasso-tool",
      title: "Activate the lasso tool",
      action: {
        click: (event2) => {
          this.lassoTool.activateSelection(event2);
        }
      }
    };
    actions["space-tool"] = {
      group: "tools",
      className: "bpmn-icon-space-tool",
      title: "Activate the create/remove space tool",
      action: {
        click: (event2) => {
          this.spaceTool.activateSelection(event2, false, false);
        }
      }
    };
    return actions;
  }
  addCanvasObjectTypes(name, className, elementType) {
    const icon = this.iconDictionaryService.getCSSClassOfIcon(name);
    const key = `domainStory-${className}${name}`;
    const value = this.createAction(
      `${elementType}${name}`,
      className,
      icon ?? "",
      name,
      {}
    );
    return {
      [key]: value
    };
  }
  createAction(type, group, className, title, options) {
    const createListener = (event2) => {
      const shape = this.elementFactory.createShape(
        assign({ type }, options)
      );
      assign(shape.businessObject, {
        id: shape.id
      });
      this.create.start(event2, shape);
    };
    const shortType = type.replace(/^domainStory:/, "");
    return {
      group,
      className,
      title: "Create " + title || "Create " + shortType,
      action: {
        dragstart: createListener,
        click: createListener
      }
    };
  }
}, _i.$inject = [
  "palette",
  "eventBus",
  "create",
  "elementFactory",
  "spaceTool",
  "lassoTool",
  "domainStoryIconDictionaryService"
], _i);
const DomainStoryPaletteProvider = {
  __depends__: [
    IconSetImportExportService,
    CreateModule,
    SpaceTool,
    LassoToolModule,
    PaletteModule
  ],
  __init__: ["domainStoryPaletteProvider"],
  domainStoryPaletteProvider: ["type", DomainStoryPaletteProvider$1]
};
function Connect(eventBus, dragging, modeling, rules) {
  function canConnect2(source, target) {
    return rules.allowed("connection.create", {
      source,
      target
    });
  }
  function canConnectReverse(source, target) {
    return canConnect2(target, source);
  }
  eventBus.on("connect.hover", function(event2) {
    var context = event2.context, start = context.start, hover = event2.hover, canExecute;
    context.hover = hover;
    canExecute = context.canExecute = canConnect2(start, hover);
    if (isNil(canExecute)) {
      return;
    }
    if (canExecute !== false) {
      context.source = start;
      context.target = hover;
      return;
    }
    canExecute = context.canExecute = canConnectReverse(start, hover);
    if (isNil(canExecute)) {
      return;
    }
    if (canExecute !== false) {
      context.source = hover;
      context.target = start;
    }
  });
  eventBus.on(["connect.out", "connect.cleanup"], function(event2) {
    var context = event2.context;
    context.hover = null;
    context.source = null;
    context.target = null;
    context.canExecute = false;
  });
  eventBus.on("connect.end", function(event2) {
    var context = event2.context, canExecute = context.canExecute, connectionStart = context.connectionStart, connectionEnd = {
      x: event2.x,
      y: event2.y
    }, source = context.source, target = context.target;
    if (!canExecute) {
      return false;
    }
    var attrs = null, hints = {
      connectionStart: isReverse(context) ? connectionEnd : connectionStart,
      connectionEnd: isReverse(context) ? connectionStart : connectionEnd
    };
    if (isObject(canExecute)) {
      attrs = canExecute;
    }
    context.connection = modeling.connect(source, target, attrs, hints);
  });
  this.start = function(event2, start, connectionStart, autoActivate) {
    if (!isObject(connectionStart)) {
      autoActivate = connectionStart;
      connectionStart = getMid(start);
    }
    dragging.init(event2, "connect", {
      autoActivate,
      data: {
        shape: start,
        context: {
          start,
          connectionStart
        }
      }
    });
  };
}
Connect.$inject = [
  "eventBus",
  "dragging",
  "modeling",
  "rules"
];
function isReverse(context) {
  var hover = context.hover, source = context.source, target = context.target;
  return hover && source && hover === source && source !== target;
}
var HIGH_PRIORITY$1 = 1100, LOW_PRIORITY$2 = 900;
var MARKER_OK = "connect-ok", MARKER_NOT_OK = "connect-not-ok";
function ConnectPreview(injector, eventBus, canvas) {
  var connectionPreview = injector.get("connectionPreview", false);
  connectionPreview && eventBus.on("connect.move", function(event2) {
    var context = event2.context, canConnect2 = context.canExecute, hover = context.hover, source = context.source, start = context.start, startPosition = context.startPosition, target = context.target, connectionStart = context.connectionStart || startPosition, connectionEnd = context.connectionEnd || {
      x: event2.x,
      y: event2.y
    }, previewStart = connectionStart, previewEnd = connectionEnd;
    if (isReverse(context)) {
      previewStart = connectionEnd;
      previewEnd = connectionStart;
    }
    connectionPreview.drawPreview(context, canConnect2, {
      source: source || start,
      target: target || hover,
      connectionStart: previewStart,
      connectionEnd: previewEnd
    });
  });
  eventBus.on("connect.hover", LOW_PRIORITY$2, function(event2) {
    var context = event2.context, hover = event2.hover, canExecute = context.canExecute;
    if (canExecute === null) {
      return;
    }
    canvas.addMarker(hover, canExecute ? MARKER_OK : MARKER_NOT_OK);
  });
  eventBus.on([
    "connect.out",
    "connect.cleanup"
  ], HIGH_PRIORITY$1, function(event2) {
    var hover = event2.hover;
    if (hover) {
      canvas.removeMarker(hover, MARKER_OK);
      canvas.removeMarker(hover, MARKER_NOT_OK);
    }
  });
  connectionPreview && eventBus.on("connect.cleanup", function(event2) {
    connectionPreview.cleanUp(event2.context);
  });
}
ConnectPreview.$inject = [
  "injector",
  "eventBus",
  "canvas"
];
const ConnectModule = {
  __depends__: [
    SelectionModule,
    RulesModule,
    DraggingModule
  ],
  __init__: [
    "connectPreview"
  ],
  connect: ["type", Connect],
  connectPreview: ["type", ConnectPreview]
};
var n$1, l$1, t$2, i$1, r$2, o$1, e$2, f$1, c$1, s$1, a$1, p$1 = {}, v$1 = [], y$1 = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i, d$1 = Array.isArray;
function w$1(n2, l2) {
  for (var t2 in l2) n2[t2] = l2[t2];
  return n2;
}
function g(n2) {
  n2 && n2.parentNode && n2.parentNode.removeChild(n2);
}
function _$1(l2, t2, u2) {
  var i2, r2, o2, e2 = {};
  for (o2 in t2) "key" == o2 ? i2 = t2[o2] : "ref" == o2 ? r2 = t2[o2] : e2[o2] = t2[o2];
  if (arguments.length > 2 && (e2.children = arguments.length > 3 ? n$1.call(arguments, 2) : u2), "function" == typeof l2 && null != l2.defaultProps) for (o2 in l2.defaultProps) void 0 === e2[o2] && (e2[o2] = l2.defaultProps[o2]);
  return m$2(l2, e2, i2, r2, null);
}
function m$2(n2, u2, i2, r2, o2) {
  var e2 = { type: n2, props: u2, key: i2, ref: r2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o2 ? ++t$2 : o2, __i: -1, __u: 0 };
  return null == o2 && null != l$1.vnode && l$1.vnode(e2), e2;
}
function k$1(n2) {
  return n2.children;
}
function x(n2, l2) {
  this.props = n2, this.context = l2;
}
function S(n2, l2) {
  if (null == l2) return n2.__ ? S(n2.__, n2.__i + 1) : null;
  for (var t2; l2 < n2.__k.length; l2++) if (null != (t2 = n2.__k[l2]) && null != t2.__e) return t2.__e;
  return "function" == typeof n2.type ? S(n2) : null;
}
function C$1(n2) {
  var l2, t2;
  if (null != (n2 = n2.__) && null != n2.__c) {
    for (n2.__e = n2.__c.base = null, l2 = 0; l2 < n2.__k.length; l2++) if (null != (t2 = n2.__k[l2]) && null != t2.__e) {
      n2.__e = n2.__c.base = t2.__e;
      break;
    }
    return C$1(n2);
  }
}
function M(n2) {
  (!n2.__d && (n2.__d = true) && i$1.push(n2) && !$.__r++ || r$2 !== l$1.debounceRendering) && ((r$2 = l$1.debounceRendering) || o$1)($);
}
function $() {
  for (var n2, t2, u2, r2, o2, f2, c2, s2 = 1; i$1.length; ) i$1.length > s2 && i$1.sort(e$2), n2 = i$1.shift(), s2 = i$1.length, n2.__d && (u2 = void 0, o2 = (r2 = (t2 = n2).__v).__e, f2 = [], c2 = [], t2.__P && ((u2 = w$1({}, r2)).__v = r2.__v + 1, l$1.vnode && l$1.vnode(u2), j$1(t2.__P, u2, r2, t2.__n, t2.__P.namespaceURI, 32 & r2.__u ? [o2] : null, f2, null == o2 ? S(r2) : o2, !!(32 & r2.__u), c2), u2.__v = r2.__v, u2.__.__k[u2.__i] = u2, z$1(f2, u2, c2), u2.__e != o2 && C$1(u2)));
  $.__r = 0;
}
function I(n2, l2, t2, u2, i2, r2, o2, e2, f2, c2, s2) {
  var a2, h2, y2, d2, w2, g2, _2 = u2 && u2.__k || v$1, m2 = l2.length;
  for (f2 = P(t2, l2, _2, f2, m2), a2 = 0; a2 < m2; a2++) null != (y2 = t2.__k[a2]) && (h2 = -1 === y2.__i ? p$1 : _2[y2.__i] || p$1, y2.__i = a2, g2 = j$1(n2, y2, h2, i2, r2, o2, e2, f2, c2, s2), d2 = y2.__e, y2.ref && h2.ref != y2.ref && (h2.ref && V(h2.ref, null, y2), s2.push(y2.ref, y2.__c || d2, y2)), null == w2 && null != d2 && (w2 = d2), 4 & y2.__u || h2.__k === y2.__k ? f2 = A$1(y2, f2, n2) : "function" == typeof y2.type && void 0 !== g2 ? f2 = g2 : d2 && (f2 = d2.nextSibling), y2.__u &= -7);
  return t2.__e = w2, f2;
}
function P(n2, l2, t2, u2, i2) {
  var r2, o2, e2, f2, c2, s2 = t2.length, a2 = s2, h2 = 0;
  for (n2.__k = new Array(i2), r2 = 0; r2 < i2; r2++) null != (o2 = l2[r2]) && "boolean" != typeof o2 && "function" != typeof o2 ? (f2 = r2 + h2, (o2 = n2.__k[r2] = "string" == typeof o2 || "number" == typeof o2 || "bigint" == typeof o2 || o2.constructor == String ? m$2(null, o2, null, null, null) : d$1(o2) ? m$2(k$1, { children: o2 }, null, null, null) : void 0 === o2.constructor && o2.__b > 0 ? m$2(o2.type, o2.props, o2.key, o2.ref ? o2.ref : null, o2.__v) : o2).__ = n2, o2.__b = n2.__b + 1, e2 = null, -1 !== (c2 = o2.__i = L(o2, t2, f2, a2)) && (a2--, (e2 = t2[c2]) && (e2.__u |= 2)), null == e2 || null === e2.__v ? (-1 == c2 && h2--, "function" != typeof o2.type && (o2.__u |= 4)) : c2 != f2 && (c2 == f2 - 1 ? h2-- : c2 == f2 + 1 ? h2++ : (c2 > f2 ? h2-- : h2++, o2.__u |= 4))) : n2.__k[r2] = null;
  if (a2) for (r2 = 0; r2 < s2; r2++) null != (e2 = t2[r2]) && 0 == (2 & e2.__u) && (e2.__e == u2 && (u2 = S(e2)), q$1(e2, e2));
  return u2;
}
function A$1(n2, l2, t2) {
  var u2, i2;
  if ("function" == typeof n2.type) {
    for (u2 = n2.__k, i2 = 0; u2 && i2 < u2.length; i2++) u2[i2] && (u2[i2].__ = n2, l2 = A$1(u2[i2], l2, t2));
    return l2;
  }
  n2.__e != l2 && (l2 && n2.type && !t2.contains(l2) && (l2 = S(n2)), t2.insertBefore(n2.__e, l2 || null), l2 = n2.__e);
  do {
    l2 = l2 && l2.nextSibling;
  } while (null != l2 && 8 == l2.nodeType);
  return l2;
}
function L(n2, l2, t2, u2) {
  var i2, r2, o2 = n2.key, e2 = n2.type, f2 = l2[t2];
  if (null === f2 || f2 && o2 == f2.key && e2 === f2.type && 0 == (2 & f2.__u)) return t2;
  if (u2 > (null != f2 && 0 == (2 & f2.__u) ? 1 : 0)) for (i2 = t2 - 1, r2 = t2 + 1; i2 >= 0 || r2 < l2.length; ) {
    if (i2 >= 0) {
      if ((f2 = l2[i2]) && 0 == (2 & f2.__u) && o2 == f2.key && e2 === f2.type) return i2;
      i2--;
    }
    if (r2 < l2.length) {
      if ((f2 = l2[r2]) && 0 == (2 & f2.__u) && o2 == f2.key && e2 === f2.type) return r2;
      r2++;
    }
  }
  return -1;
}
function T$1(n2, l2, t2) {
  "-" == l2[0] ? n2.setProperty(l2, null == t2 ? "" : t2) : n2[l2] = null == t2 ? "" : "number" != typeof t2 || y$1.test(l2) ? t2 : t2 + "px";
}
function F(n2, l2, t2, u2, i2) {
  var r2;
  n: if ("style" == l2) if ("string" == typeof t2) n2.style.cssText = t2;
  else {
    if ("string" == typeof u2 && (n2.style.cssText = u2 = ""), u2) for (l2 in u2) t2 && l2 in t2 || T$1(n2.style, l2, "");
    if (t2) for (l2 in t2) u2 && t2[l2] === u2[l2] || T$1(n2.style, l2, t2[l2]);
  }
  else if ("o" == l2[0] && "n" == l2[1]) r2 = l2 != (l2 = l2.replace(f$1, "$1")), l2 = l2.toLowerCase() in n2 || "onFocusOut" == l2 || "onFocusIn" == l2 ? l2.toLowerCase().slice(2) : l2.slice(2), n2.l || (n2.l = {}), n2.l[l2 + r2] = t2, t2 ? u2 ? t2.t = u2.t : (t2.t = c$1, n2.addEventListener(l2, r2 ? a$1 : s$1, r2)) : n2.removeEventListener(l2, r2 ? a$1 : s$1, r2);
  else {
    if ("http://www.w3.org/2000/svg" == i2) l2 = l2.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
    else if ("width" != l2 && "height" != l2 && "href" != l2 && "list" != l2 && "form" != l2 && "tabIndex" != l2 && "download" != l2 && "rowSpan" != l2 && "colSpan" != l2 && "role" != l2 && "popover" != l2 && l2 in n2) try {
      n2[l2] = null == t2 ? "" : t2;
      break n;
    } catch (n3) {
    }
    "function" == typeof t2 || (null == t2 || false === t2 && "-" != l2[4] ? n2.removeAttribute(l2) : n2.setAttribute(l2, "popover" == l2 && 1 == t2 ? "" : t2));
  }
}
function O(n2) {
  return function(t2) {
    if (this.l) {
      var u2 = this.l[t2.type + n2];
      if (null == t2.u) t2.u = c$1++;
      else if (t2.u < u2.t) return;
      return u2(l$1.event ? l$1.event(t2) : t2);
    }
  };
}
function j$1(n2, t2, u2, i2, r2, o2, e2, f2, c2, s2) {
  var a2, h2, p2, v2, y2, _2, m2, b, S2, C2, M2, $2, P2, A2, H, L2, T2, F2 = t2.type;
  if (void 0 !== t2.constructor) return null;
  128 & u2.__u && (c2 = !!(32 & u2.__u), o2 = [f2 = t2.__e = u2.__e]), (a2 = l$1.__b) && a2(t2);
  n: if ("function" == typeof F2) try {
    if (b = t2.props, S2 = "prototype" in F2 && F2.prototype.render, C2 = (a2 = F2.contextType) && i2[a2.__c], M2 = a2 ? C2 ? C2.props.value : a2.__ : i2, u2.__c ? m2 = (h2 = t2.__c = u2.__c).__ = h2.__E : (S2 ? t2.__c = h2 = new F2(b, M2) : (t2.__c = h2 = new x(b, M2), h2.constructor = F2, h2.render = B$1), C2 && C2.sub(h2), h2.props = b, h2.state || (h2.state = {}), h2.context = M2, h2.__n = i2, p2 = h2.__d = true, h2.__h = [], h2._sb = []), S2 && null == h2.__s && (h2.__s = h2.state), S2 && null != F2.getDerivedStateFromProps && (h2.__s == h2.state && (h2.__s = w$1({}, h2.__s)), w$1(h2.__s, F2.getDerivedStateFromProps(b, h2.__s))), v2 = h2.props, y2 = h2.state, h2.__v = t2, p2) S2 && null == F2.getDerivedStateFromProps && null != h2.componentWillMount && h2.componentWillMount(), S2 && null != h2.componentDidMount && h2.__h.push(h2.componentDidMount);
    else {
      if (S2 && null == F2.getDerivedStateFromProps && b !== v2 && null != h2.componentWillReceiveProps && h2.componentWillReceiveProps(b, M2), !h2.__e && (null != h2.shouldComponentUpdate && false === h2.shouldComponentUpdate(b, h2.__s, M2) || t2.__v == u2.__v)) {
        for (t2.__v != u2.__v && (h2.props = b, h2.state = h2.__s, h2.__d = false), t2.__e = u2.__e, t2.__k = u2.__k, t2.__k.some(function(n3) {
          n3 && (n3.__ = t2);
        }), $2 = 0; $2 < h2._sb.length; $2++) h2.__h.push(h2._sb[$2]);
        h2._sb = [], h2.__h.length && e2.push(h2);
        break n;
      }
      null != h2.componentWillUpdate && h2.componentWillUpdate(b, h2.__s, M2), S2 && null != h2.componentDidUpdate && h2.__h.push(function() {
        h2.componentDidUpdate(v2, y2, _2);
      });
    }
    if (h2.context = M2, h2.props = b, h2.__P = n2, h2.__e = false, P2 = l$1.__r, A2 = 0, S2) {
      for (h2.state = h2.__s, h2.__d = false, P2 && P2(t2), a2 = h2.render(h2.props, h2.state, h2.context), H = 0; H < h2._sb.length; H++) h2.__h.push(h2._sb[H]);
      h2._sb = [];
    } else do {
      h2.__d = false, P2 && P2(t2), a2 = h2.render(h2.props, h2.state, h2.context), h2.state = h2.__s;
    } while (h2.__d && ++A2 < 25);
    h2.state = h2.__s, null != h2.getChildContext && (i2 = w$1(w$1({}, i2), h2.getChildContext())), S2 && !p2 && null != h2.getSnapshotBeforeUpdate && (_2 = h2.getSnapshotBeforeUpdate(v2, y2)), f2 = I(n2, d$1(L2 = null != a2 && a2.type === k$1 && null == a2.key ? a2.props.children : a2) ? L2 : [L2], t2, u2, i2, r2, o2, e2, f2, c2, s2), h2.base = t2.__e, t2.__u &= -161, h2.__h.length && e2.push(h2), m2 && (h2.__E = h2.__ = null);
  } catch (n3) {
    if (t2.__v = null, c2 || null != o2) if (n3.then) {
      for (t2.__u |= c2 ? 160 : 128; f2 && 8 == f2.nodeType && f2.nextSibling; ) f2 = f2.nextSibling;
      o2[o2.indexOf(f2)] = null, t2.__e = f2;
    } else for (T2 = o2.length; T2--; ) g(o2[T2]);
    else t2.__e = u2.__e, t2.__k = u2.__k;
    l$1.__e(n3, t2, u2);
  }
  else null == o2 && t2.__v == u2.__v ? (t2.__k = u2.__k, t2.__e = u2.__e) : f2 = t2.__e = N(u2.__e, t2, u2, i2, r2, o2, e2, c2, s2);
  return (a2 = l$1.diffed) && a2(t2), 128 & t2.__u ? void 0 : f2;
}
function z$1(n2, t2, u2) {
  for (var i2 = 0; i2 < u2.length; i2++) V(u2[i2], u2[++i2], u2[++i2]);
  l$1.__c && l$1.__c(t2, n2), n2.some(function(t3) {
    try {
      n2 = t3.__h, t3.__h = [], n2.some(function(n3) {
        n3.call(t3);
      });
    } catch (n3) {
      l$1.__e(n3, t3.__v);
    }
  });
}
function N(t2, u2, i2, r2, o2, e2, f2, c2, s2) {
  var a2, h2, v2, y2, w2, _2, m2, b = i2.props, k2 = u2.props, x2 = u2.type;
  if ("svg" == x2 ? o2 = "http://www.w3.org/2000/svg" : "math" == x2 ? o2 = "http://www.w3.org/1998/Math/MathML" : o2 || (o2 = "http://www.w3.org/1999/xhtml"), null != e2) {
    for (a2 = 0; a2 < e2.length; a2++) if ((w2 = e2[a2]) && "setAttribute" in w2 == !!x2 && (x2 ? w2.localName == x2 : 3 == w2.nodeType)) {
      t2 = w2, e2[a2] = null;
      break;
    }
  }
  if (null == t2) {
    if (null == x2) return document.createTextNode(k2);
    t2 = document.createElementNS(o2, x2, k2.is && k2), c2 && (l$1.__m && l$1.__m(u2, e2), c2 = false), e2 = null;
  }
  if (null === x2) b === k2 || c2 && t2.data === k2 || (t2.data = k2);
  else {
    if (e2 = e2 && n$1.call(t2.childNodes), b = i2.props || p$1, !c2 && null != e2) for (b = {}, a2 = 0; a2 < t2.attributes.length; a2++) b[(w2 = t2.attributes[a2]).name] = w2.value;
    for (a2 in b) if (w2 = b[a2], "children" == a2) ;
    else if ("dangerouslySetInnerHTML" == a2) v2 = w2;
    else if (!(a2 in k2)) {
      if ("value" == a2 && "defaultValue" in k2 || "checked" == a2 && "defaultChecked" in k2) continue;
      F(t2, a2, null, w2, o2);
    }
    for (a2 in k2) w2 = k2[a2], "children" == a2 ? y2 = w2 : "dangerouslySetInnerHTML" == a2 ? h2 = w2 : "value" == a2 ? _2 = w2 : "checked" == a2 ? m2 = w2 : c2 && "function" != typeof w2 || b[a2] === w2 || F(t2, a2, w2, b[a2], o2);
    if (h2) c2 || v2 && (h2.__html === v2.__html || h2.__html === t2.innerHTML) || (t2.innerHTML = h2.__html), u2.__k = [];
    else if (v2 && (t2.innerHTML = ""), I("template" === u2.type ? t2.content : t2, d$1(y2) ? y2 : [y2], u2, i2, r2, "foreignObject" == x2 ? "http://www.w3.org/1999/xhtml" : o2, e2, f2, e2 ? e2[0] : i2.__k && S(i2, 0), c2, s2), null != e2) for (a2 = e2.length; a2--; ) g(e2[a2]);
    c2 || (a2 = "value", "progress" == x2 && null == _2 ? t2.removeAttribute("value") : void 0 !== _2 && (_2 !== t2[a2] || "progress" == x2 && !_2 || "option" == x2 && _2 !== b[a2]) && F(t2, a2, _2, b[a2], o2), a2 = "checked", void 0 !== m2 && m2 !== t2[a2] && F(t2, a2, m2, b[a2], o2));
  }
  return t2;
}
function V(n2, t2, u2) {
  try {
    if ("function" == typeof n2) {
      var i2 = "function" == typeof n2.__u;
      i2 && n2.__u(), i2 && null == t2 || (n2.__u = n2(t2));
    } else n2.current = t2;
  } catch (n3) {
    l$1.__e(n3, u2);
  }
}
function q$1(n2, t2, u2) {
  var i2, r2;
  if (l$1.unmount && l$1.unmount(n2), (i2 = n2.ref) && (i2.current && i2.current !== n2.__e || V(i2, null, t2)), null != (i2 = n2.__c)) {
    if (i2.componentWillUnmount) try {
      i2.componentWillUnmount();
    } catch (n3) {
      l$1.__e(n3, t2);
    }
    i2.base = i2.__P = null;
  }
  if (i2 = n2.__k) for (r2 = 0; r2 < i2.length; r2++) i2[r2] && q$1(i2[r2], t2, u2 || "function" != typeof n2.type);
  u2 || g(n2.__e), n2.__c = n2.__ = n2.__e = void 0;
}
function B$1(n2, l2, t2) {
  return this.constructor(n2, t2);
}
function D$1(t2, u2, i2) {
  var r2, o2, e2, f2;
  u2 == document && (u2 = document.documentElement), l$1.__ && l$1.__(t2, u2), o2 = (r2 = false) ? null : u2.__k, e2 = [], f2 = [], j$1(u2, t2 = u2.__k = _$1(k$1, null, [t2]), o2 || p$1, p$1, u2.namespaceURI, o2 ? null : u2.firstChild ? n$1.call(u2.childNodes) : null, e2, o2 ? o2.__e : u2.firstChild, r2, f2), z$1(e2, t2, f2);
}
n$1 = v$1.slice, l$1 = { __e: function(n2, l2, t2, u2) {
  for (var i2, r2, o2; l2 = l2.__; ) if ((i2 = l2.__c) && !i2.__) try {
    if ((r2 = i2.constructor) && null != r2.getDerivedStateFromError && (i2.setState(r2.getDerivedStateFromError(n2)), o2 = i2.__d), null != i2.componentDidCatch && (i2.componentDidCatch(n2, u2 || {}), o2 = i2.__d), o2) return i2.__E = i2;
  } catch (l3) {
    n2 = l3;
  }
  throw n2;
} }, t$2 = 0, x.prototype.setState = function(n2, l2) {
  var t2;
  t2 = null != this.__s && this.__s !== this.state ? this.__s : this.__s = w$1({}, this.state), "function" == typeof n2 && (n2 = n2(w$1({}, t2), this.props)), n2 && w$1(t2, n2), null != n2 && this.__v && (l2 && this._sb.push(l2), M(this));
}, x.prototype.forceUpdate = function(n2) {
  this.__v && (this.__e = true, n2 && this.__h.push(n2), M(this));
}, x.prototype.render = k$1, i$1 = [], o$1 = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e$2 = function(n2, l2) {
  return n2.__v.__b - l2.__v.__b;
}, $.__r = 0, f$1 = /(PointerCapture)$|Capture$/i, c$1 = 0, s$1 = O(false), a$1 = O(true);
var n = function(t2, s2, r2, e2) {
  var u2;
  s2[0] = 0;
  for (var h2 = 1; h2 < s2.length; h2++) {
    var p2 = s2[h2++], a2 = s2[h2] ? (s2[0] |= p2 ? 1 : 2, r2[s2[h2++]]) : s2[++h2];
    3 === p2 ? e2[0] = a2 : 4 === p2 ? e2[1] = Object.assign(e2[1] || {}, a2) : 5 === p2 ? (e2[1] = e2[1] || {})[s2[++h2]] = a2 : 6 === p2 ? e2[1][s2[++h2]] += a2 + "" : p2 ? (u2 = t2.apply(a2, n(t2, a2, r2, ["", null])), e2.push(u2), a2[0] ? s2[0] |= 2 : (s2[h2 - 2] = 0, s2[h2] = u2)) : e2.push(a2);
  }
  return e2;
}, t$1 = /* @__PURE__ */ new Map();
function e$1(s2) {
  var r2 = t$1.get(this);
  return r2 || (r2 = /* @__PURE__ */ new Map(), t$1.set(this, r2)), (r2 = n(this, r2.get(s2) || (r2.set(s2, r2 = function(n2) {
    for (var t2, s3, r3 = 1, e2 = "", u2 = "", h2 = [0], p2 = function(n3) {
      1 === r3 && (n3 || (e2 = e2.replace(/^\s*\n\s*|\s*\n\s*$/g, ""))) ? h2.push(0, n3, e2) : 3 === r3 && (n3 || e2) ? (h2.push(3, n3, e2), r3 = 2) : 2 === r3 && "..." === e2 && n3 ? h2.push(4, n3, 0) : 2 === r3 && e2 && !n3 ? h2.push(5, 0, true, e2) : r3 >= 5 && ((e2 || !n3 && 5 === r3) && (h2.push(r3, 0, e2, s3), r3 = 6), n3 && (h2.push(r3, n3, 0, s3), r3 = 6)), e2 = "";
    }, a2 = 0; a2 < n2.length; a2++) {
      a2 && (1 === r3 && p2(), p2(a2));
      for (var l2 = 0; l2 < n2[a2].length; l2++) t2 = n2[a2][l2], 1 === r3 ? "<" === t2 ? (p2(), h2 = [h2], r3 = 3) : e2 += t2 : 4 === r3 ? "--" === e2 && ">" === t2 ? (r3 = 1, e2 = "") : e2 = t2 + e2[0] : u2 ? t2 === u2 ? u2 = "" : e2 += t2 : '"' === t2 || "'" === t2 ? u2 = t2 : ">" === t2 ? (p2(), r3 = 1) : r3 && ("=" === t2 ? (r3 = 5, s3 = e2, e2 = "") : "/" === t2 && (r3 < 5 || ">" === n2[a2][l2 + 1]) ? (p2(), 3 === r3 && (h2 = h2[0]), r3 = h2, (h2 = h2[0]).push(2, 0, r3), r3 = 0) : " " === t2 || "	" === t2 || "\n" === t2 || "\r" === t2 ? (p2(), r3 = 2) : e2 += t2), 3 === r3 && "!--" === e2 && (r3 = 4, h2 = h2[0]);
    }
    return p2(), h2;
  }(s2)), r2), arguments, [])).length > 1 ? r2 : r2[0];
}
var m$1 = e$1.bind(_$1);
var t, r$1, u, i, o = 0, f = [], c = l$1, e = c.__b, a = c.__r, v = c.diffed, l = c.__c, m = c.unmount, s = c.__;
function p(n2, t2) {
  c.__h && c.__h(r$1, n2, o || t2), o = 0;
  var u2 = r$1.__H || (r$1.__H = { __: [], __h: [] });
  return n2 >= u2.__.length && u2.__.push({}), u2.__[n2];
}
function d(n2) {
  return o = 1, h(D, n2);
}
function h(n2, u2, i2) {
  var o2 = p(t++, 2);
  if (o2.t = n2, !o2.__c && (o2.__ = [D(void 0, u2), function(n3) {
    var t2 = o2.__N ? o2.__N[0] : o2.__[0], r2 = o2.t(t2, n3);
    t2 !== r2 && (o2.__N = [r2, o2.__[1]], o2.__c.setState({}));
  }], o2.__c = r$1, !r$1.__f)) {
    var f2 = function(n3, t2, r2) {
      if (!o2.__c.__H) return true;
      var u3 = o2.__c.__H.__.filter(function(n4) {
        return !!n4.__c;
      });
      if (u3.every(function(n4) {
        return !n4.__N;
      })) return !c2 || c2.call(this, n3, t2, r2);
      var i3 = o2.__c.props !== n3;
      return u3.forEach(function(n4) {
        if (n4.__N) {
          var t3 = n4.__[0];
          n4.__ = n4.__N, n4.__N = void 0, t3 !== n4.__[0] && (i3 = true);
        }
      }), c2 && c2.call(this, n3, t2, r2) || i3;
    };
    r$1.__f = true;
    var c2 = r$1.shouldComponentUpdate, e2 = r$1.componentWillUpdate;
    r$1.componentWillUpdate = function(n3, t2, r2) {
      if (this.__e) {
        var u3 = c2;
        c2 = void 0, f2(n3, t2, r2), c2 = u3;
      }
      e2 && e2.call(this, n3, t2, r2);
    }, r$1.shouldComponentUpdate = f2;
  }
  return o2.__N || o2.__;
}
function y(n2, u2) {
  var i2 = p(t++, 3);
  !c.__s && C(i2.__H, u2) && (i2.__ = n2, i2.u = u2, r$1.__H.__h.push(i2));
}
function _(n2, u2) {
  var i2 = p(t++, 4);
  !c.__s && C(i2.__H, u2) && (i2.__ = n2, i2.u = u2, r$1.__h.push(i2));
}
function A(n2) {
  return o = 5, T(function() {
    return { current: n2 };
  }, []);
}
function T(n2, r2) {
  var u2 = p(t++, 7);
  return C(u2.__H, r2) && (u2.__ = n2(), u2.__H = r2, u2.__h = n2), u2.__;
}
function q(n2, t2) {
  return o = 8, T(function() {
    return n2;
  }, t2);
}
function j() {
  for (var n2; n2 = f.shift(); ) if (n2.__P && n2.__H) try {
    n2.__H.__h.forEach(z), n2.__H.__h.forEach(B), n2.__H.__h = [];
  } catch (t2) {
    n2.__H.__h = [], c.__e(t2, n2.__v);
  }
}
c.__b = function(n2) {
  r$1 = null, e && e(n2);
}, c.__ = function(n2, t2) {
  n2 && t2.__k && t2.__k.__m && (n2.__m = t2.__k.__m), s && s(n2, t2);
}, c.__r = function(n2) {
  a && a(n2), t = 0;
  var i2 = (r$1 = n2.__c).__H;
  i2 && (u === r$1 ? (i2.__h = [], r$1.__h = [], i2.__.forEach(function(n3) {
    n3.__N && (n3.__ = n3.__N), n3.u = n3.__N = void 0;
  })) : (i2.__h.forEach(z), i2.__h.forEach(B), i2.__h = [], t = 0)), u = r$1;
}, c.diffed = function(n2) {
  v && v(n2);
  var t2 = n2.__c;
  t2 && t2.__H && (t2.__H.__h.length && (1 !== f.push(t2) && i === c.requestAnimationFrame || ((i = c.requestAnimationFrame) || w)(j)), t2.__H.__.forEach(function(n3) {
    n3.u && (n3.__H = n3.u), n3.u = void 0;
  })), u = r$1 = null;
}, c.__c = function(n2, t2) {
  t2.some(function(n3) {
    try {
      n3.__h.forEach(z), n3.__h = n3.__h.filter(function(n4) {
        return !n4.__ || B(n4);
      });
    } catch (r2) {
      t2.some(function(n4) {
        n4.__h && (n4.__h = []);
      }), t2 = [], c.__e(r2, n3.__v);
    }
  }), l && l(n2, t2);
}, c.unmount = function(n2) {
  m && m(n2);
  var t2, r2 = n2.__c;
  r2 && r2.__H && (r2.__H.__.forEach(function(n3) {
    try {
      z(n3);
    } catch (n4) {
      t2 = n4;
    }
  }), r2.__H = void 0, t2 && c.__e(t2, r2.__v));
};
var k = "function" == typeof requestAnimationFrame;
function w(n2) {
  var t2, r2 = function() {
    clearTimeout(u2), k && cancelAnimationFrame(t2), setTimeout(n2);
  }, u2 = setTimeout(r2, 100);
  k && (t2 = requestAnimationFrame(r2));
}
function z(n2) {
  var t2 = r$1, u2 = n2.__c;
  "function" == typeof u2 && (n2.__c = void 0, u2()), r$1 = t2;
}
function B(n2) {
  var t2 = r$1;
  n2.__c = n2.__(), r$1 = t2;
}
function C(n2, t2) {
  return !n2 || n2.length !== t2.length || t2.some(function(t3, r2) {
    return t3 !== n2[r2];
  });
}
function D(n2, t2) {
  return "function" == typeof t2 ? t2(n2) : t2;
}
function r(e2) {
  var t2, f2, n2 = "";
  if ("string" == typeof e2 || "number" == typeof e2) n2 += e2;
  else if ("object" == typeof e2) if (Array.isArray(e2)) {
    var o2 = e2.length;
    for (t2 = 0; t2 < o2; t2++) e2[t2] && (f2 = r(e2[t2])) && (n2 && (n2 += " "), n2 += f2);
  } else for (f2 in e2) e2[f2] && (n2 && (n2 += " "), n2 += f2);
  return n2;
}
function clsx() {
  for (var e2, t2, f2 = 0, n2 = "", o2 = arguments.length; f2 < o2; f2++) (e2 = arguments[f2]) && (t2 = r(e2)) && (n2 && (n2 += " "), n2 += t2);
  return n2;
}
function PopupMenuHeader(props) {
  const {
    headerEntries,
    onSelect,
    selectedEntry,
    setSelectedEntry,
    title
  } = props;
  const groups = T(() => groupEntries$1(headerEntries), [headerEntries]);
  return m$1`
    <div class="djs-popup-header">
      <h3 class="djs-popup-title" title=${title}>${title}</h3>
      ${groups.map((group) => m$1`
        <ul key=${group.id} class="djs-popup-header-group" data-header-group=${group.id}>

          ${group.entries.map((entry) => m$1`
            <li key=${entry.id}>
              <${entry.action ? "button" : "span"}
                class=${getHeaderClasses(entry, entry === selectedEntry)}
                onClick=${(event2) => entry.action && onSelect(event2, entry)}
                title=${entry.title || entry.label}
                data-id=${entry.id}
                onMouseEnter=${() => entry.action && setSelectedEntry(entry)}
                onMouseLeave=${() => entry.action && setSelectedEntry(null)}
                onFocus=${() => entry.action && setSelectedEntry(entry)}
                onBlur=${() => entry.action && setSelectedEntry(null)}
              >
                ${entry.imageUrl && m$1`<img class="djs-popup-entry-icon" src=${entry.imageUrl} alt="" />` || entry.imageHtml && m$1`<div class="djs-popup-entry-icon" dangerouslySetInnerHTML=${{ __html: entry.imageHtml }} />`}
                ${entry.label ? m$1`
                  <span class="djs-popup-label">${entry.label}</span>
                ` : null}
              </${entry.action ? "button" : "span"}>
            </li>
          `)}
        </ul>
      `)}
    </div>
  `;
}
function groupEntries$1(entries) {
  return entries.reduce((groups, entry) => {
    const groupId = entry.group || "default";
    const group = groups.find((group2) => group2.id === groupId);
    if (group) {
      group.entries.push(entry);
    } else {
      groups.push({
        id: groupId,
        entries: [entry]
      });
    }
    return groups;
  }, []);
}
function getHeaderClasses(entry, selected) {
  return clsx(
    "entry",
    entry.className,
    entry.active ? "active" : "",
    entry.disabled ? "disabled" : "",
    selected ? "selected" : ""
  );
}
function PopupMenuItem(props) {
  const {
    entry,
    selected,
    onMouseEnter,
    onMouseLeave,
    onAction
  } = props;
  return m$1`
    <li
      class=${clsx("entry", { selected })}
      data-id=${entry.id}
      title=${entry.title || entry.label}
      tabIndex="0"
      onClick=${onAction}
      onFocus=${onMouseEnter}
      onBlur=${onMouseLeave}
      onMouseEnter=${onMouseEnter}
      onMouseLeave=${onMouseLeave}
      onDragStart=${(event2) => onAction(event2, entry, "dragstart")}
      draggable=${true}
    >
      <div class="djs-popup-entry-content">
        <span
          class=${clsx("djs-popup-entry-name", entry.className)}
        >
          ${entry.imageUrl && m$1`<img class="djs-popup-entry-icon" src=${entry.imageUrl} alt="" />` || entry.imageHtml && m$1`<div class="djs-popup-entry-icon" dangerouslySetInnerHTML=${{ __html: entry.imageHtml }} />`}

          ${entry.label ? m$1`
            <span class="djs-popup-label">
              ${entry.label}
            </span>
          ` : null}
        </span>
        ${entry.description && m$1`
          <span
            class="djs-popup-entry-description"
            title=${entry.description}
          >
            ${entry.description}
          </span>
        `}
      </div>
      ${entry.documentationRef && m$1`
        <div class="djs-popup-entry-docs">
          <a
            href="${entry.documentationRef}"
            onClick=${(event2) => event2.stopPropagation()}
            title="Open element documentation"
            target="_blank"
            rel="noopener"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M10.6368 10.6375V5.91761H11.9995V10.6382C11.9995 10.9973 11.8623 11.3141 11.5878 11.5885C11.3134 11.863 10.9966 12.0002 10.6375 12.0002H1.36266C0.982345 12.0002 0.660159 11.8681 0.396102 11.6041C0.132044 11.34 1.52588e-05 11.0178 1.52588e-05 10.6375V1.36267C1.52588e-05 0.98236 0.132044 0.660173 0.396102 0.396116C0.660159 0.132058 0.982345 2.95639e-05 1.36266 2.95639e-05H5.91624V1.36267H1.36266V10.6375H10.6368ZM12 0H7.2794L7.27873 1.36197H9.68701L3.06507 7.98391L4.01541 8.93425L10.6373 2.31231V4.72059H12V0Z" fill="#818798"/>
            </svg>
          </a>
        </div>
      `}
    </li>
  `;
}
function PopupMenuList(props) {
  const {
    selectedEntry,
    setSelectedEntry,
    entries,
    ...restProps
  } = props;
  const resultsRef = A();
  const groups = T(() => groupEntries(entries), [entries]);
  _(() => {
    const containerEl = resultsRef.current;
    if (!containerEl)
      return;
    const selectedEl = containerEl.querySelector(".selected");
    if (selectedEl) {
      scrollIntoView(selectedEl);
    }
  }, [selectedEntry]);
  return m$1`
    <div class="djs-popup-results" ref=${resultsRef}>
      ${groups.map((group) => m$1`
        ${group.name && m$1`
          <div key=${group.id} class="entry-header" title=${group.name}>
            ${group.name}
          </div>
        `}
        <ul class="djs-popup-group" data-group=${group.id}>
          ${group.entries.map((entry) => m$1`
            <${PopupMenuItem}
              key=${entry.id}
              entry=${entry}
              selected=${entry === selectedEntry}
              onMouseEnter=${() => setSelectedEntry(entry)}
              onMouseLeave=${() => setSelectedEntry(null)}
              ...${restProps}
            />
          `)}
        </ul>
      `)}
    </div>
  `;
}
function groupEntries(entries) {
  const groups = [];
  const getGroup = (group) => groups.find((elem) => group.id === elem.id);
  const containsGroup = (group) => !!getGroup(group);
  const formatGroup = (group) => typeof group === "string" ? { id: group } : group;
  entries.forEach((entry) => {
    const group = entry.group ? formatGroup(entry.group) : { id: "default" };
    if (!containsGroup(group)) {
      groups.push({ ...group, entries: [entry] });
    } else {
      getGroup(group).entries.push(entry);
    }
  });
  return groups;
}
function scrollIntoView(el) {
  if (typeof el.scrollIntoViewIfNeeded === "function") {
    el.scrollIntoViewIfNeeded();
  } else {
    el.scrollIntoView({
      scrollMode: "if-needed",
      block: "nearest"
    });
  }
}
function PopupMenuComponent(props) {
  const {
    onClose,
    onSelect,
    className,
    headerEntries,
    position,
    title,
    width,
    scale,
    search: search2,
    emptyPlaceholder,
    searchFn,
    entries: originalEntries,
    onOpened,
    onClosed
  } = props;
  const searchable = T(() => {
    if (!isDefined(search2)) {
      return false;
    }
    return originalEntries.length > 5;
  }, [search2, originalEntries]);
  const [value, setValue] = d("");
  const filterEntries = q((originalEntries2, value2) => {
    if (!searchable) {
      return originalEntries2;
    }
    if (!value2.trim()) {
      return originalEntries2.filter(({ rank = 0 }) => rank >= 0);
    }
    const searchableEntries = originalEntries2.filter(({ searchable: searchable2 }) => searchable2 !== false);
    return searchFn(searchableEntries, value2, {
      keys: [
        "label",
        "description",
        "search"
      ]
    }).map(({ item }) => item);
  }, [searchable]);
  const [entries, setEntries] = d(filterEntries(originalEntries, value));
  const [selectedEntry, setSelectedEntry] = d(entries[0]);
  const updateEntries = q((newEntries) => {
    if (!selectedEntry || !newEntries.includes(selectedEntry)) {
      setSelectedEntry(newEntries[0]);
    }
    setEntries(newEntries);
  }, [selectedEntry, setEntries, setSelectedEntry]);
  y(() => {
    updateEntries(filterEntries(originalEntries, value));
  }, [value, originalEntries]);
  const keyboardSelect = q((direction) => {
    const idx = entries.indexOf(selectedEntry);
    let nextIdx = idx + direction;
    if (nextIdx < 0) {
      nextIdx = entries.length - 1;
    }
    if (nextIdx >= entries.length) {
      nextIdx = 0;
    }
    setSelectedEntry(entries[nextIdx]);
  }, [entries, selectedEntry, setSelectedEntry]);
  const handleKeyDown = q((event2) => {
    if (event2.key === "Enter" && selectedEntry) {
      return onSelect(event2, selectedEntry);
    }
    if (event2.key === "ArrowUp") {
      keyboardSelect(-1);
      return event2.preventDefault();
    }
    if (event2.key === "ArrowDown") {
      keyboardSelect(1);
      return event2.preventDefault();
    }
  }, [onSelect, selectedEntry, keyboardSelect]);
  const handleKey = q((event2) => {
    if (matches(event2.target, "input")) {
      setValue(() => event2.target.value);
    }
  }, [setValue]);
  y(() => {
    onOpened();
    return () => {
      onClosed();
    };
  }, []);
  const displayHeader = T(() => title || headerEntries.length > 0, [title, headerEntries]);
  return m$1`
    <${PopupMenuWrapper}
      onClose=${onClose}
      onKeyup=${handleKey}
      onKeydown=${handleKeyDown}
      className=${className}
      position=${position}
      width=${width}
      scale=${scale}
    >
      ${displayHeader && m$1`
        <${PopupMenuHeader}
          headerEntries=${headerEntries}
          onSelect=${onSelect}
          selectedEntry=${selectedEntry}
          setSelectedEntry=${setSelectedEntry}
          title=${title}
        />
      `}
      ${originalEntries.length > 0 && m$1`
        <div class="djs-popup-body">

          ${searchable && m$1`
          <div class="djs-popup-search">
            <svg class="djs-popup-search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M9.0325 8.5H9.625L13.3675 12.25L12.25 13.3675L8.5 9.625V9.0325L8.2975 8.8225C7.4425 9.5575 6.3325 10 5.125 10C2.4325 10 0.25 7.8175 0.25 5.125C0.25 2.4325 2.4325 0.25 5.125 0.25C7.8175 0.25 10 2.4325 10 5.125C10 6.3325 9.5575 7.4425 8.8225 8.2975L9.0325 8.5ZM1.75 5.125C1.75 6.9925 3.2575 8.5 5.125 8.5C6.9925 8.5 8.5 6.9925 8.5 5.125C8.5 3.2575 6.9925 1.75 5.125 1.75C3.2575 1.75 1.75 3.2575 1.75 5.125Z" fill="#22242A"/>
            </svg>
            <input type="text" spellcheck=${false} aria-label="${title}" />
          </div>
          `}

          <${PopupMenuList}
            entries=${entries}
            selectedEntry=${selectedEntry}
            setSelectedEntry=${setSelectedEntry}
            onAction=${onSelect}
          />
        </div>
      `}
    ${emptyPlaceholder && entries.length === 0 && m$1`
      <div class="djs-popup-no-results">${isFunction(emptyPlaceholder) ? emptyPlaceholder(value) : emptyPlaceholder}</div>
    `}
    </${PopupMenuWrapper}>
  `;
}
function PopupMenuWrapper(props) {
  const {
    onClose,
    onKeydown,
    onKeyup,
    className,
    children,
    position: positionGetter
  } = props;
  const popupRef = A();
  _(() => {
    if (typeof positionGetter !== "function") {
      return;
    }
    const popupEl = popupRef.current;
    const position = positionGetter(popupEl);
    popupEl.style.left = `${position.x}px`;
    popupEl.style.top = `${position.y}px`;
  }, [popupRef.current, positionGetter]);
  _(() => {
    const popupEl = popupRef.current;
    if (!popupEl) {
      return;
    }
    const inputEl = popupEl.querySelector("input");
    (inputEl || popupEl).focus();
  }, []);
  y(() => {
    const handleKeyDown = (event2) => {
      if (event2.key === "Escape") {
        event2.preventDefault();
        return onClose();
      }
    };
    const handleClick = (event2) => {
      const popup = closest(event2.target, ".djs-popup", true);
      if (popup) {
        return;
      }
      return onClose();
    };
    document.documentElement.addEventListener("keydown", handleKeyDown);
    document.body.addEventListener("click", handleClick);
    return () => {
      document.documentElement.removeEventListener("keydown", handleKeyDown);
      document.body.removeEventListener("click", handleClick);
    };
  }, []);
  return m$1`
    <div
      class=${clsx("djs-popup", className)}
      style=${getPopupStyle(props)}
      onKeydown=${onKeydown}
      onKeyup=${onKeyup}
      ref=${popupRef}
      tabIndex="-1"
    >
      ${children}
    </div>
  `;
}
function getPopupStyle(props) {
  return {
    transform: `scale(${props.scale})`,
    width: `${props.width}px`,
    "transform-origin": "top left"
  };
}
var DATA_REF = "data-id";
var CLOSE_EVENTS = [
  "contextPad.close",
  "canvas.viewbox.changing",
  "commandStack.changed"
];
var DEFAULT_PRIORITY$1 = 1e3;
function PopupMenu$1(config, eventBus, canvas, search2) {
  this._eventBus = eventBus;
  this._canvas = canvas;
  this._search = search2;
  this._current = null;
  var scale = isDefined(config && config.scale) ? config.scale : {
    min: 1,
    max: 1
  };
  this._config = {
    scale
  };
  eventBus.on("diagram.destroy", () => {
    this.close();
  });
  eventBus.on("element.changed", (event2) => {
    const element = this.isOpen() && this._current.target;
    if (event2.element === element) {
      this.refresh();
    }
  });
}
PopupMenu$1.$inject = [
  "config.popupMenu",
  "eventBus",
  "canvas",
  "search"
];
PopupMenu$1.prototype._render = function() {
  const {
    position: _position,
    providerId: className,
    entries,
    headerEntries,
    emptyPlaceholder,
    options
  } = this._current;
  const entriesArray = Object.entries(entries).map(
    ([key, value]) => ({ id: key, ...value })
  );
  const headerEntriesArray = Object.entries(headerEntries).map(
    ([key, value]) => ({ id: key, ...value })
  );
  const position = _position && ((container) => this._ensureVisible(container, _position));
  const scale = this._updateScale(this._current.container);
  const onClose = (result) => this.close(result);
  const onSelect = (event2, entry, action) => this.trigger(event2, entry, action);
  D$1(
    m$1`
      <${PopupMenuComponent}
        onClose=${onClose}
        onSelect=${onSelect}
        position=${position}
        className=${className}
        entries=${entriesArray}
        headerEntries=${headerEntriesArray}
        emptyPlaceholder=${emptyPlaceholder}
        scale=${scale}
        onOpened=${this._onOpened.bind(this)}
        onClosed=${this._onClosed.bind(this)}
        searchFn=${this._search}
        ...${{ ...options }}
      />
    `,
    this._current.container
  );
};
PopupMenu$1.prototype.open = function(target, providerId, position, options) {
  if (!target) {
    throw new Error("target is missing");
  }
  if (!providerId) {
    throw new Error("providers for <" + providerId + "> not found");
  }
  if (!position) {
    throw new Error("position is missing");
  }
  if (this.isOpen()) {
    this.close();
  }
  const {
    entries,
    headerEntries,
    emptyPlaceholder
  } = this._getContext(target, providerId);
  this._current = {
    position,
    providerId,
    target,
    entries,
    headerEntries,
    emptyPlaceholder,
    container: this._createContainer({ provider: providerId }),
    options
  };
  this._emit("open");
  this._bindAutoClose();
  this._render();
};
PopupMenu$1.prototype.refresh = function() {
  if (!this.isOpen()) {
    return;
  }
  const {
    target,
    providerId
  } = this._current;
  const {
    entries,
    headerEntries,
    emptyPlaceholder
  } = this._getContext(target, providerId);
  this._current = {
    ...this._current,
    entries,
    headerEntries,
    emptyPlaceholder
  };
  this._emit("refresh");
  this._render();
};
PopupMenu$1.prototype._getContext = function(target, provider) {
  const providers = this._getProviders(provider);
  if (!providers || !providers.length) {
    throw new Error("provider for <" + provider + "> not found");
  }
  const entries = this._getEntries(target, providers);
  const headerEntries = this._getHeaderEntries(target, providers);
  const emptyPlaceholder = this._getEmptyPlaceholder(providers);
  return {
    entries,
    headerEntries,
    emptyPlaceholder,
    empty: !(Object.keys(entries).length || Object.keys(headerEntries).length)
  };
};
PopupMenu$1.prototype.close = function() {
  if (!this.isOpen()) {
    return;
  }
  this._emit("close");
  this.reset();
  this._canvas.restoreFocus();
  this._current = null;
};
PopupMenu$1.prototype.reset = function() {
  const container = this._current.container;
  D$1(null, container);
  remove$2(container);
};
PopupMenu$1.prototype._emit = function(event2, payload) {
  this._eventBus.fire(`popupMenu.${event2}`, payload);
};
PopupMenu$1.prototype._onOpened = function() {
  this._emit("opened");
};
PopupMenu$1.prototype._onClosed = function() {
  this._emit("closed");
};
PopupMenu$1.prototype._createContainer = function(config) {
  var canvas = this._canvas, parent = canvas.getContainer();
  const container = domify(`<div class="djs-popup-parent djs-scrollable" data-popup=${config.provider}></div>`);
  parent.appendChild(container);
  return container;
};
PopupMenu$1.prototype._bindAutoClose = function() {
  this._eventBus.once(CLOSE_EVENTS, this.close, this);
};
PopupMenu$1.prototype._unbindAutoClose = function() {
  this._eventBus.off(CLOSE_EVENTS, this.close, this);
};
PopupMenu$1.prototype._updateScale = function() {
  var zoom2 = this._canvas.zoom();
  var scaleConfig = this._config.scale, minScale, maxScale, scale = zoom2;
  if (scaleConfig !== true) {
    if (scaleConfig === false) {
      minScale = 1;
      maxScale = 1;
    } else {
      minScale = scaleConfig.min;
      maxScale = scaleConfig.max;
    }
    if (isDefined(minScale) && zoom2 < minScale) {
      scale = minScale;
    }
    if (isDefined(maxScale) && zoom2 > maxScale) {
      scale = maxScale;
    }
  }
  return scale;
};
PopupMenu$1.prototype._ensureVisible = function(container, position) {
  var documentBounds = document.documentElement.getBoundingClientRect();
  var containerBounds = container.getBoundingClientRect();
  var overAxis = {}, left = position.x, top = position.y;
  if (position.x + containerBounds.width > documentBounds.width) {
    overAxis.x = true;
  }
  if (position.y + containerBounds.height > documentBounds.height) {
    overAxis.y = true;
  }
  if (overAxis.x && overAxis.y) {
    left = position.x - containerBounds.width;
    top = position.y - containerBounds.height;
  } else if (overAxis.x) {
    left = position.x - containerBounds.width;
    top = position.y;
  } else if (overAxis.y && position.y < containerBounds.height) {
    left = position.x;
    top = 10;
  } else if (overAxis.y) {
    left = position.x;
    top = position.y - containerBounds.height;
  }
  if (position.y < documentBounds.top) {
    top = position.y + containerBounds.height;
  }
  return {
    x: left,
    y: top
  };
};
PopupMenu$1.prototype.isEmpty = function(target, providerId) {
  if (!target) {
    throw new Error("target is missing");
  }
  if (!providerId) {
    throw new Error("provider ID is missing");
  }
  const providers = this._getProviders(providerId);
  if (!providers || !providers.length) {
    return true;
  }
  return this._getContext(target, providerId).empty;
};
PopupMenu$1.prototype.registerProvider = function(id, priority, provider) {
  if (!provider) {
    provider = priority;
    priority = DEFAULT_PRIORITY$1;
  }
  this._eventBus.on("popupMenu.getProviders." + id, priority, function(event2) {
    event2.providers.push(provider);
  });
};
PopupMenu$1.prototype._getProviders = function(id) {
  var event2 = this._eventBus.createEvent({
    type: "popupMenu.getProviders." + id,
    providers: []
  });
  this._eventBus.fire(event2);
  return event2.providers;
};
PopupMenu$1.prototype._getEntries = function(target, providers) {
  var entries = {};
  forEach(providers, function(provider) {
    if (!provider.getPopupMenuEntries) {
      forEach(provider.getEntries(target), function(entry) {
        var id = entry.id;
        if (!id) {
          throw new Error("entry ID is missing");
        }
        entries[id] = omit(entry, ["id"]);
      });
      return;
    }
    var entriesOrUpdater = provider.getPopupMenuEntries(target);
    if (isFunction(entriesOrUpdater)) {
      entries = entriesOrUpdater(entries);
    } else {
      forEach(entriesOrUpdater, function(entry, id) {
        entries[id] = entry;
      });
    }
  });
  return entries;
};
PopupMenu$1.prototype._getHeaderEntries = function(target, providers) {
  var entries = {};
  forEach(providers, function(provider) {
    if (!provider.getPopupMenuHeaderEntries) {
      if (!provider.getHeaderEntries) {
        return;
      }
      forEach(provider.getHeaderEntries(target), function(entry) {
        var id = entry.id;
        if (!id) {
          throw new Error("entry ID is missing");
        }
        entries[id] = omit(entry, ["id"]);
      });
      return;
    }
    var entriesOrUpdater = provider.getPopupMenuHeaderEntries(target);
    if (isFunction(entriesOrUpdater)) {
      entries = entriesOrUpdater(entries);
    } else {
      forEach(entriesOrUpdater, function(entry, id) {
        entries[id] = entry;
      });
    }
  });
  return entries;
};
PopupMenu$1.prototype._getEmptyPlaceholder = function(providers) {
  const provider = providers.find(
    (provider2) => isFunction(provider2.getEmptyPlaceholder)
  );
  return provider && provider.getEmptyPlaceholder();
};
PopupMenu$1.prototype.isOpen = function() {
  return !!this._current;
};
PopupMenu$1.prototype.trigger = function(event2, entry, action = "click") {
  event2.preventDefault();
  if (!entry) {
    let element = closest(event2.delegateTarget || event2.target, ".entry", true);
    let entryId = attr$1(element, DATA_REF);
    entry = { id: entryId, ...this._getEntry(entryId) };
  }
  const handler = entry.action;
  if (this._emit("trigger", { entry, event: event2 }) === false) {
    return;
  }
  if (isFunction(handler)) {
    if (action === "click") {
      return handler(event2, entry);
    }
  } else {
    if (handler[action]) {
      return handler[action](event2, entry);
    }
  }
};
PopupMenu$1.prototype._getEntry = function(entryId) {
  var entry = this._current.entries[entryId] || this._current.headerEntries[entryId];
  if (!entry) {
    throw new Error("entry not found");
  }
  return entry;
};
function search(items, pattern, options) {
  const {
    keys
  } = options;
  pattern = pattern.trim().toLowerCase();
  if (!pattern) {
    throw new Error("<pattern> must not be empty");
  }
  const words = pattern.trim().toLowerCase().split(/\s+/);
  return items.flatMap((item) => {
    const tokens = matchItem(item, words, keys);
    if (!tokens) {
      return [];
    }
    return {
      item,
      tokens
    };
  }).sort(createResultSorter(keys));
}
function matchItem(item, words, keys) {
  const {
    matchedWords,
    tokens
  } = keys.reduce((result, key) => {
    const string = item[key];
    const {
      tokens: tokens2,
      matchedWords: matchedWords2
    } = matchString(string, words);
    return {
      tokens: {
        ...result.tokens,
        [key]: tokens2
      },
      matchedWords: {
        ...result.matchedWords,
        ...matchedWords2
      }
    };
  }, {
    matchedWords: {},
    tokens: {}
  });
  if (Object.keys(matchedWords).length !== words.length) {
    return null;
  }
  return tokens;
}
function createResultSorter(keys) {
  return (resultA, resultB) => {
    for (const key of keys) {
      const tokenComparison = compareTokens(
        resultA.tokens[key],
        resultB.tokens[key]
      );
      if (tokenComparison !== 0) {
        return tokenComparison;
      }
      const stringComparison = compareStrings(
        resultA.item[key],
        resultB.item[key]
      );
      if (stringComparison !== 0) {
        return stringComparison;
      }
      continue;
    }
    return 0;
  };
}
function compareTokens(tokensA, tokensB) {
  return scoreTokens(tokensB) - scoreTokens(tokensA);
}
function scoreTokens(tokens) {
  return tokens.reduce((sum, token) => sum + scoreToken(token), 0);
}
function scoreToken(token) {
  const modifier = Math.log(token.value.length);
  if (!token.match) {
    return -0.07 * modifier;
  }
  return (token.start ? token.end ? 131.9 : 7.87 : token.wordStart ? 2.19 : 1) * modifier;
}
function compareStrings(a2 = "", b = "") {
  return a2.localeCompare(b);
}
function matchString(string, words) {
  if (!string) {
    return {
      tokens: [],
      matchedWords: {}
    };
  }
  const tokens = [];
  const matchedWords = {};
  const wordsEscaped = words.map(escapeRegexp);
  const regexpString = [
    `(?<all>${wordsEscaped.join("\\s+")})`,
    ...wordsEscaped
  ].join("|");
  const regexp = new RegExp(regexpString, "ig");
  let match;
  let lastIndex = 0;
  while (match = regexp.exec(string)) {
    const [value] = match;
    const startIndex = match.index;
    const endIndex = match.index + value.length;
    const start = startIndex === 0;
    const end = endIndex === string.length;
    const all = !!match.groups.all;
    const wordStart = start || /\s/.test(string.charAt(startIndex - 1));
    const wordEnd = end || /\s/.test(string.charAt(endIndex + 1));
    if (match.index > lastIndex) {
      tokens.push({
        value: string.slice(lastIndex, match.index),
        index: lastIndex
      });
    }
    tokens.push({
      value,
      index: match.index,
      match: true,
      wordStart,
      wordEnd,
      start,
      end,
      all
    });
    const newMatchedWords = all ? words : [value];
    for (const word of newMatchedWords) {
      matchedWords[word.toLowerCase()] = true;
    }
    lastIndex = match.index + value.length;
  }
  if (lastIndex < string.length) {
    tokens.push({
      value: string.slice(lastIndex),
      index: lastIndex
    });
  }
  return {
    tokens,
    matchedWords
  };
}
function escapeRegexp(string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
}
const Search = {
  search: ["value", search]
};
const PopupMenuModule = {
  __depends__: [Search],
  __init__: ["popupMenu"],
  popupMenu: ["type", PopupMenu$1]
};
function translate(template, replacements) {
  replacements = replacements || {};
  return template.replace(/{([^}]+)}/g, function(_2, key) {
    return replacements[key] || "{" + key + "}";
  });
}
const TranslateModule = {
  translate: ["value", translate]
};
const Ids = new IdGenerator();
function Scheduler(eventBus) {
  this._scheduled = {};
  eventBus.on("diagram.destroy", () => {
    Object.keys(this._scheduled).forEach((id) => {
      this.cancel(id);
    });
  });
}
Scheduler.$inject = ["eventBus"];
Scheduler.prototype.schedule = function(taskFn, id = Ids.next()) {
  this.cancel(id);
  const newScheduled = this._schedule(taskFn, id);
  this._scheduled[id] = newScheduled;
  return newScheduled.promise;
};
Scheduler.prototype._schedule = function(taskFn, id) {
  const deferred = defer();
  const executionId = setTimeout(() => {
    try {
      this._scheduled[id] = null;
      try {
        deferred.resolve(taskFn());
      } catch (error2) {
        deferred.reject(error2);
      }
    } catch (error2) {
      console.error("Scheduler#_schedule execution failed", error2);
    }
  });
  return {
    executionId,
    promise: deferred.promise
  };
};
Scheduler.prototype.cancel = function(id) {
  const scheduled = this._scheduled[id];
  if (scheduled) {
    this._cancel(scheduled);
    this._scheduled[id] = null;
  }
};
Scheduler.prototype._cancel = function(scheduled) {
  clearTimeout(scheduled.executionId);
};
function defer() {
  const deferred = {};
  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred;
}
const SchedulerModule = {
  scheduler: ["type", Scheduler]
};
let DomainStoryReplaceMenuProvider$1 = (_j = class {
  constructor(domainStoryReplace, domainStoryReplaceOption) {
    this.domainStoryReplace = domainStoryReplace;
    this.domainStoryReplaceOption = domainStoryReplaceOption;
  }
  getPopupMenuEntries(target) {
    return this.getEntries(target);
  }
  /**
   * Get all entries from replaceOptions for the given element and apply filters
   * on them. Get, for example, only elements, which are different from the current one.
   * @return a list of menu entry items
   */
  getEntries(element) {
    const el = element;
    let entries = [];
    if (el["type"].includes(ElementTypes.ACTOR)) {
      entries = this.domainStoryReplaceOption.actorReplaceOptions(el["type"]);
    } else if (el["type"].includes(ElementTypes.WORKOBJECT)) {
      entries = this.domainStoryReplaceOption.workObjectReplaceOptions(el["type"]);
    }
    return this.createEntries(el, entries);
  }
  /**
   * Creates an array of menu entry objects for a given element and filters the replaceOptions
   * according to a filter function.
   * @return a list of menu items
   */
  createEntries(element, replaceOptions) {
    const menuEntries = {};
    forEach(replaceOptions, (definition) => {
      menuEntries[definition.actionName] = this.createMenuEntry(
        definition,
        element
      );
    });
    return menuEntries;
  }
  /**
   * Creates and returns a single menu entry item.
   *
   * @param  definition a single replace options definition object
   * @param  element the element to replace
   * @param  action an action callback function which gets called when
   *         the menu entry is being triggered.
   *
   * @return menu entry item
   */
  createMenuEntry(definition, element, action) {
    const replaceAction = () => {
      return this.domainStoryReplace.replaceElement(element, definition.target);
    };
    action = action || replaceAction;
    return {
      label: definition.label,
      className: definition.className,
      // id: definition.actionName,
      action
    };
  }
}, _j.$inject = ["domainStoryReplace", "domainStoryReplaceOption"], _j);
const _DomainStoryReplace = class _DomainStoryReplace {
  constructor(modeling) {
    this.modeling = modeling;
  }
  /**
   * @param oldShape - element to be replaced
   * @param newShapeData - containing information about the new Element, for example height, width, type.
   */
  replaceElement(oldShape, newShapeData) {
    const newElement = this.setCenterOfElement(newShapeData, oldShape);
    const outgoingActivities = newElement.outgoing;
    const incomingActivities = newElement.incoming;
    outgoingActivities.forEach((element) => {
      element.businessObject.source = newElement.id;
    });
    incomingActivities.forEach((element) => {
      element.businessObject.target = newElement.id;
    });
    return newElement;
  }
  setCenterOfElement(newShapeData, oldShape) {
    newShapeData.x = Math.ceil(
      oldShape.x + (newShapeData.width || oldShape.width) / 2
    );
    newShapeData.y = Math.ceil(
      oldShape.y + (newShapeData.height || oldShape.height) / 2
    );
    assign(newShapeData, { name: oldShape.businessObject.name });
    return this.modeling.replaceShape(oldShape, newShapeData, {});
  }
};
_DomainStoryReplace.$inject = ["modeling"];
let DomainStoryReplace = _DomainStoryReplace;
const _DomainStoryReplaceOption = class _DomainStoryReplaceOption {
  constructor(iconDictionaryService) {
    this.iconDictionaryService = iconDictionaryService;
  }
  actorReplaceOptions(name) {
    const actors = this.iconDictionaryService.getIconsAssignedAs(ElementTypes.ACTOR);
    const replaceOption = [];
    actors.keysArray().forEach((actorType, index) => {
      if (!name.includes(actorType)) {
        const typeName = actorType;
        replaceOption[index] = {
          label: "Change to " + typeName,
          actionName: "replace-with-actor-" + typeName.toLowerCase(),
          className: this.iconDictionaryService.getCSSClassOfIcon(actorType),
          target: {
            type: `${ElementTypes.ACTOR}${actorType}`
          }
        };
      }
    });
    return replaceOption;
  }
  workObjectReplaceOptions(name) {
    const workObjects = this.iconDictionaryService.getIconsAssignedAs(
      ElementTypes.WORKOBJECT
    );
    const replaceOption = [];
    workObjects.keysArray().forEach((workObjectType, index) => {
      if (!name.includes(workObjectType)) {
        const typeName = workObjectType;
        replaceOption[index] = {
          label: "Change to " + typeName,
          actionName: "replace-with-actor-" + typeName,
          className: this.iconDictionaryService.getCSSClassOfIcon(workObjectType),
          target: {
            type: `${ElementTypes.WORKOBJECT}${workObjectType}`
          }
        };
      }
    });
    return replaceOption;
  }
};
_DomainStoryReplaceOption.$inject = ["domainStoryIconDictionaryService"];
let DomainStoryReplaceOption = _DomainStoryReplaceOption;
const DomainStoryReplaceMenuProvider = {
  __depends__: [DomainStoryModeling, IconSetImportExportService],
  __init__: ["domainStoryReplaceMenuProvider", "domainStoryReplace"],
  domainStoryReplace: ["type", DomainStoryReplace],
  domainStoryReplaceOption: ["type", DomainStoryReplaceOption],
  domainStoryReplaceMenuProvider: ["type", DomainStoryReplaceMenuProvider$1]
};
function rgbaToHex(rgba) {
  if (isValidHex(rgba)) {
    return rgba;
  }
  const [r2, g2, b, a2] = rgba.match(/\d+(\.\d+)?/g).map((it) => +it);
  const red = r2.toString(16).padStart(2, "0");
  const green = g2.toString(16).padStart(2, "0");
  const blue = b.toString(16).padStart(2, "0");
  const alpha = Math.round(a2 * 255).toString(16).padStart(2, "0");
  return `#${red}${green}${blue}${alpha}`;
}
const isValidHex = (hex) => /^#([A-Fa-f0-9]{3,4}){1,2}$/.test(hex);
const getChunksFromString = (st, chunkSize) => st.match(new RegExp(`.{${chunkSize}}`, "g")) ?? [];
const convertHexUnitTo256 = (hexStr) => parseInt(hexStr.repeat(2 / hexStr.length), 16);
const getAlphafloat = (a2) => {
  if (typeof a2 !== "undefined") {
    return Math.round((a2 / 255 + Number.EPSILON) * 100) / 100;
  }
  return 1;
};
const isHexWithAlpha = (hex) => (hex == null ? void 0 : hex.startsWith("#")) && ((hex == null ? void 0 : hex.length) === 5 || (hex == null ? void 0 : hex.length) === 9);
const hexToRGBA = (hex) => {
  if (!isValidHex(hex)) {
    throw new Error("Invalid HEX");
  }
  const chunkSize = Math.floor((hex.length - 1) / 3);
  const hexArr = getChunksFromString(hex.slice(1), chunkSize);
  const [r2, g2, b, a2] = hexArr.map(convertHexUnitTo256);
  return `rgba(${r2},${g2},${b},${getAlphafloat(a2)})`;
};
let DomainStoryContextPadProvider$1 = (_k = class {
  constructor(elementFactory, modeling, replaceMenuProvider, numberingRegistry, dirtyFlagService, iconDictionaryService, rules, connect, translate2, create2, canvas, contextPad, popupMenu, commandStack, eventBus) {
    this.elementFactory = elementFactory;
    this.modeling = modeling;
    this.numberingRegistry = numberingRegistry;
    this.dirtyFlagService = dirtyFlagService;
    this.iconDictionaryService = iconDictionaryService;
    this.rules = rules;
    this.connect = connect;
    this.translate = translate2;
    this.create = create2;
    this.canvas = canvas;
    this.contextPad = contextPad;
    this.popupMenu = popupMenu;
    this.commandStack = commandStack;
    contextPad.registerProvider(this);
    popupMenu.registerProvider("ds-replace", replaceMenuProvider);
    eventBus.on("create.end", (event2) => {
      const context = event2.context, shape = context.shape;
      if (!hasPrimaryModifier(event2) || !contextPad.isOpen(shape)) {
        return;
      }
      const entries = contextPad.getEntries(shape);
      if (entries["replace"]) {
        entries["replace"].action.click(event2, shape);
      }
    });
    document.addEventListener("pickedColor", (event2) => {
      if (this.selectedElement) {
        this.executeCommandStack(event2);
      }
    });
  }
  getContextPadEntries(element) {
    this.selectedElement = element;
    let pickedColor = this.selectedElement.businessObject.pickedColor;
    if (isHexWithAlpha(pickedColor)) {
      pickedColor = hexToRGBA(pickedColor);
    }
    document.dispatchEvent(
      new CustomEvent("defaultColor", {
        detail: {
          color: pickedColor ?? "#000000"
        }
      })
    );
    let entries = /* @__PURE__ */ new Map();
    if (element["type"].includes(ElementTypes.WORKOBJECT)) {
      entries.set(...this.addDelete([element]));
      entries.set(...this.addColorChange());
      entries.set(...this.addConnectWithActivity());
      entries.set(...this.addTextAnnotation());
      entries = new Map([...entries, ...this.addActors()]);
      entries = new Map([...entries, ...this.addWorkObjects()]);
      entries.set(...this.addChangeWorkObjectTypeMenu());
    } else if (element["type"].includes(ElementTypes.ACTOR)) {
      entries.set(...this.addDelete([element]));
      entries.set(...this.addColorChange());
      entries.set(...this.addConnectWithActivity());
      entries.set(...this.addTextAnnotation());
      entries = new Map([...entries, ...this.addWorkObjects()]);
      entries.set(...this.addChangeActorTypeMenu());
    } else if (element["type"].includes(ElementTypes.GROUP)) {
      entries.set(...this.addDeleteGroupWithoutChildren());
      entries.set(...this.addTextAnnotation());
      entries.set(...this.addColorChange());
    } else if (element["type"].includes(ElementTypes.ACTIVITY)) {
      entries.set(...this.addDelete([element]));
      entries.set(...this.addChangeDirection());
      entries.set(...this.addColorChange());
    } else if (element["type"].includes(ElementTypes.TEXTANNOTATION)) {
      entries.set(...this.addDelete([element]));
      entries.set(...this.addColorChange());
    } else if (element["type"].includes(ElementTypes.CONNECTION)) {
      entries.set(...this.addDelete([element]));
    }
    return Object.fromEntries(entries);
  }
  getMultiElementContextPadEntries(elements) {
    const entries = /* @__PURE__ */ new Map();
    entries.set(...this.addDelete(elements));
    return Object.fromEntries(entries);
  }
  executeCommandStack(event2) {
    const selectedBusinessObject = this.getSelectedBusinessObject(event2);
    this.commandStack.execute("element.colorChange", selectedBusinessObject);
    this.dirtyFlagService.makeDirty();
  }
  getSelectedBusinessObject(event2) {
    var _a2, _b2;
    const oldColor = (_a2 = this.selectedElement) == null ? void 0 : _a2.businessObject.pickedColor;
    let newColor = event2.detail.color;
    if (isHexWithAlpha(oldColor)) {
      newColor = rgbaToHex(newColor);
    }
    return {
      businessObject: (_b2 = this.selectedElement) == null ? void 0 : _b2.businessObject,
      newColor,
      element: this.selectedElement
    };
  }
  startConnect() {
    return (event2, element, autoActivate) => this.connect.start(event2, element, void 0, autoActivate);
  }
  addDelete(elements) {
    let deleteAllowed = this.rules.allowed("elements.delete", {
      elements: { element: elements }
    });
    if (isArray$1(deleteAllowed)) {
      deleteAllowed = deleteAllowed[0] === elements;
    }
    if (deleteAllowed) {
      return [
        "delete",
        {
          group: "edit",
          className: "bpmn-icon-trash",
          title: this.translate("Remove"),
          action: {
            click: (_event, element) => {
              if (isArray$1(element)) {
                const groups = element.filter(
                  (el) => el.type.includes(ElementTypes.GROUP)
                );
                const otherElements = element.filter(
                  (el) => !el.type.includes(ElementTypes.GROUP)
                );
                groups.forEach(
                  (group) => this.modeling.removeGroup(group)
                );
                this.modeling.removeElements(otherElements.slice());
              } else {
                this.modeling.removeElements([element]);
              }
              this.dirtyFlagService.makeDirty();
            }
          }
        }
      ];
    }
    throw new Error("Delete not allowed");
  }
  addDeleteGroupWithoutChildren() {
    return [
      "deleteGroup",
      {
        group: "edit",
        className: "bpmn-icon-trash",
        title: this.translate("Remove Group without Child-Elements"),
        action: {
          click: (_event, element) => {
            this.modeling.removeGroup(element);
            this.dirtyFlagService.makeDirty();
          }
        }
      }
    ];
  }
  addChangeDirection() {
    return [
      "changeDirection",
      {
        group: "edit",
        className: "icon-domain-story-changeDirection",
        title: this.translate("Change direction"),
        action: {
          // event needs to be addressed
          click: (_event, element) => {
            this.changeDirection(element);
            this.dirtyFlagService.makeDirty();
          }
        }
      }
    ];
  }
  addChangeActorTypeMenu() {
    return [
      "replace",
      {
        group: "edit",
        className: "bpmn-icon-screw-wrench",
        title: this.translate("Change type"),
        action: {
          click: (event2, element) => {
            const position = assign(this.getReplaceMenuPosition(element), {
              cursor: { x: event2.x, y: event2.y }
            });
            this.popupMenu.open(element, "ds-replace", position);
          }
        }
      }
    ];
  }
  addColorChange() {
    return [
      "colorChange",
      {
        group: "edit",
        className: "icon-domain-story-color-picker",
        title: this.translate("Change color"),
        action: {
          click: function() {
            document.dispatchEvent(new CustomEvent("openColorPicker"));
          }
        }
      }
    ];
  }
  addTextAnnotation() {
    return [
      "append.text-annotation",
      this.appendAction(
        ElementTypes.TEXTANNOTATION,
        "bpmn-icon-text-annotation",
        "textannotation",
        "connect"
      )
    ];
  }
  addConnectWithActivity() {
    return [
      "connect",
      {
        group: "connect",
        className: "bpmn-icon-connection",
        title: this.translate("Connect with activity"),
        action: {
          click: this.startConnect(),
          dragstart: this.startConnect()
        }
      }
    ];
  }
  addWorkObjects() {
    const workObjects = this.iconDictionaryService.getIconsAssignedAs(
      ElementTypes.WORKOBJECT
    );
    const entries = /* @__PURE__ */ new Map();
    workObjects.keysArray().forEach((workObjectType) => {
      const name = workObjectType;
      const icon = this.iconDictionaryService.getCSSClassOfIcon(workObjectType);
      entries.set(
        "append.workObject" + name,
        this.appendAction(
          `${ElementTypes.WORKOBJECT}${workObjectType}`,
          icon,
          name,
          "workObjects"
        )
      );
    });
    return entries;
  }
  addActors() {
    const actors = this.iconDictionaryService.getIconsAssignedAs(ElementTypes.ACTOR);
    const entries = /* @__PURE__ */ new Map();
    actors.keysArray().forEach((actorType) => {
      const name = actorType;
      const icon = this.iconDictionaryService.getCSSClassOfIcon(actorType);
      entries.set(
        "append.actor" + name,
        this.appendAction(
          `${ElementTypes.ACTOR}${actorType}`,
          icon,
          name,
          "actors"
        )
      );
    });
    return entries;
  }
  addChangeWorkObjectTypeMenu() {
    return [
      "replace",
      {
        group: "edit",
        className: "bpmn-icon-screw-wrench",
        title: this.translate("Change type"),
        action: {
          click: (event2, element) => {
            const position = assign(this.getReplaceMenuPosition(element), {
              cursor: { x: event2.x, y: event2.y }
            });
            this.popupMenu.open(element, "ds-replace", position);
          }
        }
      }
    ];
  }
  changeDirection(element) {
    const businessObject = element.businessObject;
    const source = element.source;
    let newNumber;
    if (source && source["type"].includes(ElementTypes.ACTOR)) {
      newNumber = 0;
    } else {
      newNumber = this.numberingRegistry.generateAutomaticNumber(element);
    }
    const context = {
      businessObject,
      newNumber,
      element
    };
    this.commandStack.execute("activity.directionChange", context);
  }
  getReplaceMenuPosition(element) {
    const Y_OFFSET = 5;
    const diagramContainer = this.canvas.getContainer(), pad = this.contextPad.getPad(element).html;
    const diagramRect = diagramContainer.getBoundingClientRect(), padRect = pad.getBoundingClientRect();
    const top = padRect.top - diagramRect.top;
    const left = padRect.left - diagramRect.left;
    return {
      x: left,
      y: top + padRect.height + Y_OFFSET
    };
  }
  appendAction(type, className, title, group, options) {
    if (typeof title !== "string") {
      options = title;
      title = this.translate("{type}", {
        type: type.replace(/^domainStory:/, "")
      });
    }
    const appendStart = (event2, element) => {
      const shape = this.elementFactory.createShape(
        assign({ type }, options)
      );
      const context = {
        elements: [shape],
        hints: {},
        source: element
      };
      this.create.start(event2, shape, context);
    };
    return {
      group,
      className,
      title: "Append " + title,
      action: {
        dragstart: this.startConnect(),
        click: appendStart
      }
    };
  }
}, _k.$inject = [
  "elementFactory",
  "modeling",
  "domainStoryReplaceMenuProvider",
  "domainStoryNumberingRegistry",
  "domainStoryDirtyFlagService",
  "domainStoryIconDictionaryService",
  "rules",
  "connect",
  "translate",
  "create",
  "canvas",
  "contextPad",
  "popupMenu",
  "commandStack",
  "eventBus"
], _k);
var MARKER_HIDDEN$1 = "djs-element-hidden";
var entrySelector = ".entry";
var DEFAULT_PRIORITY = 1e3;
var CONTEXT_PAD_MARGIN = 8;
var HOVER_DELAY = 300;
function ContextPad(canvas, elementRegistry, eventBus, scheduler) {
  this._canvas = canvas;
  this._elementRegistry = elementRegistry;
  this._eventBus = eventBus;
  this._scheduler = scheduler;
  this._current = null;
  this._init();
}
ContextPad.$inject = [
  "canvas",
  "elementRegistry",
  "eventBus",
  "scheduler"
];
ContextPad.prototype._init = function() {
  var self = this;
  this._eventBus.on("selection.changed", function(event2) {
    var selection = event2.newSelection;
    var target = selection.length ? selection.length === 1 ? selection[0] : selection : null;
    if (target) {
      self.open(target, true);
    } else {
      self.close();
    }
  });
  this._eventBus.on("elements.changed", function(event2) {
    var elements = event2.elements, current = self._current;
    if (!current) {
      return;
    }
    var target = current.target;
    var targets = isArray$1(target) ? target : [target];
    var targetsChanged = targets.filter(function(element) {
      return elements.includes(element);
    });
    if (targetsChanged.length) {
      self.close();
      var targetsNew = targets.filter(function(element) {
        return self._elementRegistry.get(element.id);
      });
      if (targetsNew.length) {
        self._updateAndOpen(targetsNew.length > 1 ? targetsNew : targetsNew[0]);
      }
    }
  });
  this._eventBus.on("canvas.viewbox.changed", function() {
    self._updatePosition();
  });
  this._eventBus.on("element.marker.update", function(event2) {
    if (!self.isOpen()) {
      return;
    }
    var element = event2.element;
    var current = self._current;
    var targets = isArray$1(current.target) ? current.target : [current.target];
    if (!targets.includes(element)) {
      return;
    }
    self._updateVisibility();
  });
  this._container = this._createContainer();
};
ContextPad.prototype._createContainer = function() {
  var container = domify('<div class="djs-context-pad-parent"></div>');
  this._canvas.getContainer().appendChild(container);
  return container;
};
ContextPad.prototype.registerProvider = function(priority, provider) {
  if (!provider) {
    provider = priority;
    priority = DEFAULT_PRIORITY;
  }
  this._eventBus.on("contextPad.getProviders", priority, function(event2) {
    event2.providers.push(provider);
  });
};
ContextPad.prototype.getEntries = function(target) {
  var providers = this._getProviders();
  var provideFn = isArray$1(target) ? "getMultiElementContextPadEntries" : "getContextPadEntries";
  var entries = {};
  forEach(providers, function(provider) {
    if (!isFunction(provider[provideFn])) {
      return;
    }
    var entriesOrUpdater = provider[provideFn](target);
    if (isFunction(entriesOrUpdater)) {
      entries = entriesOrUpdater(entries);
    } else {
      forEach(entriesOrUpdater, function(entry, id) {
        entries[id] = entry;
      });
    }
  });
  return entries;
};
ContextPad.prototype.trigger = function(action, event2, autoActivate) {
  var self = this;
  var entry, originalEvent, button = event2.delegateTarget || event2.target;
  if (!button) {
    return event2.preventDefault();
  }
  entry = attr$1(button, "data-action");
  originalEvent = event2.originalEvent || event2;
  if (action === "mouseover") {
    this._timeout = setTimeout(function() {
      self._mouseout = self.triggerEntry(entry, "hover", originalEvent, autoActivate);
    }, HOVER_DELAY);
    return;
  } else if (action === "mouseout") {
    clearTimeout(this._timeout);
    if (this._mouseout) {
      this._mouseout();
      this._mouseout = null;
    }
    return;
  }
  return this.triggerEntry(entry, action, originalEvent, autoActivate);
};
ContextPad.prototype.triggerEntry = function(entryId, action, event2, autoActivate) {
  if (!this.isShown()) {
    return;
  }
  var target = this._current.target, entries = this._current.entries;
  var entry = entries[entryId];
  if (!entry) {
    return;
  }
  var handler = entry.action;
  if (this._eventBus.fire("contextPad.trigger", { entry, event: event2 }) === false) {
    return;
  }
  if (isFunction(handler)) {
    if (action === "click") {
      return handler(event2, target, autoActivate);
    }
  } else {
    if (handler[action]) {
      return handler[action](event2, target, autoActivate);
    }
  }
  event2.preventDefault();
};
ContextPad.prototype.open = function(target, force) {
  if (!force && this.isOpen(target)) {
    return;
  }
  this.close();
  this._updateAndOpen(target);
};
ContextPad.prototype._getProviders = function() {
  var event2 = this._eventBus.createEvent({
    type: "contextPad.getProviders",
    providers: []
  });
  this._eventBus.fire(event2);
  return event2.providers;
};
ContextPad.prototype._updateAndOpen = function(target) {
  var entries = this.getEntries(target), html = this._createHtml(target), image;
  forEach(entries, function(entry, id) {
    var grouping = entry.group || "default", control = domify(entry.html || '<div class="entry" draggable="true"></div>'), container;
    attr$1(control, "data-action", id);
    container = query("[data-group=" + escapeCSS(grouping) + "]", html);
    if (!container) {
      container = domify('<div class="group"></div>');
      attr$1(container, "data-group", grouping);
      html.appendChild(container);
    }
    container.appendChild(control);
    if (entry.className) {
      addClasses(control, entry.className);
    }
    if (entry.title) {
      attr$1(control, "title", entry.title);
    }
    if (entry.imageUrl) {
      image = domify("<img>");
      attr$1(image, "src", entry.imageUrl);
      image.style.width = "100%";
      image.style.height = "100%";
      control.appendChild(image);
    }
  });
  classes(html).add("open");
  this._current = {
    entries,
    html,
    target
  };
  this._updatePosition();
  this._updateVisibility();
  this._eventBus.fire("contextPad.open", { current: this._current });
};
ContextPad.prototype._createHtml = function(target) {
  var self = this;
  var html = domify('<div class="djs-context-pad"></div>');
  delegate.bind(html, entrySelector, "click", function(event2) {
    self.trigger("click", event2);
  });
  delegate.bind(html, entrySelector, "dragstart", function(event2) {
    self.trigger("dragstart", event2);
  });
  delegate.bind(html, entrySelector, "mouseover", function(event2) {
    self.trigger("mouseover", event2);
  });
  delegate.bind(html, entrySelector, "mouseout", function(event2) {
    self.trigger("mouseout", event2);
  });
  event.bind(html, "mousedown", function(event2) {
    event2.stopPropagation();
  });
  this._container.appendChild(html);
  this._eventBus.fire("contextPad.create", {
    target,
    pad: html
  });
  return html;
};
ContextPad.prototype.getPad = function(target) {
  console.warn(new Error("ContextPad#getPad is deprecated and will be removed in future library versions, cf. https://github.com/bpmn-io/diagram-js/pull/888"));
  let html;
  if (this.isOpen() && targetsEqual(this._current.target, target)) {
    html = this._current.html;
  } else {
    html = this._createHtml(target);
  }
  return { html };
};
ContextPad.prototype.close = function() {
  if (!this.isOpen()) {
    return;
  }
  clearTimeout(this._timeout);
  this._container.innerHTML = "";
  this._eventBus.fire("contextPad.close", { current: this._current });
  this._current = null;
};
ContextPad.prototype.isOpen = function(target) {
  var current = this._current;
  if (!current) {
    return false;
  }
  if (!target) {
    return true;
  }
  var currentTarget = current.target;
  if (isArray$1(target) !== isArray$1(currentTarget)) {
    return false;
  }
  if (isArray$1(target)) {
    return target.length === currentTarget.length && every(target, function(element) {
      return currentTarget.includes(element);
    });
  } else {
    return currentTarget === target;
  }
};
ContextPad.prototype.isShown = function() {
  return this.isOpen() && classes(this._current.html).has("open");
};
ContextPad.prototype.show = function() {
  if (!this.isOpen()) {
    return;
  }
  classes(this._current.html).add("open");
  this._updatePosition();
  this._eventBus.fire("contextPad.show", { current: this._current });
};
ContextPad.prototype.hide = function() {
  if (!this.isOpen()) {
    return;
  }
  classes(this._current.html).remove("open");
  this._eventBus.fire("contextPad.hide", { current: this._current });
};
ContextPad.prototype._getPosition = function(target) {
  if (!isArray$1(target) && isConnection$1(target)) {
    var viewbox = this._canvas.viewbox();
    var lastWaypoint = getLastWaypoint(target);
    var x2 = lastWaypoint.x * viewbox.scale - viewbox.x * viewbox.scale, y2 = lastWaypoint.y * viewbox.scale - viewbox.y * viewbox.scale;
    return {
      left: x2 + CONTEXT_PAD_MARGIN * this._canvas.zoom(),
      top: y2
    };
  }
  var container = this._canvas.getContainer();
  var containerBounds = container.getBoundingClientRect();
  var targetBounds = this._getTargetBounds(target);
  return {
    left: targetBounds.right - containerBounds.left + CONTEXT_PAD_MARGIN * this._canvas.zoom(),
    top: targetBounds.top - containerBounds.top
  };
};
ContextPad.prototype._updatePosition = function() {
  const updateFn = () => {
    if (!this.isOpen()) {
      return;
    }
    var html = this._current.html;
    var position = this._getPosition(this._current.target);
    if ("x" in position && "y" in position) {
      html.style.left = position.x + "px";
      html.style.top = position.y + "px";
    } else {
      [
        "top",
        "right",
        "bottom",
        "left"
      ].forEach(function(key) {
        if (key in position) {
          html.style[key] = position[key] + "px";
        }
      });
    }
  };
  this._scheduler.schedule(updateFn, "ContextPad#_updatePosition");
};
ContextPad.prototype._updateVisibility = function() {
  const updateFn = () => {
    if (!this.isOpen()) {
      return;
    }
    var self = this;
    var target = this._current.target;
    var targets = isArray$1(target) ? target : [target];
    var isHidden2 = targets.some(function(target2) {
      return self._canvas.hasMarker(target2, MARKER_HIDDEN$1);
    });
    if (isHidden2) {
      self.hide();
    } else {
      self.show();
    }
  };
  this._scheduler.schedule(updateFn, "ContextPad#_updateVisibility");
};
ContextPad.prototype._getTargetBounds = function(target) {
  var self = this;
  var elements = isArray$1(target) ? target : [target];
  var elementsGfx = elements.map(function(element) {
    return self._canvas.getGraphics(element);
  });
  return elementsGfx.reduce(function(bounds, elementGfx) {
    const elementBounds = elementGfx.getBoundingClientRect();
    bounds.top = Math.min(bounds.top, elementBounds.top);
    bounds.right = Math.max(bounds.right, elementBounds.right);
    bounds.bottom = Math.max(bounds.bottom, elementBounds.bottom);
    bounds.left = Math.min(bounds.left, elementBounds.left);
    bounds.x = bounds.left;
    bounds.y = bounds.top;
    bounds.width = bounds.right - bounds.left;
    bounds.height = bounds.bottom - bounds.top;
    return bounds;
  }, {
    top: Infinity,
    right: -Infinity,
    bottom: -Infinity,
    left: Infinity
  });
};
function addClasses(element, classNames) {
  var classes$12 = classes(element);
  classNames = isArray$1(classNames) ? classNames : classNames.split(/\s+/g);
  classNames.forEach(function(cls) {
    classes$12.add(cls);
  });
}
function getLastWaypoint(connection) {
  return connection.waypoints[connection.waypoints.length - 1];
}
function targetsEqual(target, otherTarget) {
  target = isArray$1(target) ? target : [target];
  otherTarget = isArray$1(otherTarget) ? otherTarget : [otherTarget];
  return target.length === otherTarget.length && every(target, function(element) {
    return otherTarget.includes(element);
  });
}
const _DomainStoryContextPad = class _DomainStoryContextPad extends ContextPad {
  constructor(canvas, elementRegistry, eventBus, scheduler) {
    super(canvas, elementRegistry, eventBus, scheduler);
    const self = this;
    self._getTargetBounds = this.getTargetBoundsFromModel.bind(this);
  }
  /**
   * Calculate target bounds from element model coordinates instead of SVG graphics bounds.
   * This fixes positioning issues where the SVG bounding box differs from the element's
   * logical bounds (e.g., due to labels, invisible elements, or viewBox differences).
   */
  getTargetBoundsFromModel(target) {
    const self = this;
    const elements = isArray$1(target) ? target : [target];
    const viewbox = self._canvas.viewbox();
    const container = self._canvas.getContainer();
    const containerBounds = container.getBoundingClientRect();
    const bounds = elements.reduce(
      (acc, element) => {
        if (isConnection$1(element)) {
          return acc;
        }
        const shape = element;
        const x2 = (shape["x"] - viewbox.x) * viewbox.scale + containerBounds.left;
        const y2 = (shape["y"] - viewbox.y) * viewbox.scale + containerBounds.top;
        const width = shape["width"] * viewbox.scale;
        const height = shape["height"] * viewbox.scale;
        acc.top = Math.min(acc.top, y2);
        acc.left = Math.min(acc.left, x2);
        acc.right = Math.max(acc.right, x2 + width);
        acc.bottom = Math.max(acc.bottom, y2 + height);
        return acc;
      },
      {
        top: Infinity,
        left: Infinity,
        right: -Infinity,
        bottom: -Infinity
      }
    );
    return {
      top: bounds.top,
      left: bounds.left,
      right: bounds.right,
      bottom: bounds.bottom,
      x: bounds.left,
      y: bounds.top,
      width: bounds.right - bounds.left,
      height: bounds.bottom - bounds.top,
      toJSON: () => ({})
    };
  }
};
_DomainStoryContextPad.$inject = [
  "canvas",
  "elementRegistry",
  "eventBus",
  "scheduler"
];
let DomainStoryContextPad = _DomainStoryContextPad;
const DomainStoryContextPadProvider = {
  __depends__: [
    DomainStoryElementFactory,
    DomainStoryModeling,
    DomainStoryReplaceMenuProvider,
    ElementRegistryService,
    IconSetImportExportService,
    RulesModule,
    ConnectModule,
    CreateModule,
    TranslateModule,
    SchedulerModule,
    PopupMenuModule,
    CommandStack
  ],
  __init__: ["contextPad", "domainStoryContextPadProvider"],
  contextPad: ["type", DomainStoryContextPad],
  domainStoryContextPadProvider: ["type", DomainStoryContextPadProvider$1]
};
var max = Math.max, min = Math.min;
var DEFAULT_CHILD_BOX_PADDING = 20;
function resizeBounds(bounds, direction, delta2) {
  var dx = delta2.x, dy = delta2.y;
  var newBounds = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height
  };
  if (direction.indexOf("n") !== -1) {
    newBounds.y = bounds.y + dy;
    newBounds.height = bounds.height - dy;
  } else if (direction.indexOf("s") !== -1) {
    newBounds.height = bounds.height + dy;
  }
  if (direction.indexOf("e") !== -1) {
    newBounds.width = bounds.width + dx;
  } else if (direction.indexOf("w") !== -1) {
    newBounds.x = bounds.x + dx;
    newBounds.width = bounds.width - dx;
  }
  return newBounds;
}
function applyConstraints(attr2, trbl, resizeConstraints) {
  var value = trbl[attr2], minValue = resizeConstraints.min && resizeConstraints.min[attr2], maxValue = resizeConstraints.max && resizeConstraints.max[attr2];
  if (isNumber(minValue)) {
    value = (/top|left/.test(attr2) ? min : max)(value, minValue);
  }
  if (isNumber(maxValue)) {
    value = (/top|left/.test(attr2) ? max : min)(value, maxValue);
  }
  return value;
}
function ensureConstraints(currentBounds, resizeConstraints) {
  if (!resizeConstraints) {
    return currentBounds;
  }
  var currentTrbl = asTRBL(currentBounds);
  return asBounds({
    top: applyConstraints("top", currentTrbl, resizeConstraints),
    right: applyConstraints("right", currentTrbl, resizeConstraints),
    bottom: applyConstraints("bottom", currentTrbl, resizeConstraints),
    left: applyConstraints("left", currentTrbl, resizeConstraints)
  });
}
function getMinResizeBounds(direction, currentBounds, minDimensions, childrenBounds) {
  var currentBox = asTRBL(currentBounds);
  var minBox = {
    top: /n/.test(direction) ? currentBox.bottom - minDimensions.height : currentBox.top,
    left: /w/.test(direction) ? currentBox.right - minDimensions.width : currentBox.left,
    bottom: /s/.test(direction) ? currentBox.top + minDimensions.height : currentBox.bottom,
    right: /e/.test(direction) ? currentBox.left + minDimensions.width : currentBox.right
  };
  var childrenBox = childrenBounds ? asTRBL(childrenBounds) : minBox;
  var combinedBox = {
    top: min(minBox.top, childrenBox.top),
    left: min(minBox.left, childrenBox.left),
    bottom: max(minBox.bottom, childrenBox.bottom),
    right: max(minBox.right, childrenBox.right)
  };
  return asBounds(combinedBox);
}
function asPadding(mayBePadding, defaultValue) {
  if (typeof mayBePadding !== "undefined") {
    return mayBePadding;
  } else {
    return DEFAULT_CHILD_BOX_PADDING;
  }
}
function addPadding(bbox, padding) {
  var left, right, top, bottom;
  if (typeof padding === "object") {
    left = asPadding(padding.left);
    right = asPadding(padding.right);
    top = asPadding(padding.top);
    bottom = asPadding(padding.bottom);
  } else {
    left = right = top = bottom = asPadding(padding);
  }
  return {
    x: bbox.x - left,
    y: bbox.y - top,
    width: bbox.width + left + right,
    height: bbox.height + top + bottom
  };
}
function isBBoxChild(element) {
  if (element.waypoints) {
    return false;
  }
  if (element.type === "label") {
    return false;
  }
  return true;
}
function computeChildrenBBox(shapeOrChildren, padding) {
  var elements;
  if (shapeOrChildren.length === void 0) {
    elements = filter(shapeOrChildren.children, isBBoxChild);
  } else {
    elements = shapeOrChildren;
  }
  if (elements.length) {
    return addPadding(getBBox(elements), padding);
  }
}
var DEFAULT_MIN_WIDTH = 10;
function Resize(eventBus, rules, modeling, dragging) {
  this._dragging = dragging;
  this._rules = rules;
  var self = this;
  function handleMove(context, delta2) {
    var shape = context.shape, direction = context.direction, resizeConstraints = context.resizeConstraints, newBounds;
    context.delta = delta2;
    newBounds = resizeBounds(shape, direction, delta2);
    context.newBounds = ensureConstraints(newBounds, resizeConstraints);
    context.canExecute = self.canResize(context);
  }
  function handleStart(context) {
    var resizeConstraints = context.resizeConstraints, minBounds = context.minBounds;
    if (resizeConstraints !== void 0) {
      return;
    }
    if (minBounds === void 0) {
      minBounds = self.computeMinResizeBox(context);
    }
    context.resizeConstraints = {
      min: asTRBL(minBounds)
    };
  }
  function handleEnd(context) {
    var shape = context.shape, canExecute = context.canExecute, newBounds = context.newBounds;
    if (canExecute) {
      newBounds = roundBounds(newBounds);
      if (!boundsChanged(shape, newBounds)) {
        return;
      }
      modeling.resizeShape(shape, newBounds);
    }
  }
  eventBus.on("resize.start", function(event2) {
    handleStart(event2.context);
  });
  eventBus.on("resize.move", function(event2) {
    var delta2 = {
      x: event2.dx,
      y: event2.dy
    };
    handleMove(event2.context, delta2);
  });
  eventBus.on("resize.end", function(event2) {
    handleEnd(event2.context);
  });
}
Resize.prototype.canResize = function(context) {
  var rules = this._rules;
  var ctx = pick(context, ["newBounds", "shape", "delta", "direction"]);
  return rules.allowed("shape.resize", ctx);
};
Resize.prototype.activate = function(event2, shape, contextOrDirection) {
  var dragging = this._dragging, context, direction;
  if (typeof contextOrDirection === "string") {
    contextOrDirection = {
      direction: contextOrDirection
    };
  }
  context = assign({ shape }, contextOrDirection);
  direction = context.direction;
  if (!direction) {
    throw new Error("must provide a direction (n|w|s|e|nw|se|ne|sw)");
  }
  dragging.init(event2, getReferencePoint(shape, direction), "resize", {
    autoActivate: true,
    cursor: getCursor(direction),
    data: {
      shape,
      context
    }
  });
};
Resize.prototype.computeMinResizeBox = function(context) {
  var shape = context.shape, direction = context.direction, minDimensions, childrenBounds;
  minDimensions = context.minDimensions || {
    width: DEFAULT_MIN_WIDTH,
    height: DEFAULT_MIN_WIDTH
  };
  childrenBounds = computeChildrenBBox(shape, context.childrenBoxPadding);
  return getMinResizeBounds(direction, shape, minDimensions, childrenBounds);
};
Resize.$inject = [
  "eventBus",
  "rules",
  "modeling",
  "dragging"
];
function boundsChanged(shape, newBounds) {
  return shape.x !== newBounds.x || shape.y !== newBounds.y || shape.width !== newBounds.width || shape.height !== newBounds.height;
}
function getReferencePoint(shape, direction) {
  var mid2 = getMid(shape), trbl = asTRBL(shape);
  var referencePoint = {
    x: mid2.x,
    y: mid2.y
  };
  if (direction.indexOf("n") !== -1) {
    referencePoint.y = trbl.top;
  } else if (direction.indexOf("s") !== -1) {
    referencePoint.y = trbl.bottom;
  }
  if (direction.indexOf("e") !== -1) {
    referencePoint.x = trbl.right;
  } else if (direction.indexOf("w") !== -1) {
    referencePoint.x = trbl.left;
  }
  return referencePoint;
}
function getCursor(direction) {
  var prefix = "resize-";
  if (direction === "n" || direction === "s") {
    return prefix + "ns";
  } else if (direction === "e" || direction === "w") {
    return prefix + "ew";
  } else if (direction === "nw" || direction === "se") {
    return prefix + "nwse";
  } else {
    return prefix + "nesw";
  }
}
var MARKER_RESIZING = "djs-resizing", MARKER_RESIZE_NOT_OK = "resize-not-ok";
var LOW_PRIORITY$1 = 500;
function ResizePreview(eventBus, canvas, previewSupport) {
  function updateFrame(context) {
    var shape = context.shape, bounds = context.newBounds, frame = context.frame;
    if (!frame) {
      frame = context.frame = previewSupport.addFrame(shape, canvas.getActiveLayer());
      canvas.addMarker(shape, MARKER_RESIZING);
    }
    if (bounds.width > 5) {
      attr(frame, { x: bounds.x, width: bounds.width });
    }
    if (bounds.height > 5) {
      attr(frame, { y: bounds.y, height: bounds.height });
    }
    if (context.canExecute) {
      classes$1(frame).remove(MARKER_RESIZE_NOT_OK);
    } else {
      classes$1(frame).add(MARKER_RESIZE_NOT_OK);
    }
  }
  function removeFrame(context) {
    var shape = context.shape, frame = context.frame;
    if (frame) {
      remove$1(context.frame);
    }
    canvas.removeMarker(shape, MARKER_RESIZING);
  }
  eventBus.on("resize.move", LOW_PRIORITY$1, function(event2) {
    updateFrame(event2.context);
  });
  eventBus.on("resize.cleanup", function(event2) {
    removeFrame(event2.context);
  });
}
ResizePreview.$inject = [
  "eventBus",
  "canvas",
  "previewSupport"
];
var HANDLE_OFFSET = -6, HANDLE_SIZE = 8, HANDLE_HIT_SIZE = 20;
var CLS_RESIZER = "djs-resizer";
var directions = ["n", "w", "s", "e", "nw", "ne", "se", "sw"];
function ResizeHandles(eventBus, canvas, selection, resize) {
  this._resize = resize;
  this._canvas = canvas;
  var self = this;
  eventBus.on("selection.changed", function(e2) {
    var newSelection = e2.newSelection;
    self.removeResizers();
    if (newSelection.length === 1) {
      forEach(newSelection, bind(self.addResizer, self));
    }
  });
  eventBus.on("shape.changed", function(e2) {
    var shape = e2.element;
    if (selection.isSelected(shape)) {
      self.removeResizers();
      self.addResizer(shape);
    }
  });
}
ResizeHandles.prototype.makeDraggable = function(element, gfx, direction) {
  var resize = this._resize;
  function startResize(event2) {
    if (isPrimaryButton(event2)) {
      resize.activate(event2, element, direction);
    }
  }
  event.bind(gfx, "mousedown", startResize);
  event.bind(gfx, "touchstart", startResize);
};
ResizeHandles.prototype._createResizer = function(element, x2, y2, direction) {
  var resizersParent = this._getResizersParent();
  var offset = getHandleOffset(direction);
  var group = create$1("g");
  classes$1(group).add(CLS_RESIZER);
  classes$1(group).add(CLS_RESIZER + "-" + element.id);
  classes$1(group).add(CLS_RESIZER + "-" + direction);
  append(resizersParent, group);
  var visual = create$1("rect");
  attr(visual, {
    x: -8 / 2 + offset.x,
    y: -8 / 2 + offset.y,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE
  });
  classes$1(visual).add(CLS_RESIZER + "-visual");
  append(group, visual);
  var hit = create$1("rect");
  attr(hit, {
    x: -20 / 2 + offset.x,
    y: -20 / 2 + offset.y,
    width: HANDLE_HIT_SIZE,
    height: HANDLE_HIT_SIZE
  });
  classes$1(hit).add(CLS_RESIZER + "-hit");
  append(group, hit);
  transform(group, x2, y2);
  return group;
};
ResizeHandles.prototype.createResizer = function(element, direction) {
  var point = getReferencePoint(element, direction);
  var resizer = this._createResizer(element, point.x, point.y, direction);
  this.makeDraggable(element, resizer, direction);
};
ResizeHandles.prototype.addResizer = function(element) {
  var self = this;
  if (isConnection$1(element) || !this._resize.canResize({ shape: element })) {
    return;
  }
  forEach(directions, function(direction) {
    self.createResizer(element, direction);
  });
};
ResizeHandles.prototype.removeResizers = function() {
  var resizersParent = this._getResizersParent();
  clear(resizersParent);
};
ResizeHandles.prototype._getResizersParent = function() {
  return this._canvas.getLayer("resizers");
};
ResizeHandles.$inject = [
  "eventBus",
  "canvas",
  "selection",
  "resize"
];
function getHandleOffset(direction) {
  var offset = {
    x: 0,
    y: 0
  };
  if (direction.indexOf("e") !== -1) {
    offset.x = 6;
  } else if (direction.indexOf("w") !== -1) {
    offset.x = HANDLE_OFFSET;
  }
  if (direction.indexOf("s") !== -1) {
    offset.y = 6;
  } else if (direction.indexOf("n") !== -1) {
    offset.y = HANDLE_OFFSET;
  }
  return offset;
}
const ResizeModule = {
  __depends__: [
    RulesModule,
    DraggingModule,
    PreviewSupportModule
  ],
  __init__: [
    "resize",
    "resizePreview",
    "resizeHandles"
  ],
  resize: ["type", Resize],
  resizePreview: ["type", ResizePreview],
  resizeHandles: ["type", ResizeHandles]
};
let LabelDictionaryService$1 = (_l = class {
  constructor(elementRegistryService, iconDictionaryService) {
    this.elementRegistryService = elementRegistryService;
    this.iconDictionaryService = iconDictionaryService;
    this.activityLabels = [];
    this.workObjektLabels = [];
  }
  // openLabelDictionary() {
  //     const isActivityWithLabel = (element: CanvasObject) =>
  //         element.type.includes(ElementTypes.ACTIVITY) && element.businessObject.name;
  //     const isWorkObjectWithLabel = (element: CanvasObject) =>
  //         element.type.includes(ElementTypes.WORKOBJECT) &&
  //         element.businessObject.name;
  //     const hasAtLeastOneLabel = this.elementRegistryService
  //         .getAllCanvasObjects()
  //         .some(
  //             (element) =>
  //                 isActivityWithLabel(element) || isWorkObjectWithLabel(element),
  //         );
  //     if (hasAtLeastOneLabel) {
  //         const config = new MatDialogConfig();
  //         config.disableClose = false;
  //         config.autoFocus = true;
  //         this.dialogService.openDialog(LabelDictionaryDialogComponent, config);
  //     } else {
  //         this.snackbar.open(
  //             "There are currently no activities or work objects with labels on the canvas",
  //             undefined,
  //             {
  //                 duration: SNACKBAR_DURATION_LONGER,
  //                 panelClass: SNACKBAR_INFO,
  //             },
  //         );
  //     }
  // }
  createLabelDictionaries() {
    this.activityLabels = [];
    this.workObjektLabels = [];
    const allObjects = this.elementRegistryService.getAllCanvasObjects();
    allObjects.forEach((element) => {
      const name = element.businessObject.name;
      if (name && name.length > 0 && element.type.includes(ElementTypes.ACTIVITY) && !this.activityLabels.map((a2) => a2.name).includes(name)) {
        this.activityLabels.push({
          name,
          originalName: name
        });
      } else if (name && name.length > 0 && element.type.includes(ElementTypes.WORKOBJECT) && !this.workObjektLabels.map((e2) => e2.name).includes(name)) {
        const iconName = element.type.replace(ElementTypes.WORKOBJECT, "");
        let icon = this.iconDictionaryService.getIconSource(iconName);
        if (!icon) {
          return;
        }
        if (!icon.startsWith("data")) {
          icon = "data:image/svg+xml," + icon;
        }
        this.workObjektLabels.push({
          name,
          originalName: name,
          icon
        });
      }
    });
    this.activityLabels.sort((a2, b) => {
      return a2.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
    this.workObjektLabels.sort((a2, b) => {
      return a2.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  }
  getActivityLabels() {
    return this.activityLabels.slice();
  }
  getWorkObjectLabels() {
    return this.workObjektLabels.slice();
  }
  getUniqueWorkObjectNames() {
    const workObjects = this.elementRegistryService.getAllWorkobjects();
    return [
      ...new Set(
        workObjects.filter((workObject) => {
          return !!workObject.businessObject.name;
        }).map((workObject) => workObject.businessObject.name)
      )
    ];
  }
  // massRenameLabels(
  //     activityNames: string[],
  //     originalActivityNames: string[],
  //     workObjectNames: string[],
  //     originalWorkObjectNames: string[],
  // ): void {
  //     for (let i = 0; i < originalActivityNames.length; i++) {
  //         if (!activityNames[i]) {
  //             activityNames[i] = "";
  //         }
  //         if (!(activityNames[i] == originalActivityNames[i])) {
  //             this.massNamingService.massChangeNames(
  //                 originalActivityNames[i],
  //                 activityNames[i],
  //                 ElementTypes.ACTIVITY,
  //             );
  //         }
  //     }
  //     for (let i = 0; i < originalWorkObjectNames.length; i++) {
  //         if (!workObjectNames[i]) {
  //             workObjectNames[i] = "";
  //         }
  //         if (!(workObjectNames[i] == originalWorkObjectNames[i])) {
  //             this.massNamingService.massChangeNames(
  //                 originalWorkObjectNames[i],
  //                 workObjectNames[i],
  //                 ElementTypes.WORKOBJECT,
  //             );
  //         }
  //     }
  // }
}, _l.$inject = [
  "domainStoryElementRegistryService",
  "domainStoryIconDictionaryService"
], _l);
const LabelDictionaryService = {
  __depends__: [IconSetImportExportService, ElementRegistryService],
  __init__: ["domainStoryLabelDictionaryService"],
  domainStoryLabelDictionaryService: ["type", LabelDictionaryService$1]
};
const MARKER_HIDDEN = "djs-element-hidden", MARKER_LABEL_HIDDEN = "djs-label-hidden";
const _DomainStoryLabelEditingPreview = class _DomainStoryLabelEditingPreview {
  constructor(eventBus, canvas) {
    this.defaultLayer = canvas.getDefaultLayer();
    eventBus.on("directEditing.activate", (context) => {
      const activeProvider = context.active;
      this.element = activeProvider.element.label || activeProvider.element;
      if (is(this.element, ElementTypes.TEXTANNOTATION)) {
        this.absoluteElementBBox = canvas.getAbsoluteBBox(this.element);
        this.gfx = create$1("g");
        const textPathData = getScaledPath({
          xScaleFactor: 1,
          yScaleFactor: 1,
          containerWidth: this.element.width,
          containerHeight: this.element.height,
          position: {
            mx: 0,
            my: 0
          }
        });
        const path = this.path = create$1("path");
        attr(path, {
          d: textPathData,
          strokeWidth: 2,
          stroke: "black"
        });
        append(this.gfx, path);
        append(this.defaultLayer, this.gfx);
        translate$1(this.gfx, this.element.x, this.element.y);
        if (is(this.element, ElementTypes.TEXTANNOTATION) || this.element["labelTarget"]) {
          canvas.addMarker(this.element, MARKER_HIDDEN);
        } else if (this.element["type"].includes(ElementTypes.ACTOR) || this.element["type"].includes(ElementTypes.WORKOBJECT) || this.element["type"].includes(ElementTypes.ACTIVITY) || this.element["type"].includes(ElementTypes.GROUP)) {
          canvas.addMarker(this.element, MARKER_LABEL_HIDDEN);
        }
      }
    });
    eventBus.on("directEditing.resize", (context) => {
      var _a2;
      if (is(this.element, ElementTypes.TEXTANNOTATION)) {
        const height = context.height, dy = context.dy;
        const newElementHeight = Math.max(
          this.element.height / (((_a2 = this.absoluteElementBBox) == null ? void 0 : _a2.height) ?? 1) * (height + dy),
          0
        );
        const textPathData = getScaledPath({
          xScaleFactor: 1,
          yScaleFactor: 1,
          containerWidth: this.element.width,
          containerHeight: newElementHeight,
          position: {
            mx: 0,
            my: 0
          }
        });
        attr(this.path, textPathData);
      }
    });
    eventBus.on(
      ["directEditing.complete", "directEditing.cancel"],
      (context) => {
        const activeProvider = context.active;
        if (activeProvider) {
          canvas.removeMarker(
            activeProvider.element.label || activeProvider.element,
            MARKER_HIDDEN
          );
          canvas.removeMarker(this.element, MARKER_LABEL_HIDDEN);
        }
        this.element = void 0;
        this.absoluteElementBBox = void 0;
        if (this.gfx) {
          remove$1(this.gfx);
          this.gfx = void 0;
        }
      }
    );
  }
};
_DomainStoryLabelEditingPreview.$inject = ["eventBus", "canvas"];
let DomainStoryLabelEditingPreview = _DomainStoryLabelEditingPreview;
const DomainStoryLabelEditing = {
  __depends__: [
    DomainStoryModeling,
    DomainStoryTextRenderer,
    LabelDictionaryService,
    DirectEditingModule,
    ResizeModule,
    CommandStack
  ],
  __init__: ["domainStoryLabelEditingProvider", "domainStoryLabelEditingPreview"],
  domainStoryLabelEditingProvider: ["type", DomainStoryLabelEditingProvider],
  domainStoryLabelEditingPreview: ["type", DomainStoryLabelEditingPreview]
};
const _ActivityChangedHandler = class _ActivityChangedHandler {
  constructor(modeling, elementRegistryService, eventBus, numberingRegistry) {
    this.modeling = modeling;
    this.elementRegistryService = elementRegistryService;
    this.eventBus = eventBus;
    this.numberingRegistry = numberingRegistry;
  }
  preExecute(context) {
    context.oldLabel = context.businessObject.name || " ";
    const oldNumbersWithIDs = this.numberingRegistry.getNumbersAndIDs();
    this.modeling.updateLabel(context.businessObject, context.newLabel);
    this.modeling.updateNumber(context.businessObject, context.newNumber);
    context.oldNumber = context.businessObject.number;
    context.oldNumbersWithIDs = oldNumbersWithIDs;
  }
  execute(context) {
    const businessObject = context.businessObject;
    const element = context.element;
    if (context.newLabel && context.newLabel.length < 1) {
      context.newLabel = " ";
    }
    businessObject.name = context.newLabel;
    businessObject.number = context.newNumber;
    this.eventBus.fire("element.changed", { element });
    return [element];
  }
  revert(context) {
    const semantic = context.businessObject;
    const element = context.element;
    semantic.name = context.oldLabel;
    semantic.number = context.oldNumber;
    revertAutomaticNumberGenerationChange(
      context.oldNumbersWithIDs,
      this.elementRegistryService.getActivitiesFromActors(),
      this.eventBus
    );
    this.eventBus.fire("element.changed", { element });
    return [element];
  }
};
_ActivityChangedHandler.$inject = [
  "modeling",
  "domainStoryElementRegistryService",
  "eventBus",
  "domainStoryNumberingRegistry"
];
let ActivityChangedHandler = _ActivityChangedHandler;
const _ActivityDirectionChangedHandler = class _ActivityDirectionChangedHandler {
  constructor(modeling, eventBus) {
    this.modeling = modeling;
    this.eventBus = eventBus;
  }
  preExecute(context) {
    context.oldNumber = context.businessObject.number;
    context.oldWaypoints = context.element.waypoints;
    context.name = context.businessObject.name;
    if (!context.oldNumber) {
      context.oldNumber = 0;
    }
    this.modeling.updateNumber(context.businessObject, context.newNumber);
  }
  execute(context) {
    const businessObject = context.businessObject;
    const element = context.element;
    const swapSource = element.source;
    const newWaypoints = [];
    const waypoints = element.waypoints;
    for (let i2 = waypoints.length - 1; i2 >= 0; i2--) {
      newWaypoints.push(waypoints[i2]);
    }
    element.source = element.target;
    businessObject.source = businessObject.target;
    element.target = swapSource;
    businessObject.target = swapSource == null ? void 0 : swapSource.id;
    businessObject.name = context.name;
    businessObject.number = context.newNumber;
    element.waypoints = newWaypoints;
    this.eventBus.fire("element.changed", { element });
    return [element];
  }
  revert(context) {
    const semantic = context.businessObject;
    const element = context.element;
    const swapSource = element.source;
    element.source = element.target;
    semantic.source = semantic.target;
    element.target = swapSource;
    semantic.target = swapSource == null ? void 0 : swapSource.id;
    semantic.name = context.name;
    semantic.number = context.oldNumber;
    element.waypoints = context.oldWaypoints;
    this.eventBus.fire("element.changed", { element });
    return [element];
  }
};
_ActivityDirectionChangedHandler.$inject = ["modeling", "eventBus"];
let ActivityDirectionChangedHandler = _ActivityDirectionChangedHandler;
function revertAutomaticNumberGenerationChange(iDWithNumber, activities, eventBus) {
  for (let i2 = activities.length - 1; i2 >= 0; i2--) {
    for (let j2 = iDWithNumber.length - 1; j2 >= 0; j2--) {
      if (iDWithNumber[j2].id.includes(activities[i2].businessObject.id)) {
        const element = activities[i2];
        element.businessObject.number = iDWithNumber[j2].number;
        j2 = -5;
        eventBus.fire("element.changed", { element });
        iDWithNumber.splice(j2, 1);
      }
    }
  }
}
const _ElementColorChangeHandler = class _ElementColorChangeHandler {
  constructor(eventBus) {
    this.eventBus = eventBus;
  }
  preExecute(context) {
    context.oldColor = context.businessObject.pickedColor;
  }
  execute(context) {
    const semantic = context.businessObject;
    const element = context.element;
    if (semantic.type.includes(ElementTypes.TEXTANNOTATION) && element.incoming[0]) {
      element.incoming[0].businessObject.pickedColor = context.newColor;
      this.eventBus.fire("element.changed", { element: element.incoming[0] });
    }
    semantic.pickedColor = context.newColor;
    this.eventBus.fire("element.changed", { element });
    return [
      {
        id: element.id,
        businessObject: semantic
      }
    ];
  }
  revert(context) {
    const semantic = context.businessObject;
    const element = context.element;
    if (semantic.type.includes(ElementTypes.TEXTANNOTATION) && element.incoming[0]) {
      element.incoming[0].businessObject.pickedColor = context.oldColor;
      this.eventBus.fire("element.changed", { element: element.incoming[0] });
    }
    semantic.pickedColor = context.oldColor;
    this.eventBus.fire("element.changed", { element });
    return [
      {
        id: element.id,
        businessObject: semantic
      }
    ];
  }
};
_ElementColorChangeHandler.$inject = ["eventBus"];
let ElementColorChangeHandler = _ElementColorChangeHandler;
const _RemoveGroupWithoutChildrenHandler = class _RemoveGroupWithoutChildrenHandler {
  constructor(eventBus) {
    this.eventBus = eventBus;
  }
  preExecute(context) {
    context.parent = context.element.parent;
    context.children = context.element.children.slice();
  }
  execute(context) {
    const element = context.element;
    context.children.forEach((child) => {
      undoGroupRework(element, child);
      this.eventBus.fire("element.changed", { element: child });
    });
    this.eventBus.fire("shape.remove", { element });
    return [
      {
        id: element.id,
        businessObject: element.businessObject
      }
    ];
  }
  revert(context) {
    const element = context.element;
    this.eventBus.fire("shape.added", { element });
    context.element.children.forEach((child) => {
      reworkGroupElements(element, child);
    });
    return [
      {
        id: element.id,
        businessObject: element.businessObject
      }
    ];
  }
};
_RemoveGroupWithoutChildrenHandler.$inject = ["eventBus"];
let RemoveGroupWithoutChildrenHandler = _RemoveGroupWithoutChildrenHandler;
let DomainStoryUpdateHandler$1 = (_m = class {
  constructor(commandStack) {
    commandStack.registerHandler("activity.changed", ActivityChangedHandler);
    commandStack.registerHandler(
      "activity.directionChange",
      ActivityDirectionChangedHandler
    );
    commandStack.registerHandler("element.colorChange", ElementColorChangeHandler);
    commandStack.registerHandler(
      "shape.removeGroupWithoutChildren",
      RemoveGroupWithoutChildrenHandler
    );
  }
}, _m.$inject = ["commandStack"], _m);
const DomainStoryUpdateHandler = {
  __depends__: [DomainStoryModeling, ElementRegistryService, CommandStack],
  __init__: ["domainStoryUpdateHandler"],
  domainStoryUpdateHandler: ["type", DomainStoryUpdateHandler$1]
};
function Clipboard() {
}
Clipboard.prototype.get = function() {
  return this._data;
};
Clipboard.prototype.set = function(data) {
  this._data = data;
};
Clipboard.prototype.clear = function() {
  var data = this._data;
  delete this._data;
  return data;
};
Clipboard.prototype.isEmpty = function() {
  return !this._data;
};
const ClipboardModule = {
  clipboard: ["type", Clipboard]
};
function CopyPaste(canvas, create2, clipboard, elementFactory, eventBus, modeling, mouse, rules) {
  this._canvas = canvas;
  this._create = create2;
  this._clipboard = clipboard;
  this._elementFactory = elementFactory;
  this._eventBus = eventBus;
  this._modeling = modeling;
  this._mouse = mouse;
  this._rules = rules;
  eventBus.on("copyPaste.copyElement", function(context) {
    var descriptor = context.descriptor, element = context.element, elements = context.elements;
    descriptor.priority = 1;
    descriptor.id = element.id;
    var parentCopied = find(elements, function(e2) {
      return e2 === element.parent;
    });
    if (parentCopied) {
      descriptor.parent = element.parent.id;
    }
    if (isAttacher(element)) {
      descriptor.priority = 2;
      descriptor.host = element.host.id;
    }
    if (isConnection$1(element)) {
      descriptor.priority = 3;
      descriptor.source = element.source.id;
      descriptor.target = element.target.id;
      descriptor.waypoints = copyWaypoints(element);
    }
    if (isLabel$1(element)) {
      descriptor.priority = 4;
      descriptor.labelTarget = element.labelTarget.id;
    }
    forEach(["x", "y", "width", "height"], function(property) {
      if (isNumber(element[property])) {
        descriptor[property] = element[property];
      }
    });
    descriptor.hidden = element.hidden;
    descriptor.collapsed = element.collapsed;
  });
  eventBus.on("copyPaste.pasteElements", function(context) {
    var hints = context.hints;
    assign(hints, {
      createElementsBehavior: false
    });
  });
}
CopyPaste.$inject = [
  "canvas",
  "create",
  "clipboard",
  "elementFactory",
  "eventBus",
  "modeling",
  "mouse",
  "rules"
];
CopyPaste.prototype.copy = function(elements) {
  var allowed, tree;
  if (!isArray$1(elements)) {
    elements = elements ? [elements] : [];
  }
  allowed = this._eventBus.fire("copyPaste.canCopyElements", {
    elements
  });
  if (allowed === false) {
    tree = {};
  } else {
    tree = this.createTree(isArray$1(allowed) ? allowed : elements);
  }
  this._clipboard.set(tree);
  this._eventBus.fire("copyPaste.elementsCopied", {
    elements,
    tree
  });
  return tree;
};
CopyPaste.prototype.paste = function(context) {
  var tree = this._clipboard.get();
  if (this._clipboard.isEmpty()) {
    return;
  }
  var hints = context && context.hints || {};
  this._eventBus.fire("copyPaste.pasteElements", {
    hints
  });
  var elements = this._createElements(tree);
  if (context && context.element && context.point) {
    return this._paste(elements, context.element, context.point, hints);
  }
  this._create.start(this._mouse.getLastMoveEvent(), elements, {
    hints: hints || {}
  });
};
CopyPaste.prototype._paste = function(elements, target, position, hints) {
  forEach(elements, function(element) {
    if (!isNumber(element.x)) {
      element.x = 0;
    }
    if (!isNumber(element.y)) {
      element.y = 0;
    }
  });
  var bbox = getBBox(elements);
  forEach(elements, function(element) {
    if (isConnection$1(element)) {
      element.waypoints = map(element.waypoints, function(waypoint) {
        return {
          x: waypoint.x - bbox.x - bbox.width / 2,
          y: waypoint.y - bbox.y - bbox.height / 2
        };
      });
    }
    assign(element, {
      x: element.x - bbox.x - bbox.width / 2,
      y: element.y - bbox.y - bbox.height / 2
    });
  });
  return this._modeling.createElements(elements, position, target, assign({}, hints));
};
CopyPaste.prototype._createElements = function(tree) {
  var self = this;
  var eventBus = this._eventBus;
  var cache = {};
  var elements = [];
  forEach(tree, function(branch, depth) {
    branch = sortBy(branch, "priority");
    forEach(branch, function(descriptor) {
      var attrs = assign({}, omit(descriptor, ["priority"]));
      if (cache[descriptor.parent]) {
        attrs.parent = cache[descriptor.parent];
      } else {
        delete attrs.parent;
      }
      eventBus.fire("copyPaste.pasteElement", {
        cache,
        descriptor: attrs
      });
      var element;
      if (isConnection$1(attrs)) {
        attrs.source = cache[descriptor.source];
        attrs.target = cache[descriptor.target];
        element = cache[descriptor.id] = self.createConnection(attrs);
        elements.push(element);
        return;
      }
      if (isLabel$1(attrs)) {
        attrs.labelTarget = cache[attrs.labelTarget];
        element = cache[descriptor.id] = self.createLabel(attrs);
        elements.push(element);
        return;
      }
      if (attrs.host) {
        attrs.host = cache[attrs.host];
      }
      element = cache[descriptor.id] = self.createShape(attrs);
      elements.push(element);
    });
  });
  return elements;
};
CopyPaste.prototype.createConnection = function(attrs) {
  var connection = this._elementFactory.createConnection(omit(attrs, ["id"]));
  return connection;
};
CopyPaste.prototype.createLabel = function(attrs) {
  var label = this._elementFactory.createLabel(omit(attrs, ["id"]));
  return label;
};
CopyPaste.prototype.createShape = function(attrs) {
  var shape = this._elementFactory.createShape(omit(attrs, ["id"]));
  return shape;
};
CopyPaste.prototype.hasRelations = function(element, elements) {
  var labelTarget, source, target;
  if (isConnection$1(element)) {
    source = find(elements, matchPattern({ id: element.source.id }));
    target = find(elements, matchPattern({ id: element.target.id }));
    if (!source || !target) {
      return false;
    }
  }
  if (isLabel$1(element)) {
    labelTarget = find(elements, matchPattern({ id: element.labelTarget.id }));
    if (!labelTarget) {
      return false;
    }
  }
  return true;
};
CopyPaste.prototype.createTree = function(elements) {
  var rules = this._rules, self = this;
  var tree = {}, elementsData = [];
  var parents = getParents(elements);
  function canCopy(element, elements2) {
    return rules.allowed("element.copy", {
      element,
      elements: elements2
    });
  }
  function addElementData(element, depth) {
    var foundElementData = find(elementsData, function(elementsData2) {
      return element === elementsData2.element;
    });
    if (!foundElementData) {
      elementsData.push({
        element,
        depth
      });
      return;
    }
    if (foundElementData.depth < depth) {
      elementsData = removeElementData(foundElementData, elementsData);
      elementsData.push({
        element: foundElementData.element,
        depth
      });
    }
  }
  function removeElementData(elementData, elementsData2) {
    var index = elementsData2.indexOf(elementData);
    if (index !== -1) {
      elementsData2.splice(index, 1);
    }
    return elementsData2;
  }
  eachElement(parents, function(element, _index, depth) {
    if (isLabel$1(element)) {
      return;
    }
    forEach(element.labels, function(label) {
      addElementData(label, depth);
    });
    function addRelatedElements(elements2) {
      elements2 && elements2.length && forEach(elements2, function(element2) {
        forEach(element2.labels, function(label) {
          addElementData(label, depth);
        });
        addElementData(element2, depth);
      });
    }
    forEach([element.attachers, element.incoming, element.outgoing], addRelatedElements);
    addElementData(element, depth);
    var children = [];
    if (element.children) {
      children = element.children.slice();
    }
    self._eventBus.fire("copyPaste.createTree", {
      element,
      children
    });
    return children;
  });
  elements = map(elementsData, function(elementData) {
    return elementData.element;
  });
  elementsData = map(elementsData, function(elementData) {
    elementData.descriptor = {};
    self._eventBus.fire("copyPaste.copyElement", {
      descriptor: elementData.descriptor,
      element: elementData.element,
      elements
    });
    return elementData;
  });
  elementsData = sortBy(elementsData, function(elementData) {
    return elementData.descriptor.priority;
  });
  elements = map(elementsData, function(elementData) {
    return elementData.element;
  });
  forEach(elementsData, function(elementData) {
    var depth = elementData.depth;
    if (!self.hasRelations(elementData.element, elements)) {
      removeElement(elementData.element, elements);
      return;
    }
    if (!canCopy(elementData.element, elements)) {
      removeElement(elementData.element, elements);
      return;
    }
    if (!tree[depth]) {
      tree[depth] = [];
    }
    tree[depth].push(elementData.descriptor);
  });
  return tree;
};
function isAttacher(element) {
  return !!element.host;
}
function copyWaypoints(element) {
  return map(element.waypoints, function(waypoint) {
    waypoint = copyWaypoint(waypoint);
    if (waypoint.original) {
      waypoint.original = copyWaypoint(waypoint.original);
    }
    return waypoint;
  });
}
function copyWaypoint(waypoint) {
  return assign({}, waypoint);
}
function removeElement(element, elements) {
  var index = elements.indexOf(element);
  if (index === -1) {
    return elements;
  }
  return elements.splice(index, 1);
}
const CopyPasteModule = {
  __depends__: [
    ClipboardModule,
    CreateModule,
    MouseModule,
    RulesModule
  ],
  __init__: ["copyPaste"],
  copyPaste: ["type", CopyPaste]
};
const LOW_PRIORITY = 750;
let DomainStoryCopyPaste$1 = (_n = class {
  constructor(domainStoryPropertyCopy, eventBus) {
    this.domainStoryPropertyCopy = domainStoryPropertyCopy;
    this.references = {};
    eventBus.on("copyPaste.copyElement", LOW_PRIORITY, function(context) {
      const descriptor = context.descriptor, element = context.element;
      const businessObject = descriptor.oldBusinessObject = getBusinessObject(element);
      descriptor.type = element.type;
      copyProperties(businessObject, descriptor, "name");
      if (isLabel$1(descriptor)) {
        return descriptor;
      }
    });
    eventBus.on("copyPaste.pasteElements", () => {
      this.references = {};
    });
    eventBus.on("copyPaste.pasteElement", (context) => {
      const cache = context.cache, descriptor = context.descriptor, oldBusinessObject = descriptor.oldBusinessObject, newBusinessObject = {};
      if (isLabel$1(descriptor)) {
        descriptor.businessObject = getBusinessObject(
          cache[descriptor.labelTarget]
        );
        return;
      }
      descriptor.businessObject = this.domainStoryPropertyCopy.copyElement(
        oldBusinessObject,
        newBusinessObject
      );
      this.resolveReferences(descriptor, cache);
      copyProperties(descriptor, newBusinessObject, ["name"]);
      removeProperties(descriptor, "oldBusinessObject");
    });
  }
  resolveReferences(descriptor, cache) {
    const businessObject = getBusinessObject(descriptor);
    if (descriptor.host) {
      getBusinessObject(descriptor).attachedToRef = getBusinessObject(
        cache[descriptor.host]
      );
    }
    this.references = omit(
      this.references,
      reduce(
        this.references,
        function(array, reference, key) {
          const element = reference.element, property = reference.property;
          if (key === descriptor.id) {
            element[property] = businessObject;
            array.push(descriptor.id);
          }
          return array;
        },
        []
      )
    );
  }
}, _n.$inject = ["domainStoryPropertyCopy", "eventBus"], _n);
function copyProperties(source, target, properties) {
  if (!isArray$1(properties)) {
    properties = [properties];
  }
  forEach(properties, function(property) {
    if (!isUndefined(source[property])) {
      target[property] = source[property];
    }
  });
}
function removeProperties(element, properties) {
  if (!isArray$1(properties)) {
    properties = [properties];
  }
  forEach(properties, function(property) {
    if (element[property]) {
      delete element[property];
    }
  });
}
const DISALLOWED_PROPERTIES = ["incoming", "outgoing"];
const _DomainStoryPropertyCopy = class _DomainStoryPropertyCopy {
  constructor(eventBus) {
    this.eventBus = eventBus;
    eventBus.on("propertyCopy.canCopyProperties", function(context) {
      const propertyNames = context.propertyNames;
      if (!propertyNames || !propertyNames.length) {
        return void 0;
      }
      return sortBy(propertyNames, function(propertyName) {
        return propertyName === "extensionElements";
      });
    });
    eventBus.on("propertyCopy.canCopyProperty", function(context) {
      const propertyName = context.propertyName;
      return !(propertyName && DISALLOWED_PROPERTIES.indexOf(propertyName) !== -1);
    });
  }
  copyElement(sourceElement, targetElement, propertyNames) {
    if (propertyNames && !isArray$1(propertyNames)) {
      propertyNames = [propertyNames];
    }
    const canCopyProperties = this.eventBus.fire("propertyCopy.canCopyProperties", {
      propertyNames,
      sourceElement,
      targetElement
    });
    if (canCopyProperties === false) {
      return targetElement;
    }
    if (isArray$1(canCopyProperties)) {
      propertyNames = canCopyProperties;
    }
    forEach(propertyNames, (propertyName) => {
      let sourceProperty;
      if (has(sourceElement, propertyName)) {
        sourceProperty = sourceElement[propertyName];
      }
      const copiedProperty = this.copyProperty(
        sourceProperty,
        targetElement,
        propertyName
      );
      const canSetProperty = this.eventBus.fire(
        "propertyCopy.canSetCopiedProperty",
        {
          parent: targetElement,
          property: copiedProperty,
          propertyName
        }
      );
      if (canSetProperty === false) {
        return;
      }
      if (isDefined(copiedProperty)) {
        targetElement[propertyName] = copiedProperty;
      }
    });
    return targetElement;
  }
  copyProperty(property, parent, propertyName) {
    let copiedProperty = this.eventBus.fire(
      "propertyCopy.canCopyProperty",
      {
        parent,
        property,
        propertyName
      }
    );
    if (typeof copiedProperty === "boolean" && !copiedProperty) {
      return void 0;
    }
    if (copiedProperty) {
      if (isObject(copiedProperty) && !copiedProperty["$parent"]) {
        copiedProperty["$parent"] = parent;
      }
      return copiedProperty;
    }
    if (isArray$1(property)) {
      return reduce(
        property,
        (childProperties, childProperty) => {
          copiedProperty = this.copyProperty(
            childProperty,
            parent,
            propertyName
          );
          if (copiedProperty && typeof copiedProperty !== "boolean") {
            copiedProperty["$parent"] = parent;
            return childProperties.concat(copiedProperty);
          }
          return childProperties;
        },
        []
      );
    }
    if (isObject(property)) {
      copiedProperty = {};
      copiedProperty["$parent"] = parent;
      copiedProperty = this.copyElement(property, copiedProperty);
      return copiedProperty;
    }
    return property;
  }
};
_DomainStoryPropertyCopy.$inject = ["eventBus"];
let DomainStoryPropertyCopy = _DomainStoryPropertyCopy;
const DomainStoryCopyPaste = {
  __depends__: [CopyPasteModule],
  __init__: ["domainStoryCopyPaste", "domainStoryPropertyCopy"],
  domainStoryCopyPaste: ["type", DomainStoryCopyPaste$1],
  domainStoryPropertyCopy: ["type", DomainStoryPropertyCopy]
};
var HIGH_PRIORITY = 1500;
var HAND_CURSOR = "grab";
function HandTool(eventBus, canvas, dragging, injector, toolManager, mouse) {
  this._dragging = dragging;
  this._mouse = mouse;
  var self = this, keyboard = injector.get("keyboard", false);
  toolManager.registerTool("hand", {
    tool: "hand",
    dragging: "hand.move"
  });
  eventBus.on("element.mousedown", HIGH_PRIORITY, function(event2) {
    if (!hasPrimaryModifier(event2)) {
      return;
    }
    self.activateMove(event2.originalEvent, true);
    return false;
  });
  keyboard && keyboard.addListener(HIGH_PRIORITY, function(e2) {
    if (!isSpace(e2.keyEvent) || self.isActive()) {
      return;
    }
    var mouseEvent = self._mouse.getLastMoveEvent();
    self.activateMove(mouseEvent, !!mouseEvent);
  }, "keyboard.keydown");
  keyboard && keyboard.addListener(HIGH_PRIORITY, function(e2) {
    if (!isSpace(e2.keyEvent) || !self.isActive()) {
      return;
    }
    self.toggle();
  }, "keyboard.keyup");
  eventBus.on("hand.end", function(event2) {
    var target = event2.originalEvent.target;
    if (!event2.hover && !(target instanceof SVGElement)) {
      return false;
    }
    eventBus.once("hand.ended", function() {
      self.activateMove(event2.originalEvent, { reactivate: true });
    });
  });
  eventBus.on("hand.move.move", function(event2) {
    var scale = canvas.viewbox().scale;
    canvas.scroll({
      dx: event2.dx * scale,
      dy: event2.dy * scale
    });
  });
  eventBus.on("hand.move.end", function(event2) {
    var context = event2.context, reactivate = context.reactivate;
    if (!hasPrimaryModifier(event2) && reactivate) {
      eventBus.once("hand.move.ended", function(event3) {
        self.activateHand(event3.originalEvent, true, true);
      });
    }
    return false;
  });
}
HandTool.$inject = [
  "eventBus",
  "canvas",
  "dragging",
  "injector",
  "toolManager",
  "mouse"
];
HandTool.prototype.activateMove = function(event2, autoActivate, context) {
  if (typeof autoActivate === "object") {
    context = autoActivate;
    autoActivate = false;
  }
  this._dragging.init(event2, "hand.move", {
    autoActivate,
    cursor: HAND_CURSOR,
    data: {
      context: context || {}
    }
  });
};
HandTool.prototype.activateHand = function(event2, autoActivate, reactivate) {
  this._dragging.init(event2, "hand", {
    trapClick: false,
    autoActivate,
    cursor: HAND_CURSOR,
    data: {
      context: {
        reactivate
      }
    }
  });
};
HandTool.prototype.toggle = function() {
  if (this.isActive()) {
    return this._dragging.cancel();
  }
  var mouseEvent = this._mouse.getLastMoveEvent();
  this.activateHand(mouseEvent, !!mouseEvent);
};
HandTool.prototype.isActive = function() {
  var context = this._dragging.context();
  if (context) {
    return /^(hand|hand\.move)$/.test(context.prefix);
  }
  return false;
};
function isSpace(keyEvent) {
  return isKey("Space", keyEvent);
}
const HandToolModule = {
  __depends__: [
    ToolManagerModule,
    MouseModule
  ],
  __init__: ["handTool"],
  handTool: ["type", HandTool]
};
let DomainStoryEditorActions$1 = (_o = class {
  constructor(editorActions, canvas, elementRegistry, selection, spaceTool, lassoTool, handTool, directEditing) {
    this.canvas = canvas;
    this.elementRegistry = elementRegistry;
    this.selection = selection;
    this.spaceTool = spaceTool;
    this.lassoTool = lassoTool;
    this.handTool = handTool;
    this.directEditing = directEditing;
    const actions = {
      selectElements: this.selectAll(),
      spaceTool: this.toggleSpaceTool(),
      lassoTool: this.toggleLassoTool(),
      handTool: this.toggleHandTool(),
      directEditing: this.activateDirectEditing()
    };
    editorActions.register(actions);
  }
  /**
   * select all elements except for the invisible root element
   * @private
   */
  selectAll() {
    return () => {
      const rootElement = this.canvas.getRootElement();
      const elements = this.elementRegistry.filter(function(element) {
        return element !== rootElement;
      });
      this.selection.select(elements);
      return elements;
    };
  }
  toggleSpaceTool() {
    return () => {
      this.spaceTool.toggle();
    };
  }
  toggleLassoTool() {
    return () => {
      this.lassoTool.toggle();
    };
  }
  toggleHandTool() {
    return () => {
      this.handTool.toggle();
    };
  }
  activateDirectEditing() {
    return () => {
      const currentSelection = this.selection.get();
      if (currentSelection.length) {
        this.directEditing.activate(currentSelection[0]);
      }
    };
  }
}, _o.$inject = [
  "editorActions",
  "canvas",
  "elementRegistry",
  "selection",
  "spaceTool",
  "lassoTool",
  "handTool",
  "directEditing"
], _o);
const DomainStoryEditorActions = {
  __depends__: [HandToolModule],
  __init__: ["domainStoryEditorActions"],
  domainStoryEditorActions: ["type", DomainStoryEditorActions$1]
};
let DomainStoryKeyboardBindings$1 = (_p = class {
  constructor(keyboard, editorActions) {
    this.keyboard = keyboard;
    this.editorActions = editorActions;
    this.addListener(...this.selectAll());
    this.addListener(...this.toggleSpaceTool());
    this.addListener(...this.toggleLassoTool());
    this.addListener(...this.toggleHandTool());
    this.addListener(...this.activateDirectEditing());
  }
  addListener(action, fn) {
    if (this.editorActions.isRegistered(action)) {
      this.keyboard.addListener(fn);
    }
  }
  selectAll() {
    return [
      "selectElements",
      (context) => {
        const event2 = context.keyEvent;
        if (this.keyboard.isKey(["a", "A"], event2) && this.keyboard.isCmd(event2)) {
          this.editorActions.trigger("selectElements", {});
          return true;
        }
        return void 0;
      }
    ];
  }
  toggleSpaceTool() {
    return [
      "spaceTool",
      (context) => {
        const event2 = context.keyEvent;
        if (this.keyboard.hasModifier(event2)) {
          return void 0;
        }
        if (this.keyboard.isKey(["s", "S"], event2)) {
          this.editorActions.trigger("spaceTool", {});
          return true;
        }
        return void 0;
      }
    ];
  }
  toggleLassoTool() {
    return [
      "lassoTool",
      (context) => {
        const event2 = context.keyEvent;
        if (this.keyboard.hasModifier(event2)) {
          return void 0;
        }
        if (this.keyboard.isKey(["l", "L"], event2)) {
          this.editorActions.trigger("lassoTool", {});
          return true;
        }
        return void 0;
      }
    ];
  }
  toggleHandTool() {
    return [
      "handTool",
      (context) => {
        const event2 = context.keyEvent;
        if (this.keyboard.hasModifier(event2)) {
          return void 0;
        }
        if (this.keyboard.isKey(["h", "H"], event2)) {
          this.editorActions.trigger("handTool", {});
          return true;
        }
        return void 0;
      }
    ];
  }
  activateDirectEditing() {
    return [
      "directEditing",
      (context) => {
        const event2 = context.keyEvent;
        if (this.keyboard.hasModifier(event2)) {
          return void 0;
        }
        if (this.keyboard.isKey(["e", "E"], event2)) {
          this.editorActions.trigger("directEditing", {});
          return true;
        }
        return void 0;
      }
    ];
  }
}, _p.$inject = ["keyboard", "editorActions"], _p);
const DomainStoryKeyboardBindings = {
  __depends__: [KeyboardBindingsModule, EditorActionsModule, DomainStoryEditorActions],
  __init__: ["domainStoryKeyboardBindings"],
  domainStoryKeyboardBindings: ["type", DomainStoryKeyboardBindings$1]
};
const _DomainStoryNumberingRegistry = class _DomainStoryNumberingRegistry {
  constructor(eventBus, commandStack, domainStoryElementRegistryService) {
    this.eventBus = eventBus;
    this.commandStack = commandStack;
    this.domainStoryElementRegistryService = domainStoryElementRegistryService;
    this.numberRegistry = [];
    this.multipleNumberRegistry = [false];
  }
  /**
   * @returns copy of registry
   */
  getNumberRegistry() {
    return this.numberRegistry.slice(0);
  }
  getMultipleNumberRegistry() {
    return this.multipleNumberRegistry.slice(0);
  }
  add(renderedNumber, number) {
    this.numberRegistry[number] = renderedNumber;
  }
  setNumberIsMultiple(number, multi) {
    this.multipleNumberRegistry[number] = multi;
  }
  updateMultipleNumberRegistry(activityBusinessObjects) {
    activityBusinessObjects.forEach(
      (activity) => this.multipleNumberRegistry[activity.number ?? 0] = activity.multipleNumberAllowed
    );
  }
  /**
   * Get the IDs of activities with their associated number, only returns activities that are originating from an actor
   */
  getNumbersAndIDs() {
    const iDWithNumber = [];
    const activities = this.domainStoryElementRegistryService.getActivitiesFromActors();
    for (let i2 = activities.length - 1; i2 >= 0; i2--) {
      const id = activities[i2].businessObject.id;
      const number = activities[i2].businessObject.number;
      iDWithNumber.push({ id, number });
    }
    return iDWithNumber;
  }
  /**
   * Determine the next available number that is not yet used
   */
  generateAutomaticNumber(elementActivity) {
    const semantic = elementActivity.businessObject;
    const usedNumbers = [0];
    let wantedNumber = -1;
    const activitiesFromActors = this.domainStoryElementRegistryService.getActivitiesFromActors();
    activitiesFromActors.forEach((element) => {
      if (element.businessObject.number) {
        usedNumbers.push(+element.businessObject.number);
      }
    });
    for (let i2 = 0; i2 < usedNumbers.length; i2++) {
      if (!usedNumbers.includes(i2)) {
        if (!usedNumbers.includes(i2)) {
          wantedNumber = i2;
          i2 = usedNumbers.length;
        }
      }
    }
    if (wantedNumber === -1) {
      wantedNumber = usedNumbers.length;
    }
    this.updateExistingNumbersAtGeneration(activitiesFromActors, wantedNumber);
    semantic.number = wantedNumber;
    return wantedNumber;
  }
  /**
   * update the numbers at the activities when generating a new activity
   */
  updateExistingNumbersAtGeneration(activitiesFromActors, wantedNumber) {
    activitiesFromActors.forEach((element) => {
      const number = element.businessObject.number ?? 0;
      if (number >= wantedNumber) {
        wantedNumber++;
        setTimeout(() => {
          this.commandStack.execute("activity.changed", {
            businessObject: element.businessObject,
            newLabel: element.businessObject.name,
            newNumber: number,
            element
          });
        }, 10);
      }
    });
  }
  /**
   * Update the numbers at the activities when editing an activity
   */
  updateExistingNumbersAtEditing(activitiesFromActors, wantedNumber) {
    const sortedActivities = [[]];
    activitiesFromActors.forEach((activity) => {
      if (activity.businessObject.number) {
        if (!sortedActivities[activity.businessObject.number]) {
          sortedActivities[activity.businessObject.number] = [];
        }
        sortedActivities[activity.businessObject.number].push(activity);
      }
    });
    const oldMultipleNumberRegistry = [...this.multipleNumberRegistry];
    let currentNumber = wantedNumber;
    for (currentNumber; currentNumber < sortedActivities.length; currentNumber++) {
      if (sortedActivities[currentNumber]) {
        wantedNumber++;
        this.multipleNumberRegistry[wantedNumber] = oldMultipleNumberRegistry[currentNumber];
        this.setNumberOfActivity(sortedActivities[currentNumber], wantedNumber);
      }
    }
  }
  /**
   * Find all gaps in the sequence starting from 1.
   * @returns Array of missing numbers from 1 to max
   * @example [1, 4, 5, 7] -> [2, 3, 6]
   * @example [3, 5, 5, 8] -> [1, 2, 4, 6, 7]
   */
  // private findGaps(): number[] {
  //     const values = Object.keys(this.numberRegistry).map(Number);
  //     if (values.length === 0) {
  //         return [];
  //     }
  //     // Get unique values to handle duplicates
  //     const uniqueValues = new Set(values);
  //     const max = Math.max(...values);
  //     const gaps: number[] = [];
  //     // Check each number from 1 to max
  //     for (let i = 1; i <= max; i++) {
  //         if (!uniqueValues.has(i)) {
  //             gaps.push(i);
  //         }
  //     }
  //     return gaps;
  // }
  setNumberOfActivity(elementArray, wantedNumber) {
    if (elementArray) {
      elementArray.forEach((element) => {
        if (element) {
          const businessObject = element.businessObject;
          if (businessObject) {
            businessObject.number = wantedNumber;
          }
          this.eventBus.fire("element.changed", { element });
        }
      });
    }
  }
};
_DomainStoryNumberingRegistry.$inject = [
  "eventBus",
  "commandStack",
  "domainStoryElementRegistryService"
];
let DomainStoryNumberingRegistry = _DomainStoryNumberingRegistry;
function Button(props) {
  const text = props.text;
  const onClick = props.onClick;
  return m$1`
        <button
            style="cursor: pointer; 
            padding: 8px 16px; 
            font-size: 14px; 
            border: 1px solid #ccc; 
            border-radius: 4px; 
            background-color: #f0f0f0; 
            flex: 1;
            min-height: 36px;
            transition: all 0.2s ease;"
            onClick=${onClick}
            onMouseEnter=${(e2) => {
    const target = e2.target;
    target.style.borderColor = "#00e379";
    target.style.color = "#00e379";
  }}
            onMouseLeave=${(e2) => {
    const target = e2.target;
    target.style.borderColor = "#ccc";
    target.style.color = "inherit";
  }}
        >
            ${text}
        </button>
    `;
}
function PopupMenu(props) {
  const x2 = props.x;
  const y2 = props.y;
  const onUpdate = props.onUpdate;
  const onCancel = props.onCancel;
  const [isMultiple, setIsMultiple] = d(props.isMultiple || false);
  const [label, setLabel2] = d(props.label || "");
  const [index, setIndex] = d(props.index || 0);
  const handleUpdate = () => {
    onUpdate(label, index, isMultiple);
  };
  const handleMultipleChange = (event2) => {
    setIsMultiple(event2.target.checked);
  };
  const handleNumberChange = (event2) => {
    const value = event2.target.value;
    setIndex(value === "" ? 0 : Number(value));
  };
  const handleLabelChange = (event2) => {
    setLabel2(event2.target.value);
  };
  const labelInputRef = (element) => {
    if (element) {
      setTimeout(() => element.focus(), 0);
    }
  };
  return m$1`
        <div
            style="z-index: 9999; 
            position: absolute; 
            top: ${y2}px; 
            left: ${x2}px; 
            background-color: white; 
            border: 1px solid #ccc; 
            border-radius: 4px; 
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); 
            padding: 12px; 
            width: fit-content;
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;"
        >
            <h3 style="margin: 0 0 8px 0;">Edit Activity</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${props.displayNumber ? m$1`
                          <div style="display: flex; align-items: center; gap: 8px;">
                              <label for="multiple" style="min-width: 80px;"
                                  >Multiple:</label
                              >
                              <input
                                  name="multiple"
                                  type="checkbox"
                                  onInput=${handleMultipleChange}
                              />
                          </div>
                          <div style="display: flex; align-items: center; gap: 8px;">
                              <label for="index" style="min-width: 80px;">Number:</label>
                              <input
                                  name="index"
                                  type="number"
                                  value=${index}
                                  onInput=${handleNumberChange}
                                  style="flex: 1; 
                        border: 1px solid #ccc; 
                        border-radius: 4px; 
                        padding: 6px;
                        transition: border-color 0.2s ease;"
                                  onFocus=${(e2) => {
    const target = e2.target;
    target.style.borderColor = "#00e379";
    target.style.outline = "none";
  }}
                                  onBlur=${(e2) => {
    const target = e2.target;
    target.style.borderColor = "#ccc";
  }}
                              />
                          </div>
                      ` : ""}
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label for="label" style="min-width: 80px;">Label:</label>
                    <input
                        ref=${labelInputRef}
                        name="label"
                        type="text"
                        value=${label}
                        onInput=${handleLabelChange}
                        style="flex: 1; 
                        border: 1px solid #ccc; 
                        border-radius: 4px; 
                        padding: 6px;
                        transition: border-color 0.2s ease;"
                        onFocus=${(e2) => {
    const target = e2.target;
    target.style.borderColor = "#00e379";
    target.style.outline = "none";
  }}
                        onBlur=${(e2) => {
    const target = e2.target;
    target.style.borderColor = "#ccc";
  }}
                    />
                </div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 8px;">
                <${Button} text="Update" onClick=${handleUpdate} />
                <${Button} text="Cancel" onClick=${onCancel} />
            </div>
        </div>
    `;
}
let DomainStoryPopupService$1 = (_q = class {
  constructor(canvas, eventBus, commandStack, elementRegistryService, domainStoryNumberingRegistry) {
    this.canvas = canvas;
    this.eventBus = eventBus;
    this.commandStack = commandStack;
    this.elementRegistryService = elementRegistryService;
    this.domainStoryNumberingRegistry = domainStoryNumberingRegistry;
    this.popupElement = null;
    this.currentUpdateCallback = null;
    this.handleUpdate = (element, label, number, isMultiple) => {
      const activitiesFromActors = this.elementRegistryService.getActivitiesFromActors();
      const index = activitiesFromActors.indexOf(element);
      activitiesFromActors.splice(index, 1);
      if (number) {
        element.businessObject.number = number;
        this.domainStoryNumberingRegistry.setNumberIsMultiple(number, isMultiple);
      }
      element.businessObject.multipleNumberAllowed = isMultiple;
      let options;
      if (number) {
        options = {
          businessObject: element.businessObject,
          newLabel: label,
          newNumber: number,
          element
        };
      } else {
        options = {
          businessObject: element.businessObject,
          newLabel: label,
          element
        };
      }
      this.commandStack.execute("activity.changed", options);
      if (number) {
        if (element.businessObject.multipleNumberAllowed) {
          if (!this.domainStoryNumberingRegistry.getMultipleNumberRegistry()[number]) {
            this.domainStoryNumberingRegistry.updateExistingNumbersAtEditing(
              activitiesFromActors,
              number
            );
          }
        } else if (!element.businessObject.multipleNumberAllowed) {
          this.domainStoryNumberingRegistry.updateExistingNumbersAtEditing(
            activitiesFromActors,
            number
          );
        }
      }
    };
    this.handleOutsideClick = (event2) => {
      if (!this.popupElement) return;
      const target = event2.target;
      const clickedInsidePopup = target.closest('[data-numbering-popup="true"]');
      if (!clickedInsidePopup && this.currentUpdateCallback) {
        const labelInput = this.popupElement.querySelector(
          'input[name="label"]'
        );
        const indexInput = this.popupElement.querySelector(
          'input[name="index"]'
        );
        const multipleInput = this.popupElement.querySelector(
          'input[name="multiple"]'
        );
        const label = (labelInput == null ? void 0 : labelInput.value) || "";
        const index = indexInput ? Number(indexInput.value) : void 0;
        const isMultiple = (multipleInput == null ? void 0 : multipleInput.checked) || false;
        this.currentUpdateCallback(label, index, isMultiple);
        this.currentUpdateCallback = null;
        this.close();
      }
    };
    this.eventBus.on("element.dblclick", (event2) => {
      var _a2;
      const { element } = event2;
      if ((_a2 = element.type) == null ? void 0 : _a2.includes(ElementTypes.ACTIVITY)) {
        this.open(element);
      }
    });
  }
  open(element) {
    const position = this.calculatePosition(element);
    const onUpdate = (label, index, isMultiple) => {
      this.handleUpdate(element, label, index, isMultiple);
      this.currentUpdateCallback = null;
      this.close();
    };
    this.currentUpdateCallback = (label, index, isMultiple) => {
      this.handleUpdate(element, label, index, isMultiple);
    };
    const onCancel = () => {
      this.close();
    };
    const parentElement = document.getElementById("egon-io-container");
    if (parentElement) {
      this.close();
      const tempContainer = document.createElement("div");
      const isActivityFromActor = !!this.elementRegistryService.getActivityFromActorById(
        element.businessObject.id
      );
      D$1(
        m$1`<${PopupMenu}
                    x=${position.x}
                    y=${position.y}
                    label=${element.businessObject.name}
                    index=${element.businessObject.number}
                    isMultiple=${element.businessObject.multipleNumberAllowed}
                    displayNumber=${isActivityFromActor}
                    onUpdate=${onUpdate}
                    onCancel=${onCancel}
                />`,
        tempContainer
      );
      this.popupElement = tempContainer.firstElementChild;
      if (this.popupElement) {
        this.popupElement.setAttribute("data-numbering-popup", "true");
        parentElement.appendChild(this.popupElement);
      }
      setTimeout(() => {
        document.addEventListener("click", this.handleOutsideClick, true);
      }, 0);
    }
  }
  close() {
    if (this.popupElement) {
      document.removeEventListener("click", this.handleOutsideClick, true);
      this.popupElement.remove();
      this.popupElement = null;
      this.currentUpdateCallback = null;
    }
  }
  calculatePosition(element) {
    const point1 = element["waypoints"][0];
    const point2 = element["waypoints"][element["waypoints"].length - 1];
    const canvasX = (point1.x + point2.x) / 2;
    const canvasY = (point1.y + point2.y) / 2;
    const viewbox = this.canvas.viewbox();
    return {
      x: (canvasX - viewbox.x) * viewbox.scale,
      y: (canvasY - viewbox.y) * viewbox.scale
    };
  }
}, _q.$inject = [
  "canvas",
  "eventBus",
  "commandStack",
  "domainStoryElementRegistryService",
  "domainStoryNumberingRegistry"
], _q);
const DomainStoryPopupService = {
  __depends__: [DomainStoryModeling, ElementRegistryService],
  __init__: ["domainStoryNumberingRegistry", "domainStoryNumberingUi"],
  domainStoryNumberingRegistry: ["type", DomainStoryNumberingRegistry],
  domainStoryNumberingUi: ["type", DomainStoryPopupService$1]
};
class ConfigAndDST {
  constructor(domain, dst) {
    this.domain = domain;
    this.dst = dst;
  }
}
({
  domain: JSON.parse(
    '{"name":"","actors":{"Person":"<svg viewBox=\\"0 0 24 26\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M12 5.9c1.16 0 2.1.94 2.1 2.1s-.94 2.1-2.1 2.1S9.9 9.16 9.9 8s.94-2.1 2.1-2.1m0 9c2.97 0 6.1 1.46 6.1 2.1v1.1H5.9V17c0-.64 3.13-2.1 6.1-2.1M12 4C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 9c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z\\"/><path d=\\"M0 0h24v24H0z\\" fill=\\"none\\"/></svg>","Group":"<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"48\\" height=\\"48\\" viewBox=\\"0 0 24 26\\"><path d=\\"M0 0h24v24H0z\\" fill=\\"none\\"/><path d=\\"M16.5 13c-1.2 0-3.07.34-4.5 1-1.43-.67-3.3-1-4.5-1C5.33 13 1 14.08 1 16.25V19h22v-2.75c0-2.17-4.33-3.25-6.5-3.25zm-4 4.5h-10v-1.25c0-.54 2.56-1.75 5-1.75s5 1.21 5 1.75v1.25zm9 0H14v-1.25c0-.46-.2-.86-.52-1.22.88-.3 1.96-.53 3.02-.53 2.44 0 5 1.21 5 1.75v1.25zM7.5 12c1.93 0 3.5-1.57 3.5-3.5S9.43 5 7.5 5 4 6.57 4 8.5 5.57 12 7.5 12zm0-5.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 5.5c1.93 0 3.5-1.57 3.5-3.5S18.43 5 16.5 5 13 6.57 13 8.5s1.57 3.5 3.5 3.5zm0-5.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z\\"/></svg>","System":"<svg viewBox=\\"0 0 24 26\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M20,18c1.1,0,2-0.9,2-2V6c0-1.1-0.9-2-2-2H4C2.9,4,2,4.9,2,6v10c0,1.1,0.9,2,2,2H0v2h24v-2H20z M4,6h16v10H4V6z\\"/></svg>"},"workObjects":{"Document":"<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 26\\"><path fill=\\"none\\" d=\\"M0 0h24v24H0V0z\\"/><path d=\\"M8 16h8v2H8zm0-4h8v2H8zm6-10H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z\\"/></svg>","Folder":"<svg viewBox=\\"0 0 24 26\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path fill=\\"none\\" d=\\"M0,0h24v24H0V0z\\"/><path d=\\"M9.17,6l2,2H20v10L4,18V6H9.17 M10,4H4C2.9,4,2.01,4.9,2.01,6L2,18c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V8c0-1.1-0.9-2-2-2 h-8L10,4L10,4z\\"/></svg>","Call":"<svg viewBox=\\"0 0 24 26\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path fill=\\"none\\" d=\\"M0,0h24v24H0V0z\\"/><path d=\\"M6.54,5C6.6,5.89,6.75,6.76,6.99,7.59l-1.2,1.2C5.38,7.59,5.12,6.32,5.03,5H6.54 M16.4,17.02c0.85,0.24,1.72,0.39,2.6,0.45 v1.49c-1.32-0.09-2.59-0.35-3.8-0.75L16.4,17.02 M7.5,3H4C3.45,3,3,3.45,3,4c0,9.39,7.61,17,17,17c0.55,0,1-0.45,1-1v-3.49\\tc0-0.55-0.45-1-1-1c-1.24,0-2.45-0.2-3.57-0.57c-0.1-0.04-0.21-0.05-0.31-0.05c-0.26,0-0.51,0.1-0.71,0.29l-2.2,2.2 c-2.83-1.45-5.15-3.76-6.59-6.59l2.2-2.2C9.1,8.31,9.18,7.92,9.07,7.57C8.7,6.45,8.5,5.25,8.5,4C8.5,3.45,8.05,3,7.5,3L7.5,3z\\"/></svg>","Email":"<svg viewBox=\\"0 0 24 26\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path fill=\\"none\\" d=\\"M0,0h24v24H0V0z\\"/><path fill-opacity=\\"0.9\\" d=\\"M12,1.95c-5.52,0-10,4.48-10,10s4.48,10,10,10h5v-2h-5c-4.34,0-8-3.66-8-8s3.66-8,8-8s8,3.66,8,8v1.43 c0,0.79-0.71,1.57-1.5,1.57S17,14.17,17,13.38v-1.43c0-2.76-2.24-5-5-5s-5,2.24-5,5s2.24,5,5,5c1.38,0,2.64-0.56,3.54-1.47 c0.65,0.89,1.77,1.47,2.96,1.47c1.97,0,3.5-1.6,3.5-3.57v-1.43C22,6.43,17.52,1.95,12,1.95z M12,14.95c-1.66,0-3-1.34-3-3 s1.34-3,3-3s3,1.34,3,3S13.66,14.95,12,14.95z\\"/></svg>","Conversation":"<svg height=\\"48\\" viewBox=\\"0 0 24 26\\" width=\\"48\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M0 0h24v24H0V0z\\" fill=\\"none\\"/><path d=\\"M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z\\"/></svg>","Info":"<svg height=\\"48\\" viewBox=\\"0 0 24 26\\" width=\\"48\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M0 0h24v24H0z\\" fill=\\"none\\"/><path d=\\"M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z\\"/></svg>"}}'
  )
});
let DomainStoryExportService$1 = (_r = class {
  constructor(elementRegistryService, iconSetImportExportService) {
    this.elementRegistryService = elementRegistryService;
    this.iconSetImportExportService = iconSetImportExportService;
  }
  export() {
    const dst = this.getStory();
    const configAndDST = this.createConfigAndDST(dst);
    return JSON.stringify(configAndDST, null, 2);
  }
  getStory() {
    const story = this.elementRegistryService.createObjectListForDSTDownload().map((c2) => c2.businessObject).sort((objA, objB) => {
      if (objA.id !== void 0 && objB.id !== void 0) {
        return objA.id.localeCompare(objB.id);
      } else {
        return 0;
      }
    });
    story.push({ info: "" });
    story.push({ version: "3.0.0" });
    return story;
  }
  createConfigAndDST(domainStory) {
    return new ConfigAndDST(
      this.iconSetImportExportService.getCurrentConfigurationForExport(),
      domainStory
    );
  }
}, _r.$inject = [
  "domainStoryElementRegistryService",
  "domainStoryIconSetImportExportService"
], _r);
const DomainStoryExportService = {
  __depends__: [ElementRegistryService, IconSetImportExportService],
  __init__: ["domainStoryExportService"],
  domainStoryExportService: ["type", DomainStoryExportService$1]
};
class ImportRepairService {
  checkForUnreferencedElementsInActivitiesAndRepair(elements) {
    const activities = [];
    const objectIDs = [];
    let complete = true;
    elements.forEach((element) => {
      const type = element.type;
      if (type === ElementTypes.ACTIVITY || type === ElementTypes.CONNECTION) {
        activities.push(element);
      } else {
        objectIDs.push(element.id);
      }
    });
    activities.forEach((activity) => {
      const source = activity.source;
      const target = activity.target;
      if (!objectIDs.includes(source) || !objectIDs.includes(target)) {
        complete = false;
        const activityIndex = elements.indexOf(activity);
        elements = elements.splice(activityIndex, 1);
      }
    });
    return complete;
  }
  /**
   * Ensure backwards compatibility.
   * Previously Document had no special name and was just addressed as workObject
   * Bubble was renamed to Conversation
   */
  updateCustomElementsPreviousV050(elements) {
    for (const element of elements) {
      if (element.type === ElementTypes.WORKOBJECT) {
        element.type = ElementTypes.WORKOBJECT + "Document";
      } else if (element.type === ElementTypes.WORKOBJECT + "Bubble") {
        element.type = ElementTypes.WORKOBJECT + "Conversation";
      }
    }
    return elements;
  }
  // Early versions of Egon allowed Whitespaces in Icon names which are now not supported anymore.
  // To find the right icon in the dictionary, they need to be replaced.
  removeWhitespacesFromIcons(elements) {
    elements.forEach((bo) => {
      if (bo.type) {
        bo.type = bo.type.replace(/ /g, "-");
      }
    });
  }
  removeUnnecessaryBpmnProperties(elements) {
    elements.forEach((bo) => {
      if (bo.$type) {
        bo.$type = void 0;
      }
      if (bo.$descriptor) {
        bo.$descriptor = void 0;
      }
      if (bo.di) {
        bo.di = void 0;
      }
    });
  }
}
const logo = "data:image/png;base64,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";
function VersionBox(props) {
  return m$1`
        <div
            style="position: absolute;
            bottom: 16px;
            right: 16px;
            background-color: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            "
        >
            <img src=${logo} alt="Egon.io Logo" style="height: 32px; width: auto;" />
            <span style="font-size: 14px; font-weight: 500; color: #333;">
                Version ${props.version}
            </span>
        </div>
    `;
}
let DomainStoryImportService$1 = (_s = class {
  constructor(eventBus, canvas, elementRegistry, elementFactory, iconDictionaryService, iconSetImportExportService) {
    this.eventBus = eventBus;
    this.canvas = canvas;
    this.elementRegistry = elementRegistry;
    this.elementFactory = elementFactory;
    this.iconDictionaryService = iconDictionaryService;
    this.iconSetImportExportService = iconSetImportExportService;
    this.elements = [];
    this.groupElements = [];
    this.importRepairService = new ImportRepairService();
  }
  /**
   * @throws Error if import fails
   * @param story
   */
  import(story) {
    const configAndDST = JSON.parse(story);
    let domainStoryElements = configAndDST.dst;
    const domainStoryIcons = configAndDST.domain;
    const iconSet = this.iconSetImportExportService.createIconSetConfiguration(domainStoryIcons);
    this.importRepairService.removeWhitespacesFromIcons(domainStoryElements);
    this.importRepairService.removeUnnecessaryBpmnProperties(domainStoryElements);
    this.importRepairService.checkForUnreferencedElementsInActivitiesAndRepair(
      domainStoryElements
    );
    this.eventBus.fire("diagram.clear", {});
    if (!isArray$1(domainStoryElements)) {
      throw new Error("argument must be an array");
    }
    let lastElement = domainStoryElements[domainStoryElements.length - 1];
    if (!lastElement.id) {
      lastElement = domainStoryElements.pop();
      let importVersionNumber = lastElement;
      if (importVersionNumber.version) {
        lastElement = domainStoryElements.pop();
        importVersionNumber = importVersionNumber.version;
      } else {
        importVersionNumber = "?";
      }
      domainStoryElements = this.handleVersionNumber(
        importVersionNumber,
        domainStoryElements
      );
    }
    const connections = [], groups = [], otherElementTypes = [];
    domainStoryElements.forEach(function(bo) {
      if (isOfTypeConnection(bo)) {
        connections.push(bo);
      } else if (isOfTypeGroup(bo)) {
        groups.push(bo);
      } else {
        otherElementTypes.push(bo);
      }
    });
    this.iconSetImportExportService.loadConfiguration(iconSet);
    this.eventBus.fire("dst.config.changed", { iconSet });
    groups.forEach(this.createElementFromBusinessObject, this);
    otherElementTypes.forEach(this.createElementFromBusinessObject, this);
    connections.forEach(this.addConnection, this);
  }
  createElementFromBusinessObject(businessObject) {
    const parentId = businessObject.parent;
    delete businessObject.children;
    delete businessObject.parent;
    this.elements.push(businessObject);
    const attributes = assign({ businessObject }, businessObject);
    const shape = this.elementFactory.create("shape", attributes);
    if (isOfTypeGroup(businessObject)) {
      this.groupElements[businessObject.id] = shape;
    }
    if (parentId) {
      const parentShape = this.groupElements[parentId];
      if (isOfTypeGroup(parentShape)) {
        return this.canvas.addShape(shape, parentShape, Number(parentShape.id));
      }
    }
    return this.canvas.addShape(shape);
  }
  // FIXME: use an actual type for element. It should be BusinessObject from the domain.
  addConnection(element) {
    this.elements.push(element);
    const attributes = assign({ businessObject: element }, element);
    if (element.source === void 0 || element.target === void 0) {
      throw new Error("source and target must be defined");
    }
    const connection = this.elementFactory.create(
      "connection",
      assign(attributes, {
        source: this.elementRegistry.get(element.source),
        target: this.elementRegistry.get(element.target)
      })
      // this.elementRegistry.get(element.source!.id).parent,
    );
    return this.canvas.addConnection(connection);
  }
  handleVersionNumber(importVersionNumber, elements) {
    const versionPrefix = +importVersionNumber.substring(
      0,
      importVersionNumber.lastIndexOf(".")
    );
    if (versionPrefix <= 0.5) {
      elements = this.importRepairService.updateCustomElementsPreviousV050(elements);
    }
    const parentElement = document.getElementById("egon-io-container");
    if (parentElement) {
      D$1(
        m$1` <${VersionBox} version=${importVersionNumber} />`,
        parentElement
      );
    }
    return elements;
  }
}, _s.$inject = [
  "eventBus",
  "canvas",
  "elementRegistry",
  "elementFactory",
  "domainStoryIconDictionaryService",
  "domainStoryIconSetImportExportService"
], _s);
function isOfTypeConnection(element) {
  return element.type === ElementTypes.ACTIVITY || element.type === ElementTypes.CONNECTION;
}
function isOfTypeGroup(element) {
  return element && element.type === ElementTypes.GROUP;
}
const DomainStoryImportService = {
  __init__: ["domainStoryImportService"],
  domainStoryImportService: ["type", DomainStoryImportService$1]
};
const buildInModules = [
  EditorActionsModule,
  KeyboardBindingsModule,
  MoveCanvasModule,
  KeyboardMoveModule,
  ZoomScrollModule,
  MoveModule,
  BendpointsModule,
  ConnectionPreviewModule,
  SnappingModule,
  minimapModule
];
const domainStoryModules = [
  DomainStoryElementFactory,
  DomainStoryRenderer,
  DomainStoryModeling,
  DomainStoryUpdater,
  DomainStoryUpdateHandler,
  DomainStoryPaletteProvider,
  DomainStoryContextPadProvider,
  DomainStoryLabelEditing,
  DomainStoryCopyPaste,
  DomainStoryKeyboardBindings,
  DomainStoryPopupService,
  DomainStoryExportService,
  DomainStoryImportService
];
const EgonPlugin = {
  __depends__: [...domainStoryModules, ...buildInModules]
};
export {
  Dictionary as D,
  EgonPlugin as E,
  IconDictionaryService as I,
  LabelDictionaryService$1 as L,
  ElementTypes as a,
  EgonClient as b,
  DomainStoryImportService$1 as c,
  DomainStoryExportService$1 as d,
  ElementRegistryService$1 as e,
  DirtyFlagService as f
};
//# sourceMappingURL=index-CGUCA245.js.map
