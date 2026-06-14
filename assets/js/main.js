(function () {
  var root = document.documentElement;
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var originalTitle = document.title;
  var terminalNode = null;
  var lastScrollY = window.scrollY;
  var lastScrollTime = performance.now();
  var lastScrollDirection = "still";

  root.classList.add("motion-ready");

  var yearNode = document.getElementById("year");
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

  function injectSvgFilter() {
    if (document.getElementById("liquid-filter-svg")) {
      return;
    }
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", "liquid-filter-svg");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = '<filter id="liquid-distortion"><feTurbulence type="fractalNoise" baseFrequency="0.018 0.08" numOctaves="2" seed="7" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="16" xChannelSelector="R" yChannelSelector="G"/></filter>';
    document.body.appendChild(svg);
  }

  function setupPreloaderAndGreeting() {
    var homeLine = document.querySelector(".home-lines");
    var seenKey = "meshachando_portfolio_seen";
    var seenBefore = localStorage.getItem(seenKey) === "yes";
    var hour = new Date().getHours();
    var greeting = "Good afternoon";

    if (seenBefore) {
      greeting = "Welcome back, Meshach";
    } else if (hour < 5) {
      greeting = "Late night coding?";
    } else if (hour < 12) {
      greeting = "Good morning";
    } else if (hour >= 18) {
      greeting = "Good evening";
    }

    if (homeLine && !homeLine.dataset.greeted) {
      homeLine.textContent = greeting + " - " + homeLine.textContent;
      homeLine.dataset.greeted = "true";
    }

    if (seenBefore || prefersReducedMotion) {
      return;
    }

    var loader = document.createElement("div");
    var count = document.createElement("span");
    loader.className = "cinematic-loader";
    count.className = "loader-count";
    count.textContent = "00";
    loader.appendChild(count);
    document.body.appendChild(loader);

    var value = 0;
    var timer = window.setInterval(function () {
      value += Math.max(1, Math.round((100 - value) * 0.16));
      count.textContent = String(Math.min(value, 100)).padStart(2, "0");
      if (value >= 100) {
        window.clearInterval(timer);
        localStorage.setItem(seenKey, "yes");
        loader.classList.add("is-done");
        window.setTimeout(function () {
          loader.remove();
        }, 620);
      }
    }, 24);
  }

  function setupMomentumScroll() {
    var settleTimer;
    var lastScrollUiUpdate = 0;

    window.addEventListener("scroll", function () {
      var now = performance.now();
      var dy = window.scrollY - lastScrollY;
      var dt = Math.max(16, now - lastScrollTime);
      var velocity = dy / dt;
      var skew = Math.max(-1.25, Math.min(1.25, velocity * 9));

      lastScrollDirection = dy > 0 ? "down" : dy < 0 ? "up" : "still";
      document.documentElement.style.setProperty("--scroll-skew", skew.toFixed(3));
      document.documentElement.classList.add("velocity-skew");

      if (now - lastScrollUiUpdate > 140) {
        updateFavicon(lastScrollDirection);
        writeTerminal("> Scroll depth: " + Math.round(window.scrollY) + "px");
        lastScrollUiUpdate = now;
      }

      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(function () {
        document.documentElement.style.setProperty("--scroll-skew", "0");
        document.documentElement.classList.remove("velocity-skew");
        lastScrollDirection = "still";
        updateFavicon("still");
      }, 130);

      lastScrollY = window.scrollY;
      lastScrollTime = now;
    }, { passive: true });
  }

  function setupScrollUi() {
    var backTop = document.querySelector(".back-top");
    var updateScrollUi = function () {
      if (backTop) {
        backTop.classList.toggle("is-visible", window.scrollY > 420);
      }
    };

    updateScrollUi();
    updateFavicon("still");
    window.addEventListener("scroll", updateScrollUi, { passive: true });
    window.addEventListener("resize", updateScrollUi);
  }

  function setupNavigation() {
    var menus = Array.prototype.slice.call(document.querySelectorAll(".nav-menu"));
    function syncMenuState() {
      root.classList.toggle("menu-open", menus.some(function (menu) {
        return menu.hasAttribute("open");
      }));
    }

    menus.forEach(function (menu) {
      menu.addEventListener("toggle", syncMenuState);
      menu.addEventListener("click", function (event) {
        if (event.target.tagName === "A") {
          menu.removeAttribute("open");
        }
        if (event.target.classList && event.target.classList.contains("nav-menu-panel")) {
          menu.removeAttribute("open");
        }
      });
    });

    document.addEventListener("click", function (event) {
      menus.forEach(function (menu) {
        if (!menu.contains(event.target)) {
          menu.removeAttribute("open");
        }
      });
      syncMenuState();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        menus.forEach(function (menu) {
          menu.removeAttribute("open");
        });
        syncMenuState();
      }
    });
  }

  function setupTocState() {
    var tocLinks = Array.prototype.slice.call(document.querySelectorAll(".side-toc a[href^='#']"));
    if (!tocLinks.length || !("IntersectionObserver" in window)) {
      return;
    }
    var linkMap = tocLinks.reduce(function (map, link) {
      var id = link.getAttribute("href").slice(1);
      var target = document.getElementById(id);
      if (target) {
        map[id] = link;
      }
      return map;
    }, {});
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }
        tocLinks.forEach(function (link) {
          link.classList.remove("is-active");
        });
        var active = linkMap[entry.target.id];
        if (active) {
          active.classList.add("is-active");
        }
      });
    }, { rootMargin: "-35% 0px -55% 0px", threshold: 0.01 });

    Object.keys(linkMap).forEach(function (id) {
      observer.observe(document.getElementById(id));
    });
  }

  function setupCopyEmail() {
    var copyButtons = Array.prototype.slice.call(document.querySelectorAll("[data-copy-email]"));
    copyButtons.forEach(function (button) {
      var holdTimer = null;
      var progressTimer = null;
      var progress = 0;
      button.classList.add("hold-copy");

      function setProgress(value) {
        progress = value;
        button.style.setProperty("--hold-progress", progress + "%");
      }

      function feedback(text) {
        var node = document.querySelector(".copy-feedback");
        if (node) {
          node.textContent = text;
        }
        writeTerminal("> Clipboard: " + text);
      }

      function reset() {
        window.clearTimeout(holdTimer);
        window.clearInterval(progressTimer);
        setProgress(0);
      }

      function finish() {
        var email = button.getAttribute("data-email") || "";
        var encoded = window.btoa(email);
        setProgress(100);
        feedback(encoded);

        var done = function () {
          window.setTimeout(function () {
            feedback("COPIED TO CLIPBOARD");
            reset();
          }, 500);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(email).then(done).catch(function () {
            window.location.href = "mailto:" + email;
          });
        } else {
          window.location.href = "mailto:" + email;
        }
      }

      button.addEventListener("pointerdown", function () {
        reset();
        writeTerminal("> Hold to copy: email");
        progressTimer = window.setInterval(function () {
          setProgress(Math.min(100, progress + 5));
        }, 42);
        holdTimer = window.setTimeout(finish, 850);
      });

      ["pointerup", "pointerleave", "pointercancel"].forEach(function (eventName) {
        button.addEventListener(eventName, function () {
          if (progress < 100) {
            reset();
          }
        });
      });
    });
  }

  function setupTerminal() {
    if (terminalNode) {
      return;
    }
    terminalNode = document.createElement("div");
    terminalNode.className = "dom-terminal";
    terminalNode.textContent = "> DOM ready";
    document.body.appendChild(terminalNode);

    document.addEventListener("mouseover", function (event) {
      var link = event.target.closest && event.target.closest("a, button, summary");
      if (link) {
        writeTerminal("> User hovering: " + (link.textContent || link.getAttribute("aria-label") || "interactive").trim());
      }
    });
  }

  function writeTerminal(message) {
    if (terminalNode) {
      terminalNode.textContent = message;
    }
  }

  function updateFavicon(direction) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var link = document.querySelector("link[rel='icon']");
    canvas.width = 64;
    canvas.height = 64;

    if (!ctx || !link) {
      return;
    }

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "#9b111e";

    if (direction === "up") {
      ctx.beginPath();
      ctx.moveTo(32, 12);
      ctx.lineTo(50, 38);
      ctx.lineTo(38, 38);
      ctx.lineTo(38, 52);
      ctx.lineTo(26, 52);
      ctx.lineTo(26, 38);
      ctx.lineTo(14, 38);
      ctx.closePath();
      ctx.fill();
    } else if (direction === "down") {
      ctx.beginPath();
      ctx.moveTo(32, 52);
      ctx.lineTo(50, 26);
      ctx.lineTo(38, 26);
      ctx.lineTo(38, 12);
      ctx.lineTo(26, 12);
      ctx.lineTo(26, 26);
      ctx.lineTo(14, 26);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(20, 20, 24, 24);
    }

    link.href = canvas.toDataURL("image/png");
  }

  function setupTelemetry() {
    var footer = document.querySelector(".site-footer");
    if (!footer || document.querySelector(".telemetry")) {
      return;
    }

    var telemetry = document.createElement("span");
    telemetry.className = "telemetry";
    telemetry.textContent = "NET -- / BAT --";
    footer.appendChild(telemetry);

    function render(battery) {
      var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      var network = connection && connection.effectiveType ? connection.effectiveType.toUpperCase() : "NET";
      var batteryText = battery ? Math.round(battery.level * 100) + "%" : "--";
      telemetry.textContent = network + " / BAT " + batteryText;
    }

    if (navigator.getBattery) {
      navigator.getBattery().then(function (battery) {
        render(battery);
        battery.addEventListener("levelchange", function () {
          render(battery);
        });
      }).catch(function () {
        render(null);
      });
    } else {
      render(null);
    }
  }

  function setupMouseGlowAndIdle() {
    if (!finePointer) {
      return;
    }

    var glow = document.createElement("div");
    var dimmer = document.createElement("div");
    var noise = document.createElement("div");
    var snapDot = document.createElement("div");
    var idleTimer;
    var lastMouse = { x: 0, y: 0, time: performance.now() };
    glow.className = "mouse-glow";
    dimmer.className = "focus-dimmer";
    noise.className = "noise-field";
    snapDot.className = "snap-dot";
    document.body.appendChild(glow);
    document.body.appendChild(dimmer);
    document.body.appendChild(noise);
    document.body.appendChild(snapDot);

    function wake() {
      document.body.classList.remove("is-idle");
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(function () {
        document.body.classList.add("is-idle");
      }, 10000);
    }

    document.addEventListener("pointermove", function (event) {
      var now = performance.now();
      var dx = event.clientX - lastMouse.x;
      var dy = event.clientY - lastMouse.y;
      var dt = Math.max(16, now - lastMouse.time);
      var speed = Math.min(1, Math.sqrt(dx * dx + dy * dy) / dt / 2);
      var snapX = Math.round(event.clientX / 50) * 50;
      var snapY = Math.round(event.clientY / 50) * 50;

      glow.style.left = event.clientX + "px";
      glow.style.top = event.clientY + "px";
      noise.style.setProperty("--noise-opacity", (0.035 + speed * 0.11).toFixed(3));
      snapDot.style.transform = "translate3d(" + snapX + "px," + snapY + "px,0)";
      document.documentElement.style.setProperty("--edge-back-y", event.clientY + "px");
      lastMouse = { x: event.clientX, y: event.clientY, time: now };
      wake();
    }, { passive: true });

    document.addEventListener("keydown", wake);
    document.addEventListener("scroll", wake, { passive: true });
    wake();
  }

  function setupSpringCursor() {
    if (!finePointer || prefersReducedMotion) {
      return;
    }

    var cursor = document.createElement("div");
    var target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var current = { x: target.x, y: target.y };
    cursor.className = "spring-cursor";
    document.body.appendChild(cursor);

    document.addEventListener("pointermove", function (event) {
      target.x = event.clientX;
      target.y = event.clientY;
    }, { passive: true });

    function tick() {
      current.x += (target.x - current.x) * 0.18;
      current.y += (target.y - current.y) * 0.18;
      cursor.style.transform = "translate3d(" + current.x + "px," + current.y + "px,0) translate(-50%, -50%)";
      window.requestAnimationFrame(tick);
    }

    tick();
  }

  function setupMagneticPhysics() {
    if (!finePointer || prefersReducedMotion) {
      return;
    }

    var targets = Array.prototype.slice.call(document.querySelectorAll(".button, .text-link, .contact-link, .nav-menu summary, .side-toc a"));
    targets.forEach(function (node) {
      var position = { x: 0, y: 0 };
      var velocity = { x: 0, y: 0 };
      var goal = { x: 0, y: 0 };
      var active = false;

      function animate() {
        velocity.x += (goal.x - position.x) * 0.18;
        velocity.y += (goal.y - position.y) * 0.18;
        velocity.x *= 0.62;
        velocity.y *= 0.62;
        position.x += velocity.x;
        position.y += velocity.y;
        node.style.transform = "translate3d(" + position.x.toFixed(2) + "px," + position.y.toFixed(2) + "px,0)";

        if (active || Math.abs(position.x) > 0.1 || Math.abs(position.y) > 0.1 || Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1) {
          window.requestAnimationFrame(animate);
        } else {
          node.style.transform = "";
        }
      }

      node.addEventListener("pointerenter", function () {
        active = true;
        window.requestAnimationFrame(animate);
      });

      node.addEventListener("pointermove", function (event) {
        var rect = node.getBoundingClientRect();
        goal.x = (event.clientX - rect.left - rect.width / 2) * 0.26;
        goal.y = (event.clientY - rect.top - rect.height / 2) * 0.36;
      });

      node.addEventListener("pointerleave", function () {
        active = false;
        goal.x = 0;
        goal.y = 0;
      });
    });
  }

  function setupMagnetizedBrand() {
    var brand = document.querySelector(".brand");
    if (!brand || brand.dataset.magnetized || !finePointer) {
      return;
    }
    var text = brand.textContent;
    brand.dataset.magnetized = "true";
    brand.setAttribute("aria-label", text);
    brand.innerHTML = text.split("").map(function (char) {
      return '<span aria-hidden="true">' + (char === " " ? "&nbsp;" : char) + "</span>";
    }).join("");

    var letters = Array.prototype.slice.call(brand.querySelectorAll("span"));
    document.addEventListener("pointermove", function (event) {
      letters.forEach(function (letter) {
        var rect = letter.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = cx - event.clientX;
        var dy = cy - event.clientY;
        var dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        var force = Math.max(0, 1 - dist / 120) * 8;
        letter.style.transform = "translate(" + (dx / dist * force).toFixed(2) + "px," + (dy / dist * force).toFixed(2) + "px)";
      });
    }, { passive: true });
  }

  function setupPseudoCodeSwap() {
    var snippets = {
      "Hydraulic + Civil Systems": "def model_flow(site):\n    return ras.run(swmm.clean(site))",
      "Spatial Evidence": "map = arcgis.join(receptors, drainage)\nmap.export('decision_context')",
      "Engineering Data": "df = clean(raw)\nplot(checks(df))",
      "Research Methods": "for model in fod_models:\n    compare(model, field_data)"
    };

    Array.prototype.slice.call(document.querySelectorAll(".stack-node")).forEach(function (node) {
      var heading = node.querySelector("h3");
      var paragraph = node.querySelector("p");
      if (!heading || !paragraph) {
        return;
      }
      var original = paragraph.textContent;
      var snippet = snippets[heading.textContent.trim()] || "def explain(system):\n    return model(system).validate()";
      node.addEventListener("mouseenter", function () {
        paragraph.textContent = snippet;
        writeTerminal("> Pseudo-code: " + heading.textContent.trim());
      });
      node.addEventListener("mouseleave", function () {
        paragraph.textContent = original;
      });
    });
  }

  function setupPageTransitions() {
    if (prefersReducedMotion || document.querySelector(".page-curtain")) {
      return;
    }
    var curtain = document.createElement("div");
    curtain.className = "page-curtain";
    curtain.innerHTML = "<span></span><span></span><span></span>";
    document.body.appendChild(curtain);

    document.addEventListener("click", function (event) {
      var link = event.target.closest && event.target.closest("a[href]");
      if (!link || link.target || link.hasAttribute("download") || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      var href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("http")) {
        return;
      }
      event.preventDefault();
      link.classList.add("glitching");
      curtain.classList.add("is-active");
      writeTerminal("> Navigating: " + href);
      window.setTimeout(function () {
        window.location.href = href;
      }, 310);
    });
  }

  function setupSecretModes() {
    var buffer = "";
    var hero = document.querySelector(".home-intro");
    if (hero) {
      hero.addEventListener("dblclick", function (event) {
        if (event.target.closest("a, button")) {
          return;
        }
        document.documentElement.classList.toggle("red-alert-mode");
        writeTerminal("> Theme: RED ALERT");
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key.length !== 1) {
        return;
      }
      buffer = (buffer + event.key.toLowerCase()).slice(-6);
      if (buffer.endsWith("wire")) {
        document.documentElement.classList.toggle("wire-mode");
        writeTerminal("> Protocol: WIREFRAME");
      }
    });
  }

  function setupScreensaver() {
    if (document.querySelector(".screensaver-cube")) {
      return;
    }
    var cube = document.createElement("div");
    var timer;
    cube.className = "screensaver-cube";
    document.body.appendChild(cube);

    function reset() {
      document.body.classList.remove("screensaver-on");
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        document.body.classList.add("screensaver-on");
      }, 30000);
    }

    ["mousemove", "keydown", "scroll", "pointerdown"].forEach(function (eventName) {
      document.addEventListener(eventName, reset, { passive: true });
    });
    reset();
  }

  function setupGyroParallax() {
    if (!window.DeviceOrientationEvent || prefersReducedMotion) {
      return;
    }
    window.addEventListener("deviceorientation", function (event) {
      var gamma = Math.max(-12, Math.min(12, event.gamma || 0));
      var beta = Math.max(-12, Math.min(12, event.beta || 0));
      document.body.style.transform = "perspective(1200px) rotateX(" + (-beta * 0.05).toFixed(2) + "deg) rotateY(" + (gamma * 0.05).toFixed(2) + "deg)";
    }, { passive: true });
  }

  function setupSonarPing() {
    var menu = document.querySelector(".nav-menu summary");
    var audioContext = null;
    if (!menu) {
      return;
    }
    menu.addEventListener("mouseenter", function () {
      try {
        audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
        var oscillator = audioContext.createOscillator();
        var gain = audioContext.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(92, audioContext.currentTime);
        gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.035, audioContext.currentTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.42);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.46);
      } catch (error) {
        // Browsers can block audio before user activation; ignore quietly.
      }
    });
  }

  function setupProximityType() {
    if (!finePointer || prefersReducedMotion) {
      return;
    }
    var headings = Array.prototype.slice.call(document.querySelectorAll("main h2"));
    document.addEventListener("pointermove", function (event) {
      headings.forEach(function (heading) {
        var rect = heading.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dist = Math.sqrt(Math.pow(cx - event.clientX, 2) + Math.pow(cy - event.clientY, 2));
        var spacing = Math.max(-0.035, Math.min(0.04, (1 - dist / 360) * 0.04));
        heading.style.letterSpacing = spacing.toFixed(3) + "em";
      });
    }, { passive: true });
  }

  function setupCursorPreview() {
    if (!finePointer || prefersReducedMotion) {
      return;
    }

    var preview = document.createElement("div");
    var image = document.createElement("img");
    preview.className = "cursor-preview";
    preview.appendChild(image);
    document.body.appendChild(preview);

    function attachPreview(trigger, src) {
      if (!trigger || !src) {
        return;
      }
      trigger.addEventListener("mouseenter", function () {
        image.src = src;
        preview.classList.add("is-visible");
      });
      trigger.addEventListener("mouseleave", function () {
        preview.classList.remove("is-visible");
      });
      trigger.addEventListener("mousemove", function (event) {
        preview.style.left = event.clientX + 24 + "px";
        preview.style.top = event.clientY + 18 + "px";
      });
    }

    Array.prototype.slice.call(document.querySelectorAll(".project-block")).forEach(function (block) {
      var trigger = block.querySelector("h3");
      var img = block.querySelector(".project-visual img");
      attachPreview(trigger, img && img.getAttribute("src"));
    });

    Array.prototype.slice.call(document.querySelectorAll(".path-card")).forEach(function (card) {
      var trigger = card.querySelector("strong");
      var img = card.querySelector("img");
      attachPreview(trigger, img && img.getAttribute("src"));
    });
  }

  function splitHeadings() {
    if (prefersReducedMotion) {
      return;
    }

    Array.prototype.slice.call(document.querySelectorAll("main h1, main h2")).forEach(function (heading) {
      if (heading.dataset.split) {
        return;
      }
      var text = heading.textContent.trim();
      var words = text.split(/\s+/);
      heading.setAttribute("aria-label", text);
      heading.classList.add("split-ready");
      heading.dataset.split = "true";
      heading.innerHTML = words.map(function (word, index) {
        return '<span class="split-word" aria-hidden="true"><span style="--split-index:' + index + '">' + word + '</span></span>';
      }).join(" ");
    });
  }

  function setupReveal() {
    var revealNodes = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (!("IntersectionObserver" in window)) {
      revealNodes.forEach(function (node) {
        node.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealNodes.forEach(function (node) {
      observer.observe(node);
    });
  }

  function setupMarquee() {
    var footer = document.querySelector(".site-footer");
    if (!footer || document.querySelector(".skill-marquee")) {
      return;
    }
    var text = "HEC-RAS / EPA SWMM / Civil 3D / ArcGIS Pro / Python / Landfill Methane / PFAS / SEM / Geotechnical QA-QC / Engineering Data";
    var marquee = document.createElement("div");
    marquee.className = "skill-marquee";
    marquee.innerHTML = '<div class="skill-marquee-track"><span>' + text + '</span><span>' + text + '</span></div>';
    footer.insertAdjacentElement("afterend", marquee);
  }

  function setupDynamicTitle() {
    document.addEventListener("visibilitychange", function () {
      document.title = document.hidden ? "Don't leave the site!" : originalTitle;
    });
  }

  function setupMatrixMode() {
    var buffer = "";
    document.addEventListener("keydown", function (event) {
      if (event.key.length !== 1) {
        return;
      }
      buffer = (buffer + event.key.toLowerCase()).slice(-6);
      if (buffer === "matrix") {
        document.documentElement.classList.toggle("matrix-mode");
      }
    });
  }

  function setupEdgeBack() {
    var isHome = location.pathname === "/" || location.pathname.endsWith("/index.html");
    if (isHome || document.querySelector(".edge-back")) {
      return;
    }
    var back = document.createElement("a");
    back.className = "edge-back";
    back.href = "../";
    back.textContent = "\u2190 Back";
    document.body.appendChild(back);
  }

  injectSvgFilter();
  setupPreloaderAndGreeting();
  setupTerminal();
  setupTelemetry();
  setupMomentumScroll();
  setupScrollUi();
  setupNavigation();
  setupTocState();
  setupCopyEmail();
  setupMouseGlowAndIdle();
  setupSpringCursor();
  setupMagneticPhysics();
  setupMagnetizedBrand();
  setupPseudoCodeSwap();
  setupCursorPreview();
  splitHeadings();
  setupMarquee();
  setupDynamicTitle();
  setupMatrixMode();
  setupSecretModes();
  setupScreensaver();
  setupSonarPing();
  setupProximityType();
  setupPageTransitions();
  setupEdgeBack();
  setupReveal();
}());
