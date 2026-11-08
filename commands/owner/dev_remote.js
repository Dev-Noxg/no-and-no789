import fs from 'fs';
import os from 'os';
import { spawn } from 'child_process';
import { fmtDur } from '../../lib/utils.js';
import { db, save, saveNow } from '../../lib/db.js';
import { getErrors } from '../../lib/logs.js';

export default [
  { name: 'إعادة_تشغيل', aliases: ['restart'], desc: 'إعادة تشغيل البوت عن بُعد',
    async run({ reply }) {
      await reply('🔄 جاري إعادة التشغيل...');
      saveNow();
      setTimeout(() => {
        spawn(process.argv[0], process.argv.slice(1), { detached: true, stdio: 'inherit', cwd: process.cwd() }).unref();
        process.exit(0);
      }, 800);
    } },

  { name: 'حالة_السيرفر', aliases: ['serverstats', 'sysinfo'], desc: 'استهلاك الرام والمساحة ومدة التشغيل',
    async run({ reply }) {
      const mem = process.memoryUsage();
      const totalMem = os.totalmem(), freeMem = os.freemem();
      let disk = 'غير متاح';
      try {
        const st = fs.statfsSync(process.cwd());
        disk = `${((st.bsize * st.bfree) / 1073741824).toFixed(1)}GB متاحة من ${((st.bsize * st.blocks) / 1073741824).toFixed(1)}GB`;
      } catch {}
      reply(`🖥️ *حالة السيرفر*\n\n` +
        `🧠 رام البوت: ${(mem.rss / 1048576).toFixed(0)}MB\n` +
        `📊 رام السيرفر: ${((totalMem - freeMem) / 1073741824).toFixed(1)}GB من ${(totalMem / 1073741824).toFixed(1)}GB\n` +
        `💾 المساحة: ${disk}\n⏱️ مدة التشغيل: ${fmtDur(process.uptime() * 1000)}\n` +
        `👥 المستخدمين المسجلين: ${Object.keys(db.users).length}`);
    } },

  { name: 'جلب_لوج', aliases: ['logs'], desc: 'ارسال آخر الأخطاء كملف',
    async run({ send, reply }) {
      const errs = getErrors(50);
      if (!errs.length) return reply('✅ مفيش أخطاء مسجلة.');
      const text = errs.map(e => `[${e.time}] ${e.where}\n${e.message}\n${e.stack}\n`).join('\n---\n');
      await send({ document: Buffer.from(text, 'utf8'), mimetype: 'text/plain', fileName: `logs-${Date.now()}.txt` });
    } },

  { name: 'أخطاء', aliases: ['errors'], desc: 'عرض آخر 5 أخطاء في الشات',
    async run({ reply }) {
      const errs = getErrors(5);
      if (!errs.length) return reply('✅ مفيش أخطاء مسجلة.');
      reply('🐞 *آخر الأخطاء*\n\n' + errs.map((e, i) => `${i + 1}. [${e.where}] ${e.message}`).join('\n\n'));
    } },

  { name: 'صيانة', aliases: ['maintenance'], desc: 'تفعيل/إيقاف وضع الصيانة (البوت يرد عليك بس)',
    async run({ args, reply }) {
      const a = (args[0] || '').toLowerCase();
      if (['تشغيل', 'on', 'start'].includes(a)) { db.settings.mode = 'private'; save(); return reply('🔧 وضع الصيانة *مفعّل*. البوت هيستجيب لك إنت بس.'); }
      if (['ايقاف', 'إيقاف', 'off', 'stop'].includes(a)) { db.settings.mode = 'public'; save(); return reply('✅ وضع الصيانة *متوقف*. البوت رجع يشتغل للكل.'); }
      reply(`الحالة الحالية: ${db.settings.mode === 'private' ? 'صيانة 🔧' : 'شغال 🟢'}\nاكتب: /صيانة تشغيل  أو  /صيانة ايقاف`);
    } },
];
