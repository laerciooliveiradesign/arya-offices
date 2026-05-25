/* =============================================================================
   ARYA OFFICES — Em Breve
   Interações: slider crossfade, reveal on scroll, topbar, form, year
   Sem dependências externas. Vanilla JS.
   ============================================================================= */

(() => {
  'use strict';

  /* ----------------------------------------------------------------------- *
   * 1. Ano dinâmico no footer
   * ----------------------------------------------------------------------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ----------------------------------------------------------------------- *
   * 2. Topbar: muda estilo ao rolar
   * ----------------------------------------------------------------------- */
  const topbar = document.querySelector('.topbar');
  if (topbar) {
    const updateTopbar = () => {
      if (window.scrollY > 60) topbar.classList.add('is-scrolled');
      else topbar.classList.remove('is-scrolled');
    };
    updateTopbar();
    window.addEventListener('scroll', updateTopbar, { passive: true });
  }

  /* ----------------------------------------------------------------------- *
   * 3. Reveal on scroll (IntersectionObserver)
   * ----------------------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');
  // Hero já tem animação imediata via CSS — observamos apenas elementos fora do hero
  const heroReveals = document.querySelector('.hero')?.querySelectorAll('.reveal') || [];
  const heroSet = new Set(Array.from(heroReveals));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px'
    });

    revealEls.forEach((el) => {
      if (!heroSet.has(el)) io.observe(el);
    });
  } else {
    // Fallback: mostra tudo
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ----------------------------------------------------------------------- *
   * 4. Slider crossfade
   * ----------------------------------------------------------------------- */
  const slider = document.querySelector('[data-slider]');
  if (slider) {
    const slides       = Array.from(slider.querySelectorAll('[data-slide]'));
    const stage        = slider.querySelector('[data-slider-stage]');
    const btnPrev      = slider.querySelector('[data-slider-prev]');
    const btnNext      = slider.querySelector('[data-slider-next]');
    const currentEl    = slider.querySelector('[data-slider-current]');
    const totalEl      = slider.querySelector('[data-slider-total]');
    const progressFill = slider.querySelector('[data-slider-progress]');

    const total    = slides.length;
    const interval = 5000; // 5s por slide
    let current    = 0;
    let timer      = null;
    let progressRAF = null;
    let progressStart = 0;
    let paused = false;

    if (totalEl) totalEl.textContent = String(total).padStart(2, '0');

    const setSlide = (idx) => {
      current = ((idx % total) + total) % total;
      slides.forEach((slide, i) => {
        const active = i === current;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      if (currentEl) currentEl.textContent = String(current + 1).padStart(2, '0');
    };

    const animateProgress = () => {
      if (!progressFill) return;
      cancelAnimationFrame(progressRAF);
      progressStart = performance.now();
      progressFill.style.transform = 'scaleX(0)';
      const step = (now) => {
        if (paused) {
          progressRAF = requestAnimationFrame(step);
          return;
        }
        const elapsed = now - progressStart;
        const pct = Math.min(elapsed / interval, 1);
        progressFill.style.transform = `scaleX(${pct})`;
        if (pct < 1) progressRAF = requestAnimationFrame(step);
      };
      progressRAF = requestAnimationFrame(step);
    };

    const next = () => { setSlide(current + 1); resetTimer(); };
    const prev = () => { setSlide(current - 1); resetTimer(); };

    const startTimer = () => {
      stopTimer();
      timer = setInterval(() => {
        if (!paused) next();
      }, interval);
      animateProgress();
    };
    const stopTimer = () => {
      if (timer) clearInterval(timer);
      timer = null;
      cancelAnimationFrame(progressRAF);
    };
    const resetTimer = () => {
      stopTimer();
      startTimer();
    };

    // Controles
    btnNext?.addEventListener('click', next);
    btnPrev?.addEventListener('click', prev);

    // Pause on hover (desktop)
    slider.addEventListener('mouseenter', () => { paused = true; });
    slider.addEventListener('mouseleave', () => { paused = false; });

    // Pause when not in viewport
    if ('IntersectionObserver' in window && stage) {
      const visObs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            paused = false;
            startTimer();
          } else {
            paused = true;
            stopTimer();
          }
        });
      }, { threshold: 0.25 });
      visObs.observe(stage);
    } else {
      startTimer();
    }

    // Keyboard nav (quando o slider tá em foco)
    slider.setAttribute('tabindex', '-1');
    slider.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    });

    // Swipe (touch)
    let touchStartX = 0;
    let touchEndX = 0;
    stage?.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    stage?.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const delta = touchEndX - touchStartX;
      if (Math.abs(delta) > 40) {
        if (delta < 0) next(); else prev();
      }
    }, { passive: true });

    // Init
    setSlide(0);
  }

  /* ----------------------------------------------------------------------- *
   * 5. Form de captura de leads
   *
   *    Por enquanto: captura no console + UI de sucesso.
   *    TODO para produção: trocar pelo endpoint do Formspree ou Web3Forms:
   *
   *    Formspree:
   *      form.action = 'https://formspree.io/f/SEU_ID';
   *      form.method = 'POST';
   *      e usar fetch() pra evitar redirect, lendo response.json()
   *
   *    Web3Forms:
   *      adicionar <input type="hidden" name="access_key" value="SUA_KEY" />
   *      e POST pra https://api.web3forms.com/submit
   * ----------------------------------------------------------------------- */
  const form = document.getElementById('lead-form');
  if (form) {
    const hint = form.querySelector('[data-form-hint]');
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const payload = Object.fromEntries(data.entries());

      // Validação simples
      if (!payload.name?.trim() || !payload.email?.trim()) {
        if (hint) {
          hint.textContent = 'Por favor, preencha nome e e-mail.';
          hint.style.color = '#F8E1B2';
        }
        return;
      }

      // Estado de loading
      if (submitBtn) {
        submitBtn.disabled = true;
        const label = submitBtn.querySelector('span');
        if (label) label.textContent = 'Enviando...';
      }

      // TODO: substituir por chamada real ao endpoint do backend
      console.log('[Arya Offices] Lead capturado (pendente integração):', payload);

      // Pequena espera artificial pra feedback
      await new Promise(r => setTimeout(r, 600));

      // Sucesso
      if (hint) {
        hint.textContent = 'Recebido! Vamos te avisar primeiro.';
        hint.classList.add('is-success');
      }
      form.reset();

      // Restaura botão depois de 4s
      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          const label = submitBtn.querySelector('span');
          if (label) label.textContent = 'Avisem-me primeiro';
        }
        if (hint) {
          hint.textContent = 'Sem spam. Apenas a notícia que importa.';
          hint.classList.remove('is-success');
        }
      }, 6000);

      // TODO: rastrear evento no GA4 e Meta Pixel quando ativos
      // gtag('event', 'generate_lead', { event_category: 'engagement', event_label: 'coming_soon_form' });
      // fbq('track', 'Lead');
    });
  }

  /* ----------------------------------------------------------------------- *
   * 6. Smooth scroll para anchors internos
   * ----------------------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

})();
