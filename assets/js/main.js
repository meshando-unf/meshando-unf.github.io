(function () {
  document.documentElement.classList.add("motion-ready");

  var yearNode = document.getElementById("year");
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

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
}());
