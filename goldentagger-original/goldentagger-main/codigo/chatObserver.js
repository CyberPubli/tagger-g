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

// --- Módulo para observar chats ---
window.chatObserver = {
  stopProcess: false,
  scrollTimeoutId: null,
  pausado: false,
  callbackReanudar: null,
  ejecucionEnProgreso: false,  // ⭐ NUEVA BANDERA
  
  scrollAndObserveChats() {
    // En lugar de hacer scroll, obtener directamente los primeros 20 chats visibles
    const chatDivs = chatOpener.getFirst20ChatsWithoutScroll();
    console.log(`🚀 [Observer] Iniciando observación de ${chatDivs.length} chats sin scroll`);
    if (chatDivs.length === 0) {
      console.warn("⚠️ No se encontraron chats con emoji 🕐.");
      sendPopupEvent('noChatFound', 'warning', { reason: 'no chats found' });
      return;
    }
    this.iterateObserveChats(chatDivs);
  },
  
  iterateObserveChats(chatDivs) {
    let index = 0;
    const self = this;
    
    // ⭐ Evitar múltiples ejecuciones simultáneas
    if (this.ejecucionEnProgreso) {
      console.warn('⚠️ [Observer] Ya hay una ejecución en progreso, ignorando nueva solicitud');
      return;
    }
    
    this.ejecucionEnProgreso = true;
    
    // FUNCIÓN LIMPIA QUE PROCESA UN CHAT
    async function procesarChatActual() {
      // Verificar si debe detenerse
      if (self.stopProcess) {
        self.ejecucionEnProgreso = false;  // ⭐ MARCAR COMO COMPLETA AL DETENER
        console.log("⏹️ [Observer] Proceso detenido por usuario");
        return;
      }
      
      // ¿Terminó todos los chats?
      if (index >= chatDivs.length) {
        self.ejecucionEnProgreso = false;  // ⭐ MARCAR COMO COMPLETA
        console.log(`✅ [Observer] CICLO COMPLETADO - Procesados ${chatDivs.length} chats`);
        console.log(`⏳ [Observer] Esperando 3 segundos antes de reiniciar con los PRIMEROS 20 nuevamente...`);
        
        setTimeout(() => {
          if (!self.stopProcess) {
            console.log("🔄 [Observer] REINICIANDO - Volviendo a los PRIMEROS 20 chats");
            self.scrollAndObserveChats();
          }
        }, 3000);
        return;
      }
      
      const chatNum = index + 1;
      const chat = chatDivs[index];
      
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🔍 [Observer] CHAT ${chatNum}/${chatDivs.length}`);
      console.log(`${'='.repeat(50)}`);
      
      // PASO 1: Verificar que el chat existe
      if (!chat) {
        console.warn(`❌ Chat ${chatNum}: div no disponible`);
        index++;
        await new Promise(r => setTimeout(r, 800));
        return procesarChatActual();
      }
      
      // PASO 2: Click en el chat
      console.log(`1️⃣ Clickeando chat ${chatNum}...`);
      chat.scrollIntoView({ behavior: "smooth", block: "center" });
      chat.click();
      
      // Esperar a que se cargue el DOM - AUMENTAR A 3000ms para chats lentos
      await new Promise(r => setTimeout(r, 3000));
      
      // PASO 3: Verificar que cargó
      let chatWindow = document.querySelector('.mui-npbckn');
      let intentosCarga = 0;
      
      // Si no está, intentar esperar más
      while (!chatWindow && intentosCarga < 10) {
        console.log(`   ⏳ Esperando a que cargue el chat (intento ${intentosCarga + 1}/10)...`);
        await new Promise(r => setTimeout(r, 500));
        chatWindow = document.querySelector('.mui-npbckn');
        intentosCarga++;
      }
      
      if (!chatWindow) {
        console.error(`❌ Chat ${chatNum}: No se cargó la ventana después de ${intentosCarga * 500 + 3000}ms`);
        index++;
        await new Promise(r => setTimeout(r, 800));
        return procesarChatActual();
      }
      
      console.log(`2️⃣ Chat ${chatNum}: Ventana cargada ✓`);
      
      // PASO 4: Scrollear el chat
      chatWindow.scrollBy({ top: 120, behavior: 'smooth' });
      await new Promise(r => setTimeout(r, 1500));
      
      // PASO 5: Detectar caídas
      console.log(`3️⃣ Detectando caídas...`);
      let caidaDetectada = false;
      try {
        if (typeof alertManager !== 'undefined' && typeof alertManager.procesarCaida === 'function') {
          caidaDetectada = await alertManager.procesarCaida();
        }
      } catch (error) {
        console.warn(`[Observer] Error al detectar caída:`, error);
      }
      
      if (caidaDetectada) {
        console.log(`🚨 Chat ${chatNum}: CAÍDA DETECTADA - Saltando`);
        index++;
        await new Promise(r => setTimeout(r, 800));
        return procesarChatActual();
      }
      
      // PASO 6: Extraer información
      console.log(`4️⃣ Extrayendo información...`);
      let urlInfo = await urlDetector.extractUrlFromChat();
      
      // Si detectó caída, saltar este chat
      if (urlInfo && urlInfo.caida) {
        console.log(`🚨 Chat ${chatNum}: CAÍDA DETECTADA Y PROCESADA - Saltando`);
        index++;
        await new Promise(r => setTimeout(r, 800));
        return procesarChatActual();
      }
      
      if (!urlInfo) {
        console.warn(`❌ Chat ${chatNum}: No se extrajo información - Saltando`);
        index++;
        await new Promise(r => setTimeout(r, 800));
        return procesarChatActual();
      }
      
      console.log(`   Panel: ${urlInfo.panel || urlInfo.panelOriginal || 'desconocido'}`);
      console.log(`   URL: ${urlInfo.url || 'sin URL'}`);
      console.log(`   Nomenclatura: ${urlInfo.nomenclatura || 'SIN'}`);
      
      // PASO 7: Verificar nomenclatura
      if (!urlInfo.nomenclatura) {
        console.log(`⏭️ Chat ${chatNum}: SALTADO - Sin nomenclatura`);
        index++;
        await new Promise(r => setTimeout(r, 800));
        return procesarChatActual();
      }
      
      // PASO 8: Verificar si necesita letra de campaña
      const urlFinal = urlInfo.url && urlInfo.url !== 'Sin URL' ? urlInfo.url : 'Sin URL';
      if (urlFinal !== 'Sin URL' && !urlInfo.letraCampana) {
        console.log(`⏸️ Chat ${chatNum}: PAUSADO - Esperando letra de campaña`);
        self.pausado = true;
        sendPopupEvent('urlWaiting', 'warning', { url: urlFinal });
        
        // Guardar callback para reanudar después
        self.callbackReanudar = async () => {
          console.log(`▶️ Chat ${chatNum}: REANUDANDO`);
          self.pausado = false;
          
          const urlInfoActualizada = await urlDetector.extractUrlFromChat();
          if (urlInfoActualizada && urlInfoActualizada.nomenclaturas) {
            const nomenclaturasActualizadas = urlInfoActualizada.nomenclaturas;
            console.log(`📋 Nomenclaturas actualizadas: ${nomenclaturasActualizadas.map(n => n.nomenclatura).join(', ')}`);
            
            // Tagear con las nuevas nomenclaturas
            await self.tagearMultiplesEnObservacionesAsync(nomenclaturasActualizadas, chatNum);
          } else {
            console.warn(`⚠️ Chat ${chatNum}: No se pudo obtener letra, saltando`);
          }
          
          // CONTINUAR AL SIGUIENTE
          index++;
          await new Promise(r => setTimeout(r, 800));
          return procesarChatActual();
        };
        return;
      }
      
      // PASO 9: TAGEAR
      console.log(`5️⃣ Tageando...`);
      const nomenclaturas = urlInfo.nomenclaturas || [{ nomenclatura: urlInfo.nomenclatura }];
      await self.tagearMultiplesEnObservacionesAsync(nomenclaturas, chatNum);
      
      console.log(`✅ Chat ${chatNum}: COMPLETADO`);
      
      // PASO 10: SIGUIENTE CHAT
      index++;
      await new Promise(r => setTimeout(r, 800));
      return procesarChatActual();
    }
    
    // INICIAR EL LOOP
    procesarChatActual();
  },
  
  /**
   * Versión async de tagearMultiplesEnObservaciones
   */
  async tagearMultiplesEnObservacionesAsync(nomenclaturas, chatNum) {
    console.log(`   6️⃣ Abriendo Observaciones...`);
    
    const chatWindow = document.querySelector('.mui-npbckn');
    if (!chatWindow) {
      console.error(`❌ Chat ${chatNum}: Chat window no encontrada`);
      return;
    }
    
    // Buscar Observaciones
    const obsP = Array.from(chatWindow.querySelectorAll('p')).find(
      p => /Observaci[oó]n(es)?/i.test(p.textContent)
    );
    
    if (!obsP) {
      console.warn(`❌ Chat ${chatNum}: No encontró "Observaciones"`);
      return;
    }
    
    console.log(`   ✓ Sección Observaciones encontrada`);
    
    // Simular hover para que aparezca el botón
    obsP.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    await new Promise(r => setTimeout(r, 500));
    
    // Buscar botón de edición
    let editBtn = obsP.querySelector('button.btn-edit');
    if (!editBtn) {
      console.warn(`❌ Chat ${chatNum}: No encontró botón de edición`);
      // Intentar buscar de otra forma
      const allBtns = Array.from(obsP.querySelectorAll('button'));
      console.warn(`   Botones encontrados: ${allBtns.length}`);
      allBtns.forEach((btn, i) => {
        console.warn(`     [${i}] ${btn.className} - ${btn.textContent}`);
      });
      return;
    }
    
    console.log(`   ✓ Botón de edición encontrado`);
    
    // Click en botón
    editBtn.click();
    console.log(`   💬 Clickeado botón de edición`);
    
    // Esperar a que se abra el modal y cargue el textarea
    await new Promise(r => setTimeout(r, 1200));
    
    // Buscar textarea
    let textarea = document.querySelector('textarea.mui-16j0ffk');
    if (!textarea) {
      console.warn(`❌ Chat ${chatNum}: No encontró textarea`);
      
      // Intentar encontrar el textarea de otra forma
      const allTextareas = document.querySelectorAll('textarea');
      console.warn(`   Total textareas en la página: ${allTextareas.length}`);
      
      if (allTextareas.length > 0) {
        console.warn(`   Usando la primera textarea...`);
        textarea = allTextareas[0];
      } else {
        console.error(`   ❌ No hay textareas disponibles`);
        return;
      }
    }
    
    console.log(`   ✓ Textarea encontrado`);
    
    // Modificar textarea
    const actual = textarea.value.trim();
    let codigos = actual.split(',').map(c => c.trim()).filter(c => c.length > 0);
    
    console.log(`      Códigos actuales: [${codigos.join(', ') || 'VACÍO'}]`);
    
    let huboModificaciones = false;
    
    for (const nomItem of nomenclaturas) {
      const nomenclatura = nomItem.nomenclatura;
      const nomenclaturaSinSigno = nomenclatura.replace(/!$/, '');
      const tieneSignoNuevo = nomenclatura.endsWith('!');
      
      // ¿Ya existe el código base (sin signo)?
      let indiceExistente = codigos.findIndex(c => c.replace(/!$/, '') === nomenclaturaSinSigno);
      
      if (indiceExistente === -1) {
        // No existe, agregarlo
        console.log(`      ➕ Agregando: "${nomenclatura}"`);
        codigos.push(nomenclatura);
        huboModificaciones = true;
      } else {
        // Existe el código base. Verificar si necesita el signo
        const codigoExistente = codigos[indiceExistente];
        const tieneSignoExistente = codigoExistente.endsWith('!');
        
        if (tieneSignoNuevo && !tieneSignoExistente) {
          // Tiene carga pero el guardado no tiene signo - ACTUALIZAR
          console.log(`      🔄 Actualizando: "${codigoExistente}" → "${nomenclatura}" (agregando !)`);
          codigos[indiceExistente] = nomenclatura;
          huboModificaciones = true;
        } else {
          // Ya está igual o no necesita cambios
          console.log(`      ✓ "${codigoExistente}" ya está correcto`);
        }
      }
    }
    
    if (!huboModificaciones) {
      console.log(`      ℹ️ Sin cambios, cerrando modal...`);
      // Buscar botón cancelar
      const cancelBtn = document.querySelector('button[aria-label="Cancelar"]');
      if (cancelBtn) {
        cancelBtn.click();
        console.log(`      ✓ Modal cerrado`);
      }
      return;
    }
    
    // Guardar cambios
    console.log(`   7️⃣ Guardando cambios...`);
    const nuevoValor = codigos.join(', ');
    
    // Actualizar textarea
    textarea.value = nuevoValor;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log(`      Nuevo valor: [${nuevoValor}]`);
    
    // Esperar a que procese el cambio
    await new Promise(r => setTimeout(r, 1200));
    
    // Buscar y clickear el botón Guardar
    const saveBtn = document.querySelector('button[aria-label="Guardar"]');
    if (saveBtn) {
      console.log(`      ✓ Botón Guardar encontrado`);
      saveBtn.click();
      console.log(`      💾 Clickeado Guardar`);
      
      // Esperar a que se guarde
      await new Promise(r => setTimeout(r, 1500));
      console.log(`      ✅ Guardado completado`);
    } else {
      console.warn(`      ❌ No encontró botón Guardar`);
      
      // Mostrar todos los botones disponibles
      const allBtns = document.querySelectorAll('button');
      console.warn(`      Total botones en la página: ${allBtns.length}`);
      Array.from(allBtns).slice(0, 10).forEach((btn, i) => {
        const label = btn.getAttribute('aria-label') || 'sin label';
        console.warn(`        [${i}] aria-label="${label}" | text="${btn.textContent.trim()}"`);
      });
    }
  },
  
  /**
   * Función auxiliar para tagear MÚLTIPLES nomenclaturas en Observaciones
   * @param {Array} nomenclaturas - Array de objetos {nomenclatura, letra, tieneCarga}
   * @param {number} chatIndex - Índice del chat actual
   * @param {Function} onComplete - Callback para ejecutar después de tagear
   */
  tagearMultiplesEnObservaciones(nomenclaturas, chatIndex, onComplete) {
    const self = this;
    const chatWindow = document.querySelector('.mui-npbckn');
    
    // Notificar que está tajeando
    sendPopupEvent('tagearChat', 'action', { nomenclaturas: nomenclaturas.map(n => n.nomenclatura).join(', ') });
    
    const obsP = chatWindow && Array.from(chatWindow.querySelectorAll('p')).find(
      p => /Observaci[oó]n(es)?/i.test(p.textContent)
    );
    
    if (obsP) {
      // Simular hover para mostrar el botón de edición
      const mouseOverEvent = new MouseEvent('mouseover', { bubbles: true });
      obsP.dispatchEvent(mouseOverEvent);
      
      setTimeout(() => {
        const editBtn = obsP.querySelector('button.btn-edit');
        if (editBtn) {
          editBtn.click();
          
          // Intentar encontrar el textarea con reintentos
          let intentos = 0;
          const maxIntentos = 8;
          
          function buscarTextareaYTaggear() {
            const textarea = document.querySelector('textarea.mui-16j0ffk');
            if (textarea) {
              const actual = textarea.value.trim();
              let codigos = actual.split(',').map(c => c.trim()).filter(c => c.length > 0);
              
              let huboModificaciones = false;
              
              // Procesar cada nomenclatura
              for (const nomItem of nomenclaturas) {
                const nomenclatura = nomItem.nomenclatura;
                const nomenclaturaSinSigno = nomenclatura.replace(/!$/, '');
                
                // PRIMERO: Buscar coincidencia EXACTA (mismo código con o sin signo)
                let indiceExistente = codigos.findIndex(c => c.replace(/!$/, '') === nomenclaturaSinSigno);
                
                // SEGUNDO: Si no hay coincidencia exacta, buscar si el código ya existe como BASE
                // (por ejemplo, si tenemos "15-12-36" sin letra y ahora llega "15-12-36B")
                if (indiceExistente === -1) {
                  const baseNomenclatura = nomenclaturaSinSigno.replace(/[A-Z]!?$/, ''); // Quitar última letra si existe
                  indiceExistente = codigos.findIndex(c => {
                    const cSinSigno = c.replace(/!$/, '');
                    const cBase = cSinSigno.replace(/[A-Z]!?$/, '');
                    return cBase === baseNomenclatura && cSinSigno === baseNomenclatura; // Solo si es la base exacta
                  });
                  
                  if (indiceExistente !== -1) {
                    const codigoExistente = codigos[indiceExistente];
                    console.log(`🔄 [Observer] Reemplazando "${codigoExistente}" con versión con letra: "${nomenclatura}"`);
                    codigos[indiceExistente] = nomenclatura;
                    huboModificaciones = true;
                    continue;
                  }
                }
                
                if (indiceExistente !== -1) {
                  const codigoExistente = codigos[indiceExistente];
                  
                  // Si existe con diferente signo, solo reemplazar si el NUEVO tiene ! y el viejo NO
                  if (codigoExistente !== nomenclatura) {
                    const viejoTieneSigno = codigoExistente.endsWith('!');
                    const nuevoTieneSigno = nomenclatura.endsWith('!');
                    
                    if (nuevoTieneSigno && !viejoTieneSigno) {
                      // CORRECTO: Actualizar de 13-12-35A → 13-12-35A!
                      console.log(`🔄 [Observer] Actualizando con carga: "${codigoExistente}" → "${nomenclatura}"`);
                      codigos[indiceExistente] = nomenclatura;
                      huboModificaciones = true;
                    } else if (!nuevoTieneSigno && viejoTieneSigno) {
                      // INCORRECTO: NO quitar el signo si ya está
                      console.log(`⚠️ [Observer] "${codigoExistente}" ya tiene carga, NO se quita el signo`);
                    } else {
                      console.log(`✅ [Observer] "${nomenclatura}" ya existe correctamente`);
                    }
                  } else {
                    console.log(`✅ [Observer] "${nomenclatura}" ya existe correctamente`);
                  }
                } else {
                  // No existe, agregar
                  console.log(`➕ [Observer] Agregando "${nomenclatura}"`);
                  codigos.push(nomenclatura);
                  huboModificaciones = true;
                }
              }
              
              if (!huboModificaciones) {
                console.log(`✅ [Observer] Chat ${chatIndex + 1} ya tiene todas las nomenclaturas correctas`);
                const cancelBtn = document.querySelector('button[aria-label="Cancelar"]');
                if (cancelBtn) cancelBtn.click();
                setTimeout(onComplete, 600);
              } else {
                // Guardar cambios
                const nuevoValor = codigos.join(', ');
                textarea.value = nuevoValor;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                
                setTimeout(() => {
                  const saveBtn = document.querySelector('button[aria-label="Guardar"]');
                  if (saveBtn) {
                    saveBtn.click();
                    console.log(`✅ [Observer] Chat ${chatIndex + 1} tageado correctamente`);
                    setTimeout(onComplete, 1000);
                  } else {
                    console.warn('[Observer] No se encontró el botón Guardar');
                    setTimeout(onComplete, 600);
                  }
                }, 600);
              }
            } else if (intentos < maxIntentos) {
              intentos++;
              setTimeout(buscarTextareaYTaggear, 400);
            } else {
              console.warn('[Observer] No se encontró el textarea tras varios intentos');
              setTimeout(onComplete, 600);
            }
          }
          
          setTimeout(buscarTextareaYTaggear, 1200);
        } else {
          console.warn('[Observer] No se encontró el botón de edición');
          setTimeout(onComplete, 600);
        }
      }, 200);
    } else {
      console.warn('[Observer] No se encontró el <p> Observaciones');
      setTimeout(onComplete, 600);
    }
  },
  
  startObserveIteration() {
    console.log('🔍 Iniciando observación CONTINUA y TAGEO automático de chats de HOY...');
    console.log('♻️ El observer buscará y tageará nuevos chats cada 30 segundos automáticamente');
    this.stopProcess = false;
    sendPopupEvent('observerStarted', 'success');
    this.scrollAndObserveChats();
  },
  
  stopObserveIteration() {
    this.stopProcess = true;
    sendPopupEvent('observerStopped', 'warning');
    if (this.scrollTimeoutId) {
      clearTimeout(this.scrollTimeoutId);
      this.scrollTimeoutId = null;
    }
    console.log("⏹️ [Observer] Observación continua detenida.");
  },
  
  /**
   * Reanuda el observer después de asignar letra de campaña
   */
  reanudarObserver() {
    if (this.pausado && this.callbackReanudar) {
      this.callbackReanudar();
      this.callbackReanudar = null;
    }
  }
};
