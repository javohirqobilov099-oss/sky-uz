// ---------- Data ----------
const CITIES = ["Toshkent","Samarqand","Buxoro","Farg'ona","Andijon","Namangan","Xiva","Nukus","Moskva","Istanbul","Dubay"];
const FLIGHT_TIMES = ["06:20","08:45","11:10","14:30","17:15","20:05","22:40"];
const COUNTRY_CODES = [
  {code:"998", flag:"🇺🇿", label:"O'zbekiston"},
  {code:"7",   flag:"🇷🇺", label:"Rossiya / Qozog'iston"},
  {code:"996", flag:"🇰🇬", label:"Qirg'iziston"},
  {code:"992", flag:"🇹🇯", label:"Tojikiston"},
  {code:"993", flag:"🇹🇲", label:"Turkmaniston"},
  {code:"90",  flag:"🇹🇷", label:"Turkiya"},
  {code:"971", flag:"🇦🇪", label:"BAA"},
  {code:"1",   flag:"🇺🇸", label:"AQSH / Kanada"},
  {code:"44",  flag:"🇬🇧", label:"Buyuk Britaniya"},
  {code:"86",  flag:"🇨🇳", label:"Xitoy"}
];

const T = {
  uz: {
    langName:"O'zbekcha", authTitleUp:"Ro'yxatdan o'tish",
    lblName:"Ism", lblPhone:"Telefon", registerBtn:"Ro'yxatdan o'tish",
    logout:"Chiqish",
    h1:"Chipta qidiring", sub:"Shahar va sanani tanlang, mos parvozlarni ko'ring.",
    lblFrom:"Qayerdan", lblTo:"Qayerga", searchBtn:"Qidirish",
    resultsTitle:"Topilgan parvozlar", noResults:"Avval qidiruv qiling.",
    same:"Jo'nash va borish shahri bir xil bo'lishi mumkin emas.",
    buy:"Sotib olish", bookingTitle:"Buyurtmani rasmiylashtirish",
    lblPax:"Yo'lovchi ismi", lblSeat:"Sinf", economy:"Ekonom", business:"Biznes",
    confirm:"Tasdiqlash", cancel:"Bekor qilish",
    needLogin:"Chipta sotib olish uchun avval ro'yxatdan o'ting yoki kiring.",
    ticketTitle:"Chipta tasdiqlandi ✅", myTickets:"Mening chiptalarim", cancelTicket:"Bekor qilish",
    confirmCancel:"Chiptani bekor qilishni tasdiqlaysizmi?",
    date:"Sana", time:"Vaqt", pax:"Yo'lovchi", cls:"Sinf",
    footer:"SkyUz — demo onlayn chipta xizmati",
    fillFields:"Iltimos, ism va telefon kiriting."
  },
  ru: {
    langName:"Русский", authTitleUp:"Регистрация",
    lblName:"Имя", lblPhone:"Телефон", registerBtn:"Зарегистрироваться",
    logout:"Выйти",
    h1:"Поиск билетов", sub:"Выберите города и дату, чтобы увидеть рейсы.",
    lblFrom:"Откуда", lblTo:"Куда", searchBtn:"Искать",
    resultsTitle:"Найденные рейсы", noResults:"Сначала выполните поиск.",
    same:"Города вылета и прилёта не могут совпадать.",
    buy:"Купить", bookingTitle:"Оформление заказа",
    lblPax:"Имя пассажира", lblSeat:"Класс", economy:"Эконом", business:"Бизнес",
    confirm:"Подтвердить", cancel:"Отмена",
    needLogin:"Чтобы купить билет, сначала зарегистрируйтесь или войдите.",
    ticketTitle:"Билет подтверждён ✅", myTickets:"Мои билеты", cancelTicket:"Отменить",
    confirmCancel:"Подтвердите отмену билета?",
    date:"Дата", time:"Время", pax:"Пассажир", cls:"Класс",
    footer:"SkyUz — демо-сервис онлайн-билетов",
    fillFields:"Пожалуйста, введите имя и телефон."
  },
  en: {
    langName:"English", authTitleUp:"Sign up",
    lblName:"Name", lblPhone:"Phone", registerBtn:"Sign up",
    logout:"Log out",
    h1:"Search flights", sub:"Choose cities to see matching flights.",
    lblFrom:"From", lblTo:"To", searchBtn:"Search",
    resultsTitle:"Available flights", noResults:"Search first.",
    same:"Departure and arrival city can't be the same.",
    buy:"Buy ticket", bookingTitle:"Complete booking",
    lblPax:"Passenger name", lblSeat:"Class", economy:"Economy", business:"Business",
    confirm:"Confirm", cancel:"Cancel",
    needLogin:"Please sign up or log in before buying a ticket.",
    ticketTitle:"Ticket confirmed ✅", myTickets:"My tickets", cancelTicket:"Cancel ticket",
    confirmCancel:"Confirm ticket cancellation?",
    date:"Date", time:"Time", pax:"Passenger", cls:"Class",
    footer:"SkyUz — demo online ticket service",
    fillFields:"Please enter name and phone."
  }
};

// ---------- State ----------
let state = { lang: localStorage.getItem('sky_lang') || 'uz', user: null, results: [], selected: null };
let selectedPhoneCode = "998";

function t(k){ return T[state.lang][k] || k; }
function fmtPrice(p){ return p.toLocaleString('ru-RU') + " so'm"; }

// ---------- Theme ----------
function applyTheme(mode){
  document.documentElement.classList.toggle('dark', mode === 'dark');
  localStorage.setItem('sky_theme', mode);
}
(function initTheme(){
  const saved = localStorage.getItem('sky_theme');
  const dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', dark);
})();

// ---------- Storage helpers ----------
function loadUser(){
  try{ const raw = localStorage.getItem('sky_user'); state.user = raw ? JSON.parse(raw) : null; }
  catch(e){ state.user = null; }
}
function loadTickets(){
  try{ return JSON.parse(localStorage.getItem('sky_tickets') || '[]'); } catch(e){ return []; }
}
function saveTickets(list){
  try{ localStorage.setItem('sky_tickets', JSON.stringify(list)); } catch(e){}
}

// ---------- Populate selects ----------
function populateCitySelects(){
  ['fromSel','toSel'].forEach((id,i)=>{
    const sel = document.getElementById(id);
    sel.innerHTML = CITIES.map(c=>`<option value="${c}">${c}</option>`).join('');
    sel.selectedIndex = i===0 ? 0 : 1;
  });
}

function setPhoneCode(code){
  selectedPhoneCode = code;
  const c = COUNTRY_CODES.find(x=>x.code===code);
  document.getElementById('codeToggle').textContent = `${c.flag} +${c.code}`;
}

function populatePhoneCode(){
  const menu = document.getElementById('codeMenu');
  menu.innerHTML = COUNTRY_CODES.map(c=>
    `<button type="button" data-code="${c.code}" class="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm hover:bg-slate-100 dark:hover:bg-slate-700">
      <span>${c.flag}</span><span class="font-medium">+${c.code}</span>
      <span class="text-slate-400 text-xs">${c.label}</span>
    </button>`
  ).join('');
  setPhoneCode("998");
  menu.querySelectorAll('button').forEach(btn=>{
    btn.onclick = (e)=>{ e.stopPropagation(); setPhoneCode(btn.dataset.code); menu.classList.add('hidden'); };
  });
  document.getElementById('codeToggle').onclick = (e)=>{
    e.stopPropagation();
    menu.classList.toggle('hidden');
  };
  document.addEventListener('click', ()=> menu.classList.add('hidden'));
}

function populateLangSelect(){
  const sel = document.getElementById('langSel');
  sel.innerHTML = Object.keys(T).map(code=>`<option value="${code}">${T[code].langName}</option>`).join('');
  sel.value = state.lang;
}

// ---------- Render ----------
function render(){
  populateLangSelect();
  document.getElementById('h1').textContent = t('h1');
  document.getElementById('sub').textContent = t('sub');
  document.getElementById('lblFrom').textContent = t('lblFrom');
  document.getElementById('lblTo').textContent = t('lblTo');
  document.getElementById('searchBtn').textContent = t('searchBtn');
  document.getElementById('resultsTitle').textContent = t('resultsTitle');
  document.getElementById('lblName').textContent = t('lblName');
  document.getElementById('lblPhone').textContent = t('lblPhone');
  document.getElementById('bookingTitle').textContent = t('bookingTitle');
  document.getElementById('lblPax').textContent = t('lblPax');
  document.getElementById('lblSeat').textContent = t('lblSeat');
  document.getElementById('confirmBtn').textContent = t('confirm');
  document.getElementById('cancelBtn').textContent = t('cancel');
  document.getElementById('ticketTitle').textContent = t('ticketTitle');
  document.getElementById('myTicketsTitle').textContent = t('myTickets');
  document.getElementById('footer').textContent = t('footer');
  document.getElementById('authTitle').textContent = t('authTitleUp');
  document.getElementById('regBtn').textContent = t('registerBtn');

  const seatSel = document.getElementById('seatClass');
  seatSel.innerHTML = `<option value="economy">${t('economy')}</option><option value="business">${t('business')}</option>`;

  const authOverlay = document.getElementById('authOverlay');
  const mainArea = document.getElementById('mainArea');
  const authBtn = document.getElementById('authBtn');

  if(state.user){
    authOverlay.classList.add('hidden');
    mainArea.classList.remove('blur-sm','pointer-events-none','select-none');
    authBtn.classList.remove('hidden');
    authBtn.textContent = `${t('logout')} (${state.user.name})`;
    authBtn.onclick = () => { localStorage.removeItem('sky_user'); state.user = null; render(); };
    renderMyTickets();
  } else {
    authOverlay.classList.remove('hidden');
    mainArea.classList.add('blur-sm','pointer-events-none','select-none');
    authBtn.classList.add('hidden');
    document.getElementById('myTicketsCard').classList.add('hidden');
  }
  renderResults();
}

// ---------- Events: language / registration ----------
document.getElementById('langSel').onchange = (e)=>{
  state.lang = e.target.value;
  localStorage.setItem('sky_lang', state.lang);
  render();
};

function updateThemeIcon(){
  const isDark = document.documentElement.classList.contains('dark');
  document.getElementById('themeBtn').textContent = isDark ? '☀️' : '🌙';
}

let themeTransitioning = false;

document.getElementById('themeBtn').onclick = () => {
  if (themeTransitioning) return;
  const isDark = document.documentElement.classList.contains('dark');
  const newMode = isDark ? 'light' : 'dark';
  const doChange = () => { applyTheme(newMode); updateThemeIcon(); };

  if (document.startViewTransition) {
    themeTransitioning = true;
    const transition = document.startViewTransition(doChange);
    transition.finished.finally(() => { themeTransitioning = false; });
  } else {
    doChange();
  }
};

document.getElementById('regBtn').onclick = ()=>{
  const name = document.getElementById('regName').value.trim();
  const num = document.getElementById('regPhone').value.trim();
  const msg = document.getElementById('authMsg');
  if(!name || !num){
    msg.textContent = t('fillFields');
    msg.classList.remove('hidden');
    return;
  }
  const phone = `+${selectedPhoneCode} ${num}`;
  const user = {name, phone};
  localStorage.setItem('sky_user', JSON.stringify(user));
  state.user = user;
  msg.classList.add('hidden');
  render();
};

// ---------- Flights ----------
function genFlights(from, to){
  const list = [];
  for(let i=0;i<5;i++){
    const time = FLIGHT_TIMES[i % FLIGHT_TIMES.length];
    const base = 250000 + i*45000 + (from.length+to.length)*1000;
    list.push({
      no: `HY-${100+i*7}`, from, to, time,
      date: new Date(Date.now()+ (i+1)*86400000).toISOString().slice(0,10),
      price: base
    });
  }
  return list;
}

document.getElementById('searchBtn').onclick = ()=>{
  const from = document.getElementById('fromSel').value;
  const to = document.getElementById('toSel').value;
  const list = document.getElementById('flightList');
  if(from === to){
    list.innerHTML = `<p class="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm">${t('same')}</p>`;
    state.results = [];
    return;
  }
  state.results = genFlights(from, to);
  document.getElementById('bookingCard').classList.add('hidden');
  document.getElementById('ticketCard').classList.add('hidden');
  renderResults();
};

function flightRowHtml(f, actionHtml){
  return `
    <div class="flex items-center justify-between flex-wrap gap-2 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
      <div>
        <div class="font-bold">${f.from} → ${f.to}
          <span class="ml-1 inline-block text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded px-2 py-0.5">${f.no}</span>
        </div>
        <div class="text-sm text-slate-500 dark:text-slate-400">${f.date} · ${f.time}${f.pax ? ' · '+f.pax : ''}</div>
      </div>
      <div class="flex items-center gap-3">
        <div class="font-extrabold text-emerald-600 dark:text-emerald-400">${fmtPrice(f.price)}</div>
        ${actionHtml}
      </div>
    </div>`;
}

function renderResults(){
  const list = document.getElementById('flightList');
  if(!state.results.length){
    list.innerHTML = `<p class="text-slate-500 dark:text-slate-400">${t('noResults')}</p>`;
    return;
  }
  list.innerHTML = state.results.map((f,idx)=>
    flightRowHtml(f, `<button data-idx="${idx}" class="buyBtn bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2 text-sm">${t('buy')}</button>`)
  ).join('');
  document.querySelectorAll('.buyBtn').forEach(btn=>{
    btn.onclick = ()=>{
      if(!state.user){ alert(t('needLogin')); return; }
      state.selected = state.results[parseInt(btn.dataset.idx)];
      document.getElementById('paxName').value = state.user.name;
      document.getElementById('bookingCard').classList.remove('hidden');
      document.getElementById('ticketCard').classList.add('hidden');
      document.getElementById('bookingCard').scrollIntoView({behavior:'smooth'});
    };
  });
}

document.getElementById('cancelBtn').onclick = ()=>{
  document.getElementById('bookingCard').classList.add('hidden');
};

document.getElementById('confirmBtn').onclick = ()=>{
  const pax = document.getElementById('paxName').value.trim() || state.user.name;
  const cls = document.getElementById('seatClass').value;
  const f = state.selected;
  const price = cls === 'business' ? Math.round(f.price*1.8) : f.price;
  const ticket = {...f, pax, cls, price, id: 'T'+Date.now()};
  const tickets = loadTickets();
  tickets.unshift(ticket);
  saveTickets(tickets);
  document.getElementById('bookingCard').classList.add('hidden');
  showTicket(ticket);
  renderMyTickets();
};

function showTicket(ticket){
  const box = document.getElementById('ticketCard');
  box.classList.remove('hidden');
  document.getElementById('ticketBody').innerHTML = flightRowHtml(
    {...ticket, pax: `${t('pax')}: ${ticket.pax} · ${t('cls')}: ${ticket.cls==='business'?t('business'):t('economy')}`}, ''
  );
  box.scrollIntoView({behavior:'smooth'});
}

function renderMyTickets(){
  const card = document.getElementById('myTicketsCard');
  const tickets = loadTickets();
  if(!state.user || !tickets.length){ card.classList.add('hidden'); return; }
  card.classList.remove('hidden');
  document.getElementById('myTicketsList').innerHTML = tickets.map(f=>
    flightRowHtml(f, `<button class="cancelTicketBtn bg-transparent border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700" data-id="${f.id}">${t('cancelTicket')}</button>`)
  ).join('');
  document.querySelectorAll('.cancelTicketBtn').forEach(btn=>{
    btn.onclick = ()=>{
      if(!confirm(t('confirmCancel'))) return;
      saveTickets(loadTickets().filter(x=>x.id !== btn.dataset.id));
      renderMyTickets();
    };
  });
}

// ---------- Init ----------
loadUser();
populateCitySelects();
populatePhoneCode();
render();
updateThemeIcon();