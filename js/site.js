/* main.js */
/* Fastnet Telecom — campanha de ofertas
 * Canal oficial observado no site do cliente: +55 (79) 3045-4880.
 * IMPORTANTE: confirme com o time de CRM que este número está conectado ao Kommo.
 * Se a operação usar um link de WhatsApp específico do Kommo, substitua a
 * configuração abaixo e adapte buildWhatsAppUrl para esse link rastreável.
 */
(() => {
  'use strict';

  const WHATSAPP_NUMBER = '557930454880';
  const whatsappLinks = document.querySelectorAll('.whatsapp-link');
  const urlParams = new URLSearchParams(window.location.search);
  const trackingKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const tracking = {};

  for (const key of trackingKeys) {
    const value = urlParams.get(key);
    if (value) tracking[key] = value.slice(0, 100).replace(/[\r\n\t]/g, ' ');
  }

  function buildWhatsAppUrl(plan) {
    const planText = plan && plan !== 'Geral'
      ? `Olá! Tenho interesse no ${plan} da Fastnet. Gostaria de consultar a disponibilidade no meu endereço.`
      : 'Olá! Vim pela página de ofertas da Fastnet e gostaria de conhecer os planos de internet e consultar a cobertura no meu endereço.';
    const source = tracking.utm_source || '';
    const campaign = tracking.utm_campaign || '';
    const attribution = [source && `Origem: ${source}`, campaign && `Campanha: ${campaign}`].filter(Boolean);
    const message = planText + (attribution.length ? `\n\n${attribution.join(' | ')}` : '');
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  whatsappLinks.forEach(link => {
    const plan = link.dataset.plan || 'Geral';
    link.href = buildWhatsAppUrl(plan);
    link.addEventListener('click', () => {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'whatsapp_click',
        cta_location: link.dataset.cta || 'nao_identificado',
        selected_plan: plan,
        link_domain: 'wa.me',
        ...tracking
      });
    });
  });

  const menuButton = document.querySelector('.menu-button');
  const mobileNav = document.getElementById('mobile-nav');
  if (menuButton && mobileNav) {
    function setMenuOpen(isOpen) {
      mobileNav.hidden = !isOpen;
      menuButton.setAttribute('aria-expanded', String(isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
    }
    menuButton.addEventListener('click', () => setMenuOpen(mobileNav.hidden));
    mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenuOpen(false)));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') setMenuOpen(false);
    });
  }

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();


/* animations.js */
/* Fastnet V12 — GSAP ScrollSmoother + ScrollTrigger; fundos sempre estáticos. */
(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const ScrollSmoother = window.ScrollSmoother;
  const progress = document.querySelector('.scroll-progress');
  const header = document.querySelector('.site-header');
  let smoother = null;
  let faqPin = null;

  // ScrollSmoother oficial: rolagem nativa com amortecimento apenas no desktop.
  // Mobile mantém o toque nativo; acessibilidade respeita movimento reduzido.
  if (!reducedMotion && gsap && ScrollTrigger && ScrollSmoother) {
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

    const mountFaqPin = () => {
      const faqLayout = document.querySelector('.faq-layout');
      const faqTitle = document.querySelector('.faq-title-col');
      if (!smoother || faqPin || !faqLayout || !faqTitle) return;
      faqPin = ScrollTrigger.create({
        trigger: faqLayout,
        pin: faqTitle,
        pinType: 'transform',
        pinSpacing: false,
        start: 'top 136px',
        end: () => '+=' + Math.max(0, faqLayout.offsetHeight - faqTitle.offsetHeight),
        invalidateOnRefresh: true
      });
    };

    const desktopQuery = window.matchMedia('(min-width: 901px)');
    const configureSmoother = () => {
      if (desktopQuery.matches && !smoother) {
        document.documentElement.classList.add('gsap-scroll-smoother');
        try {
          smoother = ScrollSmoother.create({
            wrapper: '#smooth-wrapper',
            content: '#smooth-content',
            smooth: 0.85,
            smoothTouch: 0,
            effects: false,
            normalizeScroll: false
          });
          mountFaqPin();
        } catch (error) {
          document.documentElement.classList.remove('gsap-scroll-smoother');
          console.warn('Fastnet: rolagem nativa preservada.', error);
        }
      } else if (!desktopQuery.matches && smoother) {
        if (faqPin) {
          faqPin.kill();
          faqPin = null;
        }
        smoother.kill();
        smoother = null;
        document.documentElement.classList.remove('gsap-scroll-smoother');
      }
    };
    configureSmoother();
    desktopQuery.addEventListener('change', configureSmoother);
  }

  // Indicador discreto de leitura, sem adicionar carga ao layout.
  let scrollFrame = 0;
  const updateScrollState = () => {
    scrollFrame = 0;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const ratio = Math.min(1, Math.max(0, window.scrollY / max));
    if (progress) progress.style.transform = `scaleX(${ratio})`;
    document.body.classList.toggle('has-scrolled', window.scrollY > 30);
  };
  const queueScrollState = () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollState);
  };
  window.addEventListener('scroll', queueScrollState, { passive: true });
  window.addEventListener('resize', queueScrollState, { passive: true });
  updateScrollState();

  // Links de navegação e âncoras com rolagem suave e offset do menu fixo.
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const hash = link.getAttribute('href');
      if (!hash || hash === '#') return;
      const target = document.getElementById(hash.slice(1));
      if (!target) return;
      event.preventDefault();
      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      const announcement = document.querySelector('.announcement');
      const fixedAnnouncementHeight = smoother && announcement
        ? announcement.getBoundingClientRect().height
        : 0;
      if (smoother) {
        if (hash === '#topo') smoother.scrollTo(0, true);
        else smoother.scrollTo(target, true, `top ${Math.round(headerHeight + fixedAnnouncementHeight + 14)}px`);
      } else {
        const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight - 14);
        window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
      }
      if (location.hash !== hash) history.pushState(null, '', hash);
    });
  });

  // Em dispositivos com movimento reduzido a navegação permanece funcional,
  // sem aparições, parallax, inclinações ou acordeões animados.
  if (reducedMotion) return;

  // Caso a CDN não carregue, o conteúdo permanece totalmente visível.
  if (!gsap || !ScrollTrigger) {
    const heroParts = document.querySelectorAll('.hero-content .eyebrow, #hero-title, .hero-content > p, .hero-actions, .hero-proof');
    heroParts.forEach((el, index) => el.animate([
      { opacity: 0 }, { opacity: 1 }
    ], { duration: 500, delay: index * 65, easing: 'ease-out' }));

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.animate([
            { opacity: 0.45 }, { opacity: 1 }
          ], { duration: 480, easing: 'ease-out', fill: 'none' });
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12 });
      document.querySelectorAll('.section-heading, .plan-card, .connection-content, .benefits-intro, .benefit-card, .difference-item, .faq-title-col, .faq-items details, .final-content, .footer-content').forEach(el => observer.observe(el));
    }

    // Acordeão com altura animada também quando a biblioteca externa falhar.
    document.querySelectorAll('.faq-items details').forEach(details => {
      const summary = details.querySelector('summary');
      if (!summary) return;
      let busy = false;
      summary.addEventListener('click', event => {
        event.preventDefault();
        if (busy) return;
        busy = true;
        const opening = !details.open;
        const start = details.getBoundingClientRect().height;
        if (opening) details.open = true;
        const end = opening ? details.scrollHeight + 2 : summary.offsetHeight + 2;
        details.style.overflow = 'hidden';
        const animation = details.animate([
          { height: `${start}px` }, { height: `${end}px` }
        ], { duration: opening ? 420 : 340, easing: 'cubic-bezier(.22,.78,.2,1)' });
        animation.onfinish = () => {
          if (!opening) details.open = false;
          details.style.overflow = '';
          busy = false;
        };
      });
    });

    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ autoSleep: 60 });
  const ease = 'power3.out';

  // O pin do FAQ é montado e removido junto com ScrollSmoother, sem afetar o mobile.

  // Hero: entradas suaves com leve desfoque, sem deslocar textos ou botões.
  const heroTimeline = gsap.timeline({ defaults: { ease } });
  heroTimeline
    .from('.hero-content .eyebrow', { autoAlpha: 0, filter: 'blur(6px)', duration: .52, clearProps: 'filter' })
    .from('#hero-title', { autoAlpha: 0, filter: 'blur(9px)', duration: .7, clearProps: 'filter' }, '-=.3')
    .from('.hero-content > p:not(.hero-note)', { autoAlpha: 0, duration: .55 }, '-=.3')
    .from('.hero-actions .button', { autoAlpha: 0, duration: .5, stagger: .1 }, '-=.25')
    .from('.hero-note', { autoAlpha: 0, duration: .45 }, '-=.22');

  const revealGroup = (selector, triggerSelector, options = {}) => {
    const elements = gsap.utils.toArray(selector);
    const trigger = document.querySelector(triggerSelector);
    if (!elements.length || !trigger) return;
    gsap.from(elements, {
      autoAlpha: 0,
      filter: window.matchMedia('(max-width: 600px)').matches ? 'blur(3px)' : 'blur(8px)',
      duration: options.duration ?? .72,
      stagger: options.stagger ?? .085,
      ease,
      clearProps: 'opacity,visibility,filter',
      scrollTrigger: { trigger, start: options.start ?? 'top 88%', once: true }
    });
  };

  revealGroup('.hero-proof', '.hero-footer', { stagger: .12, start: 'top 94%' });
  revealGroup('.plans-section .section-heading > *', '.plans-section .section-heading');
  revealGroup('.plan-card', '.plans-grid', { stagger: .09, start: 'top 84%' });
  revealGroup('.connection-content > *', '.connection-band', { stagger: .11 });
  revealGroup('.benefits-intro > .eyebrow, .benefits-intro > h2, .benefits-intro > p, .orbit-panel', '.benefits-intro', { stagger: .12 });
  revealGroup('.benefit-card', '.benefit-cards', { stagger: .09 });
  revealGroup('.difference-section .section-heading > *', '.difference-section .section-heading');
  revealGroup('.difference-item', '.difference-grid', { stagger: .09 });
  revealGroup('.difference-cta', '.difference-cta');
  revealGroup('.faq-title-col > *', '.faq-title-col', { stagger: .1 });
  revealGroup('.faq-items details', '.faq-items', { stagger: .06 });
  revealGroup('.final-content > *', '.final-section', { stagger: .09 });
  revealGroup('.footer-content > *', '.footer', { stagger: .07 });

  // O fundo de todas as seções permanece imóvel, inclusive nas rolagens.
  // Os cards mantêm a própria posição, mesmo com o cursor sobre eles.

  // FAQ: altura, texto e ícone em sincronia. <details> continua semântico.
  const animating = new WeakSet();
  document.querySelectorAll('.faq-items details').forEach(details => {
    details.addEventListener('click', event => {
      const summary = event.target.closest('summary');
      if (!summary || !details.contains(summary)) return;
      event.preventDefault();
      if (animating.has(details)) return;

      const body = details.querySelector('p');
      if (!body) {
        details.open = !details.open;
        return;
      }
      animating.add(details);
      gsap.killTweensOf([details, body]);
      const collapsedHeight = summary.offsetHeight + 2;

      if (details.open) {
        gsap.set(details, { height: details.offsetHeight, overflow: 'hidden' });
        gsap.to(body, { autoAlpha: 0, duration: .18, ease: 'power1.in' });
        gsap.to(details, {
          height: collapsedHeight,
          duration: .38,
          ease: 'power2.inOut',
          onComplete: () => {
            details.open = false;
            gsap.set(details, { clearProps: 'height,overflow' });
            gsap.set(body, { clearProps: 'opacity,visibility' });
            animating.delete(details);
            ScrollTrigger.refresh(true);
          }
        });
      } else {
        details.open = true;
        const expandedHeight = details.scrollHeight + 2;
        gsap.set(details, { height: collapsedHeight, overflow: 'hidden' });
        gsap.set(body, { autoAlpha: 0 });
        gsap.to(details, {
          height: expandedHeight,
          duration: .46,
          ease: 'power3.inOut',
          onComplete: () => {
            gsap.set(details, { clearProps: 'height,overflow' });
            animating.delete(details);
            ScrollTrigger.refresh(true);
          }
        });
        gsap.to(body, { autoAlpha: 1, duration: .35, delay: .11, ease: 'power2.out' });
      }
    });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh(true), { once: true });
})();

