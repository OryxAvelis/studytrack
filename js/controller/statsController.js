export function initializeStats() {
  document.querySelectorAll('[data-stat]').forEach((stat) => {
    stat.setAttribute('aria-live', 'polite');
  });
}