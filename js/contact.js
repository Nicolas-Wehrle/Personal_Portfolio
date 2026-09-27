// Copies the Discord handle to the clipboard when its card is clicked,
// swapping the handle for a brief "Copied!" using the same fade-up/down
// wave used by the language toggle (see .lang-wave in style.css / js/lang.js),
// then swapping back once the confirmation has had its moment.
(function () {
    const button = document.getElementById('discord-copy');
    if (!button) return;

    const valueEl = button.querySelector('.contact-value');
    if (!valueEl) return;

    const originalText = valueEl.textContent;

    const SWAP_POINT = 350; // ms into the wave when the text itself changes
    const ANIM_DURATION = 800; // matches --lang-wave's own duration
    const HOLD_DURATION = 1500; // how long "Copied!" stays up before reverting

    let busy = false;

    function animatedSwap(text, onDone) {
        valueEl.classList.add('lang-wave');
        setTimeout(() => {
            valueEl.textContent = text;
        }, SWAP_POINT);
        setTimeout(() => {
            valueEl.classList.remove('lang-wave');
            if (onDone) onDone();
        }, ANIM_DURATION);
    }

    function legacyCopy(text) {
        const temp = document.createElement('textarea');
        temp.value = text;
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            // nothing more we can do here
        }
        document.body.removeChild(temp);
    }

    function runCopyFeedback() {
        const lang = document.documentElement.lang === 'de' ? 'de' : 'en';
        const copiedText = lang === 'de' ? 'Kopiert!' : 'Copied!';

        animatedSwap(copiedText, () => {
            setTimeout(() => {
                animatedSwap(originalText, () => {
                    busy = false;
                });
            }, HOLD_DURATION);
        });
    }

    button.addEventListener('click', () => {
        if (busy) return;
        busy = true;

        const handle = button.dataset.copy || originalText;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(handle).then(runCopyFeedback, () => {
                legacyCopy(handle);
                runCopyFeedback();
            });
        } else {
            legacyCopy(handle);
            runCopyFeedback();
        }
    });
})();
