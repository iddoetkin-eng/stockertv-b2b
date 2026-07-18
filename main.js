/* StockerTV B2B — interactions */

/* Contact address — change this one line and every contact link on the page updates. */
var EMAIL = "iddo.etkin@gmail.com";

(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.remove("no-js");
  if (new URLSearchParams(location.search).has("noanim")) {
    doc.classList.add("no-anim");
  }

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var noAnim = doc.classList.contains("no-anim");

  /* wire all contact links to the EMAIL constant */
  document.querySelectorAll("a[data-mailto]").forEach(function (a) {
    var subject = a.getAttribute("data-mailto");
    a.href = "mailto:" + EMAIL + (subject ? "?subject=" + encodeURIComponent(subject) : "");
    if (a.hasAttribute("data-mailto-text")) a.textContent = EMAIL;
  });

  /* ---------- shared: WebGL capability (software renderers excluded) ---------- */
  var webglAvailable = function () {
    try {
      var c = document.createElement("canvas");
      var gl = c.getContext("webgl") || c.getContext("experimental-webgl");
      if (!gl) return false;
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
  var gpuOk = webglAvailable();

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

  /* ---------- hero waveform band (seamless loop, sum of sines) ---------- */
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
      p.setAttribute("stroke", "#dedede");
      p.setAttribute("stroke-width", width);
      p.setAttribute("opacity", opacity);
      p.setAttribute("class", "wave-path " + cls);
      p.setAttribute("vector-effect", "non-scaling-stroke");
      waveSvg.appendChild(p);
    };

    mkPath("wave-a", buildPath(34, H * 0.52, 4), "0.5", "1.6");
    mkPath("wave-b", buildPath(50, H * 0.5, 4), "0.16", "1.2");
  }

  /* ---------- hero particle field (raw WebGL, silver on black) ---------- */
  var initHeroFx = function () {
    var canvas = document.getElementById("hero-fx");
    var hero = document.getElementById("hero");
    if (!canvas || !hero || noAnim || reducedMotion || !gpuOk) return; // static glow stays
    var gl = canvas.getContext("webgl", { alpha: true, antialias: false, powerPreference: "low-power" });
    if (!gl) return;

    var VS =
      "attribute vec2 aPos;\n" +
      "uniform float uT;\n" +
      "uniform float uDpr;\n" +
      "varying float vA;\n" +
      "void main() {\n" +
      "  float x = aPos.x;\n" +
      "  float r = aPos.y;\n" +
      "  float ph = r * 6.2831;\n" +
      "  float w = sin(x * 3.6 + uT * 0.42 + ph) * 0.5\n" +
      "          + sin(x * 7.3 - uT * 0.30 + ph * 2.0) * 0.24\n" +
      "          + sin(x * 13.0 + uT * 0.20 + ph * 3.0) * 0.12;\n" +
      "  float yBase = mix(-0.78, 0.78, r);\n" +
      "  gl_Position = vec4(x, yBase + w * 0.22, 0.0, 1.0);\n" +
      "  float centerFade = 1.0 - abs(yBase) * 0.8;\n" +
      "  vA = (0.06 + 0.19 * max(0.0, w + 0.35)) * centerFade;\n" +
      "  gl_PointSize = (1.2 + 1.7 * centerFade) * uDpr;\n" +
      "}";
    var FS =
      "precision mediump float;\n" +
      "varying float vA;\n" +
      "void main() {\n" +
      "  vec2 d = gl_PointCoord - vec2(0.5);\n" +
      "  float m = smoothstep(0.5, 0.15, length(d));\n" +
      "  gl_FragColor = vec4(0.87, 0.87, 0.87, 1.0) * (vA * m);\n" +
      "}";

    var mkShader = function (type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    var vs = mkShader(gl.VERTEX_SHADER, VS);
    var fs = mkShader(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    var COLS = 240, ROWS = 42;
    var pts = new Float32Array(COLS * ROWS * 2);
    var i = 0;
    for (var ry = 0; ry < ROWS; ry++) {
      for (var cx = 0; cx < COLS; cx++) {
        // deterministic jitter keeps the grid organic without Math.random
        var jx = ((cx * 7919 + ry * 104729) % 1000) / 1000 - 0.5;
        var jy = ((cx * 12007 + ry * 31337) % 1000) / 1000 - 0.5;
        pts[i++] = -1 + (2 * (cx + 0.5 + jx * 0.9)) / COLS;
        pts[i++] = (ry + 0.5 + jy * 0.8) / ROWS;
      }
    }
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, pts, gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uT = gl.getUniformLocation(prog, "uT");
    var uDpr = gl.getUniformLocation(prog, "uDpr");
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.clearColor(0, 0, 0, 0);

    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var resize = function () {
      var r = hero.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    var born = performance.now();
    var running = false;
    var heroVisible = true;
    var scrollFade = function () {
      return Math.max(0, 1 - window.scrollY / (hero.offsetHeight * 0.85));
    };
    var frame = function (now) {
      var op = Math.min(1, (now - born) / 1400) * scrollFade();
      canvas.style.opacity = op.toFixed(3);
      if (!heroVisible || document.hidden || op <= 0.005) {
        running = false;
        return;
      }
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT, now / 1000);
      gl.uniform1f(uDpr, dpr);
      gl.drawArrays(gl.POINTS, 0, COLS * ROWS);
      requestAnimationFrame(frame);
    };
    var ensure = function () {
      if (!running && heroVisible && !document.hidden && scrollFade() > 0.005) {
        running = true;
        requestAnimationFrame(frame);
      }
    };
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      ensure();
    }, { threshold: 0 }).observe(hero);
    document.addEventListener("visibilitychange", ensure);
    window.addEventListener("scroll", ensure, { passive: true });
    ensure();
  };
  if (document.readyState === "complete") {
    setTimeout(initHeroFx, 250);
  } else {
    window.addEventListener("load", function () { setTimeout(initHeroFx, 250); });
  }

  /* ---------- lazy video posters (keep them off the critical path) ---------- */
  var lazyVids = document.querySelectorAll("video[data-poster]");
  var setPoster = function (v) {
    if (!v.poster) v.poster = v.getAttribute("data-poster");
  };
  if ("IntersectionObserver" in window) {
    var posterObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          setPoster(en.target);
          posterObs.unobserve(en.target);
        }
      });
    }, { rootMargin: "700px" });
    lazyVids.forEach(function (v) { posterObs.observe(v); });
  } else {
    lazyVids.forEach(setPoster);
  }

  /* ---------- phone: real video feed ---------- */
  var feed = document.getElementById("phone-feed");
  if (feed) {
    var vids = [].slice.call(feed.querySelectorAll("video"));
    var soundBtn = document.getElementById("feed-sound");
    var soundOn = false;
    var phoneVisible = false;
    var activeVid = vids[0];

    var applySound = function () {
      vids.forEach(function (v) { v.muted = !soundOn; });
      soundBtn.classList.toggle("is-on", soundOn);
      soundBtn.textContent = soundOn ? "Sound on" : "Tap for sound";
      soundBtn.setAttribute("aria-pressed", String(soundOn));
    };

    var syncPlayback = function () {
      vids.forEach(function (v) {
        if (phoneVisible && v === activeVid && !reducedMotion && !noAnim && !document.hidden) {
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        } else if (!v.paused) {
          v.pause();
        }
      });
    };

    if ("IntersectionObserver" in window) {
      var slideObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.intersectionRatio > 0.6) {
            activeVid = en.target;
            syncPlayback();
          }
        });
      }, { root: feed, threshold: [0.6] });
      vids.forEach(function (v) { slideObs.observe(v); });

      new IntersectionObserver(function (entries) {
        phoneVisible = entries[0].isIntersecting;
        syncPlayback();
      }, { threshold: 0.3 }).observe(document.getElementById("phone"));
    } else {
      phoneVisible = true;
      syncPlayback();
    }
    document.addEventListener("visibilitychange", syncPlayback);

    var toggleSound = function () {
      soundOn = !soundOn;
      applySound();
      syncPlayback();
    };
    soundBtn.addEventListener("click", toggleSound);
    vids.forEach(function (v) {
      v.addEventListener("click", function () {
        if ((reducedMotion || noAnim) && v.paused) {
          activeVid = v;
          phoneVisible = true;
          v.muted = !soundOn;
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          toggleSound();
        }
      });
    });
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

  /* ---------- globe: 53 exchanges, real counts, tooltips ---------- */
  var globeWrap = document.getElementById("globe-wrap");
  var canvas = document.getElementById("globe-canvas");
  var tip = document.getElementById("globe-tip");
  var THETA = 0.22;
  var K = 0.39; // sphere radius as a fraction of canvas css size (calibrated against cobe)

  var useFallback = function () {
    globeWrap.classList.add("no-webgl");
  };

  // marker position in canvas css px for the current rotation; null if on the far side
  var projectMarker = function (lat, lng, phiVal, size) {
    var la = lat * Math.PI / 180, lo = lng * Math.PI / 180;
    var x = Math.cos(la) * Math.cos(lo + phiVal);
    var y = Math.sin(la);
    var z = -Math.cos(la) * Math.sin(lo + phiVal);
    var y2 = y * Math.cos(THETA) - z * Math.sin(THETA);
    var z2 = y * Math.sin(THETA) + z * Math.cos(THETA);
    if (z2 <= 0.08) return null;
    return { x: size / 2 + x * size * K, y: size / 2 - y2 * size * K };
  };

  var initGlobe = function (exchanges) {
    import("https://cdn.jsdelivr.net/npm/cobe@0.6.4/+esm")
      .then(function (mod) {
        var createGlobe = mod.default;
        var size = globeWrap.getBoundingClientRect().width;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);

        var maxCount = exchanges.reduce(function (m, e) { return Math.max(m, e.companies); }, 1);
        var phi = 4.6; // start over the Atlantic
        var pointerDown = null;
        var pointerStart = null;
        var pointerPhi = 0;
        var velocity = 0;
        var visible = true;
        var renderedPhi = phi;
        var activeEx = -1;
        var baseSpeed = reducedMotion ? 0 : 0.0028;

        var globe = createGlobe(canvas, {
          devicePixelRatio: dpr,
          width: size * dpr,
          height: size * dpr,
          phi: phi,
          theta: THETA,
          dark: 1,
          diffuse: 1.2,
          mapSamples: 16000,
          mapBrightness: 6,
          baseColor: [0.35, 0.35, 0.35],
          markerColor: [0.87, 0.87, 0.87],
          glowColor: [0.7, 0.7, 0.7],
          markers: exchanges.map(function (e) {
            return {
              location: [e.lat, e.lng],
              size: 0.028 + 0.072 * Math.sqrt(e.companies / maxCount)
            };
          }),
          onRender: function (state) {
            if (visible) {
              if (pointerDown === null) {
                phi += baseSpeed + velocity;
                velocity *= 0.93;
              }
              renderedPhi = phi + pointerPhi;
              state.phi = renderedPhi;
              if (activeEx >= 0) positionTip();
            }
            var s = globeWrap.getBoundingClientRect().width;
            state.width = s * dpr;
            state.height = s * dpr;
          }
        });

        canvas.classList.add("is-ready");

        var cssSize = function () { return globeWrap.getBoundingClientRect().width; };

        var positionTip = function () {
          var e = exchanges[activeEx];
          var p = projectMarker(e.lat, e.lng, renderedPhi, cssSize());
          if (!p) { hideTip(); return; }
          tip.style.left = p.x + "px";
          tip.style.top = p.y + "px";
        };

        var showTip = function (idx) {
          var e = exchanges[idx];
          activeEx = idx;
          tip.innerHTML = "<strong></strong>";
          tip.querySelector("strong").textContent = e.name;
          tip.appendChild(document.createTextNode(
            e.companies.toLocaleString("en-US") + " companies monitored"));
          tip.hidden = false;
          positionTip();
        };

        var hideTip = function () {
          activeEx = -1;
          tip.hidden = true;
        };

        var pickAt = function (clientX, clientY) {
          var rect = canvas.getBoundingClientRect();
          var px = clientX - rect.left, py = clientY - rect.top;
          var s = rect.width;
          var best = -1, bestD = 18 * 18;
          for (var j = 0; j < exchanges.length; j++) {
            var p = projectMarker(exchanges[j].lat, exchanges[j].lng, renderedPhi, s);
            if (!p) continue;
            var dx = p.x - px, dy = p.y - py;
            var d = dx * dx + dy * dy;
            if (d < bestD) { bestD = d; best = j; }
          }
          return best;
        };

        /* hover */
        canvas.addEventListener("pointermove", function (e) {
          if (pointerDown !== null) {
            var delta = e.clientX - pointerDown;
            pointerPhi = delta * 0.005;
            velocity = (e.movementX || 0) * 0.002;
            return;
          }
          if (e.pointerType === "mouse") {
            var idx = pickAt(e.clientX, e.clientY);
            if (idx >= 0) { if (idx !== activeEx) showTip(idx); }
            else hideTip();
          }
        });
        canvas.addEventListener("pointerleave", hideTip);

        /* drag to rotate + tap to pick */
        canvas.addEventListener("pointerdown", function (e) {
          pointerDown = e.clientX;
          pointerStart = [e.clientX, e.clientY];
          hideTip();
          canvas.classList.add("is-dragging");
          canvas.setPointerCapture(e.pointerId);
        });
        var release = function (e) {
          if (pointerDown === null) return;
          var wasTap = pointerStart &&
            Math.abs(e.clientX - pointerStart[0]) < 6 &&
            Math.abs(e.clientY - pointerStart[1]) < 6;
          phi += pointerPhi;
          pointerPhi = 0;
          pointerDown = null;
          pointerStart = null;
          canvas.classList.remove("is-dragging");
          if (wasTap) {
            var idx = pickAt(e.clientX, e.clientY);
            if (idx >= 0) showTip(idx); else hideTip();
          }
        };
        canvas.addEventListener("pointerup", release);
        canvas.addEventListener("pointercancel", function () {
          pointerPhi = 0;
          pointerDown = null;
          pointerStart = null;
          canvas.classList.remove("is-dragging");
        });

        /* pause rendering math when offscreen */
        new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
        }, { threshold: 0 }).observe(globeWrap);

        window.addEventListener("pagehide", function () { globe.destroy(); }, { once: true });
      })
      .catch(useFallback);
  };

  if (globeWrap && canvas) {
    if (!gpuOk) {
      useFallback();
    } else if ("IntersectionObserver" in window) {
      var globeLazy = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          globeLazy.disconnect();
          fetch("assets/exchanges.json")
            .then(function (r) { return r.json(); })
            .then(function (data) { initGlobe(data.exchanges); })
            .catch(useFallback);
        }
      }, { rootMargin: "500px" });
      globeLazy.observe(globeWrap);
    } else {
      useFallback();
    }
  }
})();
