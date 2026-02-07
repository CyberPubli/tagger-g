// Service Worker - Intermediario de mensajes
// Soporta múltiples tabs activos simultáneamente

let activeTabIds = new Set(); // Set de tabs activos
let isRunning = false;
let panelesCache = null; // Cache de paneles desde API
let cacheTimestamp = null; // Timestamp del cache
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const PANELES_API_URL = 'https://accountant-services.co.uk/paneles/?secret=tu_clave_super_secreta';

// Inyectar content scripts en una pestaña si no están presentes
async function inyectarContentScripts(tabId) {
  try {
    console.log(`[Background] 💉 Inyectando scripts en tab ${tabId}...`);
    const scripts = [
      'codigo/hideCyberBoti.js',
      'codigo/alertManager.js',
      'codigo/chatOpener.js',
      'codigo/chatTagger.js',
      'codigo/elementos observer/url-mapper.js',
      'codigo/elementos observer/url-detector.js',
      'codigo/chatObserver.js',
      'codigo/content.js'
    ];
    
    for (const file of scripts) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: [file]
        });
        console.log(`[Background] ✅ Script ${file} inyectado`);
      } catch (err) {
        console.error(`[Background] ❌ Error inyectando ${file}:`, err);
      }
    }
  } catch (error) {
    console.error('[Background] Error en inyectarContentScripts:', error);
  }
}

// Función para cargar paneles desde la API (sin restricciones de CORS en service worker)
async function cargarPanelesDelServidor() {
  const ahora = Date.now();
  
  // Si el cache es reciente (menos de 5 minutos), reutilizalo
  if (panelesCache && cacheTimestamp && 
      (ahora - cacheTimestamp) < CACHE_DURATION) {
    console.log('[Background] 📦 Usando cache de paneles');
    return panelesCache;
  }
  
  try {
    console.log('[Background] 🔄 Obteniendo paneles desde API...');
    const response = await fetch(PANELES_API_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.ok && data.paneles && Array.isArray(data.paneles)) {
      panelesCache = data.paneles.map(p => ({
        id: p.id,
        nombre: p.nombre,
        numero: p.numero
      }));
      cacheTimestamp = ahora;
      console.log(`[Background] ✅ ${panelesCache.length} paneles cargados desde API`);
      return panelesCache;
    }
    
    console.warn('[Background] ⚠️ Formato inesperado de respuesta');
    return panelesCache || [];
  } catch (error) {
    console.error('[Background] ❌ Error cargando paneles:', error);
    return panelesCache || [];
  }
}

// Función para invalidar cache (se llama cuando se modifica paneles)
function invalidarCachePaneles() {
  panelesCache = null;
  cacheTimestamp = null;
  console.log('[Background] 🔄 Cache de paneles invalidado');
}

// Escuchar mensajes desde popup y content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;
  
  // Manejar solicitud de paneles desde content script
  if (message.action === "obtenerPaneles") {
    cargarPanelesDelServidor().then(paneles => {
      sendResponse({ success: true, paneles: paneles });
    }).catch(error => {
      console.error('[Background] Error en obtenerPaneles:', error);
      sendResponse({ success: false, paneles: [] });
    });
    return true; // Mantener el canal abierto para respuesta asincrónica
  }

  // Reportar alerta de caída al servidor (sin restricciones CORS)
  if (message.action === "reportarAlerta") {
    const { panel } = message;
    
    if (!panel || !panel.id || !panel.nombre) {
      sendResponse({ success: false, error: 'Panel inválido' });
      return;
    }

    // Preparar el número: si es array, usar el primer elemento
    let numero = panel.numero;
    if (Array.isArray(numero)) {
      numero = numero.length > 0 ? numero[0] : '';
    }

    const payload = {
      id: panel.id,
      nombre: panel.nombre,
      numero: numero
    };

    console.log('[Background] 📡 Reportando alerta:', payload);

    fetch('https://accountant-services.co.uk/alerts?secret=tu_clave_super_secreta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(data => {
      console.log('[Background] ✅ Alerta reportada:', data);
      sendResponse({ success: true, data });
    })
    .catch(error => {
      console.error('[Background] ❌ Error reportando alerta:', error);
      sendResponse({ success: false, error: error.message });
    });
    
    return true; // Mantener el canal abierto para respuesta asincrónica
  }

  // Invalidar cache cuando se modifiquen paneles
  if (message.action === "invalidarCachePaneles") {
    invalidarCachePaneles();
    return;
  }
  
  // Si viene del popup - inyectar scripts en tabs de Clientify para TEST
  if (message.action === "test") {
    console.log("[Background] 🧪 TEST recibido desde popup, inyectando scripts...");
    chrome.tabs.query({ url: "https://new.clientify.com/team-inbox/*" }, (tabs) => {
      tabs.forEach(tab => {
        console.log(`[Background] Inyectando en tab ${tab.id} para test`);
        inyectarContentScripts(tab.id);
      });
    });
    sendResponse({ ok: true });
    return;
  }
  
  // Si viene del popup - inyectar scripts para observarChats
  if (message.action === "observarChats" && !tabId) {
    console.log("[Background] 🚀 observarChats desde popup, inyectando scripts...");
    chrome.tabs.query({ url: "https://new.clientify.com/team-inbox/*" }, (tabs) => {
      tabs.forEach(tab => {
        console.log(`[Background] Inyectando en tab ${tab.id} para observar`);
        inyectarContentScripts(tab.id);
      });
    });
    sendResponse({ ok: true });
    return true;
  }
  
  // Si viene del content script iniciando observer
  if (message.action === "observarChats") {
    console.log("[Background] Observer iniciado en tabId:", tabId);
    activeTabIds.add(tabId);
    isRunning = true;
    saveState();
  } 
  
  // Si viene del popup - detener TODOS los observers activos
  if (message.action === "detenerChats") {
    console.log("[Background] Detener enviado a todos los tabs:", Array.from(activeTabIds));
    
    // Enviar a todos los tabs activos
    activeTabIds.forEach(id => {
      chrome.tabs.sendMessage(id, { action: "detenerChats" }).catch(() => {
        activeTabIds.delete(id);
      });
    });
    
    isRunning = false;
    saveState();
  }
});

// Limpiar si el tab se cierra
chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeTabIds.has(tabId)) {
    console.log("[Background] Tab cerrado:", tabId);
    activeTabIds.delete(tabId);
    
    if (activeTabIds.size === 0) {
      isRunning = false;
    }
    saveState();
  }
});

// Guardar estado
function saveState() {
  chrome.storage.local.set({ 
    activeTabIds: Array.from(activeTabIds),
    isRunning 
  });
}

// Cargar estado al iniciar
chrome.storage.local.get(['activeTabIds', 'isRunning'], (result) => {
  activeTabIds = new Set(result.activeTabIds || []);
  isRunning = result.isRunning || false;
  console.log("[Background] Estado cargado:", { activeTabIds: Array.from(activeTabIds), isRunning });
});
