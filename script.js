// Оставь 6, 7 или 8 номеров — столько карточек появится на сайте.
const FLOWERS = [1, 2, 3, 4, 5, 6, 7, 8];
const STORAGE_KEY = 'flowers-for-you:selected';
const SELECTION_PARAM = 'selected';
const palettes = [
  ['#e9e3dd','#d697a0'], ['#e8e9df','#f5f1da'],
  ['#e6e2ec','#b3a1ca'], ['#ece6dc','#e3b982'],
  ['#e5e9e0','#eae6ce'], ['#efe3df','#dca3ad'],
  ['#e8e6db','#e3cf8b'], ['#e4e7e1','#a9bca2'],
];
let selected = new Set();
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (Array.isArray(saved)) selected = new Set(saved.filter(id => FLOWERS.includes(id)));
} catch { /* Сайт работает и при недоступном localStorage. */ }
const initialUrl = new URL(window.location.href);
if (initialUrl.searchParams.has(SELECTION_PARAM)) {
  selected = new Set(initialUrl.searchParams.get(SELECTION_PARAM).split(',')
    .filter(value => /^\d+$/.test(value))
    .map(Number).filter(id => FLOWERS.includes(id)));
}
let favoritesOnly = initialUrl.searchParams.has(SELECTION_PARAM);

function selectionUrl() {
  const url = new URL(window.location.href);
  // Пустой параметр тоже важен: он отменяет старый выбор в localStorage.
  url.searchParams.set(SELECTION_PARAM, [...selected].sort((a, b) => a - b).join(','));
  return url.href;
}

function saveSelection() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...selected])); } catch { /* Хранилище может быть недоступно. */ }
  try { window.history.replaceState(null, '', selectionUrl()); } catch { /* Для локального файла браузер может запретить смену адреса. */ }
}
const grid = document.querySelector('#flower-grid');
const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
const dialog = document.querySelector('#flower-dialog');
const dialogPhoto = document.querySelector('#dialog-photo');

function illustration(color, index) {
  const petals = Array.from({ length: 7 }, (_, i) => `<ellipse cx="100" cy="60" rx="20" ry="33" fill="${color}" stroke="#ffffff55" transform="rotate(${i * 360 / 7} 100 90)"/>`).join('');
  return `<svg viewBox="0 0 200 260" aria-hidden="true"><g transform="rotate(${index % 2 ? 9 : -8} 100 150)"><path d="M100 100 Q88 170 104 250" fill="none" stroke="#8c9e78" stroke-width="4"/><path d="M99 190 Q45 189 48 153 Q91 149 99 190" fill="#a7b293"/><path d="M99 218 Q147 211 151 171 Q106 170 99 218" fill="#95a684"/>${petals}<circle cx="100" cy="90" r="18" fill="#dfc58e"/><circle cx="95" cy="85" r="9" fill="#edd9a8" opacity=".6"/></g></svg>`;
}

FLOWERS.forEach((id, index) => {
  const [background, color] = palettes[index % palettes.length];
  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.id = id;
  card.innerHTML = `<div class="photo" style="--card-bg:${background}"><div class="placeholder">${illustration(color,index)}<small>ЗДЕСЬ БУДЕТ ТВОЁ ФОТО</small></div><button class="view-photo" type="button" aria-label="Посмотреть цветы №${id} поближе"><span>Посмотреть поближе ↗</span></button><button class="heart" type="button" aria-pressed="false" aria-label="Выбрать цветы №${id}">${heart}</button></div><div class="card-info"><h2>Цветы №${id}</h2><span>${String(id).padStart(2,'0')} / ${String(FLOWERS.length).padStart(2,'0')}</span></div>`;
  const photo = card.querySelector('.photo');
  const img = new Image();
  img.alt = `Цветы №${id}`;
  img.decoding = 'async';
  const extensions = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'JPG', 'JPEG', 'PNG', 'WEBP'];
  let attempt = 0;
  img.onload = () => { photo.prepend(img); photo.classList.add('has-image'); };
  img.onerror = () => { if (++attempt < extensions.length) img.src = `img/${id}.${extensions[attempt]}`; };
  img.src = `img/${id}.${extensions[attempt]}`;
  card.querySelector('.view-photo').addEventListener('click', () => {
    dialogPhoto.replaceChildren();
    dialogPhoto.style.background = background;
    if (img.complete && img.naturalWidth) {
      const largeImage = new Image();
      largeImage.src = img.currentSrc || img.src;
      largeImage.alt = `Цветы №${id} крупным планом`;
      dialogPhoto.append(largeImage);
    } else {
      const placeholder = card.querySelector('.placeholder').cloneNode(true);
      dialogPhoto.append(placeholder);
    }
    document.querySelector('#dialog-title').textContent = `Цветы №${id}`;
    document.querySelector('#dialog-number').textContent = `${String(id).padStart(2,'0')} / ${String(FLOWERS.length).padStart(2,'0')}`;
    dialog.showModal();
  });
  card.querySelector('.heart').addEventListener('click', () => {
    selected.has(id) ? selected.delete(id) : selected.add(id);
    saveSelection();
    update();
    if (favoritesOnly) {
      const next = grid.querySelector('.card:not([hidden]) .heart');
      (next || document.querySelector('#show-all')).focus();
    }
  });
  grid.append(card);
});

function update() {
  for (const card of grid.children) {
    const id = Number(card.dataset.id);
    const active = selected.has(id);
    card.hidden = favoritesOnly && !active;
    card.classList.toggle('chosen', active);
    const button = card.querySelector('.heart');
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', `${active ? 'Убрать из избранного' : 'Выбрать'} цветы №${id}`);
  }
  document.querySelector('#total-count').textContent = FLOWERS.length;
  document.querySelector('#favorite-count').textContent = selected.size;
  document.querySelector('#selection-count').textContent = `Тебе ${selected.size === 1 ? 'нравится' : 'нравятся'} ${selected.size} из ${FLOWERS.length}`;
  document.querySelector('#selection').hidden = selected.size === 0;
  document.body.classList.toggle('has-selection', selected.size > 0);
  document.querySelector('#empty').hidden = !favoritesOnly || selected.size > 0;
  for (const [id, active] of [['all-tab', !favoritesOnly], ['favorites-tab', favoritesOnly]]) {
    const tab = document.getElementById(id);
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-pressed', String(active));
  }
}
document.querySelector('#dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
function setFilter(value) { favoritesOnly = value; update(); }
document.querySelector('#all-tab').addEventListener('click', () => setFilter(false));
document.querySelector('#favorites-tab').addEventListener('click', () => setFilter(true));
document.querySelector('#show-all').addEventListener('click', () => { setFilter(false); document.querySelector('#all-tab').focus(); });
let toastTimer;
function toast(message) {
  const el = document.querySelector('#toast');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 3500);
}
document.querySelector('#copy-selection').addEventListener('click', async () => {
  const text = selectionUrl();
  try {
    await navigator.clipboard.writeText(text);
    toast('Ссылка с твоим выбором скопирована ♡');
  } catch {
    window.prompt('Скопируй ссылку с твоим выбором:', text);
  }
});
saveSelection();
update();
