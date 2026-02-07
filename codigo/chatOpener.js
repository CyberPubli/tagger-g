// --- Módulo para abrir chats ---
console.log('📦 [chatOpener] Iniciando carga...');

const chatOpener = {
  stopProcess: false,
  scrollTimeoutId: null,
  openedChats: new Set(),
  
  getChatElements() {
    return Array.from(document.querySelectorAll('p'))
      .filter(p => p.textContent.includes('🕐'))
      .map(p => p.closest('div'))
      .filter(div => !div.closest('[data-skip-cyberboti="true"]')); // Excluir chats marcados como Cyber BOTI
  },
  
  /**
   * Obtiene los primeros 25 chats SIN hacer scroll
   * IMPORTANTE: Scrollea a ARRIBA primero para asegurar que siempre obtiene los PRIMEROS 25
   * @returns {Array} Array de divs de chat (máximo 25)
   */
  getFirst25ChatsWithoutScroll() {
    // ⭐ PRIMERO: Scroll a la posición superior para obtener desde el inicio
    const scrollContainer = document.querySelector('.MuiBox-root.mui-2m10ek');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
      console.log('⬆️ [getFirst25Chats] Scrolleado a ARRIBA - Obteniendo desde el inicio');
    }
    
    // Obtener todos los chats
    const allChats = this.getChatElements();
    console.log(`🔍 [getFirst25Chats] Total de chats en la página: ${allChats.length}`);
    
    // LIMITAR A LOS PRIMEROS 25
    const chatsLimitados = allChats.slice(0, 25);
    console.log(`✅ [getFirst25Chats] PROCESANDO EXACTAMENTE ${chatsLimitados.length} PRIMEROS CHATS`);
    
    if (chatsLimitados.length === 0) {
      console.warn('⚠️ [getFirst25Chats] ¡NO SE ENCONTRARON CHATS!');
    }
    
    return chatsLimitados;
  },
  
  scrollChatsContainerToEnd() {
    const scrollContainer = document.querySelector('.MuiBox-root.mui-2m10ek');
    if (scrollContainer && typeof scrollContainer.scrollHeight === 'number') {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
      console.log('⬇️ Buscando chats...');
    } else {
      console.warn('[AutoTag] No se encontró el contenedor de chats o scrollHeight no está disponible.');
    }
  },
  
  hasStopEmoji() {
    return Array.from(document.querySelectorAll('p.MuiTypography-root.MuiTypography-body1.mui-194rj03'))
      .some(p => p.textContent.includes('🤚🏻'));
  },
  
  scrollChatsUntilStopOrEnd(onFinish) {
    let lastScrollTop = -1;
    let reachedEnd = false;
    const self = this;
    
    // Enviar evento de scrolleo
    function sendPopupEvent(event, type = 'info', data = {}) {
      chrome.runtime.sendMessage({
        action: 'popupEvent',
        event,
        type,
        data
      }).catch(err => {});
    }
    
    function scrollUntilStopOrEnd() {
      if (self.stopProcess) {
        console.log("⏹️ [AutoTag] Proceso detenido durante el scroll.");
        return;
      }
      
      const scrollContainer = document.querySelector('.MuiBox-root.mui-2m10ek');
      
      if (self.hasStopEmoji()) {
        console.log("🛑 Emoji de stop encontrado, deteniendo el scroll. Abriendo todos los chats con emoji 🕐 visibles.");
        sendPopupEvent('scrolling', 'action', { status: 'stop emoji found' });
        reachedEnd = true;
      } else if (scrollContainer) {
        if (scrollContainer.scrollTop === lastScrollTop && scrollContainer.scrollTop >= scrollContainer.scrollHeight - scrollContainer.clientHeight) {
          console.log("🏁 Fin del scroll detectado. Abriendo todos los chats con emoji 🕐 visibles.");
          sendPopupEvent('scrolling', 'action', { status: 'end reached' });
          reachedEnd = true;
        } else {
          sendPopupEvent('scrolling', 'action', { status: 'scrolling' });
          self.scrollChatsContainerToEnd();
          lastScrollTop = scrollContainer.scrollTop;
        }
      }
      
      if (reachedEnd) {
        const chatDivs = self.getChatElements();
        console.log(`Encontrados ${chatDivs.length} chats con emoji 🕐.`);
        if (chatDivs.length === 0) {
          console.warn("⚠️ No se encontraron chats con emoji 🕐.");
          return;
        }
        if (typeof onFinish === 'function') onFinish(chatDivs);
        return;
      }
      
      self.scrollTimeoutId = setTimeout(scrollUntilStopOrEnd, 3000);
    }
    
    scrollUntilStopOrEnd();
  },
  
  scrollAndOpenChats() {
    this.scrollChatsUntilStopOrEnd(this.iterateChats.bind(this));
  },
  
  iterateChats(chatDivs) {
    let index = 0;
    const self = this;
    
    function clickNextChat() {
      if (self.stopProcess) {
        console.log("⏹️ Proceso detenido por el usuario.");
        return;
      }
      
      if (index >= chatDivs.length) {
        console.log("✅ Terminó de abrir todos los chats.");
        return;
      }
      
      const chat = chatDivs[index];
      if (chat) {
        chat.scrollIntoView({ behavior: "smooth", block: "center" });
        chat.click();
        console.log(`💬 Chat ${index + 1} abierto`);
        self.openedChats.add(chat);
        
        setTimeout(() => {
          const chatWindow = document.querySelector('.mui-npbckn');
          if (chatWindow && typeof chatWindow.scrollTop === 'number') {
            chatWindow.scrollBy({ top: 120, behavior: 'smooth' });
          }
          index++;
          setTimeout(clickNextChat, 4000);
        }, 1200);
      } else {
        index++;
        setTimeout(clickNextChat, 4000);
      }
    }
    
    clickNextChat();
  },
  
  startChatIteration() {
    this.stopProcess = false;
    this.openedChats.clear();
    this.scrollAndOpenChats();
  },
  
  stopChatIteration() {
    this.stopProcess = true;
    if (this.scrollTimeoutId) {
      clearTimeout(this.scrollTimeoutId);
      this.scrollTimeoutId = null;
      console.log("⏹️ [AutoTag] Scroll automático detenido.");
    }
  }
};

// ✅ Hacer disponible globalmente
window.chatOpener = chatOpener;
console.log('✅ [chatOpener] Cargado y disponible en window.chatOpener');
