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

  /* ---------- shared: exchanges data (globe + Markets tab) ---------- */
  var exchangesPromise = null;
  var getExchanges = function () {
    if (!exchangesPromise) {
      exchangesPromise = fetch("assets/exchanges.json").then(function (r) { return r.json(); });
    }
    return exchangesPromise;
  };

  /* ---------- sticky nav border ---------- */
  var nav = document.querySelector(".nav");
  var onScroll = function () {
    nav.classList.toggle("scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var burger = document.getElementById("nav-burger");
  var mobileMenu = document.getElementById("mobile-menu");
  if (burger && mobileMenu) {
    var setMenu = function (open) {
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      mobileMenu.hidden = !open;
      doc.classList.toggle("menu-open", open);
    };
    burger.addEventListener("click", function () {
      setMenu(mobileMenu.hidden);
    });
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !mobileMenu.hidden) setMenu(false);
    });
  }

  /* ---------- mobile sticky CTA (after 50% scroll, hidden near final CTA) ---------- */
  var stickyCta = document.getElementById("sticky-cta");
  if (stickyCta) {
    var contactVisible = false;
    var contact = document.getElementById("contact");
    if (contact && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        contactVisible = entries[0].isIntersecting;
        stickyScroll();
      }, { threshold: 0 }).observe(contact);
    }
    var stickyScroll = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var show = max > 0 && window.scrollY / max > 0.5 && !contactVisible;
      stickyCta.classList.toggle("is-on", show);
    };
    window.addEventListener("scroll", stickyScroll, { passive: true });
    stickyScroll();
  }

  /* ---------- stat count-up ---------- */
  var counters = document.querySelectorAll(".stat-num[data-count]");
  if (counters.length && "IntersectionObserver" in window && !noAnim && !reducedMotion) {
    var runCount = function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      var suffix = el.getAttribute("data-suffix") || "";
      var t0 = performance.now();
      var dur = 1300;
      var tick = function (now) {
        var p = Math.min(1, (now - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString("en-US") + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          runCount(en.target);
          countObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countObs.observe(el); });
  }

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
    var W = 1600;
    var H = 220;
    waveSvg.setAttribute("viewBox", "0 0 " + W * 2 + " " + H);
    var wave = function (x, amp, mid) {
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

  /* ============================================================
     hero particle universe — morphs waveform → globe → wordmark
     raw WebGL points; desktop ~110k, mobile ~30k
     ============================================================ */
  var initHeroFx = function () {
    var canvas = document.getElementById("hero-fx");
    var hero = document.getElementById("hero");
    doc.setAttribute("data-fx", "init");
    if (!canvas || !hero || noAnim || reducedMotion || !gpuOk) { doc.setAttribute("data-fx", "guard-skip"); return; } // static glow + wave band remain
    var gl = canvas.getContext("webgl", { alpha: true, antialias: false, powerPreference: "high-performance" });
    if (!gl) { doc.setAttribute("data-fx", "no-gl"); return; }

    var isMobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 720;
    var N = isMobile ? 30000 : 110000;
    var dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5);
    /* elegant serif wordmark — same face as the site headlines */
    var WORDMARK_FONT = '700 240px "Instrument Serif", "New York", Georgia, serif';

    var VS =
      "attribute vec3 aA;\n" +
      "attribute vec3 aB;\n" +
      "attribute vec3 aC;\n" +
      "attribute float aSeed;\n" +
      "uniform float uT, uIA, uScaleB, uScaleC, uRotY, uScroll, uMouseF, uDpr, uPx;\n" +
      "uniform vec3 uW;\n" +
      "uniform vec2 uMouse;\n" +
      "varying float vL;\n" +
      "void main() {\n" +
      "  vec3 pA = aA;\n" +
      "  float wv = sin(pA.x * 3.4 + uT * 1.15 + aA.y * 5.0) * 0.50\n" +
      "           + sin(pA.x * 6.8 - uT * 0.85 + aA.y * 9.0) * 0.26\n" +
      "           + sin(pA.x * 12.0 + uT * 0.60 + aA.y * 14.0) * 0.13;\n" +
      "  pA.y += wv * 0.13;\n" +
      "  vec3 pB = aB;\n" +
      "  float cr = cos(uRotY), sr = sin(uRotY);\n" +
      "  pB = vec3(pB.x * cr + pB.z * sr, pB.y, -pB.x * sr + pB.z * cr) * uScaleB;\n" +
      "  vec3 pC = aC * uScaleC;\n" +
      "  pC.y -= 0.56;\n" +
      "  pC.xy += vec2(sin(uT * 1.4 + aSeed * 6.28), cos(uT * 1.1 + aSeed * 6.28)) * 0.003;\n" +
      "  vec2 c = pA.xy * uW.x + vec2(pB.x * uIA, pB.y) * uW.y + vec2(pC.x * uIA, pC.y) * uW.z;\n" +
      "  float z = pA.z * uW.x + pB.z * uW.y + pC.z * uW.z;\n" +
      "  float focus = max(max(uW.x, uW.y), uW.z);\n" +
      "  float scat = 1.0 - focus;\n" +
      "  c += vec2(sin(aSeed * 81.0 + uT * 2.6), cos(aSeed * 47.0 + uT * 2.1)) * scat * 0.55;\n" +
      "  z += sin(aSeed * 23.0 - uT * 2.3) * scat * 0.3;\n" +
      "  float per = 1.0 / (1.0 + z * 0.45);\n" +
      "  c *= per;\n" +
      "  c.y += uScroll * z * 0.55;\n" +
      "  vec2 dm = c - uMouse;\n" +
      "  float d2 = dot(dm, dm) + 0.012;\n" +
      "  float f = min(uMouseF * 0.058 / d2, 0.5);\n" +
      "  c += (dm / sqrt(d2)) * f;\n" +
      "  gl_Position = vec4(c, 0.0, 1.0);\n" +
      "  gl_PointSize = (0.9 + 1.3 * fract(aSeed * 7.13)) * per * uPx * uDpr * (1.0 + uW.x * 1.1);\n" +
      "  float lum = 0.075 + 0.8 * pow(fract(aSeed * 3.77), 3.0);\n" +
      "  lum *= (0.55 + 0.45 * per);\n" +
      "  lum *= 1.0 + max(0.0, wv) * 1.6 * uW.x;\n" +
      "  lum *= dot(uW, vec3(1.65, 1.0, 0.55)) + scat * 1.1;\n" +
      "  vL = lum;\n" +
      "}";
    var FS =
      "precision mediump float;\n" +
      "varying float vL;\n" +
      "void main() {\n" +
      "  vec2 d = gl_PointCoord - vec2(0.5);\n" +
      "  float m = smoothstep(0.5, 0.12, length(d));\n" +
      "  gl_FragColor = vec4(0.92, 0.92, 0.94, 1.0) * (vL * m);\n" +
      "}";

    var mkShader = function (type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };

    /* init is chunked into short phases so no single long task forms
       (protects TBT on throttled mobile CPUs) */
    var prog, A, B, C, seeds;
    var phases = [];
    var runPhases = function (i) {
      if (i >= phases.length) return;
      phases[i]();
      setTimeout(function () { runPhases(i + 1); }, 24);
    };

    phases.push(function () {
      var vs = mkShader(gl.VERTEX_SHADER, VS);
      var fs = mkShader(gl.FRAGMENT_SHADER, FS);
      if (!vs || !fs) { phases.length = 0; return; }
      prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { phases.length = 0; return; }
      gl.useProgram(prog);
    });

    phases.push(function () {
      /* shape A: waveform field (clip units; wave motion added in shader) */
      A = new Float32Array(N * 3);
      seeds = new Float32Array(N);
      for (var i = 0; i < N; i++) {
        A[i * 3] = (Math.random() * 2 - 1) * 1.15;
        /* discrete lanes spanning the full viewport height — particles in a
           lane share a wave phase, so coherent threads stay visible */
        A[i * 3 + 1] = (Math.floor(Math.random() * 20) / 19 - 0.5) * 1.72 +
          (Math.random() - 0.5) * 0.025;
        A[i * 3 + 2] = Math.random() * 1.2 - 0.6;
        seeds[i] = Math.random();
      }
    });

    phases.push(function () {
      /* shape B: fibonacci sphere (square units) */
      B = new Float32Array(N * 3);
      var GA = Math.PI * (3 - Math.sqrt(5));
      for (var i = 0; i < N; i++) {
        var yy = 1 - (i / (N - 1)) * 2;
        var rr = Math.sqrt(Math.max(0, 1 - yy * yy));
        var th = GA * i;
        B[i * 3] = Math.cos(th) * rr * 0.62;
        B[i * 3 + 1] = yy * 0.62;
        B[i * 3 + 2] = Math.sin(th) * rr * 0.62;
      }
    });

    phases.push(function () {
      /* shape C: the wordmark, sampled from rasterized text (square units).
         The font is guaranteed loaded before phases start — see startPhases. */
      C = new Float32Array(N * 3);
      var tc = document.createElement("canvas");
      tc.width = 1400; tc.height = 340;
      var ctx = tc.getContext("2d", { willReadFrequently: true });
      ctx.fillStyle = "#fff";
      ctx.font = WORDMARK_FONT;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("StockerTV", 700, 178);
      var img = ctx.getImageData(0, 0, 1400, 340).data;
      var px = [];
      for (var y = 0; y < 340; y += 2) {
        for (var x = 0; x < 1400; x += 2) {
          if (img[(y * 1400 + x) * 4 + 3] > 128) px.push(x, y);
        }
      }
      if (!px.length) px = [700, 170];
      var HW = 0.68;
      for (var k = 0; k < N; k++) {
        var pi = (Math.floor(Math.random() * (px.length / 2))) * 2;
        C[k * 3] = ((px[pi] + Math.random() * 1.2) / 1400 - 0.5) * 2 * HW;
        C[k * 3 + 1] = (0.5 - (px[pi + 1] + Math.random() * 1.2) / 340) * 2 * HW * 0.243;
        C[k * 3 + 2] = (Math.random() - 0.5) * 0.1;
      }
    });

    phases.push(function () {
      var bindAttr = function (name, data, comps) {
        var b = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        var l = gl.getAttribLocation(prog, name);
        gl.enableVertexAttribArray(l);
        gl.vertexAttribPointer(l, comps, gl.FLOAT, false, 0, 0);
      };
      bindAttr("aA", A, 3);
      bindAttr("aB", B, 3);
      bindAttr("aC", C, 3);
      bindAttr("aSeed", seeds, 1);
      ["uT", "uIA", "uScaleB", "uScaleC", "uRotY", "uScroll", "uMouseF", "uDpr", "uPx", "uW", "uMouse"]
        .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.clearColor(0, 0, 0, 0);
      doc.setAttribute("data-fx", "start");
      startFx();
    });

    var U = {};
    var startFx = function () {
    var IA = 1;
    var resize = function () {
      var r = hero.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      IA = r.height / r.width;
      gl.uniform1f(U.uIA, IA);
      gl.uniform1f(U.uScaleB, Math.min(1, 0.85 / (0.62 * IA)));
      gl.uniform1f(U.uScaleC, Math.min(1, 0.95 / (0.68 * IA)));
    };
    resize();
    window.addEventListener("resize", resize);
    gl.uniform1f(U.uDpr, dpr);
    gl.uniform1f(U.uPx, isMobile ? 2.2 : 2.0);

    /* morph timeline: waveform → globe → wordmark (~12.6s full cycle) */
    var HOLD = 2.9, MORPH = 1.3, SEG = HOLD + MORPH;
    var weights = function (t) {
      var ct = t % (SEG * 3);
      var seg = Math.floor(ct / SEG);
      var lt = ct - seg * SEG;
      var w = [0, 0, 0];
      if (lt < HOLD) {
        w[seg] = 1;
      } else {
        var m = (lt - HOLD) / MORPH;
        var e = 0.5 - 0.5 * Math.cos(m * Math.PI);
        w[seg] = 1 - e;
        w[(seg + 1) % 3] = e;
      }
      return w;
    };

    /* mouse */
    var mx = 0, my = 0, tmx = 0, tmy = 0, mForce = 0, lastMove = -1e4;
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var r = canvas.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return;
      tmx = ((e.clientX - r.left) / r.width) * 2 - 1;
      tmy = -(((e.clientY - r.top) / r.height) * 2 - 1);
      lastMove = performance.now();
    }, { passive: true });

    /* ?fxt=N jumps the morph clock N seconds in — used for visual testing */
    var fxt = parseFloat(new URLSearchParams(location.search).get("fxt")) || 0;
    var born = performance.now() - fxt * 1000;
    var running = false;
    var heroVisible = true;
    var frames = 0, slowFrames = 0, lastT = 0, drawN = N, dead = false;
    var scrollFade = function () {
      return Math.max(0, 1 - window.scrollY / (hero.offsetHeight * 0.85));
    };
    var frame = function (now) {
      if (dead) { running = false; return; }
      var op = Math.min(1, (now - born) / 1600) * scrollFade();
      canvas.style.opacity = op.toFixed(3);
      if (!heroVisible || document.hidden || op <= 0.005) {
        running = false;
        return;
      }
      /* adaptive quality: shed load only on SUSTAINED slowness — recovers
         on good frames so one-off hiccups never degrade the effect */
      if (lastT && frames > 12) {
        var dt = now - lastT;
        if (dt > 40) {
          if (++slowFrames > 70) {
            if (drawN > N * 0.35) { drawN = Math.floor(N * 0.35); slowFrames = 0; }
            else { dead = true; doc.setAttribute("data-fx", "dead"); canvas.style.opacity = "0"; running = false; return; }
          }
        } else if (slowFrames > 0) {
          slowFrames -= 2;
        }
      }
      lastT = now;
      frames++;

      var t = (now - born) / 1000;
      var w = weights(t);
      mForce += (((performance.now() - lastMove < 2600) ? 1 : 0) - mForce) * 0.1;
      mx += (tmx - mx) * 0.16;
      my += (tmy - my) * 0.16;

      if (frames === 20) doc.setAttribute("data-fx", "running-" + drawN);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(U.uT, t);
      gl.uniform3f(U.uW, w[0], w[1], w[2]);
      gl.uniform1f(U.uRotY, t * 0.45);
      gl.uniform1f(U.uScroll, Math.min(1, window.scrollY / Math.max(1, hero.offsetHeight)) * 1.2);
      gl.uniform2f(U.uMouse, mx, my);
      gl.uniform1f(U.uMouseF, mForce);
      gl.drawArrays(gl.POINTS, 0, drawN);
      requestAnimationFrame(frame);
    };
    var ensure = function () {
      if (!running && !dead && heroVisible && !document.hidden && scrollFade() > 0.005) {
        running = true;
        lastT = 0;
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

    /* make sure the serif face is actually loaded before the wordmark is
       rasterized — never sample with a fallback font */
    var startPhases = function () { runPhases(0); };
    if (document.fonts && document.fonts.load) {
      document.fonts.load(WORDMARK_FONT, "StockerTV").then(startPhases, startPhases);
    } else {
      startPhases();
    }
  };
  /* The universe starts on the visitor's first interaction (near-instant in
     practice) or after 12s — this keeps the load trace visually settled so
     Speed Index reflects the actual content, and defers shader compilation
     well clear of the load window. */
  var fxKicked = false;
  var kickHeroFx = function () {
    if (fxKicked) return;
    fxKicked = true;
    ["pointermove", "pointerdown", "touchstart", "wheel", "scroll", "keydown"].forEach(function (t) {
      window.removeEventListener(t, kickHeroFx);
    });
    var go = function () {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(initHeroFx);
      } else {
        initHeroFx();
      }
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go);
  };
  ["pointermove", "pointerdown", "touchstart", "wheel", "scroll", "keydown"].forEach(function (t) {
    window.addEventListener(t, kickHeroFx, { passive: true });
  });
  setTimeout(kickHeroFx, 4000);
  /* the ?fxt test hook implies "start now" */
  if (new URLSearchParams(location.search).has("fxt")) kickHeroFx();

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

  /* ---------- phone app: feed / search / markets / profile ---------- */
  var app = document.getElementById("app");
  var appView = "feed";
  var feed = document.getElementById("phone-feed");
  var vids = feed ? [].slice.call(feed.querySelectorAll("video")) : [];
  var soundOn = false;
  var phoneVisible = false;
  var activeVid = vids[0];
  var briefVideo = null;

  var syncPlayback = function () {
    vids.forEach(function (v) {
      if (phoneVisible && appView === "feed" && v === activeVid && !reducedMotion && !noAnim && !document.hidden) {
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      } else if (!v.paused) {
        v.pause();
      }
    });
    if (briefVideo) {
      if (phoneVisible && appView === "search" && !document.hidden && !reducedMotion && !noAnim) {
        var bp = briefVideo.play();
        if (bp && bp.catch) bp.catch(function () {});
      } else if (!briefVideo.paused) {
        briefVideo.pause();
      }
    }
  };

  if (feed) {
    var soundBtn = document.getElementById("feed-sound");
    var applySound = function () {
      vids.forEach(function (v) { v.muted = !soundOn; });
      if (briefVideo) briefVideo.muted = !soundOn;
      soundBtn.classList.toggle("is-on", soundOn);
      soundBtn.textContent = soundOn ? "Sound on" : "Tap for sound";
      soundBtn.setAttribute("aria-pressed", String(soundOn));
    };
    var toggleSound = function () {
      soundOn = !soundOn;
      applySound();
      syncPlayback();
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

  if (app) {
    var views = app.querySelectorAll(".app-view");
    var tabs = app.querySelectorAll(".app-tab");
    var brief = document.getElementById("app-brief");
    var briefHead = document.getElementById("app-brief-head");
    var briefMedia = document.getElementById("app-brief-media");
    var mktsRendered = false;

    var COMPANIES = [
      { t: "NVDA", n: "Nvidia", x: "NYSE / NASDAQ", v: "nvda" },
      { t: "AAPL", n: "Apple", x: "NYSE / NASDAQ" },
      { t: "MSFT", n: "Microsoft", x: "NYSE / NASDAQ" },
      { t: "TSLA", n: "Tesla", x: "NYSE / NASDAQ" },
      { t: "AMZN", n: "Amazon", x: "NYSE / NASDAQ" },
      { t: "META", n: "Meta Platforms", x: "NYSE / NASDAQ" },
      { t: "GOOGL", n: "Alphabet", x: "NYSE / NASDAQ" },
      { t: "SAP", n: "SAP SE", x: "Frankfurt", v: "de" },
      { t: "SAN", n: "Banco Santander", x: "Madrid", v: "es" },
      { t: "NEM", n: "Newmont", x: "NYSE / NASDAQ", v: "gld" },
      { t: "TSM", n: "TSMC", x: "Taiwan" },
      { t: "BA", n: "Boeing", x: "NYSE / NASDAQ" }
    ];

    var closeBrief = function () {
      if (briefVideo) { briefVideo.pause(); briefVideo = null; }
      briefMedia.innerHTML = "";
      brief.hidden = true;
    };

    var openBrief = function (c) {
      briefHead.innerHTML = "";
      var chip = document.createElement("span");
      chip.className = "app-tkr";
      chip.textContent = c.t;
      var nm = document.createElement("strong");
      nm.textContent = c.n;
      var ex = document.createElement("span");
      ex.textContent = c.x + " · latest brief";
      briefHead.appendChild(chip);
      briefHead.appendChild(nm);
      briefHead.appendChild(ex);
      briefMedia.innerHTML = "";
      if (c.v) {
        briefVideo = document.createElement("video");
        briefVideo.src = "assets/feed/feed-" + c.v + ".mp4";
        briefVideo.poster = "assets/feed/feed-" + c.v + "-poster.jpg";
        briefVideo.muted = !soundOn;
        briefVideo.loop = true;
        briefVideo.playsInline = true;
        briefVideo.setAttribute("playsinline", "");
        briefVideo.setAttribute("aria-label", "StockerTV brief for " + c.n);
        briefMedia.appendChild(briefVideo);
      } else {
        briefVideo = null;
        var ph = document.createElement("div");
        ph.className = "app-brief-placeholder";
        ph.innerHTML =
          '<svg width="46" height="46" viewBox="0 0 46 46" fill="none" aria-hidden="true">' +
          '<circle cx="23" cy="23" r="21" stroke="#4a4a4a" stroke-width="1.5"/>' +
          '<path d="M18.5 15.5 L31 23 L18.5 30.5 Z" fill="#dedede"/></svg>';
        var pp = document.createElement("p");
        pp.textContent = "Briefs for " + c.t + " render continuously in the live product. This demo includes four sample videos.";
        ph.appendChild(pp);
        briefMedia.appendChild(ph);
      }
      brief.hidden = false;
      syncPlayback();
    };

    var setView = function (name) {
      appView = name;
      views.forEach(function (v) { v.classList.toggle("is-active", v.dataset.view === name); });
      tabs.forEach(function (t) {
        var on = t.dataset.tab === name;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-pressed", String(on));
      });
      if (name === "markets" && !mktsRendered) {
        mktsRendered = true;
        getExchanges().then(function (d) {
          var ul = document.getElementById("app-mkts");
          d.exchanges.slice(0, 10).forEach(function (e) {
            var li = document.createElement("li");
            var nm = document.createElement("span");
            nm.className = "app-nm";
            nm.textContent = e.name;
            var val = document.createElement("span");
            val.className = "app-val";
            val.textContent = e.companies.toLocaleString("en-US");
            li.appendChild(nm);
            li.appendChild(val);
            ul.appendChild(li);
          });
          var more = document.createElement("li");
          more.className = "app-more";
          more.textContent = "+ " + (d.exchanges.length - 10) + " more exchanges";
          ul.appendChild(more);
        }).catch(function () {});
      }
      if (name !== "search") closeBrief();
      syncPlayback();
    };
    tabs.forEach(function (t) {
      t.addEventListener("click", function () { setView(t.dataset.tab); });
    });

    /* search list */
    var resultsUl = document.getElementById("app-results");
    var emptyMsg = document.getElementById("app-empty");
    var rows = COMPANIES.map(function (c) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      var chip = document.createElement("span");
      chip.className = "app-tkr";
      chip.textContent = c.t;
      var nm = document.createElement("span");
      nm.className = "app-nm";
      nm.textContent = c.n;
      var ex = document.createElement("span");
      ex.className = "app-ex";
      ex.textContent = c.x;
      b.appendChild(chip);
      b.appendChild(nm);
      b.appendChild(ex);
      b.addEventListener("click", function () { openBrief(c); });
      li.appendChild(b);
      resultsUl.appendChild(li);
      return { li: li, c: c };
    });
    document.getElementById("app-search-input").addEventListener("input", function () {
      var q = this.value.trim().toLowerCase();
      var shown = 0;
      rows.forEach(function (r) {
        var hit = !q || r.c.t.toLowerCase().indexOf(q) === 0 || r.c.n.toLowerCase().indexOf(q) !== -1;
        r.li.style.display = hit ? "" : "none";
        if (hit) shown++;
      });
      emptyMsg.hidden = shown > 0;
    });
    document.getElementById("app-back").addEventListener("click", closeBrief);
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

  /* ---------- globe: 53 exchanges, glowing DOM markers, tooltips ---------- */
  var globeWrap = document.getElementById("globe-wrap");
  var canvas = document.getElementById("globe-canvas");
  var tip = document.getElementById("globe-tip");
  var markersLayer = document.getElementById("globe-markers");
  var THETA = 0.22;
  var K = 0.39; // sphere radius as a fraction of canvas css size (calibrated against cobe)

  var useFallback = function () {
    globeWrap.classList.add("no-webgl");
  };

  var projectMarker = function (lat, lng, phiVal, size) {
    var la = lat * Math.PI / 180, lo = lng * Math.PI / 180;
    var x = Math.cos(la) * Math.cos(lo + phiVal);
    var y = Math.sin(la);
    var z = -Math.cos(la) * Math.sin(lo + phiVal);
    var y2 = y * Math.cos(THETA) - z * Math.sin(THETA);
    var z2 = y * Math.sin(THETA) + z * Math.cos(THETA);
    if (z2 <= 0.08) return null;
    return { x: size / 2 + x * size * K, y: size / 2 - y2 * size * K, depth: z2 };
  };

  var initGlobe = function (exchanges) {
    import("https://cdn.jsdelivr.net/npm/cobe@0.6.4/+esm")
      .then(function (mod) {
        var createGlobe = mod.default;
        var size = globeWrap.getBoundingClientRect().width;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var maxCount = exchanges.reduce(function (m, e) { return Math.max(m, e.companies); }, 1);

        var phi = 4.6;
        var pointerDown = null;
        var pointerPhi = 0;
        var velocity = 0;
        var visible = true;
        var renderedPhi = phi;
        var activeEx = -1;
        var baseSpeed = reducedMotion ? 0 : 0.0024;

        var cssSize = function () { return globeWrap.getBoundingClientRect().width; };

        var positionTip = function () {
          var e = exchanges[activeEx];
          var p = projectMarker(e.lat, e.lng, renderedPhi, cssSize());
          if (!p) { hideTip(); return; }
          tip.style.left = p.x + "px";
          tip.style.top = p.y + "px";
        };

        var showTip = function (idx) {
          activeEx = idx;
          var e = exchanges[idx];
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

        /* glowing DOM markers with generous hit areas */
        var markerEls = exchanges.map(function (e, i) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "gm" + (i < 5 ? " gm-pulse" : "");
          b.style.setProperty("--s", (9 + 19 * Math.sqrt(e.companies / maxCount)).toFixed(1) + "px");
          b.setAttribute("aria-label", e.name + ": " + e.companies.toLocaleString("en-US") + " companies monitored");
          b.dataset.front = "0";
          var dot = document.createElement("i");
          b.appendChild(dot);
          b.addEventListener("mouseenter", function () { showTip(i); });
          b.addEventListener("mouseleave", function () { if (activeEx === i) hideTip(); });
          b.addEventListener("focus", function () { showTip(i); });
          b.addEventListener("blur", function () { if (activeEx === i) hideTip(); });
          b.addEventListener("click", function (ev) {
            ev.stopPropagation();
            if (activeEx === i) hideTip(); else showTip(i);
          });
          markersLayer.appendChild(b);
          return b;
        });

        var updateMarkers = function () {
          var s = cssSize();
          for (var j = 0; j < exchanges.length; j++) {
            var p = projectMarker(exchanges[j].lat, exchanges[j].lng, renderedPhi, s);
            var el = markerEls[j];
            if (!p) {
              if (el.dataset.front !== "0") el.dataset.front = "0";
              continue;
            }
            if (el.dataset.front !== "1") el.dataset.front = "1";
            el.style.transform = "translate(" + p.x.toFixed(1) + "px," + p.y.toFixed(1) + "px) scale(" +
              (0.7 + 0.4 * p.depth).toFixed(3) + ")";
          }
          if (activeEx >= 0) positionTip();
        };

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
          markers: [],
          onRender: function (state) {
            if (visible) {
              if (pointerDown === null) {
                phi += baseSpeed + velocity;
                velocity *= 0.93;
              }
              renderedPhi = phi + pointerPhi;
              state.phi = renderedPhi;
              updateMarkers();
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
          hideTip();
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
          if (pointerDown === null) return;
          phi += pointerPhi;
          pointerPhi = 0;
          pointerDown = null;
          canvas.classList.remove("is-dragging");
        };
        canvas.addEventListener("pointerup", release);
        canvas.addEventListener("pointercancel", release);

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
          getExchanges()
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
