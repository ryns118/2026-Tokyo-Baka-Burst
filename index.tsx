
// Application logic for Tokyo Duo BAKA 2026

const DEFAULT_TICKETS = [
  { id: 't1', type: '交通', name: 'Skyliner 去程 (NRT → 市區)', location: 'Klook', status: '待準備' },
  { id: 't7', type: '交通', name: 'Skyliner 回程 (市區 → NRT)', location: 'Klook', status: '待準備' },
  { id: 't2', type: '票券', name: 'teamLab Planets (2/25)', location: '官網預約', status: '待準備', link: 'https://teamlabplanets.dmm.com/zh_tw/mytickets/0c81f69903f1050aa7' },
  { id: 't3', type: '票券', name: 'Shibuya Sky (2/25)', location: '官網預約', status: '待準備' },
  { id: 't4', type: '美髮', name: 'MAGNOLiA 沙龍預約 (2/26)', location: 'Hot Pepper Beauty', status: '待準備' },
  { id: 't5', type: '行程', name: '富士山一日遊憑證 (2/27)', location: 'KKday/Klook', status: '待準備' },
  { id: 't6', type: '體驗', name: '江戶和裝工房和服 (2/25)', location: '官網預約', status: '待準備' }
];

const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbwj98SSWaJsumdB2C0cTuOt0bgQM1j1t8pOUEbOJYGyTwFYqV6koO7PrYIJEZQSeQ3CCQ/exec';

let GAS_URL = localStorage.getItem('gas_url') || DEFAULT_GAS_URL;
let tickets = JSON.parse(localStorage.getItem('tickets_data')) || [...DEFAULT_TICKETS];
let shopItems = JSON.parse(localStorage.getItem('shop_items')) || [
  { id: 's1', name: 'ADDICTION 腮紅', status: '未購買' },
  { id: 's2', name: 'Uniqlo C 系列外套', status: '未購買' }
];

const mapNodes = {
  NRT: { lat: 35.776, lng: 140.318, name: "成田機場", time: "16:15" },
  MINOWA: { lat: 35.729, lng: 139.791, name: "三之輪 (Hotel)", time: "18:30" },
  ASAKUSA: { lat: 35.714, lng: 139.796, name: "淺草寺", time: "19:30" },
  TOYOSU: { lat: 35.649, lng: 139.789, name: "teamLab", time: "12:30" },
  SHIBUYA: { lat: 35.658, lng: 139.702, name: "澀谷 Shibuya Sky", time: "16:40" },
  OMOTESANDO: { lat: 35.666, lng: 139.710, name: "表參道", time: "10:00" },
  FUJI: { lat: 35.500, lng: 138.760, name: "富士山河口湖", time: "10:30" },
  ARAKURAYAMA: { lat: 35.503, lng: 138.809, name: "新倉山淺間公園", time: "10:30" },
  HIKAWA: { lat: 35.485, lng: 138.804, name: "日川時計店", time: "11:45" },
  OSHINO: { lat: 35.459, lng: 138.832, name: "忍野八海", time: "12:35" },
  OISHI: { lat: 35.523, lng: 138.746, name: "大石公園", time: "15:20" },
  TOKYO_ST: { lat: 35.681, lng: 139.767, name: "東京車站", time: "08:00" },
  UENO: { lat: 35.712, lng: 139.775, name: "上野", time: "14:00" },
  EBISU: { lat: 35.642, lng: 139.713, name: "惠比壽花園廣場", time: "19:00" },
  GINZA: { lat: 35.672, lng: 139.766, name: "銀座", time: "07:50" },
  PALACE: { lat: 35.681, lng: 139.754, name: "皇居二重橋", time: "12:30" }
};

const dailyItineraryData = {
  1: { points: ["NRT", "MINOWA", "ASAKUSA"] },
  2: { points: ["ASAKUSA", "TOYOSU", "SHIBUYA"] },
  3: { points: ["OMOTESANDO", "SHIBUYA", "EBISU"] },
  4: { points: ["GINZA", "TOKYO_ST", "ARAKURAYAMA", "HIKAWA", "OSHINO", "OISHI", "GINZA"] },
  5: { points: ["TOKYO_ST", "PALACE", "UENO", "NRT"] }
};

let map = null, markersLayer = null;

function saveToLocal() {
  localStorage.setItem('tickets_data', JSON.stringify(tickets));
  localStorage.setItem('shop_items', JSON.stringify(shopItems));
}

function updateSyncStatus(status) {
  const dot = document.getElementById('sync-dot');
  const text = document.getElementById('sync-text');
  if (!dot || !text) return;
  dot.className = 'sync-indicator ' + (status === 'online' ? 'status-online' : status === 'syncing' ? 'status-syncing' : 'status-offline');
  text.innerText = status.toUpperCase();
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-xl`;
  const icon = type === 'success' ? 'check-circle-2' : 'info';
  toast.innerHTML = `<i data-lucide="${icon}" class="w-3 h-3 ${type === 'success' ? 'text-green-400' : 'text-[#FC4B5F]'}"></i> ${message}`;
  container.appendChild(toast);
  // @ts-ignore
  lucide.createIcons();
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

async function syncToCloud(item) {
  if (!GAS_URL || GAS_URL.includes('/edit')) return;
  updateSyncStatus('syncing');
  try {
    await fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(item)
    });
    setTimeout(() => {
      updateSyncStatus('online');
      showToast(item.status === 'DELETED' ? '項目已從雲端移除' : '已同步至雲端', 'success');
    }, 500);
  } catch (err) {
    updateSyncStatus('offline');
  }
}

async function loadFromCloud() {
  if (!GAS_URL || GAS_URL.includes('/edit')) return;
  updateSyncStatus('syncing');
  try {
    const response = await fetch(GAS_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const cloudData = await response.json();
    if (Array.isArray(cloudData)) {
      // Basic merge logic
      cloudData.forEach(cloudItem => {
        const id = cloudItem.id || cloudItem.itemId;
        if (!id) return;
        const tIdx = tickets.findIndex(t => t.id == id);
        if (tIdx !== -1) tickets[tIdx].status = cloudItem.status;
      });
      saveToLocal();
      renderAll();
      updateSyncStatus('online');
    }
  } catch (err) {
    updateSyncStatus('offline');
  }
}

function initMap() {
  if (map) return;
  const mapEl = document.getElementById('travel-leaflet-map');
  if (!mapEl) return;
  // @ts-ignore
  map = L.map('travel-leaflet-map', { zoomControl: false, scrollWheelZoom: false }).setView([35.681, 139.767], 12);
  // @ts-ignore
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
  // @ts-ignore
  markersLayer = L.layerGroup().addTo(map);
  renderMap(1);
}

function renderMap(day) {
  if (!markersLayer) return;
  markersLayer.clearLayers();
  const points = dailyItineraryData[day].points;
  const latlngs = [];
  points.forEach((key, i) => {
    const node = mapNodes[key];
    latlngs.push([node.lat, node.lng]);
    // @ts-ignore
    L.marker([node.lat, node.lng], { 
      // @ts-ignore
      icon: L.divIcon({ className: 'bg-transparent', html: `<div class="marker-pin" data-index="${i+1}"></div><div class="marker-label">${node.name}</div>`, iconSize: [30, 42], iconAnchor: [15, 42] })
    }).addTo(markersLayer).bindPopup(`<b>${node.name}</b><br>${node.time}`);
  });
  if (latlngs.length > 1) {
    // @ts-ignore
    L.polyline(latlngs, { color: '#FC4B5F', weight: 4, dashArray: '10, 10', opacity: 0.5 }).addTo(markersLayer);
    // @ts-ignore
    map.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50] });
  }
}

function renderTickets() {
  const pending = document.getElementById('wallet-pending');
  const purchased = document.getElementById('wallet-purchased');
  if (!pending || !purchased) return;
  pending.innerHTML = ''; purchased.innerHTML = '';
  tickets.forEach(t => {
    const isPurchased = t.status === '已購買';
    const html = `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 flex overflow-hidden relative">
        <div class="w-16 flex flex-col items-center justify-center bg-gray-50/50 py-4"><i data-lucide="${t.type === '交通' ? 'train' : 'ticket'}" class="w-5 h-5 text-[#FC4B5F]/30"></i></div>
        <div class="flex-1 p-5 pr-16">
          <h4 class="font-bold text-gray-800 ${isPurchased ? 'line-through text-gray-400' : ''}">${t.name}</h4>
          <p class="text-[10px] text-gray-400 mt-1">${t.location}</p>
        </div>
        <button id="toggle-t-${t.id}" class="absolute right-4 top-1/2 -translate-y-1/2 p-2 ${isPurchased ? 'text-[#FC4B5F]' : 'text-gray-200'}"><i data-lucide="check-circle" class="w-7 h-7"></i></button>
      </div>`;
    if (isPurchased) purchased.innerHTML += html; else pending.innerHTML += html;
  });
  // @ts-ignore
  lucide.createIcons();
  
  tickets.forEach(t => {
    document.getElementById(`toggle-t-${t.id}`)?.addEventListener('click', () => {
      t.status = t.status === '已購買' ? '待準備' : '已購買';
      saveToLocal();
      renderTickets();
      syncToCloud(t);
    });
  });
}

function renderShop() {
  const container = document.getElementById('shopping-list-container');
  if (!container) return;
  container.innerHTML = '';
  shopItems.forEach(item => {
    const isDone = item.status === '已購買';
    container.innerHTML += `
      <div class="bg-white p-4 rounded-xl flex items-center justify-between shadow-sm border border-gray-100">
        <div class="flex items-center gap-3">
          <button id="toggle-s-${item.id}" class="${isDone ? 'text-green-500' : 'text-gray-300'}"><i data-lucide="${isDone ? 'check-circle-2' : 'circle'}" class="w-5 h-5"></i></button>
          <span class="${isDone ? 'line-through text-gray-400' : ''} font-medium text-sm">${item.name}</span>
        </div>
        <button id="del-s-${item.id}" class="text-gray-300 hover:text-red-400"><i data-lucide="x" class="w-4 h-4"></i></button>
      </div>`;
  });
  // @ts-ignore
  lucide.createIcons();

  shopItems.forEach(item => {
    document.getElementById(`toggle-s-${item.id}`)?.addEventListener('click', () => {
      item.status = item.status === '已購買' ? '未購買' : '已購買';
      saveToLocal();
      renderShop();
      syncToCloud(item);
    });
    document.getElementById(`del-s-${item.id}`)?.addEventListener('click', () => {
      syncToCloud({ ...item, status: 'DELETED' });
      shopItems = shopItems.filter(x => x.id !== item.id);
      saveToLocal();
      renderShop();
    });
  });
}

function renderAll() {
  renderTickets();
  renderShop();
}

// Initialization and Event Listeners
window.addEventListener('DOMContentLoaded', () => {
  // @ts-ignore
  lucide.createIcons();
  initMap();
  renderAll();
  loadFromCloud();

  // Scroll effect for floating navbar
  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('floating-nav');
    if (!nav) return;
    
    const currentScrollY = window.scrollY;
    // Hide when scrolling down, show when scrolling up
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      nav.classList.add('nav-hidden');
    } else {
      nav.classList.remove('nav-hidden');
    }
    lastScrollY = currentScrollY;
  }, { passive: true });

  // Navigation
  ['itinerary', 'wallet', 'shopping'].forEach(view => {
    document.getElementById(`nav-${view}`)?.addEventListener('click', () => {
      document.querySelectorAll('.view-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
      document.getElementById(`view-${view}`).classList.add('active');
      document.getElementById(`nav-${view}`).classList.add('active');
      if (view === 'itinerary') setTimeout(initMap, 100);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Day Switching
  [1, 2, 3, 4, 5].forEach(day => {
    document.getElementById(`btn-day-${day}`)?.addEventListener('click', () => {
      document.querySelectorAll('.day-btn').forEach(btn => btn.classList.remove('active'));
      document.getElementById(`btn-day-${day}`).classList.add('active');
      document.querySelectorAll('.day-content').forEach(content => content.classList.remove('active'));
      document.getElementById(`content-day-${day}`).classList.add('active');
      renderMap(day);
    });
  });

  // Settings
  document.getElementById('settings-trigger')?.addEventListener('click', () => {
    document.getElementById('settings-modal').classList.add('active');
    (document.getElementById('gas-url-input') as HTMLInputElement).value = GAS_URL;
  });

  document.getElementById('close-settings-btn')?.addEventListener('click', () => {
    document.getElementById('settings-modal').classList.remove('active');
  });

  document.getElementById('save-settings-btn')?.addEventListener('click', () => {
    GAS_URL = (document.getElementById('gas-url-input') as HTMLInputElement).value || DEFAULT_GAS_URL;
    localStorage.setItem('gas_url', GAS_URL);
    document.getElementById('settings-modal').classList.remove('active');
    loadFromCloud();
  });

  document.getElementById('manual-sync-btn')?.addEventListener('click', loadFromCloud);

  // Shopping
  document.getElementById('add-shop-btn')?.addEventListener('click', () => {
    const input = document.getElementById('shop-input') as HTMLInputElement;
    if (!input.value) return;
    const newItem = { id: 's' + Date.now(), name: input.value, status: '未購買' };
    shopItems.push(newItem);
    input.value = '';
    saveToLocal();
    renderShop();
    syncToCloud(newItem);
  });

  // Map Reset
  document.getElementById('reset-map')?.addEventListener('click', () => {
    renderMap(1);
  });
});
