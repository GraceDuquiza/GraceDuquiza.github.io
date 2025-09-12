// portfolio.js — CSP-safe, full-page i18n + smooth scroll + scrollspy
(() => {
    'use strict';

  /* ===================== Smooth anchor scrolling (with fixed header) ===================== */
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const header = document.querySelector('.site-header');
    const getHeaderOffset = () => {
        if (!header) return 0;
        const pos = getComputedStyle(header).position;
        return (pos === 'fixed' || pos === 'sticky') ? header.offsetHeight : 0;
    };

    document.addEventListener('click', (e) => {
        const a = e.target.closest('a[href^="#"]');
        if (!a) return;

        const hash = a.getAttribute('href');
        if (!hash || hash === '#') return;

        const target = document.querySelector(hash);
        if (!target) return;

        // same-page only
        if (a.origin !== window.location.origin || a.pathname !== window.location.pathname) return;

        e.preventDefault();

        const y = Math.max(0, target.getBoundingClientRect().top + window.scrollY - getHeaderOffset() - 8);
        if (prefersReducedMotion) {
        window.scrollTo(0, y);
        } else {
        window.scrollTo({ top: y, behavior: 'smooth' });
        }

        // push hash without jump
        if (history.pushState) history.pushState(null, '', hash);
        else window.location.hash = hash;

        // a11y: focus target without re-scrolling
        const prevTab = target.getAttribute('tabindex');
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        target.addEventListener('blur', () => {
        if (prevTab === null) target.removeAttribute('tabindex');
        else target.setAttribute('tabindex', prevTab);
        }, { once: true });
    });

    /* ===================== Language toggle (EN/DK) ===================== */
    const DEFAULT = 'en';
    const initialByBrowser = (navigator.language || navigator.userLanguage || 'en').toLowerCase().startsWith('da') ? 'da' : 'en';
    const urlLang = (() => {
        try {
        const p = new URL(window.location.href).searchParams.get('lang');
        return (p === 'en' || p === 'da') ? p : null;
        } catch { return null; }
    })();
    const stored = localStorage.getItem('siteLang');
    const initialLang = urlLang || stored || initialByBrowser || DEFAULT;

    const buttons = document.querySelectorAll('.lang-switch [data-lang]');
    const langBlocks = document.querySelectorAll('.lang');
    const htmlEl = document.documentElement;
    const metaDesc = document.querySelector('meta[name="description"]');

    const titles = {
        en: 'Grace Duquiza Olesen — Portfolio',
        da: 'Grace Duquiza Olesen — Portfolio'
    };
    const descriptions = {
        en: 'Portfolio of Grace Duquiza Olesen — projects in web development and software engineering: Sudoku Learn (Vanilla JS), Danish Vocab Trainer, Siomai Cart Sarap, and more.',
        da: 'Portfolio af Grace Duquiza Olesen — projekter i webudvikling og software engineering: Sudoku Learn (Vanilla JS), Dansk Vocab Trainer, Siomai Cart Sarap m.m.'
    };

    function setLang(lang) {
        // html lang + persist
        htmlEl.lang = lang;
        localStorage.setItem('siteLang', lang);

        // show/hide all language-scoped blocks via .hidden class
        langBlocks.forEach(el => {
        const match = el.classList.contains('lang-' + lang);
        el.classList.toggle('hidden', !match);
        });

        // update toggle states
        buttons.forEach(b => {
        const active = b.dataset.lang === lang;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
        });

        // update title + description (SEO/a11y)
        if (document.title !== titles[lang]) document.title = titles[lang];
        if (metaDesc && metaDesc.content !== descriptions[lang]) metaDesc.setAttribute('content', descriptions[lang]);
    }

    // listeners
    buttons.forEach(b => {
        b.addEventListener('click', (e) => {
        e.preventDefault();
        setLang(b.dataset.lang);
        });
    });

    // init
    setLang(initialLang);

    /* ===================== Scroll spy (highlight active section link) ===================== */
    const sections = ['#about', '#projects', '#contact']
        .map(sel => document.querySelector(sel))
        .filter(Boolean);

    // map href -> <a>
    function navLinksForCurrentLang() {
        const currentLang = localStorage.getItem('siteLang') || DEFAULT;
        // pick the visible nav list (has .lang-XX and not .hidden)
        const visibleNav = document.querySelector(`nav[aria-label="Primary"] ul.lang-${currentLang}:not(.hidden)`) || document;
        const map = new Map();
        visibleNav.querySelectorAll('a[href^="#"]').forEach(a => map.set(a.getAttribute('href'), a));
        return map;
    }

    let linkMap = navLinksForCurrentLang();

    // rebind when language toggles
    buttons.forEach(b => b.addEventListener('click', () => { linkMap = navLinksForCurrentLang(); }));

    const setActive = (id) => {
        // clear all
        linkMap.forEach(a => a.classList.remove('is-active'));
        const link = linkMap.get('#' + id);
        if (link) link.classList.add('is-active');
    };

    if ('IntersectionObserver' in window && sections.length) {
        const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) setActive(entry.target.id);
        });
        }, { rootMargin: '-30% 0px -60% 0px', threshold: 0.01 });

        sections.forEach(sec => io.observe(sec));
    } else {
        // fallback: on scroll, pick nearest
        const onScroll = () => {
        let top = window.scrollY + getHeaderOffset() + 40;
        let current = sections[0]?.id || 'about';
        for (const sec of sections) {
            if (sec.offsetTop <= top) current = sec.id;
            else break;
        }
        setActive(current);
        };
        document.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ===================== Elevate language bar on scroll ===================== */
    const langbar = (document.querySelector('.lang-switch') && document.querySelector('.lang-switch').closest('nav')) || null;
    if (langbar) {
        const elevate = () => {
        langbar.classList.toggle('elevated', window.scrollY > 8);
        };
        document.addEventListener('scroll', elevate, { passive: true });
        elevate();
    }
})();
