# 📧 Guía Completa: Integración SendGrid para BRUCK

## 🎯 **Configuración Final Implementada**

Tu formulario de contacto ahora está listo para usar **SendGrid** como servicio de envío de emails. Solo necesitas seguir estos pasos:

---

## 📋 **PASO 1: Crear cuenta SendGrid (2 minutos)**

### 1.1 Registro
1. **Ve a:** [sendgrid.com](https://sendgrid.com)
2. **Haz clic en:** "Start for Free"
3. **Completa el registro** con tus datos
4. **Confirma tu email** (revisa spam si no llega)

### 1.2 Verificación inicial
- SendGrid te pedirá algunos datos sobre tu uso
- Selecciona: **"Transactional"** (emails automáticos)
- Volumen: **"Less than 40,000"** 

---

## 🔑 **PASO 2: Generar API Key (1 minuto)**

### 2.1 Acceder a API Keys
1. **En el dashboard** de SendGrid
2. **Settings** (menú lateral) → **API Keys**
3. **Haz clic:** "Create API Key"

### 2.2 Configurar la clave
1. **Nombre:** `BRUCK Website Contact Form`
2. **Permisos:** Selecciona **"Full Access"**
3. **Haz clic:** "Create & View"

### 2.3 Copiar la clave
- **⚠️ IMPORTANTE:** Copia la API Key **INMEDIATAMENTE**
- Se ve así: `SG.abc123def456...` (empieza con `SG.`)
- **No podrás verla de nuevo** después de cerrar la ventana

---

## 🛠️ **PASO 3: Crear Cloudflare Worker (3 minutos)**

### 3.1 Acceder a Cloudflare
1. **Ve a:** [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Inicia sesión** con tu cuenta de Cloudflare

### 3.2 Crear el Worker
1. **En el menú lateral:** "Workers & Pages"
2. **Haz clic:** "Create application"
3. **Selecciona:** "Create Worker"
4. **Nombre:** `bruck-contact-handler`
5. **Haz clic:** "Deploy"

### 3.3 Configurar el código
1. **Haz clic:** "Edit code"
2. **Borra todo** el código existente
3. **Copia y pega** el contenido completo del archivo `cloudflare-worker-complete.js`
4. **Haz clic:** "Save and Deploy"

---

## ⚙️ **PASO 4: Configurar Variables del Worker (1 minuto)**

### 4.1 Acceder a configuración
1. **En el Worker**, haz clic en **"Settings"**
2. **Ve a la sección:** "Variables"

### 4.2 Agregar variables
**Agrega estas 3 variables:**

```
Variable 1:
Nombre: SENDGRID_API_KEY
Valor: SG.tu_api_key_completa_aqui

Variable 2:  
Nombre: CONTACT_EMAIL
Valor: contacto@somosbruck.com

Variable 3:
Nombre: FROM_EMAIL
Valor: somos.bruck@gmail.com
```

### 4.3 Guardar configuración
- **Haz clic:** "Save and Deploy" después de agregar cada variable

---

## 🌐 **PASO 5: Obtener URL del Worker (30 segundos)**

### 5.1 Copiar URL
1. **En el Worker**, ve a la pestaña **"Settings"**
2. **En "Triggers"** verás la URL del Worker
3. **Se ve así:** `https://bruck-contact-handler.TU_USUARIO.workers.dev`
4. **Copia la URL completa**

---

## 💻 **PASO 6: Actualizar tu código (1 minuto)**

### 6.1 Editar archivo
**Abre:** `app/page.tsx` (línea 243)

**Cambia esta línea:**
```javascript
const response = await fetch('https://bruck-contact-handler.TU_USUARIO_CLOUDFLARE.workers.dev', {
```

**Por tu URL real:**
```javascript
const response = await fetch('https://bruck-contact-handler.TU_USUARIO_REAL.workers.dev', {
```

### 6.2 Rebuild del proyecto
```bash
$env:STATIC_EXPORT="true"; npm run build
```

---

## 🚀 **PASO 7: Deploy a Cloudflare Pages**

### 7.1 Subir cambios
1. **Commit y push** tus cambios a GitHub
2. **Cloudflare Pages** se actualizará automáticamente
3. **O ejecuta manualmente** el deploy desde el dashboard

---

## 🧪 **PASO 8: Probar el sistema**

### 8.0 Configuración de modo de envío

**Tu aplicación ahora soporta DOS modos:**

#### 🔧 **Modo LOCAL** (Recomendado para testing)
- ✅ **Envía emails reales** usando SendGrid API directamente
- ✅ **Perfecto para probar** credenciales de SendGrid
- ✅ **Funciona en desarrollo** sin necesidad de Worker

#### 🌐 **Modo WORKER**
- ✅ **Usa Cloudflare Worker** para enviar emails
- ✅ **Para producción** con sitio estático

### 8.1 Configurar modo LOCAL para testing

**1. Crea archivo `.env.local` con:**
```env
EMAIL_MODE=local
SENDGRID_API_KEY=SG.tu_api_key_de_sendgrid_aqui
CONTACT_EMAIL=contacto@somosbruck.com
FROM_EMAIL=somos.bruck@gmail.com
```

**2. Reinicia el servidor:**
```bash
# Detén el servidor actual (Ctrl+C)
npm run dev
```

**3. Prueba el formulario:**
- Ve a `http://localhost:3000`
- Completa el formulario
- **Se enviarán emails REALES** 📧
- Verás en consola: `📧 MODO LOCAL - Enviando con SendGrid directo`

### 8.2 Configurar modo WORKER

**Para usar el Worker (cuando esté listo):**
```env
EMAIL_MODE=worker
WORKER_URL=https://bruck-contact-handler.TU_USUARIO.workers.dev
```

## 🧪 **PASO 8: Probar el sistema**

### 8.1 Probar directamente el Worker
**Abre tu terminal y ejecuta:**
```bash
curl -X POST https://tu-worker-url.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test Usuario",
    "email": "tu-email@gmail.com", 
    "mensaje": "Este es un mensaje de prueba"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Mensaje enviado exitosamente. Te responderemos pronto!"
}
```

### 8.2 Probar desde tu sitio web
1. **Ve a:** `tu-sitio.com`
2. **Completa el formulario** de contacto
3. **Envía el mensaje**
4. **Deberías ver:** mensaje de éxito
5. **Revisa:** `contacto@somosbruck.com` para el email
6. **El remitente** debería recibir email de confirmación

---

## 📊 **Verificar en SendGrid**

### 9.1 Dashboard de actividad
1. **En SendGrid**, ve a **"Activity"**
2. **Deberías ver** los emails enviados
3. **Status:** "Delivered" (entregado)

### 9.2 Estadísticas
- **Ve a:** "Stats" para ver métricas
- **Emails enviados, entregados, etc.**

---

## ✅ **Checklist Final**

- [ ] ✅ Cuenta SendGrid creada y verificada
- [ ] 🔑 API Key generada y copiada  
- [ ] 🛠️ Worker creado en Cloudflare
- [ ] ⚙️ Variables configuradas en Worker
- [ ] 🌐 URL del Worker obtenida
- [ ] 💻 Código actualizado con URL real
- [ ] 🚀 Proyecto rebuildeado y deployado
- [ ] 🧪 Sistema probado y funcionando

---

## 🎉 **¡Listo!**

Tu formulario de contacto ahora:

- ✅ **Envía emails reales** a `contacto@somosbruck.com`
- ✅ **Confirma automáticamente** al remitente  
- ✅ **Usa diseños profesionales** con colores de BRUCK
- ✅ **Maneja errores** correctamente
- ✅ **Es gratuito** hasta 100 emails/día
- ✅ **Funciona perfectamente** con Cloudflare Pages

---

## 🆘 **Solución de Problemas**

### Error: "SENDGRID_API_KEY not configured"
- **Causa:** Variable mal configurada en Worker
- **Solución:** Verificar que la API Key esté bien copiada

### Error: "Authentication failed"  
- **Causa:** API Key inválida
- **Solución:** Generar nueva API Key en SendGrid

### Error: "CORS"
- **Causa:** Problema de dominio
- **Solución:** Cambiar `'*'` por tu dominio en el Worker (línea 6)

### No llegan emails
- **Revisar:** Carpeta de spam
- **Verificar:** Activity en SendGrid dashboard
- **Comprobar:** Variables del Worker

---

## 📞 **Soporte**

Si tienes problemas:
1. **Revisa** los logs del Worker en Cloudflare
2. **Verifica** el Activity en SendGrid  
3. **Prueba** el Worker directamente con curl
4. **Comprueba** que todas las variables estén configuradas

**¡Tu sistema de contacto está listo para funcionar! 🚀**
