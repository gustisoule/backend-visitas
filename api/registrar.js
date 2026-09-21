import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Permitir peticiones CORS desde cualquier origen (tu web en surge.sh)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const visitData = req.body;

        // 1. Inicializar Supabase con las credenciales secretas
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

        // 2. Guardar en la base de datos
        const { error: dbError } = await supabase
            .from('visitas')
            .insert([visitData]);

        if (dbError) console.error('Error en BD:', dbError);

        // 3. Formatear el mensaje para Telegram
        const mensaje = `🚨 ¡Nueva visita en tu portafolio! 🚨\n\n` +
                        `🌍 *Ubicación:* ${visitData.ciudad}, ${visitData.region}, ${visitData.pais}\n` +
                        `🌐 *IP:* ${visitData.ip}\n` +
                        `💻 *Plataforma:* ${visitData.plataforma}\n` +
                        `📱 *Dispositivo:* ${visitData.dispositivo}\n` +
                        `📐 *Pantalla:* ${visitData.pantalla}\n` +
                        `⏰ *Hora:* ${new Date(visitData.timestamp).toLocaleString()}`;

        // 4. Enviar notificación al Bot de Telegram
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: mensaje,
                parse_mode: 'Markdown'
            })
        });

        return res.status(200).json({ success: true, message: 'Registrado correctamente' });
    } catch (err) {
        console.error('Error general:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
