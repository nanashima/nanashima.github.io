(() => {
  'use strict';

  const initKeywordTouchSwap = () => {
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
  };

  const getNoticeSummaryData = (item) => ({
    text: typeof item?.summary === 'string'
      ? item.summary
      : (typeof item?.body === 'string' ? item.body : ''),
    html: typeof item?.summaryHtml === 'string'
      ? item.summaryHtml
      : (typeof item?.bodyHtml === 'string' ? item.bodyHtml : '')
  });

  const setNoticeSummaryContent = (element, item) => {
    if (!element) {
      return;
    }

    const summary = getNoticeSummaryData(item);

    if (summary.html) {
      element.innerHTML = summary.html;
      return;
    }

    element.textContent = summary.text || '';
  };

  const initNoticeArchive = () => {
    const notices = Array.isArray(window.labInformationArchive)
      ? window.labInformationArchive.filter((item) => item && (item.title || item.summary || item.summaryHtml || item.body || item.bodyHtml))
      : [];

    if (notices.length === 0) {
      return;
    }

    const toDateLabel = (item) => {
      if (typeof item.dateLabel === 'string' && item.dateLabel.trim() !== '') {
        return item.dateLabel.trim();
      }

      if (typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
        return item.date.replace(/-/g, '.');
      }

      return item.date || '';
    };

    const createNoticeMeta = (item) => {
      const meta = document.createElement('p');
      meta.className = 'notice-meta';

      const kind = document.createElement('span');
      kind.className = 'notice-kind';
      kind.textContent = item.kind || '更新';

      const date = document.createElement('time');
      date.className = 'notice-date';
      date.textContent = toDateLabel(item);
      if (item.date) {
        date.dateTime = item.date;
      }

      meta.append(kind, date);
      return meta;
    };

    const archiveRoot = document.querySelector('[data-notice-archive]');
    if (archiveRoot) {
      const fragment = document.createDocumentFragment();

      notices.forEach((item) => {
        const card = document.createElement('article');
        card.className = 'lab-card notice-archive-card';
        if (item.featured) {
          card.classList.add('is-featured');
        }

        const head = document.createElement('div');
        head.className = 'notice-archive-head';
        head.append(createNoticeMeta(item));

        if (item.featured) {
          const badge = document.createElement('span');
          badge.className = 'notice-archive-badge';
          badge.textContent = 'Featured';
          head.append(badge);
        }

        const title = document.createElement('h3');
        title.textContent = item.title || '';

        const summary = document.createElement('p');
        summary.className = 'notice-archive-summary';
        setNoticeSummaryContent(summary, item);

        card.append(head, title, summary);
        fragment.append(card);
      });

      archiveRoot.replaceChildren(fragment);
    }

    const rotatorRoot = document.querySelector('[data-notice-rotator]');
    if (!rotatorRoot) {
      return;
    }

    const featuredNotices = notices.filter((item) => item.featured);
    const rotatorItems = featuredNotices.length > 0 ? featuredNotices : notices.slice(0, 3);

    if (rotatorItems.length === 0) {
      return;
    }

    const kindElement = rotatorRoot.querySelector('[data-notice-kind]');
    const dateElement = rotatorRoot.querySelector('[data-notice-date]');
    const titleElement = rotatorRoot.querySelector('[data-notice-title]');
    const summaryElement = rotatorRoot.querySelector('[data-notice-summary]');
    const stageElement = rotatorRoot.querySelector('[data-notice-stage]');
    const switcher = rotatorRoot.querySelector('[data-notice-switcher]');
    const switcherWrap = rotatorRoot.querySelector('.notice-switcher-wrap');
    const interval = Math.max(3200, Number.parseInt(rotatorRoot.dataset.noticeInterval || '6400', 10) || 6400);

    let currentIndex = 0;
    let timerId = null;

    const scrollHint = rotatorRoot.querySelector('[data-notice-scroll-hint]');

    const updateOverflowState = () => {
      if (!stageElement) {
        return;
      }

      const hasOverflow = stageElement.scrollHeight - stageElement.clientHeight > 8;
      const isScrollEnd = !hasOverflow || (stageElement.scrollTop + stageElement.clientHeight >= stageElement.scrollHeight - 6);

      rotatorRoot.classList.toggle('has-overflow', hasOverflow);
      rotatorRoot.classList.toggle('is-scroll-end', isScrollEnd);

      if (switcher) {
        switcher.hidden = rotatorItems.length < 2;
      }

      if (switcherWrap) {
        const showFooter = rotatorItems.length > 1 || hasOverflow;
        switcherWrap.hidden = !showFooter;
        switcherWrap.classList.toggle('is-single', rotatorItems.length < 2 && hasOverflow);
      }

      if (scrollHint) {
        scrollHint.hidden = !hasOverflow;
      }
    };

    const requestOverflowStateUpdate = () => {
      window.requestAnimationFrame(updateOverflowState);
    };

    const flashStage = () => {
      if (!stageElement) {
        return;
      }

      stageElement.classList.remove('is-refresh');
      void stageElement.offsetWidth;
      stageElement.classList.add('is-refresh');
    };

    const applyNotice = (index, animate = false) => {
      currentIndex = (index + rotatorItems.length) % rotatorItems.length;
      const item = rotatorItems[currentIndex];

      if (kindElement) {
        kindElement.textContent = item.kind || '更新';
      }

      if (dateElement) {
        dateElement.textContent = toDateLabel(item);
        if (item.date) {
          dateElement.dateTime = item.date;
        } else {
          dateElement.removeAttribute('datetime');
        }
      }

      if (titleElement) {
        titleElement.textContent = item.title || '';
      }

      if (summaryElement) {
        setNoticeSummaryContent(summaryElement, item);
      }

      if (stageElement) {
        stageElement.scrollTop = 0;
        requestOverflowStateUpdate();
      }

      if (switcher) {
        Array.from(switcher.children).forEach((button, buttonIndex) => {
          const isActive = buttonIndex === currentIndex;
          button.classList.toggle('is-active', isActive);
          button.setAttribute('aria-current', isActive ? 'true' : 'false');
        });
      }

      if (animate) {
        flashStage();
      }
    };

    const stopRotation = () => {
      if (timerId !== null) {
        window.clearInterval(timerId);
        timerId = null;
      }
    };

    const startRotation = () => {
      if (rotatorItems.length < 2 || timerId !== null || document.hidden) {
        return;
      }

      timerId = window.setInterval(() => {
        applyNotice(currentIndex + 1, true);
      }, interval);
    };

    const restartRotation = () => {
      stopRotation();
      startRotation();
    };

    if (switcher) {
      rotatorItems.forEach((item, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'notice-switch';
        button.setAttribute('aria-label', `${index + 1}件目のお知らせを表示: ${item.title || ''}`);
        button.addEventListener('click', () => {
          applyNotice(index, true);
          restartRotation();
        });
        switcher.append(button);
      });
    }

    applyNotice(0, false);
    requestOverflowStateUpdate();
    startRotation();

    rotatorRoot.addEventListener('pointerenter', stopRotation);
    rotatorRoot.addEventListener('pointerleave', startRotation);
    rotatorRoot.addEventListener('focusin', stopRotation);
    rotatorRoot.addEventListener('focusout', (event) => {
      if (!rotatorRoot.contains(event.relatedTarget)) {
        startRotation();
      }
    });

    if (stageElement) {
      stageElement.addEventListener('scroll', updateOverflowState, { passive: true });
    }

    window.addEventListener('resize', requestOverflowStateUpdate);

    if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') {
      document.fonts.ready.then(requestOverflowStateUpdate).catch(() => {});
    }

    if ('ResizeObserver' in window && stageElement) {
      const stageObserver = new ResizeObserver(requestOverflowStateUpdate);
      stageObserver.observe(stageElement);
      stageObserver.observe(rotatorRoot);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopRotation();
      } else {
        startRotation();
      }
    });

    window.addEventListener('blur', stopRotation);
    window.addEventListener('focus', startRotation);
  };

  initKeywordTouchSwap();
  initNoticeArchive();
})();
