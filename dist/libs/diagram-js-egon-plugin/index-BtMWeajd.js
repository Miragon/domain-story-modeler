import { isArray as L, forEach as A, isFunction as Z, assign as T, bind as Br, isNumber as j, find as de, filter as we, isUndefined as Ca, isObject as ie, groupBy as Wr, has as zr, flatten as bu, size as Eu, matchPattern as ln, every as vi, sortBy as En, debounce as wu, reduce as vn, uniqueBy as Su, isDefined as ge, some as Au, map as xe, omit as Fe, pick as Lt, values as Oa, isNil as $o } from "min-dash";
import { event as N, classes as fe, closest as wn, queryAll as Yi, query as ee, delegate as We, assignStyle as Cu, domify as be, matches as Ta, clear as Ou, attr as ye, remove as Tu } from "min-dom";
import { create as D, attr as k, remove as Y, append as I, clear as Ur, classes as H, clone as Ra, createTransform as dn, transform as Fr } from "tiny-svg";
import Ru from "diagram-js-minimap";
import { BehaviorSubject as ku } from "rxjs";
import Pu from "ids";
import Mu from "diagram-js-direct-editing";
class Zi {
  constructor(e, n, i) {
    this.modelerPort = e, this.iconPort = n, i && this.setViewport(i);
  }
  /**
   * Creates a new EgonClient instance.
   *
   * @param config - Configuration options for the client
   * @param additionalModules - Optional array of additional diagram-js modules
   * @param ports - Optional port injection for testing (bypasses adapter creation)
   */
  static async create(e, n = [], i) {
    if (i)
      return new Zi(i.modelerPort, i.iconPort, e.viewport);
    const { DiagramJsModelerAdapter: r } = await import("./DiagramJsModelerAdapter-DxkUuYyW.js"), { DiagramJsIconAdapter: o } = await import("./DiagramJsIconAdapter-BAvj9Bbk.js"), s = new r(
      e.container,
      e.width ?? "100%",
      e.height ?? "100%",
      n
    ), a = new o(s.getDiagram());
    return new Zi(s, a, e.viewport);
  }
  // --- Document Operations ---
  /**
   * Import a domain story document into the diagram.
   * Icons from the document's domain section are automatically loaded.
   */
  import(e) {
    this.modelerPort.import(e);
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
  on(e, n) {
    switch (e) {
      case "story.changed":
        this.modelerPort.onStoryChanged(
          n
        );
        break;
      case "viewport.changed":
        this.modelerPort.onViewportChanged(
          n
        );
        break;
      case "icons.changed":
        this.iconPort.onIconsChanged(n);
        break;
    }
  }
  /**
   * Unsubscribe from an event.
   */
  off(e, n) {
    switch (e) {
      case "story.changed":
        this.modelerPort.offStoryChanged(
          n
        );
        break;
      case "viewport.changed":
        this.modelerPort.offViewportChanged(
          n
        );
        break;
      case "icons.changed":
        this.iconPort.offIconsChanged(n);
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
  setViewport(e) {
    this.modelerPort.setViewport(e);
  }
  // --- Icon Management ---
  /**
   * Load a set of icons (actors and/or work objects).
   * Merges with existing icons; existing icons with the same name are overwritten.
   */
  loadIcons(e) {
    this.iconPort.loadIcons(e);
  }
  /**
   * Add a single icon.
   */
  addIcon(e, n, i) {
    this.iconPort.addIcon(e, n, i);
  }
  /**
   * Remove a single icon.
   */
  removeIcon(e, n) {
    this.iconPort.removeIcon(e, n);
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
  hasIcon(e, n) {
    return this.iconPort.hasIcon(e, n);
  }
  // --- Lifecycle ---
  /**
   * Destroy the client and clean up resources.
   */
  destroy() {
    this.modelerPort.destroy();
  }
}
var ka = "is not a registered action", Iu = "is already registered";
function Re(t, e) {
  this._actions = {};
  var n = this;
  t.on("diagram.init", function() {
    n._registerDefaultActions(e), t.fire("editorActions.init", {
      editorActions: n
    });
  });
}
Re.$inject = [
  "eventBus",
  "injector"
];
Re.prototype._registerDefaultActions = function(t) {
  var e = t.get("commandStack", !1), n = t.get("modeling", !1), i = t.get("selection", !1), r = t.get("zoomScroll", !1), o = t.get("copyPaste", !1), s = t.get("canvas", !1), a = t.get("rules", !1), c = t.get("keyboardMove", !1), u = t.get("keyboardMoveSelection", !1);
  e && (this.register("undo", function() {
    e.undo();
  }), this.register("redo", function() {
    e.redo();
  })), o && i && this.register("copy", function() {
    var l = i.get();
    if (l.length)
      return o.copy(l);
  }), o && this.register("paste", function() {
    o.paste();
  }), r && this.register("stepZoom", function(l) {
    r.stepZoom(l.value);
  }), s && this.register("zoom", function(l) {
    s.zoom(l.value);
  }), n && i && a && this.register("removeSelection", function() {
    var l = i.get();
    if (l.length) {
      var d = a.allowed("elements.delete", { elements: l }), h;
      d !== !1 && (L(d) ? h = d : h = l, h.length && n.removeElements(h.slice()));
    }
  }), c && this.register("moveCanvas", function(l) {
    c.moveCanvas(l);
  }), u && this.register("moveSelection", function(l) {
    u.moveSelection(l.direction, l.accelerated);
  });
};
Re.prototype.trigger = function(t, e) {
  if (!this._actions[t])
    throw Kr(t, ka);
  return this._actions[t](e);
};
Re.prototype.register = function(t, e) {
  var n = this;
  if (typeof t == "string")
    return this._registerAction(t, e);
  A(t, function(i, r) {
    n._registerAction(r, i);
  });
};
Re.prototype._registerAction = function(t, e) {
  if (this.isRegistered(t))
    throw Kr(t, Iu);
  this._actions[t] = e;
};
Re.prototype.unregister = function(t) {
  if (!this.isRegistered(t))
    throw Kr(t, ka);
  this._actions[t] = void 0;
};
Re.prototype.getActions = function() {
  return Object.keys(this._actions);
};
Re.prototype.isRegistered = function(t) {
  return !!this._actions[t];
};
function Kr(t, e) {
  return new Error(t + " " + e);
}
const Pa = {
  __init__: ["editorActions"],
  editorActions: ["type", Re]
};
var ju = ["c", "C"], Du = ["v", "V"], Lu = ["y", "Y"], Ma = ["z", "Z"];
function Nu(t) {
  return t.ctrlKey || t.metaKey || t.shiftKey || t.altKey;
}
function Ee(t) {
  return t.altKey ? !1 : t.ctrlKey || t.metaKey;
}
function ue(t, e) {
  return t = L(t) ? t : [t], t.indexOf(e.key) !== -1 || t.indexOf(e.code) !== -1;
}
function $r(t) {
  return t.shiftKey;
}
function Hu(t) {
  return Ee(t) && ue(ju, t);
}
function Bu(t) {
  return Ee(t) && ue(Du, t);
}
function Wu(t) {
  return Ee(t) && !$r(t) && ue(Ma, t);
}
function zu(t) {
  return Ee(t) && (ue(Lu, t) || ue(Ma, t) && $r(t));
}
var mi = "keyboard.keydown", Uu = "keyboard.keyup", Fu = 1e3, Ia = "Keyboard binding is now implicit; explicit binding to an element got removed. For more information, see https://github.com/bpmn-io/diagram-js/issues/661";
function te(t, e) {
  var n = this;
  this._config = t = t || {}, this._eventBus = e, this._keydownHandler = this._keydownHandler.bind(this), this._keyupHandler = this._keyupHandler.bind(this), e.on("diagram.destroy", function() {
    n._fire("destroy"), n.unbind();
  }), t.bindTo && console.error("unsupported configuration <keyboard.bindTo>", new Error(Ia));
  var i = t && t.bind !== !1;
  e.on("canvas.init", function(r) {
    n._target = r.svg, i && n.bind(), n._fire("init");
  });
}
te.$inject = [
  "config.keyboard",
  "eventBus"
];
te.prototype._keydownHandler = function(t) {
  this._keyHandler(t, mi);
};
te.prototype._keyupHandler = function(t) {
  this._keyHandler(t, Uu);
};
te.prototype._keyHandler = function(t, e) {
  var n;
  if (!this._isEventIgnored(t)) {
    var i = {
      keyEvent: t
    };
    n = this._eventBus.fire(e || mi, i), n && t.preventDefault();
  }
};
te.prototype._isEventIgnored = function(t) {
  return !1;
};
te.prototype.bind = function(t) {
  t && console.error("unsupported argument <node>", new Error(Ia)), this.unbind(), t = this._node = this._target, N.bind(t, "keydown", this._keydownHandler), N.bind(t, "keyup", this._keyupHandler), this._fire("bind");
};
te.prototype.getBinding = function() {
  return this._node;
};
te.prototype.unbind = function() {
  var t = this._node;
  t && (this._fire("unbind"), N.unbind(t, "keydown", this._keydownHandler), N.unbind(t, "keyup", this._keyupHandler)), this._node = null;
};
te.prototype._fire = function(t) {
  this._eventBus.fire("keyboard." + t, { node: this._node });
};
te.prototype.addListener = function(t, e, n) {
  Z(t) && (n = e, e = t, t = Fu), this._eventBus.on(n || mi, t, e);
};
te.prototype.removeListener = function(t, e) {
  this._eventBus.off(e || mi, t);
};
te.prototype.hasModifier = Nu;
te.prototype.isCmd = Ee;
te.prototype.isShift = $r;
te.prototype.isKey = ue;
var Ku = 500;
function Vr(t, e) {
  var n = this;
  t.on("editorActions.init", Ku, function(i) {
    var r = i.editorActions;
    n.registerBindings(e, r);
  });
}
Vr.$inject = [
  "eventBus",
  "keyboard"
];
Vr.prototype.registerBindings = function(t, e) {
  function n(i, r) {
    e.isRegistered(i) && t.addListener(r);
  }
  n("undo", function(i) {
    var r = i.keyEvent;
    if (Wu(r))
      return e.trigger("undo"), !0;
  }), n("redo", function(i) {
    var r = i.keyEvent;
    if (zu(r))
      return e.trigger("redo"), !0;
  }), n("copy", function(i) {
    var r = i.keyEvent;
    if (Hu(r))
      return e.trigger("copy"), !0;
  }), n("paste", function(i) {
    var r = i.keyEvent;
    if (Bu(r))
      return e.trigger("paste"), !0;
  }), n("stepZoom", function(i) {
    var r = i.keyEvent;
    if (ue(["+", "Add", "="], r) && Ee(r))
      return e.trigger("stepZoom", { value: 1 }), !0;
  }), n("stepZoom", function(i) {
    var r = i.keyEvent;
    if (ue(["-", "Subtract"], r) && Ee(r))
      return e.trigger("stepZoom", { value: -1 }), !0;
  }), n("zoom", function(i) {
    var r = i.keyEvent;
    if (ue("0", r) && Ee(r))
      return e.trigger("zoom", { value: 1 }), !0;
  }), n("removeSelection", function(i) {
    var r = i.keyEvent;
    if (ue(["Backspace", "Delete", "Del"], r))
      return e.trigger("removeSelection"), !0;
  });
};
const Gr = {
  __init__: ["keyboard", "keyboardBindings"],
  keyboard: ["type", te],
  keyboardBindings: ["type", Vr]
};
var $u = /^djs-cursor-.*$/;
function _i(t) {
  var e = fe(document.body);
  e.removeMatching($u), t && e.add("djs-cursor-" + t);
}
function ja() {
  _i(null);
}
var Vu = 5e3;
function Da(t, e) {
  e = e || "element.click";
  function n() {
    return !1;
  }
  return t.once(e, Vu, n), function() {
    t.off(e, n);
  };
}
function Vo(t) {
  return {
    x: t.x + t.width / 2,
    y: t.y + t.height / 2
  };
}
function pt(t, e) {
  return {
    x: t.x - e.x,
    y: t.y - e.y
  };
}
function Go(t) {
  !t || typeof t.stopPropagation != "function" || t.stopPropagation();
}
function Ft(t) {
  return t.originalEvent || t.srcEvent;
}
function Wi(t) {
  Go(t), Go(Ft(t));
}
function Nt(t) {
  return t.pointers && t.pointers.length && (t = t.pointers[0]), t.touches && t.touches.length && (t = t.touches[0]), t ? {
    x: t.clientX,
    y: t.clientY
  } : null;
}
var Gu = 15;
function La(t, e) {
  var n;
  function i(a) {
    return s(a.originalEvent);
  }
  t.on("canvas.focus.changed", function(a) {
    a.focused ? t.on("element.mousedown", 500, i) : t.off("element.mousedown", i);
  });
  function r(a) {
    var c = n.start, u = n.button, l = Nt(a), d = pt(l, c);
    if (!n.dragging && qu(d) > Gu && (n.dragging = !0, u === 0 && Da(t), _i("grab")), n.dragging) {
      var h = n.last || n.start;
      d = pt(l, h), e.scroll({
        dx: d.x,
        dy: d.y
      }), n.last = l;
    }
    a.preventDefault();
  }
  function o(a) {
    N.unbind(document, "mousemove", r), N.unbind(document, "mouseup", o), n = null, ja();
  }
  function s(a) {
    if (!wn(a.target, ".djs-draggable")) {
      var c = a.button;
      if (!(c >= 2 || a.ctrlKey || a.shiftKey || a.altKey))
        return n = {
          button: c,
          start: Nt(a)
        }, N.bind(document, "mousemove", r), N.bind(document, "mouseup", o), !0;
    }
  }
  this.isActive = function() {
    return !!n;
  };
}
La.$inject = [
  "eventBus",
  "canvas"
];
function qu(t) {
  return Math.sqrt(Math.pow(t.x, 2) + Math.pow(t.y, 2));
}
const Xu = {
  __init__: ["moveCanvas"],
  moveCanvas: ["type", La]
};
var Ju = {
  moveSpeed: 50,
  moveSpeedAccelerated: 200
};
function Na(t, e, n) {
  var i = this;
  this._config = T({}, Ju, t || {}), e.addListener(r);
  function r(o) {
    var s = o.keyEvent, a = i._config;
    if (e.isCmd(s) && e.isKey([
      "ArrowLeft",
      "Left",
      "ArrowUp",
      "Up",
      "ArrowDown",
      "Down",
      "ArrowRight",
      "Right"
    ], s)) {
      var c = e.isShift(s) ? a.moveSpeedAccelerated : a.moveSpeed, u;
      switch (s.key) {
        case "ArrowLeft":
        case "Left":
          u = "left";
          break;
        case "ArrowUp":
        case "Up":
          u = "up";
          break;
        case "ArrowRight":
        case "Right":
          u = "right";
          break;
        case "ArrowDown":
        case "Down":
          u = "down";
          break;
      }
      return i.moveCanvas({
        speed: c,
        direction: u
      }), !0;
    }
  }
  this.moveCanvas = function(o) {
    var s = 0, a = 0, c = o.speed, u = c / Math.min(Math.sqrt(n.viewbox().scale), 1);
    switch (o.direction) {
      case "left":
        s = u;
        break;
      case "up":
        a = u;
        break;
      case "right":
        s = -u;
        break;
      case "down":
        a = -u;
        break;
    }
    n.scroll({
      dx: s,
      dy: a
    });
  };
}
Na.$inject = [
  "config.keyboardMove",
  "keyboard",
  "canvas"
];
const Qu = {
  __depends__: [
    Gr
  ],
  __init__: ["keyboardMove"],
  keyboardMove: ["type", Na]
};
function er(t) {
  return Math.log(t) / Math.log(10);
}
function Ha(t, e) {
  var n = er(t.min), i = er(t.max), r = Math.abs(n) + Math.abs(i);
  return r / e;
}
function Yu(t, e) {
  return Math.max(t.min, Math.min(t.max, e));
}
function Ba() {
  return /mac/i.test(navigator.platform);
}
var Zu = Math.sign || function(t) {
  return t >= 0 ? 1 : -1;
}, qr = { min: 0.2, max: 4 }, Wa = 10, el = 0.1, tl = 0.75;
function Se(t, e, n) {
  t = t || {}, this._enabled = !1, this._canvas = n, this._container = n._container, this._handleWheel = Br(this._handleWheel, this), this._totalDelta = 0, this._scale = t.scale || tl;
  var i = this;
  e.on("canvas.focus.changed", function(r) {
    i._init(r.focused && t.enabled !== !1);
  });
}
Se.$inject = [
  "config.zoomScroll",
  "eventBus",
  "canvas"
];
Se.prototype.scroll = function(e) {
  this._canvas.scroll(e);
};
Se.prototype.reset = function() {
  this._canvas.zoom("fit-viewport");
};
Se.prototype.zoom = function(e, n) {
  var i = Ha(qr, Wa * 2);
  this._totalDelta += e, Math.abs(this._totalDelta) > el && (this._zoom(e, n, i), this._totalDelta = 0);
};
Se.prototype._handleWheel = function(e) {
  if (this._canvas.isFocused()) {
    var n = this._container;
    e.preventDefault();
    var i = e.ctrlKey || Ba() && e.metaKey, r = e.shiftKey, o = -1 * this._scale, s;
    if (i ? o *= e.deltaMode === 0 ? 0.02 : 0.32 : o *= e.deltaMode === 0 ? 1 : 16, i) {
      var a = n.getBoundingClientRect(), c = {
        x: e.clientX - a.left,
        y: e.clientY - a.top
      };
      s = Math.sqrt(
        Math.pow(e.deltaY, 2) + Math.pow(e.deltaX, 2)
      ) * Zu(e.deltaY) * o, this.zoom(s, c);
    } else
      r ? s = {
        dx: o * e.deltaY,
        dy: 0
      } : s = {
        dx: o * e.deltaX,
        dy: o * e.deltaY
      }, this.scroll(s);
  }
};
Se.prototype.stepZoom = function(e, n) {
  var i = Ha(qr, Wa);
  this._zoom(e, n, i);
};
Se.prototype._zoom = function(t, e, n) {
  var i = this._canvas, r = t > 0 ? 1 : -1, o = er(i.zoom()), s = Math.round(o / n) * n;
  s += n * r;
  var a = Math.pow(10, s);
  i.zoom(Yu(qr, a), e);
};
Se.prototype.toggle = function(e) {
  var n = this._container, i = this._handleWheel, r = this._enabled;
  return typeof e > "u" && (e = !r), r !== e && N[e ? "bind" : "unbind"](n, "wheel", i, !1), this._enabled = e, e;
};
Se.prototype._init = function(t) {
  this.toggle(t);
};
const nl = {
  __init__: ["zoomScroll"],
  zoomScroll: ["type", Se]
};
function za(t, e) {
  return (Ft(t) || t).button === e;
}
function Ke(t) {
  return za(t, 0);
}
function il(t) {
  return za(t, 1);
}
function ii(t) {
  var e = Ft(t) || t;
  return Ke(t) ? Ba() ? e.metaKey : e.ctrlKey : !1;
}
function ri(t) {
  var e = Ft(t) || t;
  return Ke(t) && e.shiftKey;
}
function tr(t) {
  return t.flat().join(",").replace(/,?([A-Za-z]),?/g, "$1");
}
function rl(t) {
  return ["M", t.x, t.y];
}
function zi(t) {
  return ["L", t.x, t.y];
}
function ol(t, e, n) {
  return ["C", t.x, t.y, e.x, e.y, n.x, n.y];
}
function sl(t, e) {
  const n = t.length, i = [rl(t[0])];
  for (let r = 1; r < n; r++) {
    const o = t[r - 1], s = t[r], a = t[r + 1];
    if (!a || !e) {
      i.push(zi(s));
      continue;
    }
    const c = Math.min(
      e,
      nr(s.x - o.x, s.y - o.y),
      nr(a.x - s.x, a.y - s.y)
    );
    if (!c) {
      i.push(zi(s));
      continue;
    }
    const u = Bn(s, o, c), l = Bn(s, o, c * 0.5), d = Bn(s, a, c), h = Bn(s, a, c * 0.5);
    i.push(zi(u)), i.push(ol(l, h, d));
  }
  return i;
}
function Bn(t, e, n) {
  const i = e.x - t.x, r = e.y - t.y, o = nr(i, r), s = n / o;
  return {
    x: t.x + i * s,
    y: t.y + r * s
  };
}
function nr(t, e) {
  return Math.sqrt(Math.pow(t, 2) + Math.pow(e, 2));
}
function oi(t, e, n) {
  j(e) && (n = e, e = null), e || (e = {});
  const i = D("path", e);
  return j(n) && (i.dataset.cornerRadius = String(n)), Ua(i, t);
}
function Ua(t, e) {
  const n = parseInt(t.dataset.cornerRadius, 10) || 0;
  return k(t, {
    d: tr(sl(e, n))
  }), t;
}
function al(t) {
  return !0;
}
function Wn(t) {
  return Ke(t) || il(t);
}
var qo = 500;
function Fa(t, e, n) {
  var i = this;
  function r(b, C, O) {
    if (!a(b, C)) {
      var M, P, J;
      O ? P = e.getGraphics(O) : (M = C.delegateTarget || C.target, M && (P = M, O = e.get(P))), !(!P || !O) && (J = t.fire(b, {
        element: O,
        gfx: P,
        originalEvent: C
      }), J === !1 && (C.stopPropagation(), C.preventDefault()));
    }
  }
  var o = {};
  function s(b) {
    return o[b];
  }
  function a(b, C) {
    var O = u[b] || Ke;
    return !O(C);
  }
  var c = {
    click: "element.click",
    contextmenu: "element.contextmenu",
    dblclick: "element.dblclick",
    mousedown: "element.mousedown",
    mousemove: "element.mousemove",
    mouseover: "element.hover",
    mouseout: "element.out",
    mouseup: "element.mouseup"
  }, u = {
    "element.contextmenu": al,
    "element.mousedown": Wn,
    "element.mouseup": Wn,
    "element.click": Wn,
    "element.dblclick": Wn
  };
  function l(b, C, O) {
    var M = c[b];
    if (!M)
      throw new Error("unmapped DOM event name <" + b + ">");
    return r(M, C, O);
  }
  var d = "svg, .djs-element";
  function h(b, C, O, M) {
    var P = o[O] = function(J) {
      r(O, J);
    };
    M && (u[O] = M), P.$delegate = We.bind(b, d, C, P);
  }
  function f(b, C, O) {
    var M = s(O);
    M && We.unbind(b, C, M.$delegate);
  }
  function p(b) {
    A(c, function(C, O) {
      h(b, O, C);
    });
  }
  function m(b) {
    A(c, function(C, O) {
      f(b, O, C);
    });
  }
  t.on("canvas.destroy", function(b) {
    m(b.svg);
  }), t.on("canvas.init", function(b) {
    p(b.svg);
  }), t.on(["shape.added", "connection.added"], function(b) {
    var C = b.element, O = b.gfx;
    t.fire("interactionEvents.createHit", { element: C, gfx: O });
  }), t.on([
    "shape.changed",
    "connection.changed"
  ], qo, function(b) {
    var C = b.element, O = b.gfx;
    t.fire("interactionEvents.updateHit", { element: C, gfx: O });
  }), t.on("interactionEvents.createHit", qo, function(b) {
    var C = b.element, O = b.gfx;
    i.createDefaultHit(C, O);
  }), t.on("interactionEvents.updateHit", function(b) {
    var C = b.element, O = b.gfx;
    i.updateDefaultHit(C, O);
  });
  var g = _("djs-hit djs-hit-stroke"), E = _("djs-hit djs-hit-click-stroke"), x = _("djs-hit djs-hit-all"), y = _("djs-hit djs-hit-no-move"), v = {
    all: x,
    "click-stroke": E,
    stroke: g,
    "no-move": y
  };
  function _(b, C) {
    return C = T({
      stroke: "white",
      strokeWidth: 15
    }, C || {}), n.cls(b, ["no-fill", "no-border"], C);
  }
  function w(b, C) {
    var O = v[C];
    if (!O)
      throw new Error("invalid hit type <" + C + ">");
    return k(b, O), b;
  }
  function R(b, C) {
    I(b, C);
  }
  this.removeHits = function(b) {
    var C = Yi(".djs-hit", b);
    A(C, Y);
  }, this.createDefaultHit = function(b, C) {
    var O = b.waypoints, M = b.isFrame, P;
    return O ? this.createWaypointsHit(C, O) : (P = M ? "stroke" : "all", this.createBoxHit(C, P, {
      width: b.width,
      height: b.height
    }));
  }, this.createWaypointsHit = function(b, C) {
    var O = oi(C);
    return w(O, "stroke"), R(b, O), O;
  }, this.createBoxHit = function(b, C, O) {
    O = T({
      x: 0,
      y: 0
    }, O);
    var M = D("rect");
    return w(M, C), k(M, O), R(b, M), M;
  }, this.updateDefaultHit = function(b, C) {
    var O = ee(".djs-hit", C);
    if (O)
      return b.waypoints ? Ua(O, b.waypoints) : k(O, {
        width: b.width,
        height: b.height
      }), O;
  }, this.fire = r, this.triggerMouseEvent = l, this.mouseHandler = s, this.registerEvent = h, this.unregisterEvent = f;
}
Fa.$inject = [
  "eventBus",
  "elementRegistry",
  "styles"
];
const Ka = {
  __init__: ["interactionEvents"],
  interactionEvents: ["type", Fa]
};
function Kt(t, e) {
  this._eventBus = t, this._canvas = e, this._selectedElements = [];
  var n = this;
  t.on(["shape.remove", "connection.remove"], function(i) {
    var r = i.element;
    n.deselect(r);
  }), t.on(["diagram.clear", "root.set"], function(i) {
    n.select(null);
  });
}
Kt.$inject = ["eventBus", "canvas"];
Kt.prototype.deselect = function(t) {
  var e = this._selectedElements, n = e.indexOf(t);
  if (n !== -1) {
    var i = e.slice();
    e.splice(n, 1), this._eventBus.fire("selection.changed", { oldSelection: i, newSelection: e });
  }
};
Kt.prototype.get = function() {
  return this._selectedElements;
};
Kt.prototype.isSelected = function(t) {
  return this._selectedElements.indexOf(t) !== -1;
};
Kt.prototype.select = function(t, e) {
  var n = this._selectedElements, i = n.slice();
  L(t) || (t = t ? [t] : []);
  var r = this._canvas, o = r.getRootElement();
  t = t.filter(function(s) {
    var a = r.findRoot(s);
    return o === a;
  }), e ? A(t, function(s) {
    n.indexOf(s) === -1 && n.push(s);
  }) : this._selectedElements = n = t.slice(), this._eventBus.fire("selection.changed", { oldSelection: i, newSelection: n });
};
var Xo = "hover", Jo = "selected";
function $a(t, e) {
  this._canvas = t;
  function n(r, o) {
    t.addMarker(r, o);
  }
  function i(r, o) {
    t.removeMarker(r, o);
  }
  e.on("element.hover", function(r) {
    n(r.element, Xo);
  }), e.on("element.out", function(r) {
    i(r.element, Xo);
  }), e.on("selection.changed", function(r) {
    function o(u) {
      i(u, Jo);
    }
    function s(u) {
      n(u, Jo);
    }
    var a = r.oldSelection, c = r.newSelection;
    A(a, function(u) {
      c.indexOf(u) === -1 && o(u);
    }), A(c, function(u) {
      a.indexOf(u) === -1 && s(u);
    });
  });
}
$a.$inject = [
  "canvas",
  "eventBus"
];
function Va(t, e, n, i) {
  t.on("create.end", 500, function(r) {
    var o = r.context, s = o.canExecute, a = o.elements, c = o.hints || {}, u = c.autoSelect;
    if (s) {
      if (u === !1)
        return;
      L(u) ? e.select(u) : e.select(a.filter(cl));
    }
  }), t.on("connect.end", 500, function(r) {
    var o = r.context, s = o.connection;
    s && e.select(s);
  }), t.on("shape.move.end", 500, function(r) {
    var o = r.previousSelection || [], s = i.get(r.context.shape.id), a = de(o, function(c) {
      return s.id === c.id;
    });
    a || e.select(s);
  }), t.on("element.click", function(r) {
    if (Ke(r)) {
      var o = r.element;
      o === n.getRootElement() && (o = null);
      var s = e.isSelected(o), a = e.get().length > 1, c = ri(r);
      if (s && a)
        return c ? e.deselect(o) : e.select(o);
      s ? e.deselect(o) : e.select(o, c);
    }
  });
}
Va.$inject = [
  "eventBus",
  "selection",
  "canvas",
  "elementRegistry"
];
function cl(t) {
  return !t.hidden;
}
const $t = {
  __init__: ["selectionVisuals", "selectionBehavior"],
  __depends__: [
    Ka
  ],
  selection: ["type", Kt],
  selectionVisuals: ["type", $a],
  selectionBehavior: ["type", Va]
};
function Ga(t) {
  return we(t, function(e) {
    return !de(t, function(n) {
      return n !== e && qa(e, n);
    });
  });
}
function qa(t, e) {
  if (e) {
    if (t === e)
      return e;
    if (t.parent)
      return qa(t.parent, e);
  }
}
function Qo(t, e, n) {
  var i = !0;
  return t.push(e), i;
}
function xi(t, e, n) {
  n = n || 0, L(t) || (t = [t]), A(t, function(i, r) {
    var o = e(i, r, n);
    L(o) && o.length && xi(o, e, n + 1);
  });
}
function ul(t, e, n) {
  var i = [], r = [];
  return xi(t, function(o, s, a) {
    Qo(i, o);
    var c = o.children;
    if (c && Qo(r, c))
      return c;
  }), i;
}
function Xa(t, e) {
  return ul(t);
}
function ll(t, e, n) {
  Ca(e) && (e = !0), ie(e) && (n = e, e = !0), n = n || {};
  var i = en(n.allShapes), r = en(n.allConnections), o = en(n.enclosedElements), s = en(n.enclosedConnections), a = en(
    n.topLevel,
    e && Wr(t, function(l) {
      return l.id;
    })
  );
  function c(l) {
    a[l.source.id] && a[l.target.id] && (a[l.id] = [l]), i[l.source.id] && i[l.target.id] && (s[l.id] = o[l.id] = l), r[l.id] = l;
  }
  function u(l) {
    if (o[l.id] = l, l.waypoints)
      s[l.id] = r[l.id] = l;
    else
      return i[l.id] = l, A(l.incoming, c), A(l.outgoing, c), l.children;
  }
  return xi(t, u), {
    allShapes: i,
    allConnections: r,
    topLevel: a,
    enclosedConnections: s,
    enclosedElements: o
  };
}
function le(t, e) {
  e = !!e, L(t) || (t = [t]);
  var n, i, r, o;
  return A(t, function(s) {
    var a = s;
    s.waypoints && !e && (a = le(s.waypoints, !0));
    var c = a.x, u = a.y, l = a.height || 0, d = a.width || 0;
    (c < n || n === void 0) && (n = c), (u < i || i === void 0) && (i = u), (c + d > r || r === void 0) && (r = c + d), (u + l > o || o === void 0) && (o = u + l);
  }), {
    x: n,
    y: i,
    height: o - i,
    width: r - n
  };
}
function dl(t, e) {
  var n = {};
  return A(t, function(i) {
    var r = i;
    r.waypoints && (r = le(r)), !j(e.y) && r.x > e.x && (n[i.id] = i), !j(e.x) && r.y > e.y && (n[i.id] = i), r.x > e.x && r.y > e.y && (j(e.width) && j(e.height) && r.width + r.x < e.width + e.x && r.height + r.y < e.height + e.y || !j(e.width) || !j(e.height)) && (n[i.id] = i);
  }), n;
}
function hl(t) {
  return "waypoints" in t ? "connection" : "x" in t ? "shape" : "root";
}
function en(t, e) {
  return T({}, t || {}, e || {});
}
var fl = 500, pl = 1e3;
function st(t, e) {
  this._eventBus = t, this.offset = 5;
  var n = e.cls("djs-outline", ["no-fill"]), i = this;
  function r(o) {
    var s = D("rect");
    return k(s, T({
      x: 0,
      y: 0,
      rx: 4,
      width: 100,
      height: 100
    }, n)), s;
  }
  t.on(["shape.added", "shape.changed"], fl, function(o) {
    var s = o.element, a = o.gfx, c = ee(".djs-outline", a);
    c || (c = i.getOutline(s) || r(), I(a, c)), i.updateShapeOutline(c, s);
  }), t.on(["connection.added", "connection.changed"], function(o) {
    var s = o.element, a = o.gfx, c = ee(".djs-outline", a);
    c || (c = r(), I(a, c)), i.updateConnectionOutline(c, s);
  });
}
st.prototype.updateShapeOutline = function(t, e) {
  var n = !1, i = this._getProviders();
  i.length && A(i, function(r) {
    n = n || r.updateOutline(e, t);
  }), n || k(t, {
    x: -this.offset,
    y: -this.offset,
    width: e.width + this.offset * 2,
    height: e.height + this.offset * 2
  });
};
st.prototype.updateConnectionOutline = function(t, e) {
  var n = le(e);
  k(t, {
    x: n.x - this.offset,
    y: n.y - this.offset,
    width: n.width + this.offset * 2,
    height: n.height + this.offset * 2
  });
};
st.prototype.registerProvider = function(t, e) {
  e || (e = t, t = pl), this._eventBus.on("outline.getProviders", t, function(n) {
    n.providers.push(e);
  });
};
st.prototype._getProviders = function() {
  var t = this._eventBus.createEvent({
    type: "outline.getProviders",
    providers: []
  });
  return this._eventBus.fire(t), t.providers;
};
st.prototype.getOutline = function(t) {
  var e, n = this._getProviders();
  return A(n, function(i) {
    Z(i.getOutline) && (e = e || i.getOutline(t));
  }), e;
};
st.$inject = ["eventBus", "styles", "elementRegistry"];
var zn = 6;
function Xr(t, e, n) {
  this._canvas = e;
  var i = this;
  t.on("element.changed", function(r) {
    n.isSelected(r.element) && i._updateMultiSelectionOutline(n.get());
  }), t.on("selection.changed", function(r) {
    var o = r.newSelection;
    i._updateMultiSelectionOutline(o);
  });
}
Xr.prototype._updateMultiSelectionOutline = function(t) {
  var e = this._canvas.getLayer("selectionOutline");
  Ur(e);
  var n = t.length > 1, i = this._canvas.getContainer();
  if (H(i)[n ? "add" : "remove"]("djs-multi-select"), !!n) {
    var r = gl(le(t)), o = D("rect");
    k(o, T({
      rx: 3
    }, r)), H(o).add("djs-selection-outline"), I(e, o);
  }
};
Xr.$inject = ["eventBus", "canvas", "selection"];
function gl(t) {
  return {
    x: t.x - zn,
    y: t.y - zn,
    width: t.width + zn * 2,
    height: t.height + zn * 2
  };
}
const yl = {
  __depends__: [
    $t
  ],
  __init__: ["outline", "multiSelectionOutline"],
  outline: ["type", st],
  multiSelectionOutline: ["type", Xr]
};
function Jr(t) {
  this._commandStack = t.get("commandStack", !1);
}
Jr.$inject = ["injector"];
Jr.prototype.allowed = function(t, e) {
  var n = !0, i = this._commandStack;
  return i && (n = i.canExecute(t, e)), n === void 0 ? !0 : n;
};
const ke = {
  __init__: ["rules"],
  rules: ["type", Jr]
};
var Yo = 1500;
function Ja(t, e, n) {
  var i = this, r = n.get("dragging", !1);
  function o(s) {
    if (!s.hover) {
      var a = s.originalEvent, c = i._findTargetGfx(a), u = c && t.get(c);
      c && u && (s.stopPropagation(), r.hover({ element: u, gfx: c }), r.move(a));
    }
  }
  r && e.on("drag.start", function(s) {
    e.once("drag.move", Yo, function(a) {
      o(a);
    });
  }), function() {
    var s, a;
    e.on("element.hover", function(c) {
      s = c.gfx, a = c.element;
    }), e.on("element.hover", Yo, function(c) {
      a && e.fire("element.out", {
        element: a,
        gfx: s
      });
    }), e.on("element.out", function() {
      s = null, a = null;
    });
  }(), this._findTargetGfx = function(s) {
    var a, c;
    if (s instanceof MouseEvent)
      return a = Nt(s), c = document.elementFromPoint(a.x, a.y), vl(c);
  };
}
Ja.$inject = [
  "elementRegistry",
  "eventBus",
  "injector"
];
function vl(t) {
  return wn(t, "svg, .djs-element", !0);
}
const ml = {
  __init__: [
    "hoverFix"
  ],
  hoverFix: ["type", Ja]
};
var ht = Math.round, Zo = "djs-drag-active";
function Ze(t) {
  t.preventDefault();
}
function _l(t) {
  return typeof TouchEvent < "u" && t instanceof TouchEvent;
}
function xl(t) {
  return Math.sqrt(Math.pow(t.x, 2) + Math.pow(t.y, 2));
}
function Qa(t, e, n, i) {
  var r = {
    threshold: 5,
    trapClick: !0
  }, o;
  function s(y) {
    var v = e.viewbox(), _ = e._container.getBoundingClientRect();
    return {
      x: v.x + (y.x - _.left) / v.scale,
      y: v.y + (y.y - _.top) / v.scale
    };
  }
  function a(y, v) {
    v = v || o;
    var _ = t.createEvent(
      T(
        {},
        v.payload,
        v.data,
        { isTouch: v.isTouch }
      )
    );
    return t.fire("drag." + y, _) === !1 ? !1 : t.fire(v.prefix + "." + y, _);
  }
  function c(y) {
    var v = y.filter(function(_) {
      return i.get(_.id);
    });
    v.length && n.select(v);
  }
  function u(y, v) {
    var _ = o.payload, w = o.displacement, R = o.globalStart, b = Nt(y), C = pt(b, R), O = o.localStart, M = s(b), P = pt(M, O);
    if (!o.active && (v || xl(C) > o.threshold)) {
      if (T(_, {
        x: ht(O.x + w.x),
        y: ht(O.y + w.y),
        dx: 0,
        dy: 0
      }, { originalEvent: y }), a("start") === !1)
        return g();
      o.active = !0, o.keepSelection || (_.previousSelection = n.get(), n.select(null)), o.cursor && _i(o.cursor), e.addMarker(e.getRootElement(), Zo);
    }
    Wi(y), o.active && (T(_, {
      x: ht(M.x + w.x),
      y: ht(M.y + w.y),
      dx: ht(P.x),
      dy: ht(P.y)
    }, { originalEvent: y }), a("move"));
  }
  function l(y) {
    var v, _ = !0;
    o.active && (y && (o.payload.originalEvent = y, Wi(y)), _ = a("end")), _ === !1 && a("rejected"), v = E(_ !== !0), a("ended", v);
  }
  function d(y) {
    ue("Escape", y) && (Ze(y), g());
  }
  function h(y) {
    var v;
    o.active && (v = Da(t), setTimeout(v, 400), Ze(y)), l(y);
  }
  function f(y) {
    u(y);
  }
  function p(y) {
    var v = o.payload;
    v.hoverGfx = y.gfx, v.hover = y.element, a("hover");
  }
  function m(y) {
    a("out");
    var v = o.payload;
    v.hoverGfx = null, v.hover = null;
  }
  function g(y) {
    var v;
    if (o) {
      var _ = o.active;
      _ && a("cancel"), v = E(y), _ && a("canceled", v);
    }
  }
  function E(y) {
    var v, _;
    a("cleanup"), ja(), o.trapClick ? _ = h : _ = l, N.unbind(document, "mousemove", u), N.unbind(document, "dragstart", Ze), N.unbind(document, "selectstart", Ze), N.unbind(document, "mousedown", _, !0), N.unbind(document, "mouseup", _, !0), N.unbind(document, "keyup", d), N.unbind(document, "touchstart", f, !0), N.unbind(document, "touchcancel", g, !0), N.unbind(document, "touchmove", u, !0), N.unbind(document, "touchend", l, !0), t.off("element.hover", p), t.off("element.out", m), e.removeMarker(e.getRootElement(), Zo);
    var w = o.payload.previousSelection;
    return y !== !1 && w && !n.get().length && c(w), v = o, o = null, v;
  }
  function x(y, v, _, w) {
    o && g(!1), typeof v == "string" && (w = _, _ = v, v = null), w = T({}, r, w || {});
    var R = w.data || {}, b, C, O, M, P;
    w.trapClick ? M = h : M = l, y ? (b = Ft(y) || y, C = Nt(y), Wi(y), b.type === "dragstart" && Ze(b)) : (b = null, C = { x: 0, y: 0 }), O = s(C), v || (v = O), P = _l(b), o = T({
      prefix: _,
      data: R,
      payload: {},
      globalStart: C,
      displacement: pt(v, O),
      localStart: O,
      isTouch: P
    }, w), w.manual || (P ? (N.bind(document, "touchstart", f, !0), N.bind(document, "touchcancel", g, !0), N.bind(document, "touchmove", u, !0), N.bind(document, "touchend", l, !0)) : (N.bind(document, "mousemove", u), N.bind(document, "dragstart", Ze), N.bind(document, "selectstart", Ze), N.bind(document, "mousedown", M, !0), N.bind(document, "mouseup", M, !0)), N.bind(document, "keyup", d), t.on("element.hover", p), t.on("element.out", m)), a("init"), w.autoActivate && u(y, !0);
  }
  t.on("diagram.destroy", g), this.init = x, this.move = u, this.hover = p, this.out = m, this.end = l, this.cancel = g, this.context = function() {
    return o;
  }, this.setOptions = function(y) {
    T(r, y);
  };
}
Qa.$inject = [
  "eventBus",
  "canvas",
  "selection",
  "elementRegistry"
];
const at = {
  __depends__: [
    ml,
    $t
  ],
  dragging: ["type", Qa]
};
function ir(t) {
  return t.childNodes[0];
}
function Qr(t) {
  this._counter = 0, this._prefix = (t ? t + "-" : "") + Math.floor(Math.random() * 1e9) + "-";
}
Qr.prototype.next = function() {
  return this._prefix + ++this._counter;
};
const bl = new Qr("ps");
var El = [
  "marker-start",
  "marker-mid",
  "marker-end"
], wl = [
  "circle",
  "ellipse",
  "line",
  "path",
  "polygon",
  "polyline",
  "path",
  "rect"
];
function $e(t, e, n, i) {
  this._elementRegistry = t, this._canvas = n, this._styles = i;
}
$e.$inject = [
  "elementRegistry",
  "eventBus",
  "canvas",
  "styles"
];
$e.prototype.cleanUp = function() {
  console.warn("PreviewSupport#cleanUp is deprecated and will be removed in future versions. You do not need to manually clean up previews anymore. cf. https://github.com/bpmn-io/diagram-js/pull/906");
};
$e.prototype.getGfx = function(t) {
  return this._elementRegistry.getGraphics(t);
};
$e.prototype.addDragger = function(t, e, n, i = "djs-dragger") {
  n = n || this.getGfx(t);
  var r = Ra(n), o = n.getBoundingClientRect();
  return this._cloneMarkers(ir(r), i), k(r, this._styles.cls(i, [], {
    x: o.top,
    y: o.left
  })), I(e, r), k(r, "data-preview-support-element-id", t.id), r;
};
$e.prototype.addFrame = function(t, e) {
  var n = D("rect", {
    class: "djs-resize-overlay",
    width: t.width,
    height: t.height,
    x: t.x,
    y: t.y
  });
  return I(e, n), k(n, "data-preview-support-element-id", t.id), n;
};
$e.prototype._cloneMarkers = function(t, e = "djs-dragger", n = t) {
  var i = this;
  t.childNodes && t.childNodes.forEach((r) => {
    i._cloneMarkers(r, e, n);
  }), Ol(t) && El.forEach(function(r) {
    if (k(t, r)) {
      var o = Sl(t, r, i._canvas.getContainer());
      o && i._cloneMarker(n, t, o, r, e);
    }
  });
};
$e.prototype._cloneMarker = function(t, e, n, i, r = "djs-dragger") {
  var o = [n.id, r, bl.next()].join("-"), s = ee("marker#" + n.id, t);
  t = t || this._canvas._svg;
  var a = s || Ra(n);
  a.id = o, H(a).add(r);
  var c = ee(":scope > defs", t);
  c || (c = D("defs"), I(t, c)), I(c, a);
  var u = Cl(a.id);
  k(e, i, u);
};
function Sl(t, e, n) {
  var i = Al(k(t, e));
  return ee("marker#" + i, n || document);
}
function Al(t) {
  return t.match(/url\(['"]?#([^'"]*)['"]?\)/)[1];
}
function Cl(t) {
  return "url(#" + t + ")";
}
function Ol(t) {
  return wl.indexOf(t.nodeName) !== -1;
}
const bi = {
  __init__: ["previewSupport"],
  previewSupport: ["type", $e]
};
var Tl = 500, Rl = 1250, kl = 1500, si = Math.round;
function Pl(t) {
  return {
    x: t.x + si(t.width / 2),
    y: t.y + si(t.height / 2)
  };
}
function Ya(t, e, n, i, r) {
  function o(a, c, u, l) {
    return r.allowed("elements.move", {
      shapes: a,
      delta: c,
      position: u,
      target: l
    });
  }
  t.on("shape.move.start", kl, function(a) {
    var c = a.context, u = a.shape, l = i.get().slice();
    l.indexOf(u) === -1 && (l = [u]), l = Ml(l), T(c, {
      shapes: l,
      validatedShapes: l,
      shape: u
    });
  }), t.on("shape.move.start", Rl, function(a) {
    var c = a.context, u = c.validatedShapes, l;
    if (l = c.canExecute = o(u), !l)
      return !1;
  }), t.on("shape.move.move", Tl, function(a) {
    var c = a.context, u = c.validatedShapes, l = a.hover, d = { x: a.dx, y: a.dy }, h = { x: a.x, y: a.y }, f;
    if (f = o(u, d, h, l), c.delta = d, c.canExecute = f, f === null) {
      c.target = null;
      return;
    }
    c.target = l;
  }), t.on("shape.move.end", function(a) {
    var c = a.context, u = c.delta, l = c.canExecute, d = l === "attach", h = c.shapes;
    if (l === !1)
      return !1;
    u.x = si(u.x), u.y = si(u.y), !(u.x === 0 && u.y === 0) && n.moveElements(h, u, c.target, {
      primaryShape: c.shape,
      attach: d
    });
  }), t.on("element.mousedown", function(a) {
    if (Ke(a)) {
      var c = Ft(a);
      if (!c)
        throw new Error("must supply DOM mousedown event");
      return s(c, a.element);
    }
  });
  function s(a, c, u, l) {
    if (ie(u) && (l = u, u = !1), !(c.waypoints || !c.parent) && !H(a.target).has("djs-hit-no-move")) {
      var d = Pl(c);
      return e.init(a, d, "shape.move", {
        cursor: "grabbing",
        autoActivate: u,
        data: {
          shape: c,
          context: l || {}
        }
      }), !0;
    }
  }
  this.start = s;
}
Ya.$inject = [
  "eventBus",
  "dragging",
  "modeling",
  "selection",
  "rules"
];
function Ml(t) {
  var e = Wr(t, "id");
  return we(t, function(n) {
    for (; n = n.parent; )
      if (e[n.id])
        return !1;
    return !0;
  });
}
function Il(t, e, n, i, r) {
  var o = dn();
  o.setTranslate(e, n);
  var s = dn();
  s.setRotate(0, 0, 0);
  var a = dn();
  a.setScale(1, 1), Fr(t, [o, s, a]);
}
function he(t, e, n) {
  var i = dn();
  i.setTranslate(e, n), Fr(t, i);
}
function jl(t, e) {
  var n = dn();
  n.setRotate(e, 0, 0), Fr(t, n);
}
function K(t) {
  return ie(t) && zr(t, "waypoints");
}
function ne(t) {
  return ie(t) && zr(t, "labelTarget");
}
var es = 499, Ui = "djs-dragging", ts = "drop-ok", ns = "drop-not-ok", is = "new-parent", rs = "attach-ok";
function Za(t, e, n, i) {
  function r(c) {
    var u = o(c), l = Dl(u);
    return l;
  }
  function o(c) {
    var u = Xa(c), l = u.flatMap(
      (f) => (f.incoming || []).concat(f.outgoing || [])
    ), d = u.concat(l), h = [...new Set(d)];
    return h;
  }
  function s(c, u) {
    [rs, ts, ns, is].forEach(function(l) {
      l === u ? e.addMarker(c, l) : e.removeMarker(c, l);
    });
  }
  function a(c, u, l) {
    i.addDragger(u, c.dragGroup), l && e.addMarker(u, Ui), c.allDraggedElements ? c.allDraggedElements.push(u) : c.allDraggedElements = [u];
  }
  t.on("shape.move.start", es, function(c) {
    var u = c.context, l = u.shapes, d = u.allDraggedElements, h = r(l);
    if (!u.dragGroup) {
      var f = D("g");
      k(f, n.cls("djs-drag-group", ["no-events"]));
      var p = e.getActiveLayer();
      I(p, f), u.dragGroup = f;
    }
    h.forEach(function(m) {
      i.addDragger(m, u.dragGroup);
    }), d ? d = bu([
      d,
      o(l)
    ]) : d = o(l), A(d, function(m) {
      e.addMarker(m, Ui);
    }), u.allDraggedElements = d, u.differentParents = Ll(l);
  }), t.on("shape.move.move", es, function(c) {
    var u = c.context, l = u.dragGroup, d = u.target, h = u.shape.parent, f = u.canExecute;
    d && (f === "attach" ? s(d, rs) : u.canExecute && h && d.id !== h.id ? s(d, is) : s(d, u.canExecute ? ts : ns)), he(l, c.dx, c.dy);
  }), t.on(["shape.move.out", "shape.move.cleanup"], function(c) {
    var u = c.context, l = u.target;
    l && s(l, null);
  }), t.on("shape.move.cleanup", function(c) {
    var u = c.context, l = u.allDraggedElements, d = u.dragGroup;
    A(l, function(h) {
      e.removeMarker(h, Ui);
    }), d && Y(d);
  }), this.makeDraggable = a;
}
Za.$inject = [
  "eventBus",
  "canvas",
  "styles",
  "previewSupport"
];
function Dl(t) {
  var e = we(t, function(n) {
    return K(n) ? de(t, ln({ id: n.source.id })) && de(t, ln({ id: n.target.id })) : !0;
  });
  return e;
}
function Ll(t) {
  return Eu(Wr(t, function(e) {
    return e.parent && e.parent.id;
  })) !== 1;
}
const Nl = {
  __depends__: [
    Ka,
    $t,
    yl,
    ke,
    at,
    bi
  ],
  __init__: [
    "move",
    "movePreview"
  ],
  move: ["type", Ya],
  movePreview: ["type", Za]
};
function Ei(t, e) {
  return !t || !e ? -1 : Math.sqrt(
    Math.pow(t.x - e.x, 2) + Math.pow(t.y - e.y, 2)
  );
}
function ec(t, e, n, i) {
  if (typeof i > "u" && (i = 5), !t || !e || !n)
    return !1;
  var r = (e.x - t.x) * (n.y - t.y) - (e.y - t.y) * (n.x - t.x), o = Ei(t, e);
  return Math.abs(r / o) <= i;
}
var Hl = 2;
function ft(t, e) {
  var n = Array.from(arguments).flat();
  const i = {
    x: "v",
    y: "h"
  };
  for (const [r, o] of Object.entries(i))
    if (Bl(r, n))
      return o;
  return !1;
}
function Bl(t, e) {
  const n = e[0];
  return vi(e, function(i) {
    return Math.abs(n[t] - i[t]) <= Hl;
  });
}
function rr(t, e) {
  return {
    x: Math.round(t.x + (e.x - t.x) / 2),
    y: Math.round(t.y + (e.y - t.y) / 2)
  };
}
var Wl = /,?([a-z]),?/gi, os = parseFloat, $ = Math, Le = $.PI, me = $.min, _e = $.max, ss = $.pow, ze = $.abs, zl = /([a-z])[\s,]*((-?\d*\.?\d*(?:e[-+]?\d+)?[\s]*,?[\s]*)+)/ig, Ul = /(-?\d*\.?\d*(?:e[-+]?\d+)?)[\s]*,?[\s]*/ig, ai = Array.isArray || function(t) {
  return t instanceof Array;
};
function Yr(t, e) {
  return Object.prototype.hasOwnProperty.call(t, e);
}
function hn(t) {
  if (typeof t == "function" || Object(t) !== t)
    return t;
  var e = new t.constructor();
  for (var n in t)
    Yr(t, n) && (e[n] = hn(t[n]));
  return e;
}
function Fl(t, e) {
  for (var n = 0, i = t.length; n < i; n++) if (t[n] === e)
    return t.push(t.splice(n, 1)[0]);
}
function Kl(t) {
  function e() {
    var n = Array.prototype.slice.call(arguments, 0), i = n.join("␀"), r = e.cache = e.cache || {}, o = e.count = e.count || [];
    return Yr(r, i) ? (Fl(o, i), r[i]) : (o.length >= 1e3 && delete r[o.shift()], o.push(i), r[i] = t(...arguments), r[i]);
  }
  return e;
}
function $l(t) {
  if (!t)
    return null;
  var e = Ht(t);
  if (e.arr)
    return hn(e.arr);
  var n = { a: 7, c: 6, h: 1, l: 2, m: 2, q: 4, s: 4, t: 2, v: 1, z: 0 }, i = [];
  return ai(t) && ai(t[0]) && (i = hn(t)), i.length || String(t).replace(zl, function(r, o, s) {
    var a = [], c = o.toLowerCase();
    for (s.replace(Ul, function(u, l) {
      l && a.push(+l);
    }), c == "m" && a.length > 2 && (i.push([o, ...a.splice(0, 2)]), c = "l", o = o == "m" ? "l" : "L"); a.length >= n[c] && (i.push([o, ...a.splice(0, n[c])]), !!n[c]); )
      ;
  }), i.toString = Ht.toString, e.arr = hn(i), i;
}
function Ht(t) {
  var e = Ht.ps = Ht.ps || {};
  return e[t] ? e[t].sleep = 100 : e[t] = {
    sleep: 100
  }, setTimeout(function() {
    for (var n in e)
      Yr(e, n) && n != t && (e[n].sleep--, !e[n].sleep && delete e[n]);
  }), e[t];
}
function or(t, e, n, i) {
  return arguments.length === 1 && (e = t.y, n = t.width, i = t.height, t = t.x), {
    x: t,
    y: e,
    width: n,
    height: i,
    x2: t + n,
    y2: e + i
  };
}
function tc() {
  return this.join(",").replace(Wl, "$1");
}
function ci(t) {
  var e = hn(t);
  return e.toString = tc, e;
}
function as(t, e, n, i, r, o, s, a, c) {
  var u = 1 - c, l = ss(u, 3), d = ss(u, 2), h = c * c, f = h * c, p = l * t + d * 3 * c * n + u * 3 * c * c * r + f * s, m = l * e + d * 3 * c * i + u * 3 * c * c * o + f * a;
  return {
    x: ui(p),
    y: ui(m)
  };
}
function cs(t) {
  var e = Jl(...t);
  return or(
    e.x0,
    e.y0,
    e.x1 - e.x0,
    e.y1 - e.y0
  );
}
function Ne(t, e, n) {
  return e >= t.x && e <= t.x + t.width && n >= t.y && n <= t.y + t.height;
}
function Vl(t, e) {
  return t = or(t), e = or(e), Ne(e, t.x, t.y) || Ne(e, t.x2, t.y) || Ne(e, t.x, t.y2) || Ne(e, t.x2, t.y2) || Ne(t, e.x, e.y) || Ne(t, e.x2, e.y) || Ne(t, e.x, e.y2) || Ne(t, e.x2, e.y2) || (t.x < e.x2 && t.x > e.x || e.x < t.x2 && e.x > t.x) && (t.y < e.y2 && t.y > e.y || e.y < t.y2 && e.y > t.y);
}
function us(t, e, n, i, r) {
  var o = -3 * e + 9 * n - 9 * i + 3 * r, s = t * o + 6 * e - 12 * n + 6 * i;
  return t * s - 3 * e + 3 * n;
}
function ls(t, e, n, i, r, o, s, a, c) {
  c == null && (c = 1), c = c > 1 ? 1 : c < 0 ? 0 : c;
  for (var u = c / 2, l = 12, d = [-0.1252, 0.1252, -0.3678, 0.3678, -0.5873, 0.5873, -0.7699, 0.7699, -0.9041, 0.9041, -0.9816, 0.9816], h = [0.2491, 0.2491, 0.2335, 0.2335, 0.2032, 0.2032, 0.1601, 0.1601, 0.1069, 0.1069, 0.0472, 0.0472], f = 0, p = 0; p < l; p++) {
    var m = u * d[p] + u, g = us(m, t, n, r, s), E = us(m, e, i, o, a), x = g * g + E * E;
    f += h[p] * $.sqrt(x);
  }
  return u * f;
}
function Gl(t, e, n, i, r, o, s, a) {
  if (!(_e(t, n) < me(r, s) || me(t, n) > _e(r, s) || _e(e, i) < me(o, a) || me(e, i) > _e(o, a))) {
    var c = (t * i - e * n) * (r - s) - (t - n) * (r * a - o * s), u = (t * i - e * n) * (o - a) - (e - i) * (r * a - o * s), l = (t - n) * (o - a) - (e - i) * (r - s);
    if (l) {
      var d = ui(c / l), h = ui(u / l), f = +d.toFixed(2), p = +h.toFixed(2);
      if (!(f < +me(t, n).toFixed(2) || f > +_e(t, n).toFixed(2) || f < +me(r, s).toFixed(2) || f > +_e(r, s).toFixed(2) || p < +me(e, i).toFixed(2) || p > +_e(e, i).toFixed(2) || p < +me(o, a).toFixed(2) || p > +_e(o, a).toFixed(2)))
        return { x: d, y: h };
    }
  }
}
function ui(t) {
  return Math.round(t * 1e11) / 1e11;
}
function ql(t, e, n) {
  var i = cs(t), r = cs(e);
  if (!Vl(i, r))
    return [];
  for (var o = ls(...t), s = ls(...e), a = ds(t) ? 1 : ~~(o / 5) || 1, c = ds(e) ? 1 : ~~(s / 5) || 1, u = [], l = [], d = {}, h = [], f = 0; f < a + 1; f++) {
    var p = as(...t, f / a);
    u.push({ x: p.x, y: p.y, t: f / a });
  }
  for (f = 0; f < c + 1; f++)
    p = as(...e, f / c), l.push({ x: p.x, y: p.y, t: f / c });
  for (f = 0; f < a; f++)
    for (var m = 0; m < c; m++) {
      var g = u[f], E = u[f + 1], x = l[m], y = l[m + 1], v = ze(E.x - g.x) < 0.01 ? "y" : "x", _ = ze(y.x - x.x) < 0.01 ? "y" : "x", w = Gl(g.x, g.y, E.x, E.y, x.x, x.y, y.x, y.y), R;
      if (w) {
        if (R = w.x.toFixed(9) + "#" + w.y.toFixed(9), d[R])
          continue;
        d[R] = !0;
        var b = g.t + ze((w[v] - g[v]) / (E[v] - g[v])) * (E.t - g.t), C = x.t + ze((w[_] - x[_]) / (y[_] - x[_])) * (y.t - x.t);
        b >= 0 && b <= 1 && C >= 0 && C <= 1 && h.push({
          x: w.x,
          y: w.y,
          t1: b,
          t2: C
        });
      }
    }
  return h;
}
function nc(t, e, n) {
  t = fs(t), e = fs(e);
  for (var i, r, o, s, a, c, u, l, d, h, f = n ? 0 : [], p = 0, m = t.length; p < m; p++) {
    var g = t[p];
    if (g[0] == "M")
      i = a = g[1], r = c = g[2];
    else {
      g[0] == "C" ? (d = [i, r, ...g.slice(1)], i = d[6], r = d[7]) : (d = [i, r, i, r, a, c, a, c], i = a, r = c);
      for (var E = 0, x = e.length; E < x; E++) {
        var y = e[E];
        if (y[0] == "M")
          o = u = y[1], s = l = y[2];
        else {
          y[0] == "C" ? (h = [o, s, ...y.slice(1)], o = h[6], s = h[7]) : (h = [o, s, o, s, u, l, u, l], o = u, s = l);
          var v = ql(d, h);
          {
            for (var _ = 0, w = v.length; _ < w; _++)
              v[_].segment1 = p, v[_].segment2 = E, v[_].bez1 = d, v[_].bez2 = h;
            f = f.concat(v);
          }
        }
      }
    }
  }
  return f;
}
function Xl(t) {
  var e = Ht(t);
  if (e.abs)
    return ci(e.abs);
  if ((!ai(t) || !ai(t && t[0])) && (t = $l(t)), !t || !t.length)
    return [["M", 0, 0]];
  var n = [], i = 0, r = 0, o = 0, s = 0, a = 0, c;
  t[0][0] == "M" && (i = +t[0][1], r = +t[0][2], o = i, s = r, a++, n[0] = ["M", i, r]);
  for (var u, l, d = a, h = t.length; d < h; d++) {
    if (n.push(u = []), l = t[d], c = l[0], c != c.toUpperCase())
      switch (u[0] = c.toUpperCase(), u[0]) {
        case "A":
          u[1] = l[1], u[2] = l[2], u[3] = l[3], u[4] = l[4], u[5] = l[5], u[6] = +l[6] + i, u[7] = +l[7] + r;
          break;
        case "V":
          u[1] = +l[1] + r;
          break;
        case "H":
          u[1] = +l[1] + i;
          break;
        case "M":
          o = +l[1] + i, s = +l[2] + r;
        default:
          for (var f = 1, p = l.length; f < p; f++)
            u[f] = +l[f] + (f % 2 ? i : r);
      }
    else
      for (var m = 0, g = l.length; m < g; m++)
        u[m] = l[m];
    switch (c = c.toUpperCase(), u[0]) {
      case "Z":
        i = +o, r = +s;
        break;
      case "H":
        i = u[1];
        break;
      case "V":
        r = u[1];
        break;
      case "M":
        o = u[u.length - 2], s = u[u.length - 1];
      default:
        i = u[u.length - 2], r = u[u.length - 1];
    }
  }
  return n.toString = tc, e.abs = ci(n), n;
}
function ds(t) {
  return t[0] === t[2] && t[1] === t[3] && t[4] === t[6] && t[5] === t[7];
}
function Un(t, e, n, i) {
  return [
    t,
    e,
    n,
    i,
    n,
    i
  ];
}
function hs(t, e, n, i, r, o) {
  var s = 0.3333333333333333, a = 2 / 3;
  return [
    s * t + a * n,
    s * e + a * i,
    s * r + a * n,
    s * o + a * i,
    r,
    o
  ];
}
function ic(t, e, n, i, r, o, s, a, c, u) {
  var l = Le * 120 / 180, d = Le / 180 * (+r || 0), h = [], f, p = Kl(function(Fo, Ko, Hn) {
    var _u = Fo * $.cos(Hn) - Ko * $.sin(Hn), xu = Fo * $.sin(Hn) + Ko * $.cos(Hn);
    return { x: _u, y: xu };
  });
  if (u)
    R = u[0], b = u[1], _ = u[2], w = u[3];
  else {
    f = p(t, e, -d), t = f.x, e = f.y, f = p(a, c, -d), a = f.x, c = f.y;
    var m = (t - a) / 2, g = (e - c) / 2, E = m * m / (n * n) + g * g / (i * i);
    E > 1 && (E = $.sqrt(E), n = E * n, i = E * i);
    var x = n * n, y = i * i, v = (o == s ? -1 : 1) * $.sqrt(ze((x * y - x * g * g - y * m * m) / (x * g * g + y * m * m))), _ = v * n * g / i + (t + a) / 2, w = v * -i * m / n + (e + c) / 2, R = $.asin(((e - w) / i).toFixed(9)), b = $.asin(((c - w) / i).toFixed(9));
    R = t < _ ? Le - R : R, b = a < _ ? Le - b : b, R < 0 && (R = Le * 2 + R), b < 0 && (b = Le * 2 + b), s && R > b && (R = R - Le * 2), !s && b > R && (b = b - Le * 2);
  }
  var C = b - R;
  if (ze(C) > l) {
    var O = b, M = a, P = c;
    b = R + l * (s && b > R ? 1 : -1), a = _ + n * $.cos(b), c = w + i * $.sin(b), h = ic(a, c, n, i, r, 0, s, M, P, [b, O, _, w]);
  }
  C = b - R;
  var J = $.cos(R), Ae = $.sin(R), Ye = $.cos(b), vu = $.sin(b), Lo = $.tan(C / 4), No = 4 / 3 * n * Lo, Ho = 4 / 3 * i * Lo, Bo = [t, e], dt = [t + No * Ae, e - Ho * J], Wo = [a + No * vu, c - Ho * Ye], zo = [a, c];
  if (dt[0] = 2 * Bo[0] - dt[0], dt[1] = 2 * Bo[1] - dt[1], u)
    return [dt, Wo, zo].concat(h);
  h = [dt, Wo, zo].concat(h).join().split(",");
  for (var Uo = [], De = 0, mu = h.length; De < mu; De++)
    Uo[De] = De % 2 ? p(h[De - 1], h[De], d).y : p(h[De], h[De + 1], d).x;
  return Uo;
}
function Jl(t, e, n, i, r, o, s, a) {
  for (var c = [], u = [[], []], l, d, h, f, p, m, g, E, x = 0; x < 2; ++x) {
    if (x == 0 ? (d = 6 * t - 12 * n + 6 * r, l = -3 * t + 9 * n - 9 * r + 3 * s, h = 3 * n - 3 * t) : (d = 6 * e - 12 * i + 6 * o, l = -3 * e + 9 * i - 9 * o + 3 * a, h = 3 * i - 3 * e), ze(l) < 1e-12) {
      if (ze(d) < 1e-12)
        continue;
      f = -h / d, 0 < f && f < 1 && c.push(f);
      continue;
    }
    g = d * d - 4 * h * l, E = $.sqrt(g), !(g < 0) && (p = (-d + E) / (2 * l), 0 < p && p < 1 && c.push(p), m = (-d - E) / (2 * l), 0 < m && m < 1 && c.push(m));
  }
  for (var y = c.length, v = y, _; y--; )
    f = c[y], _ = 1 - f, u[0][y] = _ * _ * _ * t + 3 * _ * _ * f * n + 3 * _ * f * f * r + f * f * f * s, u[1][y] = _ * _ * _ * e + 3 * _ * _ * f * i + 3 * _ * f * f * o + f * f * f * a;
  return u[0][v] = t, u[1][v] = e, u[0][v + 1] = s, u[1][v + 1] = a, u[0].length = u[1].length = v + 2, {
    x0: me(...u[0]),
    y0: me(...u[1]),
    x1: _e(...u[0]),
    y1: _e(...u[1])
  };
}
function fs(t) {
  var e = Ht(t);
  if (e.curve)
    return ci(e.curve);
  for (var n = Xl(t), i = { x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null }, r = function(f, p, m) {
    var g, E;
    if (!f)
      return ["C", p.x, p.y, p.x, p.y, p.x, p.y];
    switch (!(f[0] in { T: 1, Q: 1 }) && (p.qx = p.qy = null), f[0]) {
      case "M":
        p.X = f[1], p.Y = f[2];
        break;
      case "A":
        f = ["C", ...ic(p.x, p.y, ...f.slice(1))];
        break;
      case "S":
        m == "C" || m == "S" ? (g = p.x * 2 - p.bx, E = p.y * 2 - p.by) : (g = p.x, E = p.y), f = ["C", g, E, ...f.slice(1)];
        break;
      case "T":
        m == "Q" || m == "T" ? (p.qx = p.x * 2 - p.qx, p.qy = p.y * 2 - p.qy) : (p.qx = p.x, p.qy = p.y), f = ["C", ...hs(p.x, p.y, p.qx, p.qy, f[1], f[2])];
        break;
      case "Q":
        p.qx = f[1], p.qy = f[2], f = ["C", ...hs(p.x, p.y, f[1], f[2], f[3], f[4])];
        break;
      case "L":
        f = ["C", ...Un(p.x, p.y, f[1], f[2])];
        break;
      case "H":
        f = ["C", ...Un(p.x, p.y, f[1], p.y)];
        break;
      case "V":
        f = ["C", ...Un(p.x, p.y, p.x, f[1])];
        break;
      case "Z":
        f = ["C", ...Un(p.x, p.y, p.X, p.Y)];
        break;
    }
    return f;
  }, o = function(f, p) {
    if (f[p].length > 7) {
      f[p].shift();
      for (var m = f[p]; m.length; )
        s[p] = "A", f.splice(p++, 0, ["C", ...m.splice(0, 6)]);
      f.splice(p, 1), l = n.length;
    }
  }, s = [], a = "", c = "", u = 0, l = n.length; u < l; u++) {
    n[u] && (a = n[u][0]), a != "C" && (s[u] = a, u && (c = s[u - 1])), n[u] = r(n[u], i, c), s[u] != "A" && a == "C" && (s[u] = "C"), o(n, u);
    var d = n[u], h = d.length;
    i.x = d[h - 2], i.y = d[h - 1], i.bx = os(d[h - 4]) || i.x, i.by = os(d[h - 3]) || i.y;
  }
  return e.curve = ci(n), n;
}
var Fn = Math.round, Ql = Math.max;
function Yl(t, e) {
  var n = t.x, i = t.y;
  return [
    ["M", n, i],
    ["m", 0, -10],
    ["a", e, e, 0, 1, 1, 0, 2 * e],
    ["a", e, e, 0, 1, 1, 0, -2 * e],
    ["z"]
  ];
}
function Zl(t) {
  var e = [];
  return t.forEach(function(n, i) {
    e.push([i === 0 ? "M" : "L", n.x, n.y]);
  }), e;
}
var rc = 10;
function ed(t, e) {
  var n, i;
  for (n = 0; i = t[n]; n++)
    if (Ei(i, e) <= rc)
      return {
        point: t[n],
        bendpoint: !0,
        index: n
      };
  return null;
}
function td(t, e) {
  var n = nc(Yl(e, rc), Zl(t)), i = n[0], r = n[n.length - 1], o;
  return i ? i !== r ? i.segment2 !== r.segment2 ? (o = Ql(i.segment2, r.segment2) - 1, {
    point: t[o],
    bendpoint: !0,
    index: o
  }) : {
    point: {
      x: Fn(i.x + r.x) / 2,
      y: Fn(i.y + r.y) / 2
    },
    index: i.segment2
  } : {
    point: {
      x: Fn(i.x),
      y: Fn(i.y)
    },
    index: i.segment2
  } : null;
}
function nd(t, e) {
  return ed(t, e) || td(t, e);
}
function id(t) {
  return Math.sqrt(Math.pow(t.x, 2) + Math.pow(t.y, 2));
}
function rd(t, e, n) {
  var i = [
    { n: t[0] - n[0], lambda: e[0] },
    { n: t[1] - n[1], lambda: e[1] }
  ], r = i[0].n * e[0] + i[1].n * e[1], o = i[0].lambda * e[0] + i[1].lambda * e[1];
  return -r / o;
}
function oc(t, e) {
  var n = e[0], i = e[1], r = { x: i.x - n.x, y: i.y - n.y }, o = rd([n.x, n.y], [r.x, r.y], [t.x, t.y]);
  return { x: n.x + o * r.x, y: n.y + o * r.y };
}
function od(t, e) {
  var n = oc(t, e), i = {
    x: n.x - t.x,
    y: n.y - t.y
  };
  return id(i);
}
var sc = "djs-bendpoint", ac = "djs-segment-dragger";
function sd(t, e) {
  var n = Nt(e), i = t._container.getBoundingClientRect(), r;
  r = {
    x: i.left,
    y: i.top
  };
  var o = t.viewbox();
  return {
    x: o.x + (n.x - r.x) / o.scale,
    y: o.y + (n.y - r.y) / o.scale
  };
}
function sr(t, e, n) {
  var i = sd(t, n), r = nd(e, i);
  return r;
}
function ar(t, e) {
  var n = D("g");
  H(n).add(sc), I(t, n);
  var i = D("circle");
  k(i, {
    cx: 0,
    cy: 0,
    r: 4
  }), H(i).add("djs-visual"), I(n, i);
  var r = D("circle");
  return k(r, {
    cx: 0,
    cy: 0,
    r: 10
  }), H(r).add("djs-hit"), I(n, r), e && H(n).add(e), n;
}
function ad(t, e, n, i) {
  var r = D("g");
  I(t, r);
  var o = 18, s = 6, a = 11, c = ud(e, n, i), u = s + a, l = D("rect");
  k(l, {
    x: -18 / 2,
    y: -6 / 2,
    width: o,
    height: s
  }), H(l).add("djs-visual"), I(r, l);
  var d = D("rect");
  return k(d, {
    x: -c / 2,
    y: -17 / 2,
    width: c,
    height: u
  }), H(d).add("djs-hit"), I(r, d), jl(r, i === "v" ? 90 : 0), r;
}
function cc(t, e, n) {
  var i = D("g"), r = rr(e, n), o = ft(e, n);
  return I(t, i), ad(i, e, n, o), H(i).add(ac), H(i).add(o === "h" ? "horizontal" : "vertical"), he(i, r.x, r.y), i;
}
function cr(t) {
  return Math.abs(Math.round(t * 2 / 3));
}
function cd(t, e) {
  var n = ld(t, e);
  return oc(t, n);
}
function ud(t, e, n) {
  var i = e.x - t.x, r = e.y - t.y;
  return cr(n === "h" ? i : r);
}
function ld(t, e) {
  for (var n = e.waypoints, i = 1 / 0, r, o = 0; o < n.length - 1; o++) {
    var s = n[o], a = n[o + 1], c = od(t, [s, a]);
    c < i && (i = c, r = o);
  }
  return [n[r], n[r + 1]];
}
function Zr(t) {
  return CSS.escape(t);
}
function uc(t, e, n, i, r) {
  function o(y, v, _) {
    var w = y.index, R = y.point, b, C, O, M, P, J;
    return w <= 0 || y.bendpoint ? !1 : (b = v[w - 1], C = v[w], O = rr(b, C), M = ft(b, C), P = Math.abs(R.x - O.x), J = Math.abs(R.y - O.y), M && P <= _ && J <= _);
  }
  function s(y, v) {
    var _ = y.waypoints, w, R, b, C;
    return v.index <= 0 || v.bendpoint || (w = {
      start: _[v.index - 1],
      end: _[v.index]
    }, R = ft(w.start, w.end), !R) ? null : (R === "h" ? b = w.end.x - w.start.x : b = w.end.y - w.start.y, C = cr(b) / 2, C);
  }
  function a(y, v) {
    var _ = v.waypoints, w = sr(e, _, y), R;
    if (w)
      return R = s(v, w), o(w, _, R) ? r.start(y, v, w.index) : i.start(y, v, w.index, !w.bendpoint), !0;
  }
  function c(y, v, _) {
    N.bind(y, v, function(w) {
      n.triggerMouseEvent(v, w, _), w.stopPropagation();
    });
  }
  function u(y, v) {
    var _ = e.getLayer("overlays"), w = ee('.djs-bendpoints[data-element-id="' + Zr(y.id) + '"]', _);
    return !w && v && (w = D("g"), k(w, { "data-element-id": y.id }), H(w).add("djs-bendpoints"), I(_, w), c(w, "mousedown", y), c(w, "click", y), c(w, "dblclick", y)), w;
  }
  function l(y, v) {
    return ee(
      '.djs-segment-dragger[data-segment-idx="' + y + '"]',
      v
    );
  }
  function d(y, v) {
    v.waypoints.forEach(function(_, w) {
      var R = ar(y);
      I(y, R), he(R, _.x, _.y);
    }), ar(y, "floating");
  }
  function h(y, v) {
    for (var _ = v.waypoints, w, R, b, C = 1; C < _.length; C++)
      w = _[C - 1], R = _[C], ft(w, R) && (b = cc(y, w, R), k(b, { "data-segment-idx": C }), c(b, "mousemove", v));
  }
  function f(y) {
    A(Yi("." + sc, y), function(v) {
      Y(v);
    });
  }
  function p(y) {
    A(Yi("." + ac, y), function(v) {
      Y(v);
    });
  }
  function m(y) {
    var v = u(y);
    return v || (v = u(y, !0), d(v, y), h(v, y)), v;
  }
  function g(y) {
    var v = u(y);
    v && (p(v), f(v), h(v, y), d(v, y));
  }
  function E(y, v) {
    var _ = ee(".floating", y), w = v.point;
    _ && he(_, w.x, w.y);
  }
  function x(y, v, _) {
    var w = l(v.index, y), R = _[v.index - 1], b = _[v.index], C = v.point, O = rr(R, b), M = ft(R, b), P, J;
    w && (P = dd(w), J = {
      x: C.x - O.x,
      y: C.y - O.y
    }, M === "v" && (J = {
      x: J.y,
      y: J.x
    }), he(P, J.x, J.y));
  }
  t.on("connection.changed", function(y) {
    g(y.element);
  }), t.on("connection.remove", function(y) {
    var v = u(y.element);
    v && Y(v);
  }), t.on("element.marker.update", function(y) {
    var v = y.element, _;
    v.waypoints && (_ = m(v), y.add ? H(_).add(y.marker) : H(_).remove(y.marker));
  }), t.on("element.mousemove", function(y) {
    var v = y.element, _ = v.waypoints, w, R;
    if (_) {
      if (w = u(v, !0), R = sr(e, _, y.originalEvent), !R)
        return;
      E(w, R), R.bendpoint || x(w, R, _);
    }
  }), t.on("element.mousedown", function(y) {
    if (Ke(y)) {
      var v = y.originalEvent, _ = y.element;
      if (_.waypoints)
        return a(v, _);
    }
  }), t.on("selection.changed", function(y) {
    var v = y.newSelection, _ = v[0];
    _ && _.waypoints && m(_);
  }), t.on("element.hover", function(y) {
    var v = y.element;
    v.waypoints && (m(v), n.registerEvent(y.gfx, "mousemove", "element.mousemove"));
  }), t.on("element.out", function(y) {
    n.unregisterEvent(y.gfx, "mousemove", "element.mousemove");
  }), t.on("element.updateId", function(y) {
    var v = y.element, _ = y.newId;
    if (v.waypoints) {
      var w = u(v);
      w && k(w, { "data-element-id": _ });
    }
  }), this.addHandles = m, this.updateHandles = g, this.getBendpointsContainer = u, this.getSegmentDragger = l;
}
uc.$inject = [
  "eventBus",
  "canvas",
  "interactionEvents",
  "bendpointMove",
  "connectionSegmentMove"
];
function dd(t) {
  return ee(".djs-visual", t);
}
function hd(t) {
  return {
    x: Math.round(t.x),
    y: Math.round(t.y),
    width: Math.round(t.width),
    height: Math.round(t.height)
  };
}
function fn(t) {
  return {
    x: Math.round(t.x),
    y: Math.round(t.y)
  };
}
function se(t) {
  return {
    top: t.y,
    right: t.x + (t.width || 0),
    bottom: t.y + (t.height || 0),
    left: t.x
  };
}
function lc(t) {
  return {
    x: t.left,
    y: t.top,
    width: t.right - t.left,
    height: t.bottom - t.top
  };
}
function fd(t) {
  return fn({
    x: t.x + (t.width || 0) / 2,
    y: t.y + (t.height || 0) / 2
  });
}
function pd(t) {
  for (var e = t.waypoints, n = e.reduce(function(u, l, d) {
    var h = e[d - 1];
    if (h) {
      var f = u[u.length - 1], p = f && f.endLength || 0, m = vd(h, l);
      u.push({
        start: h,
        end: l,
        startLength: p,
        endLength: p + m,
        length: m
      });
    }
    return u;
  }, []), i = n.reduce(function(u, l) {
    return u + l.length;
  }, 0), r = i / 2, o = 0, s = n[o]; s.endLength < r; )
    s = n[++o];
  var a = (r - s.startLength) / s.length, c = {
    x: s.start.x + (s.end.x - s.start.x) * a,
    y: s.start.y + (s.end.y - s.start.y) * a
  };
  return c;
}
function re(t) {
  return K(t) ? pd(t) : fd(t);
}
function ur(t, e, n) {
  n = n || 0, ie(n) || (n = { x: n, y: n });
  var i = se(t), r = se(e), o = i.bottom + n.y <= r.top, s = i.left - n.x >= r.right, a = i.top - n.y >= r.bottom, c = i.right + n.x <= r.left, u = o ? "top" : a ? "bottom" : null, l = c ? "left" : s ? "right" : null;
  return l && u ? u + "-" + l : l || u || "intersect";
}
function lr(t, e, n) {
  var i = gd(t, e);
  return i.length === 1 || i.length === 2 && Ei(i[0], i[1]) < 1 ? fn(i[0]) : i.length > 1 ? (i = En(i, function(r) {
    var o = Math.floor(r.t2 * 100) || 1;
    return o = 100 - o, o = (o < 10 ? "0" : "") + o, r.segment2 + "#" + o;
  }), fn(i[n ? 0 : i.length - 1])) : null;
}
function gd(t, e) {
  return nc(t, e);
}
function yd(t) {
  t = t.slice();
  for (var e = 0, n, i, r; t[e]; )
    n = t[e], i = t[e - 1], r = t[e + 1], Ei(n, r) === 0 || ec(i, r, n) ? t.splice(e, 1) : e++;
  return t;
}
function vd(t, e) {
  return Math.sqrt(Math.pow(t.x - e.x, 2) + Math.pow(t.y - e.y, 2));
}
var ps = Math.round, et = "reconnectStart", tt = "reconnectEnd", tn = "updateWaypoints";
function eo(t, e, n, i, r, o) {
  this._injector = t, this.start = function(s, a, c, u) {
    var l = n.getGraphics(a), d = a.source, h = a.target, f = a.waypoints, p;
    !u && c === 0 ? p = et : !u && c === f.length - 1 ? p = tt : p = tn;
    var m = p === tn ? "connection.updateWaypoints" : "connection.reconnect", g = r.allowed(m, {
      connection: a,
      source: d,
      target: h
    });
    g === !1 && (g = r.allowed(m, {
      connection: a,
      source: h,
      target: d
    })), g !== !1 && i.init(s, "bendpoint.move", {
      data: {
        connection: a,
        connectionGfx: l,
        context: {
          allowed: g,
          bendpointIndex: c,
          connection: a,
          source: d,
          target: h,
          insert: u,
          type: p
        }
      }
    });
  }, e.on("bendpoint.move.hover", function(s) {
    var a = s.context, c = a.connection, u = c.source, l = c.target, d = s.hover, h = a.type;
    a.hover = d;
    var f;
    if (d) {
      var p = h === tn ? "connection.updateWaypoints" : "connection.reconnect";
      if (f = a.allowed = r.allowed(p, {
        connection: c,
        source: h === et ? d : u,
        target: h === tt ? d : l
      }), f) {
        a.source = h === et ? d : u, a.target = h === tt ? d : l;
        return;
      }
      f === !1 && (f = a.allowed = r.allowed(p, {
        connection: c,
        source: h === tt ? d : l,
        target: h === et ? d : u
      })), f && (a.source = h === tt ? d : l, a.target = h === et ? d : u);
    }
  }), e.on(["bendpoint.move.out", "bendpoint.move.cleanup"], function(s) {
    var a = s.context, c = a.type;
    a.hover = null, a.source = null, a.target = null, c !== tn && (a.allowed = !1);
  }), e.on("bendpoint.move.end", function(s) {
    var a = s.context, c = a.allowed, u = a.bendpointIndex, l = a.connection, d = a.insert, h = l.waypoints.slice(), f = a.source, p = a.target, m = a.type, g = a.hints || {}, E = {
      x: ps(s.x),
      y: ps(s.y)
    };
    if (!c)
      return !1;
    m === tn ? (d ? h.splice(u, 0, E) : h[u] = E, g.bendpointMove = {
      insert: d,
      bendpointIndex: u
    }, h = this.cropWaypoints(l, h), o.updateWaypoints(l, yd(h), g)) : (m === et ? (g.docking = "source", li(a) && (g.docking = "target", g.newWaypoints = h.reverse())) : m === tt && (g.docking = "target", li(a) && (g.docking = "source", g.newWaypoints = h.reverse())), o.reconnect(l, f, p, E, g));
  }, this);
}
eo.$inject = [
  "injector",
  "eventBus",
  "canvas",
  "dragging",
  "rules",
  "modeling"
];
eo.prototype.cropWaypoints = function(t, e) {
  var n = this._injector.get("connectionDocking", !1);
  if (!n)
    return e;
  var i = t.waypoints;
  return t.waypoints = e, t.waypoints = n.getCroppedWaypoints(t), e = t.waypoints, t.waypoints = i, e;
};
function li(t) {
  var e = t.hover, n = t.source, i = t.target, r = t.type;
  if (r === et)
    return e && i && e === i && n !== i;
  if (r === tt)
    return e && n && e === n && n !== i;
}
var md = "reconnectStart", _d = "reconnectEnd", gs = "updateWaypoints", nn = "connect-ok", Kn = "connect-not-ok", ys = "connect-hover", vs = "djs-updating", ms = "djs-dragging", _s = 1100;
function dc(t, e, n, i) {
  this._injector = e;
  var r = e.get("connectionPreview", !1);
  n.on("bendpoint.move.start", function(o) {
    var s = o.context, a = s.bendpointIndex, c = s.connection, u = s.insert, l = c.waypoints, d = l.slice();
    s.waypoints = l, u && d.splice(a, 0, { x: o.x, y: o.y }), c.waypoints = d;
    var h = s.draggerGfx = ar(i.getLayer("overlays"));
    H(h).add("djs-dragging"), i.addMarker(c, ms), i.addMarker(c, vs);
  }), n.on("bendpoint.move.hover", function(o) {
    var s = o.context, a = s.allowed, c = s.hover, u = s.type;
    if (c) {
      if (i.addMarker(c, ys), u === gs)
        return;
      a ? (i.removeMarker(c, Kn), i.addMarker(c, nn)) : a === !1 && (i.removeMarker(c, nn), i.addMarker(c, Kn));
    }
  }), n.on([
    "bendpoint.move.out",
    "bendpoint.move.cleanup"
  ], _s, function(o) {
    var s = o.context, a = s.hover, c = s.target;
    a && (i.removeMarker(a, ys), i.removeMarker(a, c ? nn : Kn));
  }), n.on("bendpoint.move.move", function(o) {
    var s = o.context, a = s.allowed, c = s.bendpointIndex, u = s.draggerGfx, l = s.hover, d = s.type, h = s.connection, f = h.source, p = h.target, m = h.waypoints.slice(), g = { x: o.x, y: o.y }, E = s.hints || {}, x = {};
    r && (E.connectionStart && (x.connectionStart = E.connectionStart), E.connectionEnd && (x.connectionEnd = E.connectionEnd), d === md ? li(s) ? (x.connectionEnd = x.connectionEnd || g, x.source = p, x.target = l || f, m = m.reverse()) : (x.connectionStart = x.connectionStart || g, x.source = l || f, x.target = p) : d === _d ? li(s) ? (x.connectionStart = x.connectionStart || g, x.source = l || p, x.target = f, m = m.reverse()) : (x.connectionEnd = x.connectionEnd || g, x.source = f, x.target = l || p) : (x.noCropping = !0, x.noLayout = !0, m[c] = g), d === gs && (m = t.cropWaypoints(h, m)), x.waypoints = m, r.drawPreview(s, a, x)), he(u, o.x, o.y);
  }, this), n.on([
    "bendpoint.move.end",
    "bendpoint.move.cancel"
  ], _s, function(o) {
    var s = o.context, a = s.connection, c = s.draggerGfx, u = s.hover, l = s.target, d = s.waypoints;
    a.waypoints = d, Y(c), i.removeMarker(a, vs), i.removeMarker(a, ms), u && (i.removeMarker(u, nn), i.removeMarker(u, l ? nn : Kn)), r && r.cleanUp(s);
  });
}
dc.$inject = [
  "bendpointMove",
  "injector",
  "eventBus",
  "canvas"
];
var xs = "connect-hover", bs = "djs-updating";
function Es(t, e, n) {
  return to(t, e, t[e] + n);
}
function to(t, e, n) {
  return {
    x: e === "x" ? n : t.x,
    y: e === "y" ? n : t.y
  };
}
function xd(t, e, n, i) {
  var r = Math.max(e[i], n[i]), o = Math.min(e[i], n[i]), s = 20, a = Math.min(Math.max(o + s, t[i]), r - s);
  return to(e, i, a);
}
function hc(t) {
  return t === "x" ? "y" : "x";
}
function ws(t, e, n) {
  var i, r;
  return t.original ? t.original : (i = re(e), r = hc(n), to(t, r, i[r]));
}
function fc(t, e, n, i, r, o) {
  var s = t.get("connectionDocking", !1);
  this.start = function(d, h, f) {
    var p, m = n.getGraphics(h), g = f - 1, E = f, x = h.waypoints, y = x[g], v = x[E], _ = sr(n, x, d), w, R, b;
    w = ft(y, v), w && (R = w === "v" ? "x" : "y", g === 0 && (y = ws(y, h.source, R)), E === x.length - 1 && (v = ws(v, h.target, R)), _ ? b = _.point : b = {
      x: (y.x + v.x) / 2,
      y: (y.y + v.y) / 2
    }, p = {
      connection: h,
      segmentStartIndex: g,
      segmentEndIndex: E,
      segmentStart: y,
      segmentEnd: v,
      axis: R,
      dragPosition: b
    }, i.init(d, b, "connectionSegment.move", {
      cursor: R === "x" ? "resize-ew" : "resize-ns",
      data: {
        connection: h,
        connectionGfx: m,
        context: p
      }
    }));
  };
  function a(d, h) {
    if (!s)
      return h;
    var f = d.waypoints, p;
    return d.waypoints = h, p = s.getCroppedWaypoints(d), d.waypoints = f, p;
  }
  function c(d) {
    r.update("connection", d.connection, d.connectionGfx);
  }
  function u(d, h, f) {
    var p = d.newWaypoints, m = d.segmentStartIndex + h, g = p[m], E = d.segmentEndIndex + h, x = p[E], y = hc(d.axis), v = xd(f, g, x, y);
    he(d.draggerGfx, v.x, v.y);
  }
  function l(d, h) {
    var f = 0, p = d.filter(function(m, g) {
      return ec(d[g - 1], d[g + 1], m) ? (f = g <= h ? f - 1 : f, !1) : !0;
    });
    return {
      waypoints: p,
      segmentOffset: f
    };
  }
  e.on("connectionSegment.move.start", function(d) {
    var h = d.context, f = d.connection, p = n.getLayer("overlays");
    h.originalWaypoints = f.waypoints.slice(), h.draggerGfx = cc(p, h.segmentStart, h.segmentEnd), H(h.draggerGfx).add("djs-dragging"), n.addMarker(f, bs);
  }), e.on("connectionSegment.move.move", function(d) {
    var h = d.context, f = h.connection, p = h.segmentStartIndex, m = h.segmentEndIndex, g = h.segmentStart, E = h.segmentEnd, x = h.axis, y = h.originalWaypoints.slice(), v = Es(g, x, d["d" + x]), _ = Es(E, x, d["d" + x]), w = y.length, R = 0;
    y[p] = v, y[m] = _;
    var b, C;
    p < 2 && (b = ur(f.source, v), p === 1 ? b === "intersect" && (y.shift(), y[0] = v, R--) : b !== "intersect" && (y.unshift(g), R++)), m > w - 3 && (C = ur(f.target, _), m === w - 2 ? C === "intersect" && (y.pop(), y[y.length - 1] = _) : C !== "intersect" && y.push(E)), h.newWaypoints = f.waypoints = a(f, y), u(h, R, d), h.newSegmentStartIndex = p + R, c(d);
  }), e.on("connectionSegment.move.hover", function(d) {
    d.context.hover = d.hover, n.addMarker(d.hover, xs);
  }), e.on([
    "connectionSegment.move.out",
    "connectionSegment.move.cleanup"
  ], function(d) {
    var h = d.context.hover;
    h && n.removeMarker(h, xs);
  }), e.on("connectionSegment.move.cleanup", function(d) {
    var h = d.context, f = h.connection;
    h.draggerGfx && Y(h.draggerGfx), n.removeMarker(f, bs);
  }), e.on([
    "connectionSegment.move.cancel",
    "connectionSegment.move.end"
  ], function(d) {
    var h = d.context, f = h.connection;
    f.waypoints = h.originalWaypoints, c(d);
  }), e.on("connectionSegment.move.end", function(d) {
    var h = d.context, f = h.connection, p = h.newWaypoints, m = h.newSegmentStartIndex;
    p = p.map(function(_) {
      return {
        original: _.original,
        x: Math.round(_.x),
        y: Math.round(_.y)
      };
    });
    var g = l(p, m), E = g.waypoints, x = a(f, E), y = g.segmentOffset, v = {
      segmentMove: {
        segmentStartIndex: h.segmentStartIndex,
        newSegmentStartIndex: m + y
      }
    };
    o.updateWaypoints(f, x, v);
  });
}
fc.$inject = [
  "injector",
  "eventBus",
  "canvas",
  "dragging",
  "graphicsFactory",
  "modeling"
];
var bd = Math.abs, Ss = Math.round;
function Ed(t, e, n) {
  n = n === void 0 ? 10 : n;
  var i, r;
  for (i = 0; i < e.length; i++)
    if (r = e[i], bd(r - t) <= n)
      return r;
}
function wd(t) {
  return {
    x: t.x,
    y: t.y
  };
}
function Sd(t) {
  return {
    x: t.x + t.width,
    y: t.y + t.height
  };
}
function gt(t, e) {
  return !t || isNaN(t.x) || isNaN(t.y) ? e : {
    x: Ss(t.x + t.width / 2),
    y: Ss(t.y + t.height / 2)
  };
}
function di(t, e) {
  var n = t.snapped;
  return n ? typeof e == "string" ? n[e] : n.x && n.y : !1;
}
function Oe(t, e, n) {
  if (typeof e != "string")
    throw new Error("axis must be in [x, y]");
  if (typeof n != "number" && n !== !1)
    throw new Error("value must be Number or false");
  var i, r = t[e], o = t.snapped = t.snapped || {};
  return n === !1 ? o[e] = !1 : (o[e] = !0, i = n - r, t[e] += i, t["d" + e] += i), r;
}
function pc(t) {
  return t.children || [];
}
var Ad = Math.abs, As = Math.round, Fi = 10;
function gc(t) {
  function e(o, s) {
    if (L(o)) {
      for (var a = o.length; a--; ) if (Ad(o[a] - s) <= Fi)
        return o[a];
    } else {
      o = +o;
      var c = s % o;
      if (c < Fi)
        return s - c;
      if (c > o - Fi)
        return s - c + o;
    }
    return s;
  }
  function n(o, s) {
    if (o.waypoints)
      return cd(s, o);
    if (o.width)
      return {
        x: As(o.width / 2 + o.x),
        y: As(o.height / 2 + o.y)
      };
  }
  function i(o) {
    var s = o.context, a = s.snapPoints, c = s.connection, u = c.waypoints, l = s.segmentStart, d = s.segmentStartIndex, h = s.segmentEnd, f = s.segmentEndIndex, p = s.axis;
    if (a)
      return a;
    var m = [
      u[d - 1],
      l,
      h,
      u[f + 1]
    ];
    return d < 2 && m.unshift(n(c.source, o)), f > u.length - 3 && m.unshift(n(c.target, o)), s.snapPoints = a = { horizontal: [], vertical: [] }, A(m, function(g) {
      g && (g = g.original || g, p === "y" && a.horizontal.push(g.y), p === "x" && a.vertical.push(g.x));
    }), a;
  }
  t.on("connectionSegment.move.move", 1500, function(o) {
    var s = i(o), a = o.x, c = o.y, u, l;
    if (s) {
      u = e(s.vertical, a), l = e(s.horizontal, c);
      var d = a - u, h = c - l;
      T(o, {
        dx: o.dx - d,
        dy: o.dy - h,
        x: u,
        y: l
      }), (d || s.vertical.indexOf(a) !== -1) && Oe(o, "x", u), (h || s.horizontal.indexOf(c) !== -1) && Oe(o, "y", l);
    }
  });
  function r(o) {
    var s = o.snapPoints, a = o.connection.waypoints, c = o.bendpointIndex;
    if (s)
      return s;
    var u = [a[c - 1], a[c + 1]];
    return o.snapPoints = s = { horizontal: [], vertical: [] }, A(u, function(l) {
      l && (l = l.original || l, s.horizontal.push(l.y), s.vertical.push(l.x));
    }), s;
  }
  t.on([
    "connect.hover",
    "connect.move",
    "connect.end"
  ], 1500, function(o) {
    var s = o.context, a = s.hover, c = a && n(a, o);
    !K(a) || !c || !c.x || !c.y || (Oe(o, "x", c.x), Oe(o, "y", c.y));
  }), t.on(["bendpoint.move.move", "bendpoint.move.end"], 1500, function(o) {
    var s = o.context, a = r(s), c = s.hover, u = c && n(c, o), l = o.x, d = o.y, h, f;
    if (a) {
      h = e(u ? a.vertical.concat([u.x]) : a.vertical, l), f = e(u ? a.horizontal.concat([u.y]) : a.horizontal, d);
      var p = l - h, m = d - f;
      T(o, {
        dx: o.dx - p,
        dy: o.dy - m,
        x: o.x - p,
        y: o.y - m
      }), (p || a.vertical.indexOf(l) !== -1) && Oe(o, "x", h), (m || a.horizontal.indexOf(d) !== -1) && Oe(o, "y", f);
    }
  });
}
gc.$inject = ["eventBus"];
const Cd = {
  __depends__: [
    at,
    ke
  ],
  __init__: ["bendpoints", "bendpointSnapping", "bendpointMovePreview"],
  bendpoints: ["type", uc],
  bendpointMove: ["type", eo],
  bendpointMovePreview: ["type", dc],
  connectionSegmentMove: ["type", fc],
  bendpointSnapping: ["type", gc]
};
var Od = "djs-dragger";
function Pe(t, e, n, i) {
  this._canvas = e, this._graphicsFactory = n, this._elementFactory = i, this._connectionDocking = t.get("connectionDocking", !1), this._layouter = t.get("layouter", !1);
}
Pe.$inject = [
  "injector",
  "canvas",
  "graphicsFactory",
  "elementFactory"
];
Pe.prototype.drawPreview = function(t, e, n) {
  n = n || {};
  var i = t.connectionPreviewGfx, r = t.getConnection, o = n.source, s = n.target, a = n.waypoints, c = n.connectionStart, u = n.connectionEnd, l = n.noLayout, d = n.noCropping, h = n.noNoop, f, p = this;
  if (i || (i = t.connectionPreviewGfx = this.createConnectionPreviewGfx()), Ur(i), r || (r = t.getConnection = Td(function(m, g, E) {
    return p.getConnection(m, g, E);
  })), e && (f = r(e, o, s)), !f) {
    !h && this.drawNoopPreview(i, n);
    return;
  }
  f.waypoints = a || [], this._layouter && !l && (f.waypoints = this._layouter.layoutConnection(f, {
    source: o,
    target: s,
    connectionStart: c,
    connectionEnd: u,
    waypoints: n.waypoints || f.waypoints
  })), (!f.waypoints || !f.waypoints.length) && (f.waypoints = [
    o ? re(o) : c,
    s ? re(s) : u
  ]), this._connectionDocking && (o || s) && !d && (f.waypoints = this._connectionDocking.getCroppedWaypoints(f, o, s)), this._graphicsFactory.drawConnection(i, f, {
    stroke: "var(--element-dragger-color)"
  });
};
Pe.prototype.drawNoopPreview = function(t, e) {
  var n = e.source, i = e.target, r = e.connectionStart || re(n), o = e.connectionEnd || re(i), s = this.cropWaypoints(r, o, n, i), a = this.createNoopConnection(s[0], s[1]);
  I(t, a);
};
Pe.prototype.cropWaypoints = function(t, e, n, i) {
  var r = this._graphicsFactory, o = n && r.getShapePath(n), s = i && r.getShapePath(i), a = r.getConnectionPath({ waypoints: [t, e] });
  return t = n && lr(o, a, !0) || t, e = i && lr(s, a, !1) || e, [t, e];
};
Pe.prototype.cleanUp = function(t) {
  t && t.connectionPreviewGfx && Y(t.connectionPreviewGfx);
};
Pe.prototype.getConnection = function(t) {
  var e = Rd(t);
  return this._elementFactory.createConnection(e);
};
Pe.prototype.createConnectionPreviewGfx = function() {
  var t = D("g");
  return k(t, {
    pointerEvents: "none"
  }), H(t).add(Od), I(this._canvas.getActiveLayer(), t), t;
};
Pe.prototype.createNoopConnection = function(t, e) {
  return oi([t, e], {
    stroke: "#333",
    strokeDasharray: [1],
    strokeWidth: 2,
    "pointer-events": "none"
  });
};
function Td(t) {
  var e = {};
  return function(n) {
    var i = JSON.stringify(n), r = e[i];
    return r || (r = e[i] = t.apply(null, arguments)), r;
  };
}
function Rd(t) {
  return ie(t) ? t : {};
}
const kd = {
  __init__: ["connectionPreview"],
  connectionPreview: ["type", Pe]
};
function Ve() {
  this._targets = {}, this._snapOrigins = {}, this._snapLocations = [], this._defaultSnaps = {};
}
Ve.prototype.getSnapOrigin = function(t) {
  return this._snapOrigins[t];
};
Ve.prototype.setSnapOrigin = function(t, e) {
  this._snapOrigins[t] = e, this._snapLocations.indexOf(t) === -1 && this._snapLocations.push(t);
};
Ve.prototype.addDefaultSnap = function(t, e) {
  var n = this._defaultSnaps[t];
  n || (n = this._defaultSnaps[t] = []), n.push(e);
};
Ve.prototype.getSnapLocations = function() {
  return this._snapLocations;
};
Ve.prototype.setSnapLocations = function(t) {
  this._snapLocations = t;
};
Ve.prototype.pointsForTarget = function(t) {
  var e = t.id || t, n = this._targets[e];
  return n || (n = this._targets[e] = new wi(), n.initDefaults(this._defaultSnaps)), n;
};
function wi() {
  this._snapValues = {};
}
wi.prototype.add = function(t, e) {
  var n = this._snapValues[t];
  n || (n = this._snapValues[t] = { x: [], y: [] }), n.x.indexOf(e.x) === -1 && n.x.push(e.x), n.y.indexOf(e.y) === -1 && n.y.push(e.y);
};
wi.prototype.snap = function(t, e, n, i) {
  var r = this._snapValues[e];
  return r && Ed(t[n], r[n], i);
};
wi.prototype.initDefaults = function(t) {
  var e = this;
  A(t || {}, function(n, i) {
    A(n, function(r) {
      e.add(i, r);
    });
  });
};
var Pd = 1250;
function Sn(t, e, n) {
  var i = this;
  this._elementRegistry = t, e.on([
    "create.start",
    "shape.move.start"
  ], function(r) {
    i.initSnap(r);
  }), e.on([
    "create.move",
    "create.end",
    "shape.move.move",
    "shape.move.end"
  ], Pd, function(r) {
    var o = r.context, s = o.shape, a = o.snapContext, c = o.target;
    if (!(r.originalEvent && Ee(r.originalEvent)) && !(di(r) || !c)) {
      var u = a.pointsForTarget(c);
      u.initialized || (u = i.addSnapTargetPoints(u, s, c), u.initialized = !0), n.snap(r, u);
    }
  }), e.on([
    "create.cleanup",
    "shape.move.cleanup"
  ], function() {
    n.hide();
  });
}
Sn.$inject = [
  "elementRegistry",
  "eventBus",
  "snapping"
];
Sn.prototype.initSnap = function(t) {
  var e = this._elementRegistry, n = t.context, i = n.shape, r = n.snapContext;
  r || (r = n.snapContext = new Ve());
  var o;
  e.get(i.id) ? o = gt(i, t) : o = {
    x: t.x + gt(i).x,
    y: t.y + gt(i).y
  };
  var s = {
    x: o.x - i.width / 2,
    y: o.y - i.height / 2
  }, a = {
    x: o.x + i.width / 2,
    y: o.y + i.height / 2
  };
  return r.setSnapOrigin("mid", {
    x: o.x - t.x,
    y: o.y - t.y
  }), ne(i) || (r.setSnapOrigin("top-left", {
    x: s.x - t.x,
    y: s.y - t.y
  }), r.setSnapOrigin("bottom-right", {
    x: a.x - t.x,
    y: a.y - t.y
  })), r;
};
Sn.prototype.addSnapTargetPoints = function(t, e, n) {
  var i = this.getSnapTargets(e, n);
  return A(i, function(r) {
    if (ne(r)) {
      ne(e) && t.add("mid", gt(r));
      return;
    }
    if (K(r)) {
      if (r.waypoints.length < 3)
        return;
      var o = r.waypoints.slice(1, -1);
      A(o, function(s) {
        t.add("mid", s);
      });
      return;
    }
    t.add("mid", gt(r));
  }), !j(e.x) || !j(e.y) || this._elementRegistry.get(e.id) && t.add("mid", gt(e)), t;
};
Sn.prototype.getSnapTargets = function(t, e) {
  return pc(e).filter(function(n) {
    return !Md(n);
  });
};
function Md(t) {
  return !!t.hidden;
}
var Id = 1250;
function An(t, e) {
  var n = this;
  t.on(["resize.start"], function(i) {
    n.initSnap(i);
  }), t.on([
    "resize.move",
    "resize.end"
  ], Id, function(i) {
    var r = i.context, o = r.shape, s = o.parent, a = r.direction, c = r.snapContext;
    if (!(i.originalEvent && Ee(i.originalEvent)) && !di(i)) {
      var u = c.pointsForTarget(s);
      u.initialized || (u = n.addSnapTargetPoints(u, o, s, a), u.initialized = !0), Ld(a) && Oe(i, "x", i.x), Nd(a) && Oe(i, "y", i.y), e.snap(i, u);
    }
  }), t.on(["resize.cleanup"], function() {
    e.hide();
  });
}
An.prototype.initSnap = function(t) {
  var e = t.context, n = e.shape, i = e.direction, r = e.snapContext;
  r || (r = e.snapContext = new Ve());
  var o = yc(n, i);
  return r.setSnapOrigin("corner", {
    x: o.x - t.x,
    y: o.y - t.y
  }), r;
};
An.prototype.addSnapTargetPoints = function(t, e, n, i) {
  var r = this.getSnapTargets(e, n);
  return A(r, function(o) {
    t.add("corner", Sd(o)), t.add("corner", wd(o));
  }), t.add("corner", yc(e, i)), t;
};
An.$inject = [
  "eventBus",
  "snapping"
];
An.prototype.getSnapTargets = function(t, e) {
  return pc(e).filter(function(n) {
    return !jd(n, t) && !K(n) && !Dd(n) && !ne(n);
  });
};
function yc(t, e) {
  var n = re(t), i = se(t), r = {
    x: n.x,
    y: n.y
  };
  return e.indexOf("n") !== -1 ? r.y = i.top : e.indexOf("s") !== -1 && (r.y = i.bottom), e.indexOf("e") !== -1 ? r.x = i.right : e.indexOf("w") !== -1 && (r.x = i.left), r;
}
function jd(t, e) {
  return t.host === e;
}
function Dd(t) {
  return !!t.hidden;
}
function Ld(t) {
  return t === "n" || t === "s";
}
function Nd(t) {
  return t === "e" || t === "w";
}
var Hd = 7, Bd = 1e3;
function Ge(t) {
  this._canvas = t, this._asyncHide = wu(Br(this.hide, this), Bd);
}
Ge.$inject = ["canvas"];
Ge.prototype.snap = function(t, e) {
  var n = t.context, i = n.snapContext, r = i.getSnapLocations(), o = {
    x: di(t, "x"),
    y: di(t, "y")
  };
  A(r, function(s) {
    var a = i.getSnapOrigin(s), c = {
      x: t.x + a.x,
      y: t.y + a.y
    };
    if (A(["x", "y"], function(u) {
      var l;
      o[u] || (l = e.snap(c, s, u, Hd), l !== void 0 && (o[u] = {
        value: l,
        originValue: l - a[u]
      }));
    }), o.x && o.y)
      return !1;
  }), this.showSnapLine("vertical", o.x && o.x.value), this.showSnapLine("horizontal", o.y && o.y.value), A(["x", "y"], function(s) {
    var a = o[s];
    ie(a) && Oe(t, s, a.originValue);
  });
};
Ge.prototype._createLine = function(t) {
  var e = this._canvas.getLayer("snap"), n = D("path");
  return k(n, { d: "M0,0 L0,0" }), H(n).add("djs-snap-line"), I(e, n), {
    update: function(i) {
      j(i) ? t === "horizontal" ? k(n, {
        d: "M-100000," + i + " L+100000," + i,
        display: ""
      }) : k(n, {
        d: "M " + i + ",-100000 L " + i + ", +100000",
        display: ""
      }) : k(n, { display: "none" });
    }
  };
};
Ge.prototype._createSnapLines = function() {
  this._snapLines = {
    horizontal: this._createLine("horizontal"),
    vertical: this._createLine("vertical")
  };
};
Ge.prototype.showSnapLine = function(t, e) {
  var n = this.getSnapLine(t);
  n && n.update(e), this._asyncHide();
};
Ge.prototype.getSnapLine = function(t) {
  return this._snapLines || this._createSnapLines(), this._snapLines[t];
};
Ge.prototype.hide = function() {
  A(this._snapLines, function(t) {
    t.update();
  });
};
const Wd = {
  __init__: [
    "createMoveSnapping",
    "resizeSnapping",
    "snapping"
  ],
  createMoveSnapping: ["type", Sn],
  resizeSnapping: ["type", An],
  snapping: ["type", Ge]
};
function Vt(t, e) {
  e && (t.super_ = e, t.prototype = Object.create(e.prototype, { constructor: { value: t, enumerable: !1, writable: !0, configurable: !0 } }));
}
function zd(t, e, n, i) {
  var r = n.inverse;
  return Object.defineProperty(t, "remove", {
    value: function(o) {
      var s = this.indexOf(o);
      return s !== -1 && (this.splice(s, 1), e.unset(o, r, i)), o;
    }
  }), Object.defineProperty(t, "contains", {
    value: function(o) {
      return this.indexOf(o) !== -1;
    }
  }), Object.defineProperty(t, "add", {
    value: function(o, s) {
      var a = this.indexOf(o);
      if (typeof s > "u") {
        if (a !== -1)
          return;
        s = this.length;
      }
      a !== -1 && this.splice(a, 1), this.splice(s, 0, o), a === -1 && e.set(o, r, i);
    }
  }), Object.defineProperty(t, "__refs_collection", {
    value: !0
  }), t;
}
function Ud(t) {
  return t.__refs_collection === !0;
}
function Fd(t, e) {
  return Object.prototype.hasOwnProperty.call(t, e.name || e);
}
function vc(t, e, n) {
  var i = zd(n[e.name] || [], t, e, n);
  Object.defineProperty(n, e.name, {
    enumerable: e.enumerable,
    value: i
  }), i.length && i.forEach(function(r) {
    t.set(r, e.inverse, n);
  });
}
function Kd(t, e, n) {
  var i = e.inverse, r = n[e.name];
  Object.defineProperty(n, e.name, {
    configurable: e.configurable,
    enumerable: e.enumerable,
    get: function() {
      return r;
    },
    set: function(o) {
      if (o !== r) {
        var s = r;
        r = null, s && t.unset(s, i, n), r = o, t.set(r, i, n);
      }
    }
  });
}
function pe(t, e) {
  if (!(this instanceof pe))
    return new pe(t, e);
  t.inverse = e, e.inverse = t, this.props = {}, this.props[t.name] = t, this.props[e.name] = e;
}
pe.prototype.bind = function(t, e) {
  if (typeof e == "string") {
    if (!this.props[e])
      throw new Error("no property <" + e + "> in ref");
    e = this.props[e];
  }
  e.collection ? vc(this, e, t) : Kd(this, e, t);
};
pe.prototype.ensureRefsCollection = function(t, e) {
  var n = t[e.name];
  return Ud(n) || vc(this, e, t), n;
};
pe.prototype.ensureBound = function(t, e) {
  Fd(t, e) || this.bind(t, e);
};
pe.prototype.unset = function(t, e, n) {
  t && (this.ensureBound(t, e), e.collection ? this.ensureRefsCollection(t, e).remove(n) : t[e.name] = void 0);
};
pe.prototype.set = function(t, e, n) {
  t && (this.ensureBound(t, e), e.collection ? this.ensureRefsCollection(t, e).add(n) : t[e.name] = n);
};
var no = new pe({ name: "children", enumerable: !0, collection: !0 }, { name: "parent" }), mc = new pe({ name: "labels", enumerable: !0, collection: !0 }, { name: "labelTarget" }), Cs = new pe({ name: "attachers", collection: !0 }, { name: "host" }), _c = new pe({ name: "outgoing", collection: !0 }, { name: "source" }), xc = new pe({ name: "incoming", collection: !0 }, { name: "target" });
function Gt() {
  Object.defineProperty(this, "businessObject", {
    writable: !0
  }), Object.defineProperty(this, "label", {
    get: function() {
      return this.labels[0];
    },
    set: function(t) {
      var e = this.label, n = this.labels;
      !t && e ? n.remove(e) : n.add(t, 0);
    }
  }), no.bind(this, "parent"), mc.bind(this, "labels"), _c.bind(this, "outgoing"), xc.bind(this, "incoming");
}
function Cn() {
  Gt.call(this), no.bind(this, "children"), Cs.bind(this, "host"), Cs.bind(this, "attachers");
}
Vt(Cn, Gt);
function bc() {
  Gt.call(this), no.bind(this, "children");
}
Vt(bc, Cn);
function Ec() {
  Cn.call(this), mc.bind(this, "labelTarget");
}
Vt(Ec, Cn);
function wc() {
  Gt.call(this), _c.bind(this, "source"), xc.bind(this, "target");
}
Vt(wc, Gt);
var $d = {
  connection: wc,
  shape: Cn,
  label: Ec,
  root: bc
};
function Vd(t, e) {
  var n = $d[t];
  if (!n)
    throw new Error("unknown type: <" + t + ">");
  return T(new n(), e);
}
function Gd(t) {
  return t instanceof Gt;
}
function qt() {
  this._uid = 12;
}
qt.prototype.createRoot = function(t) {
  return this.create("root", t);
};
qt.prototype.createLabel = function(t) {
  return this.create("label", t);
};
qt.prototype.createShape = function(t) {
  return this.create("shape", t);
};
qt.prototype.createConnection = function(t) {
  return this.create("connection", t);
};
qt.prototype.create = function(t, e) {
  return e = T({}, e || {}), e.id || (e.id = t + "_" + this._uid++), Vd(t, e);
};
var S = /* @__PURE__ */ ((t) => (t.ACTIVITY = "domainStory:activity", t.CONNECTION = "domainStory:connection", t.ACTOR = "domainStory:actor", t.WORKOBJECT = "domainStory:workObject", t.GROUP = "domainStory:group", t.TEXTANNOTATION = "domainStory:textAnnotation", t))(S || {});
function pn(t) {
  return t.startsWith(
    "domainStory:actor"
    /* ACTOR */
  ) ? t.replace("domainStory:actor", "") : t.startsWith(
    "domainStory:workObject"
    /* WORKOBJECT */
  ) ? t.replace("domainStory:workObject", "") : "";
}
var vt;
let qd = (vt = class extends qt {
  constructor(e) {
    super(), this.domainStoryIdFactory = e;
  }
  create(e, n) {
    if (!n)
      return super.create(e, n);
    n != null && n.businessObject || (n.businessObject = {
      type: n.type,
      name: n.name ? n.name : ""
    }), n.id ? this.domainStoryIdFactory.registerId(n.id) : n.id = this.domainStoryIdFactory.getId(e), T(n.businessObject, {
      id: n.id
    });
    const i = n.id;
    return n.businessObject.get = function(r) {
      if (r === "id")
        return i;
    }, n.businessObject.set = function(r, o) {
      r === "id" && T(n.businessObject, { id: o });
    }, e === "shape" && (n.height || n.width || T(n, this.getShapeSize(n.type))), "$instanceOf" in n.businessObject || Object.defineProperty(n.businessObject, "$instanceOf", {
      value: function(r) {
        return this.type === r;
      }
    }), super.create(e, n);
  }
  getShapeSize(e) {
    const n = {
      __default: { width: 75, height: 75 },
      [S.TEXTANNOTATION]: { width: 100, height: 30 },
      [S.GROUP]: { width: 300, height: 200 }
    };
    return n[e] || n.__default;
  }
}, vt.$inject = ["domainStoryIdFactory"], vt), Xd = class {
  getId(e) {
    return this.generateId(e);
  }
  registerId(e) {
    dr.push(e);
  }
  generateId(e) {
    let n = this.fourDigitsId(), i = `${e}_${this.idSuffix(n)}`;
    for (; Jd(i); )
      n += 1, i = `${e}_${this.idSuffix(n)}`;
    return dr.push(i), i;
  }
  fourDigitsId() {
    return Math.floor(Math.random() * 1e4);
  }
  idSuffix(e) {
    let n;
    return e > 9999 ? n = "0" : e < 10 ? n = "000" + e : e < 100 ? n = "00" + e : e < 1e3 ? n = "0" + e : n = "" + e, n;
  }
};
function Jd(t) {
  let e = !1;
  return dr.forEach((n) => {
    t === n && (e = !0);
  }), e;
}
const dr = [], Qd = {
  __init__: ["domainStoryIdFactory"],
  domainStoryIdFactory: ["type", Xd]
}, Sc = {
  __depends__: [Qd],
  elementFactory: ["type", qd]
};
var Yd = 0, Zd = {
  width: 150,
  height: 50
};
function eh(t) {
  var e = t.split("-");
  return {
    horizontal: e[0] || "center",
    vertical: e[1] || "top"
  };
}
function th(t) {
  return ie(t) ? T({ top: 0, left: 0, right: 0, bottom: 0 }, t) : {
    top: t,
    left: t,
    right: t,
    bottom: t
  };
}
function nh(t, e) {
  e.textContent = t;
  var n;
  try {
    var i, r = t === "";
    return e.textContent = r ? "dummy" : t, n = e.getBBox(), i = {
      width: n.width + n.x * 2,
      height: n.height
    }, r && (i.width = 0), i;
  } catch (o) {
    return console.log(o), { width: 0, height: 0 };
  }
}
function ih(t, e, n) {
  for (var i = t.shift(), r = i, o; ; ) {
    if (o = nh(r, n), o.width = r ? o.width : 0, r === " " || r === "" || o.width < Math.round(e) || r.length < 2)
      return rh(t, r, i, o);
    r = sh(r, o.width, e);
  }
}
function rh(t, e, n, i) {
  if (e.length < n.length) {
    var r = n.slice(e.length).trim();
    t.unshift(r);
  }
  return {
    width: i.width,
    height: i.height,
    text: e
  };
}
var Os = "­";
function oh(t, e) {
  var n = t.split(/(\s|-|\u00AD)/g), i, r = [], o = 0;
  if (n.length > 1)
    for (; i = n.shift(); )
      if (i.length + o < e)
        r.push(i), o += i.length;
      else {
        (i === "-" || i === Os) && r.pop();
        break;
      }
  var s = r[r.length - 1];
  return s && s === Os && (r[r.length - 1] = "-"), r.join("");
}
function sh(t, e, n) {
  var i = Math.max(t.length * (n / e), 1), r = oh(t, i);
  return r || (r = t.slice(0, Math.max(Math.round(i - 1), 1))), r;
}
function ah() {
  var t = document.getElementById("helper-svg");
  return t || (t = D("svg"), k(t, {
    id: "helper-svg"
  }), Cu(t, {
    visibility: "hidden",
    position: "fixed",
    width: 0,
    height: 0
  }), document.body.appendChild(t)), t;
}
function Si(t) {
  this._config = T({}, {
    size: Zd,
    padding: Yd,
    style: {},
    align: "center-top"
  }, t || {});
}
Si.prototype.createText = function(t, e) {
  return this.layoutText(t, e).element;
};
Si.prototype.getDimensions = function(t, e) {
  return this.layoutText(t, e).dimensions;
};
Si.prototype.layoutText = function(t, e) {
  var n = T({}, this._config.size, e.box), i = T({}, this._config.style, e.style), r = eh(e.align || this._config.align), o = th(e.padding !== void 0 ? e.padding : this._config.padding), s = e.fitBox || !1, a = ch(i), c = t.split(/\u00AD?\r?\n/), u = [], l = n.width - o.left - o.right, d = D("text");
  k(d, { x: 0, y: 0 }), k(d, i);
  var h = ah();
  for (I(h, d); c.length; )
    u.push(ih(c, l, d));
  r.vertical === "middle" && (o.top = o.bottom = 0);
  var f = vn(u, function(x, y, v) {
    return x + (a || y.height);
  }, 0) + o.top + o.bottom, p = vn(u, function(x, y, v) {
    return y.width > x ? y.width : x;
  }, 0), m = o.top;
  r.vertical === "middle" && (m += (n.height - f) / 2), m -= (a || u[0].height) / 4;
  var g = D("text");
  k(g, i), A(u, function(x) {
    var y;
    switch (m += a || x.height, r.horizontal) {
      case "left":
        y = o.left;
        break;
      case "right":
        y = (s ? p : l) - o.right - x.width;
        break;
      default:
        y = Math.max(((s ? p : l) - x.width) / 2 + o.left, 0);
    }
    var v = D("tspan");
    k(v, { x: y, y: m }), v.textContent = x.text, I(g, v);
  }), Y(d);
  var E = {
    width: p,
    height: f
  };
  return {
    dimensions: E,
    element: g
  };
};
function ch(t) {
  if ("fontSize" in t && "lineHeight" in t)
    return t.lineHeight * parseInt(t.fontSize, 10);
}
const uh = 12, lh = 1.2, dh = 30;
var mt;
let hh = (mt = class {
  constructor() {
    const e = {
      fontFamily: "Arial, sans-serif",
      fontSize: uh,
      fontWeight: "normal",
      lineHeight: lh
    }, n = T(
      e,
      {
        fontSize: e.fontSize - 1
      }
      // (config && config.externalStyle) || {},
    );
    this.config = {
      defaultStyle: e,
      externalStyle: n
    }, this.textUtil = new Si({
      style: this.config.defaultStyle
    });
  }
  /**
   * Get the new bounds of an externally rendered and arranged label.
   */
  getExternalLabelBounds(e, n) {
    const i = this.textUtil.getDimensions(n, {
      box: {
        width: 90,
        height: 30
      },
      style: this.config.externalStyle
    });
    return {
      x: Math.round(e.x + e.width / 2 - i.width / 2),
      y: Math.round(e.y),
      width: Math.ceil(i.width),
      height: Math.ceil(i.height)
    };
  }
  /**
   * Get the new bounds of text annotation.
   */
  getTextAnnotationBounds(e, n) {
    const i = this.textUtil.getDimensions(n, {
      box: e,
      style: this.config.defaultStyle,
      align: "center-top",
      padding: 5
    });
    return {
      x: e.x,
      y: e.y,
      width: e.width,
      height: Math.max(
        dh,
        Math.round(i.height)
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
  createText(e, n) {
    return this.textUtil.createText(e, n || {});
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
}, mt.$inject = ["config.textRenderer"], mt);
const Ac = {
  __init__: ["domainStoryTextRenderer"],
  domainStoryTextRenderer: ["type", hh]
};
var _t;
let fh = (_t = class {
  constructor(e) {
    this.registry = e, this.fullyInitialized = !1;
  }
  /**
   * Initially, the registry has only the root-Element.
   * Once the canvas has bees initialized, we adjust the reference to point to the elements on the canvas for convenience
   */
  correctInitialize() {
    this.fullyInitialized || this.registry.find(
      (n) => n.id.startsWith("__implicitroot")
    ) && (this.fullyInitialized = !0);
  }
  clear() {
    this.fullyInitialized = !1;
  }
  createObjectListForDSTDownload() {
    if (this.registry) {
      const e = this.getAllCanvasObjects(), n = this.getAllGroups(), i = [];
      return this.fillListOfCanvasObjects(e, i, n), i;
    }
    return [];
  }
  getAllActivities() {
    const e = [];
    return this.getAllCanvasObjects().forEach((n) => {
      n.type.includes(S.ACTIVITY) && e.push(n);
    }), e;
  }
  getAllCanvasObjects() {
    var i;
    const e = [], n = [];
    for (this.checkChildForGroup(n, e); n.length >= 1; ) {
      const r = n.pop();
      (i = r == null ? void 0 : r.children) == null || i.forEach((o) => {
        o.type.includes(S.GROUP) && n.push(o);
      });
    }
    return e;
  }
  // returns all groups on the canvas and inside other groups
  getAllGroups() {
    var r;
    const e = [], n = [];
    this.checkChildForGroup(e, n);
    for (const o of e)
      (r = o.children) == null || r.forEach((s) => {
        s.type.includes(S.GROUP) && e.push(s);
      });
    const i = /* @__PURE__ */ new Set();
    return e.filter((o) => {
      const s = !i.has(o.id);
      return s && i.add(o.id), s;
    });
  }
  // get a list of activities, that originate from an actor-type
  getActivitiesFromActors() {
    const e = [];
    return this.getAllActivities().forEach((i) => {
      var r;
      (r = i.source) != null && r.type.includes(S.ACTOR) && e.push(i);
    }), e.sort(
      (i, r) => {
        const o = Number(i.businessObject.number), s = Number(r.businessObject.number);
        return o - s;
      }
    ), e;
  }
  getActivityFromActorById(e) {
    return this.getActivitiesFromActors().find((n) => n.id === e);
  }
  getUsedIcons() {
    const e = this.getAllActors(), n = this.getAllWorkobjects();
    return {
      actors: e.map((i) => i.type.replace(S.ACTOR, "")),
      workobjects: n.map(
        (i) => i.type.replace(S.WORKOBJECT, "")
      )
    };
  }
  getAllWorkobjects() {
    return this.getAllCanvasObjects().filter(
      (e) => e.type.includes(S.WORKOBJECT)
    );
  }
  fillListOfCanvasObjects(e, n, i) {
    e.forEach((r) => {
      r.type === S.ACTIVITY ? n.push(r) : (r.type === S.TEXTANNOTATION && (r.businessObject.width = r.width, r.businessObject.height = r.height), n.includes(r) || n.unshift(r));
    }), i.forEach((r) => {
      n.push(r);
    });
  }
  checkChildForGroup(e, n) {
    const i = this.registry.getAll();
    for (const r of i)
      if (r.businessObject) {
        const o = r.type;
        o && o.includes(S.GROUP) ? e.push(r) : o && n.push(r);
      }
  }
  getAllActors() {
    return this.getAllCanvasObjects().filter(
      (e) => e.type.includes(S.ACTOR)
    );
  }
}, _t.$inject = ["elementRegistry"], _t);
const Eo = class Eo {
  constructor() {
    this.isDirtySubject = new ku(!1), this.dirty$ = this.isDirtySubject.asObservable();
  }
  get dirty() {
    return this.isDirtySubject.value;
  }
  makeDirty() {
    this.isDirtySubject.next(!0);
  }
  makeClean() {
    this.isDirtySubject.next(!1);
  }
};
Eo.$inject = [];
let hr = Eo;
const ot = {
  __init__: ["domainStoryElementRegistryService", "domainStoryDirtyFlagService"],
  domainStoryElementRegistryService: ["type", fh],
  domainStoryDirtyFlagService: ["type", hr]
};
class Q {
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
  has(e) {
    return this.entries.some((n) => n.key === e);
  }
  set(e, n) {
    this.has(e) || this.entries.push(new ph(n, e));
  }
  add(e, n) {
    this.set(n, e);
  }
  putEntry(e) {
    this.has(e.key) || this.entries.push(e);
  }
  keysArray() {
    return this.entries.map((e) => e.key);
  }
  addEach(e) {
    Object.keys(e).forEach((n) => {
      this.set(n, e[n]);
    });
  }
  addBuiltInIcons(e) {
    e.entries.forEach((n) => {
      this.has(n.key) || this.entries.push(n);
    });
  }
  appendDict(e) {
    e.entries.forEach((n) => this.putEntry(n));
  }
  clear() {
    this.entries = [];
  }
  delete(e) {
    this.entries = this.entries.filter((n) => n.key !== e);
  }
  get(e) {
    const n = this.entries.filter((i) => i.key === e);
    return n[0] ? n[0].value : null;
  }
}
class ph {
  constructor(e, n, i = []) {
    this.value = e, this.key = n, this.keyWords = i;
  }
}
function gh(t) {
  return t.replaceAll("--", "––");
}
function gn(t) {
  if (!t)
    return "";
  const e = t.lastIndexOf(".") > 0 ? t.substring(0, t.lastIndexOf(".")) : t, n = {
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
  }, i = /[/\\:*?"<>|() ]/gi;
  return e.trim().replace(i, (r) => n[r]);
}
const Ts = "icon-domain-story-", rn = new Q(), wo = class wo {
  constructor() {
    this.selectedActorsDictionary = new Q(), this.selectedWorkObjectsDictionary = new Q();
  }
  /** Load Icons from Configuration **/
  addIconsFromIconSetConfiguration(e, n) {
    let i;
    e === S.ACTOR ? i = this.selectedActorsDictionary : e === S.WORKOBJECT && (i = this.selectedWorkObjectsDictionary);
    const r = new Q();
    r.appendDict(rn), n.forEach((o) => {
      if (!i.has(o)) {
        const s = r.get(o);
        s && this.registerIconForType(e, o, s);
      }
    });
  }
  addIconsToTypeDictionary(e, n) {
    this.allInTypeDictionary(S.ACTOR, e) || this.addIconsFromIconSetConfiguration(
      S.ACTOR,
      e.map((i) => pn(i.type))
    ), this.allInTypeDictionary(S.WORKOBJECT, n) || this.addIconsFromIconSetConfiguration(
      S.WORKOBJECT,
      n.map((i) => pn(i.type))
    );
  }
  registerIconForType(e, n, i) {
    if (n.includes(e))
      throw new Error("Name should not include type!");
    let r = new Q();
    e === S.ACTOR ? r = this.selectedActorsDictionary : e === S.WORKOBJECT && (r = this.selectedWorkObjectsDictionary), r.add(i, n);
  }
  unregisterIconForType(e, n) {
    if (n.includes(e))
      throw new Error("Name should not include type!");
    let i = new Q();
    e === S.ACTOR ? i = this.selectedActorsDictionary : e === S.WORKOBJECT && (i = this.selectedWorkObjectsDictionary), i.delete(n);
  }
  updateIconRegistries(e, n, i) {
    const r = new Q();
    this.extractCustomIconsFromDictionary(i.actors, r), this.extractCustomIconsFromDictionary(i.workObjects, r), r.keysArray().forEach((s) => {
      const a = r.get(s);
      this.addIMGToIconDictionary(a, s);
    });
    const o = new Q();
    o.appendDict(i.actors), o.appendDict(i.workObjects), this.addIconsToCss(o), this.addIconsToTypeDictionary(e, n);
  }
  addIMGToIconDictionary(e, n) {
    rn.set(n, e);
  }
  addIconsToCss(e) {
    const n = document.getElementById("iconsCss");
    e.keysArray().forEach((i) => {
      var a;
      let r = e.get(i);
      r = r.replace(/<svg[^>]+>/, (c) => c.replace(/ (width|height)="[^"]*"/g, ""));
      const o = btoa(r), s = `
                .${Ts}${gn(i.toLowerCase())}::before {
                  mask-image: url('data:image/svg+xml;base64,${o}');
                }
            `;
      (a = n == null ? void 0 : n.sheet) == null || a.insertRule(s, n.sheet.cssRules.length);
    });
  }
  /** Getter & Setter **/
  getFullDictionary() {
    const e = new Q();
    return e.appendDict(rn), e;
  }
  getIconsAssignedAs(e) {
    return e === S.ACTOR ? this.selectedActorsDictionary : e === S.WORKOBJECT ? this.selectedWorkObjectsDictionary : new Q();
  }
  getTypeIconSRC(e, n) {
    if (e === S.ACTOR)
      return this.selectedActorsDictionary.get(n);
    if (e === S.WORKOBJECT)
      return this.selectedWorkObjectsDictionary.get(n);
    throw new Error(`[IconDictionaryService] Unsupported value type: ${e}`);
  }
  getCSSClassOfIcon(e) {
    return Ts + gn(e.toLowerCase());
  }
  getIconSource(e) {
    if (rn.has(e))
      return rn.get(e);
    throw new Error(`[IconDictionaryService] Unsupported value name: ${e}`);
  }
  getActorsDictionary() {
    return this.selectedActorsDictionary;
  }
  getWorkObjectsDictionary() {
    return this.selectedWorkObjectsDictionary;
  }
  setIconSet(e) {
    this.selectedActorsDictionary = e.actors, this.selectedWorkObjectsDictionary = e.workObjects;
  }
  allInTypeDictionary(e, n) {
    let i;
    e === S.ACTOR ? i = this.selectedActorsDictionary : e === S.WORKOBJECT && (i = this.selectedWorkObjectsDictionary);
    let r = !0;
    if (n)
      n.forEach((o) => {
        i.has(pn(o.type)) || (r = !1);
      });
    else
      return !1;
    return r;
  }
  extractCustomIconsFromDictionary(e, n) {
    e.keysArray().forEach((i) => {
      const r = gn(i);
      this.getFullDictionary().has(r) || n.add(e.get(i), r);
    });
  }
};
wo.$inject = [];
let fr = wo;
var xt;
let yh = (xt = class {
  constructor(e) {
    this.iconDictionaryService = e;
  }
  createIconSetConfiguration(e) {
    if (e === void 0)
      return {
        actors: new Q(),
        workObjects: new Q()
      };
    const n = new Q(), i = new Q();
    return Object.keys(e.actors).forEach((r) => {
      const o = e.actors[r];
      o && n.add(o, gn(r));
    }), Object.keys(e.workObjects).forEach((r) => {
      const o = e.workObjects[r];
      o && i.add(o, gn(r));
    }), {
      actors: n,
      workObjects: i
    };
  }
  loadConfiguration(e) {
    let n = new Q(), i = new Q();
    e.actors.keysArray() ? (n = e.actors, i = e.workObjects) : (n.addEach(e.actors), i.addEach(e.workObjects));
    const r = n.keysArray(), o = i.keysArray();
    this.iconDictionaryService.updateIconRegistries([], [], e), this.iconDictionaryService.addIconsFromIconSetConfiguration(
      S.ACTOR,
      r
    ), this.iconDictionaryService.addIconsFromIconSetConfiguration(
      S.WORKOBJECT,
      o
    );
  }
  getCurrentConfigurationForExport() {
    const e = this.getCurrentConfiguration();
    if (e) {
      const n = {}, i = {};
      return e.actors.all().forEach((r) => {
        n[r.key] = r.value;
      }), e.workObjects.all().forEach((r) => {
        i[r.key] = r.value;
      }), {
        actors: n,
        workObjects: i
      };
    }
  }
  getCurrentConfiguration() {
    const e = this.iconDictionaryService.getActorsDictionary(), n = this.iconDictionaryService.getWorkObjectsDictionary();
    let i;
    return e.size() > 0 && n.size() > 0 && (i = this.createConfigFromDictionaries(
      e,
      n
    )), i;
  }
  createConfigFromDictionaries(e, n) {
    const i = e.keysArray(), r = n.keysArray(), o = new Q(), s = new Q();
    return i.forEach((a) => {
      o.add(e.get(a), a.replace(S.ACTOR, ""));
    }), r.forEach((a) => {
      s.add(
        n.get(a),
        a.replace(S.WORKOBJECT, "")
      );
    }), {
      actors: o,
      workObjects: s
    };
  }
}, xt.$inject = ["domainStoryIconDictionaryService"], xt);
const Xt = {
  __init__: [
    "domainStoryIconDictionaryService",
    "domainStoryIconSetImportExportService"
  ],
  domainStoryIconDictionaryService: ["type", fr],
  domainStoryIconSetImportExportService: ["type", yh]
};
var vh = 1e3;
function Jt(t, e) {
  var n = this;
  e = e || vh, t.on(["render.shape", "render.connection"], e, function(i, r) {
    var o = i.type, s = r.element, a = r.gfx, c = r.attrs;
    if (n.canRender(s))
      return o === "render.shape" ? n.drawShape(a, s, c) : n.drawConnection(a, s, c);
  }), t.on(["render.getShapePath", "render.getConnectionPath"], e, function(i, r) {
    if (n.canRender(r))
      return i.type === "render.getShapePath" ? n.getShapePath(r) : n.getConnectionPath(r);
  });
}
Jt.prototype.canRender = function(t) {
};
Jt.prototype.drawShape = function(t, e) {
};
Jt.prototype.drawConnection = function(t, e) {
};
Jt.prototype.getShapePath = function(t) {
};
Jt.prototype.getConnectionPath = function(t) {
};
function ce(t, e) {
  if (!t)
    return !1;
  const n = nt(t);
  return n && n.type === e;
}
function nt(t) {
  return t && t.businessObject || t;
}
function pr(t, e) {
  t.children.slice().forEach((n) => {
    n.id !== e.id && n.x >= e.x && n.x <= e.x + e.width && n.y >= e.y && n.y <= e.y + e.height && (n.children.includes(e) && n.children.remove(e), n.parent = e, e.children.includes(n) || e.children.push(n));
  });
}
function mh(t, e) {
  var s, a;
  const n = t.parent;
  t.children.remove(e), n.children.add(e), e.parent = n;
  const i = (s = document.querySelector(
    "[data-element-id=" + e.id + "]"
  )) == null ? void 0 : s.parentElement;
  if (!i)
    throw new Error("No element with id " + e.id + " found.");
  const r = i.parentElement, o = (a = r == null ? void 0 : r.parentElement) == null ? void 0 : a.parentElement;
  r == null || r.removeChild(i), o == null || o.appendChild(i);
}
function _h(t) {
  return t.startsWith("data");
}
function xh(t) {
  return t.startsWith("data:image/svg");
}
function gr(t) {
  const e = {
    d: "m {mx}, {my} m 10,0 l -10,0 l 0,{e.y0} l 10,0",
    height: 30,
    width: 10,
    heightElements: [30],
    widthElements: [10]
  };
  let n, i;
  t.abspos ? (n = t.abspos.x, i = t.abspos.y) : (n = t.containerWidth * t.position.mx, i = t.containerHeight * t.position.my);
  const r = {};
  if (t.position) {
    const o = t.containerHeight / e.height * t.yScaleFactor, s = t.containerWidth / e.width * t.xScaleFactor;
    for (let a = 0; a < e.heightElements.length; a++)
      r["y" + a] = e.heightElements[a] * o;
    for (let a = 0; a < e.widthElements.length; a++)
      r["x" + a] = e.widthElements[a] * s;
  }
  return bh(e.d, {
    mx: n,
    my: i,
    e: r
  });
}
function bh(t, e) {
  return t.replace(Eh, function(n, i) {
    return Sh(n, i, e);
  });
}
const Eh = /\{([^{}]+)}/g, wh = /(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[(['"])(.+?)\2])(\(\))?/g;
function Sh(t, e, n) {
  let i = n;
  return e.replace(
    wh,
    function(r, o, s, a, c) {
      if (o = o || a, i)
        return o in i && (i = i[o]), typeof i == "function" && c && (i = i());
    }
  ), i = (i == null || i == n ? t : i) + "", i;
}
function Cc(t) {
  return t.type.includes(S.ACTOR) || t.type.includes(S.WORKOBJECT) || t.type.includes(S.ACTIVITY) || t.type.includes(S.GROUP) ? "name" : t.type.includes(S.TEXTANNOTATION) ? "text" : "";
}
function Oc(t) {
  return ce(t, S.ACTIVITY) ? "number" : "";
}
function Tc(t) {
  let e;
  t.businessObject ? e = t.businessObject : e = t;
  const n = Cc(e);
  if (n && e)
    return e[n] || "";
}
function Ah(t) {
  const e = t.businessObject, n = Oc(e);
  if (n)
    return e[n] || "";
}
function Ch(t, e) {
  let n;
  t.businessObject ? n = t.businessObject : n = t;
  const i = Cc(n);
  return i && (n[i] = e), t;
}
function Oh(t, e) {
  const n = t.businessObject, i = Oc(n);
  return i && (n[i] = e), t;
}
function Th(t, e) {
  let i = 0;
  for (let r = 0; r < t.length; r++)
    (e[r] === 0 || e[r] === 180) && Math.abs(t[r].x - t[r + 1].x) > 49 && (i = r);
  return i;
}
function Rh(t) {
  if (!t)
    return 0;
  let e = t.length * 5.1;
  return e = e / 2, e += 20, e;
}
function kh(t, e, n, i) {
  c();
  let r, o;
  t.addEventListener("input", function() {
    var h;
    if (e.length === 0)
      return;
    n.type.includes(S.WORKOBJECT) && (this.value = this.innerHTML);
    const u = this.value;
    let l;
    c(), r = -1;
    const d = document.createElement("DIV");
    d.setAttribute("id", "autocomplete-list"), d.setAttribute("class", "autocomplete-items"), (h = this.parentNode) == null || h.appendChild(d), o = [];
    for (const f of e)
      u && f.substring(0, u.length).toUpperCase() === u.toUpperCase() && (l = document.createElement("DIV"), l.innerHTML = "<strong>" + f.substring(0, u.length) + "</strong>" + f.substring(u.length), l.innerHTML += "<input type='hidden' value='" + f + "'>", d.appendChild(l), o.push(f));
    n.type.includes(S.ACTOR) && (d.style.visibility = "hidden");
  }), t.onkeydown = function(u) {
    let l = document.getElementById("autocomplete-list");
    if (l)
      l = l.getElementsByTagName("div");
    else
      return;
    switch (u.key) {
      case "40": {
        r++, s(l);
        break;
      }
      case "38": {
        r--, s(l);
        break;
      }
      case "13": {
        u.preventDefault(), r > -1 && (n.businessObject.name = o[r], i.fire("element.changed", { element: n }));
        break;
      }
    }
  };
  function s(u) {
    return !u || u.length < 1 ? !1 : (a(u), r >= u.length && (r = 0), r < 0 && (r = u.length - 1), u[r].classList.add("autocomplete-active"), !0);
  }
  function a(u) {
    u.length > 1 && Array.from(u).forEach((l) => {
      l.classList.remove("autocomplete-active");
    });
  }
  function c(u) {
    const l = document.getElementsByClassName("autocomplete-items");
    Array.from(l).forEach((d) => {
      var h;
      u != d && u != t && ((h = d.parentNode) == null || h.removeChild(d));
    });
  }
  document.addEventListener("click", function(u) {
    c(u.target);
  });
}
const Ph = {
  width: 0,
  height: 0
}, So = class So {
  constructor(e, n) {
    this.modeling = e, this.domainStoryTextRenderer = n;
  }
  execute(e) {
    return e.oldLabel = Tc(e.element), e.oldNumber = Ah(e.element), this.setText(e.element, e.newLabel, e.newNumber);
  }
  revert(e) {
    return this.setText(e.element, e.oldLabel, e.oldNumber);
  }
  postExecute(e) {
    const n = e.element, i = n.label || n;
    let r = e.newBounds;
    if (ce(n, S.TEXTANNOTATION)) {
      const o = nt(i), s = o.name || o.text;
      if (!s)
        return;
      typeof r > "u" && (r = this.domainStoryTextRenderer.getExternalLabelBounds(
        i,
        s
      )), r && this.modeling.resizeShape(i, r, Ph);
    }
  }
  setText(e, n, i) {
    const r = e.label || e, o = e.number || e, s = e.labelTarget || e, a = e.numberTarget || e;
    return Ch(r, n), Oh(o, i), [r, s, o, a];
  }
};
So.$inject = ["modeling", "domainStoryTextRenderer"];
let yr = So;
var Mh = 1e3;
function oe(t) {
  this._eventBus = t;
}
oe.$inject = ["eventBus"];
function Ih(t, e) {
  return function(n) {
    return t.call(e || null, n.context, n.command, n);
  };
}
oe.prototype.on = function(t, e, n, i, r, o) {
  if ((Z(e) || j(e)) && (o = r, r = i, i = n, n = e, e = null), Z(n) && (o = r, r = i, i = n, n = Mh), ie(r) && (o = r, r = !1), !Z(i))
    throw new Error("handlerFn must be a function");
  L(t) || (t = [t]);
  var s = this._eventBus;
  A(t, function(a) {
    var c = ["commandStack", a, e].filter(function(u) {
      return u;
    }).join(".");
    s.on(c, n, r ? Ih(i, o) : i, o);
  });
};
oe.prototype.canExecute = Me("canExecute");
oe.prototype.preExecute = Me("preExecute");
oe.prototype.preExecuted = Me("preExecuted");
oe.prototype.execute = Me("execute");
oe.prototype.executed = Me("executed");
oe.prototype.postExecute = Me("postExecute");
oe.prototype.postExecuted = Me("postExecuted");
oe.prototype.revert = Me("revert");
oe.prototype.reverted = Me("reverted");
function Me(t) {
  return function(n, i, r, o, s) {
    (Z(n) || j(n)) && (s = o, o = r, r = i, i = n, n = null), this.on(n, t, i, r, o, s);
  };
}
function On(t) {
  oe.call(this, t), this.init();
}
On.$inject = ["eventBus"];
Vt(On, oe);
On.prototype.addRule = function(t, e, n) {
  var i = this;
  typeof t == "string" && (t = [t]), t.forEach(function(r) {
    i.canExecute(r, e, function(o, s, a) {
      return n(o);
    }, !0);
  });
};
On.prototype.init = function() {
};
const $n = 1500, ae = 125;
function hi(t) {
  return t && /^domainStory:group/.test(t.type);
}
function vr(t) {
  return t && /^domainStory:actor\w*/.test(t.type);
}
function jh(t) {
  return t && /^domainStory:workObject/.test(t.type);
}
function mr(t) {
  return t && /^domainStory:activity/.test(t.type);
}
function mn(t) {
  return t && /^domainStory:connection/.test(t.type);
}
function un(t) {
  return t && /^domainStory:textAnnotation/.test(t.type);
}
function _n(t) {
  return t && /^__implicitroot/.test(t.id);
}
function Dh(t) {
  var e;
  return t && !!((e = t.label) != null && e.labelTarget);
}
function Lh(t) {
  return !t || Dh(t);
}
function Nh(t) {
  return Lh(t) ? null : !1;
}
function Ki(t, e) {
  return _n(e) || _n(t) || hi(e) || t === e || vr(t) && vr(e) || mr(t) || mr(e) || mn(t) || mn(e) ? !1 : un(e) ? { type: S.CONNECTION } : { type: S.ACTIVITY };
}
function Hh(t, e) {
  if (ce(t, S.GROUP)) {
    if (e) {
      const n = { x: t.x, y: t.y + t.height }, i = { x: t.x + t.width, y: t.y + t.height }, r = { x: t.x + t.width, y: t.y };
      e.x !== t.x && e.y !== t.y && (e.x > i.x - ae && T(e, { x: i.x - ae }), e.y > i.y - ae && T(e, { y: i.y - ae })), e.x !== t.x && e.y === t.y && e.x > r.x - ae && T(e, { x: r.x - ae }), e.x === t.x && e.y !== t.y && e.y > n.y - ae && T(e, { y: n.y - ae }), e.height < ae && T(e, {
        height: ae
      }), e.width < ae && T(e, {
        width: ae
      });
    }
    return !0;
  }
  return !1;
}
function Bh(t, e, n) {
  return mr(n) && un(e) || mn(n) && un(t) && un(e) ? !1 : !(mn(n) && !un(e) && (vr(t) || jh(t)));
}
var bt;
let Wh = (bt = class extends On {
  constructor(e) {
    super(e);
  }
  init() {
    this.addRule("elements.create", (e) => {
      const n = e.elements, i = e.target;
      return vi(n, (r) => mn(r) ? !r.source || !r.target ? !1 : Ki(r.source, r.target) : this.canCreate(r, i));
    }), this.addRule("elements.move", $n, (e) => {
      const n = e.target, i = e.shapes;
      return vn(
        i,
        (r, o) => r === !1 ? !1 : this.canCreate(o, n),
        void 0
      );
    }), this.addRule("shape.create", $n, (e) => {
      const n = e.target, i = e.shape;
      return this.canCreate(i, n);
    }), this.addRule("connection.create", $n, (e) => {
      const n = e.source, i = e.target;
      return Ki(n, i);
    }), this.addRule("connection.reconnect", $n, (e) => {
      const n = e.connection, i = e.hover || e.source, r = e.target;
      if (Bh(i, r, n))
        return Ki(i, r);
    }), this.addRule("shape.resize", function(e) {
      const n = e.shape, i = e.newBounds;
      return Hh(n, i);
    }), this.addRule("connection.start", function(e) {
      const n = e.source;
      return Nh(n);
    }), this.addRule("connection.updateWaypoints", function(e) {
      return {
        type: e.connection.type
      };
    }), this.addRule("element.copy", function() {
      return !0;
    });
  }
  /**
   * can a shape be created on target?
   */
  canCreate(e, n) {
    return _n(n) || hi(e) || hi(n);
  }
}, bt.$inject = ["eventBus"], bt), Rc = 0, _r = !1;
function zh() {
  const t = { use: _r, number: Rc };
  return _r = !1, t;
}
function Rs(t) {
  setTimeout(() => t.focus(), 0);
}
const Ao = class Ao {
  constructor(e, n, i, r, o, s, a, c) {
    this.modeling = e, this.domainStoryTextRenderer = n, this.labelDictionaryService = i, this.eventBus = r, this.canvas = o, this.directEditing = s, c.registerHandler(
      "element.updateLabel",
      yr
    ), this.directEditing.registerProvider(this), r.on("element.dblclick", (u) => {
      this.activateDirectEdit(u.element), ce(u.element, S.ACTIVITY) && (Rc = u.element.businessObject.number, _r = !1, this.directEditing.complete());
    }), r.on(
      [
        "element.mousedown",
        "drag.init",
        "canvas.viewbox.changing",
        "autoPlace",
        "popupMenu.open"
      ],
      () => {
        this.directEditing.isActive() && this.directEditing.complete();
      }
    ), r.on(["commandStack.changed"], () => {
      this.directEditing.isActive() && this.directEditing.cancel();
    }), r.on("directEditing.activate", (u) => {
      a.removeResizers();
      const l = u.active.element;
      this.createAutocomplete(l);
    }), r.on("create.end", 500, (u) => {
      const l = u.shape;
      if (!u.context.canExecute)
        return;
      ce(l, S.ACTIVITY) || this.activateDirectEdit(l);
      const h = document.getElementsByClassName(
        "djs-direct-editing-content"
      );
      Rs(h.item(0));
    }), r.on("autoPlace.end", 500, (u) => {
      this.activateDirectEdit(u.shape);
    });
  }
  /**
   * activate direct editing for activities and text annotations.
   * @return an object with properties bounds (position and size), text and options
   */
  activate(e) {
    if (_n(e))
      return;
    const n = Tc(e);
    if (n === void 0)
      return;
    const i = {
      text: n
    }, r = this.getEditingBBox(e);
    T(i, r);
    const o = {};
    return ce(e, S.TEXTANNOTATION) && T(o, {
      resizable: !0,
      autoResize: !0
    }), T(i, {
      options: o
    }), i;
  }
  /**
   * get the editing bounding box based on the element's size and position
   * @return an object containing information about position
   *         and size (fixed or minimum and/or maximum)
   */
  getEditingBBox(e) {
    var l, d;
    const n = e.label || e, i = this.canvas.getAbsoluteBBox(n), r = { x: i.x, y: i.y }, o = this.canvas.zoom(), s = this.domainStoryTextRenderer.getDefaultStyle(), a = ((s == null ? void 0 : s.fontSize) ?? 1) * o, c = s == null ? void 0 : s.lineHeight, u = {
      fontFamily: (l = this.domainStoryTextRenderer.getDefaultStyle()) == null ? void 0 : l.fontFamily,
      fontWeight: (d = this.domainStoryTextRenderer.getDefaultStyle()) == null ? void 0 : d.fontWeight
    };
    return ce(e, S.GROUP) && (T(r, {
      minWidth: i.width / 2.5 > 125 ? i.width / 2.5 : 125,
      maxWidth: i.width,
      minHeight: 30 * o,
      x: i.x,
      y: i.y
    }), T(u, {
      fontSize: a + "px",
      lineHeight: c,
      paddingTop: 7 * o + "px",
      paddingBottom: 7 * o + "px",
      paddingLeft: 5 * o + "px",
      paddingRight: 5 * o + "px",
      textAlign: "left"
    })), // we can't use util's is() function here because the type contains the name of the icon
    (/^domainStory:actor\w*/.test(e.type) || /^domainStory:workObject\w*/.test(e.type)) && (T(r, {
      width: i.width,
      minHeight: 30,
      y: i.y + i.height - 20,
      x: i.x
    }), T(u, {
      fontSize: a + "px",
      lineHeight: c,
      paddingTop: 7 * o + "px",
      paddingBottom: 7 * o + "px",
      paddingLeft: 5 * o + "px",
      paddingRight: 5 * o + "px"
    })), ce(e, S.TEXTANNOTATION) && (T(r, {
      width: i.width,
      height: i.height,
      minWidth: 30 * o,
      minHeight: 10 * o
    }), T(u, {
      textAlign: "left",
      paddingTop: 7 * o + "px",
      paddingBottom: 7 * o + "px",
      paddingLeft: 5 * o + "px",
      paddingRight: 5 * o + "px",
      fontSize: a + "px",
      lineHeight: c
    })), { bounds: r, style: u };
  }
  update(e, n, i) {
    const r = this.canvas.getAbsoluteBBox(e);
    let o;
    ce(e, S.TEXTANNOTATION) || (o = {
      x: e.x,
      y: e.y,
      width: e.width / r.width * i.width,
      height: e.height / r.height * i.height
    }), this.modeling.updateLabel(
      e,
      gh(n),
      o
    );
  }
  activateDirectEdit(e) {
    this.directEditing.activate(e);
  }
  createAutocomplete(e) {
    const n = document.getElementsByClassName("djs-direct-editing-content");
    Rs(n.item(0)), kh(
      n[0],
      this.labelDictionaryService.getUniqueWorkObjectNames(),
      e,
      this.eventBus
    );
  }
};
Ao.$inject = [
  "modeling",
  "domainStoryTextRenderer",
  "domainStoryLabelDictionaryService",
  "eventBus",
  "canvas",
  "directEditing",
  "resizeHandles",
  "commandStack"
];
let xr = Ao;
function Vn(t) {
  return t * 180 / Math.PI;
}
function Tn(t, e) {
  let n;
  t.x <= e.x ? t.y >= e.y ? n = 0 : n = 3 : t.y >= e.y ? n = 1 : n = 2;
  const i = Math.abs(t.y - e.y), r = Math.abs(t.x - e.x);
  if (n === 0)
    return 90 - Vn(Math.atan2(r, i));
  if (n === 1)
    return 90 + Vn(Math.atan2(r, i));
  if (n === 2)
    return 270 - Vn(Math.atan2(r, i));
  if (n === 3)
    return 270 + Vn(Math.atan2(r, i));
  throw new Error("The value of quadrant is invalid.");
}
function Uh(t) {
  const e = "center";
  let r = 0;
  t.waypoints.length > 1 && (r = Tn(
    // Start of a first arrow segment
    t.waypoints[0],
    // End of a first arrow segment
    t.waypoints[1]
  ) ?? 0);
  let o = t.waypoints[0].x, s = t.waypoints[0].y, a = 0, c = 0, u = 0, l = 0;
  return r >= 0 && r <= 45 ? (a = 25, l = 20 * (1 - r / 45)) : r <= 90 ? (a = 5, u = 15 * (1 - (r - 45) / 45)) : r <= 135 ? (a = 5, u = -20 * ((r - 90) / 45)) : r <= 180 ? (a = -15, l = 20 * ((r - 135) / 45)) : r <= 225 ? (a = -15, c = 15, l = 25 * ((r - 180) / 45)) : r <= 270 ? (a = 5, u = -20 * (1 - (r - 225) / 45), c = 40) : r <= 315 ? (a = 5, u = 25 * ((r - 270) / 45), c = 40) : (a = 25, c = 20, l = 15 * (1 - (r - 315) / 45)), o = o + a + u, s = s + c + l, {
    textAlign: e,
    width: 30,
    height: 30,
    x: o,
    y: s
  };
}
function Fh(t) {
  return t.split(/\r\n|\r|\n/).length;
}
function Kh(t, e = 1) {
  const n = t.length;
  let i, r, o;
  if (n > 2) {
    const s = new Array(n - 1);
    for (let c = 0; c < n - 1; c++)
      s[c] = Tn(t[c], t[c + 1]);
    const a = Th(t, s);
    return r = ks(
      t[a],
      t[a + 1]
    ), o = Ps(
      t[a],
      t[a + 1],
      e
    ), i = {
      x: r,
      y: o,
      selected: a
    }, i;
  } else
    return r = ks(t[0], t[1]), o = Ps(t[0], t[1], e), i = {
      x: r,
      y: o,
      selected: 0
    }, i;
}
function ks(t, e) {
  const n = Tn(t, e);
  let i = 0, r = 0;
  return n === 0 || n === 180 || n === 90 || n === 270 ? i = 0 : n > 0 && n < 90 ? i = 5 - n / 6 : n > 90 && n < 180 ? (r = n - 90, i = 5 - r / 18) : n > 180 && n < 270 ? (r = n - 180, i = r / 18) : n > 270 && (r = n - 270, i = 5 - r / 6), i + (t.x + e.x) / 2;
}
function Ps(t, e, n = 1) {
  const i = Tn(t, e);
  let r = 0, o = 0;
  return i === 0 || i === 180 ? r = 15 : i === 90 || i === 270 ? r = 0 : i > 0 && i < 90 ? r = 15 - i / 6 : i > 90 && i < 180 ? (o = i - 90, r = -o / 9 * n) : i > 180 && i < 270 ? (o = i - 180, r = 15 - o / 3) : i > 270 && (o = i - 270, r = -o / 9 * n), r + (t.y + e.y) / 2;
}
const $h = new Pu(), Vh = [], $i = "#000000";
var Et;
let Gh = (Et = class extends Jt {
  constructor(e, n, i, r, o, s, a, c) {
    super(e, 2e3), this.styles = n, this.canvas = i, this.domainStoryTextRenderer = r, this.domainStoryNumberingRegistry = o, this.elementRegistryService = s, this.dirtyFlagService = a, this.iconDictionaryService = c, this.rendererId = $h.next(), this.markers = {}, e.on("bendpoint.move.start", 200, function(u) {
      H(u.context.draggerGfx).add("bendpoint-dragging"), i.addMarker(u.context.connection, "djs-element-hidden");
    }), e.on("bendpoint.move.end", 2e3, function(u) {
      i.removeMarker(u.context.connection, "djs-element-hidden");
    });
  }
  canRender(e) {
    return /^domainStory:/.test(e.type);
  }
  drawShape(e, n) {
    String.prototype.startsWith || Object.defineProperty(String.prototype, "startsWith", {
      value: function(r, o) {
        return o = !o || o < 0 ? 0 : +o, this.substring(o, o + r.length) === r;
      }
    });
    const i = n.type;
    if (n.businessObject.type = i, this.elementRegistryService.correctInitialize(), this.dirtyFlagService.makeDirty(), i.includes(S.ACTOR))
      return this.drawActor(e, n);
    if (i.includes(S.WORKOBJECT))
      return this.drawWorkObject(e, n);
    if (i.includes(S.TEXTANNOTATION))
      return this.drawAnnotation(e, n);
    if (i.includes(S.GROUP))
      return this.drawGroup(e, n);
    throw new Error("[DomainStoryRenderer] The type of the shape is invalid.");
  }
  getShapePath(e) {
    const n = e.type;
    return n.includes(S.ACTOR) ? this.getPath(e) : n.includes(S.WORKOBJECT) ? this.getPath(e) : n.includes(S.GROUP) ? this.getPath(e) : n.includes(S.TEXTANNOTATION) ? this.getPath(e) : super.getShapePath(e);
  }
  drawConnection(e, n) {
    const i = n.type;
    return this.dirtyFlagService.makeDirty(), n.businessObject.type || (n.businessObject.type = i), i === S.ACTIVITY ? this.drawActivity(e, n) : i === S.CONNECTION ? this.drawDSConnection(e, n) : super.drawConnection(e, n);
  }
  drawActor(e, n) {
    const i = {
      width: n.width,
      height: n.height
    };
    let r = this.iconDictionaryService.getTypeIconSRC(
      S.ACTOR,
      pn(n.type)
    );
    r = this.getIconSvg(r, n);
    const o = D(r);
    return k(o, i), I(e, o), this.renderActorAndWorkObjectLabel(e, n, "center", -5), o;
  }
  drawWorkObject(e, n) {
    const i = {
      width: n.width * 0.65,
      height: n.height * 0.65,
      x: n.width / 2 - 25,
      y: n.height / 2 - 25
    };
    let r = this.iconDictionaryService.getTypeIconSRC(
      S.WORKOBJECT,
      pn(n.type)
    ) ?? "";
    r = this.getIconSvg(r, n);
    const o = D(r);
    return k(o, i), I(e, o), this.renderActorAndWorkObjectLabel(e, n, "center", -5), o;
  }
  drawGroup(e, n) {
    n.businessObject.pickedColor || (n.businessObject.pickedColor = $i);
    const i = this.drawRect(
      e,
      n.width,
      n.height,
      0,
      0,
      T(
        {
          fill: "none",
          stroke: n.businessObject.pickedColor
        },
        n.attrs
      )
    );
    return this.renderActorAndWorkObjectLabel(e, n, "left-top", 8), i;
  }
  drawActivity(e, n) {
    this.adjustForTextOverlap(n);
    const i = this.useColorForActivity(n), r = I(e, oi(n.waypoints, i));
    return this.renderActivityLabel(e, n), this.renderExternalNumber(e, n), this.fixConnectionInHTML(e.parentElement), e.getAttribute("djs-dragger") && (H(e).remove("djs-dragger"), H(e).add("djs-connection-preview")), r;
  }
  drawDSConnection(e, n) {
    let i = "";
    return i = this.styles.computeStyle(i, {
      stroke: n.businessObject.pickedColor ?? "black",
      strokeWidth: 1.5,
      strokeLinejoin: "round",
      strokeDasharray: "5, 5"
    }), I(e, oi(n.waypoints, i));
  }
  drawAnnotation(e, n) {
    const i = {
      fill: "none",
      stroke: "none"
    }, r = n.businessObject.text || "";
    if (n.businessObject.text) {
      let a = n.height ?? 0;
      a === 0 && n.businessObject.number && (a = n.businessObject.number), T(n, {
        height: a
      }), T(n.businessObject, {
        number: a
      });
    }
    const o = this.drawRect(
      e,
      n.width,
      n.height,
      0,
      0,
      i
    ), s = gr({
      xScaleFactor: 1,
      yScaleFactor: 1,
      containerWidth: n.width,
      containerHeight: n.height,
      position: {
        mx: 0,
        my: 0
      }
    });
    return this.drawPath(e, s, {
      stroke: n.businessObject.pickedColor ?? "black"
    }), this.renderLabel(e, r, {
      box: n,
      align: "left-top",
      padding: 5,
      style: {
        fill: n.businessObject.pickedColor ?? "black"
      }
    }), o;
  }
  getActivityPath(e) {
    const n = e.waypoints.map(function(r) {
      return r;
    }), i = [["M", n[0].x, n[0].y]];
    return n.forEach(function(r, o) {
      o !== 0 && i.push(["L", r.x, r.y]);
    }), tr(i);
  }
  getPath(e) {
    const n = this.getRectPath(e);
    return tr(n);
  }
  drawRect(e, n, i, r, o, s) {
    ie(o) && (s = o, o = 0), o = o || 0, s = this.styles.computeStyle(s, {
      stroke: "black",
      strokeWidth: 2,
      fill: "white"
    });
    const a = D("rect");
    return k(a, {
      x: o,
      y: o,
      width: n - o * 2,
      height: i - o * 2,
      rx: r,
      ry: r
    }), k(a, s), I(e, a), a;
  }
  drawPath(e, n, i) {
    i = this.styles.computeStyle(i, ["no-fill"], {
      strokeWidth: 2,
      stroke: "black"
    });
    const r = D("path");
    return k(r, { d: n }), k(r, i), I(e, r), r;
  }
  /**
   * creates an SVG path that describes a rectangle which encloses the given shape.
   */
  getRectPath(e) {
    const i = e.x, r = e.y, o = e.width / 2 + 5, s = e.height / 2 + 5;
    return [
      ["M", i, r],
      ["l", o, 0],
      ["l", o, s],
      ["l", -o, s],
      ["l", -o, 0],
      ["z"]
    ];
  }
  getIconSvg(e, n) {
    const i = n.businessObject.pickedColor;
    if (_h(e)) {
      let r;
      return xh(e) ? r = this.applyColorToCustomSvgIcon(i, e) : (r = e, i && i !== $i && document.dispatchEvent(new CustomEvent("errorColoringOnlySvg"))), '<svg viewBox="0 0 24 24" width="48" height="48" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><image width="24" height="24" xlink:href="' + r + '"/></svg>';
    } else
      return this.applyColorToIcon(i, e);
  }
  applyColorToCustomSvgIcon(e, n) {
    if (!e)
      return n;
    const [i, r] = n.split("base64,"), o = atob(r), s = this.applyColorToIcon(e, o), a = btoa(s);
    return i + "base64," + a;
  }
  applyColorToIcon(e = $i, n) {
    const i = n.match(/fill=\s*"(?!none).*?"|fill:\s*[#r]\w*[;\s]{1}/);
    if (i && i.some((r) => r))
      return n.replaceAll(/fill=\s*"(?!none).*?"/g, `fill="${e}"`).replaceAll(/fill:\s*[#r]\w*[;\s]{1}/g, `fill:${e};`);
    {
      const r = n.indexOf("<svg ") + 5;
      return n.substring(0, r) + ' fill=" ' + e + '" ' + n.substring(r);
    }
  }
  adjustForTextOverlap(e) {
    const n = e.source, i = e.target, r = e.waypoints, o = r[0], s = r[r.length - 1];
    o && s && n && i && (this.checkIfPointOverlapsText(o, n), this.checkIfPointOverlapsText(s, n));
  }
  useColorForActivity(e) {
    return e.businessObject.pickedColor || (e.businessObject.pickedColor = "black"), this.styles.computeStyle("", {
      stroke: e.businessObject.pickedColor,
      fill: "none",
      strokeWidth: 1.5,
      strokeLinejoin: "round",
      markerEnd: this.marker(
        "activity",
        "black",
        e.businessObject.pickedColor
      )
    });
  }
  renderActivityLabel(e, n) {
    const i = n.businessObject, r = n.waypoints, o = Fh(i.name), s = Kh(r, o), a = n.waypoints[s.selected], c = n.waypoints[s.selected + 1], u = Tn(a, c);
    let l = "left", d = 500, h = s.x;
    (u === 0 || u === 180) && (d = Math.abs(a.x - c.x), l = "center", h = (a.x + c.x) / 2 - Rh(i.name));
    const f = {
      textAlign: l,
      width: d,
      height: 30,
      x: h,
      y: s.y
    };
    if (i.name && i.name.length)
      return this.renderLabel(
        e,
        i.name,
        {
          box: f,
          fitBox: !0,
          style: T({}, this.domainStoryTextRenderer.getExternalStyle(), {
            fill: "black",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            hyphens: "auto"
          })
        },
        n.type
      );
  }
  checkIfPointOverlapsText(e, n) {
    if (e.y > n.y + 60 && e.x > n.x + 3 && e.x < n.x + 72) {
      const i = this.getLineOffset(n);
      n.y + 75 + i > e.y && (e.y += i);
    }
  }
  getLineOffset(e) {
    var o;
    const n = e.id;
    let i = 0;
    const r = document.getElementsByClassName("djs-element djs-shape");
    for (let s = 0; s < r.length; s++)
      if (((o = r.item(s)) == null ? void 0 : o.getAttribute("data-element-id")) === n) {
        const c = r.item(s), u = c == null ? void 0 : c.getElementsByTagName("text")[0], l = u == null ? void 0 : u.getElementsByTagName("tspan");
        if (l) {
          const d = l[l.length - 1];
          i = parseInt(d.getAttribute("y") ?? "0");
        }
      }
    return i - 70;
  }
  fixConnectionInHTML(e) {
    if (e) {
      const n = e.getElementsByTagName("polyline");
      n.length > 1 && n[1].setAttribute(
        "points",
        n[0].getAttribute("points")
      );
    }
  }
  /**
   * marker functions ("markers" are arrowheads of activities)
   */
  marker(e, n, i) {
    const r = e + "-" + n + "-" + i + "-" + this.rendererId;
    return this.markers[r] || this.createMarker(e, n, i), "url(#" + r + ")";
  }
  createMarker(e, n, i) {
    const r = e + "-" + n + "-" + i + "-" + this.rendererId;
    if (e === "activity") {
      const o = D("path");
      k(o, { d: "M 1 5 L 11 10 L 1 15 Z" }), this.addMarker(r, {
        element: o,
        ref: { x: 11, y: 10 },
        scale: 0.5,
        attrs: {
          fill: i,
          stroke: i
        }
      });
    }
  }
  addMarker(e, n) {
    const i = T(
      {
        fill: "black",
        strokeWidth: 1,
        strokeLinecap: "round",
        strokeDasharray: "none"
      },
      n.attrs
    ), r = n.ref || { x: 0, y: 0 }, o = n.scale || 1;
    i.strokeDasharray === "none" && (i.strokeDasharray = [1e4, 1]);
    const s = D("marker");
    k(n.element, i), I(s, n.element), k(s, {
      id: e,
      viewBox: "0 0 20 20",
      refX: r.x,
      refY: r.y,
      markerWidth: 20 * o,
      markerHeight: 20 * o,
      orient: "auto"
    });
    let a = ee("defs", this.canvas._svg);
    a || (a = D("defs"), I(this.canvas._svg, a)), I(a, s), this.markers[e] = s;
  }
  /**
   * Generate the automatic Number for an activity originating from an actor
   */
  generateActivityNumber(e, n, i) {
    const r = zh(), o = n.businessObject;
    r.use && (o.number = r.number), Vh[o.number] = !0, i.x -= 26, i.y -= 16, o.number < 10 && (i.x += 3);
    const s = this.renderNumber(
      e,
      o.number,
      this.numberStyle(i),
      n.type
    );
    this.domainStoryNumberingRegistry.add(s, o.number);
  }
  renderNumber(e, n, i, r) {
    const o = this.domainStoryTextRenderer.createText(String(n), i);
    H(o).add("djs-labelNumber"), this.setCoordinates(r, o, i, e);
    const s = D("path"), a = 11, c = i.box.x + 18 + (n > 9 ? 3 : 0), u = i.box.y - a + 7;
    return k(s, {
      d: `
      M ${c} ${u}
      m ${a},0
      a ${a},${a} 0 1,0 ${-11 * 2},0
      a ${a},${a} 0 1,0 ${a * 2},0
      `,
      fill: "white",
      stroke: "black"
    }), I(e, s), I(e, o), o;
  }
  /**
   * render the number associated with an activity
   */
  renderExternalNumber(e, n) {
    if (n && n.source) {
      const i = n.businessObject, r = Uh(n);
      i.number == null && n.source.type && n.source.type.includes(S.ACTOR) && this.domainStoryNumberingRegistry.generateAutomaticNumber(n), i.number && n.source.type.includes(S.ACTOR) ? this.generateActivityNumber(e, n, r) : i.number = null;
    }
  }
  numberStyle(e) {
    return {
      box: e,
      fitBox: !0,
      style: T({}, this.domainStoryTextRenderer.getExternalStyle(), {
        fill: "black",
        position: "absolute"
      })
    };
  }
  setCoordinates(e, n, i, r) {
    var o, s;
    if (/:activity$/.test(e))
      n.innerHTML = this.manipulateInnerHTMLXLabel(
        n.children,
        i.box.x,
        0
      ), n.innerHTML = this.manipulateInnerHTMLYLabel(
        n.children,
        i.box.y,
        0
      );
    else if (/:actor/.test(e)) {
      const a = ((o = r.firstChild) == null ? void 0 : o.getAttribute("height")) ?? "";
      n.innerHTML = this.manipulateInnerHTMLYLabel(n.children, a, 0);
    } else if (/:workObject/.test(e)) {
      const a = ((s = r.firstChild) == null ? void 0 : s.getAttribute("height")) ?? "";
      n.innerHTML = this.manipulateInnerHTMLYLabel(n.children, a, 26);
    }
  }
  /**
   * render a label on the canvas
   */
  renderLabel(e, n, i, r) {
    const o = this.domainStoryTextRenderer.createText(n || "", i);
    return H(o).add("djs-label"), this.setCoordinates(r ?? "", o, i, e), I(e, o), o;
  }
  renderActorAndWorkObjectLabel(e, n, i, r) {
    const o = n.businessObject;
    return this.renderLabel(
      e,
      o.name,
      {
        box: n,
        align: i,
        padding: r || 0,
        style: {
          fill: "#000000"
        }
      },
      n.type
    );
  }
  /**
   * determine the X-coordinate of the label / number to be rendered
   */
  manipulateInnerHTMLXLabel(e, n, i) {
    if (!e)
      throw new Error("[DomainStoryRenderer] Parameter children is undefined!");
    let r = "";
    for (let o = 0; o < e.length; o++)
      r += e[o].outerHTML.replace(
        /x="-?\d*.\d*"/,
        'x="' + (Number(n) + i + 14) + '"'
      );
    return r;
  }
  /**
   * determine the Y-coordinate of the label / number to be rendered
   */
  manipulateInnerHTMLYLabel(e, n, i) {
    let r = "";
    for (let o = 0; o < e.length; o++)
      r += e[o].outerHTML.replace(
        /y="-?\d*.\d*"/,
        'y="' + (Number(n) + i + 14 * o) + '"'
      );
    return r;
  }
}, Et.$inject = [
  "eventBus",
  "styles",
  "canvas",
  "domainStoryTextRenderer",
  "domainStoryNumberingRegistry",
  "domainStoryElementRegistryService",
  "domainStoryDirtyFlagService",
  "domainStoryIconDictionaryService"
], Et);
function U(t, e) {
  this._handlerMap = {}, this._stack = [], this._stackIdx = -1, this._currentExecution = {
    actions: [],
    dirty: [],
    trigger: null
  }, this._injector = e, this._eventBus = t, this._uid = 1, t.on([
    "diagram.destroy",
    "diagram.clear"
  ], function() {
    this.clear(!1);
  }, this);
}
U.$inject = ["eventBus", "injector"];
U.prototype.execute = function(t, e) {
  if (!t)
    throw new Error("command required");
  this._currentExecution.trigger = "execute";
  const n = { command: t, context: e };
  this._pushAction(n), this._internalExecute(n), this._popAction();
};
U.prototype.canExecute = function(t, e) {
  const n = { command: t, context: e }, i = this._getHandler(t);
  let r = this._fire(t, "canExecute", n);
  if (r === void 0) {
    if (!i)
      return !1;
    i.canExecute && (r = i.canExecute(e));
  }
  return r;
};
U.prototype.clear = function(t) {
  this._stack.length = 0, this._stackIdx = -1, t !== !1 && this._fire("changed", { trigger: "clear" });
};
U.prototype.undo = function() {
  let t = this._getUndoAction(), e;
  if (t) {
    for (this._currentExecution.trigger = "undo", this._pushAction(t); t && (this._internalUndo(t), e = this._getUndoAction(), !(!e || e.id !== t.id)); )
      t = e;
    this._popAction();
  }
};
U.prototype.redo = function() {
  let t = this._getRedoAction(), e;
  if (t) {
    for (this._currentExecution.trigger = "redo", this._pushAction(t); t && (this._internalExecute(t, !0), e = this._getRedoAction(), !(!e || e.id !== t.id)); )
      t = e;
    this._popAction();
  }
};
U.prototype.register = function(t, e) {
  this._setHandler(t, e);
};
U.prototype.registerHandler = function(t, e) {
  if (!t || !e)
    throw new Error("command and handlerCls must be defined");
  const n = this._injector.instantiate(e);
  this.register(t, n);
};
U.prototype.canUndo = function() {
  return !!this._getUndoAction();
};
U.prototype.canRedo = function() {
  return !!this._getRedoAction();
};
U.prototype._getRedoAction = function() {
  return this._stack[this._stackIdx + 1];
};
U.prototype._getUndoAction = function() {
  return this._stack[this._stackIdx];
};
U.prototype._internalUndo = function(t) {
  const e = t.command, n = t.context, i = this._getHandler(e);
  this._atomicDo(() => {
    this._fire(e, "revert", t), i.revert && this._markDirty(i.revert(n)), this._revertedAction(t), this._fire(e, "reverted", t);
  });
};
U.prototype._fire = function(t, e, n) {
  arguments.length < 3 && (n = e, e = null);
  const i = e ? [t + "." + e, e] : [t];
  let r;
  n = this._eventBus.createEvent(n);
  for (const o of i)
    if (r = this._eventBus.fire("commandStack." + o, n), n.cancelBubble)
      break;
  return r;
};
U.prototype._createId = function() {
  return this._uid++;
};
U.prototype._atomicDo = function(t) {
  const e = this._currentExecution;
  e.atomic = !0;
  try {
    t();
  } finally {
    e.atomic = !1;
  }
};
U.prototype._internalExecute = function(t, e) {
  const n = t.command, i = t.context, r = this._getHandler(n);
  if (!r)
    throw new Error("no command handler registered for <" + n + ">");
  this._pushAction(t), e || (this._fire(n, "preExecute", t), r.preExecute && r.preExecute(i), this._fire(n, "preExecuted", t)), this._atomicDo(() => {
    this._fire(n, "execute", t), r.execute && this._markDirty(r.execute(i)), this._executedAction(t, e), this._fire(n, "executed", t);
  }), e || (this._fire(n, "postExecute", t), r.postExecute && r.postExecute(i), this._fire(n, "postExecuted", t)), this._popAction();
};
U.prototype._pushAction = function(t) {
  const e = this._currentExecution, n = e.actions, i = n[0];
  if (e.atomic)
    throw new Error("illegal invocation in <execute> or <revert> phase (action: " + t.command + ")");
  t.id || (t.id = i && i.id || this._createId()), n.push(t);
};
U.prototype._popAction = function() {
  const t = this._currentExecution, e = t.trigger, n = t.actions, i = t.dirty;
  n.pop(), n.length || (this._eventBus.fire("elements.changed", { elements: Su("id", i.reverse()) }), i.length = 0, this._fire("changed", { trigger: e }), t.trigger = null);
};
U.prototype._markDirty = function(t) {
  const e = this._currentExecution;
  t && (t = L(t) ? t : [t], e.dirty = e.dirty.concat(t));
};
U.prototype._executedAction = function(t, e) {
  const n = ++this._stackIdx;
  e || this._stack.splice(n, this._stack.length, t);
};
U.prototype._revertedAction = function(t) {
  this._stackIdx--;
};
U.prototype._getHandler = function(t) {
  return this._handlerMap[t];
};
U.prototype._setHandler = function(t, e) {
  if (!t || !e)
    throw new Error("command and handler required");
  if (this._handlerMap[t])
    throw new Error("overriding handler for command <" + t + ">");
  this._handlerMap[t] = e;
};
const Rn = {
  commandStack: ["type", U]
}, qh = {
  __depends__: [
    Ac,
    ot,
    ot,
    Xt,
    Rn
  ],
  __init__: ["domainStoryRenderer"],
  domainStoryRenderer: ["type", Gh]
};
function kc(t, e, n, i) {
  t.on("element.changed", function(r) {
    var o = r.element;
    (o.parent || o === e.getRootElement()) && (r.gfx = n.getGraphics(o)), r.gfx && t.fire(hl(o) + ".changed", r);
  }), t.on("elements.changed", function(r) {
    var o = r.elements;
    o.forEach(function(s) {
      t.fire("element.changed", { element: s });
    }), i.updateContainments(o);
  }), t.on("shape.changed", function(r) {
    i.update("shape", r.element, r.gfx);
  }), t.on("connection.changed", function(r) {
    i.update("connection", r.element, r.gfx);
  });
}
kc.$inject = [
  "eventBus",
  "canvas",
  "elementRegistry",
  "graphicsFactory"
];
const Xh = {
  __init__: ["changeSupport"],
  changeSupport: ["type", kc]
};
function Ai(t, e) {
  this._modeling = t, this._canvas = e;
}
Ai.$inject = ["modeling", "canvas"];
Ai.prototype.preExecute = function(t) {
  var e = this._modeling, n = t.elements, i = t.alignment;
  A(n, function(r) {
    var o = {
      x: 0,
      y: 0
    };
    ge(i.left) ? o.x = i.left - r.x : ge(i.right) ? o.x = i.right - r.width - r.x : ge(i.center) ? o.x = i.center - Math.round(r.width / 2) - r.x : ge(i.top) ? o.y = i.top - r.y : ge(i.bottom) ? o.y = i.bottom - r.height - r.y : ge(i.middle) && (o.y = i.middle - Math.round(r.height / 2) - r.y), e.moveElements([r], o, r.parent);
  });
};
Ai.prototype.postExecute = function(t) {
};
function Ci(t) {
  this._modeling = t;
}
Ci.$inject = ["modeling"];
Ci.prototype.preExecute = function(t) {
  var e = t.source;
  if (!e)
    throw new Error("source required");
  var n = t.target || e.parent, i = t.shape, r = t.hints || {};
  i = t.shape = this._modeling.createShape(
    i,
    t.position,
    n,
    { attach: r.attach }
  ), t.shape = i;
};
Ci.prototype.postExecute = function(t) {
  var e = t.hints || {};
  Jh(t.source, t.shape) || (e.connectionTarget === t.source ? this._modeling.connect(t.shape, t.source, t.connection) : this._modeling.connect(t.source, t.shape, t.connection));
};
function Jh(t, e) {
  return Au(t.outgoing, function(n) {
    return n.target === e;
  });
}
function Oi(t, e) {
  this._canvas = t, this._layouter = e;
}
Oi.$inject = ["canvas", "layouter"];
Oi.prototype.execute = function(t) {
  var e = t.connection, n = t.source, i = t.target, r = t.parent, o = t.parentIndex, s = t.hints;
  if (!n || !i)
    throw new Error("source and target required");
  if (!r)
    throw new Error("parent required");
  return e.source = n, e.target = i, e.waypoints || (e.waypoints = this._layouter.layoutConnection(e, s)), this._canvas.addConnection(e, r, o), e;
};
Oi.prototype.revert = function(t) {
  var e = t.connection;
  return this._canvas.removeConnection(e), e.source = null, e.target = null, e;
};
var Gn = Math.round;
function io(t) {
  this._modeling = t;
}
io.$inject = [
  "modeling"
];
io.prototype.preExecute = function(t) {
  var e = t.elements, n = t.parent, i = t.parentIndex, r = t.position, o = t.hints, s = this._modeling;
  A(e, function(d) {
    j(d.x) || (d.x = 0), j(d.y) || (d.y = 0);
  });
  var a = we(e, function(d) {
    return !d.hidden;
  }), c = le(a);
  A(e, function(d) {
    K(d) && (d.waypoints = xe(d.waypoints, function(h) {
      return {
        x: Gn(h.x - c.x - c.width / 2 + r.x),
        y: Gn(h.y - c.y - c.height / 2 + r.y)
      };
    })), T(d, {
      x: Gn(d.x - c.x - c.width / 2 + r.x),
      y: Gn(d.y - c.y - c.height / 2 + r.y)
    });
  });
  var u = Ga(e), l = {};
  A(e, function(d) {
    if (K(d)) {
      l[d.id] = j(i) ? s.createConnection(
        l[d.source.id],
        l[d.target.id],
        i,
        d,
        d.parent || n,
        o
      ) : s.createConnection(
        l[d.source.id],
        l[d.target.id],
        d,
        d.parent || n,
        o
      );
      return;
    }
    var h = T({}, o);
    u.indexOf(d) === -1 && (h.autoResize = !1), ne(d) && (h = Fe(h, ["attach"])), l[d.id] = j(i) ? s.createShape(
      d,
      Lt(d, ["x", "y", "width", "height"]),
      d.parent || n,
      i,
      h
    ) : s.createShape(
      d,
      Lt(d, ["x", "y", "width", "height"]),
      d.parent || n,
      h
    );
  }), t.elements = Oa(l);
};
var Ms = Math.round;
function qe(t) {
  this._canvas = t;
}
qe.$inject = ["canvas"];
qe.prototype.execute = function(t) {
  var e = t.shape, n = t.position, i = t.parent, r = t.parentIndex;
  if (!i)
    throw new Error("parent required");
  if (!n)
    throw new Error("position required");
  return n.width !== void 0 ? T(e, n) : T(e, {
    x: n.x - Ms(e.width / 2),
    y: n.y - Ms(e.height / 2)
  }), this._canvas.addShape(e, i, r), e;
};
qe.prototype.revert = function(t) {
  var e = t.shape;
  return this._canvas.removeShape(e), e;
};
function kn(t) {
  qe.call(this, t);
}
Vt(kn, qe);
kn.$inject = ["canvas"];
var Qh = qe.prototype.execute;
kn.prototype.execute = function(t) {
  var e = t.shape;
  return Zh(e), e.labelTarget = t.labelTarget, Qh.call(this, t);
};
var Yh = qe.prototype.revert;
kn.prototype.revert = function(t) {
  return t.shape.labelTarget = null, Yh.call(this, t);
};
function Zh(t) {
  ["width", "height"].forEach(function(e) {
    typeof t[e] > "u" && (t[e] = 0);
  });
}
function Bt(t, e) {
  if (!t || !e)
    return -1;
  var n = t.indexOf(e);
  return n !== -1 && t.splice(n, 1), n;
}
function Te(t, e, n) {
  if (!(!t || !e)) {
    typeof n != "number" && (n = -1);
    var i = t.indexOf(e);
    if (i !== -1) {
      if (i === n)
        return;
      if (n !== -1)
        t.splice(i, 1);
      else
        return;
    }
    n !== -1 ? t.splice(n, 0, e) : t.push(e);
  }
}
function Pc(t, e) {
  return !t || !e ? -1 : t.indexOf(e);
}
function yn(t, e) {
  if (typeof e != "function")
    throw new Error("removeFn iterator must be a function");
  if (t) {
    for (var n; n = t[0]; )
      e(n);
    return t;
  }
}
function Pn(t, e) {
  this._canvas = t, this._modeling = e;
}
Pn.$inject = [
  "canvas",
  "modeling"
];
Pn.prototype.preExecute = function(t) {
  var e = this._modeling, n = t.connection;
  yn(n.incoming, function(i) {
    e.removeConnection(i, { nested: !0 });
  }), yn(n.outgoing, function(i) {
    e.removeConnection(i, { nested: !0 });
  });
};
Pn.prototype.execute = function(t) {
  var e = t.connection, n = e.parent;
  return t.parent = n, t.parentIndex = Pc(n.children, e), t.source = e.source, t.target = e.target, this._canvas.removeConnection(e), e.source = null, e.target = null, e;
};
Pn.prototype.revert = function(t) {
  var e = t.connection, n = t.parent, i = t.parentIndex;
  return e.source = t.source, e.target = t.target, Te(n.children, e, i), this._canvas.addConnection(e, n), e;
};
function ro(t, e) {
  this._modeling = t, this._elementRegistry = e;
}
ro.$inject = [
  "modeling",
  "elementRegistry"
];
ro.prototype.postExecute = function(t) {
  var e = this._modeling, n = this._elementRegistry, i = t.elements;
  A(i, function(r) {
    n.get(r.id) && (r.waypoints ? e.removeConnection(r) : e.removeShape(r));
  });
};
function Mn(t, e) {
  this._canvas = t, this._modeling = e;
}
Mn.$inject = ["canvas", "modeling"];
Mn.prototype.preExecute = function(t) {
  var e = this._modeling, n = t.shape;
  yn(n.incoming, function(i) {
    e.removeConnection(i, { nested: !0 });
  }), yn(n.outgoing, function(i) {
    e.removeConnection(i, { nested: !0 });
  }), yn(n.children, function(i) {
    K(i) ? e.removeConnection(i, { nested: !0 }) : e.removeShape(i, { nested: !0 });
  });
};
Mn.prototype.execute = function(t) {
  var e = this._canvas, n = t.shape, i = n.parent;
  return t.oldParent = i, t.oldParentIndex = Pc(i.children, n), e.removeShape(n), n;
};
Mn.prototype.revert = function(t) {
  var e = this._canvas, n = t.shape, i = t.oldParent, r = t.oldParentIndex;
  return Te(i.children, n, r), e.addShape(n, i), n;
};
function Ti(t) {
  this._modeling = t;
}
Ti.$inject = ["modeling"];
var Is = {
  x: "y",
  y: "x"
};
Ti.prototype.preExecute = function(t) {
  var e = this._modeling, n = t.groups, i = t.axis, r = t.dimension;
  function o(g, E) {
    g.range.min = Math.min(E[i], g.range.min), g.range.max = Math.max(E[i] + E[r], g.range.max);
  }
  function s(g) {
    return g[i] + g[r] / 2;
  }
  function a(g) {
    return g.length - 1;
  }
  function c(g) {
    return g.max - g.min;
  }
  function u(g, E) {
    var x = { y: 0 };
    x[i] = g - s(E), x[i] && (x[Is[i]] = 0, e.moveElements([E], x, E.parent));
  }
  var l = n[0], d = a(n), h = n[d], f, p, m = 0;
  A(n, function(g, E) {
    var x, y, v;
    if (g.elements.length < 2) {
      E && E !== n.length - 1 && (o(g, g.elements[0]), m += c(g.range));
      return;
    }
    x = En(g.elements, i), y = x[0], E === d && (y = x[a(x)]), v = s(y), g.range = null, A(x, function(_) {
      if (u(v, _), g.range === null) {
        g.range = {
          min: _[i],
          max: _[i] + _[r]
        };
        return;
      }
      o(g, _);
    }), E && E !== n.length - 1 && (m += c(g.range));
  }), p = Math.abs(h.range.min - l.range.max), f = Math.round((p - m) / (n.length - 1)), !(f < n.length - 1) && A(n, function(g, E) {
    var x = {}, y;
    g === l || g === h || (y = n[E - 1], g.range.max = 0, A(g.elements, function(v, _) {
      x[Is[i]] = 0, x[i] = y.range.max - v[i] + f, g.range.min !== v[i] && (x[i] += v[i] - g.range.min), x[i] && e.moveElements([v], x, v.parent), g.range.max = Math.max(v[i] + v[r], _ ? g.range.max : 0);
    }));
  });
};
Ti.prototype.postExecute = function(t) {
};
function Ri(t, e) {
  this._layouter = t, this._canvas = e;
}
Ri.$inject = ["layouter", "canvas"];
Ri.prototype.execute = function(t) {
  var e = t.connection, n = e.waypoints;
  return T(t, {
    oldWaypoints: n
  }), e.waypoints = this._layouter.layoutConnection(e, t.hints), e;
};
Ri.prototype.revert = function(t) {
  var e = t.connection;
  return e.waypoints = t.oldWaypoints, e;
};
function oo() {
}
oo.prototype.execute = function(t) {
  var e = t.connection, n = t.delta, i = t.newParent || e.parent, r = t.newParentIndex, o = e.parent;
  return t.oldParent = o, t.oldParentIndex = Bt(o.children, e), Te(i.children, e, r), e.parent = i, A(e.waypoints, function(s) {
    s.x += n.x, s.y += n.y, s.original && (s.original.x += n.x, s.original.y += n.y);
  }), e;
};
oo.prototype.revert = function(t) {
  var e = t.connection, n = e.parent, i = t.oldParent, r = t.oldParentIndex, o = t.delta;
  return Bt(n.children, e), Te(i.children, e, r), e.parent = i, A(e.waypoints, function(s) {
    s.x -= o.x, s.y -= o.y, s.original && (s.original.x -= o.x, s.original.y -= o.y);
  }), e;
};
function ki(t, e, n) {
  var i = Vo(e), r = Vo(n), o = pt(t, i), s = {
    x: o.x * (n.width / e.width),
    y: o.y * (n.height / e.height)
  };
  return fn({
    x: r.x + s.x,
    y: r.y + s.y
  });
}
function so(t, e, n) {
  var i = Pi(t), r = Ic(i, e), o = i[0];
  return r.length ? r[r.length - 1] : ki(o.original || o, n, e);
}
function ao(t, e, n) {
  var i = Pi(t), r = Ic(i, e), o = i[i.length - 1];
  return r.length ? r[0] : ki(o.original || o, n, e);
}
function co(t, e, n) {
  var i = Pi(t), r = Mc(e, n), o = i[0];
  return ki(o.original || o, r, e);
}
function uo(t, e, n) {
  var i = Pi(t), r = Mc(e, n), o = i[i.length - 1];
  return ki(o.original || o, r, e);
}
function Mc(t, e) {
  return {
    x: t.x - e.x,
    y: t.y - e.y,
    width: t.width,
    height: t.height
  };
}
function Pi(t) {
  var e = t.waypoints;
  if (!e.length)
    throw new Error("connection#" + t.id + ": no waypoints");
  return e;
}
function Ic(t, e) {
  var n = xe(t, tf);
  return we(n, function(i) {
    return ef(i, e);
  });
}
function ef(t, e) {
  return ur(e, t, 1) === "intersect";
}
function tf(t) {
  return t.original || t;
}
function lo() {
  this.allShapes = {}, this.allConnections = {}, this.enclosedElements = {}, this.enclosedConnections = {}, this.topLevel = {};
}
lo.prototype.add = function(t, e) {
  return this.addAll([t], e);
};
lo.prototype.addAll = function(t, e) {
  var n = ll(t, !!e, this);
  return T(this, n), this;
};
function In(t) {
  this._modeling = t;
}
In.prototype.moveRecursive = function(t, e, n) {
  return t ? this.moveClosure(this.getClosure(t), e, n) : [];
};
In.prototype.moveClosure = function(t, e, n, i, r) {
  var o = this._modeling, s = t.allShapes, a = t.allConnections, c = t.enclosedConnections, u = t.topLevel, l = !1;
  r && r.parent === n && (l = !0), A(s, function(d) {
    o.moveShape(d, e, u[d.id] && !l && n, {
      recurse: !1,
      layout: !1
    });
  }), A(a, function(d) {
    var h = !!s[d.source.id], f = !!s[d.target.id];
    c[d.id] && h && f ? o.moveConnection(d, e, u[d.id] && !l && n) : o.layoutConnection(d, {
      connectionStart: h && co(d, d.source, e),
      connectionEnd: f && uo(d, d.target, e)
    });
  });
};
In.prototype.getClosure = function(t) {
  return new lo().addAll(t, !0);
};
function Mi(t) {
  this._helper = new In(t);
}
Mi.$inject = ["modeling"];
Mi.prototype.preExecute = function(t) {
  t.closure = this._helper.getClosure(t.shapes);
};
Mi.prototype.postExecute = function(t) {
  var e = t.hints, n;
  e && e.primaryShape && (n = e.primaryShape, e.oldParent = n.parent), this._helper.moveClosure(
    t.closure,
    t.delta,
    t.newParent,
    t.newHost,
    n
  );
};
function ct(t) {
  this._modeling = t, this._helper = new In(t);
}
ct.$inject = ["modeling"];
ct.prototype.execute = function(t) {
  var e = t.shape, n = t.delta, i = t.newParent || e.parent, r = t.newParentIndex, o = e.parent;
  return t.oldBounds = Lt(e, ["x", "y", "width", "height"]), t.oldParent = o, t.oldParentIndex = Bt(o.children, e), Te(i.children, e, r), T(e, {
    parent: i,
    x: e.x + n.x,
    y: e.y + n.y
  }), e;
};
ct.prototype.postExecute = function(t) {
  var e = t.shape, n = t.delta, i = t.hints, r = this._modeling;
  i.layout !== !1 && (A(e.incoming, function(o) {
    r.layoutConnection(o, {
      connectionEnd: uo(o, e, n)
    });
  }), A(e.outgoing, function(o) {
    r.layoutConnection(o, {
      connectionStart: co(o, e, n)
    });
  })), i.recurse !== !1 && this.moveChildren(t);
};
ct.prototype.revert = function(t) {
  var e = t.shape, n = t.oldParent, i = t.oldParentIndex, r = t.delta;
  return Te(n.children, e, i), T(e, {
    parent: n,
    x: e.x - r.x,
    y: e.y - r.y
  }), e;
};
ct.prototype.moveChildren = function(t) {
  var e = t.delta, n = t.shape;
  this._helper.moveRecursive(n.children, e, null);
};
ct.prototype.getNewParent = function(t) {
  return t.newParent || t.shape.parent;
};
function jn(t) {
  this._modeling = t;
}
jn.$inject = ["modeling"];
jn.prototype.execute = function(t) {
  var e = t.newSource, n = t.newTarget, i = t.connection, r = t.dockingOrPoints;
  if (!e && !n)
    throw new Error("newSource or newTarget required");
  return L(r) && (t.oldWaypoints = i.waypoints, i.waypoints = r), e && (t.oldSource = i.source, i.source = e), n && (t.oldTarget = i.target, i.target = n), i;
};
jn.prototype.postExecute = function(t) {
  var e = t.connection, n = t.newSource, i = t.newTarget, r = t.dockingOrPoints, o = t.hints || {}, s = {};
  o.connectionStart && (s.connectionStart = o.connectionStart), o.connectionEnd && (s.connectionEnd = o.connectionEnd), o.layoutConnection !== !1 && (n && (!i || o.docking === "source") && (s.connectionStart = s.connectionStart || js(L(r) ? r[0] : r)), i && (!n || o.docking === "target") && (s.connectionEnd = s.connectionEnd || js(L(r) ? r[r.length - 1] : r)), o.newWaypoints && (s.waypoints = o.newWaypoints), this._modeling.layoutConnection(e, s));
};
jn.prototype.revert = function(t) {
  var e = t.oldSource, n = t.oldTarget, i = t.oldWaypoints, r = t.connection;
  return e && (r.source = e), n && (r.target = n), i && (r.waypoints = i), r;
};
function js(t) {
  return t.original || t;
}
function Ie(t, e) {
  this._modeling = t, this._rules = e;
}
Ie.$inject = ["modeling", "rules"];
Ie.prototype.preExecute = function(t) {
  var e = this, n = this._modeling, i = this._rules, r = t.oldShape, o = t.newData, s = t.hints || {}, a;
  function c(p, m, g) {
    return i.allowed("connection.reconnect", {
      connection: g,
      source: p,
      target: m
    });
  }
  var u = {
    x: o.x,
    y: o.y
  }, l = {
    x: r.x,
    y: r.y,
    width: r.width,
    height: r.height
  };
  a = t.newShape = t.newShape || e.createShape(o, u, r.parent, s), r.host && n.updateAttachment(a, r.host);
  var d;
  s.moveChildren !== !1 && (d = r.children.slice(), n.moveElements(d, { x: 0, y: 0 }, a, s));
  var h = r.incoming.slice(), f = r.outgoing.slice();
  A(h, function(p) {
    var m = p.source, g = c(m, a, p);
    g && e.reconnectEnd(
      p,
      a,
      ao(p, a, l),
      s
    );
  }), A(f, function(p) {
    var m = p.target, g = c(a, m, p);
    g && e.reconnectStart(
      p,
      a,
      so(p, a, l),
      s
    );
  });
};
Ie.prototype.postExecute = function(t) {
  var e = t.oldShape;
  this._modeling.removeShape(e);
};
Ie.prototype.execute = function(t) {
};
Ie.prototype.revert = function(t) {
};
Ie.prototype.createShape = function(t, e, n, i) {
  return this._modeling.createShape(t, e, n, i);
};
Ie.prototype.reconnectStart = function(t, e, n, i) {
  this._modeling.reconnectStart(t, e, n, i);
};
Ie.prototype.reconnectEnd = function(t, e, n, i) {
  this._modeling.reconnectEnd(t, e, n, i);
};
function Dn(t) {
  this._modeling = t;
}
Dn.$inject = ["modeling"];
Dn.prototype.execute = function(t) {
  var e = t.shape, n = t.newBounds, i = t.minBounds;
  if (n.x === void 0 || n.y === void 0 || n.width === void 0 || n.height === void 0)
    throw new Error("newBounds must have {x, y, width, height} properties");
  if (i && (n.width < i.width || n.height < i.height))
    throw new Error("width and height cannot be less than minimum height and width");
  if (!i && n.width < 10 || n.height < 10)
    throw new Error("width and height cannot be less than 10px");
  return t.oldBounds = {
    width: e.width,
    height: e.height,
    x: e.x,
    y: e.y
  }, T(e, {
    width: n.width,
    height: n.height,
    x: n.x,
    y: n.y
  }), e;
};
Dn.prototype.postExecute = function(t) {
  var e = this._modeling, n = t.shape, i = t.oldBounds, r = t.hints || {};
  r.layout !== !1 && (A(n.incoming, function(o) {
    e.layoutConnection(o, {
      connectionEnd: ao(o, n, i)
    });
  }), A(n.outgoing, function(o) {
    e.layoutConnection(o, {
      connectionStart: so(o, n, i)
    });
  }));
};
Dn.prototype.revert = function(t) {
  var e = t.shape, n = t.oldBounds;
  return T(e, {
    width: n.width,
    height: n.height,
    x: n.x,
    y: n.y
  }), e;
};
function nf(t, e) {
  if (t === "x") {
    if (e > 0)
      return "e";
    if (e < 0)
      return "w";
  }
  if (t === "y") {
    if (e > 0)
      return "s";
    if (e < 0)
      return "n";
  }
  return null;
}
function rf(t, e) {
  var n = [];
  return A(t.concat(e), function(i) {
    var r = i.incoming, o = i.outgoing;
    A(r.concat(o), function(s) {
      var a = s.source, c = s.target;
      (on(t, a) || on(t, c) || on(e, a) || on(e, c)) && (on(n, s) || n.push(s));
    });
  }), n;
}
function on(t, e) {
  return t.indexOf(e) !== -1;
}
function of(t, e, n) {
  var i = t.x, r = t.y, o = t.width, s = t.height, a = n.x, c = n.y;
  switch (e) {
    case "n":
      return {
        x: i,
        y: r + c,
        width: o,
        height: s - c
      };
    case "s":
      return {
        x: i,
        y: r,
        width: o,
        height: s + c
      };
    case "w":
      return {
        x: i + a,
        y: r,
        width: o - a,
        height: s
      };
    case "e":
      return {
        x: i,
        y: r,
        width: o + a,
        height: s
      };
    default:
      throw new Error("unknown direction: " + e);
  }
}
function Xe(t) {
  this._modeling = t;
}
Xe.$inject = ["modeling"];
Xe.prototype.preExecute = function(t) {
  var e = t.delta, n = t.direction, i = t.movingShapes, r = t.resizingShapes, o = t.start, s = {};
  this.moveShapes(i, e), A(r, function(a) {
    s[a.id] = af(a);
  }), this.resizeShapes(r, e, n), this.updateConnectionWaypoints(
    rf(i, r),
    e,
    n,
    o,
    i,
    r,
    s
  );
};
Xe.prototype.execute = function() {
};
Xe.prototype.revert = function() {
};
Xe.prototype.moveShapes = function(t, e) {
  var n = this;
  A(t, function(i) {
    n._modeling.moveShape(i, e, null, {
      autoResize: !1,
      layout: !1,
      recurse: !1
    });
  });
};
Xe.prototype.resizeShapes = function(t, e, n) {
  var i = this;
  A(t, function(r) {
    var o = of(r, n, e);
    i._modeling.resizeShape(r, o, null, {
      attachSupport: !1,
      autoResize: !1,
      layout: !1
    });
  });
};
Xe.prototype.updateConnectionWaypoints = function(t, e, n, i, r, o, s) {
  var a = this, c = r.concat(o);
  A(t, function(u) {
    var l = u.source, d = u.target, h = sf(u), f = jc(n), p = {};
    He(c, l) && He(c, d) ? (h = xe(h, function(m) {
      return Ls(m, i, n) && (m[f] = m[f] + e[f]), m.original && Ls(m.original, i, n) && (m.original[f] = m.original[f] + e[f]), m;
    }), a._modeling.updateWaypoints(u, h, {
      labelBehavior: !1
    })) : (He(c, l) || He(c, d)) && (He(r, l) ? p.connectionStart = co(u, l, e) : He(r, d) ? p.connectionEnd = uo(u, d, e) : He(o, l) ? p.connectionStart = so(
      u,
      l,
      s[l.id]
    ) : He(o, d) && (p.connectionEnd = ao(
      u,
      d,
      s[d.id]
    )), a._modeling.layoutConnection(u, p));
  });
};
function Ds(t) {
  return T({}, t);
}
function sf(t) {
  return xe(t.waypoints, function(e) {
    return e = Ds(e), e.original && (e.original = Ds(e.original)), e;
  });
}
function jc(t) {
  switch (t) {
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
function Ls(t, e, n) {
  var i = jc(n);
  if (/e|s/.test(n))
    return t[i] > e;
  if (/n|w/.test(n))
    return t[i] < e;
}
function He(t, e) {
  return t.indexOf(e) !== -1;
}
function af(t) {
  return {
    x: t.x,
    y: t.y,
    height: t.height,
    width: t.width
  };
}
function Ii(t) {
  this._modeling = t;
}
Ii.$inject = ["modeling"];
Ii.prototype.execute = function(t) {
  var e = t.shape, n = e.children;
  t.oldChildrenVisibility = Dc(n), e.collapsed = !e.collapsed;
  var i = Lc(n, e.collapsed);
  return [e].concat(i);
};
Ii.prototype.revert = function(t) {
  var e = t.shape, n = t.oldChildrenVisibility, i = e.children, r = Nc(i, n);
  return e.collapsed = !e.collapsed, [e].concat(r);
};
function Dc(t) {
  var e = {};
  return A(t, function(n) {
    e[n.id] = n.hidden, n.children && (e = T({}, e, Dc(n.children)));
  }), e;
}
function Lc(t, e) {
  var n = [];
  return A(t, function(i) {
    i.hidden = e, n = n.concat(i), i.children && (n = n.concat(Lc(i.children, i.collapsed || e)));
  }), n;
}
function Nc(t, e) {
  var n = [];
  return A(t, function(i) {
    i.hidden = e[i.id], n = n.concat(i), i.children && (n = n.concat(Nc(i.children, e)));
  }), n;
}
function ji(t) {
  this._modeling = t;
}
ji.$inject = ["modeling"];
ji.prototype.execute = function(t) {
  var e = t.shape, n = t.newHost, i = e.host;
  return t.oldHost = i, t.attacherIdx = Hc(i, e), Bc(n, e), e.host = n, e;
};
ji.prototype.revert = function(t) {
  var e = t.shape, n = t.newHost, i = t.oldHost, r = t.attacherIdx;
  return e.host = i, Hc(n, e), Bc(i, e, r), e;
};
function Hc(t, e) {
  return Bt(t && t.attachers, e);
}
function Bc(t, e, n) {
  if (t) {
    var i = t.attachers;
    i || (t.attachers = i = []), Te(i, e, n);
  }
}
function ho() {
}
ho.prototype.execute = function(t) {
  var e = t.connection, n = t.newWaypoints;
  return t.oldWaypoints = e.waypoints, e.waypoints = n, e;
};
ho.prototype.revert = function(t) {
  var e = t.connection, n = t.oldWaypoints;
  return e.waypoints = n, e;
};
function B(t, e, n) {
  this._eventBus = t, this._elementFactory = e, this._commandStack = n;
  var i = this;
  t.on("diagram.init", function() {
    i.registerHandlers(n);
  });
}
B.$inject = ["eventBus", "elementFactory", "commandStack"];
B.prototype.getHandlers = function() {
  return {
    "shape.append": Ci,
    "shape.create": qe,
    "shape.delete": Mn,
    "shape.move": ct,
    "shape.resize": Dn,
    "shape.replace": Ie,
    "shape.toggleCollapse": Ii,
    spaceTool: Xe,
    "label.create": kn,
    "connection.create": Oi,
    "connection.delete": Pn,
    "connection.move": oo,
    "connection.layout": Ri,
    "connection.updateWaypoints": ho,
    "connection.reconnect": jn,
    "elements.create": io,
    "elements.move": Mi,
    "elements.delete": ro,
    "elements.distribute": Ti,
    "elements.align": Ai,
    "element.updateAttachment": ji
  };
};
B.prototype.registerHandlers = function(t) {
  A(this.getHandlers(), function(e, n) {
    t.registerHandler(n, e);
  });
};
B.prototype.moveShape = function(t, e, n, i, r) {
  typeof i == "object" && (r = i, i = null);
  var o = {
    shape: t,
    delta: e,
    newParent: n,
    newParentIndex: i,
    hints: r || {}
  };
  this._commandStack.execute("shape.move", o);
};
B.prototype.updateAttachment = function(t, e) {
  var n = {
    shape: t,
    newHost: e
  };
  this._commandStack.execute("element.updateAttachment", n);
};
B.prototype.moveElements = function(t, e, n, i) {
  i = i || {};
  var r = i.attach, o = n, s;
  r === !0 ? (s = n, o = n.parent) : r === !1 && (s = null);
  var a = {
    shapes: t,
    delta: e,
    newParent: o,
    newHost: s,
    hints: i
  };
  this._commandStack.execute("elements.move", a);
};
B.prototype.moveConnection = function(t, e, n, i, r) {
  typeof i == "object" && (r = i, i = void 0);
  var o = {
    connection: t,
    delta: e,
    newParent: n,
    newParentIndex: i,
    hints: r || {}
  };
  this._commandStack.execute("connection.move", o);
};
B.prototype.layoutConnection = function(t, e) {
  var n = {
    connection: t,
    hints: e || {}
  };
  this._commandStack.execute("connection.layout", n);
};
B.prototype.createConnection = function(t, e, n, i, r, o) {
  typeof n == "object" && (o = r, r = i, i = n, n = void 0), i = this._create("connection", i);
  var s = {
    source: t,
    target: e,
    parent: r,
    parentIndex: n,
    connection: i,
    hints: o
  };
  return this._commandStack.execute("connection.create", s), s.connection;
};
B.prototype.createShape = function(t, e, n, i, r) {
  typeof i != "number" && (r = i, i = void 0), r = r || {};
  var o = r.attach, s, a;
  t = this._create("shape", t), o ? (s = n.parent, a = n) : s = n;
  var c = {
    position: e,
    shape: t,
    parent: s,
    parentIndex: i,
    host: a,
    hints: r
  };
  return this._commandStack.execute("shape.create", c), c.shape;
};
B.prototype.createElements = function(t, e, n, i, r) {
  L(t) || (t = [t]), typeof i != "number" && (r = i, i = void 0), r = r || {};
  var o = {
    position: e,
    elements: t,
    parent: n,
    parentIndex: i,
    hints: r
  };
  return this._commandStack.execute("elements.create", o), o.elements;
};
B.prototype.createLabel = function(t, e, n, i) {
  n = this._create("label", n);
  var r = {
    labelTarget: t,
    position: e,
    parent: i || t.parent,
    shape: n
  };
  return this._commandStack.execute("label.create", r), r.shape;
};
B.prototype.appendShape = function(t, e, n, i, r) {
  r = r || {}, e = this._create("shape", e);
  var o = {
    source: t,
    position: n,
    target: i,
    shape: e,
    connection: r.connection,
    connectionParent: r.connectionParent,
    hints: r
  };
  return this._commandStack.execute("shape.append", o), o.shape;
};
B.prototype.removeElements = function(t) {
  var e = {
    elements: t
  };
  this._commandStack.execute("elements.delete", e);
};
B.prototype.distributeElements = function(t, e, n) {
  var i = {
    groups: t,
    axis: e,
    dimension: n
  };
  this._commandStack.execute("elements.distribute", i);
};
B.prototype.removeShape = function(t, e) {
  var n = {
    shape: t,
    hints: e || {}
  };
  this._commandStack.execute("shape.delete", n);
};
B.prototype.removeConnection = function(t, e) {
  var n = {
    connection: t,
    hints: e || {}
  };
  this._commandStack.execute("connection.delete", n);
};
B.prototype.replaceShape = function(t, e, n) {
  var i = {
    oldShape: t,
    newData: e,
    hints: n || {}
  };
  return this._commandStack.execute("shape.replace", i), i.newShape;
};
B.prototype.alignElements = function(t, e) {
  var n = {
    elements: t,
    alignment: e
  };
  this._commandStack.execute("elements.align", n);
};
B.prototype.resizeShape = function(t, e, n, i) {
  var r = {
    shape: t,
    newBounds: e,
    minBounds: n,
    hints: i
  };
  this._commandStack.execute("shape.resize", r);
};
B.prototype.createSpace = function(t, e, n, i, r) {
  var o = {
    delta: n,
    direction: i,
    movingShapes: t,
    resizingShapes: e,
    start: r
  };
  this._commandStack.execute("spaceTool", o);
};
B.prototype.updateWaypoints = function(t, e, n) {
  var i = {
    connection: t,
    newWaypoints: e,
    hints: n || {}
  };
  this._commandStack.execute("connection.updateWaypoints", i);
};
B.prototype.reconnect = function(t, e, n, i, r) {
  var o = {
    connection: t,
    newSource: e,
    newTarget: n,
    dockingOrPoints: i,
    hints: r || {}
  };
  this._commandStack.execute("connection.reconnect", o);
};
B.prototype.reconnectStart = function(t, e, n, i) {
  i || (i = {}), this.reconnect(t, e, t.target, n, T(i, {
    docking: "source"
  }));
};
B.prototype.reconnectEnd = function(t, e, n, i) {
  i || (i = {}), this.reconnect(t, t.source, e, n, T(i, {
    docking: "target"
  }));
};
B.prototype.connect = function(t, e, n, i) {
  return this.createConnection(t, e, n || {}, t.parent, i);
};
B.prototype._create = function(t, e) {
  return Gd(e) ? e : this._elementFactory.create(t, e);
};
B.prototype.toggleCollapse = function(t, e) {
  var n = {
    shape: t,
    hints: e || {}
  };
  this._commandStack.execute("shape.toggleCollapse", n);
};
function Wc() {
}
Wc.prototype.layoutConnection = function(t, e) {
  return e = e || {}, [
    e.connectionStart || re(e.source || t.source),
    e.connectionEnd || re(e.target || t.target)
  ];
};
const cf = {
  __depends__: [
    Rn,
    Xh,
    $t,
    ke
  ],
  __init__: ["modeling"],
  modeling: ["type", B],
  layouter: ["type", Wc]
}, uf = {
  __init__: ["domainStoryRules"],
  domainStoryRules: ["type", Wh]
};
var wt;
let lf = (wt = class extends B {
  constructor(e, n, i) {
    super(e, n, i), this.commandStack = i;
  }
  replaceShape(e, n, i) {
    const r = {
      oldShape: e,
      newData: n,
      hints: i || {}
    };
    return this.commandStack.execute("shape.replace", r), r.newShape;
  }
  updateLabel(e, n, i) {
    (e.businessObject ? n !== e.businessObject.name : n !== e.name) && this.commandStack.execute("element.updateLabel", {
      element: e,
      newLabel: n,
      newBounds: i
    });
  }
  updateNumber(e, n, i) {
    (e.businessObject ? n !== e.businessObject.number : n !== e.number) && this.commandStack.execute("element.updateLabel", {
      element: e,
      newNumber: n,
      newBounds: i
    });
  }
  removeGroup(e) {
    this.commandStack.execute("shape.removeGroupWithoutChildren", {
      element: e
    }), this.removeElements([e]);
  }
}, wt.$inject = [
  "eventBus",
  "elementFactory",
  "commandStack",
  "domainStoryRules"
], wt);
const Qt = {
  __depends__: [uf, cf],
  modeling: ["type", lf]
};
function Ns(t) {
  return T({ original: t.point.original || t.point }, t.actual);
}
function Je(t, e) {
  this._elementRegistry = t, this._graphicsFactory = e;
}
Je.$inject = ["elementRegistry", "graphicsFactory"];
Je.prototype.getCroppedWaypoints = function(t, e, n) {
  e = e || t.source, n = n || t.target;
  var i = this.getDockingPoint(t, e, !0), r = this.getDockingPoint(t, n), o = t.waypoints.slice(i.idx + 1, r.idx);
  return o.unshift(Ns(i)), o.push(Ns(r)), o;
};
Je.prototype.getDockingPoint = function(t, e, n) {
  var i = t.waypoints, r, o, s;
  return r = n ? 0 : i.length - 1, o = i[r], s = this._getIntersection(e, t, n), {
    point: o,
    actual: s || o,
    idx: r
  };
};
Je.prototype._getIntersection = function(t, e, n) {
  var i = this._getShapePath(t), r = this._getConnectionPath(e);
  return lr(i, r, n);
};
Je.prototype._getConnectionPath = function(t) {
  return this._graphicsFactory.getConnectionPath(t);
};
Je.prototype._getShapePath = function(t) {
  return this._graphicsFactory.getShapePath(t);
};
Je.prototype._getGfx = function(t) {
  return this._elementRegistry.getGraphics(t);
};
var St;
let df = (St = class extends oe {
  constructor(e, n, i) {
    super(e), this.elementRegistry = n, this.connectionDocking = i, this.executed(["connection.layout", "connection.create"], this.cropConnection()), this.reverted(["connection.layout"], function(r) {
      delete r.context.cropped;
    }), this.executed(
      [
        "shape.create",
        "shape.move",
        "shape.delete",
        "shape.resize",
        "shape.removeGroupWithChildren"
      ],
      this.updateElement()
    ), this.reverted(
      [
        "shape.create",
        "shape.move",
        "shape.delete",
        "shape.resize",
        "shape.removeGroupWithChildren"
      ],
      this.updateElement()
    ), this.executed(
      [
        "connection.create",
        "connection.reconnect",
        "connection.updateWaypoints",
        "connection.delete",
        "connection.layout",
        "connection.move"
      ],
      this.updateConnection()
    ), this.reverted(
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
    return (e) => {
      const n = e.context, i = n.shape;
      if (!i)
        return;
      const r = i.businessObject, o = i.parent, s = this.elementRegistry.filter(
        (a) => !a.id.startsWith("root")
      );
      o ? Te(s, r) : Bt(s, r), T(r, Lt(i, ["x", "y"])), i.type === S.GROUP && (T(r, Lt(i, ["height", "width"])), o && (_n(o) || hi(o) ? pr(o, i) : (i.parent = o.parent, pr(o.parent, i)))), i && i.parent && "type" in i.parent && i.parent.type === S.GROUP && T(r, {
        parent: i.parent.id
      });
    };
  }
  updateConnection() {
    return (e) => {
      const n = e.context, i = n.connection, r = i.businessObject;
      let o = i.source, s = i.target;
      e.newTarget && (s = e.newTarget), e.newSource && (o = e.newSource);
      const a = i.parent, c = this.elementRegistry.filter(
        (u) => !u.id.startsWith("root")
      );
      a ? Te(c, r) : Bt(c, r), T(r, {
        waypoints: this.copyWaypoints(i)
      }), o && (r.source ? r.source = o.id : T(r, { source: o.id })), s && (r.target ? r.target = s.id : T(r, { target: s.id }));
    };
  }
  // crop connection ends during create/update
  cropConnection() {
    return (e) => {
      const n = e.context, i = n.hints || {};
      if (!n.cropped && i.createElementsBehavior !== !1) {
        const r = n.connection;
        r.waypoints = this.connectionDocking.getCroppedWaypoints(
          r,
          r.source,
          r.target
        ), n.cropped = !0;
      }
    };
  }
  copyWaypoints(e) {
    return e.waypoints.map(function(n) {
      const i = n.original;
      return i ? {
        original: {
          x: i.x,
          y: i.y
        },
        x: n.x,
        y: n.y
      } : {
        x: n.x,
        y: n.y
      };
    });
  }
}, St.$inject = [
  "eventBus",
  "elementRegistry",
  "connectionDocking"
], St);
const hf = {
  __init__: ["domainStoryUpdater"],
  domainStoryUpdater: ["type", df],
  connectionDocking: ["type", Je]
};
var ff = 250;
function ut(t) {
  this._eventBus = t, this._tools = [], this._active = null;
}
ut.$inject = ["eventBus"];
ut.prototype.registerTool = function(t, e) {
  var n = this._tools;
  if (!e)
    throw new Error(`A tool has to be registered with it's "events"`);
  n.push(t), this.bindEvents(t, e);
};
ut.prototype.isActive = function(t) {
  return t && this._active === t;
};
ut.prototype.length = function(t) {
  return this._tools.length;
};
ut.prototype.setActive = function(t) {
  var e = this._eventBus;
  this._active !== t && (this._active = t, e.fire("tool-manager.update", { tool: t }));
};
ut.prototype.bindEvents = function(t, e) {
  var n = this._eventBus, i = [];
  n.on(e.tool + ".init", function(r) {
    var o = r.context;
    if (!o.reactivate && this.isActive(t)) {
      this.setActive(null);
      return;
    }
    this.setActive(t);
  }, this), A(e, function(r) {
    i.push(r + ".ended"), i.push(r + ".canceled");
  }), n.on(i, ff, function(r) {
    this._active && (pf(r) || this.setActive(null));
  }, this);
};
function pf(t) {
  var e = t.originalEvent && t.originalEvent.target;
  return e && wn(e, '.group[data-group="tools"]');
}
const fo = {
  __depends__: [
    at
  ],
  __init__: ["toolManager"],
  toolManager: ["type", ut]
};
function po(t) {
  var e = this;
  this._lastMoveEvent = null;
  function n(i) {
    e._lastMoveEvent = i;
  }
  t.on("canvas.init", function(i) {
    var r = e._svg = i.svg;
    r.addEventListener("mousemove", n);
  }), t.on("canvas.destroy", function() {
    e._lastMouseEvent = null, e._svg.removeEventListener("mousemove", n);
  });
}
po.$inject = ["eventBus"];
po.prototype.getLastMoveEvent = function() {
  return this._lastMoveEvent || gf(0, 0);
};
function gf(t, e) {
  var n = document.createEvent("MouseEvent"), i = t, r = e, o = t, s = e;
  return n.initMouseEvent && n.initMouseEvent(
    "mousemove",
    !0,
    !0,
    window,
    0,
    i,
    r,
    o,
    s,
    !1,
    !1,
    !1,
    !1,
    0,
    null
  ), n;
}
const Di = {
  __init__: ["mouse"],
  mouse: ["type", po]
};
var Vi = Math.abs, yf = Math.round, Ce = {
  x: "width",
  y: "height"
}, zc = "crosshair", Be = {
  n: "top",
  w: "left",
  s: "bottom",
  e: "right"
}, vf = 1500, qn = {
  n: "s",
  w: "e",
  s: "n",
  e: "w"
}, Xn = 20;
function je(t, e, n, i, r, o, s) {
  this._canvas = t, this._dragging = e, this._eventBus = n, this._modeling = i, this._rules = r, this._toolManager = o, this._mouse = s;
  var a = this;
  o.registerTool("space", {
    tool: "spaceTool.selection",
    dragging: "spaceTool"
  }), n.on("spaceTool.selection.end", function(c) {
    n.once("spaceTool.selection.ended", function() {
      a.activateMakeSpace(c.originalEvent);
    });
  }), n.on("spaceTool.move", vf, function(c) {
    var u = c.context, l = u.initialized;
    l || (l = u.initialized = a.init(c, u)), l && Bs(c);
  }), n.on("spaceTool.end", function(c) {
    var u = c.context, l = u.axis, d = u.direction, h = u.movingShapes, f = u.resizingShapes, p = u.start;
    if (u.initialized) {
      Bs(c);
      var m = {
        x: 0,
        y: 0
      };
      m[l] = yf(c["d" + l]), a.makeSpace(h, f, m, d, p), n.once("spaceTool.ended", function(g) {
        a.activateSelection(g.originalEvent, !0, !0);
      });
    }
  });
}
je.$inject = [
  "canvas",
  "dragging",
  "eventBus",
  "modeling",
  "rules",
  "toolManager",
  "mouse"
];
je.prototype.activateSelection = function(t, e, n) {
  this._dragging.init(t, "spaceTool.selection", {
    autoActivate: e,
    cursor: zc,
    data: {
      context: {
        reactivate: n
      }
    },
    trapClick: !1
  });
};
je.prototype.activateMakeSpace = function(t) {
  this._dragging.init(t, "spaceTool", {
    autoActivate: !0,
    cursor: zc,
    data: {
      context: {}
    }
  });
};
je.prototype.makeSpace = function(t, e, n, i, r) {
  return this._modeling.createSpace(t, e, n, i, r);
};
je.prototype.init = function(t, e) {
  var n = Vi(t.dx) > Vi(t.dy) ? "x" : "y", i = t["d" + n], r = t[n] - i;
  if (Vi(i) < 5)
    return !1;
  i < 0 && (i *= -1), ii(t) && (i *= -1);
  var o = nf(n, i), s = this._canvas.getRootElement();
  !ri(t) && t.hover && (s = t.hover);
  var a = [
    ...Xa(s),
    ...s.attachers || []
  ], c = this.calculateAdjustments(a, n, i, r), u = this._eventBus.fire("spaceTool.getMinDimensions", {
    axis: n,
    direction: o,
    shapes: c.resizingShapes,
    start: r
  }), l = mf(c, n, o, r, u);
  return T(
    e,
    c,
    {
      axis: n,
      direction: o,
      spaceToolConstraints: l,
      start: r
    }
  ), _i("resize-" + (n === "x" ? "ew" : "ns")), !0;
};
je.prototype.calculateAdjustments = function(t, e, n, i) {
  var r = this._rules, o = [], s = [], a = [], c = [];
  function u(h) {
    o.includes(h) || o.push(h);
    var f = h.label;
    f && !o.includes(f) && o.push(f);
  }
  function l(h) {
    s.includes(h) || s.push(h);
  }
  A(t, function(h) {
    if (!(!h.parent || ne(h))) {
      if (K(h)) {
        c.push(h);
        return;
      }
      var f = h[e], p = f + h[Ce[e]];
      if (_f(h) && (n > 0 && re(h)[e] > i || n < 0 && re(h)[e] < i)) {
        a.push(h);
        return;
      }
      if (n > 0 && f > i || n < 0 && p < i) {
        u(h);
        return;
      }
      if (f < i && p > i && r.allowed("shape.resize", { shape: h })) {
        l(h);
        return;
      }
    }
  }), A(o, function(h) {
    var f = h.attachers;
    f && A(f, function(p) {
      u(p);
    });
  });
  var d = o.concat(s);
  return A(a, function(h) {
    var f = h.host;
    rt(d, f) && u(h);
  }), d = o.concat(s), A(c, function(h) {
    var f = h.source, p = h.target, m = h.label;
    rt(d, f) && rt(d, p) && m && u(m);
  }), {
    movingShapes: o,
    resizingShapes: s
  };
};
je.prototype.toggle = function() {
  if (this.isActive())
    return this._dragging.cancel();
  var t = this._mouse.getLastMoveEvent();
  this.activateSelection(t, !!t);
};
je.prototype.isActive = function() {
  var t = this._dragging.context();
  return t ? /^spaceTool/.test(t.prefix) : !1;
};
function Hs(t) {
  return {
    top: t.top - Xn,
    right: t.right + Xn,
    bottom: t.bottom + Xn,
    left: t.left - Xn
  };
}
function Bs(t) {
  var e = t.context, n = e.spaceToolConstraints;
  if (n) {
    var i, r;
    j(n.left) && (i = Math.max(t.x, n.left), t.dx = t.dx + i - t.x, t.x = i), j(n.right) && (i = Math.min(t.x, n.right), t.dx = t.dx + i - t.x, t.x = i), j(n.top) && (r = Math.max(t.y, n.top), t.dy = t.dy + r - t.y, t.y = r), j(n.bottom) && (r = Math.min(t.y, n.bottom), t.dy = t.dy + r - t.y, t.y = r);
  }
}
function mf(t, e, n, i, r) {
  var o = t.movingShapes, s = t.resizingShapes;
  if (s.length) {
    var a = {}, c, u;
    return A(s, function(l) {
      var d = l.attachers, h = l.children, f = se(l), p = we(h, function(O) {
        return !K(O) && !ne(O) && !rt(o, O) && !rt(s, O);
      }), m = we(h, function(O) {
        return !K(O) && !ne(O) && rt(o, O);
      }), g, E, x, y = [], v = [], _, w, R, b;
      p.length && (E = Hs(se(le(p))), g = i - f[Be[n]] + E[Be[n]], n === "n" ? a.bottom = u = j(u) ? Math.min(u, g) : g : n === "w" ? a.right = u = j(u) ? Math.min(u, g) : g : n === "s" ? a.top = c = j(c) ? Math.max(c, g) : g : n === "e" && (a.left = c = j(c) ? Math.max(c, g) : g)), m.length && (x = Hs(se(le(m))), g = i - x[Be[qn[n]]] + f[Be[qn[n]]], n === "n" ? a.bottom = u = j(u) ? Math.min(u, g) : g : n === "w" ? a.right = u = j(u) ? Math.min(u, g) : g : n === "s" ? a.top = c = j(c) ? Math.max(c, g) : g : n === "e" && (a.left = c = j(c) ? Math.max(c, g) : g)), d && d.length && (d.forEach(function(O) {
        rt(o, O) ? y.push(O) : v.push(O);
      }), y.length && (_ = se(le(y.map(re))), w = f[Be[qn[n]]] - (_[Be[qn[n]]] - i)), v.length && (R = se(le(v.map(re))), b = R[Be[n]] - (f[Be[n]] - i)), n === "n" ? (g = Math.min(w || 1 / 0, b || 1 / 0), a.bottom = u = j(u) ? Math.min(u, g) : g) : n === "w" ? (g = Math.min(w || 1 / 0, b || 1 / 0), a.right = u = j(u) ? Math.min(u, g) : g) : n === "s" ? (g = Math.max(w || -1 / 0, b || -1 / 0), a.top = c = j(c) ? Math.max(c, g) : g) : n === "e" && (g = Math.max(w || -1 / 0, b || -1 / 0), a.left = c = j(c) ? Math.max(c, g) : g));
      var C = r && r[l.id];
      C && (n === "n" ? (g = i + l[Ce[e]] - C[Ce[e]], a.bottom = u = j(u) ? Math.min(u, g) : g) : n === "w" ? (g = i + l[Ce[e]] - C[Ce[e]], a.right = u = j(u) ? Math.min(u, g) : g) : n === "s" ? (g = i - l[Ce[e]] + C[Ce[e]], a.top = c = j(c) ? Math.max(c, g) : g) : n === "e" && (g = i - l[Ce[e]] + C[Ce[e]], a.left = c = j(c) ? Math.max(c, g) : g));
    }), a;
  }
}
function rt(t, e) {
  return t.indexOf(e) !== -1;
}
function _f(t) {
  return !!t.host;
}
var Gi = "djs-dragging", Ws = "djs-resizing", xf = 250, Jn = Math.max;
function Uc(t, e, n, i, r) {
  function o(s, a) {
    A(s, function(c) {
      r.addDragger(c, a), n.addMarker(c, Gi);
    });
  }
  t.on("spaceTool.selection.start", function(s) {
    var a = n.getLayer("space"), c = s.context, u = {
      x: "M 0,-10000 L 0,10000",
      y: "M -10000,0 L 10000,0"
    }, l = D("g");
    k(l, i.cls("djs-crosshair-group", ["no-events"])), I(a, l);
    var d = D("path");
    k(d, "d", u.x), H(d).add("djs-crosshair"), I(l, d);
    var h = D("path");
    k(h, "d", u.y), H(h).add("djs-crosshair"), I(l, h), c.crosshairGroup = l;
  }), t.on("spaceTool.selection.move", function(s) {
    var a = s.context.crosshairGroup;
    he(a, s.x, s.y);
  }), t.on("spaceTool.selection.cleanup", function(s) {
    var a = s.context, c = a.crosshairGroup;
    c && Y(c);
  }), t.on("spaceTool.move", xf, function(s) {
    var a = s.context, c = a.line, u = a.axis, l = a.movingShapes, d = a.resizingShapes;
    if (a.initialized) {
      if (!a.dragGroup) {
        var h = n.getLayer("space");
        c = D("path"), k(c, "d", "M0,0 L0,0"), H(c).add("djs-crosshair"), I(h, c), a.line = c;
        var f = D("g");
        k(f, i.cls("djs-drag-group", ["no-events"])), I(n.getActiveLayer(), f), o(l, f);
        var p = a.movingConnections = e.filter(function(v) {
          var _ = !1;
          A(l, function(C) {
            A(C.outgoing, function(O) {
              v === O && (_ = !0);
            });
          });
          var w = !1;
          A(l, function(C) {
            A(C.incoming, function(O) {
              v === O && (w = !0);
            });
          });
          var R = !1;
          A(d, function(C) {
            A(C.outgoing, function(O) {
              v === O && (R = !0);
            });
          });
          var b = !1;
          return A(d, function(C) {
            A(C.incoming, function(O) {
              v === O && (b = !0);
            });
          }), K(v) && (_ || R) && (w || b);
        });
        o(p, f), a.dragGroup = f;
      }
      if (!a.frameGroup) {
        var m = D("g");
        k(m, i.cls("djs-frame-group", ["no-events"])), I(n.getActiveLayer(), m);
        var g = [];
        A(d, function(v) {
          var _ = r.addFrame(v, m), w = _.getBBox();
          g.push({
            element: _,
            initialBounds: w
          }), n.addMarker(v, Ws);
        }), a.frameGroup = m, a.frames = g;
      }
      var E = {
        x: "M" + s.x + ", -10000 L" + s.x + ", 10000",
        y: "M -10000, " + s.y + " L 10000, " + s.y
      };
      k(c, { d: E[u] });
      var x = { x: "y", y: "x" }, y = { x: s.dx, y: s.dy };
      y[x[a.axis]] = 0, he(a.dragGroup, y.x, y.y), A(a.frames, function(v) {
        var _ = v.element, w = v.initialBounds, R, b;
        a.direction === "e" ? k(_, {
          width: Jn(w.width + y.x, 5)
        }) : (R = Jn(w.width - y.x, 5), k(_, {
          width: R,
          x: w.x + w.width - R
        })), a.direction === "s" ? k(_, {
          height: Jn(w.height + y.y, 5)
        }) : (b = Jn(w.height - y.y, 5), k(_, {
          height: b,
          y: w.y + w.height - b
        }));
      });
    }
  }), t.on("spaceTool.cleanup", function(s) {
    var a = s.context, c = a.movingShapes, u = a.movingConnections, l = a.resizingShapes, d = a.line, h = a.dragGroup, f = a.frameGroup;
    A(c, function(p) {
      n.removeMarker(p, Gi);
    }), A(u, function(p) {
      n.removeMarker(p, Gi);
    }), h && (Y(d), Y(h)), A(l, function(p) {
      n.removeMarker(p, Ws);
    }), f && Y(f);
  });
}
Uc.$inject = [
  "eventBus",
  "elementRegistry",
  "canvas",
  "styles",
  "previewSupport"
];
const bf = {
  __init__: ["spaceToolPreview"],
  __depends__: [
    at,
    ke,
    fo,
    bi,
    Di
  ],
  spaceTool: ["type", je],
  spaceToolPreview: ["type", Uc]
};
var Fc = "crosshair";
function lt(t, e, n, i, r, o, s) {
  this._selection = r, this._dragging = n, this._mouse = s;
  var a = this, c = {
    create: function(u) {
      var l = e.getActiveLayer(), d;
      d = u.frame = D("rect"), k(d, {
        class: "djs-lasso-overlay",
        width: 1,
        height: 1,
        x: 0,
        y: 0
      }), I(l, d);
    },
    update: function(u) {
      var l = u.frame, d = u.bbox;
      k(l, {
        x: d.x,
        y: d.y,
        width: d.width,
        height: d.height
      });
    },
    remove: function(u) {
      u.frame && Y(u.frame);
    }
  };
  o.registerTool("lasso", {
    tool: "lasso.selection",
    dragging: "lasso"
  }), t.on("lasso.selection.end", function(u) {
    var l = u.originalEvent.target;
    !u.hover && !(l instanceof SVGElement) || t.once("lasso.selection.ended", function() {
      a.activateLasso(u.originalEvent, !0);
    });
  }), t.on("lasso.end", 0, function(u) {
    var l = u.context, d = qi(u), h = i.filter(function(p) {
      return p;
    }), f = ri(u);
    a.select(h, d, f ? l.selection : []);
  }), t.on("lasso.start", function(u) {
    var l = u.context;
    l.bbox = qi(u), c.create(l), l.selection = r.get();
  }), t.on("lasso.move", function(u) {
    var l = u.context;
    l.bbox = qi(u), c.update(l);
  }), t.on("lasso.cleanup", function(u) {
    var l = u.context;
    c.remove(l);
  }), t.on("element.mousedown", 1500, function(u) {
    if (ri(u))
      return a.activateLasso(u.originalEvent), !0;
  });
}
lt.$inject = [
  "eventBus",
  "canvas",
  "dragging",
  "elementRegistry",
  "selection",
  "toolManager",
  "mouse"
];
lt.prototype.activateLasso = function(t, e) {
  this._dragging.init(t, "lasso", {
    autoActivate: e,
    cursor: Fc,
    data: {
      context: {}
    }
  });
};
lt.prototype.activateSelection = function(t, e) {
  this._dragging.init(t, "lasso.selection", {
    trapClick: !1,
    autoActivate: e,
    cursor: Fc,
    data: {
      context: {}
    },
    keepSelection: !0
  });
};
lt.prototype.select = function(t, e, n = []) {
  var i = dl(t, e);
  this._selection.select([
    ...n,
    ...Oa(i)
  ]);
};
lt.prototype.toggle = function() {
  if (this.isActive())
    return this._dragging.cancel();
  var t = this._mouse.getLastMoveEvent();
  this.activateSelection(t, !!t);
};
lt.prototype.isActive = function() {
  var t = this._dragging.context();
  return t && /^lasso/.test(t.prefix);
};
function qi(t) {
  var e = {
    x: t.x - t.dx,
    y: t.y - t.dy
  }, n = {
    x: t.x,
    y: t.y
  }, i;
  return e.x <= n.x && e.y < n.y || e.x < n.x && e.y <= n.y ? i = {
    x: e.x,
    y: e.y,
    width: n.x - e.x,
    height: n.y - e.y
  } : e.x >= n.x && e.y < n.y || e.x > n.x && e.y <= n.y ? i = {
    x: n.x,
    y: e.y,
    width: e.x - n.x,
    height: n.y - e.y
  } : e.x <= n.x && e.y > n.y || e.x < n.x && e.y >= n.y ? i = {
    x: e.x,
    y: n.y,
    width: n.x - e.x,
    height: e.y - n.y
  } : e.x >= n.x && e.y > n.y || e.x > n.x && e.y >= n.y ? i = {
    x: n.x,
    y: n.y,
    width: e.x - n.x,
    height: e.y - n.y
  } : i = {
    x: n.x,
    y: n.y,
    width: 0,
    height: 0
  }, i;
}
const Ef = {
  __depends__: [
    fo,
    Di
  ],
  __init__: ["lassoTool"],
  lassoTool: ["type", lt]
};
var Kc = ".djs-palette-toggle", $c = ".entry", wf = Kc + ", " + $c, br = "djs-palette-", Sf = "shown", Er = "open", zs = "two-column", Af = 1e3;
function G(t, e) {
  this._eventBus = t, this._canvas = e;
  var n = this;
  t.on("tool-manager.update", function(i) {
    var r = i.tool;
    n.updateToolHighlight(r);
  }), t.on("i18n.changed", function() {
    n._update();
  }), t.on("diagram.init", function() {
    n._diagramInitialized = !0, n._rebuild();
  });
}
G.$inject = ["eventBus", "canvas"];
G.prototype.registerProvider = function(t, e) {
  e || (e = t, t = Af), this._eventBus.on("palette.getProviders", t, function(n) {
    n.providers.push(e);
  }), this._rebuild();
};
G.prototype.getEntries = function() {
  var t = this._getProviders();
  return t.reduce(Of, {});
};
G.prototype._rebuild = function() {
  if (this._diagramInitialized) {
    var t = this._getProviders();
    t.length && (this._container || this._init(), this._update());
  }
};
G.prototype._init = function() {
  var t = this, e = this._eventBus, n = this._getParentContainer(), i = this._container = be(G.HTML_MARKUP);
  n.appendChild(i), fe(n).add(br + Sf), We.bind(i, wf, "click", function(r) {
    var o = r.delegateTarget;
    if (Ta(o, Kc))
      return t.toggle();
    t.trigger("click", r);
  }), N.bind(i, "mousedown", function(r) {
    r.stopPropagation();
  }), We.bind(i, $c, "dragstart", function(r) {
    t.trigger("dragstart", r);
  }), e.on("canvas.resized", this._layoutChanged, this), e.fire("palette.create", {
    container: i
  });
};
G.prototype._getProviders = function(t) {
  var e = this._eventBus.createEvent({
    type: "palette.getProviders",
    providers: []
  });
  return this._eventBus.fire(e), e.providers;
};
G.prototype._toggleState = function(t) {
  t = t || {};
  var e = this._getParentContainer(), n = this._container, i = this._eventBus, r, o = fe(n), s = fe(e);
  "twoColumn" in t ? r = t.twoColumn : r = this._needsCollapse(e.clientHeight, this._entries || {}), o.toggle(zs, r), s.toggle(br + zs, r), "open" in t && (o.toggle(Er, t.open), s.toggle(br + Er, t.open)), i.fire("palette.changed", {
    twoColumn: r,
    open: this.isOpen()
  });
};
G.prototype._update = function() {
  var t = ee(".djs-palette-entries", this._container), e = this._entries = this.getEntries();
  Ou(t), A(e, function(n, i) {
    var r = n.group || "default", o = ee("[data-group=" + Zr(r) + "]", t);
    o || (o = be('<div class="group"></div>'), ye(o, "data-group", r), t.appendChild(o));
    var s = n.html || (n.separator ? '<hr class="separator" />' : '<div class="entry" draggable="true"></div>'), a = be(s);
    if (o.appendChild(a), !n.separator && (ye(a, "data-action", i), n.title && ye(a, "title", n.title), n.className && Cf(a, n.className), n.imageUrl)) {
      var c = be("<img>");
      ye(c, "src", n.imageUrl), a.appendChild(c);
    }
  }), this.open();
};
G.prototype.trigger = function(t, e, n) {
  var i, r, o = e.delegateTarget || e.target;
  return o ? (i = ye(o, "data-action"), r = e.originalEvent || e, this.triggerEntry(i, t, r, n)) : e.preventDefault();
};
G.prototype.triggerEntry = function(t, e, n, i) {
  var r = this._entries, o, s;
  if (o = r[t], !!o && (s = o.action, this._eventBus.fire("palette.trigger", { entry: o, event: n }) !== !1)) {
    if (Z(s)) {
      if (e === "click")
        return s(n, i);
    } else if (s[e])
      return s[e](n, i);
    n.preventDefault();
  }
};
G.prototype._layoutChanged = function() {
  this._toggleState({});
};
G.prototype._needsCollapse = function(t, e) {
  var n = 50, i = Object.keys(e).length * 46;
  return t < i + n;
};
G.prototype.close = function() {
  this._toggleState({
    open: !1,
    twoColumn: !1
  });
};
G.prototype.open = function() {
  this._toggleState({ open: !0 });
};
G.prototype.toggle = function() {
  this.isOpen() ? this.close() : this.open();
};
G.prototype.isActiveTool = function(t) {
  return t && this._activeTool === t;
};
G.prototype.updateToolHighlight = function(t) {
  var e, n;
  this._toolsContainer || (e = ee(".djs-palette-entries", this._container), this._toolsContainer = ee("[data-group=tools]", e)), n = this._toolsContainer, A(n.children, function(i) {
    var r = i.getAttribute("data-action");
    if (r) {
      var o = fe(i);
      r = r.replace("-tool", ""), o.contains("entry") && r === t ? o.add("highlighted-entry") : o.remove("highlighted-entry");
    }
  });
};
G.prototype.isOpen = function() {
  return fe(this._container).has(Er);
};
G.prototype._getParentContainer = function() {
  return this._canvas.getContainer();
};
G.HTML_MARKUP = '<div class="djs-palette"><div class="djs-palette-entries"></div><div class="djs-palette-toggle"></div></div>';
function Cf(t, e) {
  var n = fe(t), i = L(e) ? e : e.split(/\s+/g);
  i.forEach(function(r) {
    n.add(r);
  });
}
function Of(t, e) {
  var n = e.getPaletteEntries();
  return Z(n) ? n(t) : (A(n, function(i, r) {
    t[r] = i;
  }), t);
}
const Tf = {
  __init__: ["palette"],
  palette: ["type", G]
};
var Rf = "drop-ok", Us = "drop-not-ok", Fs = "attach-ok", Ks = "new-parent", $s = "create", kf = 2e3;
function Vc(t, e, n, i, r) {
  function o(c, u, l, d, h) {
    if (!u)
      return !1;
    c = we(c, function(x) {
      var y = x.labelTarget;
      return !x.parent && !(ne(x) && c.indexOf(y) !== -1);
    });
    var f = de(c, function(x) {
      return !K(x);
    }), p = !1, m = !1, g = !1;
    Gs(c) && (p = r.allowed("shape.attach", {
      position: l,
      shape: f,
      target: u
    })), p || (Gs(c) ? g = r.allowed("shape.create", {
      position: l,
      shape: f,
      source: d,
      target: u
    }) : g = r.allowed("elements.create", {
      elements: c,
      position: l,
      target: u
    }));
    var E = h.connectionTarget;
    return g || p ? (f && d && (m = r.allowed("connection.create", {
      source: E === d ? f : d,
      target: E === d ? d : f,
      hints: {
        targetParent: u,
        targetAttach: p
      }
    })), {
      attach: p,
      connect: m
    }) : g === null || p === null ? null : !1;
  }
  function s(c, u) {
    [Fs, Rf, Us, Ks].forEach(function(l) {
      l === u ? t.addMarker(c, l) : t.removeMarker(c, l);
    });
  }
  n.on(["create.move", "create.hover"], function(c) {
    var u = c.context, l = u.elements, d = c.hover, h = u.source, f = u.hints || {};
    if (!d) {
      u.canExecute = !1, u.target = null;
      return;
    }
    Vs(c);
    var p = {
      x: c.x,
      y: c.y
    }, m = u.canExecute = d && o(l, d, p, h, f);
    d && m !== null && (u.target = d, m && m.attach ? s(d, Fs) : s(d, m ? Ks : Us));
  }), n.on(["create.end", "create.out", "create.cleanup"], function(c) {
    var u = c.hover;
    u && s(u, null);
  }), n.on("create.end", function(c) {
    var u = c.context, l = u.source, d = u.shape, h = u.elements, f = u.target, p = u.canExecute, m = p && p.attach, g = p && p.connect, E = u.hints || {};
    if (p === !1 || !f)
      return !1;
    Vs(c);
    var x = {
      x: c.x,
      y: c.y
    };
    g ? d = i.appendShape(l, d, x, f, {
      attach: m,
      connection: g === !0 ? {} : g,
      connectionTarget: E.connectionTarget
    }) : (h = i.createElements(h, x, f, T({}, E, {
      attach: m
    })), d = de(h, function(y) {
      return !K(y);
    })), T(u, {
      elements: h,
      shape: d
    }), T(c, {
      elements: h,
      shape: d
    });
  });
  function a() {
    var c = e.context();
    c && c.prefix === $s && e.cancel();
  }
  n.on("create.init", function() {
    n.on("elements.changed", a), n.once(["create.cancel", "create.end"], kf, function() {
      n.off("elements.changed", a);
    });
  }), this.start = function(c, u, l) {
    L(u) || (u = [u]);
    var d = de(u, function(p) {
      return !K(p);
    });
    if (d) {
      l = T({
        elements: u,
        hints: {},
        shape: d
      }, l || {}), A(u, function(p) {
        j(p.x) || (p.x = 0), j(p.y) || (p.y = 0);
      });
      var h = we(u, function(p) {
        return !p.hidden;
      }), f = le(h);
      A(u, function(p) {
        K(p) && (p.waypoints = xe(p.waypoints, function(m) {
          return {
            x: m.x - f.x - f.width / 2,
            y: m.y - f.y - f.height / 2
          };
        })), T(p, {
          x: p.x - f.x - f.width / 2,
          y: p.y - f.y - f.height / 2
        });
      }), e.init(c, $s, {
        cursor: "grabbing",
        autoActivate: !0,
        data: {
          shape: d,
          elements: u,
          context: l
        }
      });
    }
  };
}
Vc.$inject = [
  "canvas",
  "dragging",
  "eventBus",
  "modeling",
  "rules"
];
function Vs(t) {
  var e = t.context, n = e.createConstraints;
  n && (n.left && (t.x = Math.max(t.x, n.left)), n.right && (t.x = Math.min(t.x, n.right)), n.top && (t.y = Math.max(t.y, n.top)), n.bottom && (t.y = Math.min(t.y, n.bottom)));
}
function Gs(t) {
  return t && t.length === 1 && !K(t[0]);
}
var Pf = 750;
function Gc(t, e, n, i, r) {
  function o(s) {
    var a = D("g");
    k(a, r.cls("djs-drag-group", ["no-events"]));
    var c = D("g");
    return s.forEach(function(u) {
      var l;
      u.hidden || (u.waypoints ? (l = n._createContainer("connection", c), n.drawConnection(ir(l), u)) : (l = n._createContainer("shape", c), n.drawShape(ir(l), u), he(l, u.x, u.y)), i.addDragger(u, a, l));
    }), a;
  }
  e.on("create.move", Pf, function(s) {
    var a = s.hover, c = s.context, u = c.elements, l = c.dragGroup;
    l || (l = c.dragGroup = o(u));
    var d;
    a ? (l.parentNode || (d = t.getActiveLayer(), I(d, l)), he(l, s.x, s.y)) : Y(l);
  }), e.on("create.cleanup", function(s) {
    var a = s.context, c = a.dragGroup;
    c && Y(c);
  });
}
Gc.$inject = [
  "canvas",
  "eventBus",
  "graphicsFactory",
  "previewSupport",
  "styles"
];
const go = {
  __depends__: [
    at,
    bi,
    ke,
    $t
  ],
  __init__: [
    "create",
    "createPreview"
  ],
  create: ["type", Vc],
  createPreview: ["type", Gc]
};
var At;
let Mf = (At = class {
  constructor(e, n, i, r, o, s, a) {
    this.create = i, this.elementFactory = r, this.spaceTool = o, this.lassoTool = s, this.iconDictionaryService = a, e.registerProvider(this), n.on("dst.config.changed", () => {
      e._update();
    });
  }
  getPaletteEntries() {
    return this.initPalette();
  }
  initPalette() {
    const e = {}, n = this.iconDictionaryService.getIconsAssignedAs(
      S.ACTOR
    );
    n == null || n.keysArray().forEach((r) => {
      const o = this.addCanvasObjectTypes(r, "actor", S.ACTOR);
      Object.entries(o).forEach(([s, a]) => {
        e[s] = a;
      });
    }), e["actor-separator"] = {
      group: "actor",
      separator: !0,
      action: () => {
      }
    };
    const i = this.iconDictionaryService.getIconsAssignedAs(
      S.WORKOBJECT
    );
    return i == null || i.keysArray().forEach((r) => {
      const o = this.addCanvasObjectTypes(
        r,
        "actor",
        S.WORKOBJECT
      );
      Object.entries(o).forEach(([s, a]) => {
        e[s] = a;
      });
    }), e["workObject-separator"] = {
      group: "workObject",
      separator: !0,
      action: () => {
      }
    }, e["domainStory-group"] = this.createAction(
      S.GROUP,
      "group",
      "icon-domain-story-tool-group",
      "group",
      {}
    ), e["group-separator"] = {
      group: "group",
      separator: !0,
      action: () => {
      }
    }, e["lasso-tool"] = {
      group: "tools",
      className: "bpmn-icon-lasso-tool",
      title: "Activate the lasso tool",
      action: {
        click: (r) => {
          this.lassoTool.activateSelection(r);
        }
      }
    }, e["space-tool"] = {
      group: "tools",
      className: "bpmn-icon-space-tool",
      title: "Activate the create/remove space tool",
      action: {
        click: (r) => {
          this.spaceTool.activateSelection(r, !1, !1);
        }
      }
    }, e;
  }
  addCanvasObjectTypes(e, n, i) {
    const r = this.iconDictionaryService.getCSSClassOfIcon(e), o = `domainStory-${n}${e}`, s = this.createAction(
      `${i}${e}`,
      n,
      r ?? "",
      e,
      {}
    );
    return {
      [o]: s
    };
  }
  createAction(e, n, i, r, o) {
    const s = (c) => {
      const u = this.elementFactory.createShape(
        T({ type: e }, o)
      );
      T(u.businessObject, {
        id: u.id
      }), this.create.start(c, u);
    }, a = e.replace(/^domainStory:/, "");
    return {
      group: n,
      className: i,
      title: "Create " + r || "Create " + a,
      action: {
        dragstart: s,
        click: s
      }
    };
  }
}, At.$inject = [
  "palette",
  "eventBus",
  "create",
  "elementFactory",
  "spaceTool",
  "lassoTool",
  "domainStoryIconDictionaryService"
], At);
const If = {
  __depends__: [
    Xt,
    go,
    bf,
    Ef,
    Tf
  ],
  __init__: ["domainStoryPaletteProvider"],
  domainStoryPaletteProvider: ["type", Mf]
};
function qc(t, e, n, i) {
  function r(s, a) {
    return i.allowed("connection.create", {
      source: s,
      target: a
    });
  }
  function o(s, a) {
    return r(a, s);
  }
  t.on("connect.hover", function(s) {
    var a = s.context, c = a.start, u = s.hover, l;
    if (a.hover = u, l = a.canExecute = r(c, u), !$o(l)) {
      if (l !== !1) {
        a.source = c, a.target = u;
        return;
      }
      l = a.canExecute = o(c, u), !$o(l) && l !== !1 && (a.source = u, a.target = c);
    }
  }), t.on(["connect.out", "connect.cleanup"], function(s) {
    var a = s.context;
    a.hover = null, a.source = null, a.target = null, a.canExecute = !1;
  }), t.on("connect.end", function(s) {
    var a = s.context, c = a.canExecute, u = a.connectionStart, l = {
      x: s.x,
      y: s.y
    }, d = a.source, h = a.target;
    if (!c)
      return !1;
    var f = null, p = {
      connectionStart: wr(a) ? l : u,
      connectionEnd: wr(a) ? u : l
    };
    ie(c) && (f = c), a.connection = n.connect(d, h, f, p);
  }), this.start = function(s, a, c, u) {
    ie(c) || (u = c, c = re(a)), e.init(s, "connect", {
      autoActivate: u,
      data: {
        shape: a,
        context: {
          start: a,
          connectionStart: c
        }
      }
    });
  };
}
qc.$inject = [
  "eventBus",
  "dragging",
  "modeling",
  "rules"
];
function wr(t) {
  var e = t.hover, n = t.source, i = t.target;
  return e && n && e === n && n !== i;
}
var jf = 1100, Df = 900, qs = "connect-ok", Xs = "connect-not-ok";
function Xc(t, e, n) {
  var i = t.get("connectionPreview", !1);
  i && e.on("connect.move", function(r) {
    var o = r.context, s = o.canExecute, a = o.hover, c = o.source, u = o.start, l = o.startPosition, d = o.target, h = o.connectionStart || l, f = o.connectionEnd || {
      x: r.x,
      y: r.y
    }, p = h, m = f;
    wr(o) && (p = f, m = h), i.drawPreview(o, s, {
      source: c || u,
      target: d || a,
      connectionStart: p,
      connectionEnd: m
    });
  }), e.on("connect.hover", Df, function(r) {
    var o = r.context, s = r.hover, a = o.canExecute;
    a !== null && n.addMarker(s, a ? qs : Xs);
  }), e.on([
    "connect.out",
    "connect.cleanup"
  ], jf, function(r) {
    var o = r.hover;
    o && (n.removeMarker(o, qs), n.removeMarker(o, Xs));
  }), i && e.on("connect.cleanup", function(r) {
    i.cleanUp(r.context);
  });
}
Xc.$inject = [
  "injector",
  "eventBus",
  "canvas"
];
const Lf = {
  __depends__: [
    $t,
    ke,
    at
  ],
  __init__: [
    "connectPreview"
  ],
  connect: ["type", qc],
  connectPreview: ["type", Xc]
};
var Li, z, Jc, it, Js, Qc, Yc, Zc, yo, Sr, Ar, xn = {}, eu = [], Nf = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i, vo = Array.isArray;
function Ue(t, e) {
  for (var n in e) t[n] = e[n];
  return t;
}
function mo(t) {
  t && t.parentNode && t.parentNode.removeChild(t);
}
function tu(t, e, n) {
  var i, r, o, s = {};
  for (o in e) o == "key" ? i = e[o] : o == "ref" ? r = e[o] : s[o] = e[o];
  if (arguments.length > 2 && (s.children = arguments.length > 3 ? Li.call(arguments, 2) : n), typeof t == "function" && t.defaultProps != null) for (o in t.defaultProps) s[o] === void 0 && (s[o] = t.defaultProps[o]);
  return ei(t, s, i, r, null);
}
function ei(t, e, n, i, r) {
  var o = { type: t, props: e, key: n, ref: i, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: r ?? ++Jc, __i: -1, __u: 0 };
  return r == null && z.vnode != null && z.vnode(o), o;
}
function Ni(t) {
  return t.children;
}
function ti(t, e) {
  this.props = t, this.context = e;
}
function Wt(t, e) {
  if (e == null) return t.__ ? Wt(t.__, t.__i + 1) : null;
  for (var n; e < t.__k.length; e++) if ((n = t.__k[e]) != null && n.__e != null) return n.__e;
  return typeof t.type == "function" ? Wt(t) : null;
}
function nu(t) {
  var e, n;
  if ((t = t.__) != null && t.__c != null) {
    for (t.__e = t.__c.base = null, e = 0; e < t.__k.length; e++) if ((n = t.__k[e]) != null && n.__e != null) {
      t.__e = t.__c.base = n.__e;
      break;
    }
    return nu(t);
  }
}
function Qs(t) {
  (!t.__d && (t.__d = !0) && it.push(t) && !fi.__r++ || Js !== z.debounceRendering) && ((Js = z.debounceRendering) || Qc)(fi);
}
function fi() {
  for (var t, e, n, i, r, o, s, a = 1; it.length; ) it.length > a && it.sort(Yc), t = it.shift(), a = it.length, t.__d && (n = void 0, r = (i = (e = t).__v).__e, o = [], s = [], e.__P && ((n = Ue({}, i)).__v = i.__v + 1, z.vnode && z.vnode(n), _o(e.__P, n, i, e.__n, e.__P.namespaceURI, 32 & i.__u ? [r] : null, o, r ?? Wt(i), !!(32 & i.__u), s), n.__v = i.__v, n.__.__k[n.__i] = n, ou(o, n, s), n.__e != r && nu(n)));
  fi.__r = 0;
}
function iu(t, e, n, i, r, o, s, a, c, u, l) {
  var d, h, f, p, m, g, E = i && i.__k || eu, x = e.length;
  for (c = Hf(n, e, E, c, x), d = 0; d < x; d++) (f = n.__k[d]) != null && (h = f.__i === -1 ? xn : E[f.__i] || xn, f.__i = d, g = _o(t, f, h, r, o, s, a, c, u, l), p = f.__e, f.ref && h.ref != f.ref && (h.ref && xo(h.ref, null, f), l.push(f.ref, f.__c || p, f)), m == null && p != null && (m = p), 4 & f.__u || h.__k === f.__k ? c = ru(f, c, t) : typeof f.type == "function" && g !== void 0 ? c = g : p && (c = p.nextSibling), f.__u &= -7);
  return n.__e = m, c;
}
function Hf(t, e, n, i, r) {
  var o, s, a, c, u, l = n.length, d = l, h = 0;
  for (t.__k = new Array(r), o = 0; o < r; o++) (s = e[o]) != null && typeof s != "boolean" && typeof s != "function" ? (c = o + h, (s = t.__k[o] = typeof s == "string" || typeof s == "number" || typeof s == "bigint" || s.constructor == String ? ei(null, s, null, null, null) : vo(s) ? ei(Ni, { children: s }, null, null, null) : s.constructor === void 0 && s.__b > 0 ? ei(s.type, s.props, s.key, s.ref ? s.ref : null, s.__v) : s).__ = t, s.__b = t.__b + 1, a = null, (u = s.__i = Bf(s, n, c, d)) !== -1 && (d--, (a = n[u]) && (a.__u |= 2)), a == null || a.__v === null ? (u == -1 && h--, typeof s.type != "function" && (s.__u |= 4)) : u != c && (u == c - 1 ? h-- : u == c + 1 ? h++ : (u > c ? h-- : h++, s.__u |= 4))) : t.__k[o] = null;
  if (d) for (o = 0; o < l; o++) (a = n[o]) != null && !(2 & a.__u) && (a.__e == i && (i = Wt(a)), su(a, a));
  return i;
}
function ru(t, e, n) {
  var i, r;
  if (typeof t.type == "function") {
    for (i = t.__k, r = 0; i && r < i.length; r++) i[r] && (i[r].__ = t, e = ru(i[r], e, n));
    return e;
  }
  t.__e != e && (e && t.type && !n.contains(e) && (e = Wt(t)), n.insertBefore(t.__e, e || null), e = t.__e);
  do
    e = e && e.nextSibling;
  while (e != null && e.nodeType == 8);
  return e;
}
function Bf(t, e, n, i) {
  var r, o, s = t.key, a = t.type, c = e[n];
  if (c === null || c && s == c.key && a === c.type && !(2 & c.__u)) return n;
  if (i > (c != null && !(2 & c.__u) ? 1 : 0)) for (r = n - 1, o = n + 1; r >= 0 || o < e.length; ) {
    if (r >= 0) {
      if ((c = e[r]) && !(2 & c.__u) && s == c.key && a === c.type) return r;
      r--;
    }
    if (o < e.length) {
      if ((c = e[o]) && !(2 & c.__u) && s == c.key && a === c.type) return o;
      o++;
    }
  }
  return -1;
}
function Ys(t, e, n) {
  e[0] == "-" ? t.setProperty(e, n ?? "") : t[e] = n == null ? "" : typeof n != "number" || Nf.test(e) ? n : n + "px";
}
function Qn(t, e, n, i, r) {
  var o;
  e: if (e == "style") if (typeof n == "string") t.style.cssText = n;
  else {
    if (typeof i == "string" && (t.style.cssText = i = ""), i) for (e in i) n && e in n || Ys(t.style, e, "");
    if (n) for (e in n) i && n[e] === i[e] || Ys(t.style, e, n[e]);
  }
  else if (e[0] == "o" && e[1] == "n") o = e != (e = e.replace(Zc, "$1")), e = e.toLowerCase() in t || e == "onFocusOut" || e == "onFocusIn" ? e.toLowerCase().slice(2) : e.slice(2), t.l || (t.l = {}), t.l[e + o] = n, n ? i ? n.t = i.t : (n.t = yo, t.addEventListener(e, o ? Ar : Sr, o)) : t.removeEventListener(e, o ? Ar : Sr, o);
  else {
    if (r == "http://www.w3.org/2000/svg") e = e.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
    else if (e != "width" && e != "height" && e != "href" && e != "list" && e != "form" && e != "tabIndex" && e != "download" && e != "rowSpan" && e != "colSpan" && e != "role" && e != "popover" && e in t) try {
      t[e] = n ?? "";
      break e;
    } catch {
    }
    typeof n == "function" || (n == null || n === !1 && e[4] != "-" ? t.removeAttribute(e) : t.setAttribute(e, e == "popover" && n == 1 ? "" : n));
  }
}
function Zs(t) {
  return function(e) {
    if (this.l) {
      var n = this.l[e.type + t];
      if (e.u == null) e.u = yo++;
      else if (e.u < n.t) return;
      return n(z.event ? z.event(e) : e);
    }
  };
}
function _o(t, e, n, i, r, o, s, a, c, u) {
  var l, d, h, f, p, m, g, E, x, y, v, _, w, R, b, C, O, M = e.type;
  if (e.constructor !== void 0) return null;
  128 & n.__u && (c = !!(32 & n.__u), o = [a = e.__e = n.__e]), (l = z.__b) && l(e);
  e: if (typeof M == "function") try {
    if (E = e.props, x = "prototype" in M && M.prototype.render, y = (l = M.contextType) && i[l.__c], v = l ? y ? y.props.value : l.__ : i, n.__c ? g = (d = e.__c = n.__c).__ = d.__E : (x ? e.__c = d = new M(E, v) : (e.__c = d = new ti(E, v), d.constructor = M, d.render = zf), y && y.sub(d), d.props = E, d.state || (d.state = {}), d.context = v, d.__n = i, h = d.__d = !0, d.__h = [], d._sb = []), x && d.__s == null && (d.__s = d.state), x && M.getDerivedStateFromProps != null && (d.__s == d.state && (d.__s = Ue({}, d.__s)), Ue(d.__s, M.getDerivedStateFromProps(E, d.__s))), f = d.props, p = d.state, d.__v = e, h) x && M.getDerivedStateFromProps == null && d.componentWillMount != null && d.componentWillMount(), x && d.componentDidMount != null && d.__h.push(d.componentDidMount);
    else {
      if (x && M.getDerivedStateFromProps == null && E !== f && d.componentWillReceiveProps != null && d.componentWillReceiveProps(E, v), !d.__e && (d.shouldComponentUpdate != null && d.shouldComponentUpdate(E, d.__s, v) === !1 || e.__v == n.__v)) {
        for (e.__v != n.__v && (d.props = E, d.state = d.__s, d.__d = !1), e.__e = n.__e, e.__k = n.__k, e.__k.some(function(P) {
          P && (P.__ = e);
        }), _ = 0; _ < d._sb.length; _++) d.__h.push(d._sb[_]);
        d._sb = [], d.__h.length && s.push(d);
        break e;
      }
      d.componentWillUpdate != null && d.componentWillUpdate(E, d.__s, v), x && d.componentDidUpdate != null && d.__h.push(function() {
        d.componentDidUpdate(f, p, m);
      });
    }
    if (d.context = v, d.props = E, d.__P = t, d.__e = !1, w = z.__r, R = 0, x) {
      for (d.state = d.__s, d.__d = !1, w && w(e), l = d.render(d.props, d.state, d.context), b = 0; b < d._sb.length; b++) d.__h.push(d._sb[b]);
      d._sb = [];
    } else do
      d.__d = !1, w && w(e), l = d.render(d.props, d.state, d.context), d.state = d.__s;
    while (d.__d && ++R < 25);
    d.state = d.__s, d.getChildContext != null && (i = Ue(Ue({}, i), d.getChildContext())), x && !h && d.getSnapshotBeforeUpdate != null && (m = d.getSnapshotBeforeUpdate(f, p)), a = iu(t, vo(C = l != null && l.type === Ni && l.key == null ? l.props.children : l) ? C : [C], e, n, i, r, o, s, a, c, u), d.base = e.__e, e.__u &= -161, d.__h.length && s.push(d), g && (d.__E = d.__ = null);
  } catch (P) {
    if (e.__v = null, c || o != null) if (P.then) {
      for (e.__u |= c ? 160 : 128; a && a.nodeType == 8 && a.nextSibling; ) a = a.nextSibling;
      o[o.indexOf(a)] = null, e.__e = a;
    } else for (O = o.length; O--; ) mo(o[O]);
    else e.__e = n.__e, e.__k = n.__k;
    z.__e(P, e, n);
  }
  else o == null && e.__v == n.__v ? (e.__k = n.__k, e.__e = n.__e) : a = e.__e = Wf(n.__e, e, n, i, r, o, s, c, u);
  return (l = z.diffed) && l(e), 128 & e.__u ? void 0 : a;
}
function ou(t, e, n) {
  for (var i = 0; i < n.length; i++) xo(n[i], n[++i], n[++i]);
  z.__c && z.__c(e, t), t.some(function(r) {
    try {
      t = r.__h, r.__h = [], t.some(function(o) {
        o.call(r);
      });
    } catch (o) {
      z.__e(o, r.__v);
    }
  });
}
function Wf(t, e, n, i, r, o, s, a, c) {
  var u, l, d, h, f, p, m, g = n.props, E = e.props, x = e.type;
  if (x == "svg" ? r = "http://www.w3.org/2000/svg" : x == "math" ? r = "http://www.w3.org/1998/Math/MathML" : r || (r = "http://www.w3.org/1999/xhtml"), o != null) {
    for (u = 0; u < o.length; u++) if ((f = o[u]) && "setAttribute" in f == !!x && (x ? f.localName == x : f.nodeType == 3)) {
      t = f, o[u] = null;
      break;
    }
  }
  if (t == null) {
    if (x == null) return document.createTextNode(E);
    t = document.createElementNS(r, x, E.is && E), a && (z.__m && z.__m(e, o), a = !1), o = null;
  }
  if (x === null) g === E || a && t.data === E || (t.data = E);
  else {
    if (o = o && Li.call(t.childNodes), g = n.props || xn, !a && o != null) for (g = {}, u = 0; u < t.attributes.length; u++) g[(f = t.attributes[u]).name] = f.value;
    for (u in g) if (f = g[u], u != "children") {
      if (u == "dangerouslySetInnerHTML") d = f;
      else if (!(u in E)) {
        if (u == "value" && "defaultValue" in E || u == "checked" && "defaultChecked" in E) continue;
        Qn(t, u, null, f, r);
      }
    }
    for (u in E) f = E[u], u == "children" ? h = f : u == "dangerouslySetInnerHTML" ? l = f : u == "value" ? p = f : u == "checked" ? m = f : a && typeof f != "function" || g[u] === f || Qn(t, u, f, g[u], r);
    if (l) a || d && (l.__html === d.__html || l.__html === t.innerHTML) || (t.innerHTML = l.__html), e.__k = [];
    else if (d && (t.innerHTML = ""), iu(e.type === "template" ? t.content : t, vo(h) ? h : [h], e, n, i, x == "foreignObject" ? "http://www.w3.org/1999/xhtml" : r, o, s, o ? o[0] : n.__k && Wt(n, 0), a, c), o != null) for (u = o.length; u--; ) mo(o[u]);
    a || (u = "value", x == "progress" && p == null ? t.removeAttribute("value") : p !== void 0 && (p !== t[u] || x == "progress" && !p || x == "option" && p !== g[u]) && Qn(t, u, p, g[u], r), u = "checked", m !== void 0 && m !== t[u] && Qn(t, u, m, g[u], r));
  }
  return t;
}
function xo(t, e, n) {
  try {
    if (typeof t == "function") {
      var i = typeof t.__u == "function";
      i && t.__u(), i && e == null || (t.__u = t(e));
    } else t.current = e;
  } catch (r) {
    z.__e(r, n);
  }
}
function su(t, e, n) {
  var i, r;
  if (z.unmount && z.unmount(t), (i = t.ref) && (i.current && i.current !== t.__e || xo(i, null, e)), (i = t.__c) != null) {
    if (i.componentWillUnmount) try {
      i.componentWillUnmount();
    } catch (o) {
      z.__e(o, e);
    }
    i.base = i.__P = null;
  }
  if (i = t.__k) for (r = 0; r < i.length; r++) i[r] && su(i[r], e, n || typeof t.type != "function");
  n || mo(t.__e), t.__c = t.__ = t.__e = void 0;
}
function zf(t, e, n) {
  return this.constructor(t, n);
}
function Hi(t, e, n) {
  var i, r, o, s;
  e == document && (e = document.documentElement), z.__ && z.__(t, e), r = (i = !1) ? null : e.__k, o = [], s = [], _o(e, t = e.__k = tu(Ni, null, [t]), r || xn, xn, e.namespaceURI, r ? null : e.firstChild ? Li.call(e.childNodes) : null, o, r ? r.__e : e.firstChild, i, s), ou(o, t, s);
}
Li = eu.slice, z = { __e: function(t, e, n, i) {
  for (var r, o, s; e = e.__; ) if ((r = e.__c) && !r.__) try {
    if ((o = r.constructor) && o.getDerivedStateFromError != null && (r.setState(o.getDerivedStateFromError(t)), s = r.__d), r.componentDidCatch != null && (r.componentDidCatch(t, i || {}), s = r.__d), s) return r.__E = r;
  } catch (a) {
    t = a;
  }
  throw t;
} }, Jc = 0, ti.prototype.setState = function(t, e) {
  var n;
  n = this.__s != null && this.__s !== this.state ? this.__s : this.__s = Ue({}, this.state), typeof t == "function" && (t = t(Ue({}, n), this.props)), t && Ue(n, t), t != null && this.__v && (e && this._sb.push(e), Qs(this));
}, ti.prototype.forceUpdate = function(t) {
  this.__v && (this.__e = !0, t && this.__h.push(t), Qs(this));
}, ti.prototype.render = Ni, it = [], Qc = typeof Promise == "function" ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, Yc = function(t, e) {
  return t.__v.__b - e.__v.__b;
}, fi.__r = 0, Zc = /(PointerCapture)$|Capture$/i, yo = 0, Sr = Zs(!1), Ar = Zs(!0);
var au = function(t, e, n, i) {
  var r;
  e[0] = 0;
  for (var o = 1; o < e.length; o++) {
    var s = e[o++], a = e[o] ? (e[0] |= s ? 1 : 2, n[e[o++]]) : e[++o];
    s === 3 ? i[0] = a : s === 4 ? i[1] = Object.assign(i[1] || {}, a) : s === 5 ? (i[1] = i[1] || {})[e[++o]] = a : s === 6 ? i[1][e[++o]] += a + "" : s ? (r = t.apply(a, au(t, a, n, ["", null])), i.push(r), a[0] ? e[0] |= 2 : (e[o - 2] = 0, e[o] = r)) : i.push(a);
  }
  return i;
}, ea = /* @__PURE__ */ new Map();
function Uf(t) {
  var e = ea.get(this);
  return e || (e = /* @__PURE__ */ new Map(), ea.set(this, e)), (e = au(this, e.get(t) || (e.set(t, e = function(n) {
    for (var i, r, o = 1, s = "", a = "", c = [0], u = function(h) {
      o === 1 && (h || (s = s.replace(/^\s*\n\s*|\s*\n\s*$/g, ""))) ? c.push(0, h, s) : o === 3 && (h || s) ? (c.push(3, h, s), o = 2) : o === 2 && s === "..." && h ? c.push(4, h, 0) : o === 2 && s && !h ? c.push(5, 0, !0, s) : o >= 5 && ((s || !h && o === 5) && (c.push(o, 0, s, r), o = 6), h && (c.push(o, h, 0, r), o = 6)), s = "";
    }, l = 0; l < n.length; l++) {
      l && (o === 1 && u(), u(l));
      for (var d = 0; d < n[l].length; d++) i = n[l][d], o === 1 ? i === "<" ? (u(), c = [c], o = 3) : s += i : o === 4 ? s === "--" && i === ">" ? (o = 1, s = "") : s = i + s[0] : a ? i === a ? a = "" : s += i : i === '"' || i === "'" ? a = i : i === ">" ? (u(), o = 1) : o && (i === "=" ? (o = 5, r = s, s = "") : i === "/" && (o < 5 || n[l][d + 1] === ">") ? (u(), o === 3 && (c = c[0]), o = c, (c = c[0]).push(2, 0, o), o = 0) : i === " " || i === "	" || i === `
` || i === "\r" ? (u(), o = 2) : s += i), o === 3 && s === "!--" && (o = 4, c = c[0]);
    }
    return u(), c;
  }(t)), e), arguments, [])).length > 1 ? e : e[0];
}
var W = Uf.bind(tu), zt, V, Xi, ta, bn = 0, cu = [], X = z, na = X.__b, ia = X.__r, ra = X.diffed, oa = X.__c, sa = X.unmount, aa = X.__;
function Bi(t, e) {
  X.__h && X.__h(V, t, bn || e), bn = 0;
  var n = V.__H || (V.__H = { __: [], __h: [] });
  return t >= n.__.length && n.__.push({}), n.__[t];
}
function yt(t) {
  return bn = 1, Ff(lu, t);
}
function Ff(t, e, n) {
  var i = Bi(zt++, 2);
  if (i.t = t, !i.__c && (i.__ = [lu(void 0, e), function(a) {
    var c = i.__N ? i.__N[0] : i.__[0], u = i.t(c, a);
    c !== u && (i.__N = [u, i.__[1]], i.__c.setState({}));
  }], i.__c = V, !V.__f)) {
    var r = function(a, c, u) {
      if (!i.__c.__H) return !0;
      var l = i.__c.__H.__.filter(function(h) {
        return !!h.__c;
      });
      if (l.every(function(h) {
        return !h.__N;
      })) return !o || o.call(this, a, c, u);
      var d = i.__c.props !== a;
      return l.forEach(function(h) {
        if (h.__N) {
          var f = h.__[0];
          h.__ = h.__N, h.__N = void 0, f !== h.__[0] && (d = !0);
        }
      }), o && o.call(this, a, c, u) || d;
    };
    V.__f = !0;
    var o = V.shouldComponentUpdate, s = V.componentWillUpdate;
    V.componentWillUpdate = function(a, c, u) {
      if (this.__e) {
        var l = o;
        o = void 0, r(a, c, u), o = l;
      }
      s && s.call(this, a, c, u);
    }, V.shouldComponentUpdate = r;
  }
  return i.__N || i.__;
}
function Cr(t, e) {
  var n = Bi(zt++, 3);
  !X.__s && bo(n.__H, e) && (n.__ = t, n.u = e, V.__H.__h.push(n));
}
function Or(t, e) {
  var n = Bi(zt++, 4);
  !X.__s && bo(n.__H, e) && (n.__ = t, n.u = e, V.__h.push(n));
}
function uu(t) {
  return bn = 5, Ut(function() {
    return { current: t };
  }, []);
}
function Ut(t, e) {
  var n = Bi(zt++, 7);
  return bo(n.__H, e) && (n.__ = t(), n.__H = e, n.__h = t), n.__;
}
function sn(t, e) {
  return bn = 8, Ut(function() {
    return t;
  }, e);
}
function Kf() {
  for (var t; t = cu.shift(); ) if (t.__P && t.__H) try {
    t.__H.__h.forEach(ni), t.__H.__h.forEach(Tr), t.__H.__h = [];
  } catch (e) {
    t.__H.__h = [], X.__e(e, t.__v);
  }
}
X.__b = function(t) {
  V = null, na && na(t);
}, X.__ = function(t, e) {
  t && e.__k && e.__k.__m && (t.__m = e.__k.__m), aa && aa(t, e);
}, X.__r = function(t) {
  ia && ia(t), zt = 0;
  var e = (V = t.__c).__H;
  e && (Xi === V ? (e.__h = [], V.__h = [], e.__.forEach(function(n) {
    n.__N && (n.__ = n.__N), n.u = n.__N = void 0;
  })) : (e.__h.forEach(ni), e.__h.forEach(Tr), e.__h = [], zt = 0)), Xi = V;
}, X.diffed = function(t) {
  ra && ra(t);
  var e = t.__c;
  e && e.__H && (e.__H.__h.length && (cu.push(e) !== 1 && ta === X.requestAnimationFrame || ((ta = X.requestAnimationFrame) || $f)(Kf)), e.__H.__.forEach(function(n) {
    n.u && (n.__H = n.u), n.u = void 0;
  })), Xi = V = null;
}, X.__c = function(t, e) {
  e.some(function(n) {
    try {
      n.__h.forEach(ni), n.__h = n.__h.filter(function(i) {
        return !i.__ || Tr(i);
      });
    } catch (i) {
      e.some(function(r) {
        r.__h && (r.__h = []);
      }), e = [], X.__e(i, n.__v);
    }
  }), oa && oa(t, e);
}, X.unmount = function(t) {
  sa && sa(t);
  var e, n = t.__c;
  n && n.__H && (n.__H.__.forEach(function(i) {
    try {
      ni(i);
    } catch (r) {
      e = r;
    }
  }), n.__H = void 0, e && X.__e(e, n.__v));
};
var ca = typeof requestAnimationFrame == "function";
function $f(t) {
  var e, n = function() {
    clearTimeout(i), ca && cancelAnimationFrame(e), setTimeout(t);
  }, i = setTimeout(n, 100);
  ca && (e = requestAnimationFrame(n));
}
function ni(t) {
  var e = V, n = t.__c;
  typeof n == "function" && (t.__c = void 0, n()), V = e;
}
function Tr(t) {
  var e = V;
  t.__c = t.__(), V = e;
}
function bo(t, e) {
  return !t || t.length !== e.length || e.some(function(n, i) {
    return n !== t[i];
  });
}
function lu(t, e) {
  return typeof e == "function" ? e(t) : e;
}
function du(t) {
  var e, n, i = "";
  if (typeof t == "string" || typeof t == "number") i += t;
  else if (typeof t == "object") if (Array.isArray(t)) {
    var r = t.length;
    for (e = 0; e < r; e++) t[e] && (n = du(t[e])) && (i && (i += " "), i += n);
  } else for (n in t) t[n] && (i && (i += " "), i += n);
  return i;
}
function pi() {
  for (var t, e, n = 0, i = "", r = arguments.length; n < r; n++) (t = arguments[n]) && (e = du(t)) && (i && (i += " "), i += e);
  return i;
}
function Vf(t) {
  const {
    headerEntries: e,
    onSelect: n,
    selectedEntry: i,
    setSelectedEntry: r,
    title: o
  } = t, s = Ut(() => Gf(e), [e]);
  return W`
    <div class="djs-popup-header">
      <h3 class="djs-popup-title" title=${o}>${o}</h3>
      ${s.map((a) => W`
        <ul key=${a.id} class="djs-popup-header-group" data-header-group=${a.id}>

          ${a.entries.map((c) => W`
            <li key=${c.id}>
              <${c.action ? "button" : "span"}
                class=${qf(c, c === i)}
                onClick=${(u) => c.action && n(u, c)}
                title=${c.title || c.label}
                data-id=${c.id}
                onMouseEnter=${() => c.action && r(c)}
                onMouseLeave=${() => c.action && r(null)}
                onFocus=${() => c.action && r(c)}
                onBlur=${() => c.action && r(null)}
              >
                ${c.imageUrl && W`<img class="djs-popup-entry-icon" src=${c.imageUrl} alt="" />` || c.imageHtml && W`<div class="djs-popup-entry-icon" dangerouslySetInnerHTML=${{ __html: c.imageHtml }} />`}
                ${c.label ? W`
                  <span class="djs-popup-label">${c.label}</span>
                ` : null}
              </${c.action ? "button" : "span"}>
            </li>
          `)}
        </ul>
      `)}
    </div>
  `;
}
function Gf(t) {
  return t.reduce((e, n) => {
    const i = n.group || "default", r = e.find((o) => o.id === i);
    return r ? r.entries.push(n) : e.push({
      id: i,
      entries: [n]
    }), e;
  }, []);
}
function qf(t, e) {
  return pi(
    "entry",
    t.className,
    t.active ? "active" : "",
    t.disabled ? "disabled" : "",
    e ? "selected" : ""
  );
}
function Xf(t) {
  const {
    entry: e,
    selected: n,
    onMouseEnter: i,
    onMouseLeave: r,
    onAction: o
  } = t;
  return W`
    <li
      class=${pi("entry", { selected: n })}
      data-id=${e.id}
      title=${e.title || e.label}
      tabIndex="0"
      onClick=${o}
      onFocus=${i}
      onBlur=${r}
      onMouseEnter=${i}
      onMouseLeave=${r}
      onDragStart=${(s) => o(s, e, "dragstart")}
      draggable=${!0}
    >
      <div class="djs-popup-entry-content">
        <span
          class=${pi("djs-popup-entry-name", e.className)}
        >
          ${e.imageUrl && W`<img class="djs-popup-entry-icon" src=${e.imageUrl} alt="" />` || e.imageHtml && W`<div class="djs-popup-entry-icon" dangerouslySetInnerHTML=${{ __html: e.imageHtml }} />`}

          ${e.label ? W`
            <span class="djs-popup-label">
              ${e.label}
            </span>
          ` : null}
        </span>
        ${e.description && W`
          <span
            class="djs-popup-entry-description"
            title=${e.description}
          >
            ${e.description}
          </span>
        `}
      </div>
      ${e.documentationRef && W`
        <div class="djs-popup-entry-docs">
          <a
            href="${e.documentationRef}"
            onClick=${(s) => s.stopPropagation()}
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
function Jf(t) {
  const {
    selectedEntry: e,
    setSelectedEntry: n,
    entries: i,
    ...r
  } = t, o = uu(), s = Ut(() => Qf(i), [i]);
  return Or(() => {
    const a = o.current;
    if (!a)
      return;
    const c = a.querySelector(".selected");
    c && Yf(c);
  }, [e]), W`
    <div class="djs-popup-results" ref=${o}>
      ${s.map((a) => W`
        ${a.name && W`
          <div key=${a.id} class="entry-header" title=${a.name}>
            ${a.name}
          </div>
        `}
        <ul class="djs-popup-group" data-group=${a.id}>
          ${a.entries.map((c) => W`
            <${Xf}
              key=${c.id}
              entry=${c}
              selected=${c === e}
              onMouseEnter=${() => n(c)}
              onMouseLeave=${() => n(null)}
              ...${r}
            />
          `)}
        </ul>
      `)}
    </div>
  `;
}
function Qf(t) {
  const e = [], n = (o) => e.find((s) => o.id === s.id), i = (o) => !!n(o), r = (o) => typeof o == "string" ? { id: o } : o;
  return t.forEach((o) => {
    const s = o.group ? r(o.group) : { id: "default" };
    i(s) ? n(s).entries.push(o) : e.push({ ...s, entries: [o] });
  }), e;
}
function Yf(t) {
  typeof t.scrollIntoViewIfNeeded == "function" ? t.scrollIntoViewIfNeeded() : t.scrollIntoView({
    scrollMode: "if-needed",
    block: "nearest"
  });
}
function Zf(t) {
  const {
    onClose: e,
    onSelect: n,
    className: i,
    headerEntries: r,
    position: o,
    title: s,
    width: a,
    scale: c,
    search: u,
    emptyPlaceholder: l,
    searchFn: d,
    entries: h,
    onOpened: f,
    onClosed: p
  } = t, m = Ut(() => ge(u) ? h.length > 5 : !1, [u, h]), [g, E] = yt(""), x = sn((P, J) => {
    if (!m)
      return P;
    if (!J.trim())
      return P.filter(({ rank: Ye = 0 }) => Ye >= 0);
    const Ae = P.filter(({ searchable: Ye }) => Ye !== !1);
    return d(Ae, J, {
      keys: [
        "label",
        "description",
        "search"
      ]
    }).map(({ item: Ye }) => Ye);
  }, [m]), [y, v] = yt(x(h, g)), [_, w] = yt(y[0]), R = sn((P) => {
    (!_ || !P.includes(_)) && w(P[0]), v(P);
  }, [_, v, w]);
  Cr(() => {
    R(x(h, g));
  }, [g, h]);
  const b = sn((P) => {
    let Ae = y.indexOf(_) + P;
    Ae < 0 && (Ae = y.length - 1), Ae >= y.length && (Ae = 0), w(y[Ae]);
  }, [y, _, w]), C = sn((P) => {
    if (P.key === "Enter" && _)
      return n(P, _);
    if (P.key === "ArrowUp")
      return b(-1), P.preventDefault();
    if (P.key === "ArrowDown")
      return b(1), P.preventDefault();
  }, [n, _, b]), O = sn((P) => {
    Ta(P.target, "input") && E(() => P.target.value);
  }, [E]);
  Cr(() => (f(), () => {
    p();
  }), []);
  const M = Ut(() => s || r.length > 0, [s, r]);
  return W`
    <${ua}
      onClose=${e}
      onKeyup=${O}
      onKeydown=${C}
      className=${i}
      position=${o}
      width=${a}
      scale=${c}
    >
      ${M && W`
        <${Vf}
          headerEntries=${r}
          onSelect=${n}
          selectedEntry=${_}
          setSelectedEntry=${w}
          title=${s}
        />
      `}
      ${h.length > 0 && W`
        <div class="djs-popup-body">

          ${m && W`
          <div class="djs-popup-search">
            <svg class="djs-popup-search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M9.0325 8.5H9.625L13.3675 12.25L12.25 13.3675L8.5 9.625V9.0325L8.2975 8.8225C7.4425 9.5575 6.3325 10 5.125 10C2.4325 10 0.25 7.8175 0.25 5.125C0.25 2.4325 2.4325 0.25 5.125 0.25C7.8175 0.25 10 2.4325 10 5.125C10 6.3325 9.5575 7.4425 8.8225 8.2975L9.0325 8.5ZM1.75 5.125C1.75 6.9925 3.2575 8.5 5.125 8.5C6.9925 8.5 8.5 6.9925 8.5 5.125C8.5 3.2575 6.9925 1.75 5.125 1.75C3.2575 1.75 1.75 3.2575 1.75 5.125Z" fill="#22242A"/>
            </svg>
            <input type="text" spellcheck=${!1} aria-label="${s}" />
          </div>
          `}

          <${Jf}
            entries=${y}
            selectedEntry=${_}
            setSelectedEntry=${w}
            onAction=${n}
          />
        </div>
      `}
    ${l && y.length === 0 && W`
      <div class="djs-popup-no-results">${Z(l) ? l(g) : l}</div>
    `}
    </${ua}>
  `;
}
function ua(t) {
  const {
    onClose: e,
    onKeydown: n,
    onKeyup: i,
    className: r,
    children: o,
    position: s
  } = t, a = uu();
  return Or(() => {
    if (typeof s != "function")
      return;
    const c = a.current, u = s(c);
    c.style.left = `${u.x}px`, c.style.top = `${u.y}px`;
  }, [a.current, s]), Or(() => {
    const c = a.current;
    if (!c)
      return;
    (c.querySelector("input") || c).focus();
  }, []), Cr(() => {
    const c = (l) => {
      if (l.key === "Escape")
        return l.preventDefault(), e();
    }, u = (l) => {
      if (!wn(l.target, ".djs-popup", !0))
        return e();
    };
    return document.documentElement.addEventListener("keydown", c), document.body.addEventListener("click", u), () => {
      document.documentElement.removeEventListener("keydown", c), document.body.removeEventListener("click", u);
    };
  }, []), W`
    <div
      class=${pi("djs-popup", r)}
      style=${ep(t)}
      onKeydown=${n}
      onKeyup=${i}
      ref=${a}
      tabIndex="-1"
    >
      ${o}
    </div>
  `;
}
function ep(t) {
  return {
    transform: `scale(${t.scale})`,
    width: `${t.width}px`,
    "transform-origin": "top left"
  };
}
var tp = "data-id", hu = [
  "contextPad.close",
  "canvas.viewbox.changing",
  "commandStack.changed"
], np = 1e3;
function F(t, e, n, i) {
  this._eventBus = e, this._canvas = n, this._search = i, this._current = null;
  var r = ge(t && t.scale) ? t.scale : {
    min: 1,
    max: 1
  };
  this._config = {
    scale: r
  }, e.on("diagram.destroy", () => {
    this.close();
  }), e.on("element.changed", (o) => {
    const s = this.isOpen() && this._current.target;
    o.element === s && this.refresh();
  });
}
F.$inject = [
  "config.popupMenu",
  "eventBus",
  "canvas",
  "search"
];
F.prototype._render = function() {
  const {
    position: t,
    providerId: e,
    entries: n,
    headerEntries: i,
    emptyPlaceholder: r,
    options: o
  } = this._current, s = Object.entries(n).map(
    ([h, f]) => ({ id: h, ...f })
  ), a = Object.entries(i).map(
    ([h, f]) => ({ id: h, ...f })
  ), c = t && ((h) => this._ensureVisible(h, t)), u = this._updateScale(this._current.container);
  Hi(
    W`
      <${Zf}
        onClose=${(h) => this.close(h)}
        onSelect=${(h, f, p) => this.trigger(h, f, p)}
        position=${c}
        className=${e}
        entries=${s}
        headerEntries=${a}
        emptyPlaceholder=${r}
        scale=${u}
        onOpened=${this._onOpened.bind(this)}
        onClosed=${this._onClosed.bind(this)}
        searchFn=${this._search}
        ...${{ ...o }}
      />
    `,
    this._current.container
  );
};
F.prototype.open = function(t, e, n, i) {
  if (!t)
    throw new Error("target is missing");
  if (!e)
    throw new Error("providers for <" + e + "> not found");
  if (!n)
    throw new Error("position is missing");
  this.isOpen() && this.close();
  const {
    entries: r,
    headerEntries: o,
    emptyPlaceholder: s
  } = this._getContext(t, e);
  this._current = {
    position: n,
    providerId: e,
    target: t,
    entries: r,
    headerEntries: o,
    emptyPlaceholder: s,
    container: this._createContainer({ provider: e }),
    options: i
  }, this._emit("open"), this._bindAutoClose(), this._render();
};
F.prototype.refresh = function() {
  if (!this.isOpen())
    return;
  const {
    target: t,
    providerId: e
  } = this._current, {
    entries: n,
    headerEntries: i,
    emptyPlaceholder: r
  } = this._getContext(t, e);
  this._current = {
    ...this._current,
    entries: n,
    headerEntries: i,
    emptyPlaceholder: r
  }, this._emit("refresh"), this._render();
};
F.prototype._getContext = function(t, e) {
  const n = this._getProviders(e);
  if (!n || !n.length)
    throw new Error("provider for <" + e + "> not found");
  const i = this._getEntries(t, n), r = this._getHeaderEntries(t, n), o = this._getEmptyPlaceholder(n);
  return {
    entries: i,
    headerEntries: r,
    emptyPlaceholder: o,
    empty: !(Object.keys(i).length || Object.keys(r).length)
  };
};
F.prototype.close = function() {
  this.isOpen() && (this._emit("close"), this.reset(), this._canvas.restoreFocus(), this._current = null);
};
F.prototype.reset = function() {
  const t = this._current.container;
  Hi(null, t), Tu(t);
};
F.prototype._emit = function(t, e) {
  this._eventBus.fire(`popupMenu.${t}`, e);
};
F.prototype._onOpened = function() {
  this._emit("opened");
};
F.prototype._onClosed = function() {
  this._emit("closed");
};
F.prototype._createContainer = function(t) {
  var e = this._canvas, n = e.getContainer();
  const i = be(`<div class="djs-popup-parent djs-scrollable" data-popup=${t.provider}></div>`);
  return n.appendChild(i), i;
};
F.prototype._bindAutoClose = function() {
  this._eventBus.once(hu, this.close, this);
};
F.prototype._unbindAutoClose = function() {
  this._eventBus.off(hu, this.close, this);
};
F.prototype._updateScale = function() {
  var t = this._canvas.zoom(), e = this._config.scale, n, i, r = t;
  return e !== !0 && (e === !1 ? (n = 1, i = 1) : (n = e.min, i = e.max), ge(n) && t < n && (r = n), ge(i) && t > i && (r = i)), r;
};
F.prototype._ensureVisible = function(t, e) {
  var n = document.documentElement.getBoundingClientRect(), i = t.getBoundingClientRect(), r = {}, o = e.x, s = e.y;
  return e.x + i.width > n.width && (r.x = !0), e.y + i.height > n.height && (r.y = !0), r.x && r.y ? (o = e.x - i.width, s = e.y - i.height) : r.x ? (o = e.x - i.width, s = e.y) : r.y && e.y < i.height ? (o = e.x, s = 10) : r.y && (o = e.x, s = e.y - i.height), e.y < n.top && (s = e.y + i.height), {
    x: o,
    y: s
  };
};
F.prototype.isEmpty = function(t, e) {
  if (!t)
    throw new Error("target is missing");
  if (!e)
    throw new Error("provider ID is missing");
  const n = this._getProviders(e);
  return !n || !n.length ? !0 : this._getContext(t, e).empty;
};
F.prototype.registerProvider = function(t, e, n) {
  n || (n = e, e = np), this._eventBus.on("popupMenu.getProviders." + t, e, function(i) {
    i.providers.push(n);
  });
};
F.prototype._getProviders = function(t) {
  var e = this._eventBus.createEvent({
    type: "popupMenu.getProviders." + t,
    providers: []
  });
  return this._eventBus.fire(e), e.providers;
};
F.prototype._getEntries = function(t, e) {
  var n = {};
  return A(e, function(i) {
    if (!i.getPopupMenuEntries) {
      A(i.getEntries(t), function(o) {
        var s = o.id;
        if (!s)
          throw new Error("entry ID is missing");
        n[s] = Fe(o, ["id"]);
      });
      return;
    }
    var r = i.getPopupMenuEntries(t);
    Z(r) ? n = r(n) : A(r, function(o, s) {
      n[s] = o;
    });
  }), n;
};
F.prototype._getHeaderEntries = function(t, e) {
  var n = {};
  return A(e, function(i) {
    if (!i.getPopupMenuHeaderEntries) {
      if (!i.getHeaderEntries)
        return;
      A(i.getHeaderEntries(t), function(o) {
        var s = o.id;
        if (!s)
          throw new Error("entry ID is missing");
        n[s] = Fe(o, ["id"]);
      });
      return;
    }
    var r = i.getPopupMenuHeaderEntries(t);
    Z(r) ? n = r(n) : A(r, function(o, s) {
      n[s] = o;
    });
  }), n;
};
F.prototype._getEmptyPlaceholder = function(t) {
  const e = t.find(
    (n) => Z(n.getEmptyPlaceholder)
  );
  return e && e.getEmptyPlaceholder();
};
F.prototype.isOpen = function() {
  return !!this._current;
};
F.prototype.trigger = function(t, e, n = "click") {
  if (t.preventDefault(), !e) {
    let r = wn(t.delegateTarget || t.target, ".entry", !0), o = ye(r, tp);
    e = { id: o, ...this._getEntry(o) };
  }
  const i = e.action;
  if (this._emit("trigger", { entry: e, event: t }) !== !1) {
    if (Z(i)) {
      if (n === "click")
        return i(t, e);
    } else if (i[n])
      return i[n](t, e);
  }
};
F.prototype._getEntry = function(t) {
  var e = this._current.entries[t] || this._current.headerEntries[t];
  if (!e)
    throw new Error("entry not found");
  return e;
};
function ip(t, e, n) {
  const {
    keys: i
  } = n;
  if (e = e.trim().toLowerCase(), !e)
    throw new Error("<pattern> must not be empty");
  const r = e.trim().toLowerCase().split(/\s+/);
  return t.flatMap((o) => {
    const s = rp(o, r, i);
    return s ? {
      item: o,
      tokens: s
    } : [];
  }).sort(op(i));
}
function rp(t, e, n) {
  const {
    matchedWords: i,
    tokens: r
  } = n.reduce((o, s) => {
    const a = t[s], {
      tokens: c,
      matchedWords: u
    } = up(a, e);
    return {
      tokens: {
        ...o.tokens,
        [s]: c
      },
      matchedWords: {
        ...o.matchedWords,
        ...u
      }
    };
  }, {
    matchedWords: {},
    tokens: {}
  });
  return Object.keys(i).length !== e.length ? null : r;
}
function op(t) {
  return (e, n) => {
    for (const i of t) {
      const r = sp(
        e.tokens[i],
        n.tokens[i]
      );
      if (r !== 0)
        return r;
      const o = cp(
        e.item[i],
        n.item[i]
      );
      if (o !== 0)
        return o;
    }
    return 0;
  };
}
function sp(t, e) {
  return la(e) - la(t);
}
function la(t) {
  return t.reduce((e, n) => e + ap(n), 0);
}
function ap(t) {
  const e = Math.log(t.value.length);
  return t.match ? (t.start ? t.end ? 131.9 : 7.87 : t.wordStart ? 2.19 : 1) * e : -0.07 * e;
}
function cp(t = "", e = "") {
  return t.localeCompare(e);
}
function up(t, e) {
  if (!t)
    return {
      tokens: [],
      matchedWords: {}
    };
  const n = [], i = {}, r = e.map(lp), o = [
    `(?<all>${r.join("\\s+")})`,
    ...r
  ].join("|"), s = new RegExp(o, "ig");
  let a, c = 0;
  for (; a = s.exec(t); ) {
    const [u] = a, l = a.index, d = a.index + u.length, h = l === 0, f = d === t.length, p = !!a.groups.all, m = h || /\s/.test(t.charAt(l - 1)), g = f || /\s/.test(t.charAt(d + 1));
    a.index > c && n.push({
      value: t.slice(c, a.index),
      index: c
    }), n.push({
      value: u,
      index: a.index,
      match: !0,
      wordStart: m,
      wordEnd: g,
      start: h,
      end: f,
      all: p
    });
    const E = p ? e : [u];
    for (const x of E)
      i[x.toLowerCase()] = !0;
    c = a.index + u.length;
  }
  return c < t.length && n.push({
    value: t.slice(c),
    index: c
  }), {
    tokens: n,
    matchedWords: i
  };
}
function lp(t) {
  return t.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
}
const dp = {
  search: ["value", ip]
}, hp = {
  __depends__: [dp],
  __init__: ["popupMenu"],
  popupMenu: ["type", F]
};
function fp(t, e) {
  return e = e || {}, t.replace(/{([^}]+)}/g, function(n, i) {
    return e[i] || "{" + i + "}";
  });
}
const pp = {
  translate: ["value", fp]
}, gp = new Qr();
function Yt(t) {
  this._scheduled = {}, t.on("diagram.destroy", () => {
    Object.keys(this._scheduled).forEach((e) => {
      this.cancel(e);
    });
  });
}
Yt.$inject = ["eventBus"];
Yt.prototype.schedule = function(t, e = gp.next()) {
  this.cancel(e);
  const n = this._schedule(t, e);
  return this._scheduled[e] = n, n.promise;
};
Yt.prototype._schedule = function(t, e) {
  const n = yp();
  return {
    executionId: setTimeout(() => {
      try {
        this._scheduled[e] = null;
        try {
          n.resolve(t());
        } catch (r) {
          n.reject(r);
        }
      } catch (r) {
        console.error("Scheduler#_schedule execution failed", r);
      }
    }),
    promise: n.promise
  };
};
Yt.prototype.cancel = function(t) {
  const e = this._scheduled[t];
  e && (this._cancel(e), this._scheduled[t] = null);
};
Yt.prototype._cancel = function(t) {
  clearTimeout(t.executionId);
};
function yp() {
  const t = {};
  return t.promise = new Promise((e, n) => {
    t.resolve = e, t.reject = n;
  }), t;
}
const vp = {
  scheduler: ["type", Yt]
};
var Ct;
let mp = (Ct = class {
  constructor(e, n) {
    this.domainStoryReplace = e, this.domainStoryReplaceOption = n;
  }
  getPopupMenuEntries(e) {
    return this.getEntries(e);
  }
  /**
   * Get all entries from replaceOptions for the given element and apply filters
   * on them. Get, for example, only elements, which are different from the current one.
   * @return a list of menu entry items
   */
  getEntries(e) {
    const n = e;
    let i = [];
    return n.type.includes(S.ACTOR) ? i = this.domainStoryReplaceOption.actorReplaceOptions(n.type) : n.type.includes(S.WORKOBJECT) && (i = this.domainStoryReplaceOption.workObjectReplaceOptions(n.type)), this.createEntries(n, i);
  }
  /**
   * Creates an array of menu entry objects for a given element and filters the replaceOptions
   * according to a filter function.
   * @return a list of menu items
   */
  createEntries(e, n) {
    const i = {};
    return A(n, (r) => {
      i[r.actionName] = this.createMenuEntry(
        r,
        e
      );
    }), i;
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
  createMenuEntry(e, n, i) {
    return i = i || (() => this.domainStoryReplace.replaceElement(n, e.target)), {
      label: e.label,
      className: e.className,
      // id: definition.actionName,
      action: i
    };
  }
}, Ct.$inject = ["domainStoryReplace", "domainStoryReplaceOption"], Ct);
const Co = class Co {
  constructor(e) {
    this.modeling = e;
  }
  /**
   * @param oldShape - element to be replaced
   * @param newShapeData - containing information about the new Element, for example height, width, type.
   */
  replaceElement(e, n) {
    const i = this.setCenterOfElement(n, e), r = i.outgoing, o = i.incoming;
    return r.forEach((s) => {
      s.businessObject.source = i.id;
    }), o.forEach((s) => {
      s.businessObject.target = i.id;
    }), i;
  }
  setCenterOfElement(e, n) {
    return e.x = Math.ceil(
      n.x + (e.width || n.width) / 2
    ), e.y = Math.ceil(
      n.y + (e.height || n.height) / 2
    ), T(e, { name: n.businessObject.name }), this.modeling.replaceShape(n, e, {});
  }
};
Co.$inject = ["modeling"];
let Rr = Co;
const Oo = class Oo {
  constructor(e) {
    this.iconDictionaryService = e;
  }
  actorReplaceOptions(e) {
    const n = this.iconDictionaryService.getIconsAssignedAs(S.ACTOR), i = [];
    return n.keysArray().forEach((r, o) => {
      if (!e.includes(r)) {
        const s = r;
        i[o] = {
          label: "Change to " + s,
          actionName: "replace-with-actor-" + s.toLowerCase(),
          className: this.iconDictionaryService.getCSSClassOfIcon(r),
          target: {
            type: `${S.ACTOR}${r}`
          }
        };
      }
    }), i;
  }
  workObjectReplaceOptions(e) {
    const n = this.iconDictionaryService.getIconsAssignedAs(
      S.WORKOBJECT
    ), i = [];
    return n.keysArray().forEach((r, o) => {
      if (!e.includes(r)) {
        const s = r;
        i[o] = {
          label: "Change to " + s,
          actionName: "replace-with-actor-" + s,
          className: this.iconDictionaryService.getCSSClassOfIcon(r),
          target: {
            type: `${S.WORKOBJECT}${r}`
          }
        };
      }
    }), i;
  }
};
Oo.$inject = ["domainStoryIconDictionaryService"];
let kr = Oo;
const _p = {
  __depends__: [Qt, Xt],
  __init__: ["domainStoryReplaceMenuProvider", "domainStoryReplace"],
  domainStoryReplace: ["type", Rr],
  domainStoryReplaceOption: ["type", kr],
  domainStoryReplaceMenuProvider: ["type", mp]
};
function xp(t) {
  if (fu(t))
    return t;
  const [e, n, i, r] = t.match(/\d+(\.\d+)?/g).map((u) => +u), o = e.toString(16).padStart(2, "0"), s = n.toString(16).padStart(2, "0"), a = i.toString(16).padStart(2, "0"), c = Math.round(r * 255).toString(16).padStart(2, "0");
  return `#${o}${s}${a}${c}`;
}
const fu = (t) => /^#([A-Fa-f0-9]{3,4}){1,2}$/.test(t), bp = (t, e) => t.match(new RegExp(`.{${e}}`, "g")) ?? [], Ep = (t) => parseInt(t.repeat(2 / t.length), 16), wp = (t) => typeof t < "u" ? Math.round((t / 255 + Number.EPSILON) * 100) / 100 : 1, da = (t) => (t == null ? void 0 : t.startsWith("#")) && ((t == null ? void 0 : t.length) === 5 || (t == null ? void 0 : t.length) === 9), Sp = (t) => {
  if (!fu(t))
    throw new Error("Invalid HEX");
  const e = Math.floor((t.length - 1) / 3), n = bp(t.slice(1), e), [i, r, o, s] = n.map(Ep);
  return `rgba(${i},${r},${o},${wp(s)})`;
};
var Ot;
let Ap = (Ot = class {
  constructor(e, n, i, r, o, s, a, c, u, l, d, h, f, p, m) {
    this.elementFactory = e, this.modeling = n, this.numberingRegistry = r, this.dirtyFlagService = o, this.iconDictionaryService = s, this.rules = a, this.connect = c, this.translate = u, this.create = l, this.canvas = d, this.contextPad = h, this.popupMenu = f, this.commandStack = p, h.registerProvider(this), f.registerProvider("ds-replace", i), m.on("create.end", (g) => {
      const E = g.context, x = E.shape;
      if (!ii(g) || !h.isOpen(x))
        return;
      const y = h.getEntries(x);
      y.replace && y.replace.action.click(g, x);
    }), document.addEventListener("pickedColor", (g) => {
      this.selectedElement && this.executeCommandStack(g);
    });
  }
  getContextPadEntries(e) {
    this.selectedElement = e;
    let n = this.selectedElement.businessObject.pickedColor;
    da(n) && (n = Sp(n)), document.dispatchEvent(
      new CustomEvent("defaultColor", {
        detail: {
          color: n ?? "#000000"
        }
      })
    );
    let i = /* @__PURE__ */ new Map();
    return e.type.includes(S.WORKOBJECT) ? (i.set(...this.addDelete([e])), i.set(...this.addColorChange()), i.set(...this.addConnectWithActivity()), i.set(...this.addTextAnnotation()), i = new Map([...i, ...this.addActors()]), i = new Map([...i, ...this.addWorkObjects()]), i.set(...this.addChangeWorkObjectTypeMenu())) : e.type.includes(S.ACTOR) ? (i.set(...this.addDelete([e])), i.set(...this.addColorChange()), i.set(...this.addConnectWithActivity()), i.set(...this.addTextAnnotation()), i = new Map([...i, ...this.addWorkObjects()]), i.set(...this.addChangeActorTypeMenu())) : e.type.includes(S.GROUP) ? (i.set(...this.addDeleteGroupWithoutChildren()), i.set(...this.addTextAnnotation()), i.set(...this.addColorChange())) : e.type.includes(S.ACTIVITY) ? (i.set(...this.addDelete([e])), i.set(...this.addChangeDirection()), i.set(...this.addColorChange())) : e.type.includes(S.TEXTANNOTATION) ? (i.set(...this.addDelete([e])), i.set(...this.addColorChange())) : e.type.includes(S.CONNECTION) && i.set(...this.addDelete([e])), Object.fromEntries(i);
  }
  getMultiElementContextPadEntries(e) {
    const n = /* @__PURE__ */ new Map();
    return n.set(...this.addDelete(e)), Object.fromEntries(n);
  }
  executeCommandStack(e) {
    const n = this.getSelectedBusinessObject(e);
    this.commandStack.execute("element.colorChange", n), this.dirtyFlagService.makeDirty();
  }
  getSelectedBusinessObject(e) {
    var r, o;
    const n = (r = this.selectedElement) == null ? void 0 : r.businessObject.pickedColor;
    let i = e.detail.color;
    return da(n) && (i = xp(i)), {
      businessObject: (o = this.selectedElement) == null ? void 0 : o.businessObject,
      newColor: i,
      element: this.selectedElement
    };
  }
  startConnect() {
    return (e, n, i) => this.connect.start(e, n, void 0, i);
  }
  addDelete(e) {
    let n = this.rules.allowed("elements.delete", {
      elements: { element: e }
    });
    if (L(n) && (n = n[0] === e), n)
      return [
        "delete",
        {
          group: "edit",
          className: "bpmn-icon-trash",
          title: this.translate("Remove"),
          action: {
            click: (i, r) => {
              if (L(r)) {
                const o = r.filter(
                  (a) => a.type.includes(S.GROUP)
                ), s = r.filter(
                  (a) => !a.type.includes(S.GROUP)
                );
                o.forEach(
                  (a) => this.modeling.removeGroup(a)
                ), this.modeling.removeElements(s.slice());
              } else
                this.modeling.removeElements([r]);
              this.dirtyFlagService.makeDirty();
            }
          }
        }
      ];
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
          click: (e, n) => {
            this.modeling.removeGroup(n), this.dirtyFlagService.makeDirty();
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
          click: (e, n) => {
            this.changeDirection(n), this.dirtyFlagService.makeDirty();
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
          click: (e, n) => {
            const i = T(this.getReplaceMenuPosition(n), {
              cursor: { x: e.x, y: e.y }
            });
            this.popupMenu.open(n, "ds-replace", i);
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
        S.TEXTANNOTATION,
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
    const e = this.iconDictionaryService.getIconsAssignedAs(
      S.WORKOBJECT
    ), n = /* @__PURE__ */ new Map();
    return e.keysArray().forEach((i) => {
      const r = i, o = this.iconDictionaryService.getCSSClassOfIcon(i);
      n.set(
        "append.workObject" + r,
        this.appendAction(
          `${S.WORKOBJECT}${i}`,
          o,
          r,
          "workObjects"
        )
      );
    }), n;
  }
  addActors() {
    const e = this.iconDictionaryService.getIconsAssignedAs(S.ACTOR), n = /* @__PURE__ */ new Map();
    return e.keysArray().forEach((i) => {
      const r = i, o = this.iconDictionaryService.getCSSClassOfIcon(i);
      n.set(
        "append.actor" + r,
        this.appendAction(
          `${S.ACTOR}${i}`,
          o,
          r,
          "actors"
        )
      );
    }), n;
  }
  addChangeWorkObjectTypeMenu() {
    return [
      "replace",
      {
        group: "edit",
        className: "bpmn-icon-screw-wrench",
        title: this.translate("Change type"),
        action: {
          click: (e, n) => {
            const i = T(this.getReplaceMenuPosition(n), {
              cursor: { x: e.x, y: e.y }
            });
            this.popupMenu.open(n, "ds-replace", i);
          }
        }
      }
    ];
  }
  changeDirection(e) {
    const n = e.businessObject, i = e.source;
    let r;
    i && i.type.includes(S.ACTOR) ? r = 0 : r = this.numberingRegistry.generateAutomaticNumber(e);
    const o = {
      businessObject: n,
      newNumber: r,
      element: e
    };
    this.commandStack.execute("activity.directionChange", o);
  }
  getReplaceMenuPosition(e) {
    const i = this.canvas.getContainer(), r = this.contextPad.getPad(e).html, o = i.getBoundingClientRect(), s = r.getBoundingClientRect(), a = s.top - o.top;
    return {
      x: s.left - o.left,
      y: a + s.height + 5
    };
  }
  appendAction(e, n, i, r, o) {
    typeof i != "string" && (o = i, i = this.translate("{type}", {
      type: e.replace(/^domainStory:/, "")
    }));
    const s = (a, c) => {
      const u = this.elementFactory.createShape(
        T({ type: e }, o)
      ), l = {
        elements: [u],
        hints: {},
        source: c
      };
      this.create.start(a, u, l);
    };
    return {
      group: r,
      className: n,
      title: "Append " + i,
      action: {
        dragstart: this.startConnect(),
        click: s
      }
    };
  }
}, Ot.$inject = [
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
], Ot);
var Cp = "djs-element-hidden", Yn = ".entry", Op = 1e3, ha = 8, Tp = 300;
function q(t, e, n, i) {
  this._canvas = t, this._elementRegistry = e, this._eventBus = n, this._scheduler = i, this._current = null, this._init();
}
q.$inject = [
  "canvas",
  "elementRegistry",
  "eventBus",
  "scheduler"
];
q.prototype._init = function() {
  var t = this;
  this._eventBus.on("selection.changed", function(e) {
    var n = e.newSelection, i = n.length ? n.length === 1 ? n[0] : n : null;
    i ? t.open(i, !0) : t.close();
  }), this._eventBus.on("elements.changed", function(e) {
    var n = e.elements, i = t._current;
    if (i) {
      var r = i.target, o = L(r) ? r : [r], s = o.filter(function(c) {
        return n.includes(c);
      });
      if (s.length) {
        t.close();
        var a = o.filter(function(c) {
          return t._elementRegistry.get(c.id);
        });
        a.length && t._updateAndOpen(a.length > 1 ? a : a[0]);
      }
    }
  }), this._eventBus.on("canvas.viewbox.changed", function() {
    t._updatePosition();
  }), this._eventBus.on("element.marker.update", function(e) {
    if (t.isOpen()) {
      var n = e.element, i = t._current, r = L(i.target) ? i.target : [i.target];
      r.includes(n) && t._updateVisibility();
    }
  }), this._container = this._createContainer();
};
q.prototype._createContainer = function() {
  var t = be('<div class="djs-context-pad-parent"></div>');
  return this._canvas.getContainer().appendChild(t), t;
};
q.prototype.registerProvider = function(t, e) {
  e || (e = t, t = Op), this._eventBus.on("contextPad.getProviders", t, function(n) {
    n.providers.push(e);
  });
};
q.prototype.getEntries = function(t) {
  var e = this._getProviders(), n = L(t) ? "getMultiElementContextPadEntries" : "getContextPadEntries", i = {};
  return A(e, function(r) {
    if (Z(r[n])) {
      var o = r[n](t);
      Z(o) ? i = o(i) : A(o, function(s, a) {
        i[a] = s;
      });
    }
  }), i;
};
q.prototype.trigger = function(t, e, n) {
  var i = this, r, o, s = e.delegateTarget || e.target;
  if (!s)
    return e.preventDefault();
  if (r = ye(s, "data-action"), o = e.originalEvent || e, t === "mouseover") {
    this._timeout = setTimeout(function() {
      i._mouseout = i.triggerEntry(r, "hover", o, n);
    }, Tp);
    return;
  } else if (t === "mouseout") {
    clearTimeout(this._timeout), this._mouseout && (this._mouseout(), this._mouseout = null);
    return;
  }
  return this.triggerEntry(r, t, o, n);
};
q.prototype.triggerEntry = function(t, e, n, i) {
  if (this.isShown()) {
    var r = this._current.target, o = this._current.entries, s = o[t];
    if (s) {
      var a = s.action;
      if (this._eventBus.fire("contextPad.trigger", { entry: s, event: n }) !== !1) {
        if (Z(a)) {
          if (e === "click")
            return a(n, r, i);
        } else if (a[e])
          return a[e](n, r, i);
        n.preventDefault();
      }
    }
  }
};
q.prototype.open = function(t, e) {
  !e && this.isOpen(t) || (this.close(), this._updateAndOpen(t));
};
q.prototype._getProviders = function() {
  var t = this._eventBus.createEvent({
    type: "contextPad.getProviders",
    providers: []
  });
  return this._eventBus.fire(t), t.providers;
};
q.prototype._updateAndOpen = function(t) {
  var e = this.getEntries(t), n = this._createHtml(t), i;
  A(e, function(r, o) {
    var s = r.group || "default", a = be(r.html || '<div class="entry" draggable="true"></div>'), c;
    ye(a, "data-action", o), c = ee("[data-group=" + Zr(s) + "]", n), c || (c = be('<div class="group"></div>'), ye(c, "data-group", s), n.appendChild(c)), c.appendChild(a), r.className && Rp(a, r.className), r.title && ye(a, "title", r.title), r.imageUrl && (i = be("<img>"), ye(i, "src", r.imageUrl), i.style.width = "100%", i.style.height = "100%", a.appendChild(i));
  }), fe(n).add("open"), this._current = {
    entries: e,
    html: n,
    target: t
  }, this._updatePosition(), this._updateVisibility(), this._eventBus.fire("contextPad.open", { current: this._current });
};
q.prototype._createHtml = function(t) {
  var e = this, n = be('<div class="djs-context-pad"></div>');
  return We.bind(n, Yn, "click", function(i) {
    e.trigger("click", i);
  }), We.bind(n, Yn, "dragstart", function(i) {
    e.trigger("dragstart", i);
  }), We.bind(n, Yn, "mouseover", function(i) {
    e.trigger("mouseover", i);
  }), We.bind(n, Yn, "mouseout", function(i) {
    e.trigger("mouseout", i);
  }), N.bind(n, "mousedown", function(i) {
    i.stopPropagation();
  }), this._container.appendChild(n), this._eventBus.fire("contextPad.create", {
    target: t,
    pad: n
  }), n;
};
q.prototype.getPad = function(t) {
  console.warn(new Error("ContextPad#getPad is deprecated and will be removed in future library versions, cf. https://github.com/bpmn-io/diagram-js/pull/888"));
  let e;
  return this.isOpen() && Pp(this._current.target, t) ? e = this._current.html : e = this._createHtml(t), { html: e };
};
q.prototype.close = function() {
  this.isOpen() && (clearTimeout(this._timeout), this._container.innerHTML = "", this._eventBus.fire("contextPad.close", { current: this._current }), this._current = null);
};
q.prototype.isOpen = function(t) {
  var e = this._current;
  if (!e)
    return !1;
  if (!t)
    return !0;
  var n = e.target;
  return L(t) !== L(n) ? !1 : L(t) ? t.length === n.length && vi(t, function(i) {
    return n.includes(i);
  }) : n === t;
};
q.prototype.isShown = function() {
  return this.isOpen() && fe(this._current.html).has("open");
};
q.prototype.show = function() {
  this.isOpen() && (fe(this._current.html).add("open"), this._updatePosition(), this._eventBus.fire("contextPad.show", { current: this._current }));
};
q.prototype.hide = function() {
  this.isOpen() && (fe(this._current.html).remove("open"), this._eventBus.fire("contextPad.hide", { current: this._current }));
};
q.prototype._getPosition = function(t) {
  if (!L(t) && K(t)) {
    var e = this._canvas.viewbox(), n = kp(t), i = n.x * e.scale - e.x * e.scale, r = n.y * e.scale - e.y * e.scale;
    return {
      left: i + ha * this._canvas.zoom(),
      top: r
    };
  }
  var o = this._canvas.getContainer(), s = o.getBoundingClientRect(), a = this._getTargetBounds(t);
  return {
    left: a.right - s.left + ha * this._canvas.zoom(),
    top: a.top - s.top
  };
};
q.prototype._updatePosition = function() {
  const t = () => {
    if (this.isOpen()) {
      var e = this._current.html, n = this._getPosition(this._current.target);
      "x" in n && "y" in n ? (e.style.left = n.x + "px", e.style.top = n.y + "px") : [
        "top",
        "right",
        "bottom",
        "left"
      ].forEach(function(i) {
        i in n && (e.style[i] = n[i] + "px");
      });
    }
  };
  this._scheduler.schedule(t, "ContextPad#_updatePosition");
};
q.prototype._updateVisibility = function() {
  const t = () => {
    if (this.isOpen()) {
      var e = this, n = this._current.target, i = L(n) ? n : [n], r = i.some(function(o) {
        return e._canvas.hasMarker(o, Cp);
      });
      r ? e.hide() : e.show();
    }
  };
  this._scheduler.schedule(t, "ContextPad#_updateVisibility");
};
q.prototype._getTargetBounds = function(t) {
  var e = this, n = L(t) ? t : [t], i = n.map(function(r) {
    return e._canvas.getGraphics(r);
  });
  return i.reduce(function(r, o) {
    const s = o.getBoundingClientRect();
    return r.top = Math.min(r.top, s.top), r.right = Math.max(r.right, s.right), r.bottom = Math.max(r.bottom, s.bottom), r.left = Math.min(r.left, s.left), r.x = r.left, r.y = r.top, r.width = r.right - r.left, r.height = r.bottom - r.top, r;
  }, {
    top: 1 / 0,
    right: -1 / 0,
    bottom: -1 / 0,
    left: 1 / 0
  });
};
function Rp(t, e) {
  var n = fe(t);
  e = L(e) ? e : e.split(/\s+/g), e.forEach(function(i) {
    n.add(i);
  });
}
function kp(t) {
  return t.waypoints[t.waypoints.length - 1];
}
function Pp(t, e) {
  return t = L(t) ? t : [t], e = L(e) ? e : [e], t.length === e.length && vi(t, function(n) {
    return e.includes(n);
  });
}
const To = class To extends q {
  constructor(e, n, i, r) {
    super(e, n, i, r);
    const o = this;
    o._getTargetBounds = this.getTargetBoundsFromModel.bind(this);
  }
  /**
   * Calculate target bounds from element model coordinates instead of SVG graphics bounds.
   * This fixes positioning issues where the SVG bounding box differs from the element's
   * logical bounds (e.g., due to labels, invisible elements, or viewBox differences).
   */
  getTargetBoundsFromModel(e) {
    const n = this, i = L(e) ? e : [e], r = n._canvas.viewbox(), s = n._canvas.getContainer().getBoundingClientRect(), a = i.reduce(
      (c, u) => {
        if (K(u))
          return c;
        const l = u, d = (l.x - r.x) * r.scale + s.left, h = (l.y - r.y) * r.scale + s.top, f = l.width * r.scale, p = l.height * r.scale;
        return c.top = Math.min(c.top, h), c.left = Math.min(c.left, d), c.right = Math.max(c.right, d + f), c.bottom = Math.max(c.bottom, h + p), c;
      },
      {
        top: 1 / 0,
        left: 1 / 0,
        right: -1 / 0,
        bottom: -1 / 0
      }
    );
    return {
      top: a.top,
      left: a.left,
      right: a.right,
      bottom: a.bottom,
      x: a.left,
      y: a.top,
      width: a.right - a.left,
      height: a.bottom - a.top,
      toJSON: () => ({})
    };
  }
};
To.$inject = [
  "canvas",
  "elementRegistry",
  "eventBus",
  "scheduler"
];
let Pr = To;
const Mp = {
  __depends__: [
    Sc,
    Qt,
    _p,
    ot,
    Xt,
    ke,
    Lf,
    go,
    pp,
    vp,
    hp,
    Rn
  ],
  __init__: ["contextPad", "domainStoryContextPadProvider"],
  contextPad: ["type", Pr],
  domainStoryContextPadProvider: ["type", Ap]
};
var gi = Math.max, yi = Math.min, Ip = 20;
function jp(t, e, n) {
  var i = n.x, r = n.y, o = {
    x: t.x,
    y: t.y,
    width: t.width,
    height: t.height
  };
  return e.indexOf("n") !== -1 ? (o.y = t.y + r, o.height = t.height - r) : e.indexOf("s") !== -1 && (o.height = t.height + r), e.indexOf("e") !== -1 ? o.width = t.width + i : e.indexOf("w") !== -1 && (o.x = t.x + i, o.width = t.width - i), o;
}
function Zn(t, e, n) {
  var i = e[t], r = n.min && n.min[t], o = n.max && n.max[t];
  return j(r) && (i = (/top|left/.test(t) ? yi : gi)(i, r)), j(o) && (i = (/top|left/.test(t) ? gi : yi)(i, o)), i;
}
function Dp(t, e) {
  if (!e)
    return t;
  var n = se(t);
  return lc({
    top: Zn("top", n, e),
    right: Zn("right", n, e),
    bottom: Zn("bottom", n, e),
    left: Zn("left", n, e)
  });
}
function Lp(t, e, n, i) {
  var r = se(e), o = {
    top: /n/.test(t) ? r.bottom - n.height : r.top,
    left: /w/.test(t) ? r.right - n.width : r.left,
    bottom: /s/.test(t) ? r.top + n.height : r.bottom,
    right: /e/.test(t) ? r.left + n.width : r.right
  }, s = i ? se(i) : o, a = {
    top: yi(o.top, s.top),
    left: yi(o.left, s.left),
    bottom: gi(o.bottom, s.bottom),
    right: gi(o.right, s.right)
  };
  return lc(a);
}
function an(t, e) {
  return typeof t < "u" ? t : Ip;
}
function Np(t, e) {
  var n, i, r, o;
  return typeof e == "object" ? (n = an(e.left), i = an(e.right), r = an(e.top), o = an(e.bottom)) : n = i = r = o = an(e), {
    x: t.x - n,
    y: t.y - r,
    width: t.width + n + i,
    height: t.height + r + o
  };
}
function Hp(t) {
  return !(t.waypoints || t.type === "label");
}
function Bp(t, e) {
  var n;
  if (t.length === void 0 ? n = we(t.children, Hp) : n = t, n.length)
    return Np(le(n), e);
}
var fa = 10;
function Ln(t, e, n, i) {
  this._dragging = i, this._rules = e;
  var r = this;
  function o(c, u) {
    var l = c.shape, d = c.direction, h = c.resizeConstraints, f;
    c.delta = u, f = jp(l, d, u), c.newBounds = Dp(f, h), c.canExecute = r.canResize(c);
  }
  function s(c) {
    var u = c.resizeConstraints, l = c.minBounds;
    u === void 0 && (l === void 0 && (l = r.computeMinResizeBox(c)), c.resizeConstraints = {
      min: se(l)
    });
  }
  function a(c) {
    var u = c.shape, l = c.canExecute, d = c.newBounds;
    if (l) {
      if (d = hd(d), !Wp(u, d))
        return;
      n.resizeShape(u, d);
    }
  }
  t.on("resize.start", function(c) {
    s(c.context);
  }), t.on("resize.move", function(c) {
    var u = {
      x: c.dx,
      y: c.dy
    };
    o(c.context, u);
  }), t.on("resize.end", function(c) {
    a(c.context);
  });
}
Ln.prototype.canResize = function(t) {
  var e = this._rules, n = Lt(t, ["newBounds", "shape", "delta", "direction"]);
  return e.allowed("shape.resize", n);
};
Ln.prototype.activate = function(t, e, n) {
  var i = this._dragging, r, o;
  if (typeof n == "string" && (n = {
    direction: n
  }), r = T({ shape: e }, n), o = r.direction, !o)
    throw new Error("must provide a direction (n|w|s|e|nw|se|ne|sw)");
  i.init(t, pu(e, o), "resize", {
    autoActivate: !0,
    cursor: zp(o),
    data: {
      shape: e,
      context: r
    }
  });
};
Ln.prototype.computeMinResizeBox = function(t) {
  var e = t.shape, n = t.direction, i, r;
  return i = t.minDimensions || {
    width: fa,
    height: fa
  }, r = Bp(e, t.childrenBoxPadding), Lp(n, e, i, r);
};
Ln.$inject = [
  "eventBus",
  "rules",
  "modeling",
  "dragging"
];
function Wp(t, e) {
  return t.x !== e.x || t.y !== e.y || t.width !== e.width || t.height !== e.height;
}
function pu(t, e) {
  var n = re(t), i = se(t), r = {
    x: n.x,
    y: n.y
  };
  return e.indexOf("n") !== -1 ? r.y = i.top : e.indexOf("s") !== -1 && (r.y = i.bottom), e.indexOf("e") !== -1 ? r.x = i.right : e.indexOf("w") !== -1 && (r.x = i.left), r;
}
function zp(t) {
  var e = "resize-";
  return t === "n" || t === "s" ? e + "ns" : t === "e" || t === "w" ? e + "ew" : t === "nw" || t === "se" ? e + "nwse" : e + "nesw";
}
var pa = "djs-resizing", ga = "resize-not-ok", Up = 500;
function gu(t, e, n) {
  function i(o) {
    var s = o.shape, a = o.newBounds, c = o.frame;
    c || (c = o.frame = n.addFrame(s, e.getActiveLayer()), e.addMarker(s, pa)), a.width > 5 && k(c, { x: a.x, width: a.width }), a.height > 5 && k(c, { y: a.y, height: a.height }), o.canExecute ? H(c).remove(ga) : H(c).add(ga);
  }
  function r(o) {
    var s = o.shape, a = o.frame;
    a && Y(o.frame), e.removeMarker(s, pa);
  }
  t.on("resize.move", Up, function(o) {
    i(o.context);
  }), t.on("resize.cleanup", function(o) {
    r(o.context);
  });
}
gu.$inject = [
  "eventBus",
  "canvas",
  "previewSupport"
];
var ya = -6, va = 8, ma = 20, cn = "djs-resizer", Fp = ["n", "w", "s", "e", "nw", "ne", "se", "sw"];
function Qe(t, e, n, i) {
  this._resize = i, this._canvas = e;
  var r = this;
  t.on("selection.changed", function(o) {
    var s = o.newSelection;
    r.removeResizers(), s.length === 1 && A(s, Br(r.addResizer, r));
  }), t.on("shape.changed", function(o) {
    var s = o.element;
    n.isSelected(s) && (r.removeResizers(), r.addResizer(s));
  });
}
Qe.prototype.makeDraggable = function(t, e, n) {
  var i = this._resize;
  function r(o) {
    Ke(o) && i.activate(o, t, n);
  }
  N.bind(e, "mousedown", r), N.bind(e, "touchstart", r);
};
Qe.prototype._createResizer = function(t, e, n, i) {
  var r = this._getResizersParent(), o = Kp(i), s = D("g");
  H(s).add(cn), H(s).add(cn + "-" + t.id), H(s).add(cn + "-" + i), I(r, s);
  var a = D("rect");
  k(a, {
    x: -8 / 2 + o.x,
    y: -8 / 2 + o.y,
    width: va,
    height: va
  }), H(a).add(cn + "-visual"), I(s, a);
  var c = D("rect");
  return k(c, {
    x: -20 / 2 + o.x,
    y: -20 / 2 + o.y,
    width: ma,
    height: ma
  }), H(c).add(cn + "-hit"), I(s, c), Il(s, e, n), s;
};
Qe.prototype.createResizer = function(t, e) {
  var n = pu(t, e), i = this._createResizer(t, n.x, n.y, e);
  this.makeDraggable(t, i, e);
};
Qe.prototype.addResizer = function(t) {
  var e = this;
  K(t) || !this._resize.canResize({ shape: t }) || A(Fp, function(n) {
    e.createResizer(t, n);
  });
};
Qe.prototype.removeResizers = function() {
  var t = this._getResizersParent();
  Ur(t);
};
Qe.prototype._getResizersParent = function() {
  return this._canvas.getLayer("resizers");
};
Qe.$inject = [
  "eventBus",
  "canvas",
  "selection",
  "resize"
];
function Kp(t) {
  var e = {
    x: 0,
    y: 0
  };
  return t.indexOf("e") !== -1 ? e.x = 6 : t.indexOf("w") !== -1 && (e.x = ya), t.indexOf("s") !== -1 ? e.y = 6 : t.indexOf("n") !== -1 && (e.y = ya), e;
}
const $p = {
  __depends__: [
    ke,
    at,
    bi
  ],
  __init__: [
    "resize",
    "resizePreview",
    "resizeHandles"
  ],
  resize: ["type", Ln],
  resizePreview: ["type", gu],
  resizeHandles: ["type", Qe]
};
var Tt;
let Vp = (Tt = class {
  constructor(e, n) {
    this.elementRegistryService = e, this.iconDictionaryService = n, this.activityLabels = [], this.workObjektLabels = [];
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
    this.activityLabels = [], this.workObjektLabels = [], this.elementRegistryService.getAllCanvasObjects().forEach((n) => {
      const i = n.businessObject.name;
      if (i && i.length > 0 && n.type.includes(S.ACTIVITY) && !this.activityLabels.map((r) => r.name).includes(i))
        this.activityLabels.push({
          name: i,
          originalName: i
        });
      else if (i && i.length > 0 && n.type.includes(S.WORKOBJECT) && !this.workObjektLabels.map((r) => r.name).includes(i)) {
        const r = n.type.replace(S.WORKOBJECT, "");
        let o = this.iconDictionaryService.getIconSource(r);
        if (!o)
          return;
        o.startsWith("data") || (o = "data:image/svg+xml," + o), this.workObjektLabels.push({
          name: i,
          originalName: i,
          icon: o
        });
      }
    }), this.activityLabels.sort((n, i) => n.name.toLowerCase().localeCompare(i.name.toLowerCase())), this.workObjektLabels.sort((n, i) => n.name.toLowerCase().localeCompare(i.name.toLowerCase()));
  }
  getActivityLabels() {
    return this.activityLabels.slice();
  }
  getWorkObjectLabels() {
    return this.workObjektLabels.slice();
  }
  getUniqueWorkObjectNames() {
    const e = this.elementRegistryService.getAllWorkobjects();
    return [
      ...new Set(
        e.filter((n) => !!n.businessObject.name).map((n) => n.businessObject.name)
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
}, Tt.$inject = [
  "domainStoryElementRegistryService",
  "domainStoryIconDictionaryService"
], Tt);
const Gp = {
  __depends__: [Xt, ot],
  __init__: ["domainStoryLabelDictionaryService"],
  domainStoryLabelDictionaryService: ["type", Vp]
}, _a = "djs-element-hidden", xa = "djs-label-hidden", Ro = class Ro {
  constructor(e, n) {
    this.defaultLayer = n.getDefaultLayer(), e.on("directEditing.activate", (i) => {
      const r = i.active;
      if (this.element = r.element.label || r.element, ce(this.element, S.TEXTANNOTATION)) {
        this.absoluteElementBBox = n.getAbsoluteBBox(this.element), this.gfx = D("g");
        const o = gr({
          xScaleFactor: 1,
          yScaleFactor: 1,
          containerWidth: this.element.width,
          containerHeight: this.element.height,
          position: {
            mx: 0,
            my: 0
          }
        }), s = this.path = D("path");
        k(s, {
          d: o,
          strokeWidth: 2,
          stroke: "black"
        }), I(this.gfx, s), I(this.defaultLayer, this.gfx), he(this.gfx, this.element.x, this.element.y), ce(this.element, S.TEXTANNOTATION) || this.element.labelTarget ? n.addMarker(this.element, _a) : (this.element.type.includes(S.ACTOR) || this.element.type.includes(S.WORKOBJECT) || this.element.type.includes(S.ACTIVITY) || this.element.type.includes(S.GROUP)) && n.addMarker(this.element, xa);
      }
    }), e.on("directEditing.resize", (i) => {
      var r;
      if (ce(this.element, S.TEXTANNOTATION)) {
        const o = i.height, s = i.dy, a = Math.max(
          this.element.height / (((r = this.absoluteElementBBox) == null ? void 0 : r.height) ?? 1) * (o + s),
          0
        ), c = gr({
          xScaleFactor: 1,
          yScaleFactor: 1,
          containerWidth: this.element.width,
          containerHeight: a,
          position: {
            mx: 0,
            my: 0
          }
        });
        k(this.path, c);
      }
    }), e.on(
      ["directEditing.complete", "directEditing.cancel"],
      (i) => {
        const r = i.active;
        r && (n.removeMarker(
          r.element.label || r.element,
          _a
        ), n.removeMarker(this.element, xa)), this.element = void 0, this.absoluteElementBBox = void 0, this.gfx && (Y(this.gfx), this.gfx = void 0);
      }
    );
  }
};
Ro.$inject = ["eventBus", "canvas"];
let Mr = Ro;
const qp = {
  __depends__: [
    Qt,
    Ac,
    Gp,
    Mu,
    $p,
    Rn
  ],
  __init__: ["domainStoryLabelEditingProvider", "domainStoryLabelEditingPreview"],
  domainStoryLabelEditingProvider: ["type", xr],
  domainStoryLabelEditingPreview: ["type", Mr]
}, ko = class ko {
  constructor(e, n, i, r) {
    this.modeling = e, this.elementRegistryService = n, this.eventBus = i, this.numberingRegistry = r;
  }
  preExecute(e) {
    e.oldLabel = e.businessObject.name || " ";
    const n = this.numberingRegistry.getNumbersAndIDs();
    this.modeling.updateLabel(e.businessObject, e.newLabel), this.modeling.updateNumber(e.businessObject, e.newNumber), e.oldNumber = e.businessObject.number, e.oldNumbersWithIDs = n;
  }
  execute(e) {
    const n = e.businessObject, i = e.element;
    return e.newLabel && e.newLabel.length < 1 && (e.newLabel = " "), n.name = e.newLabel, n.number = e.newNumber, this.eventBus.fire("element.changed", { element: i }), [i];
  }
  revert(e) {
    const n = e.businessObject, i = e.element;
    return n.name = e.oldLabel, n.number = e.oldNumber, Xp(
      e.oldNumbersWithIDs,
      this.elementRegistryService.getActivitiesFromActors(),
      this.eventBus
    ), this.eventBus.fire("element.changed", { element: i }), [i];
  }
};
ko.$inject = [
  "modeling",
  "domainStoryElementRegistryService",
  "eventBus",
  "domainStoryNumberingRegistry"
];
let Ir = ko;
const Po = class Po {
  constructor(e, n) {
    this.modeling = e, this.eventBus = n;
  }
  preExecute(e) {
    e.oldNumber = e.businessObject.number, e.oldWaypoints = e.element.waypoints, e.name = e.businessObject.name, e.oldNumber || (e.oldNumber = 0), this.modeling.updateNumber(e.businessObject, e.newNumber);
  }
  execute(e) {
    const n = e.businessObject, i = e.element, r = i.source, o = [], s = i.waypoints;
    for (let a = s.length - 1; a >= 0; a--)
      o.push(s[a]);
    return i.source = i.target, n.source = n.target, i.target = r, n.target = r == null ? void 0 : r.id, n.name = e.name, n.number = e.newNumber, i.waypoints = o, this.eventBus.fire("element.changed", { element: i }), [i];
  }
  revert(e) {
    const n = e.businessObject, i = e.element, r = i.source;
    return i.source = i.target, n.source = n.target, i.target = r, n.target = r == null ? void 0 : r.id, n.name = e.name, n.number = e.oldNumber, i.waypoints = e.oldWaypoints, this.eventBus.fire("element.changed", { element: i }), [i];
  }
};
Po.$inject = ["modeling", "eventBus"];
let jr = Po;
function Xp(t, e, n) {
  for (let i = e.length - 1; i >= 0; i--)
    for (let r = t.length - 1; r >= 0; r--)
      if (t[r].id.includes(e[i].businessObject.id)) {
        const o = e[i];
        o.businessObject.number = t[r].number, r = -5, n.fire("element.changed", { element: o }), t.splice(r, 1);
      }
}
const Mo = class Mo {
  constructor(e) {
    this.eventBus = e;
  }
  preExecute(e) {
    e.oldColor = e.businessObject.pickedColor;
  }
  execute(e) {
    const n = e.businessObject, i = e.element;
    return n.type.includes(S.TEXTANNOTATION) && i.incoming[0] && (i.incoming[0].businessObject.pickedColor = e.newColor, this.eventBus.fire("element.changed", { element: i.incoming[0] })), n.pickedColor = e.newColor, this.eventBus.fire("element.changed", { element: i }), [
      {
        id: i.id,
        businessObject: n
      }
    ];
  }
  revert(e) {
    const n = e.businessObject, i = e.element;
    return n.type.includes(S.TEXTANNOTATION) && i.incoming[0] && (i.incoming[0].businessObject.pickedColor = e.oldColor, this.eventBus.fire("element.changed", { element: i.incoming[0] })), n.pickedColor = e.oldColor, this.eventBus.fire("element.changed", { element: i }), [
      {
        id: i.id,
        businessObject: n
      }
    ];
  }
};
Mo.$inject = ["eventBus"];
let Dr = Mo;
const Io = class Io {
  constructor(e) {
    this.eventBus = e;
  }
  preExecute(e) {
    e.parent = e.element.parent, e.children = e.element.children.slice();
  }
  execute(e) {
    const n = e.element;
    return e.children.forEach((i) => {
      mh(n, i), this.eventBus.fire("element.changed", { element: i });
    }), this.eventBus.fire("shape.remove", { element: n }), [
      {
        id: n.id,
        businessObject: n.businessObject
      }
    ];
  }
  revert(e) {
    const n = e.element;
    return this.eventBus.fire("shape.added", { element: n }), e.element.children.forEach((i) => {
      pr(n, i);
    }), [
      {
        id: n.id,
        businessObject: n.businessObject
      }
    ];
  }
};
Io.$inject = ["eventBus"];
let Lr = Io;
var Rt;
let Jp = (Rt = class {
  constructor(e) {
    e.registerHandler("activity.changed", Ir), e.registerHandler(
      "activity.directionChange",
      jr
    ), e.registerHandler("element.colorChange", Dr), e.registerHandler(
      "shape.removeGroupWithoutChildren",
      Lr
    );
  }
}, Rt.$inject = ["commandStack"], Rt);
const Qp = {
  __depends__: [Qt, ot, Rn],
  __init__: ["domainStoryUpdateHandler"],
  domainStoryUpdateHandler: ["type", Jp]
};
function Nn() {
}
Nn.prototype.get = function() {
  return this._data;
};
Nn.prototype.set = function(t) {
  this._data = t;
};
Nn.prototype.clear = function() {
  var t = this._data;
  return delete this._data, t;
};
Nn.prototype.isEmpty = function() {
  return !this._data;
};
const Yp = {
  clipboard: ["type", Nn]
};
function ve(t, e, n, i, r, o, s, a) {
  this._canvas = t, this._create = e, this._clipboard = n, this._elementFactory = i, this._eventBus = r, this._modeling = o, this._mouse = s, this._rules = a, r.on("copyPaste.copyElement", function(c) {
    var u = c.descriptor, l = c.element, d = c.elements;
    u.priority = 1, u.id = l.id;
    var h = de(d, function(f) {
      return f === l.parent;
    });
    h && (u.parent = l.parent.id), Zp(l) && (u.priority = 2, u.host = l.host.id), K(l) && (u.priority = 3, u.source = l.source.id, u.target = l.target.id, u.waypoints = eg(l)), ne(l) && (u.priority = 4, u.labelTarget = l.labelTarget.id), A(["x", "y", "width", "height"], function(f) {
      j(l[f]) && (u[f] = l[f]);
    }), u.hidden = l.hidden, u.collapsed = l.collapsed;
  }), r.on("copyPaste.pasteElements", function(c) {
    var u = c.hints;
    T(u, {
      createElementsBehavior: !1
    });
  });
}
ve.$inject = [
  "canvas",
  "create",
  "clipboard",
  "elementFactory",
  "eventBus",
  "modeling",
  "mouse",
  "rules"
];
ve.prototype.copy = function(t) {
  var e, n;
  return L(t) || (t = t ? [t] : []), e = this._eventBus.fire("copyPaste.canCopyElements", {
    elements: t
  }), e === !1 ? n = {} : n = this.createTree(L(e) ? e : t), this._clipboard.set(n), this._eventBus.fire("copyPaste.elementsCopied", {
    elements: t,
    tree: n
  }), n;
};
ve.prototype.paste = function(t) {
  var e = this._clipboard.get();
  if (!this._clipboard.isEmpty()) {
    var n = t && t.hints || {};
    this._eventBus.fire("copyPaste.pasteElements", {
      hints: n
    });
    var i = this._createElements(e);
    if (t && t.element && t.point)
      return this._paste(i, t.element, t.point, n);
    this._create.start(this._mouse.getLastMoveEvent(), i, {
      hints: n || {}
    });
  }
};
ve.prototype._paste = function(t, e, n, i) {
  A(t, function(o) {
    j(o.x) || (o.x = 0), j(o.y) || (o.y = 0);
  });
  var r = le(t);
  return A(t, function(o) {
    K(o) && (o.waypoints = xe(o.waypoints, function(s) {
      return {
        x: s.x - r.x - r.width / 2,
        y: s.y - r.y - r.height / 2
      };
    })), T(o, {
      x: o.x - r.x - r.width / 2,
      y: o.y - r.y - r.height / 2
    });
  }), this._modeling.createElements(t, n, e, T({}, i));
};
ve.prototype._createElements = function(t) {
  var e = this, n = this._eventBus, i = {}, r = [];
  return A(t, function(o, s) {
    o = En(o, "priority"), A(o, function(a) {
      var c = T({}, Fe(a, ["priority"]));
      i[a.parent] ? c.parent = i[a.parent] : delete c.parent, n.fire("copyPaste.pasteElement", {
        cache: i,
        descriptor: c
      });
      var u;
      if (K(c)) {
        c.source = i[a.source], c.target = i[a.target], u = i[a.id] = e.createConnection(c), r.push(u);
        return;
      }
      if (ne(c)) {
        c.labelTarget = i[c.labelTarget], u = i[a.id] = e.createLabel(c), r.push(u);
        return;
      }
      c.host && (c.host = i[c.host]), u = i[a.id] = e.createShape(c), r.push(u);
    });
  }), r;
};
ve.prototype.createConnection = function(t) {
  var e = this._elementFactory.createConnection(Fe(t, ["id"]));
  return e;
};
ve.prototype.createLabel = function(t) {
  var e = this._elementFactory.createLabel(Fe(t, ["id"]));
  return e;
};
ve.prototype.createShape = function(t) {
  var e = this._elementFactory.createShape(Fe(t, ["id"]));
  return e;
};
ve.prototype.hasRelations = function(t, e) {
  var n, i, r;
  return !(K(t) && (i = de(e, ln({ id: t.source.id })), r = de(e, ln({ id: t.target.id })), !i || !r) || ne(t) && (n = de(e, ln({ id: t.labelTarget.id })), !n));
};
ve.prototype.createTree = function(t) {
  var e = this._rules, n = this, i = {}, r = [], o = Ga(t);
  function s(u, l) {
    return e.allowed("element.copy", {
      element: u,
      elements: l
    });
  }
  function a(u, l) {
    var d = de(r, function(h) {
      return u === h.element;
    });
    if (!d) {
      r.push({
        element: u,
        depth: l
      });
      return;
    }
    d.depth < l && (r = c(d, r), r.push({
      element: d.element,
      depth: l
    }));
  }
  function c(u, l) {
    var d = l.indexOf(u);
    return d !== -1 && l.splice(d, 1), l;
  }
  return xi(o, function(u, l, d) {
    if (ne(u))
      return;
    A(u.labels, function(p) {
      a(p, d);
    });
    function h(p) {
      p && p.length && A(p, function(m) {
        A(m.labels, function(g) {
          a(g, d);
        }), a(m, d);
      });
    }
    A([u.attachers, u.incoming, u.outgoing], h), a(u, d);
    var f = [];
    return u.children && (f = u.children.slice()), n._eventBus.fire("copyPaste.createTree", {
      element: u,
      children: f
    }), f;
  }), t = xe(r, function(u) {
    return u.element;
  }), r = xe(r, function(u) {
    return u.descriptor = {}, n._eventBus.fire("copyPaste.copyElement", {
      descriptor: u.descriptor,
      element: u.element,
      elements: t
    }), u;
  }), r = En(r, function(u) {
    return u.descriptor.priority;
  }), t = xe(r, function(u) {
    return u.element;
  }), A(r, function(u) {
    var l = u.depth;
    if (!n.hasRelations(u.element, t)) {
      Ea(u.element, t);
      return;
    }
    if (!s(u.element, t)) {
      Ea(u.element, t);
      return;
    }
    i[l] || (i[l] = []), i[l].push(u.descriptor);
  }), i;
};
function Zp(t) {
  return !!t.host;
}
function eg(t) {
  return xe(t.waypoints, function(e) {
    return e = ba(e), e.original && (e.original = ba(e.original)), e;
  });
}
function ba(t) {
  return T({}, t);
}
function Ea(t, e) {
  var n = e.indexOf(t);
  return n === -1 ? e : e.splice(n, 1);
}
const tg = {
  __depends__: [
    Yp,
    go,
    Di,
    ke
  ],
  __init__: ["copyPaste"],
  copyPaste: ["type", ve]
}, ng = 750;
var kt;
let ig = (kt = class {
  constructor(e, n) {
    this.domainStoryPropertyCopy = e, this.references = {}, n.on("copyPaste.copyElement", ng, function(i) {
      const r = i.descriptor, o = i.element, s = r.oldBusinessObject = nt(o);
      if (r.type = o.type, wa(s, r, "name"), ne(r))
        return r;
    }), n.on("copyPaste.pasteElements", () => {
      this.references = {};
    }), n.on("copyPaste.pasteElement", (i) => {
      const r = i.cache, o = i.descriptor, s = o.oldBusinessObject, a = {};
      if (ne(o)) {
        o.businessObject = nt(
          r[o.labelTarget]
        );
        return;
      }
      o.businessObject = this.domainStoryPropertyCopy.copyElement(
        s,
        a
      ), this.resolveReferences(o, r), wa(o, a, ["name"]), rg(o, "oldBusinessObject");
    });
  }
  resolveReferences(e, n) {
    const i = nt(e);
    e.host && (nt(e).attachedToRef = nt(
      n[e.host]
    )), this.references = Fe(
      this.references,
      vn(
        this.references,
        function(r, o, s) {
          const a = o.element, c = o.property;
          return s === e.id && (a[c] = i, r.push(e.id)), r;
        },
        []
      )
    );
  }
}, kt.$inject = ["domainStoryPropertyCopy", "eventBus"], kt);
function wa(t, e, n) {
  L(n) || (n = [n]), A(n, function(i) {
    Ca(t[i]) || (e[i] = t[i]);
  });
}
function rg(t, e) {
  L(e) || (e = [e]), A(e, function(n) {
    t[n] && delete t[n];
  });
}
const og = ["incoming", "outgoing"], jo = class jo {
  constructor(e) {
    this.eventBus = e, e.on("propertyCopy.canCopyProperties", function(n) {
      const i = n.propertyNames;
      if (!(!i || !i.length))
        return En(i, function(r) {
          return r === "extensionElements";
        });
    }), e.on("propertyCopy.canCopyProperty", function(n) {
      const i = n.propertyName;
      return !(i && og.indexOf(i) !== -1);
    });
  }
  copyElement(e, n, i) {
    i && !L(i) && (i = [i]);
    const r = this.eventBus.fire("propertyCopy.canCopyProperties", {
      propertyNames: i,
      sourceElement: e,
      targetElement: n
    });
    return r === !1 || (L(r) && (i = r), A(i, (o) => {
      let s;
      zr(e, o) && (s = e[o]);
      const a = this.copyProperty(
        s,
        n,
        o
      );
      this.eventBus.fire(
        "propertyCopy.canSetCopiedProperty",
        {
          parent: n,
          property: a,
          propertyName: o
        }
      ) !== !1 && ge(a) && (n[o] = a);
    })), n;
  }
  copyProperty(e, n, i) {
    let r = this.eventBus.fire(
      "propertyCopy.canCopyProperty",
      {
        parent: n,
        property: e,
        propertyName: i
      }
    );
    if (!(typeof r == "boolean" && !r))
      return r ? (ie(r) && !r.$parent && (r.$parent = n), r) : L(e) ? vn(
        e,
        (o, s) => (r = this.copyProperty(
          s,
          n,
          i
        ), r && typeof r != "boolean" ? (r.$parent = n, o.concat(r)) : o),
        []
      ) : ie(e) ? (r = {}, r.$parent = n, r = this.copyElement(e, r), r) : e;
  }
};
jo.$inject = ["eventBus"];
let Nr = jo;
const sg = {
  __depends__: [tg],
  __init__: ["domainStoryCopyPaste", "domainStoryPropertyCopy"],
  domainStoryCopyPaste: ["type", ig],
  domainStoryPropertyCopy: ["type", Nr]
};
var Ji = 1500, yu = "grab";
function Zt(t, e, n, i, r, o) {
  this._dragging = n, this._mouse = o;
  var s = this, a = i.get("keyboard", !1);
  r.registerTool("hand", {
    tool: "hand",
    dragging: "hand.move"
  }), t.on("element.mousedown", Ji, function(c) {
    if (ii(c))
      return s.activateMove(c.originalEvent, !0), !1;
  }), a && a.addListener(Ji, function(c) {
    if (!(!Sa(c.keyEvent) || s.isActive())) {
      var u = s._mouse.getLastMoveEvent();
      s.activateMove(u, !!u);
    }
  }, "keyboard.keydown"), a && a.addListener(Ji, function(c) {
    !Sa(c.keyEvent) || !s.isActive() || s.toggle();
  }, "keyboard.keyup"), t.on("hand.end", function(c) {
    var u = c.originalEvent.target;
    if (!c.hover && !(u instanceof SVGElement))
      return !1;
    t.once("hand.ended", function() {
      s.activateMove(c.originalEvent, { reactivate: !0 });
    });
  }), t.on("hand.move.move", function(c) {
    var u = e.viewbox().scale;
    e.scroll({
      dx: c.dx * u,
      dy: c.dy * u
    });
  }), t.on("hand.move.end", function(c) {
    var u = c.context, l = u.reactivate;
    return !ii(c) && l && t.once("hand.move.ended", function(d) {
      s.activateHand(d.originalEvent, !0, !0);
    }), !1;
  });
}
Zt.$inject = [
  "eventBus",
  "canvas",
  "dragging",
  "injector",
  "toolManager",
  "mouse"
];
Zt.prototype.activateMove = function(t, e, n) {
  typeof e == "object" && (n = e, e = !1), this._dragging.init(t, "hand.move", {
    autoActivate: e,
    cursor: yu,
    data: {
      context: n || {}
    }
  });
};
Zt.prototype.activateHand = function(t, e, n) {
  this._dragging.init(t, "hand", {
    trapClick: !1,
    autoActivate: e,
    cursor: yu,
    data: {
      context: {
        reactivate: n
      }
    }
  });
};
Zt.prototype.toggle = function() {
  if (this.isActive())
    return this._dragging.cancel();
  var t = this._mouse.getLastMoveEvent();
  this.activateHand(t, !!t);
};
Zt.prototype.isActive = function() {
  var t = this._dragging.context();
  return t ? /^(hand|hand\.move)$/.test(t.prefix) : !1;
};
function Sa(t) {
  return ue("Space", t);
}
const ag = {
  __depends__: [
    fo,
    Di
  ],
  __init__: ["handTool"],
  handTool: ["type", Zt]
};
var Pt;
let cg = (Pt = class {
  constructor(e, n, i, r, o, s, a, c) {
    this.canvas = n, this.elementRegistry = i, this.selection = r, this.spaceTool = o, this.lassoTool = s, this.handTool = a, this.directEditing = c;
    const u = {
      selectElements: this.selectAll(),
      spaceTool: this.toggleSpaceTool(),
      lassoTool: this.toggleLassoTool(),
      handTool: this.toggleHandTool(),
      directEditing: this.activateDirectEditing()
    };
    e.register(u);
  }
  /**
   * select all elements except for the invisible root element
   * @private
   */
  selectAll() {
    return () => {
      const e = this.canvas.getRootElement(), n = this.elementRegistry.filter(function(i) {
        return i !== e;
      });
      return this.selection.select(n), n;
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
      const e = this.selection.get();
      e.length && this.directEditing.activate(e[0]);
    };
  }
}, Pt.$inject = [
  "editorActions",
  "canvas",
  "elementRegistry",
  "selection",
  "spaceTool",
  "lassoTool",
  "handTool",
  "directEditing"
], Pt);
const ug = {
  __depends__: [ag],
  __init__: ["domainStoryEditorActions"],
  domainStoryEditorActions: ["type", cg]
};
var Mt;
let lg = (Mt = class {
  constructor(e, n) {
    this.keyboard = e, this.editorActions = n, this.addListener(...this.selectAll()), this.addListener(...this.toggleSpaceTool()), this.addListener(...this.toggleLassoTool()), this.addListener(...this.toggleHandTool()), this.addListener(...this.activateDirectEditing());
  }
  addListener(e, n) {
    this.editorActions.isRegistered(e) && this.keyboard.addListener(n);
  }
  selectAll() {
    return [
      "selectElements",
      (e) => {
        const n = e.keyEvent;
        if (this.keyboard.isKey(["a", "A"], n) && this.keyboard.isCmd(n))
          return this.editorActions.trigger("selectElements", {}), !0;
      }
    ];
  }
  toggleSpaceTool() {
    return [
      "spaceTool",
      (e) => {
        const n = e.keyEvent;
        if (!this.keyboard.hasModifier(n) && this.keyboard.isKey(["s", "S"], n))
          return this.editorActions.trigger("spaceTool", {}), !0;
      }
    ];
  }
  toggleLassoTool() {
    return [
      "lassoTool",
      (e) => {
        const n = e.keyEvent;
        if (!this.keyboard.hasModifier(n) && this.keyboard.isKey(["l", "L"], n))
          return this.editorActions.trigger("lassoTool", {}), !0;
      }
    ];
  }
  toggleHandTool() {
    return [
      "handTool",
      (e) => {
        const n = e.keyEvent;
        if (!this.keyboard.hasModifier(n) && this.keyboard.isKey(["h", "H"], n))
          return this.editorActions.trigger("handTool", {}), !0;
      }
    ];
  }
  activateDirectEditing() {
    return [
      "directEditing",
      (e) => {
        const n = e.keyEvent;
        if (!this.keyboard.hasModifier(n) && this.keyboard.isKey(["e", "E"], n))
          return this.editorActions.trigger("directEditing", {}), !0;
      }
    ];
  }
}, Mt.$inject = ["keyboard", "editorActions"], Mt);
const dg = {
  __depends__: [Gr, Pa, ug],
  __init__: ["domainStoryKeyboardBindings"],
  domainStoryKeyboardBindings: ["type", lg]
}, Do = class Do {
  constructor(e, n, i) {
    this.eventBus = e, this.commandStack = n, this.domainStoryElementRegistryService = i, this.numberRegistry = [], this.multipleNumberRegistry = [!1];
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
  add(e, n) {
    this.numberRegistry[n] = e;
  }
  setNumberIsMultiple(e, n) {
    this.multipleNumberRegistry[e] = n;
  }
  updateMultipleNumberRegistry(e) {
    e.forEach(
      (n) => this.multipleNumberRegistry[n.number ?? 0] = n.multipleNumberAllowed
    );
  }
  /**
   * Get the IDs of activities with their associated number, only returns activities that are originating from an actor
   */
  getNumbersAndIDs() {
    const e = [], n = this.domainStoryElementRegistryService.getActivitiesFromActors();
    for (let i = n.length - 1; i >= 0; i--) {
      const r = n[i].businessObject.id, o = n[i].businessObject.number;
      e.push({ id: r, number: o });
    }
    return e;
  }
  /**
   * Determine the next available number that is not yet used
   */
  generateAutomaticNumber(e) {
    const n = e.businessObject, i = [0];
    let r = -1;
    const o = this.domainStoryElementRegistryService.getActivitiesFromActors();
    o.forEach((s) => {
      s.businessObject.number && i.push(+s.businessObject.number);
    });
    for (let s = 0; s < i.length; s++)
      i.includes(s) || i.includes(s) || (r = s, s = i.length);
    return r === -1 && (r = i.length), this.updateExistingNumbersAtGeneration(o, r), n.number = r, r;
  }
  /**
   * update the numbers at the activities when generating a new activity
   */
  updateExistingNumbersAtGeneration(e, n) {
    e.forEach((i) => {
      const r = i.businessObject.number ?? 0;
      r >= n && (n++, setTimeout(() => {
        this.commandStack.execute("activity.changed", {
          businessObject: i.businessObject,
          newLabel: i.businessObject.name,
          newNumber: r,
          element: i
        });
      }, 10));
    });
  }
  /**
   * Update the numbers at the activities when editing an activity
   */
  updateExistingNumbersAtEditing(e, n) {
    const i = [[]];
    e.forEach((s) => {
      s.businessObject.number && (i[s.businessObject.number] || (i[s.businessObject.number] = []), i[s.businessObject.number].push(s));
    });
    const r = [...this.multipleNumberRegistry];
    let o = n;
    for (o; o < i.length; o++)
      i[o] && (n++, this.multipleNumberRegistry[n] = r[o], this.setNumberOfActivity(i[o], n));
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
  setNumberOfActivity(e, n) {
    e && e.forEach((i) => {
      if (i) {
        const r = i.businessObject;
        r && (r.number = n), this.eventBus.fire("element.changed", { element: i });
      }
    });
  }
};
Do.$inject = [
  "eventBus",
  "commandStack",
  "domainStoryElementRegistryService"
];
let Hr = Do;
function Aa(t) {
  const e = t.text, n = t.onClick;
  return W`
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
            onClick=${n}
            onMouseEnter=${(i) => {
    const r = i.target;
    r.style.borderColor = "#00e379", r.style.color = "#00e379";
  }}
            onMouseLeave=${(i) => {
    const r = i.target;
    r.style.borderColor = "#ccc", r.style.color = "inherit";
  }}
        >
            ${e}
        </button>
    `;
}
function hg(t) {
  const e = t.x, n = t.y, i = t.onUpdate, r = t.onCancel, [o, s] = yt(t.isMultiple || !1), [a, c] = yt(t.label || ""), [u, l] = yt(t.index || 0), d = () => {
    i(a, u, o);
  }, h = (g) => {
    s(g.target.checked);
  }, f = (g) => {
    const E = g.target.value;
    l(E === "" ? 0 : Number(E));
  }, p = (g) => {
    c(g.target.value);
  }, m = (g) => {
    g && setTimeout(() => g.focus(), 0);
  };
  return W`
        <div
            style="z-index: 9999; 
            position: absolute; 
            top: ${n}px; 
            left: ${e}px; 
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
                ${t.displayNumber ? W`
                          <div style="display: flex; align-items: center; gap: 8px;">
                              <label for="multiple" style="min-width: 80px;"
                                  >Multiple:</label
                              >
                              <input
                                  name="multiple"
                                  type="checkbox"
                                  onInput=${h}
                              />
                          </div>
                          <div style="display: flex; align-items: center; gap: 8px;">
                              <label for="index" style="min-width: 80px;">Number:</label>
                              <input
                                  name="index"
                                  type="number"
                                  value=${u}
                                  onInput=${f}
                                  style="flex: 1; 
                        border: 1px solid #ccc; 
                        border-radius: 4px; 
                        padding: 6px;
                        transition: border-color 0.2s ease;"
                                  onFocus=${(g) => {
    const E = g.target;
    E.style.borderColor = "#00e379", E.style.outline = "none";
  }}
                                  onBlur=${(g) => {
    const E = g.target;
    E.style.borderColor = "#ccc";
  }}
                              />
                          </div>
                      ` : ""}
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label for="label" style="min-width: 80px;">Label:</label>
                    <input
                        ref=${m}
                        name="label"
                        type="text"
                        value=${a}
                        onInput=${p}
                        style="flex: 1; 
                        border: 1px solid #ccc; 
                        border-radius: 4px; 
                        padding: 6px;
                        transition: border-color 0.2s ease;"
                        onFocus=${(g) => {
    const E = g.target;
    E.style.borderColor = "#00e379", E.style.outline = "none";
  }}
                        onBlur=${(g) => {
    const E = g.target;
    E.style.borderColor = "#ccc";
  }}
                    />
                </div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 8px;">
                <${Aa} text="Update" onClick=${d} />
                <${Aa} text="Cancel" onClick=${r} />
            </div>
        </div>
    `;
}
var It;
let fg = (It = class {
  constructor(e, n, i, r, o) {
    this.canvas = e, this.eventBus = n, this.commandStack = i, this.elementRegistryService = r, this.domainStoryNumberingRegistry = o, this.popupElement = null, this.currentUpdateCallback = null, this.handleUpdate = (s, a, c, u) => {
      const l = this.elementRegistryService.getActivitiesFromActors(), d = l.indexOf(s);
      l.splice(d, 1), c && (s.businessObject.number = c, this.domainStoryNumberingRegistry.setNumberIsMultiple(c, u)), s.businessObject.multipleNumberAllowed = u;
      let h;
      c ? h = {
        businessObject: s.businessObject,
        newLabel: a,
        newNumber: c,
        element: s
      } : h = {
        businessObject: s.businessObject,
        newLabel: a,
        element: s
      }, this.commandStack.execute("activity.changed", h), c && (s.businessObject.multipleNumberAllowed ? this.domainStoryNumberingRegistry.getMultipleNumberRegistry()[c] || this.domainStoryNumberingRegistry.updateExistingNumbersAtEditing(
        l,
        c
      ) : s.businessObject.multipleNumberAllowed || this.domainStoryNumberingRegistry.updateExistingNumbersAtEditing(
        l,
        c
      ));
    }, this.handleOutsideClick = (s) => {
      if (!this.popupElement) return;
      if (!s.target.closest('[data-numbering-popup="true"]') && this.currentUpdateCallback) {
        const u = this.popupElement.querySelector(
          'input[name="label"]'
        ), l = this.popupElement.querySelector(
          'input[name="index"]'
        ), d = this.popupElement.querySelector(
          'input[name="multiple"]'
        ), h = (u == null ? void 0 : u.value) || "", f = l ? Number(l.value) : void 0, p = (d == null ? void 0 : d.checked) || !1;
        this.currentUpdateCallback(h, f, p), this.currentUpdateCallback = null, this.close();
      }
    }, this.eventBus.on("element.dblclick", (s) => {
      var c;
      const { element: a } = s;
      (c = a.type) != null && c.includes(S.ACTIVITY) && this.open(a);
    });
  }
  open(e) {
    const n = this.calculatePosition(e), i = (s, a, c) => {
      this.handleUpdate(e, s, a, c), this.currentUpdateCallback = null, this.close();
    };
    this.currentUpdateCallback = (s, a, c) => {
      this.handleUpdate(e, s, a, c);
    };
    const r = () => {
      this.close();
    }, o = document.getElementById("egon-io-container");
    if (o) {
      this.close();
      const s = document.createElement("div"), a = !!this.elementRegistryService.getActivityFromActorById(
        e.businessObject.id
      );
      Hi(
        W`<${hg}
                    x=${n.x}
                    y=${n.y}
                    label=${e.businessObject.name}
                    index=${e.businessObject.number}
                    isMultiple=${e.businessObject.multipleNumberAllowed}
                    displayNumber=${a}
                    onUpdate=${i}
                    onCancel=${r}
                />`,
        s
      ), this.popupElement = s.firstElementChild, this.popupElement && (this.popupElement.setAttribute("data-numbering-popup", "true"), o.appendChild(this.popupElement)), setTimeout(() => {
        document.addEventListener("click", this.handleOutsideClick, !0);
      }, 0);
    }
  }
  close() {
    this.popupElement && (document.removeEventListener("click", this.handleOutsideClick, !0), this.popupElement.remove(), this.popupElement = null, this.currentUpdateCallback = null);
  }
  calculatePosition(e) {
    const n = e.waypoints[0], i = e.waypoints[e.waypoints.length - 1], r = (n.x + i.x) / 2, o = (n.y + i.y) / 2, s = this.canvas.viewbox();
    return {
      x: (r - s.x) * s.scale,
      y: (o - s.y) * s.scale
    };
  }
}, It.$inject = [
  "canvas",
  "eventBus",
  "commandStack",
  "domainStoryElementRegistryService",
  "domainStoryNumberingRegistry"
], It);
const pg = {
  __depends__: [Qt, ot],
  __init__: ["domainStoryNumberingRegistry", "domainStoryNumberingUi"],
  domainStoryNumberingRegistry: ["type", Hr],
  domainStoryNumberingUi: ["type", fg]
};
class gg {
  constructor(e, n) {
    this.domain = e, this.dst = n;
  }
}
JSON.parse(
  '{"name":"","actors":{"Person":"<svg viewBox=\\"0 0 24 26\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M12 5.9c1.16 0 2.1.94 2.1 2.1s-.94 2.1-2.1 2.1S9.9 9.16 9.9 8s.94-2.1 2.1-2.1m0 9c2.97 0 6.1 1.46 6.1 2.1v1.1H5.9V17c0-.64 3.13-2.1 6.1-2.1M12 4C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 9c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z\\"/><path d=\\"M0 0h24v24H0z\\" fill=\\"none\\"/></svg>","Group":"<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"48\\" height=\\"48\\" viewBox=\\"0 0 24 26\\"><path d=\\"M0 0h24v24H0z\\" fill=\\"none\\"/><path d=\\"M16.5 13c-1.2 0-3.07.34-4.5 1-1.43-.67-3.3-1-4.5-1C5.33 13 1 14.08 1 16.25V19h22v-2.75c0-2.17-4.33-3.25-6.5-3.25zm-4 4.5h-10v-1.25c0-.54 2.56-1.75 5-1.75s5 1.21 5 1.75v1.25zm9 0H14v-1.25c0-.46-.2-.86-.52-1.22.88-.3 1.96-.53 3.02-.53 2.44 0 5 1.21 5 1.75v1.25zM7.5 12c1.93 0 3.5-1.57 3.5-3.5S9.43 5 7.5 5 4 6.57 4 8.5 5.57 12 7.5 12zm0-5.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 5.5c1.93 0 3.5-1.57 3.5-3.5S18.43 5 16.5 5 13 6.57 13 8.5s1.57 3.5 3.5 3.5zm0-5.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z\\"/></svg>","System":"<svg viewBox=\\"0 0 24 26\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M20,18c1.1,0,2-0.9,2-2V6c0-1.1-0.9-2-2-2H4C2.9,4,2,4.9,2,6v10c0,1.1,0.9,2,2,2H0v2h24v-2H20z M4,6h16v10H4V6z\\"/></svg>"},"workObjects":{"Document":"<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 26\\"><path fill=\\"none\\" d=\\"M0 0h24v24H0V0z\\"/><path d=\\"M8 16h8v2H8zm0-4h8v2H8zm6-10H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z\\"/></svg>","Folder":"<svg viewBox=\\"0 0 24 26\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path fill=\\"none\\" d=\\"M0,0h24v24H0V0z\\"/><path d=\\"M9.17,6l2,2H20v10L4,18V6H9.17 M10,4H4C2.9,4,2.01,4.9,2.01,6L2,18c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V8c0-1.1-0.9-2-2-2 h-8L10,4L10,4z\\"/></svg>","Call":"<svg viewBox=\\"0 0 24 26\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path fill=\\"none\\" d=\\"M0,0h24v24H0V0z\\"/><path d=\\"M6.54,5C6.6,5.89,6.75,6.76,6.99,7.59l-1.2,1.2C5.38,7.59,5.12,6.32,5.03,5H6.54 M16.4,17.02c0.85,0.24,1.72,0.39,2.6,0.45 v1.49c-1.32-0.09-2.59-0.35-3.8-0.75L16.4,17.02 M7.5,3H4C3.45,3,3,3.45,3,4c0,9.39,7.61,17,17,17c0.55,0,1-0.45,1-1v-3.49\\tc0-0.55-0.45-1-1-1c-1.24,0-2.45-0.2-3.57-0.57c-0.1-0.04-0.21-0.05-0.31-0.05c-0.26,0-0.51,0.1-0.71,0.29l-2.2,2.2 c-2.83-1.45-5.15-3.76-6.59-6.59l2.2-2.2C9.1,8.31,9.18,7.92,9.07,7.57C8.7,6.45,8.5,5.25,8.5,4C8.5,3.45,8.05,3,7.5,3L7.5,3z\\"/></svg>","Email":"<svg viewBox=\\"0 0 24 26\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path fill=\\"none\\" d=\\"M0,0h24v24H0V0z\\"/><path fill-opacity=\\"0.9\\" d=\\"M12,1.95c-5.52,0-10,4.48-10,10s4.48,10,10,10h5v-2h-5c-4.34,0-8-3.66-8-8s3.66-8,8-8s8,3.66,8,8v1.43 c0,0.79-0.71,1.57-1.5,1.57S17,14.17,17,13.38v-1.43c0-2.76-2.24-5-5-5s-5,2.24-5,5s2.24,5,5,5c1.38,0,2.64-0.56,3.54-1.47 c0.65,0.89,1.77,1.47,2.96,1.47c1.97,0,3.5-1.6,3.5-3.57v-1.43C22,6.43,17.52,1.95,12,1.95z M12,14.95c-1.66,0-3-1.34-3-3 s1.34-3,3-3s3,1.34,3,3S13.66,14.95,12,14.95z\\"/></svg>","Conversation":"<svg height=\\"48\\" viewBox=\\"0 0 24 26\\" width=\\"48\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M0 0h24v24H0V0z\\" fill=\\"none\\"/><path d=\\"M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z\\"/></svg>","Info":"<svg height=\\"48\\" viewBox=\\"0 0 24 26\\" width=\\"48\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M0 0h24v24H0z\\" fill=\\"none\\"/><path d=\\"M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z\\"/></svg>"}}'
);
var jt;
let yg = (jt = class {
  constructor(e, n) {
    this.elementRegistryService = e, this.iconSetImportExportService = n;
  }
  export() {
    const e = this.getStory(), n = this.createConfigAndDST(e);
    return JSON.stringify(n, null, 2);
  }
  getStory() {
    const e = this.elementRegistryService.createObjectListForDSTDownload().map((n) => n.businessObject).sort((n, i) => n.id !== void 0 && i.id !== void 0 ? n.id.localeCompare(i.id) : 0);
    return e.push({ info: "" }), e.push({ version: "3.0.0" }), e;
  }
  createConfigAndDST(e) {
    return new gg(
      this.iconSetImportExportService.getCurrentConfigurationForExport(),
      e
    );
  }
}, jt.$inject = [
  "domainStoryElementRegistryService",
  "domainStoryIconSetImportExportService"
], jt);
const vg = {
  __depends__: [ot, Xt],
  __init__: ["domainStoryExportService"],
  domainStoryExportService: ["type", yg]
};
class mg {
  checkForUnreferencedElementsInActivitiesAndRepair(e) {
    const n = [], i = [];
    let r = !0;
    return e.forEach((o) => {
      const s = o.type;
      s === S.ACTIVITY || s === S.CONNECTION ? n.push(o) : i.push(o.id);
    }), n.forEach((o) => {
      const s = o.source, a = o.target;
      if (!i.includes(s) || !i.includes(a)) {
        r = !1;
        const c = e.indexOf(o);
        e = e.splice(c, 1);
      }
    }), r;
  }
  /**
   * Ensure backwards compatibility.
   * Previously Document had no special name and was just addressed as workObject
   * Bubble was renamed to Conversation
   */
  updateCustomElementsPreviousV050(e) {
    for (const n of e)
      n.type === S.WORKOBJECT ? n.type = S.WORKOBJECT + "Document" : n.type === S.WORKOBJECT + "Bubble" && (n.type = S.WORKOBJECT + "Conversation");
    return e;
  }
  // Early versions of Egon allowed Whitespaces in Icon names which are now not supported anymore.
  // To find the right icon in the dictionary, they need to be replaced.
  removeWhitespacesFromIcons(e) {
    e.forEach((n) => {
      n.type && (n.type = n.type.replace(/ /g, "-"));
    });
  }
  removeUnnecessaryBpmnProperties(e) {
    e.forEach((n) => {
      n.$type && (n.$type = void 0), n.$descriptor && (n.$descriptor = void 0), n.di && (n.di = void 0);
    });
  }
}
const _g = "data:image/png;base64,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";
function xg(t) {
  return W`
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
            <img src=${_g} alt="Egon.io Logo" style="height: 32px; width: auto;" />
            <span style="font-size: 14px; font-weight: 500; color: #333;">
                Version ${t.version}
            </span>
        </div>
    `;
}
var Dt;
let bg = (Dt = class {
  constructor(e, n, i, r, o, s) {
    this.eventBus = e, this.canvas = n, this.elementRegistry = i, this.elementFactory = r, this.iconDictionaryService = o, this.iconSetImportExportService = s, this.elements = [], this.groupElements = [], this.importRepairService = new mg();
  }
  /**
   * @throws Error if import fails
   * @param story
   */
  import(e) {
    const n = JSON.parse(e);
    let i = n.dst;
    const r = n.domain, o = this.iconSetImportExportService.createIconSetConfiguration(r);
    if (this.importRepairService.removeWhitespacesFromIcons(i), this.importRepairService.removeUnnecessaryBpmnProperties(i), this.importRepairService.checkForUnreferencedElementsInActivitiesAndRepair(
      i
    ), this.eventBus.fire("diagram.clear", {}), !L(i))
      throw new Error("argument must be an array");
    let s = i[i.length - 1];
    if (!s.id) {
      s = i.pop();
      let l = s;
      l.version ? (s = i.pop(), l = l.version) : l = "?", i = this.handleVersionNumber(
        l,
        i
      );
    }
    const a = [], c = [], u = [];
    i.forEach(function(l) {
      Eg(l) ? a.push(l) : Qi(l) ? c.push(l) : u.push(l);
    }), this.iconSetImportExportService.loadConfiguration(o), this.eventBus.fire("dst.config.changed", { iconSet: o }), c.forEach(this.createElementFromBusinessObject, this), u.forEach(this.createElementFromBusinessObject, this), a.forEach(this.addConnection, this);
  }
  createElementFromBusinessObject(e) {
    const n = e.parent;
    delete e.children, delete e.parent, this.elements.push(e);
    const i = T({ businessObject: e }, e), r = this.elementFactory.create("shape", i);
    if (Qi(e) && (this.groupElements[e.id] = r), n) {
      const o = this.groupElements[n];
      if (Qi(o))
        return this.canvas.addShape(r, o, Number(o.id));
    }
    return this.canvas.addShape(r);
  }
  // FIXME: use an actual type for element. It should be BusinessObject from the domain.
  addConnection(e) {
    this.elements.push(e);
    const n = T({ businessObject: e }, e);
    if (e.source === void 0 || e.target === void 0)
      throw new Error("source and target must be defined");
    const i = this.elementFactory.create(
      "connection",
      T(n, {
        source: this.elementRegistry.get(e.source),
        target: this.elementRegistry.get(e.target)
      })
      // this.elementRegistry.get(element.source!.id).parent,
    );
    return this.canvas.addConnection(i);
  }
  handleVersionNumber(e, n) {
    +e.substring(
      0,
      e.lastIndexOf(".")
    ) <= 0.5 && (n = this.importRepairService.updateCustomElementsPreviousV050(n));
    const r = document.getElementById("egon-io-container");
    return r && Hi(
      W` <${xg} version=${e} />`,
      r
    ), n;
  }
}, Dt.$inject = [
  "eventBus",
  "canvas",
  "elementRegistry",
  "elementFactory",
  "domainStoryIconDictionaryService",
  "domainStoryIconSetImportExportService"
], Dt);
function Eg(t) {
  return t.type === S.ACTIVITY || t.type === S.CONNECTION;
}
function Qi(t) {
  return t && t.type === S.GROUP;
}
const wg = {
  __init__: ["domainStoryImportService"],
  domainStoryImportService: ["type", bg]
}, Sg = [
  Pa,
  Gr,
  Xu,
  Qu,
  nl,
  Nl,
  Cd,
  kd,
  Wd,
  Ru
], Ag = [
  Sc,
  qh,
  Qt,
  hf,
  Qp,
  If,
  Mp,
  qp,
  sg,
  dg,
  pg,
  vg,
  wg
], jg = {
  __depends__: [...Ag, ...Sg]
};
export {
  Q as D,
  jg as E,
  fr as I,
  Vp as L,
  S as a,
  Zi as b,
  bg as c,
  yg as d,
  fh as e,
  hr as f
};
