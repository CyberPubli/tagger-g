const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const SERVER_URL = 'http://localhost:3066';
const SERVER_SECRET = 'tu_clave_super_secreta';
const ALERT_PORT = 3333;
const mensajesPendientes = {};


const ADMIN_NUMBERS = [
  '5492236049325@c.us',
  '201726443393252@lid'
];

const SUPER_ADMIN_NUMBERS = [
  '201726443393252@lid'
];





function esSuperAdmin(numero) {
  return SUPER_ADMIN_NUMBERS.includes(numero);
}

function esAdmin(numero) {
  return ADMIN_NUMBERS.includes(numero);
}

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'cyberbot' }),
  puppeteer: {
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ],
    timeout: 120000
  }
});

const app = express();
app.use(bodyParser.json());

async function notificarAdmins(mensaje) {
  for (const numero of ADMIN_NUMBERS) {
    try {
      await enviarMensajeSeguro(numero, mensaje);
    } catch (err) {
      console.error(`Error notificando a ${numero}:`, err);
    }
  }
}

// ============ ENDPOINT DE ALERTAS ============
app.post('/alert', async (req, res) => {
  const { id, nombre, numero } = req.body;

  if (!id || !nombre || !numero) {
    return res.status(400).json({ ok: false, error: 'Faltan parámetros (id, nombre, numero)' });
  }

  const alerta = `🚨 ALERTA CRÍTICA:\n\n❌ La línea "${nombre}" (${numero.replace('@c.us', '')}) NO RESPONDE.\n\nID Panel: ${id}\n\nAcción requerida: Revisa la línea inmediatamente.`;
  
  console.log(`🔔 Alerta recibida: ${nombre} (${numero})`);
  await notificarAdmins(alerta);

  res.json({ ok: true, message: 'Alerta notificada a admins' });
});

async function enviarMensajeSeguro(chatId, mensaje, esperarAckMs = 10000) {
  if (!isReady) {
    console.log('⏸️ Cliente no listo, cancelando envío');
    return { entregado: false, error: 'Cliente no listo' };
  }
  try {
    // Enviar mensaje y esperar ACK de entrega
    const msg = await client.sendMessage(chatId, mensaje);
    if (!msg || !msg.id || !msg.id.id) {
      return { entregado: false, error: 'No se obtuvo ID de mensaje' };
    }
    const entregado = await esperarAck(msg.id.id, esperarAckMs);
    return { entregado };
  } catch (e) {
    console.error(`❌ No se pudo enviar a ${chatId}: ${e.message}`);
    return { entregado: false, error: e.message };
  }
}

function esperarAck(msgId, timeout) {
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      delete mensajesPendientes[msgId];
      resolve(false);
    }, timeout);
    mensajesPendientes[msgId] = {
      resolve: (entregado = true) => {
        clearTimeout(timer);
        resolve(entregado);
      },
      ack: null
    };
  });
}

async function agregarPanel(nombre, numero) {
  try {
    const res = await axios.post(`${SERVER_URL}/paneles`, { nombre, numero, secret: SERVER_SECRET });
    await actualizarPaneles();
    return res.data.id;
  } catch (e) {
    console.error('Error agregando panel:', e.response?.data || e.message);
    return null;
  }
}

async function eliminarPanel(id) {
  try {
    const res = await axios.delete(`${SERVER_URL}/paneles/${id}`, {
      params: { secret: SERVER_SECRET }
    });
    await actualizarPaneles();
    return res.data.ok;
  } catch (e) {
    console.error('Error eliminando panel:', e.response?.data || e.message);
    return false;
  }
}

async function listarPaneles(adminNumber) {
  try {
    const res = await axios.get(`${SERVER_URL}/paneles`, {
      params: {
        secret: SERVER_SECRET
      }
    });
    const panelesList = res.data.paneles;
    const lines = panelesList.map(p => {
      const numeros = Array.isArray(p.numero) ? p.numero.map(n => n.replace('@c.us', '')).join(', ') : (p.numero ? p.numero.replace('@c.us', '') : 'sin numero');
      return `- ${p.nombre} (${numeros})`;
    });
    const mensaje = `Lista de paneles (${panelesList.length}):\n` + lines.join('\n');
    await enviarMensajeSeguro(adminNumber, mensaje);
  } catch (e) {
    console.error('Error listando paneles:', e.response?.data || e.message);
    await enviarMensajeSeguro(adminNumber, 'Error al obtener la lista de paneles.');
  }
}
// Actualizar paneles desde el server con números
async function actualizarPaneles() {
  try {
    const res = await axios.get(`${SERVER_URL}/paneles`, {
      params: { secret: SERVER_SECRET }
    });
    paneles = res.data.paneles || [];
    console.log('Paneles actualizados:', paneles.map(p => `${p.nombre} => ${p.numero}`).join(', '));
  } catch (e) {
    console.error('Error actualizando paneles:', e.message);
    paneles = [];
  }
}

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('message_ack', (msg, ack) => {
  if (mensajesPendientes[msg.id.id] && ack >= 2) {
    mensajesPendientes[msg.id.id].ack = ack;
    mensajesPendientes[msg.id.id].resolve(true);
    delete mensajesPendientes[msg.id.id];
  }
});

client.on('message', async message => {
  if (!message.body.startsWith('!')) return;
  console.log('📨 DEBUG - Mensaje recibido de:', message.from);
  console.log('📨 DEBUG - Contenido:', message.body);
  console.log('📨 DEBUG - Admin list:', ADMIN_NUMBERS);
  console.log('📨 DEBUG - Es admin?:', esAdmin(message.from));
  if (!esAdmin(message.from)) {
    await enviarMensajeSeguro(message.from, '❌ No tienes permisos para ejecutar comandos de administrador.');
    return;
  }
  const args = message.body.slice(1).split(' ');
  const command = args[0].toLowerCase();
  console.log('📨 DEBUG - Comando:', command, '| Args:', args);
  
  if (command === 'agregar' && args.length === 3) {
    if (!esSuperAdmin(message.from)) return await enviarMensajeSeguro(message.from, '❌ Solo el superadmin puede agregar paneles.');
    let numero = args[2];
    if (!/^\d+$/.test(numero)) return await enviarMensajeSeguro(message.from, '⚠️ Número solo dígitos.');
    if (!numero.includes('@c.us')) numero += '@c.us';
    await agregarPanel(args[1], numero);
    await enviarMensajeSeguro(message.from, `✅ Panel ${args[1]} (${numero}) agregado.`);
  } else if (command === 'eliminar' && args.length >= 2) {
    if (!esSuperAdmin(message.from)) return await enviarMensajeSeguro(message.from, '❌ Solo el superadmin puede eliminar paneles.');
    const id = parseInt(args[1]);
    if (isNaN(id)) return await enviarMensajeSeguro(message.from, '⚠️ ID debe ser un número.');
    const eliminado = await eliminarPanel(id);
    await enviarMensajeSeguro(message.from, eliminado ? `✅ Panel ID ${id} eliminado.` : `⚠️ No se encontró el panel con ID ${id}.`);
  } else if (command === 'codigo') {
    const param = args[1];
    const now = new Date();
    const DD = String(now.getDate()).padStart(2, '0');
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    if (param) {
      let p = null;
      if (/^\d+$/.test(param)) {
        const idNum = Number(param);
        p = paneles.find(x => x.id === idNum);
      } else {
        const lower = param.toLowerCase();
        p = paneles.find(x => x.nombre.toLowerCase() === lower) || paneles.find(x => x.nombre.toLowerCase().includes(lower));
      }
      if (!p) return await enviarMensajeSeguro(message.from, `⚠️ No se encontró el panel ${param}.`);
      const code = p.id ? `${DD}-${MM}-${p.id}` : '';
      const texto = `Panel ${p.nombre}\nId: ${p.id ?? '(sin id)'}\nCódigo: ${code || '(sin id)'}`;
      await enviarMensajeSeguro(message.from, texto);
    } else {
      const sorted = [...paneles].sort((a, b) => {
        const ai = typeof a.id === 'number' ? a.id : Number.POSITIVE_INFINITY;
        const bi = typeof b.id === 'number' ? b.id : Number.POSITIVE_INFINITY;
        if (ai !== bi) return ai - bi;
        return a.nombre.localeCompare(b.nombre);
      });
      const allNames = sorted.map(p => p.nombre);
      const maxName = Math.max(...allNames.map(n => n.length), 5);
      const header = ['PANEL'.padEnd(maxName), 'ID', 'CODIGO'].join(' ');
      const grouped = {};
      for (const p of sorted) {
        const key = (typeof p.id === 'number') ? `id:${p.id}` : `noid:${p.nombre.toLowerCase()}`;
        if (!grouped[key]) grouped[key] = { id: (typeof p.id === 'number') ? p.id : null, panels: [] };
        grouped[key].panels.push(p);
      }
      const orderedKeys = Object.keys(grouped).sort((a, b) => {
        const aId = grouped[a].id;
        const bId = grouped[b].id;
        if (aId === null && bId === null) return a.localeCompare(b);
        if (aId === null) return 1;
        if (bId === null) return -1;
        return aId - bId;
      });
      const rows = [];
      for (const key of orderedKeys) {
        const group = grouped[key];
        const panels = group.panels;
        const idVal = group.id;
        const code = idVal ? `${DD}-${MM}-${idVal}` : '';
        const first = panels[0];
        const nameS = first.nombre.padEnd(maxName, ' ');
        const idS = idVal ? String(idVal).padStart(3, ' ') : ' ';
        rows.push(`${nameS} ${idS} ${code}`);
        if (panels.length > 1) {
          for (let i = 1; i < panels.length; i++) {
            const p = panels[i];
            const nameExtra = p.nombre.padEnd(maxName, ' ');
            rows.push(`${nameExtra}     `);
          }
        }
      }
      const table = ['```', header, ...rows, '```'].join('\n');
      await enviarMensajeSeguro(message.from, table);
    }
  } else if (command === 'listar') {
    await listarPaneles(message.from);
    await enviarMensajeSeguro(message.from, '✅ Lista enviada.');
  } else if (command === 'purge' && args.length >= 2) {
    await enviarMensajeSeguro(message.from, '⚠️ El comando purge ya no está disponible.');
  } else {
    await enviarMensajeSeguro(message.from, '⚠️ Comando desconocido.');
  }
});

client.on('ready', async () => {
  isReady = true;

  console.log('🚀 Bot listo y autenticado');
  console.log('📥 Cargando paneles...');
  await actualizarPaneles();
  console.log('✅ Paneles cargados:', paneles.length, 'panel(es)');
});

client.on('disconnected', async (reason) => {
  isReady = false;
  console.log('❌ Bot desconectado:', reason);
});

client.on('auth_failure', (msg) => {
  isReady = false;
  console.log('❌ Error de autenticación:', msg);
  setTimeout(() => client.initialize(), 15000);
});

client.on('error', (err) => {
  isReady = false;
  console.error('❌ Error del cliente:', err);
});

console.log('🟢 Iniciando cliente de WhatsApp...');
try {
  client.initialize();
  console.log('🟢 client.initialize() llamado correctamente. Esperando eventos...');
} catch (err) {
  console.error('❌ Error al llamar a client.initialize():', err);
}

// ============ SERVIDOR DE ALERTAS ============
app.listen(ALERT_PORT, '0.0.0.0', () => {
  console.log(`📡 Servidor de alertas escuchando en puerto ${ALERT_PORT}`);
  console.log(`🔔 POST http://localhost:${ALERT_PORT}/alert`);
});


