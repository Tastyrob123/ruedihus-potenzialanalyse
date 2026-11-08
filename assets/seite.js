/* Potenzialanalyse Landgasthof Ruedihus · Verhalten (16.10.2026)
   Zeilen der Überschriften, Leiste, Fenster der Chronik, Karussell der Belege, Bahn in Spalten mit Zahlen.
   Ohne Skript steht alles da: Schrift, Bilder, erster Beleg je Hinweis. */
(() => {
  const doc = document.documentElement;
  const zeit = window.CSS && CSS.supports('animation-timeline: view()');
  const ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!zeit && !ruhig) doc.classList.add('ohne-zeit');

  /* ── Überschriften in echte Zeilen zerlegen (je Zeile ein Schlitz) */
  function zeilen(el) {
    const text = el.dataset.text || el.textContent.trim();
    el.dataset.text = text;
    const woerter = text.split(/\s+/);
    el.innerHTML = woerter.map(w => `<span class="w">${w.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`).join(' ');
    const gruppen = []; let top = null;
    el.querySelectorAll('.w').forEach(w => { const t = w.offsetTop; if (top === null || Math.abs(t - top) > 4) { gruppen.push([]); top = t; } gruppen[gruppen.length - 1].push(w.textContent); });
    el.innerHTML = gruppen.map(g => `<span class="z"><span>${g.join(' ').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span></span>`).join('');
  }
  const rolls = [...document.querySelectorAll('.roll')];
  const allesZeilen = () => rolls.forEach(zeilen);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(allesZeilen);

  /* ── Ersatz ohne Zeitachse: beim Hereinkommen einmal setzen */
  if (!zeit && !ruhig && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('da'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -4% 0px' });
    document.querySelectorAll('.rb, .roll').forEach(el => { if (!el.closest('.auftakt')) io.observe(el); else el.classList.add('da'); });
  }

  /* ── Leiste: nach dem Auftakt da, beim Runterscrollen weg, beim Hochscrollen zurück; Rubrik im Blick unterstrichen */
  const leiste = document.querySelector('.leiste');
  const auftakt = document.querySelector('.auftakt');
  let letzt = scrollY, tick = false;
  function lage() {
    tick = false; const y = scrollY; const unten = auftakt ? auftakt.offsetHeight * .7 : 300;
    const hoch = y < letzt - 2; const runter = y > letzt + 2;
    if (y < unten) leiste.classList.remove('da'); else if (hoch) leiste.classList.add('da'); else if (runter) leiste.classList.remove('da');
    letzt = y;
  }
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(lage); } }, { passive: true });
  leiste.addEventListener('focusin', () => leiste.classList.add('da'));
  const marken = [...leiste.querySelectorAll('a[data-r]')];
  const ziele = [document.getElementById('karte'), ...document.querySelectorAll('.rubrik')].filter(Boolean);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const id = e.target.id === 'karte' ? 'karte' : e.target.dataset.rubrik; marken.forEach(a => a.classList.toggle('akt', a.dataset.r === id)); } }), { rootMargin: '-45% 0px -50% 0px' });
    ziele.forEach(z => io.observe(z));
  }

  /* ── Fenster der Chronik: Bild erst bei Annäherung laden, nur das nahe Fenster zeigt sein Bild */
  const fenster = [...document.querySelectorAll('.fenster')];
  const ladeFenster = f => { const im = f.querySelector('img[data-src]'); if (im) { im.srcset = im.dataset.srcset; im.src = im.dataset.src; im.removeAttribute('data-src'); } };
  if ('IntersectionObserver' in window) {
    const vor = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { ladeFenster(e.target); vor.unobserve(e.target); } }), { rootMargin: '250% 0px' });
    const nah = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('nah', e.isIntersecting)), { rootMargin: '10% 0px' });
    fenster.forEach(f => { vor.observe(f); nah.observe(f); });
  } else fenster.forEach(f => { ladeFenster(f); f.classList.add('nah'); });

  /* ── Stelle: Bild gross, Bahn so hoch wie das Bild, Zahlenreihe wechselt die Stelle (altes Bild bleibt, bis das neue da ist) */
  const stellen = [...document.querySelectorAll('.stelle')];
  function masse() { stellen.forEach(st => { const bild = st.querySelector('.stelle__bild'); const h = bild.getBoundingClientRect().height; if (h > 40) st.style.setProperty('--sh', Math.round(h) + 'px'); }); }
  stellen.forEach(st => {
    const lage = JSON.parse(st.dataset.lage); const img = st.querySelector('.stelle__bild img'); const marke = st.querySelector('.stelle__marke');
    st.querySelectorAll('.stelle__reihe button').forEach(bt => bt.addEventListener('click', () => {
      const k = +bt.dataset.k; const s = lage[k]; if (!s) return;
      st.querySelectorAll('.stelle__reihe button').forEach(x => x.classList.toggle('akt', x === bt));
      marke.style.setProperty('--y', s.y);
      const neu = new Image(); neu.src = s.src; const setz = () => { img.src = s.src; };
      (neu.decode ? neu.decode() : Promise.resolve()).then(setz, setz);
    }));
  });

  /* ── Karussell: Band fährt, Höhe = höchstes Blatt (nichts springt beim Wechseln) */
  const kars = [...document.querySelectorAll('.kar')];
  function hoeheKar(k) {
    const blaetter = [...k.querySelectorAll('.kar__blatt')];
    const fen = k.querySelector('.kar__fenster');
    const handy = matchMedia('(max-width:760px)').matches; if (!handy) fen.style.height = '';
    const h = handy ? (blaetter[k._i || 0] || blaetter[0]).scrollHeight : Math.max(...blaetter.map(x => x.scrollHeight)); fen.style.height = h + 'px';
  }
  kars.forEach(k => {
    const band = k.querySelector('.kar__band'); const n = +k.dataset.n; let i = 0;
    if (n < 2) return;
    const stand = k.querySelector('.kar__stand');
    const blaetter = [...k.querySelectorAll('.kar__blatt')];
    const geh = j => { i = (j + n) % n; k._i = i; band.style.transform = `translateX(${-i * 100}%)`; stand.querySelector('b').textContent = i + 1; stand.querySelector('span').textContent = blaetter[i].dataset.name;
      blaetter.forEach((bl, x) => { bl.inert = x !== i; bl.setAttribute('aria-hidden', x !== i); }); hoeheKar(k); };
    k.querySelector('.kar__pf--l').addEventListener('click', () => geh(i - 1));
    k.querySelector('.kar__pf--r').addEventListener('click', () => geh(i + 1));
    let x0 = null, y0 = 0;
    band.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; x0 = e.clientX; y0 = e.clientY; }, { passive: true });
    band.addEventListener('pointerup', e => { if (x0 === null) return; const dx = e.clientX - x0, dy = e.clientY - y0; x0 = null; if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) geh(i + (dx < 0 ? 1 : -1)); }, { passive: true });
    geh(0);
  });

  function alles() { masse(); kars.forEach(hoeheKar); }
  let rz = 0, breit = innerWidth;
  addEventListener('resize', () => { if (Math.abs(innerWidth - breit) < 30) return; breit = innerWidth; cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { allesZeilen(); alles(); }); });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(alles);
  addEventListener('load', () => { masse(); kars.forEach(hoeheKar); });
  document.querySelectorAll('.kar img').forEach(im => im.addEventListener('load', () => { masse(); hoeheKar(im.closest('.kar')); }, { once: true }));
  document.querySelectorAll('details.genau').forEach(d => d.addEventListener('toggle', () => hoeheKar(d.closest('.hw').querySelector('.kar'))));
})();
