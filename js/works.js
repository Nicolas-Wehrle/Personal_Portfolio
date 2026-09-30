/*
 * Personal Portfolio - severinwehrle.dev
 * Author: Severin Wehrle (github.com/Tigrolino)
 * Contact: severin.wehrle@bluewin.ch
 * License: MIT - see LICENSE in the repo root.
 */

// Works section category switch (Software Development <-> Cinematography).
(function () {
    const toggle = document.querySelector('.works-toggle');
    if (!toggle) return;

    const buttons = Array.from(toggle.querySelectorAll('.works-toggle-btn'));
    const grids = Array.from(document.querySelectorAll('.projects-grid'));
    if (buttons.length === 0 || grids.length === 0) return;

    const EXIT_DURATION = 450;
    const CARD_STEP = 70;

    let activeCategory = toggle.dataset.active || 'dev';
    let switching = false;

    function showCategory(category) {
        if (switching || category === activeCategory) return;

        const next = grids.find((g) => g.dataset.category === category);
        if (!next) return;

        switching = true;

        const current = grids.find((g) => g.dataset.category === activeCategory);

        toggle.classList.toggle('is-cinema', category === 'cinematography');
        buttons.forEach((btn) => {
            const isActive = btn.dataset.category === category;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-selected', String(isActive));
        });

        if (current) {
            current.classList.add('is-exiting');
        }

        setTimeout(() => {
            if (current) {
                current.classList.remove('is-exiting');
                current.classList.add('is-hidden');
            }

            next.classList.remove('is-hidden');
            next.classList.add('is-entering');

            const cards = Array.from(next.querySelectorAll('.project-card'));
            cards.forEach((card, i) => {
                card.style.transitionDelay = `${i * CARD_STEP}ms`;
            });

            void next.offsetWidth;

            next.classList.remove('is-entering');

            const totalStagger = cards.length ? (cards.length - 1) * CARD_STEP : 0;
            setTimeout(() => {
                cards.forEach((card) => {
                    card.style.transitionDelay = '';
                });
                switching = false;
            }, totalStagger + EXIT_DURATION);

            activeCategory = category;
        }, EXIT_DURATION);
    }

    buttons.forEach((btn) => {
        btn.addEventListener('click', () => showCategory(btn.dataset.category));
    });
})();
