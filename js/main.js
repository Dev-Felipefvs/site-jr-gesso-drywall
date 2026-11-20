/* Menu, topo, galeria, formulário → WhatsApp */
(function () {
  document.documentElement.classList.add('js');
  const WA = '5582999930134';

  // topo muda ao sair do hero
  const top = document.querySelector('[data-top]');
  const hero = document.querySelector('.hero');
  const float = document.querySelector('.wa-float');
  const onScroll = () => {
    const past = scrollY > (hero ? hero.offsetHeight - 80 : 40);
    top.toggleAttribute('data-scrolled', past);
    if (float) float.toggleAttribute('data-hide', !past);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // menu do celular
  const btn = document.querySelector('[data-menu]');
  const nav = document.getElementById('menu');
  const setMenu = (open) => {
    btn.setAttribute('aria-expanded', open); nav.classList.toggle('is-open', open);
    btn.querySelector('.sr').textContent = open ? 'Fechar menu' : 'Abrir menu';
  };
  btn.addEventListener('click', () => setMenu(btn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // galeria
  const lb = document.querySelector('[data-lb]');
  const lbImg = lb.querySelector('img'), lbCap = lb.querySelector('.lb__cap');
  document.querySelectorAll('[data-full]').forEach((b) => b.addEventListener('click', () => {
    const img = b.querySelector('img');
    lbImg.src = b.dataset.full; lbImg.alt = img.alt;
    lbCap.textContent = b.closest('figure').querySelector('figcaption').textContent;
    lb.showModal();
  }));
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('[data-lb-close]')) lb.close(); });
  lb.addEventListener('close', () => { lbImg.removeAttribute('src'); });

  // formulário abre o WhatsApp com a mensagem pronta
  const form = document.querySelector('[data-form]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const nome = (d.get('nome') || '').trim();
    const err = form.querySelector('.form__err'), field = form.querySelector('[name=nome]').closest('.f');
    if (!nome) { err.hidden = false; field.setAttribute('data-bad', ''); form.nome.focus(); return; }
    err.hidden = true; field.removeAttribute('data-bad');
    const linhas = [
      `Olá, JR! Sou ${nome} e vim pelo site.`,
      `Serviço: ${d.get('servico')}`,
      d.get('local').trim() && `Local da obra: ${d.get('local').trim()}`,
      d.get('msg').trim() && `Detalhes: ${d.get('msg').trim()}`
    ].filter(Boolean);
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(linhas.join('\n'))}`, '_blank', 'noopener');
  });

  // entrada suave das seções (o conteúdo já é visível sem JS)
  const items = document.querySelectorAll('.services__head, .spec__row, .works__head, .w, .shop__text, .q, .contact__text, .form');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    items.forEach((el, i) => { el.classList.add('rise'); el.style.transitionDelay = (el.classList.contains('w') || el.classList.contains('spec__row')) ? `${(i % 4) * 70}ms` : ''; io.observe(el); });
  }
})();
