/* ==========================================================================
   AD Dental Studio Aesthetic — interactions
   Vanilla JS, no dependencies. Progressive enhancement.
   ========================================================================== */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------------
     Year
     ------------------------------------------------------------------------ */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------------
     Header state + active navigation
     ------------------------------------------------------------------------ */
  const header = $('.site-header');
  const navLinks = $$('.main-nav a');
  const navSections = navLinks
    .map((link) => {
      const id = link.getAttribute('href').replace('#', '');
      return { link, section: document.getElementById(id) };
    })
    .filter((item) => item.section);

  let scrollTicking = false;

  function updateScrollUI() {
    const y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 24);

    const marker = y + window.innerHeight * 0.32;
    let active = null;
    navSections.forEach((item) => {
      if (item.section.offsetTop <= marker) active = item;
    });

    navLinks.forEach((link) => {
      const isActive = active && active.link === link;
      link.classList.toggle('is-active', Boolean(isActive));
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });

    scrollTicking = false;
  }

  function onScroll() {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(updateScrollUI);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  updateScrollUI();

  /* ------------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------------ */
  const menu = $('#mobile-menu');
  const menuToggle = $('.menu-toggle');
  const menuClose = $('.menu-close');
  let menuCloseTimer = null;
  let lastFocused = null;

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  function visibleFocusable(container) {
    return $$(focusableSelector, container).filter((el) => {
      return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
    });
  }

  function trapFocus(container, event) {
    if (event.key !== 'Tab') return;
    const items = visibleFocusable(container);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openMenu() {
    if (!menu || !menuToggle) return;
    window.clearTimeout(menuCloseTimer);
    lastFocused = document.activeElement;
    menu.hidden = false;
    document.body.classList.add('menu-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    window.requestAnimationFrame(() => {
      menu.classList.add('is-open');
      if (menuClose) menuClose.focus();
    });
  }

  function closeMenu(restoreFocus = true) {
    if (!menu || !menuToggle || menu.hidden) return;
    menu.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuCloseTimer = window.setTimeout(() => {
      menu.hidden = true;
    }, prefersReducedMotion ? 0 : 360);
    if (restoreFocus && lastFocused instanceof HTMLElement) lastFocused.focus();
    else if (restoreFocus) menuToggle.focus();
  }

  if (menuToggle) menuToggle.addEventListener('click', openMenu);
  if (menuClose) menuClose.addEventListener('click', () => closeMenu());

  $$('.mobile-nav a, .mobile-menu .brand', menu || document).forEach((link) => {
    link.addEventListener('click', () => closeMenu(false));
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1020 && menu && !menu.hidden) closeMenu(false);
  }, { passive: true });

  /* ------------------------------------------------------------------------
     Mobile CTA — keep the hero clean, reveal after it
     ------------------------------------------------------------------------ */
  const heroSection = $('.hero');
  const mobileCta = $('.mobile-cta');

  if (heroSection && mobileCta && 'IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        mobileCta.classList.toggle('is-hidden', entry.isIntersecting);
      });
    }, { threshold: 0.02 });
    heroObserver.observe(heroSection);
  }

  /* ------------------------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------------------------ */
  const revealItems = $$('.reveal');

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  /* ------------------------------------------------------------------------
     FAQ — one item open at a time
     ------------------------------------------------------------------------ */
  const faqItems = $$('.faq-item');
  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  /* ------------------------------------------------------------------------
     Gallery lightbox
     ------------------------------------------------------------------------ */
  const galleryButtons = $$('[data-lightbox]');
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightbox-img');
  const lightboxCaption = $('#lightbox-caption');
  const lightboxClose = $('.lightbox-close');
  const lightboxPrev = $('.lightbox-prev');
  const lightboxNext = $('.lightbox-next');
  let lightboxIndex = 0;
  let lightboxTrigger = null;

  function renderLightbox(index) {
    if (!galleryButtons.length) return;
    lightboxIndex = (index + galleryButtons.length) % galleryButtons.length;
    const button = galleryButtons[lightboxIndex];
    const full = button.getAttribute('data-full');
    const caption = button.getAttribute('data-caption') || '';
    if (lightboxImg) {
      lightboxImg.src = full;
      lightboxImg.alt = caption;
    }
    if (lightboxCaption) lightboxCaption.textContent = `${caption} — ${lightboxIndex + 1} / ${galleryButtons.length}`;
  }

  function openLightbox(index, trigger) {
    if (!lightbox) return;
    lightboxTrigger = trigger;
    renderLightbox(index);
    lightbox.hidden = false;
    document.body.classList.add('lightbox-open');
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.classList.remove('lightbox-open');
    if (lightboxImg) lightboxImg.src = '';
    if (lightboxTrigger) lightboxTrigger.focus();
  }

  galleryButtons.forEach((button, index) => {
    button.addEventListener('click', () => openLightbox(index, button));
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', () => renderLightbox(lightboxIndex - 1));
  if (lightboxNext) lightboxNext.addEventListener('click', () => renderLightbox(lightboxIndex + 1));
  if (lightbox) {
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) closeLightbox();
    });
  }

  /* ------------------------------------------------------------------------
     Global keyboard support
     ------------------------------------------------------------------------ */
  document.addEventListener('keydown', (event) => {
    if (lightbox && !lightbox.hidden) {
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') renderLightbox(lightboxIndex - 1);
      if (event.key === 'ArrowRight') renderLightbox(lightboxIndex + 1);
      trapFocus(lightbox, event);
      return;
    }

    if (menu && !menu.hidden) {
      if (event.key === 'Escape') closeMenu();
      trapFocus(menu, event);
    }
  });

  /* Close the mobile menu when an in-page anchor is followed by keyboard */
  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', () => {
      if (menu && !menu.hidden) closeMenu(false);
    });
  });
})();
