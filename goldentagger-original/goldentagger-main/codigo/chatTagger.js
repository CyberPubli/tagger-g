// --- Módulo para tagear chats ---
const chatTagger = {
  stopProcess: false,
  scrollTimeoutId: null,
  
  scrollAndTagChats() {
    const chatDivs = chatOpener.getFirst20ChatsWithoutScroll();
    console.log(`🚀 [Tagear] Iniciando tageo de ${chatDivs.length} chats sin scroll`);
    if (chatDivs.length === 0) {
      console.warn("⚠️ No se encontraron chats con emoji 🕐.");
      return;
    }
    this.iterateTagChats(chatDivs);
  },
  
  iterateTagChats(chatDivs) {
    let index = 0;
    const self = this;
    
    async function procesarChat() {
      if (self.stopProcess) {
        console.log("⏹️ Proceso de tagear detenido por el usuario.");
        return;
      }
      
      if (index >= chatDivs.length) {
        console.log("✅ Terminó de tagear todos los chats.");
        return;
      }
      
      const chat = chatDivs[index];
      const chatNum = index + 1;
      const totalChats = chatDivs.length;
      
      console.log(`\n${'='.repeat(50)}`);
      console.log(`📌 PROCESANDO CHAT ${chatNum}/${totalChats}`);
      console.log(`${'='.repeat(50)}`);
      
      if (!chat) {
        console.warn(`❌ Chat ${chatNum}: Div NO está disponible`);
        index++;
        setTimeout(procesarChat, 3000);
        return;
      }
      
      // PASO 1: Click en el chat
      console.log(`1️⃣ STEP 1: Clickeando chat ${chatNum}...`);
      chat.scrollIntoView({ behavior: "smooth", block: "center" });
      chat.click();
      
      // Esperar a que se cargue el chat
      setTimeout(async () => {
        console.log(`   ⏳ Esperando a que cargue el contenido del chat...`);
        
        // PASO 2: Verificar que el chat se abrió
        let chatCargado = false;
        for (let intento = 0; intento < 5; intento++) {
          const chatWindow = document.querySelector('.mui-npbckn');
          if (chatWindow) {
            console.log(`   ✅ Chat window cargada en intento ${intento + 1}`);
            chatCargado = true;
            break;
          }
          await new Promise(r => setTimeout(r, 1000));
        }
        
        if (!chatCargado) {
          console.error(`   ❌ No se pudo cargar el chat window`);
          index++;
          setTimeout(procesarChat, 3000);
          return;
        }
        
        // PASO 3: Scrollear el contenido
        const chatWindow = document.querySelector('.mui-npbckn');
        if (chatWindow) {
          chatWindow.scrollBy({ top: 120, behavior: 'smooth' });
          console.log(`2️⃣ STEP 2: Chat scrolleado`);
        }
        
        // Esperar a que se estabilice
        await new Promise(r => setTimeout(r, 2000));
        
        // PASO 4: Extraer información
        console.log(`3️⃣ STEP 3: Extrayendo información del chat...`);
        const urlInfo = await window.urlDetector.extractUrlFromChat();
        
        if (!urlInfo) {
          console.warn(`   ❌ No se obtuvo información (urlInfo es nulo)`);
          index++;
          setTimeout(procesarChat, 3000);
          return;
        }
        
        console.log(`   ✅ urlInfo obtenida:`);
        console.log(`      - Panel: ${urlInfo.panel || 'sin panel'}`);
        console.log(`      - URL: ${urlInfo.url || 'sin URL'}`);
        console.log(`      - URLs de hoy: ${urlInfo.urlsDeHoy ? urlInfo.urlsDeHoy.length : 0}`);
        console.log(`      - Nomenclatura: ${urlInfo.nomenclatura || 'SIN NOMENCLATURA'}`);
        
        if (!urlInfo.nomenclatura) {
          console.log(`⏭️ Chat ${chatNum}: SALTADO - No tiene nomenclatura`);
          index++;
          setTimeout(procesarChat, 2000);
          return;
        }
        
        const nomenclatura = urlInfo.nomenclatura;
        console.log(`✅ Usando nomenclatura: "${nomenclatura}"`);
        
        // PASO 5: Buscar sección Observaciones
        console.log(`4️⃣ STEP 4: Buscando sección "Observaciones"...`);
        const obsP = Array.from(document.querySelectorAll('p')).find(
          p => /Observaci[oó]n(es)?/i.test(p.textContent)
        );
        
        if (!obsP) {
          console.warn(`   ❌ NO se encontró sección "Observaciones"`);
          index++;
          setTimeout(procesarChat, 3000);
          return;
        }
        
        console.log(`   ✅ Sección Observaciones encontrada`);
        
        // PASO 6: Buscar botón de edición con reintentos
        console.log(`5️⃣ STEP 5: Buscando botón de edición...`);
        
        // Simular hover
        obsP.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        
        let editBtn = null;
        for (let intento = 0; intento < 5; intento++) {
          await new Promise(r => setTimeout(r, 300));
          editBtn = obsP.querySelector('button.btn-edit');
          if (editBtn) {
            console.log(`   ✅ Botón de edición encontrado en intento ${intento + 1}`);
            break;
          }
        }
        
        if (!editBtn) {
          console.warn(`   ❌ NO se encontró botón de edición`);
          index++;
          setTimeout(procesarChat, 3000);
          return;
        }
        
        // PASO 7: Click en botón de edición
        console.log(`6️⃣ STEP 6: Clickeando botón de edición...`);
        editBtn.click();
        
        // PASO 8: Buscar textarea
        console.log(`7️⃣ STEP 7: Buscando textarea para editar...`);
        
        let textarea = null;
        for (let intento = 0; intento < 10; intento++) {
          await new Promise(r => setTimeout(r, 500));
          textarea = document.querySelector('textarea.mui-16j0ffk');
          if (textarea) {
            console.log(`   ✅ Textarea encontrado en intento ${intento + 1}`);
            break;
          }
        }
        
        if (!textarea) {
          console.error(`   ❌ NO se encontró textarea tras 10 intentos`);
          index++;
          setTimeout(procesarChat, 3000);
          return;
        }
        
        // PASO 9: Modificar el textarea
        console.log(`8️⃣ STEP 8: Modificando contenido...`);
        
        const actual = textarea.value.trim();
        let codigos = actual.split(',').map(c => c.trim()).filter(c => c.length > 0);
        
        console.log(`   Códigos actuales: [${codigos.join(', ') || 'ninguno'}]`);
        console.log(`   Nomenclatura a agregar: "${nomenclatura}"`);
        
        // Remover signos para comparación base (DD-MM-ID)
        const nomenclaturaSinSigno = nomenclatura.replace(/!$/, '');
        let indiceExistente = codigos.findIndex(c => c.replace(/!$/, '') === nomenclaturaSinSigno);
        
        let seGuardó = false;
        
        if (indiceExistente !== -1) {
          // La base ya existe (mismo DD-MM-ID)
          const codigoExistente = codigos[indiceExistente];
          console.log(`   ℹ️ Código YA EXISTE: "${codigoExistente}"`);
          
          // Comparar exactamente
          if (codigoExistente !== nomenclatura) {
            const viejoTieneSigno = codigoExistente.endsWith('!');
            const nuevoTieneSigno = nomenclatura.endsWith('!');
            
            // Solo actualizar si el nuevo tiene ! y el viejo no
            if (nuevoTieneSigno && !viejoTieneSigno) {
              console.log(`   🔄 ACTUALIZAR: "${codigoExistente}" → "${nomenclatura}"`);
              codigos[indiceExistente] = nomenclatura;
              seGuardó = true;
            } else {
              console.log(`   ✓ Código ya es correcto, sin cambios`);
            }
          } else {
            console.log(`   ✓ Código exactamente igual, sin cambios`);
          }
        } else {
          // Es una nomenclatura nueva (diferente DD-MM-ID o diferente letra)
          console.log(`   ➕ AGREGANDO código "${nomenclatura}"`);
          codigos.push(nomenclatura);
          seGuardó = true;
        }
        
        // PASO 10: Guardar si hay cambios
        if (!seGuardó) {
          console.log(`9️⃣ STEP 9: Sin cambios, cerrando sin guardar...`);
          const cancelBtn = document.querySelector('button[aria-label="Cancelar"]');
          if (cancelBtn) {
            cancelBtn.click();
            console.log(`   ✅ Modal cerrada`);
          }
        } else {
          console.log(`9️⃣ STEP 9: Guardando cambios...`);
          const nuevoValor = codigos.join(', ');
          textarea.value = nuevoValor;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          console.log(`   Nuevo valor: [${nuevoValor}]`);
          
          // Esperar a que se procese el change
          await new Promise(r => setTimeout(r, 1500));
          
          // Buscar y clickear botón Guardar
          console.log(`🔟 STEP 10: Buscando botón Guardar...`);
          const saveBtn = document.querySelector('button[aria-label="Guardar"]');
          
          if (!saveBtn) {
            console.warn(`   ❌ Botón Guardar NO encontrado`);
            const allBtns = document.querySelectorAll('button');
            console.log(`   📋 Botones disponibles:`);
            Array.from(allBtns).forEach((btn, i) => {
              const label = btn.getAttribute('aria-label') || 'sin label';
              const text = btn.textContent.trim() || 'sin texto';
              console.log(`      [${i}] aria-label="${label}" | text="${text}"`);
            });
          } else {
            console.log(`   ✅ Botón Guardar encontrado`);
            saveBtn.click();
            console.log(`   👆 Click ejecutado`);
            
            // Esperar a que se guarde
            await new Promise(r => setTimeout(r, 2000));
            console.log(`✅ Chat ${chatNum}: PROCESADO Y GUARDADO ✓`);
          }
        }
        
        // PASO 11: Siguiente chat
        console.log(`\n⏳ Esperando antes del siguiente chat...`);
        index++;
        setTimeout(procesarChat, 3000);
        
      }, 2000); // Espera inicial después del click
    }
    
    procesarChat();
  },
  
  startTagIteration() {
    console.log('🏷️ Iniciando proceso de tageo automático con nomenclaturas del observer...');
    this.stopProcess = false;
    this.scrollAndTagChats();
  },
  
  stopTagIteration() {
    this.stopProcess = true;
    if (this.scrollTimeoutId) {
      clearTimeout(this.scrollTimeoutId);
      this.scrollTimeoutId = null;
      console.log("⏹️ [Tagear] Scroll automático detenido.");
    }
  }
};
