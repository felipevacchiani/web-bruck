import nodemailer from 'nodemailer';

// Configuración del transporter - Soporta Gmail y SendGrid
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verificar la configuración del transporter
export const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✅ Servidor SMTP listo para enviar emails');
    return true;
  } catch (error) {
    console.error('❌ Error en la configuración SMTP:', error);
    return false;
  }
};

// Interfaz para los datos del formulario de contacto
export interface ContactFormData {
  nombre: string;
  empresa?: string;
  email: string;
  mensaje: string;
}

// Función para enviar email de contacto
export const sendContactEmail = async (data: ContactFormData) => {
  try {
    // Verificar configuración antes de enviar
    const isConfigValid = await verifyEmailConfig();
    if (!isConfigValid) {
      throw new Error('Configuración SMTP inválida');
    }

    // Template del email para el destinatario (BRUCK)
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.CONTACT_EMAIL || 'contacto@somosbruck.com',
      subject: `Nuevo contacto desde la web: ${data.nombre}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #31AE79; margin: 0; font-size: 24px;">Nuevo Mensaje de Contacto</h1>
              <div style="width: 50px; height: 3px; background: linear-gradient(90deg, #31AE79, #99D0B8); margin: 10px auto;"></div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h3 style="color: #333; margin-bottom: 5px;">Información del Contacto:</h3>
            </div>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: bold; color: #555; width: 30%;">Nombre:</td>
                <td style="padding: 12px; background-color: #fff; color: #333;">${data.nombre}</td>
              </tr>
              ${data.empresa ? `
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: bold; color: #555;">Empresa:</td>
                <td style="padding: 12px; background-color: #fff; color: #333;">${data.empresa}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 12px; background-color: #f8f9fa; font-weight: bold; color: #555;">Email:</td>
                <td style="padding: 12px; background-color: #fff; color: #333;">
                  <a href="mailto:${data.email}" style="color: #31AE79; text-decoration: none;">${data.email}</a>
                </td>
              </tr>
            </table>
            
            <div style="margin-top: 30px;">
              <h3 style="color: #333; margin-bottom: 15px;">Mensaje:</h3>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #31AE79;">
                <p style="margin: 0; color: #555; line-height: 1.6;">${data.mensaje.replace(/\n/g, '<br>')}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 14px; margin: 0;">
                Este mensaje fue enviado desde el formulario de contacto de 
                <a href="https://somosbruck.com" style="color: #31AE79; text-decoration: none;">somosbruck.com</a>
              </p>
            </div>
          </div>
        </div>
      `
    };

    // Enviar el email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado exitosamente:', info.messageId);

    // Enviar email de confirmación al remitente
    const confirmationMailOptions = {
      from: process.env.SMTP_USER,
      to: data.email,
      subject: 'Gracias por contactarte con BRUCK - Hemos recibido tu mensaje',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #31AE79; margin: 0; font-size: 24px;">¡Gracias por contactarte con BRUCK!</h1>
              <div style="width: 50px; height: 3px; background: linear-gradient(90deg, #31AE79, #99D0B8); margin: 10px auto;"></div>
            </div>
            
            <p style="color: #555; line-height: 1.6; font-size: 16px;">Hola <strong>${data.nombre}</strong>,</p>
            
            <p style="color: #555; line-height: 1.6;">
              Hemos recibido tu mensaje y queremos agradecerte por tu interés en nuestros servicios. 
              Nuestro equipo revisará tu consulta y te responderemos a la brevedad.
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #31AE79;">
              <p style="margin: 0; color: #555; font-weight: bold;">Resumen de tu mensaje:</p>
              <p style="margin: 10px 0 0 0; color: #666;">"${data.mensaje.substring(0, 150)}${data.mensaje.length > 150 ? '...' : ''}"</p>
            </div>
            
            <p style="color: #555; line-height: 1.6;">
              Mientras tanto, te invitamos a conocer más sobre nosotros y nuestros casos de éxito en 
              <a href="https://somosbruck.com" style="color: #31AE79; text-decoration: none;">nuestra web</a>.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://somosbruck.com" style="display: inline-block; background: linear-gradient(90deg, #31AE79, #99D0B8); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Visitar nuestro sitio web
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 14px; margin: 0;">
                BRUCK - Profesionalizamos Pymes<br>
                <a href="mailto:contacto@somosbruck.com" style="color: #31AE79; text-decoration: none;">contacto@somosbruck.com</a>
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(confirmationMailOptions);
    console.log('✅ Email de confirmación enviado al remitente');

    return {
      success: true,
      messageId: info.messageId,
      message: 'Email enviado exitosamente'
    };

  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      message: 'Error al enviar el email'
    };
  }
};
