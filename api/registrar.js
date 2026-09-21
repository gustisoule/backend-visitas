import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Configurar CORS para permitir peticiones desde cualquier origen (o tu portafolio)[cite: 1]
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responder inmediatamente a las peticiones de verificación OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Permitir solo métodos POST si lo deseas
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Inicializar Supabase con las variables de entorno de Vercel
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Obtener datos del cliente (opcional, si los mandas desde el frontend)
    const { page, navegador } = req.body || {};

    // 1. Guardar en Supabase (ajusta el nombre de tu tabla, por ejemplo 'visitas')
    const { data, error: dbError } = await supabase
      .from('visitas')
      .insert([{ page: page || 'Portafolio', navegador: navegador || req.headers['user-agent'] }]);

    if (dbError) {
      console.error('Error en Supabase:', dbError);
    }

    // 2. Enviar notificación a Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (botToken && chatId) {
      const mensaje = `🚀 ¡Nueva visita en tu portafolio!\n🌐 Página: ${page || 'Inicio'}`;
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: mensaje,
        }),
      });
    }

    return res.status(200).json({ success: true, message: 'Visita registrada correctamente' });
  } catch (error) {
    console.error('Error general en el servidor:', error);
    return res.status(500).json({ error: error.message });
  }
}
