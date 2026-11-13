/* ==========================================================================
   AD Dental Studio Aesthetic — interactions
   Vanilla JS, no dependencies. Progressive enhancement.
   ========================================================================== */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const IG_PROFILE = 'https://www.instagram.com/ad_dental_studio/';
  const IG_DM = 'https://ig.me/m/ad_dental_studio';

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
     Booking form
     ------------------------------------------------------------------------ */
  const form = $('#booking-form');
  const success = $('#booking-success');
  const serviceSelect = $('#bf-service');
  const dateInput = $('#bf-date');
  const nameInput = $('#bf-name');
  const phoneInput = $('#bf-phone');
  const timeSelect = $('#bf-time');
  const consentInput = $('#bf-consent');
  const messagePreview = $('#message-preview');
  const openInstagram = $('#open-instagram');
  const copyButton = $('#copy-message');
  const restartButton = $('#restart-booking');
  const formStatus = $('#form-status');
  const successStatus = $('#success-status');

  let currentMessage = '';

  function localISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (dateInput) {
    const today = new Date();
    dateInput.min = localISODate(today);
    const max = new Date(today);
    max.setFullYear(max.getFullYear() + 2);
    dateInput.max = localISODate(max);
  }

  function setError(field, errorId, message) {
    const error = document.getElementById(errorId);
    if (error) error.textContent = message;
    if (field) field.setAttribute('aria-invalid', 'true');
  }

  function clearError(field, errorId) {
    const error = document.getElementById(errorId);
    if (error) error.textContent = '';
    if (field) field.removeAttribute('aria-invalid');
  }

  function validateForm() {
    let firstInvalid = null;
    let valid = true;

    const nameValue = nameInput ? nameInput.value.trim() : '';
    if (nameValue.length < 2) {
      setError(nameInput, 'error-name', 'Shkruani emrin dhe mbiemrin.');
      if (!firstInvalid) firstInvalid = nameInput;
      valid = false;
    } else {
      clearError(nameInput, 'error-name');
    }

    const phoneDigits = phoneInput ? phoneInput.value.replace(/\D/g, '') : '';
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      setError(phoneInput, 'error-phone', 'Shkruani një numër telefoni të vlefshëm.');
      if (!firstInvalid) firstInvalid = phoneInput;
      valid = false;
    } else {
      clearError(phoneInput, 'error-phone');
    }

    if (!serviceSelect || !serviceSelect.value) {
      setError(serviceSelect, 'error-service', 'Zgjidhni shërbimin.');
      if (!firstInvalid) firstInvalid = serviceSelect;
      valid = false;
    } else {
      clearError(serviceSelect, 'error-service');
    }

    const todayISO = localISODate(new Date());
    if (!dateInput || !dateInput.value) {
      setError(dateInput, 'error-date', 'Zgjidhni një datë.');
      if (!firstInvalid) firstInvalid = dateInput;
      valid = false;
    } else if (dateInput.value < todayISO) {
      setError(dateInput, 'error-date', 'Data nuk mund të jetë në të shkuarën.');
      if (!firstInvalid) firstInvalid = dateInput;
      valid = false;
    } else {
      clearError(dateInput, 'error-date');
    }

    if (!timeSelect || !timeSelect.value) {
      setError(timeSelect, 'error-time', 'Zgjidhni orën e preferuar.');
      if (!firstInvalid) firstInvalid = timeSelect;
      valid = false;
    } else {
      clearError(timeSelect, 'error-time');
    }

    if (!consentInput || !consentInput.checked) {
      setError(consentInput, 'error-consent', 'Duhet të pranoni që t’ju kontaktojmë.');
      if (!firstInvalid) firstInvalid = consentInput;
      valid = false;
    } else {
      clearError(consentInput, 'error-consent');
    }

    return { valid, firstInvalid };
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    const weekdays = ['e diel', 'e hënë', 'e martë', 'e mërkurë', 'e enjte', 'e premte', 'e shtunë'];
    const months = ['janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor', 'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor'];
    return `${weekdays[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  function buildMessage() {
    const name = nameInput.value.trim().replace(/\s+/g, ' ');
    const phone = phoneInput.value.trim();
    const service = serviceSelect.value;
    const notes = $('#bf-notes').value.trim();
    const date = formatDate(dateInput.value);
    const time = timeSelect.value;

    const lines = [
      'Përshëndetje, AD Dental Studio!',
      'Dëshiroj të rezervoj një vizitë.',
      '',
      `• Shërbimi: ${service}`,
      `• Data e preferuar: ${date}`,
      `• Ora e preferuar: ${time}`,
      `• Emri: ${name}`,
      `• Telefoni: ${phone}`
    ];
    if (notes) lines.push(`• Shënime: ${notes}`);
    lines.push('', 'Faleminderit!');
    return lines.join('\n');
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        // fall through to legacy method
      }
    }
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.top = '-1000px';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      area.setSelectionRange(0, area.value.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch (error) {
      return false;
    }
  }

  function showForm(clearFields = false) {
    if (!form || !success) return;
    success.hidden = true;
    form.hidden = false;
    if (successStatus) successStatus.textContent = '';
    if (clearFields) form.reset();
    window.requestAnimationFrame(() => {
      if (nameInput) nameInput.focus({ preventScroll: true });
    });
  }

  function showSuccess(message, copied) {
    if (!form || !success) return;
    form.hidden = true;
    success.hidden = false;
    messagePreview.textContent = message;
    if (successStatus) {
      successStatus.textContent = copied
        ? 'Mesazhi u kopjua. Hapni Instagramin dhe ngjisni mesazhin në bisedë.'
        : 'Mesazhi është gati më poshtë. Kopjojeni dhe dërgoni në Instagram.';
    }
    if (openInstagram) openInstagram.href = IG_DM;
    const heading = success.querySelector('h3');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
    success.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
  }

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (formStatus) formStatus.textContent = '';
      const result = validateForm();

      if (!result.valid) {
        if (formStatus) formStatus.textContent = 'Ju lutem plotësoni fushat e shënuara.';
        if (result.firstInvalid) {
          result.firstInvalid.focus({ preventScroll: false });
          if (typeof result.firstInvalid.scrollIntoView === 'function') {
            result.firstInvalid.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
          }
        }
        return;
      }

      currentMessage = buildMessage();
      const copied = await copyText(currentMessage);
      showSuccess(currentMessage, copied);

      // Open the DM in a new tab while we still have the user gesture.
      try {
        const newWindow = window.open(IG_DM, '_blank', 'noopener');
        if (newWindow) newWindow.opener = null;
      } catch (error) {
        // The success panel has a manual link as a fallback.
      }
    });

    [nameInput, phoneInput, serviceSelect, dateInput, timeSelect, consentInput].forEach((field) => {
      if (!field) return;
      const eventName = field.type === 'checkbox' || field.tagName === 'SELECT' || field.type === 'date' ? 'change' : 'input';
      field.addEventListener(eventName, () => {
        const errorMap = {
          'bf-name': 'error-name',
          'bf-phone': 'error-phone',
          'bf-service': 'error-service',
          'bf-date': 'error-date',
          'bf-time': 'error-time',
          'bf-consent': 'error-consent'
        };
        clearError(field, errorMap[field.id]);
        if (formStatus) formStatus.textContent = '';
      });
    });
  }

  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      if (!currentMessage) return;
      const copied = await copyText(currentMessage);
      if (successStatus) {
        successStatus.textContent = copied
          ? 'Mesazhi u kopjua sërish.'
          : 'Kopjimi automatik nuk funksionoi. Zgjidhni tekstin dhe kopjojeni manualisht.';
      }
    });
  }

  if (restartButton) {
    restartButton.addEventListener('click', () => {
      currentMessage = '';
      showForm(true);
      if (formStatus) formStatus.textContent = '';
      if (successStatus) successStatus.textContent = '';
    });
  }

  /* Service quick-picks (cards, footer) */
  $$('[data-service]').forEach((link) => {
    link.addEventListener('click', () => {
      if (!serviceSelect) return;
      if (success && !success.hidden) showForm(false);
      const requested = link.getAttribute('data-service');
      const option = Array.from(serviceSelect.options).find((opt) => opt.textContent.trim() === requested);
      if (option) {
        serviceSelect.value = option.value;
        serviceSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
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
