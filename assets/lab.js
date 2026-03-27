(() => {
  'use strict';

  const triggers = Array.from(document.querySelectorAll('.keyword-trigger'));
  if (triggers.length === 0) return;

  const supportsPointer = 'PointerEvent' in window;

  const clearPressed = () => {
    triggers.forEach((trigger) => trigger.classList.remove('is-pressed'));
  };

  const setPressed = (trigger) => {
    triggers.forEach((item) => item.classList.toggle('is-pressed', item === trigger));
  };

  triggers.forEach((trigger) => {
    if (supportsPointer) {
      trigger.addEventListener('pointerdown', (event) => {
        if (event.pointerType && event.pointerType !== 'mouse') {
          setPressed(trigger);
        }
      });

      trigger.addEventListener('pointerup', clearPressed);
      trigger.addEventListener('pointercancel', clearPressed);
      trigger.addEventListener('pointerleave', (event) => {
        if (event.pointerType && event.pointerType !== 'mouse') {
          clearPressed();
        }
      });
    }

    trigger.addEventListener('touchstart', () => {
      setPressed(trigger);
    }, { passive: true });

    trigger.addEventListener('touchend', clearPressed);
    trigger.addEventListener('touchcancel', clearPressed);
    trigger.addEventListener('dragstart', clearPressed);
    trigger.addEventListener('blur', clearPressed);
  });

  window.addEventListener('scroll', clearPressed, { passive: true });
  window.addEventListener('blur', clearPressed);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearPressed();
  });
})();
