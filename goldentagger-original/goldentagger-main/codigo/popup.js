// Estado del popup
const popupState = {
  isRunning: false,
  logEntries: [],
  maxEntries: 100
};

console.log('popup.js cargado correctamente');

function loadStoredState() {
  chrome.storage.local.get(['popupState'], (result) => {
    if (result.popupState) {
      Object.assign(popupState, result.popupState);
      updateLogUI();
      updateButtonStates(popupState.isRunning);
    }
  });
}

function saveState() {
  chrome.storage.local.set({ popupState: popupState });
}

function addLog(message, type = 'info') {
  const now = new Date();
  const time = now.toLocaleTimeString('es-AR', { hour12: false });
  
  popupState.logEntries.unshift({
    time,
    message,
    type,
    timestamp: Date.now()
  });
  
  if (popupState.logEntries.length > popupState.maxEntries) {
    popupState.logEntries.pop();
  }
  
  updateLogUI();
  saveState();
}

function updateLogUI() {
  const logContainer = document.getElementById('logContainer');
  
  if (popupState.logEntries.length === 0) {
    logContainer.innerHTML = '<div class="empty-log">Esperando actividad...</div>';
    return;
  }
  
  logContainer.innerHTML = popupState.logEntries.map(entry => `
    <div class="log-entry ${entry.type}">
      <span style="color: #64748b;">[${entry.time}]</span> ${entry.message}
    </div>
  `).join('');
  
  logContainer.scrollTop = 0;
}

function updateButtonStates(running) {
  popupState.isRunning = running;
  
  const btnObservar = document.getElementById('observarChatsBtn');
  const btnDetener = document.getElementById('detenerChatsBtn');
  
  if (running) {
    // Activo: desactivar botón de activar, activar botón de detener
    btnObservar.disabled = true;
    btnObservar.classList.remove('active');
    
    btnDetener.disabled = false;
    btnDetener.classList.add('active');
    
    addLog('🟢 Sistema ACTIVO - Click en DETENER para parar', 'success');
  } else {
    // Inactivo: activar botón de activar, desactivar botón de detener
    btnObservar.disabled = false;
    btnObservar.classList.add('active');
    
    btnDetener.disabled = true;
    btnDetener.classList.remove('active');
    
    addLog('🔴 Sistema INACTIVO - Click en ACTIVAR para iniciar', 'warning');
  }
  
  saveState();
}

// Sistema de Mapeos
const mapeoModal = {
  abierto: false,
  mapeos: {},
  SERVIDOR_URL: 'https://accountant-services.co.uk/mapeos',

  async cargarMapeos() {
    try {
      const response = await fetch(this.SERVIDOR_URL);
      const data = await response.json();
      
      if (data.ok && data.mapeos) {
        this.mapeos = data.mapeos;
        chrome.storage.local.set({ urlMappings: this.mapeos });
        addLog('✅ Mapeos sincronizados desde servidor', 'success');
      } else {
        this.cargarMapeosCache();
      }
    } catch (error) {
      console.error('Error al cargar mapeos del servidor:', error);
      this.cargarMapeosCache();
    }
    
    this.actualizarListaMapeos();
  },

  cargarMapeosCache() {
    chrome.storage.local.get(['urlMappings'], (result) => {
      if (result.urlMappings) {
        this.mapeos = result.urlMappings;
        addLog('��� Mapeos cargados desde caché local', 'info');
      } else {
        this.mapeos = {};
      }
    });
  },

  actualizarListaMapeos() {
    const listContainer = document.getElementById('mapeosList');
    const mapeos = this.mapeos;

    if (Object.keys(mapeos).length === 0) {
      listContainer.innerHTML = '<div style="color: #64748b; text-align: center; padding: 30px 20px; font-size: 11px;">��� No hay mapeos</div>';
      return;
    }

    let html = '';
    for (const [url, mapeoData] of Object.entries(mapeos)) {
      const letra = typeof mapeoData === 'string' ? mapeoData : mapeoData.letra;
      
      html += `
        <div class="mapeo-item" data-url="${url}" style="padding: 8px 12px; border-bottom: 1px solid #334155; cursor: pointer; transition: all 0.2s; display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1; min-width: 0; margin-right: 10px;">
            <div style="font-size: 10px; color: #94a3b8; margin-bottom: 2px; text-transform: uppercase; font-weight: bold;">URL</div>
            <div style="font-size: 11px; color: #e2e8f0; word-break: break-all; font-family: 'Courier New', monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${url}</div>
          </div>
          <div style="min-width: 45px; text-align: center; padding: 6px 10px; background: #334155; border-radius: 4px; flex-shrink: 0;">
            <div style="font-size: 9px; color: #94a3b8; text-transform: uppercase; font-weight: bold;">Letra</div>
            <div style="font-size: 16px; font-weight: bold; color: #3b82f6;">${letra}</div>
          </div>
        </div>
      `;
    }
    listContainer.innerHTML = html;

    document.querySelectorAll('.mapeo-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.mapeo-item').forEach(i => {
          i.style.background = '';
        });
        item.style.background = '#334155';
        
        const url = item.getAttribute('data-url');
        const mapeoData = mapeos[url];
        const letra = typeof mapeoData === 'string' ? mapeoData : mapeoData.letra;
        
        document.getElementById('urlOriginal').value = url;
        document.getElementById('letraMapeo').value = letra;
      });
    });
  },

  guardar() {
    const urlOriginal = document.getElementById('urlOriginal').value.trim();
    const letra = document.getElementById('letraMapeo').value.trim().toUpperCase();

    if (!urlOriginal) {
      alert('⚠️ Ingresa una URL o selecciona una de la lista');
      return;
    }

    if (!/^[A-Z]$/.test(letra)) {
      alert('⚠️ Ingresa una letra válida (A-Z)');
      return;
    }

    this.mapeos[urlOriginal] = {
      letra: letra
    };

    const datosMapeo = {
      url: urlOriginal,
      letra: letra
    };

    fetch(this.SERVIDOR_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Machine-ID': 'chrome-extension'
      },
      body: JSON.stringify(datosMapeo)
    })
    .then(response => response.json())
    .then(data => {
      if (data.ok) {
        if (data.mapeo) {
          this.mapeos[urlOriginal] = data.mapeo;
        }
        chrome.storage.local.set({ urlMappings: this.mapeos }, () => {
          addLog(`✅ Letra actualizada: ${urlOriginal} → ${letra}`, 'success');
          this.actualizarListaMapeos();
          document.getElementById('urlOriginal').value = '';
          document.getElementById('letraMapeo').value = '';
        });
      } else {
        alert('❌ Error al guardar: ' + (data.error || 'Error desconocido'));
      }
    })
    .catch(error => {
      console.error('Error al guardar mapeo:', error);
      chrome.storage.local.set({ urlMappings: this.mapeos }, () => {
        addLog(`⚠️ Letra actualizada en caché local: ${urlOriginal} → ${letra}`, 'warning');
        this.actualizarListaMapeos();
      });
    });
  },

  eliminar() {
    const urlOriginal = document.getElementById('urlOriginal').value.trim();

    if (!urlOriginal) {
      alert('⚠️ Selecciona una URL para eliminar');
      return;
    }

    if (confirm(`¿Eliminar mapeo para:\n${urlOriginal}?`)) {
      delete this.mapeos[urlOriginal];
      
      const urlEncoded = encodeURIComponent(urlOriginal);
      fetch(`${this.SERVIDOR_URL}/${urlEncoded}`, {
        method: 'DELETE',
        headers: {
          'X-Machine-ID': 'chrome-extension'
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.ok) {
          chrome.storage.local.set({ urlMappings: this.mapeos }, () => {
            addLog(`���️ Mapeo eliminado: ${urlOriginal}`, 'warning');
            this.actualizarListaMapeos();
            document.getElementById('urlOriginal').value = '';
            document.getElementById('letraMapeo').value = '';
          });
        } else {
          alert('❌ Error al eliminar: ' + (data.error || 'Error desconocido'));
        }
      })
      .catch(error => {
        console.error('Error al eliminar mapeo:', error);
        chrome.storage.local.set({ urlMappings: this.mapeos }, () => {
          addLog(`⚠️ Mapeo eliminado en caché local: ${urlOriginal}`, 'warning');
          this.actualizarListaMapeos();
          document.getElementById('urlOriginal').value = '';
          document.getElementById('letraMapeo').value = '';
        });
      });
    }
  }
};

// Eventos de Mapeos
document.getElementById("mapeoBtn").addEventListener("click", () => {
  const section = document.getElementById("mapeosSection");
  section.classList.add("visible");
  mapeoModal.cargarMapeos();
});

document.getElementById("cerrarMapeoBtn").addEventListener("click", () => {
  const section = document.getElementById("mapeosSection");
  section.classList.remove("visible");
  document.getElementById('urlOriginal').value = '';
  document.getElementById('letraMapeo').value = '';
});

document.getElementById("guardarMapeoBtn").addEventListener("click", () => {
  mapeoModal.guardar();
});

document.getElementById("eliminarMapeoBtn").addEventListener("click", () => {
  mapeoModal.eliminar();
});

// Sistema de Nomenclatura (Paneles)
const nomenclaturaManager = {
  paneles: [],
  panelesActual: null,
  numerosActuales: [],
  SERVIDOR_URL: 'https://accountant-services.co.uk',
  SECRET: 'tu_clave_super_secreta',

  inicializar() {
    this.agregarEventListeners();
  },

  agregarEventListeners() {
    document.getElementById('nomenclaturaBtn').addEventListener('click', () => {
      this.abrirPanel();
    });

    document.getElementById('cerrarNomenclaturaBtn').addEventListener('click', () => {
      this.cerrarPanel();
    });

    document.getElementById('refrescarPanelesBtn').addEventListener('click', () => {
      this.cargarPaneles();
    });

    document.getElementById('abrirFormPanelBtn').addEventListener('click', () => {
      this.mostrarFormulario();
    });

    document.getElementById('agregarPanelBtn').addEventListener('click', () => {
      this.guardarPanel();
    });

    document.getElementById('cancelarFormBtn').addEventListener('click', () => {
      this.cancelarFormulario();
    });

    document.getElementById('cerrarNumerosBtn').addEventListener('click', () => {
      this.cerrarNumerosSection();
    });

    document.getElementById('agregarNumeroBtn').addEventListener('click', () => {
      this.agregarNumero();
    });

    // Permitir agregar número al presionar Enter
    document.getElementById('nuevoNumero').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.agregarNumero();
      }
    });

    // Event listeners para botones de arranque/detener
    document.getElementById("observarChatsBtn").addEventListener("click", async () => {
      console.log('Click en observar chats');
      addLog('🚀 Iniciando observador de chats...', 'info');
      
      try {
        // Enviar al background primero (que inyectará scripts)
        chrome.runtime.sendMessage(
          { action: "observarChats" },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error('Background error:', chrome.runtime.lastError);
              addLog('⚠️ Error en background: ' + chrome.runtime.lastError.message, 'error');
            }
          }
        );
        
        // Luego enviar a las tabs (con retraso para inyección)
        setTimeout(async () => {
          const tabs = await chrome.tabs.query({ url: "https://new.clientify.com/team-inbox/*" });
          console.log('Tabs encontrados:', tabs.length);
          
          if (tabs.length === 0) {
            addLog('⚠️ No hay pestañas de Clientify abiertas', 'warning');
            return;
          }
          
          tabs.forEach((tab, index) => {
            chrome.tabs.sendMessage(tab.id, { action: "observarChats" }, (response) => {
              if (chrome.runtime.lastError) {
                console.error(`Tab ${index} error:`, chrome.runtime.lastError);
              } else {
                console.log(`Tab ${index} respondió a observarChats`);
              }
            });
          });
          
          updateButtonStates(true);
          addLog(`✅ Observador iniciado en ${tabs.length} pestaña(s)`, 'success');
        }, 500); // Esperar 500ms para que se inyecten los scripts
      } catch (error) {
        console.error('Error en observar:', error);
        addLog('❌ Error: ' + error.message, 'error');
      }
    });

    document.getElementById("detenerChatsBtn").addEventListener("click", async () => {
      console.log('Click en detener chats');
      try {
        const tabs = await chrome.tabs.query({ url: "https://new.clientify.com/team-inbox/*" });
        
        if (tabs.length === 0) {
          addLog('No hay pestañas de Clientify abiertas', 'error');
          return;
        }
        
        chrome.runtime.sendMessage({ action: "detenerChats" }).catch(() => {
          console.error('Error enviando mensaje al background');
        });
        
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { action: "detenerChats" }).catch(() => {});
        });
        
        updateButtonStates(false);
        addLog('Observador detenido', 'warning');
      } catch (error) {
        console.error('Error en detener:', error);
        addLog('Error: ' + error.message, 'error');
      }
    });

    // Los paneles de nomenclatura y mapeos se abren manualmente con sus botones
    // NO se abren por defecto
  },

  abrirPanel() {
    const section = document.getElementById('nomenclaturaSection');
    section.classList.add('visible');
    this.cargarPaneles();
  },

  cerrarPanel() {
    const section = document.getElementById('nomenclaturaSection');
    section.classList.remove('visible');
    this.cancelarFormulario();
    this.cerrarNumerosSection();
  },

  async cargarPaneles() {
    try {
      const listContainer = document.getElementById('panelesList');
      listContainer.innerHTML = '<div class="loading-spinner">⏳ Cargando paneles...</div>';

      // Solicitar paneles al background.js (sin CORS)
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { action: 'obtenerPaneles' },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          }
        );
      });

      if (response && response.success && response.paneles) {
        this.paneles = response.paneles;
        this.renderizarPaneles();
      } else {
        throw new Error('Respuesta inválida');
      }
    } catch (error) {
      console.error('Error cargando paneles:', error);
      document.getElementById('panelesList').innerHTML = 
        `<div style="color: #ef4444; padding: 15px; text-align: center; font-size: 11px;">❌ Error: ${error.message}</div>`;
      addLog(`❌ Error cargando paneles: ${error.message}`, 'error');
    }
  },

  renderizarPaneles() {
    const listContainer = document.getElementById('panelesList');
    
    if (this.paneles.length === 0) {
      listContainer.innerHTML = '<div style="color: #94a3b8; text-align: center; padding: 20px; font-size: 11px;">📭 No hay paneles</div>';
      return;
    }

    let html = '';
    this.paneles.forEach(panel => {
      html += `
        <div class="panel-item" data-id="${panel.id}">
          <div class="panel-info">
            <div class="panel-id">ID: ${panel.id}</div>
            <div class="panel-nombre">${panel.nombre || 'Sin nombre'}</div>
          </div>
          <div class="panel-actions">
            <button class="numeros-btn" data-action="numeros" data-id="${panel.id}">📱</button>
            <button class="edit-btn" data-action="edit" data-id="${panel.id}">✏️</button>
            <button class="delete-btn" data-action="delete" data-id="${panel.id}">🗑️</button>
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;
    
    // Agregar event listeners a los botones
    listContainer.querySelectorAll('[data-action="numeros"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id);
        this.abrirNumerosSection(id);
      });
    });

    listContainer.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id);
        this.editarPanel(id);
      });
    });
    
    listContainer.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id);
        this.confirmarEliminar(id);
      });
    });
  },

  mostrarFormulario() {
    this.panelesActual = null;
    document.getElementById('idPanel').value = '';
    document.getElementById('idPanel').disabled = false;
    document.getElementById('nombrePanel').value = '';
    document.getElementById('nomenclaturaForm').style.display = 'flex';
    document.getElementById('abrirFormPanelBtn').style.display = 'none';
    document.getElementById('idPanel').focus();
  },

  cancelarFormulario() {
    document.getElementById('nomenclaturaForm').style.display = 'none';
    document.getElementById('abrirFormPanelBtn').style.display = 'block';
    document.getElementById('idPanel').value = '';
    document.getElementById('nombrePanel').value = '';
    this.panelesActual = null;
  },

  editarPanel(id) {
    const panel = this.paneles.find(p => p.id === id);
    if (!panel) return;

    this.panelesActual = panel;
    document.getElementById('idPanel').value = panel.id;
    document.getElementById('idPanel').disabled = false;
    document.getElementById('nombrePanel').value = panel.nombre || '';
    document.getElementById('nomenclaturaForm').style.display = 'flex';
    document.getElementById('abrirFormPanelBtn').style.display = 'none';
    document.getElementById('nombrePanel').focus();
  },

  async guardarPanel() {
    const nombre = document.getElementById('nombrePanel').value.trim();
    const idInput = document.getElementById('idPanel').value.trim();
    
    if (!nombre) {
      alert('⚠️ Ingresa un nombre para el panel');
      return;
    }

    if (!idInput) {
      alert('⚠️ Ingresa un ID para el panel');
      return;
    }

    const nuevoId = parseInt(idInput);
    if (isNaN(nuevoId) || nuevoId < 1) {
      alert('⚠️ El ID debe ser un número válido mayor a 0');
      return;
    }

    try {
      let response;
      if (this.panelesActual) {
        // Editar panel existente
        const body = { 
          secret: this.SECRET,
          nombre: nombre
        };
        
        // Agregar newId si se cambió
        if (nuevoId !== this.panelesActual.id) {
          body.newId = nuevoId;
        }
        
        response = await fetch(`${this.SERVIDOR_URL}/paneles/${this.panelesActual.id}/`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      } else {
        // Crear panel nuevo - numero es obligatorio, inicia con un número placeholder
        response = await fetch(`${this.SERVIDOR_URL}/paneles/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            secret: this.SECRET,
            nombre: nombre,
            numero: ["0"] // Array con valor por defecto, se agregarán números después
          })
        });
      }

      const data = await response.json();

      if (data.ok) {
        const accion = this.panelesActual ? 'actualizado' : 'creado';
        addLog(`✅ Panel ${accion}: ${nombre} (ID: ${nuevoId})`, 'success');
        
        // Invalidar cache en background para que recargue
        chrome.runtime.sendMessage({ action: 'invalidarCachePaneles' });
        
        this.cancelarFormulario();
        // Pequeño delay para asegurar que el servidor procesó
        await new Promise(resolve => setTimeout(resolve, 300));
        await this.cargarPaneles();
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error guardando panel:', error);
      alert(`❌ Error: ${error.message}`);
      addLog(`❌ Error guardando panel: ${error.message}`, 'error');
    }
  },

  confirmarEliminar(id) {
    const panel = this.paneles.find(p => p.id === id);
    if (!panel) return;

    const nombre = panel.nombres && panel.nombres[0] ? panel.nombres[0] : panel.nombre || 'Sin nombre';
    
    if (confirm(`¿Estás seguro de que deseas eliminar el panel "${nombre}"?`)) {
      this.eliminarPanel(id);
    }
  },

  async eliminarPanel(id) {
    try {
      const response = await fetch(`${this.SERVIDOR_URL}/paneles/${id}/?secret=${encodeURIComponent(this.SECRET)}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.ok) {
        addLog(`🗑️ Panel eliminado correctamente`, 'warning');
        
        // Invalidar cache en background
        chrome.runtime.sendMessage({ action: 'invalidarCachePaneles' });
        
        await this.cargarPaneles();
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error eliminando panel:', error);
      alert(`❌ Error: ${error.message}`);
      addLog(`❌ Error eliminando panel: ${error.message}`, 'error');
    }
  },

  abrirNumerosSection(id) {
    const panel = this.paneles.find(p => p.id === id);
    if (!panel) return;

    this.panelesActual = panel;
    this.numerosActuales = Array.isArray(panel.numero) ? [...panel.numero] : [];

    // Mostrar la sección de números con el nombre del panel
    document.getElementById('nombrePanelNumeros').textContent = panel.nombre;
    document.getElementById('numerosSection').classList.add('visible');
    document.getElementById('nomenclaturaForm').style.display = 'none';
    document.getElementById('abrirFormPanelBtn').style.display = 'none';

    // Renderizar números existentes
    this.renderizarNumeros();

    // Limpiar input y enfocarlo
    document.getElementById('nuevoNumero').value = '';
    document.getElementById('nuevoNumero').focus();
  },

  cerrarNumerosSection() {
    document.getElementById('numerosSection').classList.remove('visible');
    document.getElementById('abrirFormPanelBtn').style.display = 'block';
    this.panelesActual = null;
    this.numerosActuales = [];
  },

  renderizarNumeros() {
    const listContainer = document.getElementById('numerosList');

    if (this.numerosActuales.length === 0) {
      listContainer.innerHTML = '<div style="color: #94a3b8; text-align: center; padding: 15px; font-size: 10px;">Sin números agregados</div>';
      return;
    }

    let html = '';
    this.numerosActuales.forEach((numero, index) => {
      html += `
        <div class="numero-item">
          <span class="numero-valor">${numero}</span>
          <button class="numero-delete" data-index="${index}">✕</button>
        </div>
      `;
    });

    listContainer.innerHTML = html;

    // Agregar event listeners a los botones de eliminar
    listContainer.querySelectorAll('.numero-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.eliminarNumero(index);
      });
    });
  },

  async agregarNumero() {
    const input = document.getElementById('nuevoNumero');
    const numero = input.value.trim();

    if (!numero) {
      alert('⚠️ Ingresa un número de teléfono');
      return;
    }

    // Evitar duplicados
    if (this.numerosActuales.includes(numero)) {
      alert('⚠️ Este número ya está en la lista');
      input.focus();
      return;
    }

    this.numerosActuales.push(numero);
    this.renderizarNumeros();
    input.value = '';
    input.focus();

    // Guardar cambios en el servidor
    await this.guardarNumerosPanel();
  },

  eliminarNumero(index) {
    this.numerosActuales.splice(index, 1);
    this.renderizarNumeros();

    // Guardar cambios en el servidor
    this.guardarNumerosPanel();
  },

  async guardarNumerosPanel() {
    if (!this.panelesActual) return;

    try {
      const response = await fetch(`${this.SERVIDOR_URL}/paneles/${this.panelesActual.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: this.SECRET,
          numero: this.numerosActuales
        })
      });

      const data = await response.json();

      if (data.ok) {
        addLog(`✅ Números actualizados para panel "${this.panelesActual.nombre}"`, 'success');
        
        // Actualizar el panel local
        const panelIndex = this.paneles.findIndex(p => p.id === this.panelesActual.id);
        if (panelIndex >= 0) {
          this.paneles[panelIndex].numero = [...this.numerosActuales];
        }
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error guardando números:', error);
      addLog(`❌ Error guardando números: ${error.message}`, 'error');
    }
  }
};

// Escuchar mensajes desde el content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "popupEvent") {
    const { event, type = 'info', data } = message;
    
    switch(event) {
      case 'scrolling':
        addLog(`⬇️ Scrolleando chat...`, 'action');
        break;
      case 'tagearChat':
        addLog(`���️ Tageando chat en ${data.panel}`, 'action');
        break;
      case 'urlMapped':
        addLog(`✅ URL mapeada: ${data.url} → ${data.letra}`, 'success');
        break;
      case 'urlWaiting':
        addLog(`⏸️ URL esperando: ${data.url}`, 'warning');
        break;
      case 'observerStarted':
        addLog('��� Observer iniciado en Clientify', 'success');
        updateButtonStates(true);
        break;
      case 'observerStopped':
        addLog('⏹️ Observer detenido', 'warning');
        updateButtonStates(false);
        break;
      case 'error':
        addLog(`❌ Error: ${data.message}`, 'error');
        break;
      case 'panelDetected':
        addLog(`��� Panel detectado: ${data.panel}`, 'info');
        break;
      case 'nomemclaturaGenerated':
        addLog(`��� Nomenclatura: ${data.value}`, 'success');
        break;
      default:
        addLog(`${event}`, type);
    }
  }
});

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded - Inicializando popup...');
    loadStoredState();
    addLog('Panel cargado', 'info');
    nomenclaturaManager.inicializar();
  });
} else {
  // El DOM ya está listo
  console.log('DOM ya estaba listo - Inicializando popup...');
  loadStoredState();
  addLog('Panel cargado', 'info');
  nomenclaturaManager.inicializar();
}
