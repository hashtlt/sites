(function(){
  'use strict';

  /* ---------- Header: solid on scroll ---------- */
  var header = document.querySelector('.site-header');
  var callbar = document.getElementById('callbar');
  function onScroll(){
    var y = window.scrollY;
    header.classList.toggle('scrolled', y > 40);
    if (callbar) callbar.classList.toggle('show', y > 500);
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById('menuToggle');
  var nav = document.getElementById('nav');
  function setMenu(open){
    nav.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
  }
  toggle.addEventListener('click', function(){ setMenu(!nav.classList.contains('open')); });
  nav.addEventListener('click', function(e){
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape'){ setMenu(false); closeDrops(); }
  });

  /* ---------- Services dropdown ---------- */
  var drops = document.querySelectorAll('.has-drop');
  function closeDrops(){
    drops.forEach(function(d){ d.classList.remove('open'); d.querySelector('button').setAttribute('aria-expanded','false'); });
  }
  drops.forEach(function(d){
    var btn = d.querySelector('button');
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var open = !d.classList.contains('open');
      closeDrops();
      d.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
    d.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeDrops); });
  });
  document.addEventListener('click', function(e){ if (!e.target.closest('.has-drop')) closeDrops(); });

  /* ---------- Carousels (scroll-snap + arrows) ---------- */
  document.querySelectorAll('.arrows[data-for]').forEach(function(group){
    var track = document.getElementById(group.getAttribute('data-for'));
    var prev = group.querySelector('.prev'), next = group.querySelector('.next');
    function step(){
      var first = track.children[0];
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return first ? first.getBoundingClientRect().width + gap : track.clientWidth;
    }
    function update(){
      var max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
    }
    prev.addEventListener('click', function(){ track.scrollBy({left:-step(), behavior:'smooth'}); });
    next.addEventListener('click', function(){ track.scrollBy({left: step(), behavior:'smooth'}); });
    track.addEventListener('scroll', function(){ window.requestAnimationFrame(update); }, {passive:true});
    window.addEventListener('resize', update);
    track.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight'){ e.preventDefault(); next.click(); }
      if (e.key === 'ArrowLeft'){ e.preventDefault(); prev.click(); }
    });
    update();
  });

  /* ---------- Review dots ---------- */
  var qTrack = document.getElementById('quoteTrack');
  var dotsWrap = document.getElementById('quoteDots');
  if (qTrack && dotsWrap) (function(){
  Array.prototype.forEach.call(qTrack.children, function(_, i){
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Show review ' + (i + 1));
    b.addEventListener('click', function(){ qTrack.scrollTo({left: i * qTrack.clientWidth, behavior:'smooth'}); });
    dotsWrap.appendChild(b);
  });
  function updateDots(){
    var i = Math.round(qTrack.scrollLeft / Math.max(1, qTrack.clientWidth));
    Array.prototype.forEach.call(dotsWrap.children, function(d, j){ d.setAttribute('aria-current', String(i === j)); });
  }
  qTrack.addEventListener('scroll', function(){ window.requestAnimationFrame(updateDots); }, {passive:true});
  updateDots();
  })();

  /* ---------- Before / after sliders ---------- */
  document.querySelectorAll('.ba').forEach(function(ba){
    var range = ba.querySelector('input[type=range]');
    range.addEventListener('input', function(){ ba.style.setProperty('--pos', range.value + '%'); });
  });

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if (en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    }, {rootMargin:'0px 0px -8% 0px', threshold:0.08});
    reveals.forEach(function(el){ io.observe(el); });
  } else {
    reveals.forEach(function(el){ el.classList.add('in'); });
  }

  /* ---------- Quote form (client-side validation) ---------- */
  var form = document.getElementById('quoteForm');
  if (form) (function(){
  function setErr(input, msg){
    var f = input.closest('.field');
    f.classList.toggle('invalid', !!msg);
    f.querySelector('.err').textContent = msg || '';
  }
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var ok = true;
    var name = form.elements.name, phone = form.elements.phone, email = form.elements.email, zip = form.elements.zip;
    if (!name.value.trim()){ setErr(name, 'Please add your name.'); ok = false; } else setErr(name);
    var digits = phone.value.replace(/\D/g, '');
    if (digits.length < 10){ setErr(phone, 'Add a 10-digit phone number so I can call or text you back.'); ok = false; } else setErr(phone);
    if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)){ setErr(email, 'That email looks incomplete.'); ok = false; } else setErr(email);
    if (zip.value && !/^\d{5}$/.test(zip.value)){ setErr(zip, 'Use a 5-digit ZIP code.'); ok = false; } else setErr(zip);
    if (!ok){ var bad = form.querySelector('.invalid input'); if (bad) bad.focus(); return; }
    /* TODO: send to your form service here (fetch to Formspree / Netlify / your backend) */
    form.classList.add('sent');
    form.querySelector('[type=submit]').disabled = true;
  });
  })();

  /* ---------- Photo slots: drop a file with the listed name into /images and it appears ---------- */
  document.querySelectorAll('.photo-slot[data-src]').forEach(function(slot){
    var probe = new Image(), remote = slot.getAttribute('data-remote'), tried = false;
    probe.onerror = function(){ if (remote && !tried){ tried = true; probe.src = remote; } };
    probe.onload = function(){
      var img = document.createElement('img');
      img.src = probe.src;
      img.alt = slot.getAttribute('data-alt') || '';
      img.loading = 'lazy';
      img.style.width = '100%'; img.style.height = '100%'; img.style.objectFit = 'cover';
      img.className = slot.className.replace('photo-slot','').replace('dark','').trim();
      slot.replaceWith(img);
    };
    probe.src = slot.getAttribute('data-src');
  });

  /* ---------- Year ---------- */
  var yr = document.getElementById('year'); if (yr) yr.textContent = new Date().getFullYear();
})();
