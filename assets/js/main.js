/**
 * Sembrandopaz — main.js
 * Minimal, dependency-free JS:
 *  1. Injects the shared header/footer partials (so every page maintains
 *     one copy of the markup instead of 13 duplicated copies).
 *  2. Wires up the mobile navigation toggle.
 *  3. Marks the current page's nav link as active.
 */

(function () {
  "use strict";

  /**
   * Resolves the correct relative path back to /assets and /partials
   * no matter how deep the current page lives (root, /about/,
   * /programs/inspiring-models/morrocoy-nature-reserve/, etc).
   * A `data-root` attribute on <html> (set per page) gives the path
   * prefix back to the site root, e.g. "../" or "../../".
   */
  function siteRoot() {
    return document.documentElement.getAttribute("data-root") || "";
  }

  function loadPartial(selector, file) {
    var mount = document.querySelector(selector);
    if (!mount) return Promise.resolve();

    return fetch(siteRoot() + "assets/partials/" + file)
      .then(function (res) {
        if (!res.ok) throw new Error("Failed to load " + file);
        return res.text();
      })
      .then(function (html) {
        // Rewrite root-relative placeholder links to the correct depth.
        html = html.split("{{root}}").join(siteRoot());
        mount.innerHTML = html;
      })
      .catch(function (err) {
        console.error(err);
      });
  }

  function initNavToggle() {
    var nav = document.querySelector(".site-header nav");
    if (!nav) return;
    var toggle = nav.querySelector(".nav-toggle");
    if (!toggle) return;

    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  function markActiveLink() {
    var current = document.body.getAttribute("data-page");
    if (!current) return;
    document.querySelectorAll(".nav-links a[data-page]").forEach(function (link) {
      if (link.getAttribute("data-page") === current) {
        link.setAttribute("aria-current", "page");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    Promise.all([
      loadPartial("[data-include='header']", "header.html"),
      loadPartial("[data-include='footer']", "footer.html"),
    ]).then(function () {
      initNavToggle();
      markActiveLink();
    });
  });
})();
