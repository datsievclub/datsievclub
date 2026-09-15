/* DATSIEV CLUB — расписание.
   Данные и правила фильтрации перенесены из утверждённого каркаса
   (datsiev-club-prototype) без изменений: одна запись = одна ГРУППА
   со своим временем по дням, записываются именно на группу. */
(function(){
const DAYS  = ['','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
const DSH   = ['','Пн','Вт','Ср','Чт','Пт','Сб'];
const TRACKS = { 'пн/ср/пт':[1,3,5], 'вт/чт/сб':[2,4,6] };
const DIR_ORDER = ['Дзюдо','ММА','Грэпплинг / БЖЖ','Вольная борьба','Кикбоксинг','Тайский бокс','Бокс',
                   'Рукопашный бой','Национальные танцы','Свадебная лезгинка','Акробатика',
                   'Художественная гимнастика',
                   'ОФП / воркаут','Кроссфит','Функциональная подготовка'];

/* Страницы тренеров. Имя в расписании ведёт на карточку: к конкретному
   наставнику идут не реже, чем на конкретное время, и до этого путь был
   только через общий список тренеров.
   Ключ — ровно та строка, что стоит в поле c, поэтому пары вроде
   «Далгатов Расул · Штырков Илья» разбираются по разделителю. */
const COACH_PAGE = {
 'Алиева Каролина':'trener-alieva.html',
 'Далгатов Расул':'trener-dalgatov.html',
 'Дациев Даци':'trener-datsiev.html',
 'Дубинин Владислав':'trener-dubinin.html',
 'Желбунов Алексей':'trener-jelbunov.html',
 'Желтова Евгения':'trener-jeltova.html',
 'Зайнулабидов Нухбек':'trener-zainulabidov.html',
 'Ибрагимова Динара':'trener-ibragimova.html',
 'Калинина Анастасия':'trener-kalinina.html',
 'Карачаушев Георгий':'trener-karachaushev.html',
 'Карибов Джавид':'trener-karibov.html',
 'Карибов Джейхун':'trener-karibov-djeihun.html',
 'Махметов Саид':'trener-mahmetov-said.html',
 'Махметов Сулейман':'trener-mahmetov.html',
 'Мурачаев Ихсан':'trener-murachaev.html',
 'Насыров Рамис':'trener-nasirov.html',
 'Пчелинцев Тимур':'trener-pchelintsev.html',
 'Сазонова Виктория':'trener-sazonova.html',
 'Солдатов Данила':'trener-soldatov.html',
 'Султанмагомедов Магомедгаджи':'trener-sultanmagomedov.html',
 'Штырков Илья':'trener-shtirkov.html',
 'Щербаков Кирилл':'trener-scherbakov.html'
};
function coachLink(name){
  return String(name).split(' · ').map(n => {
    const href = COACH_PAGE[n];
    return href ? '<a class="scoach" href="'+href+'">'+esc(n)+'</a>' : esc(n);
  }).join(' · ');
}

const t3 = (a,b,c,t) => ({[a]:t,[b]:t,[c]:t});
const SCHED = [
 {d:'Дзюдо', c:'Мурачаев Ихсан', g:'Детская',   a:'4+',  min:4, max:99, z:'Зона борьбы № 1', s:t3(2,4,6,'17:00–18:30')},
 {d:'Дзюдо', c:'Мурачаев Ихсан', g:'Смешанная', a:'15+', min:15,max:99, z:'Зона борьбы № 1', s:t3(2,4,6,'20:00–21:30')},

 {d:'ММА', c:'Дациев Даци', g:'Детская',  a:'3+',  min:3, max:99, z:'Зона борьбы № 1', s:t3(1,3,5,'16:00–17:00')},
 {d:'ММА', c:'Дациев Даци', g:'Детская',  a:'8+',  min:8, max:99, z:'Зона борьбы № 1', s:t3(1,3,5,'17:00–18:30')},
 {d:'ММА', c:'Дациев Даци', g:'Взрослая', a:'14+', min:14,max:99, z:'Зона борьбы № 2', s:t3(1,3,5,'18:30–20:00')},
 {d:'ММА', c:'Дациев Даци', g:'Взрослая', a:'16+', min:16,max:99, z:'Зона борьбы № 2', s:t3(1,3,5,'20:00–21:30')},
 {d:'ММА', c:'Карибов Джейхун', g:'Детская',   a:'4+',    min:4, max:99, z:'Зона борьбы № 2', s:t3(1,3,5,'10:00–11:30')},
 {d:'ММА', c:'Карибов Джейхун', g:'Взрослая',  a:'16+',   min:16,max:99, z:'Зона борьбы № 2', s:t3(2,4,6,'9:00–10:30')},
 {d:'ММА', c:'Карибов Джейхун', g:'Детская',   a:'6–14+', min:6, max:99, z:'Зона борьбы № 2', s:t3(2,4,6,'17:00–18:30')},
 {d:'ММА', c:'Карибов Джейхун', g:'Смешанная', a:'6–14+', min:6, max:99, z:'Зал борьбы',      s:t3(2,4,6,'18:30–20:00')},
 {d:'ММА', c:'Зайнулабидов Нухбек', g:'Взрослая', a:'16+', min:16,max:99, z:'Зал борьбы',     s:t3(2,4,6,'20:00–21:30')},

 {d:'Грэпплинг / БЖЖ', c:'Карибов Джавид',    g:'Детская',   a:'5–12', min:5, max:12, z:'Зал борьбы', s:t3(2,4,6,'17:00–18:30')},
 {d:'Грэпплинг / БЖЖ', c:'Карибов Джавид',    g:'Смешанная', a:'14+',  min:14,max:99, z:'Зал борьбы', s:t3(2,4,6,'18:30–20:00')},
 {d:'Грэпплинг / БЖЖ', c:'Дубинин Владислав', g:'Детская',   a:'4–14', min:4, max:14, z:'Зал борьбы', s:t3(1,3,5,'17:00–18:30')},
 {d:'Грэпплинг / БЖЖ', c:'Дубинин Владислав', g:'Взрослая',  a:'15+',  min:15,max:99, z:'Зал борьбы', s:t3(1,3,5,'20:00–21:30')},

 {d:'Вольная борьба', c:'Султанмагомедов Магомедгаджи', g:'Взрослая', a:'14+', min:14,max:99, z:'Зал борьбы',      s:t3(1,3,5,'18:30–20:00')},
 {d:'Вольная борьба', c:'Султанмагомедов Магомедгаджи', g:'Детская',  a:'6+',  min:6, max:99, z:'Зона борьбы № 2', s:t3(2,4,6,'18:30–20:00')},
 {d:'Вольная борьба', c:'Султанмагомедов Магомедгаджи', g:'Взрослая', a:'16+', min:16,max:99, z:'Зона борьбы № 2', s:t3(2,4,6,'20:00–21:30')},

 {d:'Кикбоксинг', c:'Далгатов Расул · Штырков Илья', g:'Детская',   a:'5+',  min:5, max:99, z:'Зона бокса № 2', s:t3(1,3,5,'16:30–18:00')},
 {d:'Кикбоксинг', c:'Далгатов Расул · Штырков Илья', g:'Смешанная', a:'14+', min:14,max:99, z:'Зона бокса № 2', s:t3(1,3,5,'18:00–19:30')},
 {d:'Кикбоксинг', c:'Насыров Рамис', g:'Взрослая',  a:'14+', min:14,max:99, z:'Зал борьбы',     s:t3(1,3,5,'20:00–21:30')},
 {d:'Кикбоксинг', c:'Насыров Рамис', g:'Детская',   a:'7+',  min:7, max:99, z:'Зона бокса № 2', s:t3(2,4,6,'17:00–18:30')},
 {d:'Кикбоксинг', c:'Насыров Рамис', g:'Смешанная', a:'12+', min:12,max:99, z:'Зона бокса № 2', s:t3(2,4,6,'18:30–20:00')},

 {d:'Тайский бокс', c:'Насыров Рамис', g:'Взрослая', a:'16+', min:16,max:99, z:'Зона бокса № 2', s:t3(2,4,6,'20:00–21:30')},

 {d:'Бокс', c:'Махметов Саид · Махметов Сулейман', g:'Взрослая', a:'14+', min:14,max:99, z:'Зона бокса № 1', s:t3(1,3,5,'9:00–10:30')},
 {d:'Бокс', c:'Махметов Саид · Махметов Сулейман', g:'Детская',  a:'5+',  min:5, max:99, z:'Зона бокса № 1', s:t3(2,4,6,'16:00–17:00')},
 {d:'Бокс', c:'Махметов Саид · Махметов Сулейман', g:'Детская',  a:'8+',  min:8, max:99, z:'Зона бокса № 1', s:t3(2,4,6,'17:00–18:30')},
 {d:'Бокс', c:'Махметов Саид · Махметов Сулейман', g:'Взрослая', a:'14+', min:14,max:99, z:'Зона бокса № 1', s:t3(2,4,6,'18:30–20:00')},
 {d:'Бокс', c:'Махметов Саид · Махметов Сулейман', g:'Взрослая', a:'16+', min:16,max:99, z:'Зона бокса № 1', s:t3(2,4,6,'20:00–21:30')},
 {d:'Бокс', c:'Желбунов Алексей', g:'Детская',   a:'4+',  min:4, max:99, z:'Студия', s:t3(1,3,5,'16:00–17:00')},
 {d:'Бокс', c:'Желбунов Алексей', g:'Смешанная', a:'8+',  min:8, max:99, z:'Студия', s:t3(1,3,5,'17:00–18:00')},
 {d:'Бокс', c:'Желбунов Алексей', g:'Взрослая',  a:'16+', min:16,max:99, z:'Студия', s:t3(1,3,5,'20:00–21:30')},

 {d:'Рукопашный бой', c:'Щербаков Кирилл', g:'Взрослая', a:'14+', min:14,max:99, z:'Зона бокса № 2', s:t3(1,3,5,'20:00–21:30')},

 {d:'Национальные танцы', c:'Алиева Каролина',   g:'Детская',    a:'4–14', min:4, max:14, z:'Студия', s:{2:'16:00–17:00',4:'16:00–17:00',6:'16:00–17:15'}},
 {d:'Национальные танцы', c:'Ибрагимова Динара', g:'Продвинутая',a:'14+',  min:14,max:99, z:'Студия', s:{2:'17:00–18:15'}},
 {d:'Национальные танцы', c:'Ибрагимова Динара', g:'Начальная',  a:'14+',  min:14,max:99, z:'Студия', s:{2:'18:15–19:30',3:'18:00–19:00',4:'18:15–19:30'}},
 {d:'Свадебная лезгинка', c:'Ибрагимова Динара', g:'Взрослая',   a:'14+',  min:14,max:99, z:'Студия', s:{4:'17:00–18:15',6:'17:15–18:30'}},

 {d:'Акробатика',  c:'Сазонова Виктория', g:'Детская',   a:'5+',  min:5, max:99, z:'Зона борьбы № 1', s:t3(1,3,5,'17:00–18:00')},
 {d:'Акробатика',  c:'Солдатов Данила',   g:'Детская',   a:'7+',  min:7, max:99, z:'Зона борьбы № 1', s:{1:'16:00–17:00',5:'16:00–17:00'}},
 {d:'Художественная гимнастика', c:'Калинина Анастасия', g:'Детская', a:'3+', min:3, max:99, z:'Студия', s:t3(2,4,6,'19:30–21:00')},
 {d:'ОФП / воркаут', c:'Пчелинцев Тимур', g:'Смешанная', a:'5+',  min:5, max:99, z:'Зона кроссфита',  s:t3(1,3,5,'16:00–17:00')},
 {d:'ОФП / воркаут', c:'Пчелинцев Тимур', g:'Смешанная', a:'5+',  min:5, max:99, z:'Зона кроссфита',  s:t3(1,3,5,'17:00–18:00')},
 {d:'Кроссфит', c:'Карачаушев Георгий', g:'Взрослая', a:'16+', min:16,max:99, z:'Зона кроссфита', s:{2:'18:00–19:00',4:'18:00–19:00'}},
 {d:'Кроссфит', c:'Карачаушев Георгий', g:'Взрослая', a:'16+', min:16,max:99, z:'Зона кроссфита', s:{2:'19:00–20:00',4:'19:00–20:00'}},
 {d:'Функциональная подготовка', c:'Желтова Евгения', g:'Женская', a:'16+', min:16,max:99, z:'Зона кроссфита', s:t3(1,3,5,'18:00–19:00')},

 /* лист «Набор в дневные секции» — на сайте показываются как утренние */
 {d:'ММА',  c:'Карибов Джейхун', g:'Детская',  a:'3+',  min:3, max:99, z:'Зона борьбы № 1', s:t3(1,3,5,'10:00–11:30'), day:true},
 {d:'Бокс', c:'Махметов Саид',   g:'Детская',  a:'5+',  min:5, max:99, z:'Зона бокса',      s:t3(2,4,6,'8:00–9:30'),  day:true},
 {d:'Бокс', c:'Махметов Саид',   g:'Взрослая', a:'14+', min:14,max:99, z:'Зона бокса',      s:t3(2,4,6,'9:30–11:00'), day:true}
];

/* Возрастные потолки: в файле у детских групп только нижний порог («5+»), из-за чего
   в «Акробатика, детская 5+» формально проходил и тридцатилетний. Детские — до 13,
   где в возрасте есть 14 («6–14+») — до 17. ВОПРОС К КЛУБУ: подтвердить границы. */
SCHED.forEach(r=>{
  if(r.max===99 && (r.g==='Детская' || r.g==='Смешанная') && r.a.includes('14')) r.max = 17;
  else if(r.max===99 && r.g==='Детская') r.max = 13;
});


/* ---------------- производные ---------------- */
const gDays  = r => Object.keys(r.s).map(Number).sort((a,b)=>a-b);
const gTimes = r => { const u=[...new Set(Object.values(r.s))]; return u.length===1 ? u[0] : u.join(' / '); };
const hh     = t => { const [h,m]=t.split('–')[0].split(':').map(Number); return h+m/60; };
const gStart = r => Math.min(...Object.values(r.s).map(hh));
/* «4+» → «с 4 лет», «6–14+» → «6–14 лет» — так же, как на страницах тренеров */
const gAge = r => {
  const m = String(r.a).match(/^(\d+)(?:–(\d+))?\+?$/);
  if(!m) return r.a;
  return m[2] ? m[1]+'–'+m[2]+' лет' : 'с '+m[1]+' лет';
};
const gGroup = r => r.g + ' группа · ' + gAge(r);
/* дни полными словами: в строке — отдельными капсулами, в заявке — через запятую */
const gDaysPills = r => '<div class="days">' + gDays(r).map(n=>'<span class="day">'+DAYS[n]+'</span>').join('') + '</div>';
const gDaysText  = r => gDays(r).map((n,i)=> i ? DAYS[n].toLowerCase() : DAYS[n]).join(', ');
const isMain = r => !r.day;

/* ---------------- фильтры ---------------- */
let F = { age:null, dir:null, track:null, time:null };
let view = 'list';
/* таблица только на десктопе: на телефоне и планшете её пришлось бы листать
   вбок. Там всегда список, даже если на широком экране успели переключиться,
   а потом окно сузилось. Порог тот же, что в CSS у .resbar__view */
const narrow = matchMedia('(max-width:1000px)');
let ageSet = false;                       /* ползунок «выключен», пока его не тронули */
const filtering = () => F.age!=null || !!F.dir || !!F.track || !!F.time;

function matches(r){
  if(F.age!=null && !(r.min<=F.age && F.age<=r.max)) return false;
  if(F.dir && r.d!==F.dir) return false;
  if(F.track && !gDays(r).some(d=>TRACKS[F.track].includes(d))) return false;
  const h=gStart(r);
  if(F.time==='Утро'  && !(h<12)) return false;
  if(F.time==='День'  && !(h>=12 && h<17)) return false;
  if(F.time==='Вечер' && !(h>=17)) return false;
  return true;
}

/* Сегменты нужны только для подписи: фильтруем по точному возрасту.
   Диапазон в роли фильтра врал бы — в 3 года доступна одна группа,
   а «3–6 лет» показало бы полтора десятка. */
const AGE_SEGMENTS = [
  {from:3,  to:6,  name:'дошкольник'},
  {from:7,  to:13, name:'школьник'},
  {from:14, to:17, name:'подросток'},
  {from:18, to:60, name:'взрослый'}
];
const segmentOf = a => (AGE_SEGMENTS.find(s=>a>=s.from && a<=s.to)||{}).name || '';

function years(n){
  const d10=n%10, d100=n%100;
  if(d10===1 && d100!==11) return n+'\u00a0год';
  if(d10>=2 && d10<=4 && (d100<10 || d100>=20)) return n+'\u00a0года';
  return n+'\u00a0лет';
}

const $ = id => document.getElementById(id);

function applyAge(v){
  ageSet = v!==null;
  F.age = v;
  $('fAge').value = v===null ? '' : v;
  $('fAgeRange').value = v===null ? 3 : v;
  render();
}

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }

function chip(key,val,label){
  return '<button class="chip'+(F[key]===val?' chip--on':'')+'" type="button"'
       + ' data-k="'+esc(key)+'" data-v="'+esc(val)+'">'+esc(label)+'</button>';
}

/* Кнопка записи в строке расписания. Контекст группы уезжает в data-атрибутах,
   форму по ним собирает site.js — человек видит в ней ровно ту группу,
   на которую нажал, и ничего не заполняет заново. */
function bookBtn(r){
  return '<button class="btn btn--ghost btn--sm" type="button" data-book="строка расписания"'
    + ' data-dir="'   + esc(r.d) + '"'
    + ' data-group="' + esc(gGroup(r).replace(/\u00a0/g,' ')) + '"'
    + ' data-time="'  + esc(gDaysText(r)) + ' · ' + esc(gTimes(r)) + '"'
    + ' data-coach="' + esc(r.c) + '"'
    + '>Записаться</button>';
}

/* ---------------- вид «списком» ---------------- */
function listHTML(rows){
  const byDir={};
  rows.forEach(r=>{ (byDir[r.d]=byDir[r.d]||[]).push(r); });
  return DIR_ORDER.filter(d=>byDir[d]).map(d=>{
    const byCoach={};
    byDir[d].forEach(r=>{ (byCoach[r.c]=byCoach[r.c]||[]).push(r); });
    return '<div class="sgroup">'
      + '<h3 class="sgroup__hd">'+esc(d)+'</h3>'
      + Object.keys(byCoach).map(c =>
          '<p class="sgroup__coach"><span class="sgroup__lbl">'+(c.includes(' · ')?'Тренеры:':'Тренер:')+'</span> '+coachLink(c)+'</p>'
        + byCoach[c].map(r =>
            '<div class="slot">'
          + '<div class="slot__main"><h3>'+esc(gGroup(r))+'</h3>'
          +   gDaysPills(r)+'</div>'
          + '<span class="slot__time">'+esc(gTimes(r))+'</span>'
          + bookBtn(r)
          + '</div>').join('')
        ).join('')
      + '</div>';
  }).join('');
}

/* ---------------- вид «таблицей» — повторяет лист Excel клуба ---------------- */
function tableHTML(){
  const rows = SCHED.filter(isMain).slice().sort((a,b)=>{
    const da=DIR_ORDER.indexOf(a.d), db=DIR_ORDER.indexOf(b.d);
    return da!==db ? da-db : a.c.localeCompare(b.c,'ru');
  });
  const dirSpan={}, coachSpan={};
  rows.forEach(r=>{ dirSpan[r.d]=(dirSpan[r.d]||0)+1; const k=r.d+'|'+r.c; coachSpan[k]=(coachSpan[k]||0)+1; });
  const dirSeen={}, coachSeen={};
  const activeDays = F.track ? TRACKS[F.track] : null;
  /* объединённая ячейка накрывает несколько строк: гасим её, только если
     НИ ОДНА строка внутри не подошла, иначе секция серела при живых группах */
  const dirHit={}, coachHit={};
  rows.forEach(r=>{ if(!filtering() || matches(r)){ dirHit[r.d]=1; coachHit[r.d+'|'+r.c]=1; } });

  let h = '<div class="tscroll"><table class="xls"><thead><tr>'
    + '<th>Секция</th><th>Тренер</th><th>Группа</th>'
    + [1,2,3,4,5,6].map(n=>'<th class="'+(activeDays&&activeDays.includes(n)?'col-on':'')+'">'+DSH[n]+'</th>').join('')
    + '<th>Возраст</th><th></th></tr></thead><tbody>';

  rows.forEach(r=>{
    const hit = !filtering() || matches(r);
    h += '<tr class="'+(hit?'':'dim')+'">';
    if(!dirSeen[r.d]){ dirSeen[r.d]=1;
      h += '<td class="xdir'+(dirHit[r.d]?'':' dim')+'" rowspan="'+dirSpan[r.d]+'">'+esc(r.d)+'</td>'; }
    const ck=r.d+'|'+r.c;
    if(!coachSeen[ck]){ coachSeen[ck]=1;
      h += '<td class="xcoach'+(coachHit[ck]?'':' dim')+'" rowspan="'+coachSpan[ck]+'">'+coachLink(r.c)+'</td>'; }
    h += '<td>'+esc(r.g)+'</td>';
    for(let n=1;n<=6;n++){
      const t=r.s[n];
      const on = t && hit && filtering() && (!activeDays || activeDays.includes(n));
      h += '<td class="'+(activeDays&&activeDays.includes(n)?'col-on ':'')+(on?'cell-on':'')+'">'+(t||'')+'</td>';
    }
    h += '<td>'+esc(r.a)+'</td>';
    h += '<td class="xact">'+(hit?bookBtn(r):'')+'</td>';
    h += '</tr>';
  });
  return h+'</tbody></table></div>';
}

/* ---------------- объяснение пустого результата ----------------
   Пустой экран без причины заставляет гадать, поэтому говорим,
   какой именно фильтр отрезал все группы и что подходит вместо. */
function emptyHTML(){
  const main = SCHED.filter(isMain);
  const bits = [];
  if(F.dir && F.age!=null){
    const inDir = main.filter(r=>r.d===F.dir);
    const minAge = Math.min(...inDir.map(r=>r.min));
    const maxAge = Math.max(...inDir.map(r=>r.max));
    if(F.age < minAge) bits.push('В\u00a0направлении «'+F.dir+'» самая младшая группа\u00a0— с\u00a0'+minAge+'\u00a0лет.');
    else if(F.age > maxAge) bits.push('В\u00a0направлении «'+F.dir+'» группы только до\u00a0'+maxAge+'\u00a0лет.');
  }
  let alt='';
  if(F.age!=null){
    const fits=[...new Set(main.filter(r=>r.min<=F.age && F.age<=r.max).map(r=>r.d))];
    if(fits.length) alt = '<p class="sempty__alt"><b>Подходит на\u00a0'+years(F.age)+':</b> '+esc(fits.join(' · '))+'</p>';
  }
  return '<div class="card sempty"><h3>Под\u00a0выбранные условия групп нет</h3>'
    + (bits.length ? '<p>'+esc(bits.join(' '))+'</p>' : '')
    + alt
    + '<button class="btn btn--ghost btn--sm" type="button" id="fReset2">Сбросить фильтры</button></div>';
}

/* ---------------- рендер ---------------- */
function render(){
  if(!ageSet) F.age = null;
  const main = SCHED.filter(isMain);
  const fits = a => main.filter(r=>r.min<=a && a<=r.max).length;

  $('ageVal').textContent  = F.age===null ? 'Любой возраст' : years(F.age)+' · '+segmentOf(F.age);
  $('ageHint').textContent = F.age===null ? 'Показаны все группы клуба' : 'Подходит групп:\u00a0'+fits(F.age);
  /* на шкале только нижние границы: «дошкольник» это 4 года из 58,
     около 7% ширины — название туда физически не влезает */
  $('ageScale').innerHTML = AGE_SEGMENTS.map(sg=>{
    const on = F.age!==null && F.age>=sg.from && F.age<=sg.to;
    return '<i class="'+(on?'on':'')+'" title="'+sg.name+'" style="flex:'+(sg.to-sg.from+1)+'">'
         + sg.from + '<span>'+(sg.to>=60?'+':'–'+sg.to)+'</span></i>';
  }).join('');
  $('fAgeRange').classList.toggle('off', F.age===null);

  const dirs = DIR_ORDER.filter(d=>main.some(r=>r.d===d));
  $('fDir').innerHTML   = dirs.map(d=>chip('dir',d,d)).join('');
  $('fTrack').innerHTML = Object.keys(TRACKS).map(k=>chip('track',k,k)).join('');
  $('fTime').innerHTML  = chip('time','Утро','Утро\u00a0— до\u00a012:00')
                        + chip('time','День','День\u00a0— 12:00–17:00')
                        + chip('time','Вечер','Вечер\u00a0— после\u00a017:00');

  const hit = main.filter(matches);

  const active = [F.age!=null?years(F.age):null, F.dir, F.track, F.time].filter(Boolean);
  /* Свёрнутая шапка подбора должна сама говорить, что уже выбрано —
     иначе отфильтрованный список выглядит как неполное расписание. */
  const sum = $('fSummary');
  sum.textContent = active.length ? active.join(' · ') : 'Удобный фильтр по\u00a0возрасту, дням и\u00a0времени';
  sum.classList.toggle('on', active.length > 0);

  $('schedCount').innerHTML = '<b>Показано\u00a0'+hit.length+'\u00a0из\u00a0'+main.length+'\u00a0групп</b>'
    + (active.length ? ' <span>'+esc(active.join(' · '))+'</span>' : '');

  if(narrow.matches) view = 'list';
  $('vList').classList.toggle('chip--on', view==='list');
  $('vTable').classList.toggle('chip--on', view==='table');

  $('schedOut').innerHTML = view==='table'
    ? (filtering() && !hit.length ? emptyHTML() : '') + tableHTML()
    : (hit.length ? listHTML(hit) : emptyHTML());

  const dayRows = SCHED.filter(r=>r.day && matches(r));
  $('daySched').innerHTML = dayRows.length
    ? listHTML(dayRows)
    : '<p class="sgroup__none">Под\u00a0выбранные фильтры утренних групп нет.</p>';
}

/* ---------------- события ---------------- */
$('fAgeRange').addEventListener('input', e => applyAge(parseInt(e.target.value,10)));
$('fAge').addEventListener('input', e => {
  const v = e.target.value;
  applyAge(v==='' ? null : Math.min(60, Math.max(3, parseInt(v,10)||3)));
});
$('ageAny').addEventListener('click', ()=> applyAge(null));
$('fReset').addEventListener('click', ()=>{ F={age:null,dir:null,track:null,time:null}; applyAge(null); });

narrow.addEventListener('change', () => { if(narrow.matches && view==='table') render(); });

document.addEventListener('click', e => {
  const c = e.target.closest('.chip[data-k]');
  if(c){ const k=c.dataset.k, v=c.dataset.v; F[k] = (F[k]===v ? null : v); render(); return; }
  if(e.target.id==='fReset2'){ F={age:null,dir:null,track:null,time:null}; applyAge(null); return; }
  if(e.target.id==='vList'){  view='list';  render(); return; }
  if(e.target.id==='vTable'){ view='table'; render(); return; }
});

/* ---------------- раскрытие подбора ---------------- */
const fBox = $('fBox'), fBody = $('fBody'), fToggle = $('fToggle');
function setFilters(open){
  fBody.hidden = !open;
  fBox.classList.toggle('fbox--open', open);
  fToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
}
fToggle.addEventListener('click', ()=> setFilters(fBody.hidden));

/* Направление можно передать в адресе — так карточка из каталога
   открывает расписание уже отфильтрованным по этому направлению.
   Подбор в этом случае сразу раскрыт: иначе человек видит короткий
   список и не понимает, почему в нём не все группы клуба. */
(function(){
  const want = new URLSearchParams(location.search).get('dir');
  if(want && DIR_ORDER.includes(want)){ F.dir = want; setFilters(true); }
})();

render();
})();
