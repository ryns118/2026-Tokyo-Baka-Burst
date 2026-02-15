// CSS is now loaded via index.html link tag

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

// Initialize tickets by merging defaults with local storage to ensure new tickets appear
let storedTickets = JSON.parse(localStorage.getItem('tickets_data') || 'null');
let tickets = [...DEFAULT_TICKETS];
if (storedTickets) {
  tickets = tickets.map(t => {
    const found = storedTickets.find(st => st.id === t.id);
    if (found) return { ...t, status: found.status };
    return t;
  });
}

let shopItems = JSON.parse(localStorage.getItem('shop_items') || 'null') || [
  { id: 's1', name: 'ADDICTION 腮紅', status: '未購買' },
  { id: 's2', name: 'Uniqlo C 系列外套', status: '未購買' }
];

const mapNodes = {
  NRT: { lat: 35.776, lng: 140.318, name: "成田機場", time: "16:15" },
  MINOWA: { lat: 35.729, lng: 139.791, name: "三之輪 (Hotel)", time: "18:30" },
  ASAKUSA: { lat: 35.714, lng: 139.796, name: "淺草寺/和裝", time: "19:30" },
  TOYOSU: { lat: 35.649, lng: 139.789, name: "teamLab", time: "12:30" },
  SHIBUYA: { lat: 35.658, lng: 139.702, name: "澀谷 Shibuya Sky", time: "16:40" },
  OMOTESANDO: { lat: 35.666, lng: 139.710, name: "表參道 MAGNOLiA", time: "10:00" },
  HARAJUKU: { lat: 35.671, lng: 139.702, name: "原宿/新宿", time: "14:00" },
  FUJI: { lat: 35.500, lng: 138.760, name: "富士山河口湖", time: "10:30" },
  ARAKURAYAMA: { lat: 35.503, lng: 138.809, name: "新倉山淺間公園", time: "10:30" },
  HIKAWA: { lat: 35.485, lng: 138.804, name: "日川時計店", time: "11:45" },
  OSHINO: { lat: 35.459, lng: 138.832, name: "忍野八海", time: "12:35" },
  LAWSON: { lat: 35.498, lng: 138.769, name: "Lawson 河口湖", time: "14:30" },
  OISHI: { lat: 35.523, lng: 138.746, name: "大石公園", time: "15:20" },
  TOKYO_ST: { lat: 35.681, lng: 139.767, name: "東京車站", time: "08:00" },
  UENO: { lat: 35.712, lng: 139.775, name: "上野 Yamashiroya", time: "14:00" },
  EBISU: { lat: 35.642, lng: 139.713, name: "惠比壽花園廣場", time: "19:00" },
  GINZA: { lat: 35.672, lng: 139.766, name: "銀座", time: "07:50" },
  PALACE: { lat: 35.681, lng: 139.754, name: "皇居二重橋", time: "12:30" }
};

const dailyItineraryData = {
  1: { points: ["NRT", "MINOWA", "ASAKUSA"] },
  2: { points: ["ASAKUSA", "TOYOSU", "SHIBUYA"] },
  3: { points: ["OMOTESANDO", "HARAJUKU", "EBISU"] },
  4: { points: ["GINZA", "TOKYO_ST", "ARAKURAYAMA", "HIKAWA", "OSHINO", "LAWSON", "OISHI", "GINZA"] },
  5: { points: ["TOKYO_ST", "PALACE", "UENO", "NRT"] }
};

let currentDay = 1;
let map = null, markersLayer = null;

function saveToLocal() {
  localStorage.setItem('tickets_data', JSON.stringify(tickets));
  localStorage.setItem('shop_items', JSON.stringify(shopItems));
}

function updateSyncStatus(status) {
  const dot = document.getElementById('sync-dot');
  const text = document.getElementById('sync-text');
  if (text) text.innerText = status.toUpperCase();
  
  if (dot) {
      const baseClasses = "absolute -top-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white rounded-full transition-colors duration-300";
      let colorClass = "bg-gray-400"; // default/offline
      if (status === 'online') colorClass = "bg-green-500";
      else if (status === 'syncing') colorClass = "bg-red-500 animate-pulse";
      
      dot.className = `${baseClasses} ${colorClass}`;
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `flex items-center gap-3 bg-white/90 backdrop-blur-md border border-gray-100 shadow-2xl px-5 py-3 rounded-2xl transition-all duration-300 transform translate-y-4 opacity-0`;
  const icon = type === 'success' ? 'check-circle' : 'info';
  toast.innerHTML = `<i data-lucide="${icon}" class="w-5 h-5 ${type === 'success' ? 'text-green-500' : 'text-red-500'}"></i> <span class="text-sm font-bold text-gray-800">${message}</span>`;
  container.appendChild(toast);
  
  if (window.lucide) window.lucide.createIcons();
  
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
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
    // Optimistic success visual
    setTimeout(() => {
      if (document.getElementById('sync-text').innerText === 'SYNCING') {
         updateSyncStatus('online');
      }
    }, 800);
  } catch (err) {
    console.error('Sync failed:', err);
    updateSyncStatus('offline');
  }
}

async function loadFromCloud(isBackground = false) {
  if (!GAS_URL || GAS_URL.includes('/edit')) return;
  
  if (!isBackground) updateSyncStatus('syncing');

  try {
    // Add cache busting
    const response = await fetch(`${GAS_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const cloudData = await response.json();
    let hasChanges = false;

    if (Array.isArray(cloudData)) {
      cloudData.forEach(cloudItem => {
        const id = cloudItem.id || cloudItem.itemId;
        if (!id) return;
        
        // 1. Handle Tickets
        // Use loose equality (==) to handle potential string/number mismatches from JSON
        const tIdx = tickets.findIndex((t) => t.id == id);
        if (tIdx !== -1) {
          if (tickets[tIdx].status !== cloudItem.status) {
            tickets[tIdx].status = cloudItem.status;
            hasChanges = true;
          }
          return; // Processed as ticket
        }

        // 2. Handle Shop Items
        // Ensure ID is treated as string for check
        if (String(id).startsWith('s')) {
          const sIdx = shopItems.findIndex((s) => s.id == id);
          
          if (cloudItem.status === 'DELETED') {
            if (sIdx !== -1) {
              shopItems.splice(sIdx, 1);
              hasChanges = true;
            }
          } else {
            if (sIdx !== -1) {
              // Update existing only if changed
              if (shopItems[sIdx].status !== cloudItem.status || (cloudItem.name && shopItems[sIdx].name !== cloudItem.name)) {
                shopItems[sIdx].status = cloudItem.status;
                if (cloudItem.name) shopItems[sIdx].name = cloudItem.name;
                hasChanges = true;
              }
            } else {
              // Add new item
              shopItems.push({
                id: id,
                name: cloudItem.name || '未命名商品',
                status: cloudItem.status
              });
              hasChanges = true;
            }
          }
        }
      });
      
      if (hasChanges) {
        saveToLocal();
        renderAll();
        if (isBackground) console.log('Synced data from cloud');
      }
      
      updateSyncStatus('online');
      
      // Feature request: Toast on manual load
      if (!isBackground) {
        showToast('雲端已同步', 'success');
      }
    }
  } catch (err) {
    console.error(err);
    if (!isBackground) updateSyncStatus('offline');
  }
}

function initMap() {
  const mapEl = document.getElementById('travel-leaflet-map');
  if (!mapEl) return;
  if (map) {
    map.invalidateSize();
    return;
  }
  
  if (typeof L === 'undefined') {
    console.error('Leaflet not loaded');
    return;
  }
  
  map = L.map('travel-leaflet-map', { zoomControl: false, scrollWheelZoom: false }).setView([35.681, 139.767], 12);
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB'
  }).addTo(map);
  
  markersLayer = L.layerGroup().addTo(map);
  
  renderMap(currentDay);
}

function renderMap(day) {
  if (!markersLayer || !map) return;
  markersLayer.clearLayers();
  const points = dailyItineraryData[day].points;
  const latlngs = [];
  points.forEach((key, i) => {
    const node = mapNodes[key];
    if (!node) return;
    latlngs.push([node.lat, node.lng]);
    
    L.marker([node.lat, node.lng], { 
      icon: L.divIcon({ 
        className: 'bg-transparent', 
        html: `<div class="marker-pin" data-index="${i+1}"></div>`, 
        iconSize: [30, 42], iconAnchor: [15, 42] 
      })
    }).addTo(markersLayer).bindPopup(`<div class="p-2 font-bold text-gray-800">${node.name}<br><span class="text-red-500 text-xs">${node.time}</span></div>`);
  });
  
  if (latlngs.length > 0) {
    L.polyline(latlngs, { color: '#d9333f', weight: 4, dashArray: '8, 12', opacity: 0.5 }).addTo(markersLayer);
    map.fitBounds(L.latLngBounds(latlngs), { padding: [60, 60], animate: true });
  }
}

function createTicketHTML(t) {
  const isPurchased = t.status === '已購買';
  return `
      <div class="bg-white rounded-[24px] shadow-sm border border-gray-100 flex overflow-hidden relative group active:scale-[0.98] transition-all">
        <div class="w-16 flex flex-col items-center justify-center bg-gray-50/50 py-4"><i data-lucide="${t.type === '交通' ? 'train-front' : 'ticket'}" class="w-5 h-5 text-red-600/30"></i></div>
        <div class="flex-1 p-5 pr-16">
          <h4 class="font-bold text-gray-800 ${isPurchased ? 'line-through text-gray-300' : ''}">${t.name}</h4>
          <p class="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">${t.location}</p>
        </div>
        <button id="toggle-t-${t.id}" class="absolute right-4 top-1/2 -translate-y-1/2 p-3 ${isPurchased ? 'text-green-500' : 'text-gray-200'}">
          <i data-lucide="${isPurchased ? 'check-circle' : 'circle'}" class="w-7 h-7"></i>
        </button>
      </div>`;
}

function renderTickets() {
  const pending = document.getElementById('wallet-pending');
  const purchased = document.getElementById('wallet-purchased');
  if (!pending || !purchased) return;
  
  pending.innerHTML = tickets.filter((t) => t.status !== '已購買').map(createTicketHTML).join('');
  purchased.innerHTML = tickets.filter((t) => t.status === '已購買').map(createTicketHTML).join('');
  
  if (window.lucide) window.lucide.createIcons();
  
  tickets.forEach((t) => {
    document.getElementById(`toggle-t-${t.id}`)?.addEventListener('click', () => {
      t.status = t.status === '已購買' ? '待準備' : '已購買';
      saveToLocal();
      renderTickets();
      syncToCloud(t);
      showToast(t.status === '已購買' ? '已標記為完成' : '已取消完成狀態', 'success');
    });
  });
}

function renderShop() {
  const container = document.getElementById('shopping-list-container');
  if (!container) return;
  
  container.innerHTML = shopItems.map((item) => {
    const isDone = item.status === '已購買';
    return `
      <div class="bg-white p-5 rounded-[20px] flex items-center justify-between shadow-sm border border-gray-100 active:scale-[0.98] transition-all">
        <div class="flex items-center gap-4">
          <button id="toggle-s-${item.id}" class="${isDone ? 'text-green-500' : 'text-gray-300'}">
            <i data-lucide="${isDone ? 'check-circle' : 'circle'}" class="w-6 h-6"></i>
          </button>
          <span class="${isDone ? 'line-through text-gray-300' : ''} font-bold text-sm text-gray-800">${item.name}</span>
        </div>
        <button id="del-s-${item.id}" class="text-gray-200 hover:text-red-400 p-2"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
      </div>`;
  }).join('');
  
  if (window.lucide) window.lucide.createIcons();

  shopItems.forEach((item) => {
    document.getElementById(`toggle-s-${item.id}`)?.addEventListener('click', () => {
      item.status = item.status === '已購買' ? '未購買' : '已購買';
      saveToLocal();
      renderShop();
      syncToCloud(item);
    });
    document.getElementById(`del-s-${item.id}`)?.addEventListener('click', () => {
      syncToCloud({ ...item, status: 'DELETED' });
      shopItems = shopItems.filter((x) => x.id !== item.id);
      saveToLocal();
      renderShop();
      showToast('項目已移除', 'info');
    });
  });
}

function renderAll() {
  renderTickets();
  renderShop();
}

function initializeApp() {
  console.log('Initializing App...');
  if (window.lucide) window.lucide.createIcons();
  
  // Initial map call with timeout to ensure DOM is ready
  setTimeout(() => {
    initMap();
  }, 500);

  renderAll();
  loadFromCloud();

  // Start polling every 3 seconds
  setInterval(() => {
    loadFromCloud(true);
  }, 3000);

  // Scroll effect for floating navbar
  let lastScrollY = 0;
  
  const handleScroll = (e) => {
    const nav = document.getElementById('floating-nav');
    if (!nav) return;
    
    // Determine scroll position based on event target or window
    let currentScrollY = window.scrollY;
    if (e.target && e.target.scrollTop !== undefined) {
       currentScrollY = e.target.scrollTop;
    }
    
    // Hide when scrolling down, show when scrolling up
    if (currentScrollY > lastScrollY && currentScrollY > 60) {
      nav.classList.add('nav-hidden');
    } else {
      nav.classList.remove('nav-hidden');
    }
    lastScrollY = currentScrollY > 0 ? currentScrollY : 0;
  };

  // Listen to both window and the itinerary sheet
  window.addEventListener('scroll', handleScroll, { passive: true });
  document.getElementById('itinerary-content-sheet')?.addEventListener('scroll', handleScroll, { passive: true });

  // Navigation Click Handlers
  ['itinerary', 'wallet', 'shopping'].forEach(view => {
    const btn = document.getElementById(`nav-${view}`);
    btn?.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.view-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
      
      const targetView = document.getElementById(`view-${view}`);
      if (targetView) targetView.classList.add('active');
      btn.classList.add('active');
      
      // Reset navbar state on view switch
      lastScrollY = 0;
      document.getElementById('floating-nav')?.classList.remove('nav-hidden');

      if (view === 'itinerary') {
        setTimeout(() => {
          if (map) map.invalidateSize();
          else initMap();
        }, 100);
      }
      
      // Scroll handling for view switch
      if (view === 'itinerary') {
        const sheet = document.getElementById('itinerary-content-sheet');
        if (sheet) sheet.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  // Day Switching Handlers
  [1, 2, 3, 4, 5].forEach(day => {
    const btn = document.getElementById(`btn-day-${day}`);
    btn?.addEventListener('click', (e) => {
      e.preventDefault();
      currentDay = day;
      document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      document.querySelectorAll('.day-content').forEach(content => content.classList.remove('active'));
      const targetContent = document.getElementById(`content-day-${day}`);
      if (targetContent) targetContent.classList.add('active');
      
      renderMap(day);
    });
  });

  // Settings Modal Handlers
  document.getElementById('settings-trigger')?.addEventListener('click', () => {
    document.getElementById('settings-modal')?.classList.add('active');
    const input = document.getElementById('gas-url-input');
    if (input) input.value = GAS_URL;
  });

  document.getElementById('close-settings-btn')?.addEventListener('click', () => {
    document.getElementById('settings-modal')?.classList.remove('active');
  });

  document.getElementById('save-settings-btn')?.addEventListener('click', () => {
    const input = document.getElementById('gas-url-input');
    GAS_URL = (input && input.value) ? input.value : DEFAULT_GAS_URL;
    localStorage.setItem('gas_url', GAS_URL);
    document.getElementById('settings-modal')?.classList.remove('active');
    loadFromCloud();
    showToast('設定已儲存', 'success');
  });

  document.getElementById('manual-sync-btn')?.addEventListener('click', () => {
    loadFromCloud();
    showToast('同步中...', 'info');
  });

  // Shopping Add Handler
  document.getElementById('add-shop-btn')?.addEventListener('click', () => {
    const input = document.getElementById('shop-input');
    if (!input || !input.value.trim()) return;
    const newItem = { id: 's' + Date.now(), name: input.value.trim(), status: '未購買' };
    shopItems.push(newItem);
    input.value = '';
    saveToLocal();
    renderShop();
    syncToCloud(newItem);
    showToast('已新增至清單', 'success');
  });

  // Map Reset View
  document.getElementById('reset-map')?.addEventListener('click', () => {
    renderMap(currentDay);
  });
}

// Robust Readiness Check
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}