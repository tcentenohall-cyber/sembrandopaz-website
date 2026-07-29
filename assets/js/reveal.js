/**
 * Subtle scroll-reveal for .reveal elements. Progressive enhancement only:
 * .reveal is visible by default and only hidden/animated once the `js`
 * class is present on <html> (set synchronously in the page head), so
 * content is never hidden if this script fails to load or run.
 */
(function () {
  'use strict';

  var els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  els.forEach(function (el) { io.observe(el); });
})();
