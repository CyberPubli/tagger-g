# 📦 INSTALACIÓN DE LA EXTENSIÓN - PASO A PASO

## ⚠️ IMPORTANTE ANTES DE COMENZAR

**REQUISITOS:** 
- ✅ Tener Google Chrome instalado en tu PC
- ✅ Instalar Git (te explico cómo más abajo)

---

## 🔧 PASO 0: INSTALAR GIT (OBLIGATORIO)

### ¿Qué es Git?
Es un programa que permite descargar y actualizar el proyecto automáticamente.

### Instalación de Git:

1. **Descargá Git desde:** https://git-scm.com/download/win

2. **Ejecutá el archivo descargado** (Git-2.XX.X-64-bit.exe)

3. **Se abre el instalador. Seguí estos pasos:**

#### Pantalla 1: Licencia
   - Click en **"Next"** (Siguiente)

#### Pantalla 2: Select Destination Location
   - Dejá la ruta por defecto
   - Click en **"Next"**

#### Pantalla 3: Select Components
   - **Dejá TODO como está** (con los ✅ que vienen por defecto)
   - Click en **"Next"**

#### Pantalla 4: Select Start Menu Folder
   - Dejá "Git" como está
   - Click en **"Next"**

#### Pantalla 5: Choosing the default editor
   - **MUY IMPORTANTE:** Seleccioná **"Use Notepad as Git's default editor"** (es más simple)
   - Click en **"Next"**

#### Pantalla 6: Adjusting the name of the initial branch
   - Dejá la opción por defecto seleccionada
   - Click en **"Next"**

#### Pantalla 7: Adjusting your PATH environment
   - **Dejá seleccionado:** "Git from the command line and also from 3rd-party software"
   - Click en **"Next"**

#### Pantalla 8: Choosing HTTPS transport backend
   - Dejá "Use the OpenSSL library" seleccionado
   - Click en **"Next"**

#### Pantalla 9: Configuring the line ending conversions
   - Dejá "Checkout Windows-style, commit Unix-style line endings"
   - Click en **"Next"**

#### Pantalla 10: Configuring the terminal emulator
   - Dejá "Use MinTTY (the default terminal of MSYS2)"
   - Click en **"Next"**

#### Pantalla 11: Choose the default behavior of 'git pull'
   - Dejá la primera opción seleccionada
   - Click en **"Next"**

#### Pantalla 12: Choose a credential helper
   - Dejá "Git Credential Manager" seleccionado
   - Click en **"Next"**

#### Pantalla 13: Configuring extra options
   - Dejá las opciones por defecto
   - Click en **"Next"**

#### Pantalla 14: Configuring experimental options
   - **NO marques nada** (dejá todo sin ✅)
   - Click en **"Install"**

4. **Esperá a que termine la instalación** (puede tardar 1-2 minutos)

5. **Click en "Finish"**

6. **¡Git ya está instalado!** 🎉

---

## 🔽 PASO 1: DESCARGAR EL PROYECTO CON GIT

1. **Hacé click derecho en el Escritorio**

2. **Seleccioná:** "Git Bash Here" (si no aparece, buscá "Git Bash" en el menú inicio)

3. **Se abre una ventana negra** (es normal, es la consola de Git)

4. **Copiá y pegá este comando** (Ctrl+C para copiar, click derecho en la ventana para pegar):
   ```
   git clone https://github.com/ChasmannJoel/tagfinale.git
   ```

5. **Presioná Enter**

6. **Esperá a que termine** (vas a ver mensajes descargando archivos)

7. **Cuando termine** verás un mensaje como "done" o "hecho"

8. **Cerrá la ventana negra**

9. **En tu Escritorio** ahora hay una carpeta llamada **"tagfinale"**

10. **⚠️ IMPORTANTE:** Podés renombrarla si querés (por ejemplo: `observador-clientify`), pero recordá el nombre que le pusiste

---

## 🎯 PASO 2: CARGAR LA EXTENSIÓN EN CHROME

### 2.1 - Abrir Chrome y configuración de extensiones

1. **Abrí Google Chrome**

2. **En la barra de dirección** (donde ponés las URLs), **escribí:**
   ```
   chrome://extensions/
   ```
   Y presioná **Enter**

3. **Activá el "Modo de desarrollador":**
   - Arriba a la derecha verás un interruptor que dice **"Modo de desarrollador"**
   - **Hacé click** para activarlo (debe quedar en azul/verde)

### 2.2 - Cargar la extensión

4. **Hacé click en** el botón **"Cargar extensión sin empaquetar"** (aparece arriba a la izquierda)

5. **Buscá la carpeta** `tagfinale` (o el nombre que le pusiste) en el Escritorio

6. **⚠️ MUY IMPORTANTE:** 
   - **Seleccioná la carpeta completa** (no entres adentro de ella)
   - **Debe ser la carpeta que descargaste con Git**
   - **Verificá que adentro tenga:** `manifest.json`, `ACTUALIZAR.bat`, carpeta `codigo`

7. **Hacé click en "Seleccionar carpeta"**

8. **¡LISTO!** La extensión ahora debe aparecer en la lista con el nombre **"Observador AutoTag"**

---

## ✅ VERIFICAR QUE ESTÁ INSTALADA

Deberías ver una tarjeta con:
- 📛 Nombre: **Observador AutoTag**
- 🔢 Versión: **1.0**
- 📝 Descripción: "Observa y etiqueta chats automáticamente..."
- ✅ Un interruptor activado (azul)

---

## 🚀 CÓMO USAR LA EXTENSIÓN

1. **Entrá a Clientify:** https://new.clientify.com/team-inbox/

2. **Hacé click en el ícono de la extensión** (arriba a la derecha en Chrome, al lado de la barra de direcciones)

3. **Se abre un menú con 3 botones:**
   - **Iniciar Observación** → Para empezar a detectar chats
   - **Ver Datos** → Para ver las estadísticas
   - **Detener** → Para pausar el observador

4. **Hacé click en "Iniciar Observación"**

5. **Cuando aparezca una ventana emergente pidiendo una letra (A, B, C):**
   - Verás la URL del anuncio
   - Escribí la letra que corresponda a esa campaña
   - Click en "Guardar"

6. **¡Y listo!** El sistema empieza a trabajar automáticamente

---

## 🔄 ACTUALIZAR LA EXTENSIÓN (cuando haya cambios)

### ✅ SÚPER FÁCIL con el botón ACTUALIZAR.bat:

1. **Abrí la carpeta** del proyecto en el Escritorio (la que descargaste con Git)

2. **Doble click en:** `ACTUALIZAR.bat`

3. **Se abre una ventana negra** que descarga automáticamente las actualizaciones

4. **Esperá a que termine** (vas a ver un mensaje verde ✅ que dice "ACTUALIZACIÓN COMPLETADA")

5. **Presioná cualquier tecla** para cerrar la ventana

6. **Abrí Chrome** → `chrome://extensions/`

7. **Buscá "Observador AutoTag"**

8. **Hacé click en el botón de recargar** (🔄) 

9. **¡Listo!** Ya tenés la última versión 🎉

### ⚠️ Si sale error al actualizar:

- Verificá que tenés internet
- Asegúrate de haber descargado la carpeta con Git (no con ZIP)
- Si descargaste el ZIP, tenés que descargar el ZIP nuevamente cuando haya cambios

---

## ❓ PROBLEMAS COMUNES

### "Error: manifest.json not found"
- ✅ Verificá que estés seleccionando la carpeta correcta
- ✅ Debe ser la carpeta que tiene `manifest.json` directamente adentro
- ✅ La carpeta se llama `tagfinale` (o el nombre que le hayas puesto)

### "No aparece Git Bash Here cuando hago click derecho"
- ✅ Reiniciá la PC después de instalar Git
- ✅ O buscá "Git Bash" en el menú inicio y ejecutalo desde ahí
- ✅ Luego usá el comando `cd Desktop` para ir al escritorio

### "Error: not a git repository" al usar ACTUALIZAR.bat
- ✅ Esto significa que descargaste el ZIP en vez de usar Git
- ✅ Tenés que descargar el proyecto de nuevo con `git clone`
- ✅ O descargar el ZIP nuevamente cuando haya actualizaciones

### "No puedo ver el ícono de la extensión"
- ✅ Hacé click en el ícono de extensiones (🧩) en Chrome
- ✅ Buscá "Observador AutoTag"
- ✅ Hacé click en el pin (📌) para fijarlo

### "La extensión no funciona"
- ✅ Verificá que esté activada (interruptor en verde/azul)
- ✅ Recargá la página de Clientify (F5)
- ✅ Intentá recargar la extensión (🔄 en chrome://extensions/)

### "Git me pide usuario y contraseña"
- ✅ NO debería pedirte nada para descargar (solo para subir cambios)
- ✅ Si te pide, verificá que copiaste bien el comando `git clone`

---

## 📞 SOPORTE

Si tenés algún problema, contactá al equipo técnico con:
- 📸 Captura de pantalla del error
- 📝 Qué estabas haciendo cuando falló
- 🕐 Fecha y hora aproximada

---

**¡Éxito! 🎉**
