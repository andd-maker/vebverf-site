/* @ds-bundle: {"namespace":"TorUI","components":[{"name":"BottomNav","sourcePath":"components/general/BottomNav/BottomNav.jsx"},{"name":"Button","sourcePath":"components/general/Button/Button.jsx"},{"name":"Card","sourcePath":"components/general/Card/Card.jsx"},{"name":"DriverCard","sourcePath":"components/general/DriverCard/DriverCard.jsx"},{"name":"ExtraWorkApproval","sourcePath":"components/general/ExtraWorkApproval/ExtraWorkApproval.jsx"},{"name":"Icon","sourcePath":"components/general/Icon/Icon.jsx"},{"name":"OrderTimeline","sourcePath":"components/general/OrderTimeline/OrderTimeline.jsx"},{"name":"PriceBreakdown","sourcePath":"components/general/PriceBreakdown/PriceBreakdown.jsx"},{"name":"SituationTile","sourcePath":"components/general/SituationTile/SituationTile.jsx"},{"name":"StatusPill","sourcePath":"components/general/StatusPill/StatusPill.jsx"},{"name":"TorRoot","sourcePath":"components/general/TorRoot/TorRoot.jsx"}],"sourceHashes":{"components/general/BottomNav/BottomNav.jsx":"fbbcae5425d0","components/general/BottomNav/BottomNav.d.ts":"3a304f92aab7","components/general/BottomNav/BottomNav.prompt.md":"80133010c20d","components/general/Button/Button.jsx":"7c64f1712732","components/general/Button/Button.d.ts":"7ca07a0d2f50","components/general/Button/Button.prompt.md":"24dbdd6ef701","components/general/Card/Card.jsx":"58e00985b7a3","components/general/Card/Card.d.ts":"4d3d301c5744","components/general/Card/Card.prompt.md":"23ddbb8baaa1","components/general/DriverCard/DriverCard.jsx":"db975bfb7205","components/general/DriverCard/DriverCard.d.ts":"4c62d62b88a2","components/general/DriverCard/DriverCard.prompt.md":"9d8db2545cf2","components/general/ExtraWorkApproval/ExtraWorkApproval.jsx":"e64e184e652f","components/general/ExtraWorkApproval/ExtraWorkApproval.d.ts":"a7ba017e7b9f","components/general/ExtraWorkApproval/ExtraWorkApproval.prompt.md":"67b3166fe39f","components/general/Icon/Icon.jsx":"7906b1f643dd","components/general/Icon/Icon.d.ts":"86c5f017c220","components/general/Icon/Icon.prompt.md":"b6d153646a96","components/general/OrderTimeline/OrderTimeline.jsx":"8113760ab955","components/general/OrderTimeline/OrderTimeline.d.ts":"47b679f6b9d6","components/general/OrderTimeline/OrderTimeline.prompt.md":"4b1bd2fb8f14","components/general/PriceBreakdown/PriceBreakdown.jsx":"dc929ef590d2","components/general/PriceBreakdown/PriceBreakdown.d.ts":"6011b234ea2d","components/general/PriceBreakdown/PriceBreakdown.prompt.md":"389d91ae2919","components/general/SituationTile/SituationTile.jsx":"8d35ddf6c8d6","components/general/SituationTile/SituationTile.d.ts":"7066084473fe","components/general/SituationTile/SituationTile.prompt.md":"d7481de97cf4","components/general/StatusPill/StatusPill.jsx":"0c90656bb559","components/general/StatusPill/StatusPill.d.ts":"5533abdec439","components/general/StatusPill/StatusPill.prompt.md":"1bcf48f6a16f","components/general/TorRoot/TorRoot.jsx":"24f86660bf38","components/general/TorRoot/TorRoot.d.ts":"8c90d04d2655","components/general/TorRoot/TorRoot.prompt.md":"97355bbd2da5"},"inlinedExternals":[],"builtBy":"cc-design-sync"} */
"use strict";
var TorUI = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // <define:import.meta.env>
  var init_define_import_meta_env = __esm({
    "<define:import.meta.env>"() {
    }
  });

  // shim:react-shim
  var require_react_shim = __commonJS({
    "shim:react-shim"(exports, module) {
      init_define_import_meta_env();
      var R = window.React;
      function np(p, k) {
        var o = {};
        for (var x in p) if (x !== "children") o[x] = p[x];
        if (k !== void 0) o.key = k;
        return o;
      }
      function jsx3(t, p, k) {
        var c = p && p.children;
        return c === void 0 ? R.createElement(t, np(p, k)) : R.createElement(t, np(p, k), c);
      }
      function jsxs2(t, p, k) {
        return R.createElement.apply(R, [t, np(p, k)].concat(p.children));
      }
      module.exports = R;
      module.exports.jsx = jsx3;
      module.exports.jsxs = jsxs2;
      module.exports.jsxDEV = function(t, p, k, s) {
        return (s ? jsxs2 : jsx3)(t, p, k);
      };
      module.exports.Fragment = R.Fragment;
    }
  });

  // dist/index.js
  var index_exports = {};
  __export(index_exports, {
    BottomNav: () => BottomNav,
    Button: () => Button,
    Card: () => Card,
    DriverCard: () => DriverCard,
    ExtraWorkApproval: () => ExtraWorkApproval,
    Icon: () => Icon,
    OrderTimeline: () => OrderTimeline,
    PriceBreakdown: () => PriceBreakdown,
    SituationTile: () => SituationTile,
    StatusPill: () => StatusPill,
    TorRoot: () => TorRoot
  });
  init_define_import_meta_env();
  var import_jsx_runtime = __toESM(require_react_shim(), 1);
  var import_jsx_runtime2 = __toESM(require_react_shim(), 1);
  var PATHS = {
    phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
    engine: "M4 10h2l2-3h6l2 3h2v3h2v-2h1v6h-1v-2h-2v3h-4l-2 2H8l-2-3H4z",
    crash: "M3 15l3-6h7l3 6M3 15h13v3H3zM6 18v1M13 18v1M18 5l3 3M21 5l-3 3M17 11h4",
    ditch: "M2 8h6l6 9h8M7 13l3-1 1 3-3 1zM16 6v3M14 7.5h4",
    flip: "M4 9h12l2 4H6zM7 13v2M15 13v2M4 19h16M19 5a6 6 0 0 1 0 6M17 5h2v2",
    home: "M4 11l8-6 8 6v8h-5v-5H9v5H4z",
    list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
    calc: "M6 3h12v18H6zM9 7h6M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01",
    pin: "M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
    back: "M15 5l-7 7 7 7",
    info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01",
    chat: "M4 5h16v11H9l-5 4z",
    wrench: "M14.5 6.5a4 4 0 0 0 5 5L12 19l-3 1 1-3 7.5-7.5zM14.5 6.5L17 4",
    truck: "M2 7h11v9H2zM13 10h4l3 3v3h-7zM6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
  };
  function Icon({ name, size = 22, className }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { className: "tor-icon" + (className ? " " + className : ""), width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: PATHS[name] }) });
  }
  var cx = (...a) => a.filter(Boolean).join(" ");
  function TorRoot({ theme = "dark", children, style }) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: cx("tor-root", theme === "light" ? "t-light" : "t-dark"), style, children });
  }
  function Button({ variant = "primary", size = "md", block, disabled, icon, onClick, children }) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      "button",
      {
        type: "button",
        disabled,
        onClick,
        className: cx("tor-btn", `tor-btn--${variant}`, size === "sm" && "tor-btn--sm", block && "tor-btn--block"),
        children: [
          icon && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { name: icon, size: 20 }),
          children
        ]
      }
    );
  }
  function StatusPill({ status = "free", children }) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: cx("tor-pill", status !== "free" && `tor-pill--${status}`), children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("i", { className: "tor-pill__dot" }),
      children
    ] });
  }
  function Card({ title, padded = true, children }) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "tor-card", children: padded ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "tor-card__body", children: [
      title && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { className: "tor-card__title", children: title }),
      children
    ] }) : children });
  }
  function SituationTile({ icon, title, hint, selected, onClick }) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: cx("tor-tile", selected && "tor-tile--selected"), onClick, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { name: icon }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: title }),
        hint && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("small", { children: hint })
      ] })
    ] });
  }
  var rub = (v) => Math.round(v).toLocaleString("ru-RU").replace(/,/g, " ") + " \u20BD";
  function PriceBreakdown({ lines, total, from, note }) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "tor-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "tor-price__rows", children: lines.map((l, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: cx("tor-price__row", l.muted && "tor-price__row--muted"), children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: l.label }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: rub(l.amount) })
      ] }, i)) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "tor-price__total", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u0418\u0442\u043E\u0433\u043E" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("b", { children: [
          from ? "\u043E\u0442 " : "",
          rub(total)
        ] })
      ] }),
      note && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "tor-price__note", children: note })
    ] });
  }
  function OrderTimeline({ steps }) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "tor-tl", children: steps.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: cx("tor-tl__s", `tor-tl__s--${s.state}`), children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("i", { className: "tor-tl__c" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: s.label }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("time", { children: s.time })
    ] }, i)) });
  }
  function DriverCard({ name, vehicle, onCall, onChat }) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "tor-drv", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "tor-drv__ava", children: name.slice(0, 1) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "tor-drv__who", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: name }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("small", { children: vehicle })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "tor-iconbtn", "aria-label": "\u0427\u0430\u0442", onClick: onChat, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { name: "chat" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "tor-iconbtn", "aria-label": "\u041F\u043E\u0437\u0432\u043E\u043D\u0438\u0442\u044C", onClick: onCall, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { name: "phone" }) })
    ] });
  }
  function ExtraWorkApproval({ work, price, state = "pending", onApprove, onDecline }) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "tor-ask", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "tor-ask__q", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: work }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("small", { children: "\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C \u043F\u0440\u0435\u0434\u043B\u0430\u0433\u0430\u0435\u0442 \u0434\u043E\u043F. \u0440\u0430\u0431\u043E\u0442\u0443" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "tor-ask__price", children: rub(price) })
      ] }),
      state === "pending" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "tor-ask__two", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Button, { size: "sm", onClick: onApprove, children: "\u0421\u043E\u0433\u043B\u0430\u0441\u0435\u043D" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Button, { size: "sm", variant: "secondary", onClick: onDecline, children: "\u041D\u0435\u0442" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "tor-ask__done", children: state === "approved" ? "\u0412\u044B \u0441\u043E\u0433\u043B\u0430\u0441\u0438\u043B\u0438\u0441\u044C \u2014 \u0440\u0430\u0431\u043E\u0442\u0430 \u0432\u043E\u0439\u0434\u0451\u0442 \u0432 \u0438\u0442\u043E\u0433" : "\u0412\u044B \u043E\u0442\u043A\u0430\u0437\u0430\u043B\u0438\u0441\u044C \u2014 \u0431\u0435\u0437 \u044D\u0442\u043E\u0439 \u0440\u0430\u0431\u043E\u0442\u044B" })
    ] });
  }
  function BottomNav({ items, active, onSelect }) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("nav", { className: "tor-nav", children: items.map((it) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: cx("tor-nav__item", it.key === active && "tor-nav__item--active"), onClick: () => onSelect?.(it.key), children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { name: it.icon }),
      it.label
    ] }, it.key)) });
  }
  return __toCommonJS(index_exports);
})();
window.TorUI=TorUI.__dsMainNs?Object.assign({},TorUI,TorUI.__dsMainNs,{__dsMainNs:undefined}):TorUI;
