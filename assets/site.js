/* DATSIEV CLUB — общие скрипты: появление блоков при скролле,
   подсветка карточек, карусель зон, видео и карточки направлений.
   Каждый блок сам проверяет, есть ли его элементы на странице. */

/* ====== Имя тренера в шапке: подгоняем под колонку ======
   Кегль задан долей от экрана, а длина фамилии от экрана не зависит:
   «Султанмагомедов» и «Стецуренко» при одном и том же размере вылезают
   за правый край колонки, потому что перенести одно слово некуда.
   Уменьшаем ровно настолько, чтобы влезло, — короткие имена при этом
   остаются крупными. */
(function(){
  const el = document.querySelector('.chero__name');
  if(!el) return;

  function fit(){
    el.style.fontSize = '';                      // сначала вернуть размер из CSS
    const base = parseFloat(getComputedStyle(el).fontSize);
    if(!base) return;
    let size = base;
    const floor = base * 0.55;                   // ниже не опускаемся: имя — главный элемент экрана
    while(el.scrollWidth > el.clientWidth + 1 && size > floor){
      size -= 1;
      el.style.fontSize = size + 'px';
    }
  }

  fit();
  addEventListener('resize', fit, { passive:true });

  /* Montserrat подключается отдельным файлом и подменяет запасной шрифт
     примерно через 200 мс после отрисовки. В запасном имя уже и влезает,
     поэтому первый замер ничего не находит. На событие загрузки шрифтов
     полагаться нельзя: оно срабатывает раньше, чем строка пересчитается
     под новое начертание. Поэтому первые две секунды просто перемеряем —
     как только ширина перестаёт меняться, опрос останавливается. */
  let prev = -1, idle = 0;
  const t = setInterval(() => {
    const now = el.scrollWidth;
    if(now === prev){ if(++idle > 3) clearInterval(t); }
    else { idle = 0; prev = now; fit(); }
  }, 120);
  setTimeout(() => clearInterval(t), 2400);
})();

/* ====== Меню на телефоне ======
   Пункты берём из самой шапки, а не пишем списком: тогда меню нельзя
   забыть обновить — оно всегда повторяет навигацию страницы. */
(function(){
  const burger = document.querySelector('.burger');
  const links  = document.querySelector('.nav__links');
  if(!burger || !links) return;

  const panel = document.createElement('div');
  panel.className = 'mnu';
  panel.hidden = true;

  const list = [...links.querySelectorAll('a')]
    .map(a => '<a href="' + a.getAttribute('href') + '">' + a.textContent + '</a>').join('');

  panel.innerHTML =
      '<button class="mnu__x" type="button" aria-label="Закрыть меню"><i></i><i></i></button>'
    + '<nav class="mnu__list">' + list + '</nav>'
    + '<div class="mnu__foot">'
    +   '<a class="mnu__tel" href="tel:+79271000033">+7 927 100-00-33</a>'
    +   '<p class="mnu__addr">Саратов, ул.\u00a0Астраханская, 103, 4\u00a0этаж<br>ежедневно 9:30–22:00</p>'
    +   '<button class="btn btn--primary mnu__cta" data-book="меню" data-kind="Бесплатная первая тренировка">Записаться на\u00a0бесплатную</button>'
    + '</div>';
  document.body.appendChild(panel);

  function open(){
    panel.hidden = false;
    panel.classList.add('is-open');
    // крестик — ровно на месте бургера, чтобы кнопка не прыгала
    const r = burger.getBoundingClientRect();
    const x = panel.querySelector('.mnu__x');
    x.style.top = Math.round(r.top) + 'px';
    x.style.left = Math.round(r.left) + 'px';
    burger.classList.add('is-x');
    burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-menu');
    document.body.style.overflow = 'hidden';
  }
  function close(){
    panel.classList.remove('is-open');
    panel.hidden = true;
    burger.classList.remove('is-x');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-menu');
    document.body.style.overflow = '';
  }
  const isOpen = () => panel.classList.contains('is-open');

  burger.setAttribute('aria-expanded', 'false');
  burger.addEventListener('click', () => isOpen() ? close() : open());
  // по ссылке уходим со страницы, по кнопке записи открывается форма —
  // в обоих случаях панель должна закрыться
  panel.addEventListener('click', e => { if(e.target.closest('a, button')) close(); });
  addEventListener('keydown', e => { if(e.key === 'Escape' && isOpen()) close(); });
  // вернулись на широкий экран — панель больше не нужна
  matchMedia('(min-width:901px)').addEventListener('change', e => { if(e.matches && isOpen()) close(); });
})();

/* ====== ФОРМА ЗАПИСИ ======
   Одна форма на весь сайт. Открывает её любой элемент с атрибутом
   data-book; контекст (направление, группа, время, тренер, зал, цена)
   приезжает в data-атрибутах той же кнопки, поэтому человек видит в
   форме именно то, что выбрал, и не заполняет это руками.
   Состав полей и список того, что уходит менеджеру, — из прототипа,
   согласованного с клубом.

   КУДА УХОДЯТ ЗАЯВКИ. Пока никуда: BOOK_ENDPOINT пуст, форма показывает
   экран «заявка отправлена» и складывает заявку в window.DC_BOOKINGS,
   чтобы её можно было посмотреть. Как только у клуба появится адрес
   приёмника (CRM, почтовый скрипт на хостинге, телеграм-бот) — вписать
   его в BOOK_ENDPOINT, и заявки пойдут туда без других правок. */
(function(){
  const BOOK_ENDPOINT = '';   // ← адрес приёмника заявок; пусто = только показ
  const PHONE = '+7 927 100-00-33';
  const PHONE_HREF = 'tel:+79271000033';

  // порядок строк сводки = порядок, в котором это увидит менеджер
  const RECAP = [
    ['kind',  'Тип занятия'],
    ['dir',   'Направление'],
    ['group', 'Группа'],
    ['time',  'Время'],
    ['coach', 'Тренер'],
    ['price', 'Стоимость']
  ];

  let box, win, last, ctx = {}, help = null;

  function esc(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function build(){
    box = document.createElement('div');
    box.className = 'bk';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.hidden = true;
    box.innerHTML = '<div class="bk__veil" data-close></div><div class="bk__win"></div>';
    document.body.appendChild(box);
    win = box.querySelector('.bk__win');

    box.addEventListener('click', e => { if(e.target.hasAttribute('data-close')) close(); });
    addEventListener('keydown', e => { if(e.key === 'Escape' && box.classList.contains('is-open')) close(); });
  }

  /* ---------- разметка формы ---------- */
  /* Две формы, как в прототипе. Если человек уже выбрал группу, тренера,
     время или тариф — короткая: сводка выбранного плюс три поля. Если
     нажал общее «Записаться» и ничего не выбирал — быстрая: контакты и
     вопрос, нужна ли помощь с выбором. */
  function formHTML(){
    const chose = !!(ctx.dir || ctx.group || ctx.coach || ctx.time || ctx.price);
    const rows = chose
      ? RECAP.filter(([k]) => ctx[k])
          .map(([k, label]) => '<div><dt>' + label + '</dt><dd>' + esc(ctx[k]) + '</dd></div>').join('')
      : '';

    const t = ctx.title || (chose ? 'Запись на\u00a0тренировку' : 'Записаться на\u00a0бесплатную тренировку');
    const sub = ctx.sub || (chose
      ? 'Менеджер перезвонит, подтвердит время и\u00a0ответит на\u00a0вопросы.'
      : 'Оставьте контакты\u00a0— перезвоним и\u00a0подтвердим время.');

    let h = '<button class="bk__x" type="button" data-close aria-label="Закрыть">✕</button>';
    if(rows) h += '<p class="bk__k">Проверьте, всё\u00a0ли верно</p>';
    h += '<h2 class="bk__h">' + esc(t) + '</h2>';
    h += '<p class="bk__sub">' + esc(sub) + '</p>';
    if(rows) h += '<div class="bk__recap"><dl>' + rows + '</dl></div>';

    h += '<form class="bk__fields" novalidate>';
    // возраст спрашиваем там, где записывают на занятие в конкретную группу
    if(chose && ctx.age !== 'no'){
      h += field('age', 'Возраст занимающегося', 'например, 9', 'text');
    }
    h += field('name', 'Имя', 'Как\u00a0к\u00a0вам обращаться', 'text');
    h += field('phone', 'Телефон', '+7 ___ ___-__-__', 'tel');

    // ничего не выбрано — предлагаем помощь с выбором
    if(!chose && !ctx.title){
      h += '<div class="field"><span>Нужна помощь в\u00a0выборе секции и\u00a0тренера?</span>'
         + '<div class="bk__opts">'
         + '<button class="bk__opt" type="button" data-help="да">Да, помогите подобрать</button>'
         + '<button class="bk__opt" type="button" data-help="нет">Нет, я\u00a0определился</button>'
         + '</div></div>';
    }

    h += '<p class="bk__consent">Нажимая кнопку, вы\u00a0соглашаетесь с\u00a0обработкой персональных данных</p>';
    h += '<button class="btn btn--primary bk__submit" type="submit">' + esc(ctx.cta || 'Отправить заявку') + '</button>';
    h += '<p class="bk__err" hidden></p>';
    h += '</form>';
    h += '<p class="bk__phone">По\u00a0любым вопросам звоните нашим менеджерам: '
       + '<a href="' + PHONE_HREF + '">' + PHONE + '</a></p>';
    return h;
  }

  function field(name, label, ph, type){
    return '<label class="field"><span>' + label + '</span>'
         + '<input type="' + type + '" name="' + name + '" placeholder="' + esc(ph) + '"></label>';
  }

  function okHTML(){
    return '<button class="bk__x" type="button" data-close aria-label="Закрыть">✕</button>'
      + '<div class="bk__ok">'
      + '<div class="bk__tick"><svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5"/></svg></div>'
      + '<h2 class="bk__h" style="padding-right:0">Заявка отправлена</h2>'
      + '<p class="bk__sub">Менеджер перезвонит в\u00a0течение рабочего дня, подтвердит время '
      + 'и\u00a0подберёт тренера.</p>'
      + '<p class="bk__phone" style="border-top:0;padding-top:0">Саратов, ул.\u00a0Астраханская, 103, 4\u00a0этаж · '
      + 'ежедневно 9:30–22:00 · <a href="' + PHONE_HREF + '">' + PHONE + '</a></p>'
      + '<button class="btn btn--ghost btn--sm" type="button" data-close style="margin-top:18px">Закрыть</button>'
      + '</div>';
  }

  /* ---------- открытие и закрытие ---------- */
  function open(data, source){
    if(!box) build();
    ctx = data || {};
    help = null;
    last = source || null;
    win.innerHTML = formHTML();
    box.hidden = false;
    box.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    const first = win.querySelector('input');
    if(first) first.focus({ preventScroll:true });
  }

  function close(){
    box.classList.remove('is-open');
    box.hidden = true;
    document.body.style.overflow = '';
    if(last && last.focus) last.focus({ preventScroll:true });
  }

  /* ---------- отправка ---------- */
  function send(form){
    const err = win.querySelector('.bk__err');
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const digits = phone.replace(/\D/g, '');

    if(!name){ return fail(err, 'Напишите, как\u00a0к\u00a0вам обращаться', form.name); }
    if(digits.length < 10){ return fail(err, 'Проверьте номер телефона', form.phone); }
    err.hidden = true;

    const payload = Object.assign({
      источник: ctx.src || 'кнопка на сайте',
      страница: location.pathname.split('/').pop() || 'index.html',
      имя: name,
      телефон: phone,
      возраст: form.age ? form.age.value.trim() || '—' : '—',
      'нужна помощь с выбором': help || '—',
      отправлено: new Date().toISOString()
    }, recapPayload());

    (window.DC_BOOKINGS = window.DC_BOOKINGS || []).push(payload);

    if(BOOK_ENDPOINT){
      fetch(BOOK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});   // человеку об этом знать незачем, заявка уже у нас в списке
    }

    win.innerHTML = okHTML();
  }

  function recapPayload(){
    const o = {};
    RECAP.forEach(([k, label]) => { if(ctx[k]) o[label.toLowerCase()] = ctx[k]; });
    return o;
  }

  function fail(err, msg, input){
    err.textContent = msg;
    err.hidden = false;
    if(input) input.focus();
  }

  /* ---------- связь с кнопками страницы ---------- */
  // контекст собираем и с самой кнопки, и с ближайшего предка [data-book-ctx]:
  // так строке расписания не нужно дублировать данные на каждой кнопке
  function ctxOf(el){
    const host = el.closest('[data-book-ctx]');
    const out = {};
    const take = node => {
      if(!node) return;
      Object.keys(node.dataset).forEach(k => {
        if(k === 'book' || k === 'bookCtx') return;
        out[k] = node.dataset[k];
      });
    };
    take(host);
    take(el);
    if(el.dataset.book) out.src = el.dataset.book;
    return out;
  }

  document.addEventListener('click', e => {
    const opt = e.target.closest('.bk__opt');
    if(opt){
      help = opt.dataset.help;
      win.querySelectorAll('.bk__opt').forEach(b => b.classList.toggle('is-on', b === opt));
      return;
    }
    const close$ = e.target.closest('[data-close]');
    if(close$ && box && box.contains(close$)){ close(); return; }

    const trigger = e.target.closest('[data-book]');
    if(!trigger) return;
    e.preventDefault();
    open(ctxOf(trigger), trigger);
  });

  document.addEventListener('submit', e => {
    if(!box || !box.contains(e.target)) return;
    e.preventDefault();
    send(e.target);
  });

  // чтобы форму можно было открыть из другого скрипта (например, из расписания)
  window.DCBooking = { open: open };
})();

/* ====== Заявка на мероприятие (страница доп. услуг) ======
   Эта форма стоит прямо на странице, а не в окне, но ведёт себя так же:
   проверяет имя и телефон и показывает подтверждение вместо полей. */
(function(){
  const form = document.querySelector('form.frm');
  if(!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = (form.name && form.name.value || '').trim();
    const phone = (form.phone && form.phone.value || '').trim();
    let err = form.querySelector('.bk__err');
    if(!err){
      err = document.createElement('p');
      err.className = 'bk__err';
      form.querySelector('.frm__foot').appendChild(err);
    }
    if(!name){ err.textContent = 'Напишите, как\u00a0к\u00a0вам обращаться'; err.hidden = false; form.name.focus(); return; }
    if(phone.replace(/\D/g,'').length < 10){ err.textContent = 'Проверьте номер телефона'; err.hidden = false; form.phone.focus(); return; }

    const payload = { источник:'заявка на мероприятие', страница:'uslugi.html' };
    ['what','date','people','place','name','phone'].forEach(k => {
      if(form[k]) payload[k] = form[k].value.trim() || '—';
    });
    (window.DC_BOOKINGS = window.DC_BOOKINGS || []).push(payload);

    form.innerHTML =
      '<div class="bk__ok">'
      + '<div class="bk__tick"><svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5"/></svg></div>'
      + '<h3 class="bk__h" style="padding-right:0">Заявка отправлена</h3>'
      + '<p class="bk__sub">Администратор посчитает стоимость, предложит свободное время '
      + 'и\u00a0перезвонит в\u00a0течение рабочего дня.</p>'
      + '<p class="bk__phone" style="border-top:0;padding-top:0">Саратов, ул.\u00a0Астраханская, 103, 4\u00a0этаж · '
      + 'ежедневно 9:30–22:00 · <a href="tel:+79271000033">+7\u00a0927\u00a0100-00-33</a></p>'
      + '</div>';
  });
})();

/* Появление блоков при скролле — со сдвигом и небольшой задержкой внутри секции */
(function(){
  const els = [...document.querySelectorAll('.rv')];
  if(!els.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Скрывать разрешаем только после того, как убедились, что умеем показать обратно
  document.documentElement.classList.add('js-rv');
  els.forEach((el,i)=>{ el.style.transitionDelay = (i % 4) * 60 + 'ms'; });

  const reveal = el => { if(!el.classList.contains('in')) el.classList.add('in'); };

  // Основной механизм — проверка попадания в экран. Работает и без наблюдателя.
  let waiting = els.slice();
  function check(){
    const h = innerHeight || document.documentElement.clientHeight;
    waiting = waiting.filter(el=>{
      const r = el.getBoundingClientRect();
      if(r.top < h * 0.92 && r.bottom > 0){ reveal(el); return false; }
      return true;
    });
    if(!waiting.length && onScroll) removeEventListener('scroll', onScroll);
  }

  // Тротлинг по времени, без requestAnimationFrame: меньше зависимостей,
  // работает даже там, где кадры не запрашиваются.
  let last = 0;
  function onScroll(){
    const now = Date.now();
    if(now - last < 80) return;
    last = now; check();
  }

  addEventListener('scroll', onScroll, { passive:true });
  addEventListener('resize', onScroll, { passive:true });

  // Наблюдатель — быстрее и точнее, но лишь дополняет проверку выше
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver(es=>{
      es.forEach(e=>{ if(e.isIntersecting){ reveal(e.target); io.unobserve(e.target); } });
    }, { rootMargin:'0px 0px -8% 0px', threshold:0 });
    els.forEach(el=>io.observe(el));
  }

  check();
  addEventListener('load', check);

  // Последняя страховка. Если через 3 секунды не проявился ни один блок,
  // значит ни наблюдатель, ни события прокрутки в этой среде не работают —
  // показываем всё сразу. Контент важнее анимации.
  setTimeout(()=>{
    if(els.some(el=>el.classList.contains('in'))) return;
    document.documentElement.classList.add('rv-off');
    els.forEach(reveal);
  }, 3000);
})();

/* ====== Первый экран: видео проявляется поверх кадра-заставки ======
   Пока ролик не начал играть, виден постер — лёгкая картинка, которая
   рисуется сразу. Подмены не заметно: переход мягкий. Какой ролик и какой
   постер грузить, решает сам браузер по условиям в разметке. */
(function(){
  const v = document.querySelector('.hero__media video');
  if(!v) return;
  const show = () => v.classList.add('is-on');
  if(v.readyState >= 3) show();
  v.addEventListener('playing', show, { once:true });
  v.addEventListener('loadeddata', show, { once:true });
  // страховка: если автозапуск запретили, показываем первый кадр видео
  setTimeout(show, 4000);
})();

/* ====== Клипы ВКонтакте: плеер подставляем по клику ======
   Плеер VK тянет свои скрипты и заметно утяжеляет страницу, поэтому до
   нажатия стоит обычная обложка, а iframe создаётся только по клику.
   Заодно autoplay=1 из кода вставки срабатывает: это ответ на действие
   пользователя, а не автозапуск при загрузке. */
(function(){
  document.querySelectorAll('.clip[data-clip]').forEach(box => {
    const btn = box.querySelector('.clip__play');
    if(!btn) return;
    btn.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = box.dataset.clip;
      f.title = box.dataset.title || 'Клип ВКонтакте';
      f.setAttribute('allow', 'autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock;');
      f.setAttribute('allowfullscreen', '');
      f.setAttribute('frameborder', '0');
      box.appendChild(f);
      box.classList.add('is-on');
    }, { once:true });
  });
})();

/* ====== Лента ВКонтакте ======
   Записи забираем у своего сервера (api/vk-posts.php), он ходит в API ВК
   раз в десять минут и отдаёт три последних записи готовым JSON. Токен
   остаётся на сервере и в страницу не попадает.
   Рисуем их своей вёрсткой — тремя карточками в стиле сайта.
   Если сервер не ответил (сайт ещё не на хостинге, токен не заведён, ВК
   лежит), откатываемся на официальный виджет сообщества: он тяжёлый
   (~1,7 МБ в 193 запросах), но блок остаётся живым.
   Всё это включается не при загрузке страницы, а на подходе к блоку.
   Сейчас блока ленты на страницах нет (вместо неё клипы), и модуль спит.
   api/vk-posts.php в этой папке нет — он остался в datsiev-club-design. */
(function(){
  const box = document.querySelector('.vkfeed[data-vk-group]');
  if(!box) return;
  let started = false;

  // ?vkpreview=1 — посмотреть вёрстку карточек на образце, пока нет сервера
  const preview = /[?&]vkpreview\b/.test(location.search);
  const endpoint = preview ? box.dataset.vkSample : box.dataset.vkEndpoint;

  const month = ['января','февраля','марта','апреля','мая','июня',
                 'июля','августа','сентября','октября','ноября','декабря'];

  function humanDate(unix){
    const d = new Date(unix * 1000);
    const now = new Date();
    const s = d.getDate() + ' ' + month[d.getMonth()];
    return d.getFullYear() === now.getFullYear() ? s : s + ' ' + d.getFullYear();
  }

  // текст записи — чужой, поэтому только textContent, никакого innerHTML
  function card(post){
    const a = document.createElement('a');
    a.className = 'vkpost';
    a.href = post.url;
    a.target = '_blank';
    a.rel = 'noopener';

    if(post.image){
      const ph = document.createElement('div');
      ph.className = 'vkpost__ph';
      const img = document.createElement('img');
      img.src = post.image;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      ph.appendChild(img);
      if(post.video){
        const play = document.createElement('span');
        play.className = 'vkpost__play';
        ph.appendChild(play);
      }
      a.appendChild(ph);
    }

    const body = document.createElement('div');
    body.className = 'vkpost__body';

    const date = document.createElement('time');
    date.className = 'vkpost__date';
    date.dateTime = new Date(post.date * 1000).toISOString();
    date.textContent = humanDate(post.date);
    body.appendChild(date);

    if(post.text){
      const p = document.createElement('p');
      p.className = 'vkpost__txt';
      // переносы строк в карточке-анонсе только рвут ритм — схлопываем
      p.textContent = post.text.replace(/\s+/g, ' ').trim();
      body.appendChild(p);
    }

    const go = document.createElement('span');
    go.className = 'vkpost__go';
    go.textContent = 'Читать во\u00a0ВКонтакте\u00a0→';
    body.appendChild(go);

    a.appendChild(body);
    return a;
  }

  function render(posts){
    const grid = document.createElement('div');
    grid.className = 'vkposts';
    posts.forEach(p => grid.appendChild(card(p)));
    box.appendChild(grid);
    box.classList.add('is-on');
  }

  /* ---- запасной вариант: официальный виджет сообщества ---- */
  function widget(){
    const wrap = document.createElement('div');
    wrap.className = 'vkfeed__wid';
    const host = document.createElement('div');
    host.id = 'vk_group_feed';
    wrap.appendChild(host);
    box.appendChild(wrap);

    const s = document.createElement('script');
    s.src = 'https://vk.com/js/api/openapi.js?169';
    s.async = true;
    s.onerror = () => box.classList.add('is-off');
    s.onload = () => {
      if(!window.VK || !VK.Widgets || !VK.Widgets.Group){ box.classList.add('is-off'); return; }
      VK.Widgets.Group('vk_group_feed', {
        mode: 2, width: 'auto', height: '1200',   // 1200 — потолок самого ВК
        color1: '0D0D0F', color2: 'FFFFFF', color3: 'FFFFFF'
      }, Number(box.dataset.vkGroup));
      // заглушку убираем не по вызову, а когда виджет реально нарисовался
      const t = setInterval(() => {
        if(!box.querySelector('iframe')) return;
        box.classList.add('is-on');
        clearInterval(t);
      }, 200);
      setTimeout(() => {
        clearInterval(t);
        if(!box.classList.contains('is-on')) box.classList.add('is-off');
      }, 12000);
    };
    document.head.appendChild(s);
  }

  function start(){
    if(started) return;
    started = true;

    if(!endpoint){ widget(); return; }

    fetch(endpoint, { cache:'no-cache' })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(r.status)))
      .then(data => {
        const posts = (data && data.posts) || [];
        if(!posts.length) throw new Error('нет записей');
        render(posts);
      })
      .catch(() => widget());
  }

  if(!('IntersectionObserver' in window)){ start(); return; }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if(!e.isIntersecting) return;
      start();
      obs.unobserve(e.target);
    });
  }, { rootMargin:'800px 0px' });
  io.observe(box);
})();

/* ====== Карта: виджет Яндекса включается сам ======
   Нажимать ничего не нужно. Карточка организации тянет около 730 КБ в
   полусотне запросов, поэтому вместе со страницей она не грузится: iframe
   создаётся заранее, когда блок подходит к экрану, — к моменту, когда
   человек до него доскроллит, карта уже стоит. */
(function(){
  const boxes = [...document.querySelectorAll('.map[data-map]')];
  if(!boxes.length) return;

  function load(box){
    if(box.classList.contains('is-on')) return;
    const f = document.createElement('iframe');
    f.src = box.dataset.map;
    f.title = 'Карта: Datsiev Club, Саратов, ул. Астраханская, 103';
    f.setAttribute('allowfullscreen', '');
    f.setAttribute('frameborder', '0');
    box.appendChild(f);
    box.classList.add('is-on');
  }

  if(!('IntersectionObserver' in window)){ boxes.forEach(load); return; }

  // запас в 600 px — карта успевает встать до того, как блок войдёт в кадр
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if(!e.isIntersecting) return;
      load(e.target);
      obs.unobserve(e.target);
    });
  }, { rootMargin:'600px 0px' });
  boxes.forEach(b => io.observe(b));
})();

/* ====== Видео в блоке адаптации: грузим, когда блок близко к экрану ======
   Источник лежит в data-src, поэтому файл не тянется одновременно с
   первым экраном и не мешает ему. */
(function(){
  const v = document.querySelector('.kid__vid video');
  if(!v || !v.dataset.src) return;

  // ?nofx=1 показывает страницу без анимации входа — удобно для вёрстки
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    || /[?&]nofx\b/.test(location.search);
  let done = false;

  function start(){
    if(done) return;
    done = true;
    v.preload = 'auto';
    v.src = v.dataset.src;
    v.load();
    if(still){ v.controls = true; return; }   // движение отключено — только по кнопке
    const p = v.play();
    /* Автозапуск бывает запрещён: режим энергосбережения на iPhone,
       экономия трафика на Android. Тогда ролик молча стоял на постере и
       выглядел сломанным. Теперь показываем кнопку плеера и пробуем
       запустить при первом касании страницы — после жеста браузер
       воспроизведение разрешает. */
    if(p && p.catch) p.catch(() => {
      v.controls = true;
      const kick = () => { v.play().then(() => { v.controls = false; }).catch(() => {}); };
      addEventListener('touchstart', kick, { once:true, passive:true });
      addEventListener('click', kick, { once:true });
    });
    removeEventListener('scroll', onScroll);
  }

  function near(){
    const h = innerHeight || document.documentElement.clientHeight;
    const r = v.getBoundingClientRect();
    return r.top < h * 1.6 && r.bottom > -h * 0.6;
  }

  let last = 0;
  function onScroll(){
    const now = Date.now();
    if(now - last < 120) return;
    last = now;
    if(near()) start();
  }

  addEventListener('scroll', onScroll, { passive:true });
  addEventListener('resize', onScroll, { passive:true });
  addEventListener('load', onScroll);
  if(near()) start();

  // страховка: если события прокрутки здесь не приходят, грузим сами —
  // к этому моменту первый экран уже отрисован
  setTimeout(start, 4000);
})();

/* ============ Колода направлений на телефоне ============
   Прилипание карточек делает CSS — браузер держит их сам, без скрипта.
   Здесь только глубина: чем сильнее следующая карточка накрыла текущую,
   тем сильнее та уменьшается и уходит в тень, и стопка читается как
   колода, а не как случайно наехавшие прямоугольники.
   На планшете и десктопе не работает, при «уменьшить движение» — тоже:
   там карточки просто ложатся стопкой, это уже вёрстка, а не анимация. */
(function(){
  const wrap = document.querySelector('.dirs');
  if(!wrap) return;
  const cards = [...wrap.querySelectorAll('.dir')];
  if(cards.length < 2) return;

  const narrow = matchMedia('(max-width:680px)');
  const calm   = matchMedia('(prefers-reduced-motion: reduce)');
  const STEP = 0.05;                 // сколько масштаба теряет накрытая карточка
  const DIM  = 0.22;                 // насколько она уходит в тень
  let queued = false;

  function peek(){
    return parseFloat(getComputedStyle(wrap).getPropertyValue('--peek')) || 0;
  }

  function draw(){
    queued = false;
    const p = peek();
    for(let i = 0; i < cards.length - 1; i++){
      const me = cards[i].getBoundingClientRect();
      const next = cards[i + 1].getBoundingClientRect();
      // какая доля карточки уже закрыта следующей: 0 → 1
      // делим на высоту без корешка — когда следующая прилипла, доля ровно 1
      const span = Math.max(me.height - p, 1);
      const k = Math.min(Math.max(me.bottom - next.top, 0) / span, 1);
      cards[i].style.setProperty('--s', (1 - k * STEP).toFixed(4));
      cards[i].style.setProperty('--b', (1 - k * DIM).toFixed(4));
    }
  }

  function onScroll(){
    if(queued) return;
    queued = true;
    requestAnimationFrame(draw);
  }

  function sync(){
    cards.forEach(c => { c.style.removeProperty('--s'); c.style.removeProperty('--b'); });
    if(narrow.matches && !calm.matches){
      addEventListener('scroll', onScroll, { passive:true });
      onScroll();
    } else {
      removeEventListener('scroll', onScroll);
    }
  }

  addEventListener('resize', sync, { passive:true });
  narrow.addEventListener('change', sync);
  sync();
})();

/* ============ Карточки направлений: «наведение» пальцем ============
   Там, где мыши нет, роль наведения играет прокрутка: карточка
   раскрашивается, когда её центр подходит к середине экрана. */
(function(){
  const dirs = [...document.querySelectorAll('.dir')];
  if(!dirs.length) return;
  if (matchMedia('(hover: hover)').matches) return;      // с мышью работает :hover
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const BAND = 0.34;                                     // полоса вокруг середины экрана
  let last = 0;

  function check(){
    const h = innerHeight || document.documentElement.clientHeight;
    const mid = h / 2, reach = h * BAND;
    dirs.forEach(el => {
      const r = el.getBoundingClientRect();
      const c = r.top + r.height / 2;
      // карточка «живая», если её центр рядом с серединой экрана
      // либо она настолько велика, что середина экрана попадает внутрь неё
      const on = Math.abs(c - mid) < reach || (r.top < mid && r.bottom > mid);
      el.classList.toggle('is-live', on);
    });
  }

  function onScroll(){
    const now = Date.now();
    if(now - last < 90) return;
    last = now; check();
  }

  addEventListener('scroll', onScroll, { passive:true });
  addEventListener('resize', onScroll, { passive:true });
  addEventListener('load', check);
  check();
})();

/* ================= Карусель зон зала (coverflow) =================
   Слайд = кадр, подпись = зона. У зоны может быть несколько кадров —
   идут подряд, подпись не меняется, в навигации зона показана группой. */
(function(){
  const rack = document.getElementById('cfRack');
  if(!rack) return;

  const ALL_ZONES = [
    { id:'waiting', title:'Зона ожидания',
      desc:'Родители могут дождаться ребёнка внутри, не\u00a0на\u00a0улице',
      shots:['zone-waiting-1'] },
    { id:'boxing', title:'Зоны бокса №\u00a01\u00a0и\u00a0№\u00a02',
      desc:'Ринг, мешки и\u00a0груши, места для\u00a0работы на\u00a0лапах, зеркала',
      shots:['zone-boxing-1','zone-boxing-2'] },
    { id:'crossfit', title:'Зона кроссфита',
      desc:'Штанги, гири, рамы, зона для\u00a0функциональной работы',
      shots:['zone-crossfit-1','zone-crossfit-2','zone-crossfit-3'] },
    { id:'wrestling', title:'Зал борьбы и\u00a0зоны борьбы №\u00a01\u00a0и\u00a0№\u00a02',
      desc:'Борцовские ковры, три отдельных пространства\u00a0— группы не\u00a0делят один ковёр',
      shots:['zone-wrestling-1','zone-wrestling-2'] },
    { id:'studio', title:'Студия',
      desc:'Отдельный зал для\u00a0танцев, акробатики и\u00a0групп с\u00a0малышами',
      shots:['zone-studio-1'] },
    { id:'locker', title:'Раздевалки и\u00a0душевые кабины',
      desc:'Отдельно для\u00a0мужчин и\u00a0женщин, душевые с\u00a0горячей водой',
      shots:['zone-locker-1'] }
  ];

  /* На главной показываем все зоны. На странице секции — только те, что
     перечислены в data-zones, и в том порядке, в каком они там записаны:
     сначала зал, где человек будет заниматься, потом общие. */
  const host = document.getElementById('cfZones');
  const want = host && host.dataset.zones
    ? host.dataset.zones.split(',').map(x => x.trim()).filter(Boolean)
    : null;
  const ZONES = want
    ? want.map(id => ALL_ZONES.find(z => z.id === id)).filter(Boolean)
    : ALL_ZONES;
  if(!ZONES.length) return;

  // Разворачиваем зоны в плоский список кадров, помня, к какой зоне кадр относится
  const SHOTS = [];
  ZONES.forEach((z, zi) => z.shots.forEach(file => SHOTS.push({ file, zi })));
  const N = SHOTS.length;

  const stage = document.getElementById('cfStage');
  const capEl = document.getElementById('cfCap');
  const titleEl = document.getElementById('cfTitle');
  const descEl = document.getElementById('cfDesc');
  const navEl = document.getElementById('cfNav');

  // --- карточки ---
  const cards = SHOTS.map((s, i) => {
    const el = document.createElement('div');
    el.className = 'cf__card';
    const img = document.createElement('img');
    img.src = 'media/zones/' + s.file + '.jpg';
    img.width = 1080; img.height = 1080;
    img.alt = ZONES[s.zi].title;
    img.loading = i < 3 ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.draggable = false;
    el.appendChild(img);
    el.addEventListener('click', () => { if(!moved) go(i); });
    rack.appendChild(el);
    return el;
  });

  // --- навигация: группа засечек на каждую зону ---
  const ticks = [];
  ZONES.forEach((z, zi) => {
    const grp = document.createElement('div');
    grp.className = 'cf__grp';
    z.shots.forEach((_, si) => {
      const idx = SHOTS.findIndex(s => s.zi === zi) + si;
      const b = document.createElement('button');
      b.className = 'cf__tick';
      b.type = 'button';
      b.title = z.title;
      b.setAttribute('aria-label', z.title + (z.shots.length > 1 ? ', кадр ' + (si+1) : ''));
      b.addEventListener('click', () => go(idx));
      grp.appendChild(b);
      ticks[idx] = b;
    });
    navEl.appendChild(grp);
  });

  // --- геометрия ---
  // Числа сняты с эталона: шаг 1.05 ширины, поворот 44° на соседе с
  // насыщением к 82°, отъезд по Z по той же кривой. Знак поворота
  // отрицательный — внешний край карточки идёт НА зрителя.
  const STEP = 1.05, ROT = 44, ROT_MAX = 82, DEPTH = 0.6, CURVE = 0.56, FADE = 0.085;

  let size = 0, pos = 0, shownZone = -1, wantZone = -1, swapTimer = 0;

  function measure(){ size = cards[0].offsetWidth || 240; }

  function layout(){
    for(let i = 0; i < N; i++){
      let off = i - pos;
      off -= Math.round(off / N) * N;              // ближайшая копия по кругу
      const a = Math.abs(off), k = Math.pow(a, CURVE);
      const dx = STEP * size * off;
      const dz = -DEPTH * size * k;
      const ry = -Math.sign(off) * Math.min(ROT * k, ROT_MAX);
      const c = cards[i];
      c.style.transform = 'translateX(calc(-50% + ' + dx.toFixed(1) + 'px)) translateZ(' +
                          dz.toFixed(1) + 'px) rotateY(' + ry.toFixed(2) + 'deg)';
      c.style.opacity = Math.max(0, 1 - FADE * a).toFixed(3);
      c.style.zIndex = String(100 - Math.round(a));
      c.classList.toggle('is-active', a < 0.5);
    }
  }

  function applyZone(zi){
    titleEl.textContent = ZONES[zi].title;
    descEl.textContent = ZONES[zi].desc;
    shownZone = zi;
  }

  function paintCaption(){
    const i = ((Math.round(pos) % N) + N) % N;
    ticks.forEach((t, ti) => t.classList.toggle('is-on', ti === i));
    const zi = SHOTS[i].zi;
    if(zi === wantZone) return;                    // внутри одной зоны подпись не мигает
    wantZone = zi;
    if(shownZone === -1){ applyZone(zi); return; } // первая отрисовка — без затухания
    // одна отложенная подмена на все клики подряд, иначе подпись дёргается
    capEl.classList.add('is-swap');
    clearTimeout(swapTimer);
    swapTimer = setTimeout(() => {
      applyZone(wantZone);
      capEl.classList.remove('is-swap');
    }, 180);
  }

  function render(){ layout(); paintCaption(); }
  function go(i){ pos = i; render(); }
  function step(d){ pos = ((Math.round(pos) + d) % N + N) % N; render(); }

  // --- перетаскивание ---
  let dragging = false, moved = false, startX = 0, startPos = 0, pid = null;

  rack.addEventListener('pointerdown', e => {
    if(e.button != null && e.button !== 0) return;
    dragging = true; moved = false;
    startX = e.clientX; startPos = pos; pid = e.pointerId;
    rack.classList.add('is-drag');
    try{ rack.setPointerCapture(pid); }catch(_){}
  });

  rack.addEventListener('pointermove', e => {
    if(!dragging) return;
    const dx = e.clientX - startX;
    if(Math.abs(dx) > 4) moved = true;
    pos = startPos - dx / (STEP * size);
    render();
  });

  function endDrag(){
    if(!dragging) return;
    dragging = false;
    rack.classList.remove('is-drag');
    try{ rack.releasePointerCapture(pid); }catch(_){}
    pos = ((Math.round(pos) % N) + N) % N;
    render();
    // click по карточке приходит после pointerup — гасим его только если тянули
    setTimeout(() => { moved = false; }, 0);
  }
  rack.addEventListener('pointerup', endDrag);
  rack.addEventListener('pointercancel', endDrag);
  rack.addEventListener('lostpointercapture', endDrag);
  rack.addEventListener('dragstart', e => e.preventDefault());

  // --- стрелки и клавиатура ---
  const prev = stage.querySelector('.cf__arrow--prev');
  const next = stage.querySelector('.cf__arrow--next');
  if(prev) prev.addEventListener('click', () => step(-1));
  if(next) next.addEventListener('click', () => step(1));
  rack.addEventListener('keydown', e => {
    if(e.key === 'ArrowLeft'){ e.preventDefault(); step(-1); }
    if(e.key === 'ArrowRight'){ e.preventDefault(); step(1); }
  });

  addEventListener('resize', () => { measure(); layout(); }, { passive:true });
  addEventListener('load', () => { measure(); layout(); });

  measure();
  render();
})();

/* Подсветка-прожектор за курсором на карточках */
(function(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover: hover)').matches) return;
  document.addEventListener('pointermove', (e)=>{
    const card = e.target.closest('.card');
    if(!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
  }, { passive:true });
})();

/* ============ Страница тренера: вход на страницу ============
   Сценарий по порядку: приближается кадр → имя собирается из случайных
   символов → появляются плашки направления → регалии. Каждый шаг
   объясняет следующий, поэтому анимация здесь не украшение, а порядок
   чтения: сначала «кто», потом «что ведёт», потом «чего добился». */
(function(){
  const photo = document.querySelector('.chero__photo');
  const nameEl = document.querySelector('.chero__name');
  if(!photo && !nameEl) return;

  const steps = [...document.querySelectorAll('.an')];
  // ?nofx=1 показывает страницу без анимации входа — удобно для вёрстки
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    || /[?&]nofx\b/.test(location.search);
  const finalName = nameEl ? nameEl.textContent.replace(/\s+/g, ' ').trim() : '';
  const nameLines = nameEl ? nameEl.innerHTML.split(/<br\s*\/?>/i).map(t=>t.trim()) : [];
  if(nameEl) nameEl.setAttribute('aria-label', finalName);

  // без анимации показываем всё сразу — контент важнее эффекта
  if(still){
    if(photo) photo.classList.add('in');
    steps.forEach(el=>el.classList.add('in'));
    return;
  }

  document.documentElement.classList.add('js-coach');

  /* Text Scramble: каждая позиция крутит случайные символы и в свой
     момент фиксирует нужную букву. Длина строки постоянна с первого
     кадра, поэтому заголовок не дёргается по ширине. */
  const NOISE = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ0123456789#%&$@';
  function scramble(el, lines, duration){
    const plan = lines.map(line => [...line].map(ch => ch === ' '
      ? { ch, end: 0 }
      : { ch, end: Math.min(1, 0.18 + Math.random() * 0.72) }));
    const started = performance.now();
    (function frame(now){
      const p = Math.min(1, (now - started) / duration);
      el.innerHTML = plan.map(line => line.map(o =>
        o.ch === ' ' ? ' ' :
        p >= o.end ? o.ch : NOISE[(Math.random() * NOISE.length) | 0]
      ).join('')).join('<br>');
      if(p < 1) requestAnimationFrame(frame);
      else el.innerHTML = lines.join('<br>');
    })(started);
  }

  // до старта имя не должно мигать готовым текстом
  if(nameEl) nameEl.innerHTML = nameLines.map(l => ' '.repeat(l.length)).join('<br>');

  const at = (ms, fn) => setTimeout(fn, ms);

  at(40,  ()=>{ if(photo) photo.classList.add('in'); });
  at(240, ()=>{ if(nameEl) scramble(nameEl, nameLines, 500); });   // ровно 0,5 с
  steps.forEach((el, i) => at(500 + i * 110, ()=> el.classList.add('in')));

  // страховка: если кадры не запрашиваются, показать всё через 3 с
  setTimeout(()=>{
    if(nameEl && nameEl.textContent.replace(/\s+/g,' ').trim() !== finalName) nameEl.innerHTML = nameLines.join('<br>');
    if(photo) photo.classList.add('in');
    steps.forEach(el=>el.classList.add('in'));
  }, 3000);
})();

