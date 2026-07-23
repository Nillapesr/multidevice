let statusInterval;

async function updateStatus() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        
        const dot = document.getElementById('statusDot');
        const text = document.getElementById('statusText');
        const count = document.getElementById('sessionCount');
        
        const statusMap = {
            'connected': { text: '✅ Online', class: 'connected' },
            'disconnected': { text: '❌ Offline', class: 'disconnected' }
        };
        
        const status = statusMap[data.status] || statusMap['disconnected'];
        dot.className = `status-indicator ${data.status}`;
        text.textContent = status.text;
        count.textContent = `${data.total || 0} bot`;
        
        const list = document.getElementById('sessionList');
        if (data.sessions && data.sessions.length > 0) {
            list.innerHTML = data.sessions.map(s => `
                <div class="session-item">
                    <span class="number">${s}</span>
                    <span class="badge">🟢 Aktif</span>
                </div>
            `).join('');
        } else {
            list.innerHTML = '<p style="color: #9ca3af;">Belum ada session aktif</p>';
        }
        
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

// PAIRING - FIX: ga ada validasi!
document.getElementById('pairBtn').addEventListener('click', async () => {
    const btn = document.getElementById('pairBtn');
    const input = document.getElementById('pairInput');
    const result = document.getElementById('pairResult');
    const number = input.value.trim();
    
    // HANYA CEK KOSONG
    if (!number) {
        result.className = 'result-box show error';
        result.innerHTML = '❌ Masukkan nomor HP dulu!';
        return;
    }
    
    btn.disabled = true;
    btn.textContent = '⏳...';
    result.className = 'result-box';
    
    try {
        const response = await fetch('/api/pair', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number })
        });
        
        const data = await response.json();
        
        if (data.success) {
            result.className = 'result-box show success';
            result.innerHTML = `
                ✅ Berhasil!<br>
                <span class="code">🔑 ${data.pairingCode}</span>
                Masukkan kode di WhatsApp > Perangkat > Tautkan Perangkat
            `;
            setTimeout(updateStatus, 2000);
        } else {
            result.className = 'result-box show error';
            result.innerHTML = `❌ ${data.error || 'Gagal'}`;
        }
    } catch (error) {
        result.className = 'result-box show error';
        result.innerHTML = `❌ ${error.message}`;
    }
    
    btn.disabled = false;
    btn.textContent = 'Dapatkan Kode';
});

// START BOT
document.getElementById('startBtn').addEventListener('click', async () => {
    const btn = document.getElementById('startBtn');
    const input = document.getElementById('startInput');
    const result = document.getElementById('startResult');
    const number = input.value.trim();
    
    if (!number) {
        result.className = 'result-box show error';
        result.innerHTML = '❌ Masukkan nomor HP dulu!';
        return;
    }
    
    btn.disabled = true;
    btn.textContent = '⏳...';
    result.className = 'result-box';
    
    try {
        const response = await fetch('/api/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number })
        });
        
        const data = await response.json();
        
        if (data.success) {
            result.className = 'result-box show success';
            result.innerHTML = `✅ ${data.message}`;
            setTimeout(updateStatus, 2000);
        } else {
            result.className = 'result-box show error';
            result.innerHTML = `❌ ${data.error}`;
        }
    } catch (error) {
        result.className = 'result-box show error';
        result.innerHTML = `❌ ${error.message}`;
    }
    
    btn.disabled = false;
    btn.textContent = 'Start Bot';
});

// STOP BOT
document.getElementById('stopBtn').addEventListener('click', async () => {
    const btn = document.getElementById('stopBtn');
    const input = document.getElementById('stopInput');
    const result = document.getElementById('stopResult');
    const number = input.value.trim();
    
    if (!number) {
        result.className = 'result-box show error';
        result.innerHTML = '❌ Masukkan nomor HP dulu!';
        return;
    }
    
    btn.disabled = true;
    btn.textContent = '⏳...';
    result.className = 'result-box';
    
    try {
        const response = await fetch('/api/stop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number })
        });
        
        const data = await response.json();
        
        if (data.success) {
            result.className = 'result-box show success';
            result.innerHTML = `✅ ${data.message}`;
            setTimeout(updateStatus, 2000);
        } else {
            result.className = 'result-box show error';
            result.innerHTML = `❌ ${data.message}`;
        }
    } catch (error) {
        result.className = 'result-box show error';
        result.innerHTML = `❌ ${error.message}`;
    }
    
    btn.disabled = false;
    btn.textContent = 'Stop Bot';
});

// SEND MESSAGE
document.getElementById('sendBtn').addEventListener('click', async () => {
    const btn = document.getElementById('sendBtn');
    const from = document.getElementById('sendFrom').value.trim();
    const to = document.getElementById('sendTo').value.trim();
    const msg = document.getElementById('sendMsg').value.trim();
    const result = document.getElementById('sendResult');
    
    if (!from || !to || !msg) {
        result.className = 'result-box show error';
        result.innerHTML = '❌ Semua field harus diisi!';
        return;
    }
    
    btn.disabled = true;
    btn.textContent = '⏳...';
    result.className = 'result-box';
    
    try {
        const response = await fetch('/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number: from, to, message: msg })
        });
        
        const data = await response.json();
        
        if (data.success) {
            result.className = 'result-box show success';
            result.innerHTML = `✅ ${data.message}`;
        } else {
            result.className = 'result-box show error';
            result.innerHTML = `❌ ${data.error}`;
        }
    } catch (error) {
        result.className = 'result-box show error';
        result.innerHTML = `❌ ${error.message}`;
    }
    
    btn.disabled = false;
    btn.textContent = 'Kirim';
});

// Update status every 3 seconds
updateStatus();
statusInterval = setInterval(updateStatus, 3000);
