# Configuración del Servicio de Email para BRUCK

## 📧 Configuración de Variables de Entorno

Para que el formulario de contacto funcione correctamente, necesitas crear un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Configuración SMTP para Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=somos.bruck@gmail.com
SMTP_PASS=tu_app_password_aqui
CONTACT_EMAIL=contacto@somosbruck.com
```

## 🔐 Configuración de Gmail

Para obtener la contraseña de aplicación (`SMTP_PASS`):

1. **Activar verificación en 2 pasos:**
   - Ve a [myaccount.google.com](https://myaccount.google.com)
   - Seguridad → Verificación en 2 pasos
   - Activa la verificación en 2 pasos si no está activada

2. **Generar contraseña de aplicación:**
   - En la misma sección de Seguridad
   - Busca "Contraseñas de aplicaciones"
   - Genera una nueva contraseña para "Correo"
   - Usa esta contraseña de 16 caracteres en `SMTP_PASS`

⚠️ **Importante:** Nunca uses tu contraseña normal de Gmail, solo la contraseña de aplicación.

## 🚀 Funcionalidades Implementadas

### ✅ Lo que funciona:

1. **Formulario de contacto actualizado** que envía emails reales
2. **Validación completa** de campos requeridos
3. **Email automático** a `contacto@somosbruck.com` con:
   - Información del contacto
   - Mensaje del usuario
   - Diseño profesional con colores de BRUCK
4. **Email de confirmación** automático al remitente
5. **Manejo de errores** robusto con mensajes informativos
6. **API route** en `/api/contact` para procesar requests

### 📧 Templates de Email:

- **Email a BRUCK:** Información completa del contacto con diseño profesional
- **Email de confirmación:** Mensaje de agradecimiento al usuario que envió el formulario

## 🔧 Comandos para Desarrollo

```bash
# Instalar dependencias (ya instaladas)
npm install

# Ejecutar en modo desarrollo (con API routes)
npm run dev

# Construir para producción estática
STATIC_EXPORT=true npm run build
```

## 🌐 Configuración para Producción

### Opción 1: Usar Vercel (Recomendado)
Si despliegas en Vercel, las API routes funcionarán automáticamente:

1. Configura las variables de entorno en el dashboard de Vercel
2. Despliega normalmente - las API routes estarán disponibles

### Opción 2: Cloudflare Pages con Worker
Para Cloudflare Pages necesitarás un Cloudflare Worker separado para manejar emails.

### Opción 3: Servicio Externo
Usar servicios como EmailJS, Formspree, o Netlify Forms.

## 🧪 Testing

### Probar la API directamente:

```bash
# GET - Verificar que la API esté funcionando
curl http://localhost:3000/api/contact

# POST - Enviar email de prueba
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test Usuario",
    "empresa": "Test Company",
    "email": "test@example.com",
    "mensaje": "Este es un mensaje de prueba desde la API"
  }'
```

### Probar desde el formulario web:
1. Ejecuta `npm run dev`
2. Ve a `http://localhost:3000`
3. Completa el formulario de contacto
4. Verifica que lleguen ambos emails (a BRUCK y confirmación)

## 📋 Checklist de Configuración

- [ ] Crear archivo `.env.local` con las variables correctas
- [ ] Configurar contraseña de aplicación en Gmail
- [ ] Probar envío desde el formulario web
- [ ] Verificar recepción en `contacto@somosbruck.com`
- [ ] Verificar email de confirmación al remitente

## 🐛 Troubleshooting

### Error: "Configuración del servidor de correo incompleta"
- Verifica que todas las variables de entorno estén configuradas
- Reinicia el servidor de desarrollo después de crear `.env.local`

### Error: "Authentication failed"
- Verifica que uses la contraseña de aplicación, no la contraseña normal
- Asegúrate de que la verificación en 2 pasos esté activada

### Error: "Connection timeout"
- Verifica tu conexión a internet
- Algunos firewalls corporativos bloquean SMTP

## 📞 Soporte

Si tienes problemas con la configuración, revisa:
1. Los logs en la consola del navegador (F12)
2. Los logs del servidor en la terminal
3. Las variables de entorno en `.env.local`
