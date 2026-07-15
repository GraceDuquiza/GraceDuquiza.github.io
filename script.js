// portfolio.js — CSP-safe section routing, bilingual content, and accessible focus management
(() => {
    'use strict';

    const DEFAULT_LANGUAGE = 'en';
    const DEFAULT_SECTION = 'about';
    const sectionIds = ['about', 'projects', 'experience', 'contact'];
    const sections = sectionIds
        .map(id => document.getElementById(id))
        .filter(Boolean);
    const validSectionIds = new Set(sections.map(section => section.id));
    const header = document.querySelector('.site-header');
    const languageButtons = document.querySelectorAll('.lang-switch [data-lang]');
    const languageBlocks = document.querySelectorAll('.lang');
    const htmlElement = document.documentElement;
    const metaDescription = document.querySelector('meta[name="description"]');
    const scrollProgress = document.querySelector('.scroll-progress');
    const scrollProgressFill = scrollProgress?.querySelector('.scroll-progress__fill');
    const scrollProgressValue = scrollProgress?.querySelector('.scroll-progress__value');

    let currentLanguage = DEFAULT_LANGUAGE;
    let currentSection = DEFAULT_SECTION;
    let progressFrame = null;

    function updateScrollProgress() {
        progressFrame = null;
        if (!scrollProgress || !scrollProgressFill || !scrollProgressValue) return;

        const scrollableDistance = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const progress = scrollableDistance === 0
            ? 100
            : Math.min(100, Math.max(0, (window.scrollY / scrollableDistance) * 100));
        const roundedProgress = Math.round(progress);

        scrollProgressFill.style.transform = `scaleY(${progress / 100})`;
        scrollProgressValue.textContent = `${roundedProgress}%`;
        scrollProgress.setAttribute('aria-valuenow', String(roundedProgress));
        scrollProgress.classList.toggle('is-scrollable', scrollableDistance > 0);
    }

    function requestProgressUpdate() {
        if (progressFrame !== null) return;
        progressFrame = requestAnimationFrame(updateScrollProgress);
    }

    const pageNames = {
        en: {
            about: 'About',
            projects: 'Projects',
            experience: 'Experience',
            contact: 'Contact'
        },
        da: {
            about: 'Om',
            projects: 'Projekter',
            experience: 'Erfaring',
            contact: 'Kontakt'
        }
    };

    const descriptions = {
        en: 'Portfolio of Grace Duquiza Olesen — Computer Science, software engineering, data analysis, projects, and professional experience.',
        da: 'Portfolio for Grace Duquiza Olesen — datalogi, softwareudvikling, dataanalyse, projekter og professionel erfaring.'
    };

    function sectionFromLocation() {
        const id = window.location.hash.slice(1).toLowerCase();
        return validSectionIds.has(id) ? id : DEFAULT_SECTION;
    }

    function updateDocumentMetadata() {
        const name = pageNames[currentLanguage]?.[currentSection] || pageNames.en[currentSection];
        document.title = `${name} — Grace Duquiza Olesen`;
        if (metaDescription) {
            metaDescription.setAttribute('content', descriptions[currentLanguage]);
        }
    }

    function updateNavigation() {
        document.querySelectorAll('nav[aria-label="Primary"] a[href^="#"]').forEach(link => {
            const isCurrent = link.getAttribute('href') === `#${currentSection}`;
            link.classList.toggle('is-active', isCurrent);
            if (isCurrent) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
    }

    function focusSection(section) {
        const heading = section.querySelector('h2');
        if (!heading) return;

        const previousTabIndex = heading.getAttribute('tabindex');
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
        heading.addEventListener('blur', () => {
            if (previousTabIndex === null) heading.removeAttribute('tabindex');
            else heading.setAttribute('tabindex', previousTabIndex);
        }, { once: true });
    }

    function showSection(id, { historyMode = 'none', moveFocus = false } = {}) {
        const safeId = validSectionIds.has(id) ? id : DEFAULT_SECTION;
        const target = document.getElementById(safeId);
        if (!target) return;

        currentSection = safeId;
        sections.forEach(section => {
            const isCurrent = section === target;
            section.hidden = !isCurrent;
            section.classList.toggle('is-current', isCurrent);
        });

        updateNavigation();
        updateDocumentMetadata();

        const url = new URL(window.location.href);
        url.hash = safeId;
        if (historyMode === 'push' && window.location.hash !== `#${safeId}`) {
            history.pushState({ section: safeId }, '', url);
        } else if (historyMode === 'replace') {
            history.replaceState({ section: safeId }, '', url);
        }

        const resetScroll = () => window.scrollTo({ top: 0, behavior: 'auto' });
        resetScroll();
        requestAnimationFrame(() => {
            resetScroll();
            requestProgressUpdate();
        });
        if (moveFocus) requestAnimationFrame(() => focusSection(target));
    }

    function initialLanguage() {
        const browserLanguage = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
        let urlLanguage = null;
        try {
            const requested = new URL(window.location.href).searchParams.get('lang');
            if (requested === 'en' || requested === 'da') urlLanguage = requested;
        } catch {
            urlLanguage = null;
        }

        const storedLanguage = localStorage.getItem('siteLang');
        const detectedLanguage = browserLanguage.startsWith('da') ? 'da' : 'en';
        return urlLanguage || storedLanguage || detectedLanguage || DEFAULT_LANGUAGE;
    }

    function setLanguage(language) {
        const safeLanguage = language === 'da' ? 'da' : 'en';
        currentLanguage = safeLanguage;
        htmlElement.lang = safeLanguage;
        localStorage.setItem('siteLang', safeLanguage);

        languageBlocks.forEach(block => {
            const matchesLanguage = block.classList.contains(`lang-${safeLanguage}`);
            block.classList.toggle('hidden', !matchesLanguage);
        });

        languageButtons.forEach(button => {
            const isActive = button.dataset.lang === safeLanguage;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });

        updateNavigation();
        updateDocumentMetadata();
    }

    function setupProjectCards() {
        document.querySelectorAll('.project-card').forEach((card, index) => {
            const firstDetailHeading = card.querySelector('h4');
            if (!firstDetailHeading || card.dataset.collapsibleReady === 'true') return;

            const isDanish = Boolean(card.closest('.lang-da'));
            const labels = isDanish
                ? { open: 'Læs hele projekthistorien', close: 'Skjul projekthistorien' }
                : { open: 'Read the full project story', close: 'Hide the project story' };
            const detailId = `project-story-${index + 1}`;
            const detailContent = document.createElement('div');
            const toggle = document.createElement('button');

            detailContent.id = detailId;
            detailContent.className = 'project-details';
            detailContent.hidden = true;

            let node = firstDetailHeading;
            while (node) {
                const nextNode = node.nextSibling;
                detailContent.appendChild(node);
                node = nextNode;
            }

            toggle.type = 'button';
            toggle.className = 'project-story-toggle';
            toggle.setAttribute('aria-controls', detailId);
            toggle.setAttribute('aria-expanded', 'false');
            toggle.textContent = labels.open;

            toggle.addEventListener('click', () => {
                const willOpen = detailContent.hidden;
                detailContent.hidden = !willOpen;
                toggle.setAttribute('aria-expanded', String(willOpen));
                toggle.textContent = willOpen ? labels.close : labels.open;
                card.classList.toggle('is-expanded', willOpen);
                requestProgressUpdate();
            });

            card.append(toggle, detailContent);
            card.dataset.collapsibleReady = 'true';
        });
    }

    document.addEventListener('click', event => {
        const link = event.target.closest('nav[aria-label="Primary"] a[href^="#"]');
        if (!link) return;

        const id = link.getAttribute('href').slice(1);
        if (!validSectionIds.has(id)) return;

        event.preventDefault();
        showSection(id, { historyMode: 'push', moveFocus: true });
    });

    languageButtons.forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            setLanguage(button.dataset.lang);
        });
    });

    window.addEventListener('popstate', () => {
        showSection(sectionFromLocation(), { moveFocus: true });
    });

    window.addEventListener('hashchange', () => {
        const requestedSection = sectionFromLocation();
        if (requestedSection !== currentSection) {
            showSection(requestedSection, { moveFocus: true });
        }
    });

    const languageBar = document.querySelector('.lang-switch')?.closest('nav');
    if (languageBar) {
        const updateElevation = () => {
            languageBar.classList.toggle('elevated', window.scrollY > 8);
        };
        document.addEventListener('scroll', updateElevation, { passive: true });
        updateElevation();
    }

    setupProjectCards();
    document.addEventListener('scroll', requestProgressUpdate, { passive: true });
    window.addEventListener('resize', requestProgressUpdate, { passive: true });
    if ('ResizeObserver' in window) {
        new ResizeObserver(requestProgressUpdate).observe(document.documentElement);
    }
    setLanguage(initialLanguage());
    const requestedSection = sectionFromLocation();
    showSection(requestedSection, {
        historyMode: window.location.hash === `#${requestedSection}` ? 'none' : 'replace'
    });

    window.addEventListener('load', () => {
        requestAnimationFrame(() => {
            window.scrollTo({ top: 0, behavior: 'auto' });
            requestProgressUpdate();
        });
    }, { once: true });

    requestProgressUpdate();
})();
