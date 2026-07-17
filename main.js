/* StockerTV B2B — interactions */

/* Contact address — change this one line and every contact link on the page updates. */
var EMAIL = "iddo.etkin@gmail.com";

(function () {
  "use strict";

  var doc = document.documentElement;

  /* wire all contact links to the EMAIL constant */
  document.querySelectorAll("a[data-mailto]").forEach(function (a) {
    var subject = a.getAttribute("data-mailto");
    a.href = "mailto:" + EMAIL + (subject ? "?subject=" + encodeURIComponent(subject) : "");
    if (a.hasAttribute("data-mailto-text")) a.textContent = EMAIL;
  });
  doc.classList.remove("no-js");
  if (new URLSearchParams(location.search).has("noanim")) {
    doc.classList.add("no-anim");
  }

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var noAnim = doc.classList.contains("no-anim");

  /* ---------- sticky nav border ---------- */
  var nav = document.querySelector(".nav");
  var onScroll = function () {
    nav.classList.toggle("scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- scroll reveals ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !noAnim) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) { revealObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ---------- hero waveform (seamless loop, sum of sines) ---------- */
  var waveSvg = document.getElementById("wave-svg");
  if (waveSvg) {
    var W = 1600; // one tile width, matches CSS keyframe distance
    var H = 220;
    waveSvg.setAttribute("viewBox", "0 0 " + W * 2 + " " + H);

    var wave = function (x, amp, mid) {
      // periods all divide W so the tile loops seamlessly
      return mid +
        amp * Math.sin((x / W) * Math.PI * 6) +
        amp * 0.45 * Math.sin((x / W) * Math.PI * 14 + 1.4) +
        amp * 0.22 * Math.sin((x / W) * Math.PI * 22 + 0.6);
    };

    var buildPath = function (amp, mid, step) {
      var d = "M0," + wave(0, amp, mid).toFixed(1);
      for (var x = step; x <= W * 2; x += step) {
        d += " L" + x + "," + wave(x, amp, mid).toFixed(1);
      }
      return d;
    };

    var mkPath = function (cls, d, opacity, width) {
      var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", d);
      p.setAttribute("fill", "none");
      p.setAttribute("stroke", "#0E6B59");
      p.setAttribute("stroke-width", width);
      p.setAttribute("opacity", opacity);
      p.setAttribute("class", "wave-path " + cls);
      p.setAttribute("vector-effect", "non-scaling-stroke");
      waveSvg.appendChild(p);
    };

    mkPath("wave-a", buildPath(34, H * 0.52, 4), "0.5", "1.6");
    mkPath("wave-b", buildPath(50, H * 0.5, 4), "0.16", "1.2");
  }

  /* ---------- phone: lower third + progress on scroll ---------- */
  var phone = document.getElementById("phone");
  if (phone && "IntersectionObserver" in window && !noAnim) {
    var phoneObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          document.getElementById("lower-third").classList.add("is-in");
          document.getElementById("pv-progress").classList.add("is-in");
          phoneObs.disconnect();
        }
      });
    }, { threshold: 0.45 });
    phoneObs.observe(phone);
  } else if (phone) {
    document.getElementById("lower-third").classList.add("is-in");
    document.getElementById("pv-progress").classList.add("is-in");
  }

  /* ---------- widget theme toggle ---------- */
  var widget = document.getElementById("stv-widget");
  document.querySelectorAll(".tt-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      widget.setAttribute("data-theme", btn.dataset.themeChoice);
      document.querySelectorAll(".tt-btn").forEach(function (b) {
        var active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
    });
  });

  /* ---------- pipeline line draw ---------- */
  var pipe = document.getElementById("pipe");
  if (pipe && "IntersectionObserver" in window && !noAnim) {
    var pipeObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          pipe.classList.add("is-drawn");
          pipeObs.disconnect();
        }
      });
    }, { threshold: 0.25 });
    pipeObs.observe(pipe);
  } else if (pipe) {
    pipe.classList.add("is-drawn");
  }

  /* ---------- globe (cobe, lazy-loaded) ---------- */
  var globeWrap = document.getElementById("globe-wrap");
  var canvas = document.getElementById("globe-canvas");

  var webglAvailable = function () {
    try {
      var c = document.createElement("canvas");
      var gl = c.getContext("webgl") || c.getContext("experimental-webgl");
      if (!gl) return false;
      // software renderers draw cobe's shader incorrectly — use the static fallback
      var dbg = gl.getExtension("WEBGL_debug_renderer_info");
      if (dbg) {
        var renderer = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "");
        if (/swiftshader|llvmpipe|software/i.test(renderer)) return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  var useFallback = function () {
    globeWrap.classList.add("no-webgl");
  };

  var initGlobe = function () {
    import("https://cdn.jsdelivr.net/npm/cobe@0.6.4/+esm")
      .then(function (mod) {
        var createGlobe = mod.default;
        var size = globeWrap.getBoundingClientRect().width;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);

        var phi = 4.6; // start over the Atlantic: NY + Europe visible
        var pointerDown = null;
        var pointerPhi = 0;
        var velocity = 0;
        var visible = true;
        var baseSpeed = reducedMotion ? 0 : 0.0032;

        var globe = createGlobe(canvas, {
          devicePixelRatio: dpr,
          width: size * dpr,
          height: size * dpr,
          phi: phi,
          theta: 0.22,
          dark: 0,
          diffuse: 0.4,
          mapSamples: 16000,
          mapBrightness: 1.2,
          baseColor: [1, 1, 1],
          markerColor: [0.055, 0.42, 0.35],
          glowColor: [1, 1, 1],
          markers: [
            { location: [40.7128, -74.006], size: 0.1 },   // New York
            { location: [51.5074, -0.1278], size: 0.09 },  // London
            { location: [50.1109, 8.6821], size: 0.07 },   // Frankfurt
            { location: [32.0853, 34.7818], size: 0.07 },  // Tel Aviv
            { location: [22.3193, 114.1694], size: 0.08 }, // Hong Kong
            { location: [31.2304, 121.4737], size: 0.08 }, // Shanghai
            { location: [22.5431, 114.0579], size: 0.06 }, // Shenzhen
            { location: [35.6762, 139.6503], size: 0.09 }  // Tokyo
          ],
          onRender: function (state) {
            if (visible) {
              if (pointerDown === null) {
                phi += baseSpeed + velocity;
                velocity *= 0.93;
              }
              state.phi = phi + pointerPhi;
            }
            var s = globeWrap.getBoundingClientRect().width;
            state.width = s * dpr;
            state.height = s * dpr;
          }
        });

        canvas.classList.add("is-ready");

        /* drag to rotate */
        canvas.addEventListener("pointerdown", function (e) {
          pointerDown = e.clientX;
          canvas.classList.add("is-dragging");
          canvas.setPointerCapture(e.pointerId);
        });
        canvas.addEventListener("pointermove", function (e) {
          if (pointerDown !== null) {
            var delta = e.clientX - pointerDown;
            pointerPhi = delta * 0.005;
            velocity = (e.movementX || 0) * 0.002;
          }
        });
        var release = function () {
          if (pointerDown !== null) {
            phi += pointerPhi;
            pointerPhi = 0;
            pointerDown = null;
            canvas.classList.remove("is-dragging");
          }
        };
        canvas.addEventListener("pointerup", release);
        canvas.addEventListener("pointercancel", release);

        /* pause rendering math when offscreen */
        new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
        }, { threshold: 0 }).observe(globeWrap);

        window.addEventListener("pagehide", function () { globe.destroy(); }, { once: true });
      })
      .catch(useFallback);
  };

  if (globeWrap && canvas) {
    if (!webglAvailable()) {
      useFallback();
    } else if ("IntersectionObserver" in window) {
      var globeLazy = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          globeLazy.disconnect();
          initGlobe();
        }
      }, { rootMargin: "500px" });
      globeLazy.observe(globeWrap);
    } else {
      initGlobe();
    }
  }
})();
