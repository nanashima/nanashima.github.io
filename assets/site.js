(() => {
  'use strict';

  // -----------------------------
  // Small helpers
  // -----------------------------
  const closest = (el, sel) => {
    if (!el || typeof el.closest !== 'function') return null;
    return el.closest(sel);
  };

  const openHref = (href, ev) => {
    if (!href) return;

    // Match typical browser behaviors:
    // - Cmd/Ctrl click => new tab
    // - Middle click => new tab
    // - Otherwise => same tab
    const meta = !!(ev && (ev.metaKey || ev.ctrlKey));
    const middle = !!(ev && typeof ev.button === 'number' && ev.button === 1);
    if (meta || middle) {
      window.open(href, '_blank', 'noopener');
      return;
    }
    window.location.href = href;
  };

  const makeCardClickable = (cardEl, href) => {
    if (!cardEl || !href) return;

    cardEl.classList.add('is-clickable');
    cardEl.dataset.href = href;
    cardEl.setAttribute('role', 'link');
    cardEl.tabIndex = 0;

    cardEl.addEventListener('click', (e) => {
      // Keep normal behavior when clicking an actual link inside.
      if (closest(e.target, 'a')) return;
      openHref(href, e);
    });

    cardEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (closest(e.target, 'a')) return;
        e.preventDefault();
        openHref(href, e);
      }
    });
  };


  const ensureGlowLine = (cardEl) => {
    if (!cardEl) return;
    if (cardEl.querySelector('.card-glowline')) return;
    const s = document.createElement('span');
    s.className = 'card-glowline';
    s.setAttribute('aria-hidden', 'true');
    cardEl.appendChild(s);
  };

  const pickPrimaryLink = (links, preferredKeywords = []) => {
    const arr = Array.from(links || []);
    if (arr.length === 0) return null;

    // Prefer specific link labels such as [full], [paper], ...
    for (const kw of preferredKeywords) {
      const hit = arr.find((a) => ((a.textContent || '').toLowerCase()).includes(kw));
      if (hit) return hit;
    }
    return arr[0];
  };

  // Remove an inline action link (e.g., [full]) and tidy surrounding spaces.
  // Used to avoid showing a duplicate link when the whole card is already clickable.
  const removeLinkAndTidy = (a) => {
    if (!a || !a.parentNode) return;
    const prev = a.previousSibling;
    const next = a.nextSibling;
    a.remove();

    // Trim whitespace around where the link used to be.
    if (prev && prev.nodeType === Node.TEXT_NODE) {
      prev.nodeValue = (prev.nodeValue || '').replace(/\s+$/, '');
      if ((prev.nodeValue || '').length === 0) prev.remove();
    }
    if (next && next.nodeType === Node.TEXT_NODE) {
      next.nodeValue = (next.nodeValue || '').replace(/^\s+/, '');
      if ((next.nodeValue || '').length === 0) next.remove();
    }
  };

  const hasLabel = (a, kw) => ((a && a.textContent) ? a.textContent.toLowerCase() : '').includes(kw);

  // Normalize action labels (kept intentionally minimal and bracketed)
  // - [paper] -> [proc]
  const normalizeActionLabel = (a) => {
    if (!a || !a.textContent) return;
    const t = (a.textContent || '').trim().toLowerCase();
    if (t === '[paper]') a.textContent = '[proc]';
  };


  // -----------------------------
  // Seasonal theme (auto / manual)
  // -----------------------------
  const root = document.documentElement;

  const SEASON_META = {
    spring: { label: 'Spring', motif: 'Cherry & Wisteria' },
    summer: { label: 'Summer', motif: 'Iris & Indigo Flow' },
    autumn: { label: 'Autumn', motif: 'Bush Clover & Moon' },
    winter: { label: 'Winter', motif: 'Plum & Narcissus' }
  };

  const STORAGE_KEY = 'seasonTheme'; // 'auto' | 'spring' | 'summer' | 'autumn' | 'winter'

  const monthToSeason = (m) => {
    // m: 1..12
    if ([3, 4, 5].includes(m)) return 'spring';
    if ([6, 7, 8].includes(m)) return 'summer';
    if ([9, 10, 11].includes(m)) return 'autumn';
    return 'winter';
  };

  const isValid = (value) => value === 'auto' || Object.prototype.hasOwnProperty.call(SEASON_META, value);

  const getQuerySeason = () => {
    try {
      const sp = new URLSearchParams(window.location.search);
      return sp.get('season');
    } catch {
      return null;
    }
  };

  const getStoredSeason = () => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  };

  const setStoredSeason = (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
  };

  const setSeasonInUrl = (value) => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('season', value);
      window.history.replaceState({}, '', url);
    } catch {
      // ignore
    }
  };

  const applySeason = ({ mode, seasonKey }) => {
    root.dataset.season = seasonKey;

    const meta = SEASON_META[seasonKey] || SEASON_META.winter;

    const name = document.getElementById('seasonName');
    const motif = document.getElementById('seasonMotif');
    if (name) name.textContent = meta.label;
    if (motif) motif.textContent = meta.motif;

    const current = document.getElementById('seasonCurrent');
    if (current) current.textContent = meta.label;

    const summary = document.getElementById('seasonSummary');
    if (summary) {
      summary.textContent = mode === 'auto'
        ? `Theme: Auto (${meta.label})`
        : `Theme: ${meta.label}`;
    }

    document.querySelectorAll('[data-set-season]').forEach((btn) => {
      const v = btn.getAttribute('data-set-season');
      const active = mode === 'auto' ? v === 'auto' : v === seasonKey;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  };

  const computeInitial = () => {
    const now = new Date();
    const autoSeason = monthToSeason(now.getMonth() + 1);

    // Priority: URL param > localStorage > auto
    const qs = getQuerySeason();
    if (isValid(qs)) {
      const mode = qs === 'auto' ? 'auto' : 'manual';
      const seasonKey = qs === 'auto' ? autoSeason : qs;
      setStoredSeason(qs);
      return { mode, seasonKey };
    }

    const stored = getStoredSeason();
    if (isValid(stored)) {
      const mode = stored === 'auto' ? 'auto' : 'manual';
      const seasonKey = stored === 'auto' ? autoSeason : stored;
      return { mode, seasonKey };
    }

    return { mode: 'auto', seasonKey: autoSeason };
  };

  applySeason(computeInitial());

  // UI buttons
  document.querySelectorAll('[data-set-season]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const v = btn.getAttribute('data-set-season');
      if (!isValid(v)) return;

      const now = new Date();
      const autoSeason = monthToSeason(now.getMonth() + 1);

      const mode = v === 'auto' ? 'auto' : 'manual';
      const seasonKey = v === 'auto' ? autoSeason : v;

      setStoredSeason(v);
      setSeasonInUrl(v);
      applySeason({ mode, seasonKey });
    });
  });

  // -----------------------------
  // Mobile menu (a11y friendly)
  // -----------------------------
  const toggle = document.querySelector('.menu-toggle');
  const navList = document.getElementById('primary-nav');

  if (toggle && navList) {
    const setExpanded = (isExpanded) => {
      toggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    };

    const toggleMenu = () => {
      const isActive = navList.classList.toggle('active');
      toggle.classList.toggle('active', isActive);
      setExpanded(isActive);
    };

    toggle.addEventListener('click', toggleMenu);

    // Enter / Space
    toggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMenu();
      }
    });

    // Close menu after jump on small screens
    navList.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', () => {
        if (window.matchMedia('(max-width: 768px)').matches && navList.classList.contains('active')) {
          navList.classList.remove('active');
          toggle.classList.remove('active');
          setExpanded(false);
        }
      });
    });
  }

  // -----------------------------
  // Publications: make the list scannable
  // Keeps the author's simple "[N] ..." HTML editing style intact.
  // -----------------------------
  const pubSection = document.getElementById('publications');
  if (pubSection) {
    pubSection.querySelectorAll('p').forEach((p) => {
      // Skip if already processed
      if (p.classList.contains('pub-entry')) return;

      const txt = (p.textContent || '').trim();
      const m = txt.match(/^\[(\d+)\]\s*/);
      if (!m) return;

      const idx = m[1];
      p.classList.add('pub-entry');

      // Collect existing nodes (text + elements) and remove the leading [idx]
      const nodes = Array.from(p.childNodes);
      for (const n of nodes) {
        if (n.nodeType === Node.TEXT_NODE) {
          n.nodeValue = (n.nodeValue || '').replace(/^\s*\[\d+\]\s*/, '');
          break;
        }
      }

      // Rebuild with: [index badge] + [content wrapper]
      const badge = document.createElement('span');
      badge.className = 'pub-index';
      badge.textContent = `[${idx}]`;

      const content = document.createElement('span');
      content.className = 'pub-content';
      nodes.forEach((n) => content.appendChild(n));

      // Clear and append
      while (p.firstChild) p.removeChild(p.firstChild);
      p.appendChild(badge);
      p.appendChild(content);

      // Make the whole entry act like a button/link.
      // Primary: [full] if present, otherwise [proc], otherwise the first link.
      const links = Array.from(p.querySelectorAll('a[href]'));
      links.forEach(normalizeActionLabel);
      if (links.length) {
        const full = links.find((a) => hasLabel(a, 'full'));
        const proc = links.find((a) => hasLabel(a, 'proc') || hasLabel(a, 'proceed') || hasLabel(a, 'paper'));
        const primary = full || proc || links[0];
        const href = primary && primary.getAttribute('href');
        if (href) makeCardClickable(p, href);

        // Remove the duplicate action link from the inline text.
        // - If [full] exists, the card goes to [full] (keep [proc] visible).
        // - Else the card goes to [proc], so drop [proc] from the text.
        if (full) removeLinkAndTidy(full);
        else if (proc) removeLinkAndTidy(proc);
      }
    });
  }

  // -----------------------------
  // Projects / Teaching / Activities: make lists scannable
  // (subtly different per section to avoid monotony)
  // -----------------------------
  const stripLeadingFromFirstTextNode = (el, rx) => {
    const nodes = Array.from(el.childNodes);
    for (const n of nodes) {
      if (n.nodeType === Node.TEXT_NODE) {
        n.nodeValue = (n.nodeValue || '').replace(rx, '');
        break;
      }
    }
  };

  const rebuildEntry = ({ p, badge, body, classNames = [] }) => {
    const nodes = Array.from(p.childNodes);
    nodes.forEach((n) => body.appendChild(n));
    while (p.firstChild) p.removeChild(p.firstChild);
    classNames.forEach((c) => p.classList.add(c));
    p.appendChild(badge);
    p.appendChild(body);
  };

  const enhanceProjects = () => {
    const sec = document.getElementById('projects');
    if (!sec) return;

    let group = '';
    const groupKey = (t) => (t || '').toLowerCase();

    Array.from(sec.children).forEach((el) => {
      if (el.tagName === 'H3') {
        group = el.textContent || '';
        return;
      }
      if (el.tagName !== 'P') return;
      const p = el;
      if (p.classList.contains('item-entry')) return;

      const kind = (() => {
        const g = groupKey(group);
        if (g.includes('principal')) return 'pi';
        if (g.includes('co-')) return 'co';
        if (g.includes('prize') || g.includes('award')) return 'prize';
        return 'misc';
      })();

      const text = (p.textContent || '').trim();
      const rx = /^\s*(\d{4}(?:\.\d{1,2})?)\s*-\s*(\d{4}(?:\.\d{1,2})?|Now)\s+/;
      const m = text.match(rx);

      const badge = document.createElement('span');
      badge.className = 'item-badge';

      if (m) {
        const start = m[1];
        const end = m[2];

        const top = document.createElement('span');
        top.className = 'badge-top';
        top.textContent = start;

        const line = document.createElement('span');
        line.className = 'badge-line';

        const bot = document.createElement('span');
        bot.className = 'badge-bot';
        bot.textContent = end;

        badge.appendChild(top);
        badge.appendChild(line);
        badge.appendChild(bot);

        stripLeadingFromFirstTextNode(p, rx);
      } else {
        // For non-date items (e.g., prizes)
        badge.textContent = kind === 'prize' ? 'Prize' : '—';
      }

      const body = document.createElement('span');
      body.className = 'item-body';

      rebuildEntry({
        p,
        badge,
        body,
        classNames: ['item-entry', 'proj-entry', `item-kind-${kind}`]
      });

      // Make clickable if there is a link.
      const links = Array.from(p.querySelectorAll('a[href]'));
      links.forEach(normalizeActionLabel);
      const primary = pickPrimaryLink(links, ['link', 'full', 'proc', 'paper']);
      if (primary) {
        const href = primary.getAttribute('href');
        if (href) makeCardClickable(p, href);

        // If the whole card is clickable, drop a redundant [link] tag (esp. for Ikushi Prize).
        const t = (primary.textContent || '').trim().toLowerCase();
        if (kind === 'prize' && t === '[link]' && links.length === 1) {
          removeLinkAndTidy(primary);
        }
        // Make selected "feature" cards glow exactly like Publications.
        // (Ikushi Prize: keep the section layout, but match the Publications hover / bottom-rule cue.)
        const bodyLower = (p.textContent || '').toLowerCase();
        if (kind === 'prize' && bodyLower.includes('ikushi prize')) {
          p.classList.add('glow-like-pub');
          ensureGlowLine(p);
        }
      }
    });
  };

  const enhanceTeaching = () => {
    const sec = document.getElementById('teaching');
    if (!sec) return;

    let group = '';

    Array.from(sec.children).forEach((el) => {
      if (el.tagName === 'H3') {
        group = el.textContent || '';
        return;
      }
      if (el.tagName !== 'P') return;
      const p = el;
      if (p.classList.contains('item-entry')) return;

      const kind = (() => {
        const g = (group || '').toLowerCase();
        if (g.includes('instructor')) return 'instructor';
        if (g.trim() === 'ta') return 'ta';
        return 'misc';
      })();

      const badge = document.createElement('span');
      badge.className = 'item-badge';
      badge.textContent = kind === 'instructor' ? 'Instructor' : (kind === 'ta' ? 'TA' : '');

      const body = document.createElement('span');
      body.className = 'item-body';

      rebuildEntry({
        p,
        badge,
        body,
        classNames: ['item-entry', 'teach-entry', `item-kind-${kind}`]
      });
    });
  };

  const enhanceActivities = () => {
    const sec = document.getElementById('activities');
    if (!sec) return;

    let group = '';

    Array.from(sec.children).forEach((el) => {
      if (el.tagName === 'H3') {
        group = el.textContent || '';
        return;
      }
      if (el.tagName !== 'P') return;
      const p = el;
      if (p.classList.contains('item-entry')) return;

      const g = (group || '').toLowerCase();
      const kind = (g.includes('talk') ? 'talk' : (g.includes('review') ? 'review' : 'misc'));

      // Review sub-type (Conference / Journal) for more specific labeling
      const rawText = (p.textContent || '').trim();
      const rawLower = rawText.toLowerCase();

      let reviewSubtype = '';
      if (kind === 'review') {
        if (rawLower.startsWith('conferences:') || rawLower.startsWith('conference:')) reviewSubtype = 'Conference';
        else if (rawLower.startsWith('journals:') || rawLower.startsWith('journal:')) reviewSubtype = 'Journal';
      }

      const badge = document.createElement('span');
      badge.className = 'item-badge';

      if (kind === 'review') {
        // Badge: "Review (Conference)" / "Review (Journal)" (rendered as 2 lines for tight geometry)
        const top = document.createElement('span');
        top.className = 'badge-top';
        top.textContent = 'Review';

        badge.appendChild(top);

        if (reviewSubtype) {
          const bot = document.createElement('span');
          bot.className = 'badge-bot';
          bot.textContent = `(${reviewSubtype})`;
          badge.appendChild(bot);
        }

        // Remove redundant "Conferences:" / "Journal:" prefixes from the body text
        if (reviewSubtype === 'Conference') stripLeadingFromFirstTextNode(p, /^\s*Conferences?:\s*/i);
        if (reviewSubtype === 'Journal') stripLeadingFromFirstTextNode(p, /^\s*Journals?:\s*/i);
      } else if (kind === 'talk') {
        badge.textContent = 'Talk';
      } else {
        badge.textContent = '';
      }

      const body = document.createElement('span');
      body.className = 'item-body';

      const classNames = ['item-entry', 'act-entry', `item-kind-${kind}`];
      if (reviewSubtype) classNames.push(`item-sub-${reviewSubtype.toLowerCase()}`);

      rebuildEntry({
        p,
        badge,
        body,
        classNames
      });

      // Make clickable if there is a link (e.g., recorded video).
      const links = Array.from(p.querySelectorAll('a[href]'));
      const primary = pickPrimaryLink(links, ['full', 'recorded', 'recoded', 'video', 'link', 'proc', 'paper']);
      if (primary) {
        const href = primary.getAttribute('href');
        if (href) makeCardClickable(p, href);

        // If the card itself is clickable, remove redundant inline "[recorded video]" / "[recoded video]" action tags.
        const label = ((primary.textContent || '').trim() || '').toLowerCase();
        if ((label.includes('recorded') || label.includes('recoded')) && label.startsWith('[') && label.endsWith(']')) {
          removeLinkAndTidy(primary);
        }
        // Highlight the recorded talk card (Math on Difficulties...) with the same glow as Publications.
        if (kind === 'talk' && (rawLower.includes('math on difficulties') || rawLower.includes('math on dificulties'))) {
          p.classList.add('glow-like-pub');
          ensureGlowLine(p);
        }
      }
    });
  };

  enhanceProjects();
  enhanceTeaching();
  enhanceActivities();
})();
