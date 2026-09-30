/*
 * Personal Portfolio - severinwehrle.dev
 * Author: Severin Wehrle (github.com/Tigrolino)
 * Contact: severin.wehrle@bluewin.ch
 * License: MIT - see LICENSE in the repo root.
 */

// Fades each non-hero section in the first time it scrolls into view.
(function () {
    const targets = document.querySelectorAll('section:not(#home)');
    if (targets.length === 0) return;

    if (!('IntersectionObserver' in window)) {
        targets.forEach((el) => el.classList.add('in-view'));
        return;
    }

    const REVEAL_DELAY = 350;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                observer.unobserve(entry.target);
                setTimeout(() => {
                    entry.target.classList.add('in-view');
                }, REVEAL_DELAY);
            }
        });
    }, { threshold: 0 });

    targets.forEach((el) => observer.observe(el));
})();
