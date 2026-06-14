(function () {
  var root = document.documentElement;
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var originalTitle = document.title;

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
    if (prefersReducedMotion || !finePointer) {
      return;
    }

    var targetY = window.scrollY;
    var currentY = window.scrollY;
    var ticking = false;

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function maxScroll() {
      return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    }

    function animate() {
      currentY += (targetY - currentY) * 0.14;
      window.scrollTo(0, currentY);
      if (Math.abs(targetY - currentY) > 0.5) {
        window.requestAnimationFrame(animate);
      } else {
        currentY = targetY;
        ticking = false;
      }
    }

    window.addEventListener("wheel", function (event) {
      if (event.ctrlKey) {
        return;
      }
      event.preventDefault();
      targetY = clamp(targetY + event.deltaY, 0, maxScroll());
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(animate);
      }
    }, { passive: false });

    window.addEventListener("scroll", function () {
      if (!ticking) {
        targetY = window.scrollY;
        currentY = window.scrollY;
      }
    }, { passive: true });
  }

  function setupScrollUi() {
    var meter = document.querySelector(".scroll-meter span");
    var backTop = document.querySelector(".back-top");
    var updateScrollUi = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var progress = max > 0 ? (window.scrollY / max) * 100 : 0;
      if (meter) {
        meter.style.setProperty("--scroll-progress", progress.toFixed(2) + "%");
      }
      if (backTop) {
        backTop.classList.toggle("is-visible", window.scrollY > 420);
      }
    };

    updateScrollUi();
    window.addEventListener("scroll", updateScrollUi, { passive: true });
    window.addEventListener("resize", updateScrollUi);
  }

  function setupNavigation() {
    var menus = Array.prototype.slice.call(document.querySelectorAll(".nav-menu"));
    menus.forEach(function (menu) {
      menu.addEventListener("click", function (event) {
        if (event.target.tagName === "A") {
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
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        menus.forEach(function (menu) {
          menu.removeAttribute("open");
        });
      }
    });
  }

  function setupCommandDialog() {
    var commandDialog = document.querySelector(".command-dialog");
    var commandOpeners = Array.prototype.slice.call(document.querySelectorAll("[data-command-open]"));
    var openCommand = function () {
      if (!commandDialog) {
        return;
      }
      if (typeof commandDialog.showModal === "function") {
        commandDialog.showModal();
      } else {
        commandDialog.setAttribute("open", "");
      }
    };

    commandOpeners.forEach(function (button) {
      button.addEventListener("click", openCommand);
    });

    if (commandDialog) {
      commandDialog.addEventListener("click", function (event) {
        if (event.target.tagName === "A") {
          commandDialog.close();
        }
      });
    }

    document.addEventListener("keydown", function (event) {
      var target = event.target;
      var isTyping = target && /input|textarea|select/i.test(target.tagName || "");
      if (!isTyping && (event.key === "/" || (event.ctrlKey && event.key.toLowerCase() === "k"))) {
        event.preventDefault();
        openCommand();
      }
    });
  }

  function setupCopyEmail() {
    var copyButtons = Array.prototype.slice.call(document.querySelectorAll("[data-copy-email]"));
    copyButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        var email = button.getAttribute("data-email") || "";
        var feedback = document.querySelector(".copy-feedback");
        var setFeedback = function (text) {
          if (feedback) {
            feedback.textContent = text;
          }
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(email).then(function () {
            setFeedback("Email copied.");
          }).catch(function () {
            window.location.href = "mailto:" + email;
          });
        } else {
          window.location.href = "mailto:" + email;
        }
      });
    });
  }

  function setupMouseGlowAndIdle() {
    if (!finePointer) {
      return;
    }

    var glow = document.createElement("div");
    var dimmer = document.createElement("div");
    var idleTimer;
    glow.className = "mouse-glow";
    dimmer.className = "focus-dimmer";
    document.body.appendChild(glow);
    document.body.appendChild(dimmer);

    function wake() {
      document.body.classList.remove("is-idle");
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(function () {
        document.body.classList.add("is-idle");
      }, 10000);
    }

    document.addEventListener("pointermove", function (event) {
      glow.style.left = event.clientX + "px";
      glow.style.top = event.clientY + "px";
      document.documentElement.style.setProperty("--edge-back-y", event.clientY + "px");
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
    document.documentElement.classList.add("cursor-enabled");

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

    var targets = Array.prototype.slice.call(document.querySelectorAll(".button, .text-link, .contact-link, .nav-command, .nav-menu summary, .command-grid a"));
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
      if (heading.closest(".command-dialog") || heading.dataset.split) {
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

  function injectReadTime() {
    var main = document.querySelector("main");
    if (!main || document.querySelector(".read-time-pill")) {
      return;
    }
    var words = main.innerText.trim().split(/\s+/).filter(Boolean).length;
    if (words < 180) {
      return;
    }
    var minutes = Math.max(1, Math.ceil(words / 220));
    var pill = document.createElement("p");
    var anchor = document.querySelector(".chapter-hero, .status-strip");
    pill.className = "read-time-pill";
    pill.textContent = minutes + " min read";
    if (anchor) {
      anchor.insertAdjacentElement("afterend", pill);
    }
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
  setupMomentumScroll();
  setupScrollUi();
  setupNavigation();
  setupCommandDialog();
  setupCopyEmail();
  setupMouseGlowAndIdle();
  setupSpringCursor();
  setupMagneticPhysics();
  setupCursorPreview();
  splitHeadings();
  injectReadTime();
  setupMarquee();
  setupDynamicTitle();
  setupMatrixMode();
  setupEdgeBack();
  setupReveal();
}());
