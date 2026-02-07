// ============================================
// URL MAPPER - Gestión de mapeo URL → Letra de campaña
// ============================================

// 🔗 URL del servidor de mapeos centralizado
// URL del VPS de Hostinger con sincronización centralizada de mapeos
const MAPEOS_SERVER_URL = 'https://accountant-services.co.uk';

// Helper para enviar eventos al popup
function sendPopupEvent(event, type = 'info', data = {}) {
  chrome.runtime.sendMessage({
    action: 'popupEvent',
    event,
    type,
    data
  }).catch(err => {
    // Ignore si el popup no está abierto
  });
}

const urlMapper = {
  cola: [],
  procesando: false,
  modalAbierto: false,
  intervaloSonido: null, // Para controlar la repetición del sonido
  cacheMapeos: {}, // Cache local de mapeos
  ultimaConsultaAPI: 0, // Timestamp de la última consulta
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos de cache
  
  /**
   * Obtiene la letra de campaña para una URL
   * Si no existe, la agrega a la cola para mapear
   * @param {string} url - URL del mensaje
   * @param {string} panel - Nombre del panel asociado (opcional)
   * @returns {string} Letra de campaña ('A', 'B', 'C', etc.) o null si está pendiente
   */
  async getLetraCampana(url, panel = null) {
    // Primero intentar consultar esa URL específica al servidor
    // Esto incrementa el contador de usos automáticamente
    const letraDelServidor = await this.consultarMapeoEspecifico(url);
    
    if (letraDelServidor) {
      console.log(`✅ URL encontrada en servidor: ${url} → Letra: ${letraDelServidor}`);
      return letraDelServidor;
    }
    
    // Si no existe en servidor, agregar a la cola para mapear
    if (!this.cola.some(item => item.url === url)) {
      this.cola.push({ url, panel });
      console.log(`📋 URL agregada a cola de mapeo: ${url} | Panel: ${panel || 'Sin panel'}`);
    }
    
    // Intentar procesar la cola si no se está procesando
    if (!this.procesando && !this.modalAbierto) {
      this.procesarCola();
    }
    
    return null; // Aún no tiene letra asignada
  },
  
  /**
   * Consulta una URL específica al servidor e incrementa contador de usos
   * @param {string} url - URL a consultar
   * @returns {string|null} Letra de campaña o null si no existe
   */
  async consultarMapeoEspecifico(url) {
    try {
      const response = await fetch(`${MAPEOS_SERVER_URL}/mapeos?url=${encodeURIComponent(url)}`, {
        headers: {
          'X-Machine-ID': this.getMachineId()
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.ok && data.mapeo) {
          const letra = data.mapeo.letra || data.mapeo;
          
          // Actualizar cache local
          this.cacheMapeos[url] = letra;
          
          console.log(`📥 Mapeo consultado (usos: ${data.mapeo.usos || 1}): ${url} → ${letra}`);
          return letra;
        }
      }
      
      return null;
    } catch (error) {
      console.warn(`⚠️ Error consultando mapeo específico:`, error);
      
      // Si falla, intentar desde cache local
      const mapping = this.getMapping();
      if (mapping[url]) {
        console.log(`📦 Usando cache local: ${url} → ${mapping[url]}`);
        return mapping[url];
      }
      
      return null;
    }
  },
  
  /**
   * Procesa la cola de URLs pendientes de mapear
   */
  procesarCola() {
    if (this.cola.length === 0) {
      this.procesando = false;
      this.ocultarBannerAlerta();
      return;
    }
    
    this.procesando = true;
    
    // Abrir modal AUTOMÁTICAMENTE con la primera URL de la cola
    if (!this.modalAbierto && this.cola.length > 0) {
      console.log('🎯 Abriendo modal automáticamente para asignar letra');
      this.mostrarModalMapeo(this.cola[0]);
    }
  },
  
  /**
   * Muestra un banner de alerta en la parte superior (no intrusivo)
   */
  mostrarBannerAlerta() {
    // Verificar si ya existe
    let banner = document.getElementById('url-mapper-banner');
    
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'url-mapper-banner';
      banner.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999999;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
        font-family: Arial, sans-serif;
        cursor: pointer;
        animation: pulse 2s ease-in-out infinite;
        max-width: 400px;
      `;
      
      // Agregar animación
      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `;
      document.head.appendChild(style);
      
      document.body.appendChild(banner);
      
      // Click para abrir modal
      banner.addEventListener('click', () => {
        if (this.cola.length > 0) {
          this.mostrarModalMapeo(this.cola[0]);
        }
      });
    }
    
    // Actualizar contenido
    banner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 24px;">⚠️</div>
        <div>
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">
            ¡URL sin identificar!
          </div>
          <div style="font-size: 12px; opacity: 0.9;">
            ${this.cola.length} URL${this.cola.length > 1 ? 's' : ''} pendiente${this.cola.length > 1 ? 's' : ''} • Click para asignar letra
          </div>
        </div>
      </div>
    `;
  },
  
  /**
   * Oculta el banner de alerta
   */
  ocultarBannerAlerta() {
    const banner = document.getElementById('url-mapper-banner');
    if (banner) {
      banner.remove();
    }
  },
  
  /**
   * Reproduce un sonido de alerta (largo y grave)
   */
  reproducirSonidoAlerta() {
    try {
      // Crear AudioContext para generar un beep
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configurar el sonido (frecuencia 300Hz para tono grave, tipo 'sine' para tono suave)
      oscillator.frequency.value = 300;
      oscillator.type = 'sine';
      
      // Volumen inicial alto, luego fade out más lento
      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
      
      // Reproducir durante 1.5 segundos (más largo)
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1.5);
      
      console.log('🔔 Sonido de alerta reproducido (grave y largo)');
    } catch (error) {
      console.warn('⚠️ No se pudo reproducir sonido de alerta:', error);
    }
  },
  
  /**
   * Muestra modal para asignar letra de campaña a una URL
   * @param {Object} item - Objeto {url, panel}
   */
  mostrarModalMapeo(item) {
    const url = item.url;
    const panel = item.panel || 'Sin panel';
    this.modalAbierto = true;
    
    // 🔔 Reproducir sonido de alerta inmediatamente
    this.reproducirSonidoAlerta();
    
    // 🔔 Repetir sonido cada 15 segundos mientras el modal esté abierto
    this.intervaloSonido = setInterval(() => {
      if (this.modalAbierto) {
        this.reproducirSonidoAlerta();
      } else {
        clearInterval(this.intervaloSonido);
        this.intervaloSonido = null;
      }
    }, 15000); // 15 segundos
    
    // Crear overlay oscuro
    const overlay = document.createElement('div');
    overlay.id = 'url-mapper-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9999998;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    // Crear modal
    const modal = document.createElement('div');
    modal.id = 'url-mapper-modal';
    modal.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 30px;
      max-width: 600px;
      width: 90%;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      font-family: Arial, sans-serif;
    `;
    
    modal.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 20px;">
          🏷️ Asignar Letra de Campaña
        </h2>
        
        <!-- Nombre del Panel -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 12px 16px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
          <div style="font-size: 11px; color: rgba(255,255,255,0.8); text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">
            🎯 Panel asignado:
          </div>
          <div style="font-size: 16px; color: white; font-weight: bold;">
            ${panel}
          </div>
        </div>
        
        <!-- Previsualización de la URL -->
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px; text-transform: uppercase; font-weight: bold;">URL del mensaje:</div>
          <a href="${url}" target="_blank" style="
            display: block;
            font-size: 13px;
            color: #2563eb;
            word-break: break-all;
            text-decoration: none;
            padding: 8px;
            background: white;
            border-radius: 6px;
            border: 2px solid #dbeafe;
            transition: all 0.2s;
          " onmouseover="this.style.backgroundColor='#eff6ff'; this.style.borderColor='#2563eb';" onmouseout="this.style.backgroundColor='white'; this.style.borderColor='#dbeafe';">
            🔗 ${url}
          </a>
          <div style="font-size: 10px; color: #6b7280; margin-top: 6px;">
            💡 Click para abrir en nueva pestaña
          </div>
        </div>
        
        <!-- Vista previa en iframe (si es posible) -->
        <div style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
          <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px; text-transform: uppercase; font-weight: bold;">Vista previa:</div>
          
          <div id="iframe-fallback-msg" style="padding: 30px; text-align: center; color: #6b7280; font-size: 13px; background: white; border: 2px dashed #e5e7eb; border-radius: 6px; line-height: 1.6;">
            <div style="font-size: 32px; margin-bottom: 10px;">🚫</div>
            <div style="font-weight: bold; color: #374151; margin-bottom: 8px;">Vista previa no disponible</div>
            <div style="font-size: 11px; color: #9ca3af;">
              La mayoría de sitios (Facebook, Instagram, etc.) bloquean<br>
              la visualización en iframes por seguridad.
            </div>
            <div style="margin-top: 12px; font-size: 11px; color: #6b7280;">
              💡 <strong>Tip:</strong> Haz click en el enlace de arriba para abrirlo
            </div>
          </div>
          
          <iframe 
            id="preview-iframe"
            src="${url}" 
            style="
              display: none;
              width: 100%;
              height: 300px;
              border: 2px solid #e5e7eb;
              border-radius: 6px;
              background: white;
            "
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            allow="fullscreen"
          ></iframe>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 6px; margin-bottom: 20px;">
          <div style="font-size: 12px; color: #92400e;">
            ℹ️ <strong>URLs pendientes en cola:</strong> ${this.cola.length}
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 25px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #374151; font-size: 14px;">
          Letra de Campaña:
        </label>
        <input 
          type="text" 
          id="letra-campana-input" 
          maxlength="1" 
          style="
            width: 100%;
            padding: 12px;
            border: 2px solid #d1d5db;
            border-radius: 8px;
            font-size: 24px;
            text-align: center;
            text-transform: uppercase;
            font-weight: bold;
            box-sizing: border-box;
          "
          placeholder="A"
          autofocus
        />
        <div style="font-size: 11px; color: #6b7280; margin-top: 5px;">
          Ingresa una sola letra (A, B, C, etc.)
        </div>
      </div>
      
      <div style="display: flex; gap: 10px;">
        <button 
          id="guardar-letra-btn"
          style="
            flex: 1;
            padding: 12px 24px;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
          "
        >
          ✅ Guardar y Continuar
        </button>
        <button 
          id="omitir-letra-btn"
          style="
            padding: 12px 24px;
            background: #6b7280;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
          "
        >
          ⏭️ Omitir
        </button>
      </div>
      
      <div style="margin-top: 15px; padding: 10px; background: #f9fafb; border-radius: 6px;">
        <div style="font-size: 11px; color: #6b7280;">
          💡 <strong>Tip:</strong> Presiona Enter para guardar rápidamente
        </div>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Intentar cargar el iframe con mejor manejo
    setTimeout(() => {
      const iframe = document.getElementById('preview-iframe');
      const fallback = document.getElementById('iframe-fallback-msg');
      
      if (iframe && fallback) {
        let cargado = false;
        
        // Listener para carga exitosa
        iframe.addEventListener('load', () => {
          try {
            // Intentar acceder al contenido para verificar si realmente cargó
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            if (iframeDoc && iframeDoc.body) {
              cargado = true;
              iframe.style.display = 'block';
              fallback.style.display = 'none';
              console.log('✅ Vista previa cargada correctamente');
            }
          } catch (e) {
            // Error de acceso por CORS/X-Frame-Options - mantener fallback
            console.log('⚠️ No se puede acceder al contenido del iframe (CORS/X-Frame-Options)');
            iframe.style.display = 'none';
            fallback.style.display = 'block';
          }
        });
        
        // Listener para error de carga
        iframe.addEventListener('error', () => {
          console.log('❌ Error al cargar el iframe');
          iframe.style.display = 'none';
          fallback.style.display = 'block';
        });
        
        // Timeout de 4 segundos - si no cargó, asumir que falló
        setTimeout(() => {
          if (!cargado) {
            console.log('⏱️ Timeout - Vista previa no disponible');
            iframe.style.display = 'none';
            fallback.style.display = 'block';
          }
        }, 4000);
      }
    }, 300);
    
    // Focus en el input
    setTimeout(() => {
      const input = document.getElementById('letra-campana-input');
      input.focus();
      
      // Convertir a mayúsculas automáticamente
      input.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
      });
      
      // Enter para guardar
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          document.getElementById('guardar-letra-btn').click();
        }
      });
    }, 100);
    
    // Event listeners
    document.getElementById('guardar-letra-btn').addEventListener('click', () => {
      const letra = document.getElementById('letra-campana-input').value.trim().toUpperCase();
      
      if (!letra || letra.length !== 1 || !/^[A-Z]$/.test(letra)) {
        alert('⚠️ Por favor ingresa una letra válida (A-Z)');
        return;
      }
      
      // Guardar el mapeo
      this.guardarMapeo(url, letra);
      this.cola.shift(); // Quitar de la cola
      
      // Si hay más URLs en la cola, cargar la siguiente SIN CERRAR el modal
      if (this.cola.length > 0) {
        const siguienteItem = this.cola[0];
        this.actualizarModalConNuevaUrl(siguienteItem);
      } else {
        // Si ya no hay más, cerrar el modal y REANUDAR OBSERVER
        this.cerrarModal();
        this.procesarCola();
        
        // Reanudar el observer si estaba pausado
        if (typeof chatObserver !== 'undefined' && chatObserver.pausado) {
          console.log('✅ Todas las letras asignadas - Reanudando observer');
          setTimeout(() => chatObserver.reanudarObserver(), 500);
        }
      }
    });
    
    document.getElementById('omitir-letra-btn').addEventListener('click', () => {
      console.log(`⏭️ URL omitida: ${url}`);
      this.cola.shift();
      
      // Si hay más URLs, cargar la siguiente sin cerrar
      if (this.cola.length > 0) {
        const siguienteItem = this.cola[0];
        this.actualizarModalConNuevaUrl(siguienteItem);
      } else {
        this.cerrarModal();
        this.procesarCola();
        
        // Reanudar el observer si estaba pausado
        if (typeof chatObserver !== 'undefined' && chatObserver.pausado) {
          console.log('✅ URLs omitidas - Reanudando observer');
          setTimeout(() => chatObserver.reanudarObserver(), 500);
        }
      }
    });
  },
  
  /**
   * Actualiza el contenido del modal con una nueva URL sin cerrarlo
   * @param {Object} nuevoItem - Nuevo objeto {url, panel} a mostrar
   */
  actualizarModalConNuevaUrl(nuevoItem) {
    const modal = document.getElementById('url-mapper-modal');
    if (!modal) return;
    
    const nuevaUrl = nuevoItem.url;
    const nuevoPanel = nuevoItem.panel || 'Sin panel';
    
    // Actualizar el contenido del modal
    modal.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 20px;">
          🏷️ Asignar Letra de Campaña
        </h2>
        
        <!-- Nombre del Panel -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 12px 16px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
          <div style="font-size: 11px; color: rgba(255,255,255,0.8); text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">
            🎯 Panel asignado:
          </div>
          <div style="font-size: 16px; color: white; font-weight: bold;">
            ${nuevoPanel}
          </div>
        </div>
        
        <!-- Previsualización de la URL -->
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px; text-transform: uppercase; font-weight: bold;">URL del mensaje:</div>
          <a href="${nuevaUrl}" target="_blank" style="
            display: block;
            font-size: 13px;
            color: #2563eb;
            word-break: break-all;
            text-decoration: none;
            padding: 8px;
            background: white;
            border-radius: 6px;
            border: 2px solid #dbeafe;
            transition: all 0.2s;
          " onmouseover="this.style.backgroundColor='#eff6ff'; this.style.borderColor='#2563eb';" onmouseout="this.style.backgroundColor='white'; this.style.borderColor='#dbeafe';">
            🔗 ${nuevaUrl}
          </a>
          <div style="font-size: 10px; color: #6b7280; margin-top: 6px;">
            💡 Click para abrir en nueva pestaña
          </div>
        </div>
        
        <!-- Vista previa en iframe (si es posible) -->
        <div style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
          <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px; text-transform: uppercase; font-weight: bold;">Vista previa:</div>
          
          <div id="iframe-fallback-msg" style="padding: 30px; text-align: center; color: #6b7280; font-size: 13px; background: white; border: 2px dashed #e5e7eb; border-radius: 6px; line-height: 1.6;">
            <div style="font-size: 32px; margin-bottom: 10px;">🚫</div>
            <div style="font-weight: bold; color: #374151; margin-bottom: 8px;">Vista previa no disponible</div>
            <div style="font-size: 11px; color: #9ca3af;">
              La mayoría de sitios (Facebook, Instagram, etc.) bloquean<br>
              la visualización en iframes por seguridad.
            </div>
            <div style="margin-top: 12px; font-size: 11px; color: #6b7280;">
              💡 <strong>Tip:</strong> Haz click en el enlace de arriba para abrirlo
            </div>
          </div>
          
          <iframe 
            id="preview-iframe"
            src="${nuevaUrl}" 
            style="
              display: none;
              width: 100%;
              height: 300px;
              border: 2px solid #e5e7eb;
              border-radius: 6px;
              background: white;
            "
            sandbox="allow-same-origin allow-scripts allow-popups"
          ></iframe>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 6px; margin-bottom: 20px;">
          <div style="font-size: 12px; color: #92400e;">
            ℹ️ <strong>URLs pendientes en cola:</strong> ${this.cola.length}
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 25px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #374151; font-size: 14px;">
          Letra de Campaña:
        </label>
        <input 
          type="text" 
          id="letra-campana-input" 
          maxlength="1" 
          style="
            width: 100%;
            padding: 12px;
            border: 2px solid #d1d5db;
            border-radius: 8px;
            font-size: 24px;
            text-align: center;
            text-transform: uppercase;
            font-weight: bold;
            box-sizing: border-box;
          "
          placeholder="A"
          autofocus
        />
        <div style="font-size: 11px; color: #6b7280; margin-top: 5px;">
          Ingresa una sola letra (A, B, C, etc.)
        </div>
      </div>
      
      <div style="display: flex; gap: 10px;">
        <button 
          id="guardar-letra-btn"
          style="
            flex: 1;
            padding: 12px 24px;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
          "
        >
          ✅ Guardar y Continuar
        </button>
        <button 
          id="omitir-letra-btn"
          style="
            padding: 12px 24px;
            background: #6b7280;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
          "
        >
          ⏭️ Omitir
        </button>
      </div>
      
      <div style="margin-top: 15px; padding: 10px; background: #f9fafb; border-radius: 6px;">
        <div style="font-size: 11px; color: #6b7280;">
          💡 <strong>Tip:</strong> Presiona Enter para guardar rápidamente
        </div>
      </div>
    `;
    
    // Intentar cargar el iframe
    setTimeout(() => {
      const iframe = document.getElementById('preview-iframe');
      const fallback = document.getElementById('iframe-fallback-msg');
      
      if (iframe && fallback) {
        iframe.onload = () => {
          try {
            iframe.style.display = 'block';
            fallback.style.display = 'none';
          } catch (e) {
            console.log('No se puede acceder al contenido del iframe');
          }
        };
        
        iframe.onerror = () => {
          iframe.style.display = 'none';
          fallback.style.display = 'block';
        };
        
        setTimeout(() => {
          if (iframe.style.display === 'none') {
            fallback.style.display = 'block';
          }
        }, 3000);
      }
    }, 200);
    
    // Reconectar event listeners
    setTimeout(() => {
      const input = document.getElementById('letra-campana-input');
      input.focus();
      
      input.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
      });
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          document.getElementById('guardar-letra-btn').click();
        }
      });
      
      document.getElementById('guardar-letra-btn').addEventListener('click', () => {
        const letra = input.value.trim().toUpperCase();
        
        if (!letra || letra.length !== 1 || !/^[A-Z]$/.test(letra)) {
          alert('⚠️ Por favor ingresa una letra válida (A-Z)');
          return;
        }
        
        this.guardarMapeo(nuevaUrl, letra);
        this.cola.shift();
        
        if (this.cola.length > 0) {
          this.actualizarModalConNuevaUrl(this.cola[0]);
        } else {
          this.cerrarModal();
          this.procesarCola();
          
          // Reanudar el observer si estaba pausado
          if (typeof chatObserver !== 'undefined' && chatObserver.pausado) {
            console.log('✅ Todas las letras asignadas - Reanudando observer');
            setTimeout(() => chatObserver.reanudarObserver(), 500);
          }
        }
      });
      
      document.getElementById('omitir-letra-btn').addEventListener('click', () => {
        console.log(`⏭️ URL omitida: ${nuevaUrl}`);
        this.cola.shift();
        
        if (this.cola.length > 0) {
          this.actualizarModalConNuevaUrl(this.cola[0]);
        } else {
          this.cerrarModal();
          this.procesarCola();
          
          // Reanudar el observer si estaba pausado
          if (typeof chatObserver !== 'undefined' && chatObserver.pausado) {
            console.log('✅ URLs omitidas - Reanudando observer');
            setTimeout(() => chatObserver.reanudarObserver(), 500);
          }
        }
      });
    }, 100);
  },
  
  /**
   * Cierra el modal de mapeo
   */
  cerrarModal() {
    const overlay = document.getElementById('url-mapper-overlay');
    if (overlay) {
      overlay.remove();
    }
    this.modalAbierto = false;
    
    // 🔕 Detener repetición del sonido
    if (this.intervaloSonido) {
      clearInterval(this.intervaloSonido);
      this.intervaloSonido = null;
      console.log('🔕 Sonido de alerta detenido');
    }
  },
  
  /**
   * Guarda el mapeo URL → Letra en el servidor REMOTO SOLAMENTE (SIN localStorage)
   * @param {string} url - URL
   * @param {string} letra - Letra de campaña
   * @param {string} panel - Panel asociado (opcional)
   */
  guardarMapeo(url, letra, panel = 'Sin panel') {
    try {
      // 1. Actualizar cache local en memoria
      this.cacheMapeos[url] = letra;
      
      // 2. Enviar al servidor de forma ASÍNCRONA (no bloquea)
      this.sincronizarAlServidor(url, letra, panel);
      
      // 3. Notificar al popup
      sendPopupEvent('urlMapped', 'success', { url: url.substring(0, 40) + '...', letra });
      
      console.log(`✅ Mapeado: ${url} → ${letra} (sincronizando con servidor)`);
    } catch (error) {
      console.error('❌ Error al guardar mapeo:', error);
    }
  },
  
  /**
   * Sincroniza un mapeo con el servidor remoto (asíncrono, no bloquea)
   * @param {string} url - URL
   * @param {string} letra - Letra de campaña
   * @param {string} panel - Panel asociado
   */
  async sincronizarAlServidor(url, letra, panel = 'Sin panel') {
    try {
      console.log(`🔄 Enviando mapeo al servidor: ${url} → ${letra}`);
      
      const response = await fetch(`${MAPEOS_SERVER_URL}/mapeos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Machine-ID': this.getMachineId()
        },
        body: JSON.stringify({
          url: url,
          letra: letra.toUpperCase(),
          panel: panel
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Mapeo sincronizado con servidor: ${data.mensaje}`);
      } else {
        console.warn(`⚠️ Error en servidor: ${response.status}`);
      }
    } catch (error) {
      console.error(`⚠️ No se pudo sincronizar con el servidor (seguirá usando cache local):`, error);
      // El sistema continúa funcionando con cache local aunque falle el servidor
    }
  },
  
  /**
   * Obtiene un ID único de la máquina para identificar quién sincroniza
   * @returns {string} ID único de la máquina
   */
  getMachineId() {
    let machineId = localStorage.getItem('machine_id');
    
    if (!machineId) {
      // Generar un ID único basado en fecha, hora y random
      machineId = `MACHINE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('machine_id', machineId);
      console.log(`🤖 ID de máquina generado: ${machineId}`);
    }
    
    return machineId;
  },
  
  /**
   * Obtiene el mapeo completo SOLO desde el servidor remoto (SIN localStorage)
   * @returns {Object} Mapeo URL → Letra
   */
  getMapping() {
    try {
      // SOLO usar cache en memoria, NO localStorage
      if (Object.keys(this.cacheMapeos).length > 0) {
        return this.cacheMapeos;
      }
      
      // Si no hay cache, devolver vacío (la próxima vez se consultará API)
      return {};
    } catch (error) {
      console.error('❌ Error al obtener mapeo:', error);
      return {};
    }
  },
  
  /**
   * Actualiza el cache de mapeos desde el servidor remoto (asíncrono)
   * SIN usar localStorage
   */
  async actualizarCacheDesdeServidor() {
    try {
      const response = await fetch(`${MAPEOS_SERVER_URL}/mapeos`, {
        headers: {
          'X-Machine-ID': this.getMachineId()
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.ok && data.mapeos) {
          // Actualizar cache en memoria solamente
          this.cacheMapeos = {};
          Object.entries(data.mapeos).forEach(([url, info]) => {
            this.cacheMapeos[url] = info.letra || info;
          });
          
          this.ultimaConsultaAPI = Date.now();
          
          console.log(`✅ Cache de mapeos actualizado (${Object.keys(this.cacheMapeos).length} URLs) - SERVIDOR REMOTO`);
        }
      } else {
        console.warn(`⚠️ Error al consultar servidor de mapeos: ${response.status}`);
      }
    } catch (error) {
      console.warn(`⚠️ No se puede conectar al servidor de mapeos:`, error);
      console.log('📱 Sistema funcionando en modo offline (sin localStorage, solo cache en memoria)');
    }
  },
  
  /**
   * Muestra el estado de la cola
   */
  mostrarEstadoCola() {
    console.log('📊 Estado de la cola:');
    console.log(`- URLs pendientes: ${this.cola.length}`);
    console.log(`- URLs mapeadas: ${Object.keys(this.getMapping()).length}`);
    if (this.cola.length > 0) {
      console.log('- Próximas URLs:', this.cola.slice(0, 5));
    }
  }
};
