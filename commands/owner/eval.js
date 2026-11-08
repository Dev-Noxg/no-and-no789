import util from 'util';
import { db, save } from '../../lib/db.js';

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const MAX_OUT = 3000;
const TIMEOUT = 10000;

function rawCode(m, prefix) {
  const raw = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || '';
  let code = raw.replace(new RegExp('^' + prefix + '\\S+\\s*'), '').trim();
  code = code.replace(/^```(?:js|javascript)?\s*/i, '').replace(/```$/, '').trim();
  return code;
}

export default {
  name: 'تنفيذ',
  aliases: ['eval'],
  desc: 'تنفيذ كود JavaScript والنتيجة في الشات (للمطور فقط)',
  owner: true,
  async run({ sock, m, jid, sender, meta, g, u, prefix, reply, send, react }) {
    const code = rawCode(m, prefix);
    if (!code) return reply('اكتب الكود بعد الأمر. مثال:\n/تنفيذ 2 + 2');

    const logs = [];
    const fakeConsole = { log: (...a) => logs.push(a.map(x => (typeof x === 'string' ? x : util.inspect(x, { depth: 2 }))).join(' ')) };
    fakeConsole.error = fakeConsole.warn = fakeConsole.info = fakeConsole.log;

    const ctx = { sock, m, jid, sender, meta, g, u, db, save, reply, send, react, console: fakeConsole };
    const names = Object.keys(ctx);

    let result, error;
    try {
      const fn = new AsyncFunction(...names, `"use strict";\n${code}`);
      const run = fn(...names.map(n => ctx[n]));
      result = await Promise.race([run, new Promise((_, rej) => setTimeout(() => rej(new Error(`انتهى الوقت (${TIMEOUT / 1000} ثانية)`)), TIMEOUT))]);
    } catch (e) { error = e; }

    await react(error ? '❌' : '✅');
    const fmt = v => { const s = typeof v === 'string' ? v : util.inspect(v, { depth: 3, maxArrayLength: 50 }); return s.length > MAX_OUT ? s.slice(0, MAX_OUT) + '\n... (اتقطع)' : s; };

    let out = '';
    if (logs.length) out += '📋 *console:*\n' + fmt(logs.join('\n')) + '\n\n';
    if (error) out += '❌ *خطأ:*\n' + fmt(error.stack || error.message || String(error));
    else out += '✅ *النتيجة:*\n' + (result === undefined ? '(undefined)' : fmt(result));
    await reply(out.slice(0, 4000));
  },
};
