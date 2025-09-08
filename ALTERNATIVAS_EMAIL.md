# 🚀 Alternativas para Envío de Emails

Si no puedes encontrar "Contraseñas de aplicaciones" en Gmail, aquí tienes alternativas más simples:

## 📧 **Opción 1: SendGrid (Recomendado)**

### ✅ **Ventajas:**
- ✅ 100 emails gratis por día
- ✅ No requiere 2FA
- ✅ Configuración muy simple
- ✅ Mejor entregabilidad que Gmail
- ✅ Dashboard con estadísticas

### 🔧 **Configuración SendGrid:**

1. **Crear cuenta gratuita:**
   - Ve a [sendgrid.com](https://sendgrid.com)
   - Regístrate con tu email

2. **Generar API Key:**
   - Ve a Settings → API Keys
   - Create API Key → Full Access
   - Copia la clave (empieza con `SG.`)

3. **Configurar en `.env.local`:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=tu_sendgrid_api_key_aqui
CONTACT_EMAIL=contacto@somosbruck.com
```

## 📧 **Opción 2: Outlook/Hotmail**

Si tienes cuenta de Outlook, es más simple:

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=tu_cuenta@outlook.com
SMTP_PASS=tu_contraseña_normal
CONTACT_EMAIL=contacto@somosbruck.com
```

## 📧 **Opción 3: Seguir intentando Gmail**

### **URLs directas a probar:**
- https://myaccount.google.com/apppasswords
- https://security.google.com/settings/security/apppasswords

### **Pasos alternativos:**
1. Ve a https://myaccount.google.com/security
2. Busca "Verificación en 2 pasos" y haz clic
3. Desplázate hasta el final de esa página
4. Busca "Contraseñas de aplicaciones" o "App passwords"

### **Si aún no aparece:**
- Tu cuenta podría ser de Google Workspace (empresa)
- Podría estar deshabilitado por políticas de seguridad
- Google podría haber cambiado la interfaz recientemente

## 🎯 **¿Qué opción prefieres?**

**Recomiendo SendGrid** porque:
- Es más confiable para entrega de emails
- Configuración más simple
- Mejor para uso profesional
- 100 emails/día son suficientes para formulario de contacto

¿Quieres que te ayude a configurar SendGrid o prefieres seguir intentando con Gmail?
