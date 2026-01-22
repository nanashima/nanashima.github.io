(() => {
  'use strict';

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
})();
