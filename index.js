// CSS is now loaded via index.html link tag

// Application logic for Tokyo Duo BAKA 2026

// 1. Remove hardcoded default data to ensure list is empty until fetched from Google Sheet
const DEFAULT_TICKETS = [];

// HARDCODED URL as requested
const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbwj98SSWaJsumdB2C0cTuOt0bgQM1j1t8pOUEbOJYGyTwFYqV6koO7PrYIJEZQSeQ3CCQ/exec';

let GAS_URL = localStorage.getItem('gas_url') || DEFAULT_GAS_URL;

// Initialize variables
let tickets = [];
let shopItems = [];

// Diagnostic counters
let loadRetryCount = 0;
const MAX_RETRIES = 5;

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
  const icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'alert-circle' : 'info');
  const color = type === 'success' ? 'text-green-500' : (type === 'error' ? 'text-red-500' : 'text-blue-500');
  toast.innerHTML = `<i data-lucide="${icon}" class="w-5 h-5 ${color}"></i> <span class="text-sm font-bold text-gray-800">${message}</span>`;
  container.appendChild(toast);
  
  if (window.lucide) window.lucide.createIcons();
  
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => toast.remove(), 400);
  }, 5000); 
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
    
    console.log("Write success, queueing rapid reload...");
    setTimeout(() => loadFromCloud(true), 500);
    
  } catch (err) {
    console.error('Sync failed:', err);
    updateSyncStatus('offline');
  }
}

function findArrayInObject(obj) {
  if (!obj) return null;
  if (Array.isArray(obj)) return obj;
  const keys = ['data', 'items', 'result', 'values', 'records'];
  for (const key of keys) {
    if (Array.isArray(obj[key])) return obj[key];
  }
  if (typeof obj === 'object') {
    for (const key in obj) {
      if (Array.isArray(obj[key])) return obj[key];
    }
  }
  return null;
}

// Robust property getter with Chinese header support
function safeGet(obj, keys) {
  if (!obj) return null;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
  }
  const objKeys = Object.keys(obj);
  for (const targetKey of keys) {
    const foundKey = objKeys.find(k => k.toLowerCase() === targetKey.toLowerCase());
    if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null && obj[foundKey] !== '') {
      return obj[foundKey];
    }
  }
  return null;
}

async function loadFromCloud(isBackground = false) {
  if (!GAS_URL || GAS_URL.includes('/edit')) return;
  
  if (!isBackground) updateSyncStatus('syncing');

  try {
    const separator = GAS_URL.includes('?') ? '&' : '?';
    const noCacheUrl = `${GAS_URL}${separator}t=${Date.now()}&r=${Math.floor(Math.random() * 1000)}`;
    
    if (!isBackground) console.log(`Fetching: ${noCacheUrl}`);
    const response = await fetch(noCacheUrl);
    
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
    
    const textData = await response.text();
    
    if (textData.trim().startsWith('<')) {
      throw new Error('Endpoint returned HTML. Check permissions.');
    }

    let cloudData;
    try {
        cloudData = JSON.parse(textData);
    } catch (e) {
        throw new Error(`JSON Parse Error: ${textData.substring(0, 30)}...`);
    }

    if (!isBackground) console.log("☁️ [Raw Cloud Data]", cloudData);

    let targetArray = findArrayInObject(cloudData);

    if (!targetArray) {
        if (cloudData.status === 'error') {
            throw new Error(cloudData.message || 'Script Error');
        }
        throw new Error('資料格式不符 (無陣列)');
    }

    // --- 2D ARRAY CONVERTER (The "Universal Adapter") ---
    // Handle cases where GAS returns [[A,B,C], [1,2,3]] (Rows) instead of objects
    if (targetArray.length > 0 && Array.isArray(targetArray[0])) {
        console.log("Detected 2D Array (Rows). Checking structure...");
        
        // 1. Detect if the first row is Headers or Data
        // Based on screenshot, Row 1 is "t1", "Skyliner...", so it is DATA.
        // We check for common header keywords to decide.
        const firstRowStr = targetArray[0].map(x => String(x).toLowerCase());
        const headerKeywords = ['id', 'name', 'title', 'status', 'type', 'location', 'link', 'item', '名稱', '狀態', '類別'];
        const hasHeaders = firstRowStr.some(cell => headerKeywords.some(kw => cell.includes(kw)));

        const objArray = [];
        
        if (hasHeaders) {
             // Treat Row 0 as Headers
             const headers = targetArray[0].map(h => String(h).trim());
             for (let i = 1; i < targetArray.length; i++) {
                const row = targetArray[i];
                const obj = {};
                headers.forEach((header, colIndex) => {
                    if (colIndex < row.length) obj[header] = row[colIndex];
                });
                objArray.push(obj);
             }
             if (!isBackground) showToast(`偵測到表格標題：${headers[0]}...`, 'info');
        } else {
             // Treat Row 0 as Data (No Headers) -> Use Fixed Index Mapping
             // Mapping based on screenshot: A:ID, B:Name, C:Status, D:Type, E:Location, F:Link
             console.log("No headers detected. Using fixed column mapping.");
             targetArray.forEach(row => {
                 objArray.push({
                     id: row[0],
                     name: row[1],
                     status: row[2],
                     type: row[3],
                     location: row[4],
                     link: row[5]
                 });
             });
        }
        targetArray = objArray;
    }
    // ----------------------------------------------------

    // CLOUD FIRST STRATEGY
    const newTickets = [];
    const newShopItems = [];

    targetArray.forEach((cloudItem, index) => {
        // 1. Try Standard Key Lookup (Preferred)
        let rawId = safeGet(cloudItem, ['id', 'ID', 'itemId', 'item_id', '編號', 'No', 'no', 'uuid']);
        let rawName = safeGet(cloudItem, ['name', 'Name', 'title', 'Title', '名稱', '項目', 'Item', 'item', '標題']);
        let rawStatus = safeGet(cloudItem, ['status', 'Status', 'state', '狀態', '情況']);
        let rawType = safeGet(cloudItem, ['type', 'Type', 'category', '類別', '類型', '分類']);
        let rawLocation = safeGet(cloudItem, ['location', 'Location', 'place', '地點', '位置', '場所']);
        let rawLink = safeGet(cloudItem, ['link', 'Link', 'url', '連結', '網址']);

        // 2. Fallback: Smart Index Mapping (If keys are broken/missing)
        // This handles the case where GAS treated Row 1 (Data) as Header
        // Example: { "t1": "t2", "Skyliner": "teamLab" } -> "t2" is ID, "teamLab" is Name
        if (!rawId && !rawName) {
            const vals = Object.values(cloudItem);
            // Heuristic: Must have at least a few columns to be valid
            if (vals.length >= 3) {
                 rawId = vals[0];       // Col A
                 rawName = vals[1];     // Col B
                 rawStatus = vals[2];   // Col C
                 rawType = vals[3];     // Col D
                 rawLocation = vals[4]; // Col E
                 rawLink = vals[5];     // Col F
            }
        }

        // 3. Final Fallback for critical fields
        rawStatus = rawStatus || '待準備';
        rawType = rawType || '票券';
        rawLocation = rawLocation || '';
        rawLink = rawLink || '';

        // If ID is completely missing, generate a consistent fake ID
        if (!rawId) {
             if (rawName) {
                // Generate from name hash
                rawId = 'gen-' + Math.abs(String(rawName).split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0));
             } else {
                // Last resort: use index and timestamp to ensure it exists
                rawId = `auto-${index}-${Date.now()}`;
                if (!rawName) rawName = `未命名項目 #${index + 1}`;
             }
        }
        
        const id = String(rawId);
        
        // Skip explicitly deleted
        if (String(rawStatus).toUpperCase() === 'DELETED') return;
        
        // Determine category
        // 's' prefix = Shop, 't' prefix = Ticket
        // Or check type/name keywords
        const isShop = id.toLowerCase().startsWith('s') || 
                       rawType === '購物' || rawType === 'Shopping' || rawType === 'Shop' ||
                       (rawName && String(rawName).includes('買'));
        
        if (!isShop) {
            newTickets.push({
                id: id,
                type: rawType,
                name: rawName,
                location: rawLocation,
                status: rawStatus,
                link: rawLink
            });
        } else {
            newShopItems.push({
                id: id,
                name: rawName,
                status: rawStatus
            });
        }
    });

    console.log(`Parsed: ${newTickets.length} tickets, ${newShopItems.length} shop items.`);

    // Diagnostic Toast if array exists but nothing parsed (should be impossible now due to fallbacks)
    if (targetArray.length > 0 && newTickets.length === 0 && newShopItems.length === 0 && !isBackground) {
         const firstKeys = Object.keys(targetArray[0]).join(', ');
         showToast(`欄位不符: [${firstKeys}]`, 'error');
    }

    tickets = newTickets;
    shopItems = newShopItems;
    
    saveToLocal();
    renderAll();
    
    loadRetryCount = 0;
    updateSyncStatus('online');
    
    if (!isBackground) {
        const msg = `已同步 ${tickets.length + shopItems.length} 筆資料`;
        showToast(msg, 'success');
    }

  } catch (err) {
    console.error("Load failed", err);
    if (!isBackground) {
        updateSyncStatus('offline');
        showToast(err.message, 'error');
    }
    
    if (loadRetryCount < MAX_RETRIES) {
        loadRetryCount++;
        const delay = 1500 * loadRetryCount;
        if (!isBackground) showToast(`連線失敗，第 ${loadRetryCount} 次重試中...`, 'info');
        setTimeout(() => loadFromCloud(isBackground), delay);
    }
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
          <p class="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">${t.location || '未知地點'}</p>
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
  
  const pendingItems = tickets.filter((t) => t.status !== '已購買');
  const purchasedItems = tickets.filter((t) => t.status === '已購買');
  
  pending.innerHTML = pendingItems.length ? pendingItems.map(createTicketHTML).join('') : '<div class="text-center py-8 text-gray-300 text-xs font-bold uppercase tracking-widest">暫無待辦項目</div>';
  purchased.innerHTML = purchasedItems.length ? purchasedItems.map(createTicketHTML).join('') : '<div class="text-center py-8 text-gray-300 text-xs font-bold uppercase tracking-widest">暫無已購項目</div>';
  
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
  
  if (shopItems.length === 0) {
    container.innerHTML = '<div class="text-center py-10 text-gray-300 text-xs font-bold uppercase tracking-widest">清單是空的</div>';
  } else {
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
  }
  
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
  
  setTimeout(() => {
    initMap();
  }, 500);

  // 5. Initialization Fix: Clear list and sync
  tickets = [];
  shopItems = [];
  renderAll(); // Shows empty state initially
  
  showToast('正在從雲端同步...', 'info');
  loadRetryCount = 0;
  loadFromCloud();

  // Start polling every 5 seconds
  setInterval(() => {
    loadFromCloud(true);
  }, 5000);

  // Scroll effect for floating navbar
  let lastScrollY = 0;
  
  const handleScroll = (e) => {
    const nav = document.getElementById('floating-nav');
    if (!nav) return;
    
    let currentScrollY = window.scrollY;
    if (e.target && e.target.scrollTop !== undefined) {
       currentScrollY = e.target.scrollTop;
    }
    
    if (currentScrollY > lastScrollY && currentScrollY > 60) {
      nav.classList.add('nav-hidden');
    } else {
      nav.classList.remove('nav-hidden');
    }
    lastScrollY = currentScrollY > 0 ? currentScrollY : 0;
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  document.getElementById('itinerary-content-sheet')?.addEventListener('scroll', handleScroll, { passive: true });

  ['itinerary', 'wallet', 'shopping'].forEach(view => {
    const btn = document.getElementById(`nav-${view}`);
    btn?.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.view-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
      
      const targetView = document.getElementById(`view-${view}`);
      if (targetView) targetView.classList.add('active');
      btn.classList.add('active');
      
      lastScrollY = 0;
      document.getElementById('floating-nav')?.classList.remove('nav-hidden');

      if (view === 'itinerary') {
        setTimeout(() => {
          if (map) map.invalidateSize();
          else initMap();
        }, 100);
      }
      
      if (view === 'itinerary') {
        const sheet = document.getElementById('itinerary-content-sheet');
        if (sheet) sheet.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

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
    loadRetryCount = 0; 
    // Clear list to force fresh sync visual
    tickets = [];
    shopItems = [];
    renderAll();
    loadFromCloud();
    showToast('設定已儲存', 'success');
  });

  document.getElementById('manual-sync-btn')?.addEventListener('click', () => {
    loadRetryCount = 0;
    loadFromCloud();
    showToast('同步中...', 'info');
  });

  document.getElementById('add-shop-btn')?.addEventListener('click', () => {
    const input = document.getElementById('shop-input');
    if (!input || !input.value.trim()) return;
    const newItem = { id: 's' + Date.now(), name: input.value.trim(), status: '未購買' };
    
    // Add locally for responsiveness, will be overwritten by cloud later
    shopItems.push(newItem);
    input.value = '';
    saveToLocal();
    renderShop();
    
    syncToCloud(newItem);
    showToast('已新增至清單', 'success');
  });

  // Map Logic
  const mapWrapper = document.getElementById('map-wrapper');
  const mapOverlay = document.getElementById('map-overlay');
  const mapControls = document.getElementById('map-controls');
  const minimizeBtn = document.getElementById('minimize-map-btn');
  const resetBtn = document.getElementById('reset-map-btn');

  function toggleMap(expand) {
    if (!mapWrapper || !mapOverlay || !mapControls) return;
    
    if (expand) {
      mapWrapper.classList.remove('collapsed');
      mapOverlay.style.opacity = '0';
      mapOverlay.style.pointerEvents = 'none';
      mapControls.style.opacity = '1';
      mapControls.style.pointerEvents = 'auto';
      
      // Delay invalidating size until transition finishes
      setTimeout(() => {
         if (map) map.invalidateSize();
      }, 400);
    } else {
      mapWrapper.classList.add('collapsed');
      mapOverlay.style.opacity = '1';
      mapOverlay.style.pointerEvents = 'auto';
      mapControls.style.opacity = '0';
      mapControls.style.pointerEvents = 'none';
    }
  }

  // Force default state on load
  toggleMap(false);

  mapOverlay?.addEventListener('click', () => toggleMap(true));
  
  minimizeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMap(false);
  });
  
  resetBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      renderMap(currentDay);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}