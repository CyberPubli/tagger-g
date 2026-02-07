// Clientify Auto Chat Opener - Archivo Principal
console.log("🚀 [AutoTag] Script cargado. Esperando comandos...");

// ✅ VERIFICACIÓN DE DIAGNÓSTICO
setTimeout(() => {
  const separator = '='.repeat(60);
  console.log(separator);
  console.log("📊 [AutoTag] DIAGNÓSTICO DE MÓDULOS CARGADOS:");
  console.log("✓ chatOpener:", typeof window.chatOpener !== 'undefined' ? '✅ DISPONIBLE' : '❌ NO DISPONIBLE');
  console.log("✓ chatTagger:", typeof window.chatTagger !== 'undefined' ? '✅ DISPONIBLE' : '❌ NO DISPONIBLE');
  console.log("✓ chatObserver:", typeof window.chatObserver !== 'undefined' ? '✅ DISPONIBLE' : '❌ NO DISPONIBLE');
  console.log(separator);
}, 500);

// Detener automáticamente cuando se recarga la página
window.addEventListener('beforeunload', () => {
  console.log("⏹️ [AutoTag] Página recargándose - Deteniendo extensión automáticamente");
  if (typeof chatOpener !== 'undefined') chatOpener.stopChatIteration?.();
  if (typeof chatTagger !== 'undefined') chatTagger.stopTagIteration?.();
  if (typeof chatObserver !== 'undefined') chatObserver.stopObserveIteration?.();
  chrome.storage.local.set({ 
    popupState: { isRunning: false, logEntries: [], maxEntries: 100 }
  });
});

// --- Handlers de mensajes ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📩 [AutoTag] Mensaje recibido:", message);
  
  if (message.action === "test") {
    console.log("🧪 [AutoTag] TEST recibido - Content script está funcionando!");
    sendResponse({ ok: true, message: "Content script funcionando" });
    return;
  }
  
  if (message.action === "abrirChats") {
    console.log("▶️ [AutoTag] Iniciando apertura de chats...");
    if (typeof chatOpener !== 'undefined') {
      console.log("✅ chatOpener DISPONIBLE, iniciando...");
      chatOpener.startChatIteration();
    } else {
      console.error("❌ ERROR: chatOpener NO ESTÁ DISPONIBLE");
    }
  }
  
  if (message.action === "detenerChats") {
    console.log("⏹️ [AutoTag] Deteniendo apertura de chats...");
    if (typeof chatOpener !== 'undefined') chatOpener.stopChatIteration?.();
    if (typeof chatTagger !== 'undefined') chatTagger.stopTagIteration?.();
    if (typeof chatObserver !== 'undefined') chatObserver.stopObserveIteration?.();
    
    // ✅ Guardar estado como inactivo (el tabId viene del sender)
    console.log("[AutoTag] Sincronizando estado de detención con storage");
    
    chrome.storage.local.set({ 
      popupState: { ...JSON.parse(localStorage.getItem('popupState') || '{}'), isRunning: false },
      autoTagEnabled: false
    });
  }
  
  if (message.action === "tagearChatsV2") {
    console.log("▶️ [AutoTag] Iniciando tageo de chats V2...");
    if (typeof chatTagger !== 'undefined') {
      console.log("✅ chatTagger DISPONIBLE, iniciando...");
      chatTagger.startTagIteration();
    } else {
      console.error("❌ ERROR: chatTagger NO ESTÁ DISPONIBLE");
    }
  }
  
  if (message.action === "observarChats") {
    console.log("▶️ [AutoTag] Iniciando observación de chats...");
    const ocultados = ocultarCyberBoti?.() || 0;
    console.log(`🚫 [AutoTag] ${ocultados} mensajes de Cyber BOTI ocultados`);
    
    if (typeof chatObserver !== 'undefined') {
      console.log("✅ chatObserver DISPONIBLE, iniciando...");
      chatObserver.startObserveIteration();
    } else {
      console.error("❌ ERROR: chatObserver NO ESTÁ DISPONIBLE - No se puede iniciar observación");
      console.log("Módulos disponibles:");
      console.log("  - chatOpener:", typeof window.chatOpener);
      console.log("  - chatTagger:", typeof window.chatTagger);
      console.log("  - chatObserver:", typeof window.chatObserver);
    }
  }
});

/**
 * Abre un panel lateral con los datos guardados
 */
function abrirPanelDatos() {
  // Verificar si ya existe el panel
  let panel = document.getElementById('clientify-data-panel');
  
  if (panel) {
    // Si existe, solo lo mostramos/ocultamos
    const isVisible = panel.style.right === '0px';
    panel.style.right = isVisible ? '-450px' : '0px';
    if (!isVisible) {
      actualizarDatosPanel();
    }
    return;
  }
  
  // Crear el panel lateral
  panel = document.createElement('div');
  panel.id = 'clientify-data-panel';
  panel.style.cssText = `
    position: fixed;
    top: 0;
    right: -450px;
    width: 420px;
    height: 100vh;
    background: white;
    box-shadow: -5px 0 20px rgba(0,0,0,0.3);
    z-index: 999999;
    transition: right 0.3s ease;
    display: flex;
    flex-direction: column;
    font-family: Arial, sans-serif;
  `;
  
  panel.innerHTML = `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
      <h2 style="margin: 0; font-size: 18px;">📊 Reporte de Mensajes</h2>
      <button id="close-panel" style="background: rgba(255,255,255,0.2); border: none; color: white; font-size: 20px; cursor: pointer; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">×</button>
    </div>
    
    <div style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
      <button id="refresh-data" style="width: 100%; padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <span style="font-size: 18px;">🔄</span> Refrescar Datos
      </button>
    </div>
    
    <div id="data-content" style="flex: 1; overflow-y: auto; padding: 15px;">
      <div style="text-align: center; color: #6b7280; padding: 50px 20px;">
        <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
        <div>Cargando datos...</div>
      </div>
    </div>
    
    <div style="padding: 15px; border-top: 1px solid #e5e7eb; display: flex; gap: 10px;">
      <button id="copy-data" style="flex: 1; padding: 12px; background: #7c3aed; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">📋 Copiar</button>
      <button id="clear-data" style="flex: 1; padding: 12px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">🗑️ Limpiar</button>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Event Listeners
  document.getElementById('close-panel').addEventListener('click', () => {
    panel.style.right = '-450px';
  });
  
  document.getElementById('refresh-data').addEventListener('click', () => {
    actualizarDatosPanel();
  });
  
  document.getElementById('copy-data').addEventListener('click', () => {
    copiarDatosAlPortapapeles();
  });
  
  document.getElementById('clear-data').addEventListener('click', () => {
    if (confirm('⚠️ ¿Estás seguro de que quieres borrar todos los datos?\n\nEsta acción NO se puede deshacer.')) {
      localStorage.removeItem('clientify_chat_data');
      actualizarDatosPanel();
      alert('✅ Datos eliminados correctamente');
    }
  });
  
  // Mostrar el panel
  setTimeout(() => {
    panel.style.right = '0px';
    actualizarDatosPanel();
  }, 100);
}

/**
 * Actualiza el contenido del panel con los datos actuales
 */
function actualizarDatosPanel() {
  const contentDiv = document.getElementById('data-content');
  if (!contentDiv) return;
  
  try {
    const dataStr = localStorage.getItem('clientify_chat_data');
    
    if (!dataStr) {
      contentDiv.innerHTML = `
        <div style="text-align: center; color: #6b7280; padding: 50px 20px;">
          <div style="font-size: 48px; margin-bottom: 10px;">📭</div>
          <div style="font-size: 14px; line-height: 1.6;">No hay datos guardados aún.<br><br>Ejecuta <strong>"Observar chats"</strong> primero para recopilar información.</div>
        </div>
      `;
      return;
    }
    
    const data = JSON.parse(dataStr);
    
    // Obtener mapping de nomenclatura → panel
    const mappingStr = localStorage.getItem('clientify_nomenclatura_panel_mapping');
    const mapping = mappingStr ? JSON.parse(mappingStr) : {};
    
    // Agrupar por panel
    const paneles = {};
    
    Object.keys(data).forEach(nomenclatura => {
      // Extraer DD-MM-ID de la nomenclatura (ignorar letra y signo)
      const match = nomenclatura.match(/^(\d{2}-\d{2}-\d+)/);
      if (!match) return;
      
      const codigoBase = match[1]; // "13-12-19"
      const letra = nomenclatura.replace(codigoBase, '').replace(/!$/, ''); // "A", "B", "C"
      const tieneCarga = nomenclatura.endsWith('!');
      
      // Obtener nombre del panel del mapping
      const panelNombre = mapping[nomenclatura] || `Panel ${codigoBase}`;
      
      if (!paneles[codigoBase]) {
        paneles[codigoBase] = {
          nombre: panelNombre,
          campanas: {}
        };
      }
      
      if (!paneles[codigoBase].campanas[letra]) {
        paneles[codigoBase].campanas[letra] = {
          urls: {},
          tieneCarga: tieneCarga
        };
      }
      
      // Agregar URLs de esta nomenclatura
      const urls = data[nomenclatura];
      Object.entries(urls).forEach(([url, count]) => {
        if (!paneles[codigoBase].campanas[letra].urls[url]) {
          paneles[codigoBase].campanas[letra].urls[url] = 0;
        }
        paneles[codigoBase].campanas[letra].urls[url] += count;
      });
    });
    
    let totalPaneles = 0;
    let totalCampanas = 0;
    let totalMensajes = 0;
    let html = '';
    
    // Ordenar paneles por código
    const panelesOrdenados = Object.keys(paneles).sort();
    
    panelesOrdenados.forEach(codigoPanel => {
      totalPaneles++;
      const panel = paneles[codigoPanel];
      
      html += `<div style="margin-bottom: 20px; border: 2px solid #667eea; border-radius: 10px; overflow: hidden;">`;
      html += `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; font-weight: bold; font-size: 15px;">📍 ${panel.nombre}</div>`;
      
      // Ordenar campañas por letra
      const letras = Object.keys(panel.campanas).sort();
      
      letras.forEach(letra => {
        totalCampanas++;
        const campana = panel.campanas[letra];
        
        // Calcular total de mensajes de esta campaña
        const totalMensajesCampana = Object.values(campana.urls).reduce((sum, count) => sum + count, 0);
        totalMensajes += totalMensajesCampana;
        
        const pluralCampana = totalMensajesCampana === 1 ? 'mensaje' : 'mensajes';
        const iconoCarga = campana.tieneCarga ? '✅' : '⏳';
        const textoCarga = campana.tieneCarga ? 'CARGÓ' : 'Pendiente';
        
        html += `<div style="padding: 12px; background: #f3f4f6; border-bottom: 1px solid #e5e7eb;">`;
        html += `<div style="font-weight: bold; color: #7c3aed; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">`;
        html += `<span>Campaña ${letra}: ${totalMensajesCampana} ${pluralCampana}</span>`;
        html += `<span style="font-size: 11px; background: ${campana.tieneCarga ? '#10b981' : '#f59e0b'}; color: white; padding: 4px 8px; border-radius: 4px;">${iconoCarga} ${textoCarga}</span>`;
        html += `</div>`;
        
        // Mostrar URLs de esta campaña
        const urlsOrdenadas = Object.entries(campana.urls).sort((a, b) => b[1] - a[1]);
        
        urlsOrdenadas.forEach(([url, count]) => {
          const plural = count === 1 ? 'mensaje' : 'mensajes';
          html += `<div style="padding: 8px 12px; background: white; margin-bottom: 6px; border-radius: 6px; border-left: 3px solid #10b981; font-size: 11px;">`;
          html += `<div style="font-weight: bold; color: #059669; margin-bottom: 3px;">${count} ${plural}</div>`;
          html += `<a href="${url}" target="_blank" style="color: #2563eb; text-decoration: none; word-break: break-all; font-size: 10px;">${url}</a>`;
          html += `</div>`;
        });
        
        html += `</div>`;
      });
      
      html += `</div>`;
    });
    
    // Resumen
    html += `<div style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); color: white; padding: 15px; border-radius: 10px; margin-top: 10px;">`;
    html += `<div style="font-weight: bold; margin-bottom: 10px; font-size: 14px;">📈 RESUMEN TOTAL</div>`;
    html += `<div style="font-size: 13px; line-height: 1.8;">`;
    html += `<div>✓ Paneles: <strong>${totalPaneles}</strong></div>`;
    html += `<div>✓ Campañas: <strong>${totalCampanas}</strong></div>`;
    html += `<div>✓ Total mensajes: <strong>${totalMensajes}</strong></div>`;
    html += `</div></div>`;
    
    contentDiv.innerHTML = html;
    
  } catch (error) {
    contentDiv.innerHTML = `
      <div style="text-align: center; color: #ef4444; padding: 50px 20px;">
        <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
        <div style="font-size: 14px;">Error al cargar los datos:<br><strong>${error.message}</strong></div>
      </div>
    `;
  }
}

/**
 * Copia los datos al portapapeles en formato texto
 */
function copiarDatosAlPortapapeles() {
  try {
    const dataStr = localStorage.getItem('clientify_chat_data');
    if (!dataStr) {
      alert('ℹ️ No hay datos para copiar');
      return;
    }
    
    const data = JSON.parse(dataStr);
    
    // Obtener mapping de nomenclatura → panel
    const mappingStr = localStorage.getItem('clientify_nomenclatura_panel_mapping');
    const mapping = mappingStr ? JSON.parse(mappingStr) : {};
    
    // Agrupar por panel
    const paneles = {};
    
    Object.keys(data).forEach(nomenclatura => {
      const match = nomenclatura.match(/^(\d{2}-\d{2}-\d+)/);
      if (!match) return;
      
      const codigoBase = match[1];
      const letra = nomenclatura.replace(codigoBase, '').replace(/!$/, '');
      const tieneCarga = nomenclatura.endsWith('!');
      
      const panelNombre = mapping[nomenclatura] || `Panel ${codigoBase}`;
      
      if (!paneles[codigoBase]) {
        paneles[codigoBase] = {
          nombre: panelNombre,
          campanas: {}
        };
      }
      
      if (!paneles[codigoBase].campanas[letra]) {
        paneles[codigoBase].campanas[letra] = {
          urls: {},
          tieneCarga: tieneCarga
        };
      }
      
      const urls = data[nomenclatura];
      Object.entries(urls).forEach(([url, count]) => {
        if (!paneles[codigoBase].campanas[letra].urls[url]) {
          paneles[codigoBase].campanas[letra].urls[url] = 0;
        }
        paneles[codigoBase].campanas[letra].urls[url] += count;
      });
    });
    
    let texto = '═══════════════════════════════════\n';
    texto += '📊 REPORTE POR PANEL Y CAMPAÑA\n';
    texto += '═══════════════════════════════════\n\n';
    
    let totalPaneles = 0;
    let totalCampanas = 0;
    let totalMensajes = 0;
    
    const panelesOrdenados = Object.keys(paneles).sort();
    
    panelesOrdenados.forEach(codigoPanel => {
      totalPaneles++;
      const panel = paneles[codigoPanel];
      
      texto += `\n📍 ${panel.nombre}\n`;
      texto += '═══════════════════════════════════\n';
      
      const letras = Object.keys(panel.campanas).sort();
      
      letras.forEach(letra => {
        totalCampanas++;
        const campana = panel.campanas[letra];
        
        const totalMensajesCampana = Object.values(campana.urls).reduce((sum, count) => sum + count, 0);
        totalMensajes += totalMensajesCampana;
        
        const pluralCampana = totalMensajesCampana === 1 ? 'mensaje' : 'mensajes';
        const iconoCarga = campana.tieneCarga ? '✅ CARGÓ' : '⏳ Pendiente';
        
        texto += `\n  Campaña ${letra}: ${totalMensajesCampana} ${pluralCampana} ${iconoCarga}\n`;
        texto += '  ───────────────────────────────\n';
        
        const urlsOrdenadas = Object.entries(campana.urls).sort((a, b) => b[1] - a[1]);
        
        urlsOrdenadas.forEach(([url, count]) => {
          const plural = count === 1 ? 'mensaje' : 'mensajes';
          texto += `    ${count} ${plural} → ${url}\n`;
        });
      });
    });
    
    texto += '\n═══════════════════════════════════\n';
    texto += '📈 RESUMEN TOTAL\n';
    texto += '═══════════════════════════════════\n';
    texto += `Paneles: ${totalPaneles}\n`;
    texto += `Campañas: ${totalCampanas}\n`;
    texto += `Total mensajes: ${totalMensajes}\n`;
    
    navigator.clipboard.writeText(texto).then(() => {
      alert('✅ Reporte copiado al portapapeles');
    });
    
  } catch (error) {
    alert('❌ Error al copiar: ' + error.message);
  }
}



