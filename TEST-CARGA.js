// ============================================
// COPIAR Y PEGAR ESTE CÓDIGO EN LA CONSOLA
// ============================================

(function() {
  console.clear();
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 TEST DE DETECCIÓN DE MENSAJE DE CARGA');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const frasesObjetivo = [
    'segui los pasos a continuacion para que tu acr3dit4ci0n se procese sin demoras',
    'segui los pasos a continuacion para que tu acr3ditacion se procese sin demoras'
  ];
  console.log('📝 Frases buscadas (normalizadas):');
  frasesObjetivo.forEach((frase, i) => {
    console.log(`   [${i + 1}] "${frase}" (${frase.length} caracteres)`);
  });
  console.log();
  
  // Buscar contenedor
  const messagesContainer = document.querySelector('.MuiBox-root.mui-ylizsf');
  if (!messagesContainer) {
    console.error('❌ ERROR: No se encontró el contenedor de mensajes');
    return;
  }
  console.log('✅ Contenedor encontrado\n');
  
  // Obtener todos los mensajes
  const allMessages = messagesContainer.querySelectorAll('div[id^="message-"]');
  console.log(`📨 Total mensajes: ${allMessages.length}\n`);
  
  let encontrado = false;
  let mensajesHoy = 0;
  let mensajesAgente = 0;
  
  allMessages.forEach((msg, i) => {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📬 MENSAJE ${i + 1}/${allMessages.length}`);
    
    // Verificar timestamp
    const timeBox = msg.querySelector('.MuiBox-root.mui-186zjq8[aria-label]');
    let esHoy = false;
    let timestamp = 'Sin timestamp';
    let relativeTime = '';
    
    if (timeBox) {
      timestamp = timeBox.getAttribute('aria-label');
      console.log(`   🕐 ${timestamp}`);
      
      // Verificar si es de hoy
      const timeTexts = timeBox.querySelectorAll('p.MuiTypography-root.mui-2ehu0i');
      for (let t of timeTexts) {
        const txt = t.textContent.trim();
        if (txt.includes('minuto') || txt.includes('hora') || txt.includes('día')) {
          relativeTime = txt;
          break;
        }
      }
      
      esHoy = relativeTime.includes('minuto') || relativeTime.includes('hora');
      console.log(`   📅 Es de HOY: ${esHoy ? '✅' : '❌'} (${relativeTime || 'sin hora'})`);
      
      if (esHoy) mensajesHoy++;
    } else {
      console.log('   ⏭️ Sin timestamp (ANALIZANDO DE TODAS FORMAS)');
    }
    
    // Verificar si es del cliente
    const esCliente = msg.querySelector('[data-contact-message="true"]') || 
                     msg.classList.contains('contact-message');
    console.log(`   👤 ${esCliente ? '🟢 CLIENTE' : '🔵 AGENTE'}`);
    
    if (esCliente) {
      console.log('   ⏭️ Es del cliente, saltando...\n');
      return;
    }
    mensajesAgente++;
    
    // PRIMERO: Buscar en TODO el texto del mensaje completo
    const textoCompleto = msg.textContent;
    const textoCompletoNormalizado = textoCompleto
      .toLowerCase()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/[.,!?¿¡]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log(`\n   📝 TEXTO COMPLETO DEL MENSAJE:`);
    console.log(`      📜 Original: "${textoCompleto.substring(0, 200)}${textoCompleto.length > 200 ? '...' : ''}"`);
    console.log(`      🔤 Normalizado: "${textoCompletoNormalizado.substring(0, 200)}${textoCompletoNormalizado.length > 200 ? '...' : ''}"`);
    console.log(`      Longitud: ${textoCompletoNormalizado.length} caracteres`);
    
    // Intentar encontrar cualquiera de las frases
    let fraseEncontrada = null;
    let indiceEncontrado = -1;
    
    for (let frase of frasesObjetivo) {
      const indice = textoCompletoNormalizado.indexOf(frase);
      if (indice >= 0) {
        fraseEncontrada = frase;
        indiceEncontrado = indice;
        break;
      }
    }
    
    console.log(`      🔍 Buscando en 2 variantes...`);
    if (fraseEncontrada) {
      console.log(`      ✅ Coincidencia encontrada`);
      console.log(`      💡 Posición: ${indiceEncontrado}`);
      console.log(`      💡 Contexto: "...${textoCompletoNormalizado.substring(Math.max(0, indiceEncontrado - 20), indiceEncontrado + fraseEncontrada.length + 20)}..."`);
    } else {
      console.log(`      ❌ Ninguna variante coincide`);
    }
    
    if (fraseEncontrada) {
      console.log(`\n   🎯🎯🎯 ¡ENCONTRADO EN TEXTO COMPLETO! 🎯🎯🎯`);
      encontrado = true;
    }
    
    // SEGUNDO: Buscar en párrafos individuales (para debug)
    const ps = msg.querySelectorAll('p');
    console.log(`\n   📝 Párrafos individuales: ${ps.length}`);
    
    ps.forEach((p, pi) => {
      const original = p.textContent;
      console.log(`      [${pi + 1}] "${original.substring(0, 50)}${original.length > 50 ? '...' : ''}"`);
    });
  });
  
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('📊 RESUMEN');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📨 Mensajes totales: ${allMessages.length}`);
  console.log(`📅 Mensajes de hoy: ${mensajesHoy}`);
  console.log(`🔵 Del agente (hoy): ${mensajesAgente}`);
  console.log(`\n🎯 ${encontrado ? '✅ CARGA DETECTADA' : '❌ NO DETECTADA'}`);
  console.log('═══════════════════════════════════════════════════════\n');
  
  if (!encontrado && mensajesAgente > 0) {
    console.log('💡 La frase debe ser exactamente:');
    console.log('   "Seguí los pasos a continuación para que tu ACR3DIT4CI0N se procese sin demoras"');
  }
})();
