import { NextRequest, NextResponse } from 'next/server';
import { sendContactEmail, type ContactFormData } from '@/lib/email';

// Configurar CORS para permitir requests del frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Manejar preflight requests (OPTIONS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Manejar requests POST para envío de emails
export async function POST(request: NextRequest) {
  try {
    // Verificar que existan las variables de entorno necesarias
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('❌ Variables de entorno SMTP no configuradas');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Configuración del servidor de correo incompleta' 
        },
        { 
          status: 500,
          headers: corsHeaders 
        }
      );
    }

    // Parsear el cuerpo de la request
    const body: ContactFormData = await request.json();
    
    // Validar datos requeridos
    if (!body.nombre || !body.email || !body.mensaje) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Faltan campos requeridos: nombre, email y mensaje' 
        },
        { 
          status: 400,
          headers: corsHeaders 
        }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Formato de email inválido' 
        },
        { 
          status: 400,
          headers: corsHeaders 
        }
      );
    }

    // Validar longitud mínima del mensaje
    if (body.mensaje.length < 10) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'El mensaje debe tener al menos 10 caracteres' 
        },
        { 
          status: 400,
          headers: corsHeaders 
        }
      );
    }

    console.log('📧 Procesando envío de email para:', body.email);

    // Enviar el email
    const result = await sendContactEmail(body);

    if (result.success) {
      console.log('✅ Email procesado exitosamente');
      return NextResponse.json(
        {
          success: true,
          message: 'Mensaje enviado exitosamente. Te responderemos pronto!',
          messageId: result.messageId
        },
        { 
          status: 200,
          headers: corsHeaders 
        }
      );
    } else {
      console.error('❌ Error en el envío:', result.error);
      return NextResponse.json(
        {
          success: false,
          message: 'Error al enviar el mensaje. Por favor, inténtalo nuevamente.',
          error: result.error
        },
        { 
          status: 500,
          headers: corsHeaders 
        }
      );
    }

  } catch (error) {
    console.error('❌ Error procesando request:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor. Por favor, inténtalo nuevamente.',
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { 
        status: 500,
        headers: corsHeaders 
      }
    );
  }
}

// Método GET para verificar que la API esté funcionando
export async function GET() {
  return NextResponse.json(
    {
      message: 'API de contacto funcionando correctamente',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSmtpConfig: !!(process.env.SMTP_USER && process.env.SMTP_PASS)
      }
    },
    { 
      status: 200,
      headers: corsHeaders 
    }
  );
}
