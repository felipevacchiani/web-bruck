// Configuraciones alternativas de proveedores SMTP

export const emailProviders = {
  // Gmail (requiere 2FA + contraseña de aplicación)
  gmail: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requiresAuth: true,
    requires2FA: true,
    instructions: 'Requiere verificación en 2 pasos y contraseña de aplicación'
  },

  // Outlook/Hotmail (más flexible)
  outlook: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    requiresAuth: true,
    requires2FA: false,
    instructions: 'Puedes usar tu contraseña normal de Outlook'
  },

  // Yahoo (requiere contraseña de aplicación)
  yahoo: {
    host: 'smtp.mail.yahoo.com',
    port: 587,
    secure: false,
    requiresAuth: true,
    requires2FA: true,
    instructions: 'Requiere contraseña de aplicación'
  },

  // Servicios profesionales más flexibles
  sendgrid: {
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    requiresAuth: true,
    requires2FA: false,
    instructions: 'Usa API Key como contraseña, usuario "apikey"'
  },

  // Para desarrollo/testing
  ethereal: {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    requiresAuth: true,
    requires2FA: false,
    instructions: 'Solo para testing - emails no se entregan realmente'
  }
};

// Función para crear configuración según el proveedor
export const createTransporterConfig = (provider: keyof typeof emailProviders) => {
  const config = emailProviders[provider];
  
  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };
};
