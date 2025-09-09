// BRUCK Contact Handler - Cloudflare Worker con SendGrid
// Archivo final para usar en Cloudflare Workers
export default {
  async fetch(request, env, ctx) {
    // Configurar CORS para tu dominio
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // Cambia por tu dominio: 'https://somosbruck.com'
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    // Manejar preflight requests (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 200,
        headers: corsHeaders 
      })
    }

    // Solo permitir POST
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, message: 'Método no permitido' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    try {
      // Parsear datos del formulario
      const data = await request.json()
      
      // Validar campos requeridos
      if (!data.nombre || !data.email || !data.mensaje) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Faltan campos requeridos: nombre, email y mensaje' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Formato de email inválido' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Enviar email
      const emailResult = await sendEmailWithSendGrid(data, env)
      
      if (emailResult.success) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Mensaje enviado exitosamente. Te responderemos pronto!' 
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      } else {
        console.error('Error enviando email:', emailResult.error)
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Error al enviar el mensaje. Por favor, inténtalo nuevamente.' 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

    } catch (error) {
      console.error('Error procesando request:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Error interno del servidor' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
  }
}

// Función para enviar email usando SendGrid
async function sendEmailWithSendGrid(data, env) {
  try {
    // Email principal a BRUCK
    const mainEmailPayload = {
      personalizations: [{
        to: [{ 
          email: env.CONTACT_EMAIL || 'contacto@somosbruck.com',
          name: 'BRUCK Contacto'
        }],
        subject: `Nuevo contacto desde la web: ${data.nombre}`
      }],
      from: { 
        email: env.FROM_EMAIL || 'somos.bruck@gmail.com',
        name: 'BRUCK Website'
      },
      content: [{
        type: 'text/html',
        value: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #31AE79; margin: 0; font-size: 24px;">Nuevo Mensaje de Contacto</h1>
                <div style="width: 50px; height: 3px; background: linear-gradient(90deg, #31AE79, #99D0B8); margin: 10px auto;"></div>
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
      }]
    }

    // Enviar email principal
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mainEmailPayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`SendGrid error: ${response.status} - ${errorText}`)
    }

    // Email de confirmación al remitente
    const confirmationPayload = {
      personalizations: [{
        to: [{ 
          email: data.email,
          name: data.nombre
        }],
        subject: 'Gracias por contactarte con BRUCK - Hemos recibido tu mensaje'
      }],
      from: { 
        email: env.FROM_EMAIL || 'somos.bruck@gmail.com',
        name: 'BRUCK'
      },
      content: [{
        type: 'text/html',
        value: `
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
      }]
    }

    // Enviar confirmación
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(confirmationPayload)
    })

    return { success: true }

  } catch (error) {
    console.error('Error en SendGrid:', error)
    return { 
      success: false, 
      error: error.message 
    }
  }
}
