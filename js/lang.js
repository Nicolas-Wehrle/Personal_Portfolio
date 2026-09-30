/*
 * Personal Portfolio - severinwehrle.dev
 * Author: Severin Wehrle (github.com/Tigrolino)
 * Contact: severin.wehrle@bluewin.ch
 * License: MIT - see LICENSE in the repo root.
 */

// EN/DE language toggle with a staggered "wave" swap animation.
(function () {
    const toggleBtn = document.getElementById('lang-toggle');
    if (!toggleBtn) return;

    const translatable = Array.from(document.querySelectorAll('[data-en]'));

    // The language tag next to "View on GitHub" has no translation of its
    // own (it's the same text in both languages), so it never gets a wave
    // entry and never fades. But the link's text width changes between EN
    // and DE, which reflows the row it shares with the tag - without also
    // fading the tag, that reflow shows up as a sudden sideways snap. Fading
    // it in sync with its link (even though its own text never changes)
    // hides that reflow behind the same fade the link is already doing.
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
    const RESIZE_BUFFER = 60; // ms after a group's own text has swapped before its height starts easing

    let currentLang = 'en';
    let animating = false;

    // When in the (staggered) wave a given element's own text actually
    // changes - used so a container only waits for ITS OWN content to swap
    // before resizing, instead of the whole page-wide wave finishing.
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
        // No overflow:hidden here on purpose - a card's footer (link +
        // language tag) sits flush against its bottom edge, and clipping
        // overflow would cut it off entirely whenever the new text is tall
        // enough to briefly push it past this old, not-yet-resized height.
        // Content may show slightly outside the card for a moment instead,
        // which is far less jarring than the footer vanishing.
        el.style.height = el.getBoundingClientRect().height + 'px';
    }

    // Animates every element in `els` to its new natural height together -
    // all switched to "auto" in the same pass first, so a CSS grid row's
    // stretch-to-tallest-sibling behavior is recalculated against each
    // other's new sizes (not against still-locked old sizes one at a time),
    // then eased there in sync.
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
            void el.offsetHeight; // commit the "back to startHeight" style before transitioning, or it never animates
        });

        els.forEach((el, i) => {
            el.style.transition = `height ${RESIZE_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1)`;
            el.style.height = endHeights[i] + 'px';

            // Cleanup can't rely on "transitionend" alone - if start and end
            // height happen to be equal (common: not every card changes line
            // count between languages), the browser never fires it since
            // nothing actually changed, which would leave this card stuck
            // forever with overflow hidden and a stale locked height. A
            // timeout fallback guarantees it always gets released.
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

    // Groups elements by their current top offset - i.e. by which CSS grid
    // row they're actually rendered in right now. Cards in the same row
    // stretch to match each other's height, so they need to be measured and
    // animated together, or they visually drift apart mid-transition.
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

    // A "resize group" is a set of elements that should resize together
    // (so grid row stretching stays in sync), timed to its own content's
    // swap point rather than to every other element on the page.
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
                const text = el.dataset[nextLang];
                if (text === undefined) return;
                // Update just the element's own text node rather than
                // el.textContent = text, which would also wipe out any
                // decorative child element - e.g. the invisible .tap-target
                // span some buttons/links use to enlarge their click area.
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
            }, delay + SWAP_POINT);

            setTimeout(() => {
                el.classList.remove('lang-wave');
                if (syncEl) syncEl.classList.remove('lang-wave');
            }, delay + ANIM_DURATION);
        });
    }

    function toggleLanguage() {
        if (animating) return;
        animating = true;

        document.body.classList.add('entrance-played');

        const toggleEl = document.querySelector('.works-toggle');
        const cardEls = Array.from(document.querySelectorAll('#projects .projects-grid:not(.is-hidden) .project-card'));

        resizeGroup([toggleEl]);
        // Cards are grouped and animated by row (their actual grid row-mates),
        // not the whole grid at once (too slow - waits for the last card) and
        // not each card fully independently (breaks grid row-stretch sync
        // between a card and the sibling next to it).
        groupByRow(cardEls).forEach((row) => resizeGroup(row));

        const nextLang = currentLang === 'en' ? 'de' : 'en';
        runWave(nextLang);

        const totalDuration = (translatable.length - 1) * WAVE_STEP + ANIM_DURATION;
        setTimeout(() => {
            currentLang = nextLang;
            document.documentElement.lang = nextLang;
            animating = false;
        }, totalDuration);
    }

    toggleBtn.addEventListener('click', toggleLanguage);
})();
