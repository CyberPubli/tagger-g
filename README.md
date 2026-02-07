# 🏷️ Tageador Automático para Clientify

Sistema de etiquetado automático de chats y seguimiento de campañas en Clientify.

---

## 📦 ¿Qué contiene esta carpeta?

- **ACTUALIZAR.bat** ← **¡DOBLE CLICK AQUÍ PARA ACTUALIZAR!** 🔄
- **manifest.json** ← Archivo de configuración (no tocar)
- **codigo/** ← Carpeta con el código del sistema (no tocar)

---

## 🚀 INSTALACIÓN (SOLO LA PRIMERA VEZ)

### 1️⃣ Instalar Git (si no lo tienes)
- Descargar de: https://git-scm.com/download/win
- Instalar con las opciones por defecto

### 2️⃣ Clonar el proyecto (solo la primera vez)
```bash
git clone https://github.com/ChasmannJoel/tagfinale.git
```

### 3️⃣ Instalar la extensión en Chrome
1. Abre Chrome
2. Escribe en la barra: `chrome://extensions/`
3. Activa "Modo de desarrollador" (arriba a la derecha)
4. Click en "Cargar extensión sin empaquetar"
5. Selecciona la carpeta completa del proyecto

---

## 🔄 ACTUALIZAR (CADA VEZ QUE HAYA CAMBIOS)

### ¡MUY FÁCIL!

1. **Doble click en `ACTUALIZAR.bat`**
2. Espera a que termine (verás un mensaje verde ✅)
3. Ve a Chrome → `chrome://extensions/`
4. Click en el botón de recargar (🔄) de la extensión

**¡Y LISTO!** Ya tienes la última versión 🎉

---

## 💡 CÓMO USAR LA EXTENSIÓN

### Paso 1: Iniciar
- Click en el ícono de la extensión en Chrome
- Click en **"▶️ Iniciar"**

### Paso 2: Ver el progreso en tiempo real
El panel muestra en vivo:
- 🟢 **Estado**: Si el observer está activo o inactivo
- 📋 **Log de eventos**: Últimas acciones del sistema
- 📊 **Estadísticas**:
  - Chats procesados
  - Mapeos guardados al servidor
  - URLs esperando letra de campaña
  - Errores detectados

### Paso 3: Asignar letras a las URLs (si es necesario)
- Si una URL es nueva, aparecerá una ventana emergente
- Verás la URL de Facebook/Instagram
- Escribe la letra de campaña: **A**, **B**, o **C**
- Click en "Guardar"
- El observer automáticamente reanuda el procesamiento

### Paso 4: Detener
- Click en **"⏹️ Detener"** cuando termines

### Paso 5: Ver estadísticas
- Click en **"Ver Datos"** en el popup (el panel ya muestra todo en tiempo real)

---

## 📊 ¿Qué hace automáticamente?

✅ Detecta todos los mensajes con URLs de Meta  
✅ Genera códigos automáticos (Ej: `13-12-19A`)  
✅ Detecta si el cliente confirmó el pago (añade ❗)  
✅ Carga automáticamente letras previamente mapeadas  
✅ Sincroniza todo al servidor centralizado  
✅ Muestra progreso en tiempo real en el panel  

---

## 🎯 Panel de Control en Tiempo Real

### Indicador de Estado
- **🟢 Verde pulsante**: Observer en ejecución
- **⚫ Gris**: Inactivo (esperando inicio)
- **🔴 Rojo pulsante**: Error detectado

### Eventos
Cada acción importante se registra en el log con:
- ⏰ Hora exacta
- 📌 Descripción de la acción
- 🎨 Color según tipo (éxito, error, advertencia, información)

### Estadísticas Actualizadas
Se actualizan en tiempo real según:
- Chats procesados
- URLs mapeadas al servidor
- URLs en espera de letra
- Total de errores

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Qué hago si me sale error al actualizar?**  
R: Verifica tu conexión a internet y que Git esté instalado

**P: ¿El panel muestra en tiempo real?**  
R: Sí, se actualiza automáticamente conforme el observer procesa chats

**P: ¿Qué pasa si cierro el popup?**  
R: El observer sigue funcionando en Clientify. El popup solo es para monitoreo

**P: ¿Tengo que actualizar todos los días?**  
R: Solo cuando te avisen que hay una nueva versión

**P: ¿Puedo borrar algo de la carpeta "codigo"?**  
R: ¡NO! Todo lo que está ahí es necesario

**P: ¿La extensión funciona sin internet?**  
R: Funciona pero sin sincronizar datos al servidor. Necesitas internet para mapeos centralizados

---

## 🆘 SOPORTE

Si algo no funciona, contacta al equipo técnico con:
- Captura de pantalla del log de eventos (o del error)
- Qué estabas haciendo cuando falló
- La fecha y hora aproximada

---

**Versión:** 2.0  
**Última actualización:** Diciembre 2025  
**Cambios**: Nuevo panel visual con log en tiempo real, eliminado botón "Ver Datos"
