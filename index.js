import pino from 'pino';
import readline from 'readline';
import { loadCommands, uniqueCommands } from './lib/loader.js';
import { handle } from './handler.js';
import { onParticipants } from './lib/events.js';
import config from './config.js';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from './lib/baileys.js';

const ask = q => new Promise(r => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(q, a => { rl.close(); r(a.trim()); });
});

async function start() {
  await loadCommands();
  console.log(`✅ تم تحميل ${uniqueCommands().length} أمر`);

  const { state, saveCreds } = await useMultiFileAuthState('session');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
  });

  sock.ev.on('creds.update', saveCreds);

  let pairingRequested = false;

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // الربط بكود: لازم ننتظر لحد ما الاتصال يجهز (وقتها بيوصل qr)
    if (qr && !sock.authState.creds.registered && !pairingRequested) {
      pairingRequested = true;
      try {
        const number = (config.botNumber || await ask('اكتب رقم البوت بالصيغة الدولية بدون +: ')).replace(/\D/g, '');
        const code = await sock.requestPairingCode(number);
        console.log(`\n🔑 كود الربط: ${code}\nواتساب > الأجهزة المرتبطة > ربط جهاز > ربط برقم الهاتف\n`);
      } catch (e) {
        console.log('❌ فشل طلب كود الربط:', e.message);
        pairingRequested = false;
      }
    }

    if (connection === 'open') console.log('🟢 البوت شغال');

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.log('🔴 تم تسجيل الخروج. امسح مجلد session وشغّل من جديد.');
      } else {
        console.log('🔄 إعادة الاتصال...');
        start();
      }
    }
  });

  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const m of messages) handle(sock, m).catch(console.error);
  });

  sock.ev.on('group-participants.update', ({ id, participants, action }) => {
    onParticipants(sock, id, participants, action).catch(console.error);
  });
}

start();
