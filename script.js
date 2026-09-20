(() => {
  'use strict';

  /* Content is visible by default (see styles.css); only once we know JS is
     actually driving do we switch on the hidden-then-reveal treatment. */
  document.documentElement.classList.add('js-ready');

  /* Sticky header shrink + scroll progress */
  const header = document.getElementById('siteHeader');
  const progress = document.getElementById('scrollProgress');
  const onScroll = () => {
    if (window.scrollY > 12) header.classList.add('scrolled');
    else header.classList.remove('scrolled');

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (progress && docHeight > 0) {
      progress.style.width = `${(window.scrollY / docHeight) * 100}%`;
    }
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile menu */
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const closeMenu = () => {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  };
  navToggle?.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    document.body.style.overflow = open ? 'hidden' : '';
  });
  mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  /* Scroll reveal */
  const revealEls = document.querySelectorAll('[data-reveal], [data-reveal-stagger]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }
  // Safety net: never leave content permanently invisible (e.g. throttled
  // background tabs, or an observer that never fires for any reason).
  window.addEventListener('load', () => {
    setTimeout(() => revealEls.forEach(el => el.classList.add('in')), 2500);
  });

  /* Animated counters */
  const counters = document.querySelectorAll('[data-count]');
  const animateCount = (el) => {
    const target = parseFloat(el.getAttribute('data-count'));
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = value + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window && counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => cio.observe(el));
  }

  /* FAQ accordion */
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    q.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* ============ Lead modal: form -> pick a slot -> confirmation ============ */
  const modal = document.getElementById('leadModal');
  const modalCard = modal?.querySelector('.modal-card');
  const modalForm = document.getElementById('modalForm');
  const modalClose = document.getElementById('modalClose');
  const modalBack = document.getElementById('modalBack');
  const modalDone = document.getElementById('modalDone');
  const calDays = document.getElementById('calDays');
  const calTimes = document.getElementById('calTimes');
  const confirmText = document.getElementById('modalConfirmText');
  const confirmDate = document.getElementById('modalConfirmDate');
  const SUBJECT = 'Free Site Visit Booking';

  const TIME_SLOTS = ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '4:30 PM'];
  let lead = null;
  let chosenDay = null;
  let chosenTime = null;

  const goToStep = (n) => {
    modal.querySelectorAll('.modal-step').forEach(s => s.classList.toggle('is-active', s.dataset.step === String(n)));
    modalCard.scrollTop = 0;
  };

  const openModal = () => {
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    goToStep(1);
  };
  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('.js-open-modal').forEach(btn => btn.addEventListener('click', openModal));
  modalClose?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal?.classList.contains('open')) closeModal(); });
  modalBack?.addEventListener('click', () => goToStep(1));
  modalDone?.addEventListener('click', closeModal);

  const buildDays = () => {
    calDays.innerHTML = '';
    calTimes.innerHTML = '<p class="cal-empty-hint">Pick a day above to see available times.</p>';
    chosenDay = null;
    chosenTime = null;
    const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short' });
    const dayNum = new Intl.DateTimeFormat('en-GB', { day: 'numeric' });
    let d = new Date();
    let added = 0;
    while (added < 6) {
      d = new Date(d.getTime() + 86400000);
      const dow = d.getDay();
      if (dow === 0 || dow === 6) continue; // skip weekends
      added += 1;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cal-day';
      btn.innerHTML = `<span>${weekday.format(d)}</span><b>${dayNum.format(d)}</b>`;
      btn.addEventListener('click', () => selectDay(d, btn));
      calDays.appendChild(btn);
    }
  };

  const selectDay = (date, btn) => {
    chosenDay = date;
    chosenTime = null;
    calDays.querySelectorAll('.cal-day').forEach(b => b.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    calTimes.innerHTML = '';
    TIME_SLOTS.forEach(t => {
      const tBtn = document.createElement('button');
      tBtn.type = 'button';
      tBtn.className = 'cal-time';
      tBtn.textContent = t;
      tBtn.addEventListener('click', () => selectTime(t, tBtn));
      calTimes.appendChild(tBtn);
    });
  };

  const selectTime = (time, btn) => {
    chosenTime = time;
    calTimes.querySelectorAll('.cal-time').forEach(b => b.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    finishBooking();
  };

  const finishBooking = () => {
    const dateLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(chosenDay);
    confirmText.textContent = `Thanks, ${lead.name.split(' ')[0]} — we've pencilled you in. Look out for a calendar invite at ${lead.email}.`;
    confirmDate.textContent = `${dateLabel}, ${chosenTime} EAT`;

    const subject = encodeURIComponent(`${SUBJECT} — ${lead.company || lead.name}`);
    const body = encodeURIComponent(
      `New booking request via website:\n\n` +
      `Name: ${lead.name}\nCompany: ${lead.company}\nEmail: ${lead.email}\nPhone: ${lead.phone}\n` +
      `Monthly energy spend: ${lead.spend}\n\nRequested slot: ${dateLabel}, ${chosenTime} EAT`
    );
    window.location.href = `mailto:info@leansolutions.co.ke?subject=${subject}&body=${body}`;

    goToStep(3);
  };

  modalForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    lead = Object.fromEntries(new FormData(modalForm).entries());
    buildDays();
    goToStep(2);
  });

  /* Footer year */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Newsletter signup -> mailto fallback (no backend attached yet) */
  const newsletterForm = document.getElementById('newsletterForm');
  newsletterForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = new FormData(newsletterForm).get('email');
    const subject = encodeURIComponent('Newsletter signup');
    const body = encodeURIComponent(`Please add this address to the LES newsletter list: ${email}`);
    window.location.href = `mailto:info@leansolutions.co.ke?subject=${subject}&body=${body}`;
    newsletterForm.reset();
  });

  /* Keep the hero "live model" chart feeling alive — periodic redraw */
  const savingsLine = document.getElementById('savingsLine');
  if (savingsLine) {
    setInterval(() => {
      savingsLine.style.animation = 'none';
      // eslint-disable-next-line no-unused-expressions
      savingsLine.getBoundingClientRect(); // force reflow to restart the animation
      savingsLine.style.animation = '';
    }, 5000);
  }

})();
