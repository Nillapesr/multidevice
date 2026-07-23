const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const sessions = new Map();

async function startBot(number) {
    const { state, saveCreds } = await useMultiFileAuthState(`/tmp/session_${number}`);
    
    const sock = makeWASocket({
        auth: state,
        browser: ['Chrome', 'Windows', '10'],
        printQRInTerminal: false,
        connectTimeoutMs: 5000,
        defaultQueryTimeoutMs: 5000,
        generateHighQualityLinkPreview: false
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'open') {
            console.log(`✅ Bot ${number} Connected!`);
            sessions.set(number, sock);
            
            sock.ev.on('messages.upsert', async (m) => {
                const msg = m.messages[0];
                if (!msg.key.fromMe && msg.message?.conversation) {
                    const text = msg.message.conversation.toLowerCase();
                    if (text === 'ping') {
                        await sock.sendMessage(msg.key.remoteJid, { 
                            text: `pong! (${number})` 
                        });
                    } else if (text === 'status') {
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: `✅ Bot aktif!\nNomor: ${number}\nTotal session: ${sessions.size}`
                        });
                    }
                }
            });
        }
        
        if (connection === 'close') {
            sessions.delete(number);
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                setTimeout(() => startBot(number), 5000);
            }
        }
    });
    
    sock.ev.on('creds.update', saveCreds);
    return sock;
}

// ============ API ENDPOINTS ============

// 1. PAIRING CODE
app.post('/api/pair', async (req, res) => {
    const { number } = req.body;
    if (!number) {
        return res.status(400).json({ error: 'Nomor HP required' });
    }
    
    try {
        const sock = await startBot(number);
        const code = await sock.requestPairingCode(number);
        res.json({
            success: true,
            pairingCode: code,
            number: number,
            message: `Masukkan kode ${code} di WhatsApp`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. START BOT
app.post('/api/start', async (req, res) => {
    const { number } = req.body;
    if (!number) {
        return res.status(400).json({ error: 'Nomor HP required' });
    }
    
    try {
        await startBot(number);
        res.json({
            success: true,
            message: `Bot ${number} started`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. STOP BOT
app.post('/api/stop', async (req, res) => {
    const { number } = req.body;
    if (!number) {
        return res.status(400).json({ error: 'Nomor HP required' });
    }
    
    const sock = sessions.get(number);
    if (sock) {
        sock.end();
        sessions.delete(number);
        res.json({ success: true, message: `Bot ${number} stopped` });
    } else {
        res.json({ success: false, message: `Bot ${number} not found` });
    }
});

// 4. KIRIM PESAN
app.post('/api/send', async (req, res) => {
    const { number, to, message } = req.body;
    if (!number || !to || !message) {
        return res.status(400).json({ error: 'Number, to, and message required' });
    }
    
    const sock = sessions.get(number);
    if (!sock) {
        return res.status(404).json({ error: `Bot ${number} not active` });
    }
    
    try {
        await sock.sendMessage(to + '@s.whatsapp.net', { text: message });
        res.json({ success: true, message: 'Pesan terkirim' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. LIST SESSIONS
app.get('/api/sessions', (req, res) => {
    res.json({
        total: sessions.size,
        sessions: Array.from(sessions.keys())
    });
});

// 6. STATUS
app.get('/api/status', (req, res) => {
    res.json({
        status: sessions.size > 0 ? 'connected' : 'disconnected',
        total: sessions.size,
        sessions: Array.from(sessions.keys()),
        timestamp: new Date().toISOString()
    });
});

// 7. HOME
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;
