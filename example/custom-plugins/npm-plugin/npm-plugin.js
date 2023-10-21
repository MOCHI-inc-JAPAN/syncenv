"use strict";
Object.defineProperty(exports, "__esModule", { value: !0 }),
  Object.defineProperty(exports, "default", {
    enumerable: !0,
    get: function () {
      return f;
    },
  });
var t,
  e = require("@tkow/syncenv");
function r(t, e) {
  (null == e || e > t.length) && (e = t.length);
  for (var r = 0, n = Array(e); r < e; r++) n[r] = t[r];
  return n;
}
function n(t, e, r, n, o, u, i) {
  try {
    var c = t[u](i),
      l = c.value;
  } catch (t) {
    r(t);
    return;
  }
  c.done ? e(l) : Promise.resolve(l).then(n, o);
}
function o(t, e, r) {
  return (o = a()
    ? Reflect.construct
    : function (t, e, r) {
        var n = [null];
        n.push.apply(n, e);
        var o = new (Function.bind.apply(t, n))();
        return r && c(o, r.prototype), o;
      }).apply(null, arguments);
}
function u(t, e) {
  for (var r = 0; r < e.length; r++) {
    var n = e[r];
    (n.enumerable = n.enumerable || !1),
      (n.configurable = !0),
      "value" in n && (n.writable = !0),
      Object.defineProperty(t, n.key, n);
  }
}
function i(t) {
  return (i = Object.setPrototypeOf
    ? Object.getPrototypeOf
    : function (t) {
        return t.__proto__ || Object.getPrototypeOf(t);
      })(t);
}
function c(t, e) {
  return (c =
    Object.setPrototypeOf ||
    function (t, e) {
      return (t.__proto__ = e), t;
    })(t, e);
}
function l(t) {
  var e = "function" == typeof Map ? new Map() : void 0;
  return (l = function (t) {
    if (null === t || -1 === Function.toString.call(t).indexOf("[native code]"))
      return t;
    if ("function" != typeof t)
      throw TypeError("Super expression must either be null or a function");
    if (void 0 !== e) {
      if (e.has(t)) return e.get(t);
      e.set(t, r);
    }
    function r() {
      return o(t, arguments, i(this).constructor);
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
      c(r, t)
    );
  })(t);
}
function a() {
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
var f = (function (t) {
  "use strict";
  !(function (t, e) {
    if ("function" != typeof e && null !== e)
      throw TypeError("Super expression must either be null or a function");
    (t.prototype = Object.create(e && e.prototype, {
      constructor: { value: t, writable: !0, configurable: !0 },
    })),
      e && c(t, e);
  })(p, t);
  var e,
    o,
    l,
    f =
      ((e = a()),
      function () {
        var t,
          r,
          n = i(p);
        if (e) {
          var o = i(this).constructor;
          r = Reflect.construct(n, arguments, o);
        } else r = n.apply(this, arguments);
        return (t = r) &&
          ("object" ==
            (t && "undefined" != typeof Symbol && t.constructor === Symbol
              ? "symbol"
              : typeof t) ||
            "function" == typeof t)
          ? t
          : (function (t) {
              if (void 0 === t)
                throw ReferenceError(
                  "this hasn't been initialised - super() hasn't been called"
                );
              return t;
            })(this);
      });
  function p() {
    return (
      !(function (t, e) {
        if (!(t instanceof e))
          throw TypeError("Cannot call a class as a function");
      })(this, p),
      f.call(this)
    );
  }
  return (
    (o = [
      {
        key: "fetchValues",
        value: function (t, e) {
          var o;
          return ((o = function () {
            var e, n, o, u, i, c, l, a, f;
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
            })(this, function (p) {
              (e = {}), (n = !0), (o = !1), (u = void 0);
              try {
                for (
                  i = Object.entries(t)[Symbol.iterator]();
                  !(n = (c = i.next()).done);
                  n = !0
                ) {
                  var s;
                  (s = c.value),
                    (a = (l =
                      (function (t) {
                        if (Array.isArray(t)) return t;
                      })(s) ||
                      (function (t, e) {
                        var r,
                          n,
                          o =
                            null == t
                              ? null
                              : ("undefined" != typeof Symbol &&
                                  t[Symbol.iterator]) ||
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
                      })(s, 2) ||
                      (function (t, e) {
                        if (t) {
                          if ("string" == typeof t) return r(t, e);
                          var n = Object.prototype.toString
                            .call(t)
                            .slice(8, -1);
                          if (
                            ("Object" === n &&
                              t.constructor &&
                              (n = t.constructor.name),
                            "Map" === n || "Set" === n)
                          )
                            return Array.from(n);
                          if (
                            "Arguments" === n ||
                            /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)
                          )
                            return r(t, e);
                        }
                      })(s, 2) ||
                      (function () {
                        throw TypeError(
                          "Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
                        );
                      })())[0]),
                    (f = l[1]),
                    (e[a] = "npm-" + f);
                }
              } catch (t) {
                (o = !0), (u = t);
              } finally {
                try {
                  n || null == i.return || i.return();
                } finally {
                  if (o) throw u;
                }
              }
              return [2, e];
            });
          }),
          function () {
            var t = this,
              e = arguments;
            return new Promise(function (r, u) {
              var i = o.apply(t, e);
              function c(t) {
                n(i, r, u, c, l, "next", t);
              }
              function l(t) {
                n(i, r, u, c, l, "throw", t);
              }
              c(void 0);
            });
          })();
        },
      },
      {
        key: "loadPipes",
        value: function () {
          return [
            {
              pipeId: "npm-postfix",
              pipe: function (t, e) {
                return t + "-npm";
              },
            },
          ];
        },
      },
    ]),
    u(p.prototype, o),
    l && u(p, l),
    p
  );
})(l(e.Plugin));
(t = "pluginId") in f
  ? Object.defineProperty(f, t, {
      value: "npm",
      enumerable: !0,
      configurable: !0,
      writable: !0,
    })
  : (f[t] = "npm");
