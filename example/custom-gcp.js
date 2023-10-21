"use strict";
Object.defineProperty(exports, "__esModule", { value: !0 }),
  Object.defineProperty(exports, "default", {
    enumerable: !0,
    get: function () {
      return h;
    },
  });
var t = require("@tkow/syncenv");
function e(t, e) {
  (null == e || e > t.length) && (e = t.length);
  for (var r = 0, n = Array(e); r < e; r++) n[r] = t[r];
  return n;
}
function r(t) {
  if (void 0 === t)
    throw ReferenceError(
      "this hasn't been initialised - super() hasn't been called"
    );
  return t;
}
function n(t, e, r, n, o, u, i) {
  try {
    var c = t[u](i),
      a = c.value;
  } catch (t) {
    r(t);
    return;
  }
  c.done ? e(a) : Promise.resolve(a).then(n, o);
}
function o(t, e) {
  if (!(t instanceof e)) throw TypeError("Cannot call a class as a function");
}
function u(t, e, r) {
  return (u = y()
    ? Reflect.construct
    : function (t, e, r) {
        var n = [null];
        n.push.apply(n, e);
        var o = new (Function.bind.apply(t, n))();
        return r && f(o, r.prototype), o;
      }).apply(null, arguments);
}
function i(t, e) {
  for (var r = 0; r < e.length; r++) {
    var n = e[r];
    (n.enumerable = n.enumerable || !1),
      (n.configurable = !0),
      "value" in n && (n.writable = !0),
      Object.defineProperty(t, n.key, n);
  }
}
function c(t, e, r) {
  return e && i(t.prototype, e), r && i(t, r), t;
}
function a(t, e, r) {
  return (
    e in t
      ? Object.defineProperty(t, e, {
          value: r,
          enumerable: !0,
          configurable: !0,
          writable: !0,
        })
      : (t[e] = r),
    t
  );
}
function l(t) {
  return (l = Object.setPrototypeOf
    ? Object.getPrototypeOf
    : function (t) {
        return t.__proto__ || Object.getPrototypeOf(t);
      })(t);
}
function f(t, e) {
  return (f =
    Object.setPrototypeOf ||
    function (t, e) {
      return (t.__proto__ = e), t;
    })(t, e);
}
function s(t, r) {
  return (
    (function (t) {
      if (Array.isArray(t)) return t;
    })(t) ||
    (function (t, e) {
      var r,
        n,
        o =
          null == t
            ? null
            : ("undefined" != typeof Symbol && t[Symbol.iterator]) ||
              t["@@iterator"];
      if (null != o) {
        var u = [],
          i = !0,
          c = !1;
        try {
          for (
            o = o.call(t);
            !(i = (r = o.next()).done) &&
            (u.push(r.value), !e || u.length !== e);
            i = !0
          );
        } catch (t) {
          (c = !0), (n = t);
        } finally {
          try {
            i || null == o.return || o.return();
          } finally {
            if (c) throw n;
          }
        }
        return u;
      }
    })(t, r) ||
    (function (t, r) {
      if (t) {
        if ("string" == typeof t) return e(t, r);
        var n = Object.prototype.toString.call(t).slice(8, -1);
        if (
          ("Object" === n && t.constructor && (n = t.constructor.name),
          "Map" === n || "Set" === n)
        )
          return Array.from(n);
        if (
          "Arguments" === n ||
          /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)
        )
          return e(t, r);
      }
    })(t, r) ||
    (function () {
      throw TypeError(
        "Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
      );
    })()
  );
}
function p(t) {
  var e = "function" == typeof Map ? new Map() : void 0;
  return (p = function (t) {
    if (null === t || -1 === Function.toString.call(t).indexOf("[native code]"))
      return t;
    if ("function" != typeof t)
      throw TypeError("Super expression must either be null or a function");
    if (void 0 !== e) {
      if (e.has(t)) return e.get(t);
      e.set(t, r);
    }
    function r() {
      return u(t, arguments, l(this).constructor);
    }
    return (
      (r.prototype = Object.create(t.prototype, {
        constructor: {
          value: r,
          enumerable: !1,
          writable: !0,
          configurable: !0,
        },
      })),
      f(r, t)
    );
  })(t);
}
function y() {
  if (
    "undefined" == typeof Reflect ||
    !Reflect.construct ||
    Reflect.construct.sham
  )
    return !1;
  if ("function" == typeof Proxy) return !0;
  try {
    return (
      Boolean.prototype.valueOf.call(
        Reflect.construct(Boolean, [], function () {})
      ),
      !0
    );
  } catch (t) {
    return !1;
  }
}
var b = (function () {
    "use strict";
    function t() {
      o(this, t), a(this, "current", 0);
    }
    return (
      c(t, [
        {
          key: "genRandomStr",
          value: function () {
            return this.current++, "gcpcall" + this.current;
          },
        },
        {
          key: "accessSecretVersion",
          value: function (t, e, r) {
            return Promise.resolve([
              { payload: { data: this.genRandomStr() } },
              { name: "dummy" },
              {},
            ]);
          },
        },
      ]),
      t
    );
  })(),
  h = (function (t) {
    "use strict";
    !(function (t, e) {
      if ("function" != typeof e && null !== e)
        throw TypeError("Super expression must either be null or a function");
      (t.prototype = Object.create(e && e.prototype, {
        constructor: { value: t, writable: !0, configurable: !0 },
      })),
        e && f(t, e);
    })(i, t);
    var e,
      u =
        ((e = y()),
        function () {
          var t,
            n,
            o = l(i);
          if (e) {
            var u = l(this).constructor;
            n = Reflect.construct(o, arguments, u);
          } else n = o.apply(this, arguments);
          return (t = n) &&
            ("object" ==
              (t && "undefined" != typeof Symbol && t.constructor === Symbol
                ? "symbol"
                : typeof t) ||
              "function" == typeof t)
            ? t
            : r(this);
        });
    function i() {
      var t,
        e =
          arguments.length > 0 && void 0 !== arguments[0]
            ? arguments[0]
            : new b();
      return (
        o(this, i),
        a(r((t = u.call(this))), "client", void 0),
        (t.client = e),
        t
      );
    }
    return (
      c(i, [
        {
          key: "fetchValues",
          value: function (t, e) {
            var r,
              o = this;
            return ((r = function () {
              var e, r, n, u, i, c, a, l, f, p, y, b, h;
              return (function (t, e) {
                var r,
                  n,
                  o,
                  u,
                  i = {
                    label: 0,
                    sent: function () {
                      if (1 & o[0]) throw o[1];
                      return o[1];
                    },
                    trys: [],
                    ops: [],
                  };
                return (
                  (u = { next: c(0), throw: c(1), return: c(2) }),
                  "function" == typeof Symbol &&
                    (u[Symbol.iterator] = function () {
                      return this;
                    }),
                  u
                );
                function c(u) {
                  return function (c) {
                    return (function (u) {
                      if (r) throw TypeError("Generator is already executing.");
                      for (; i; )
                        try {
                          if (
                            ((r = 1),
                            n &&
                              (o =
                                2 & u[0]
                                  ? n.return
                                  : u[0]
                                  ? n.throw || ((o = n.return) && o.call(n), 0)
                                  : n.next) &&
                              !(o = o.call(n, u[1])).done)
                          )
                            return o;
                          switch (
                            ((n = 0), o && (u = [2 & u[0], o.value]), u[0])
                          ) {
                            case 0:
                            case 1:
                              o = u;
                              break;
                            case 4:
                              return i.label++, { value: u[1], done: !1 };
                            case 5:
                              i.label++, (n = u[1]), (u = [0]);
                              continue;
                            case 7:
                              (u = i.ops.pop()), i.trys.pop();
                              continue;
                            default:
                              if (
                                !(o =
                                  (o = i.trys).length > 0 && o[o.length - 1]) &&
                                (6 === u[0] || 2 === u[0])
                              ) {
                                i = 0;
                                continue;
                              }
                              if (
                                3 === u[0] &&
                                (!o || (u[1] > o[0] && u[1] < o[3]))
                              ) {
                                i.label = u[1];
                                break;
                              }
                              if (6 === u[0] && i.label < o[1]) {
                                (i.label = o[1]), (o = u);
                                break;
                              }
                              if (o && i.label < o[2]) {
                                (i.label = o[2]), i.ops.push(u);
                                break;
                              }
                              o[2] && i.ops.pop(), i.trys.pop();
                              continue;
                          }
                          u = e.call(t, i);
                        } catch (t) {
                          (u = [6, t]), (n = 0);
                        } finally {
                          r = o = 0;
                        }
                      if (5 & u[0]) throw u[1];
                      return { value: u[0] ? u[1] : void 0, done: !0 };
                    })([u, c]);
                  };
                }
              })(this, function (v) {
                switch (v.label) {
                  case 0:
                    (e = {}), (r = !0), (n = !1), (u = void 0), (v.label = 1);
                  case 1:
                    v.trys.push([1, 6, 7, 8]),
                      (i = Object.entries(t)[Symbol.iterator]()),
                      (v.label = 2);
                  case 2:
                    if ((r = (c = i.next()).done)) return [3, 5];
                    return (
                      (l = (a = s(c.value, 2))[0]),
                      (f = a[1]),
                      [4, o.client.accessSecretVersion({ name: f })]
                    );
                  case 3:
                    (b =
                      null ===
                        (y = s.apply(void 0, [v.sent(), 1])[0].payload) ||
                      void 0 === y
                        ? void 0
                        : null === (p = y.data) || void 0 === p
                        ? void 0
                        : p.toString()) ||
                      console.warn("Cannot access gcp secret ".concat(f)),
                      (e[l] = b || ""),
                      (v.label = 4);
                  case 4:
                    return (r = !0), [3, 2];
                  case 5:
                    return [3, 8];
                  case 6:
                    return (h = v.sent()), (n = !0), (u = h), [3, 8];
                  case 7:
                    try {
                      r || null == i.return || i.return();
                    } finally {
                      if (n) throw u;
                    }
                    return [7];
                  case 8:
                    return [2, e];
                }
              });
            }),
            function () {
              var t = this,
                e = arguments;
              return new Promise(function (o, u) {
                var i = r.apply(t, e);
                function c(t) {
                  n(i, o, u, c, a, "next", t);
                }
                function a(t) {
                  n(i, o, u, c, a, "throw", t);
                }
                c(void 0);
              });
            })();
          },
        },
      ]),
      i
    );
  })(p(t.Plugin));
a(h, "pluginId", "gcp");
