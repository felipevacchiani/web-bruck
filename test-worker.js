// Script de testing para el Worker de BRUCK
// Ejecuta este script para probar que el Worker funciona correctamente

const WORKER_URL = 'https://bruck-contact-handler.TU_USUARIO.workers.dev';

// Datos de prueba
const testData = {
  nombre: 'Test Usuario',
  empresa: 'Test Company',
  email: 'test@example.com',
  mensaje: 'Este es un mensaje de prueba desde el script de testing. El Worker debería procesar este mensaje y enviar emails tanto a BRUCK como de confirmación al remitente.'
};

async function testWorker() {
  console.log('🧪 Iniciando test del Worker...\n');
  
  try {
    console.log('📤 Enviando datos de prueba...');
    console.log('URL:', WORKER_URL);
    console.log('Datos:', JSON.stringify(testData, null, 2));
    console.log('\n⏳ Esperando respuesta...\n');
    
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    console.log('📨 Respuesta recibida:');
    console.log('Status:', response.status);
    console.log('Resultado:', JSON.stringify(result, null, 2));
    
    if (response.ok && result.success) {
      console.log('\n✅ ¡TEST EXITOSO!');
      console.log('✅ Worker funcionando correctamente');
      console.log('✅ Emails enviados correctamente');
      console.log('\n📧 Verifica:');
      console.log('1. Email en contacto@somosbruck.com');
      console.log('2. Email de confirmación en test@example.com');
      console.log('3. Activity en SendGrid dashboard');
    } else {
      console.log('\n❌ TEST FALLIDO');
      console.log('❌ Error:', result.message || 'Error desconocido');
      console.log('\n🔍 Revisar:');
      console.log('1. Variables del Worker (SENDGRID_API_KEY, etc.)');
      console.log('2. URL del Worker correcta');
      console.log('3. Logs del Worker en Cloudflare');
    }
    
  } catch (error) {
    console.log('\n💥 ERROR DE CONEXIÓN');
    console.log('Error:', error.message);
    console.log('\n🔍 Posibles causas:');
    console.log('1. URL del Worker incorrecta');
    console.log('2. Worker no deployado');
    console.log('3. Problema de red/CORS');
  }
}

// Ejecutar test
testWorker();

// Para usar este script:
// 1. Instala Node.js si no lo tienes
// 2. Reemplaza TU_USUARIO en WORKER_URL con tu usuario real
// 3. Ejecuta: node test-worker.js
