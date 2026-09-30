/*
 * Personal Portfolio - severinwehrle.dev
 * Author: Severin Wehrle (github.com/Tigrolino)
 * Contact: severin.wehrle@bluewin.ch
 * License: MIT - see LICENSE in the repo root.
 */

// EN/DE language toggle, wave swap animation, plus initial language
// resolution and cross-page link rewriting.
(function () {
    const toggleBtn = document.getElementById('lang-toggle');
    if (!toggleBtn) return;

    const translatable = Array.from(document.querySelectorAll('[data-en]'));
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // project-lang tag has no translation, but fade it with its link
    // anyway so the row's width-driven reflow doesn't snap
    const syncFadeMap = new Map();
    document.querySelectorAll('.project-footer').forEach((footer) => {
        const link = footer.querySelector('a[data-en]');
        const tag = footer.querySelector('.project-lang');
        if (link && tag) syncFadeMap.set(link, tag);
    });

    const WAVE_STEP = 35;
    const SWAP_POINT = 350;
    const ANIM_DURATION = 800;

    const RESIZE_DURATION = 450;
    const RESIZE_BUFFER = 60;

    let currentLang = 'en';
    let animating = false;

    function applyText(el, lang) {
        const text = el.dataset[lang];
        if (text === undefined) return;
        let textNode = null;
        for (const node of el.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                textNode = node;
                break;
            }
        }
        if (textNode) {
            textNode.data = text;
        } else {
            el.insertBefore(document.createTextNode(text), el.firstChild);
        }
    }

    function setLanguageInstant(lang) {
        translatable.forEach((el) => applyText(el, lang));
    }

    function withLangParam(href, lang) {
        const hashIndex = href.indexOf('#');
        const hash = hashIndex === -1 ? '' : href.slice(hashIndex);
        const base = hashIndex === -1 ? href : href.slice(0, hashIndex);
        const qIndex = base.indexOf('?');
        const path = qIndex === -1 ? base : base.slice(0, qIndex);
        const query = qIndex === -1 ? '' : base.slice(qIndex + 1);
        const params = new URLSearchParams(query);
        params.set('lang', lang);
        const qs = params.toString();
        return path + (qs ? '?' + qs : '') + hash;
    }

    function updateLangLinks(lang) {
        document.querySelectorAll('a.lang-link').forEach((a) => {
            const original = a.getAttribute('href');
            if (!original) return;
            a.setAttribute('href', withLangParam(original, lang));
        });
    }

    // aria-label mirrors the visible EN/DE text so it satisfies the
    // "label in name" rule instead of just saying "Switch language".
    function updateToggleLabel(lang) {
        toggleBtn.setAttribute('aria-label', lang === 'de'
            ? 'DE – zu Englisch wechseln'
            : 'EN – switch to German');
    }

    // meta description isn't a text node, so it can't go through
    // applyText - it has its own data-desc-en/data-desc-de attributes.
    function updateMetaDescription(lang) {
        const meta = document.querySelector('meta[name="description"]');
        if (!meta || !meta.dataset.descEn) return;
        meta.setAttribute('content', lang === 'de' ? meta.dataset.descDe : meta.dataset.descEn);
    }

    function applyLangSideEffects(lang) {
        document.documentElement.lang = lang;
        updateLangLinks(lang);
        updateToggleLabel(lang);
        updateMetaDescription(lang);
    }

    function swapTimeFor(el) {
        let latest = 0;
        translatable.forEach((node, i) => {
            if (node === el || el.contains(node)) {
                latest = Math.max(latest, i * WAVE_STEP + SWAP_POINT);
            }
        });
        return latest;
    }

    function lockHeight(el) {
        el.style.height = el.getBoundingClientRect().height + 'px';
    }

    function animateToNaturalHeight(els) {
        const startHeights = els.map((el) => el.getBoundingClientRect().height);

        els.forEach((el) => {
            el.style.height = 'auto';
        });
        const endHeights = els.map((el) => el.getBoundingClientRect().height);

        els.forEach((el, i) => {
            el.style.height = startHeights[i] + 'px';
        });
        els.forEach((el) => {
            void el.offsetHeight;
        });

        els.forEach((el, i) => {
            el.style.transition = `height ${RESIZE_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1)`;
            el.style.height = endHeights[i] + 'px';

            let cleaned = false;
            function cleanup() {
                if (cleaned) return;
                cleaned = true;
                el.style.height = '';
                el.style.transition = '';
            }
            el.addEventListener('transitionend', function handler(e) {
                if (e.propertyName !== 'height') return;
                el.removeEventListener('transitionend', handler);
                cleanup();
            });
            setTimeout(cleanup, RESIZE_DURATION + 50);
        });
    }

    function groupByRow(els) {
        const rows = [];
        els.forEach((el) => {
            const top = el.offsetTop;
            let row = rows.find((r) => r.top === top);
            if (!row) {
                row = { top: top, els: [] };
                rows.push(row);
            }
            row.els.push(el);
        });
        return rows.map((row) => row.els);
    }

    function resizeGroup(els) {
        els = els.filter(Boolean);
        if (els.length === 0) return;

        els.forEach(lockHeight);

        const groupSwapTime = Math.max(...els.map(swapTimeFor));
        setTimeout(() => {
            animateToNaturalHeight(els);
        }, groupSwapTime + RESIZE_BUFFER);
    }

    function runWave(nextLang) {
        translatable.forEach((el, i) => {
            const delay = i * WAVE_STEP;
            const syncEl = syncFadeMap.get(el);

            setTimeout(() => {
                el.classList.add('lang-wave');
                if (syncEl) syncEl.classList.add('lang-wave');
            }, delay);

            setTimeout(() => {
                applyText(el, nextLang);
            }, delay + SWAP_POINT);

            setTimeout(() => {
                el.classList.remove('lang-wave');
                if (syncEl) syncEl.classList.remove('lang-wave');
            }, delay + ANIM_DURATION);
        });
    }

    function toggleLanguage() {
        if (animating) return;

        const nextLang = currentLang === 'en' ? 'de' : 'en';
        currentLang = nextLang;
        applyLangSideEffects(nextLang);

        if (prefersReducedMotion) {
            setLanguageInstant(nextLang);
            return;
        }

        animating = true;
        document.body.classList.add('entrance-played');

        const toggleEl = document.querySelector('.works-toggle');
        const cardEls = Array.from(document.querySelectorAll('#projects .projects-grid:not(.is-hidden) .project-card'));

        resizeGroup([toggleEl]);
        groupByRow(cardEls).forEach((row) => resizeGroup(row));

        runWave(nextLang);

        const totalDuration = (translatable.length - 1) * WAVE_STEP + ANIM_DURATION;
        setTimeout(() => {
            animating = false;
        }, totalDuration);
    }

    function resolveInitialLang() {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get('lang');
        if (fromQuery === 'en' || fromQuery === 'de') return fromQuery;
        if (navigator.language && navigator.language.toLowerCase().startsWith('de')) return 'de';
        return 'en';
    }

    const initialLang = resolveInitialLang();
    if (initialLang !== currentLang) {
        setLanguageInstant(initialLang);
        currentLang = initialLang;
    }
    applyLangSideEffects(currentLang);

    toggleBtn.addEventListener('click', toggleLanguage);
})();
