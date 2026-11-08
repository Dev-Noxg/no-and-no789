import fs from 'fs';
import config from '../../config.js';
import { db, user, save, saveNow, dbFile } from '../../lib/db.js';
import { numOf, sleep, money } from '../../lib/utils.js';

const amountOf = (rest) => parseInt(rest.find(x => /^\d+$/.test(x) && x.length < 12));

export default [
  { name: 'حظر_عام', aliases: ['gban'], desc: 'منع شخص من استخدام البوت',
    async run({ target, reply }) {
      if (!target) return reply('منشن الشخص أو اكتب رقمه.');
      const k = numOf(target);
      if (config.owners.includes(k)) return reply('⛔ مينفعش تحظر مطور.');
      if (!db.settings.banned.includes(k)) db.settings.banned.push(k);
      save(); reply(`🚫 تم حظر ${k} من استخدام البوت.`);
    } },

  { name: 'الغاء_حظر_عام', aliases: ['ungban'], desc: 'الغاء حظر شخص من البوت',
    async run({ target, reply }) {
      if (!target) return reply('منشن الشخص أو اكتب رقمه.');
      db.settings.banned = db.settings.banned.filter(n => n !== numOf(target));
      save(); reply(`✅ تم إلغاء حظر ${numOf(target)}.`);
    } },

  { name: 'المحظورين', aliases: ['banlist'], desc: 'قائمة المحظورين من البوت',
    async run({ reply }) {
      reply(db.settings.banned.length ? '🚫 *المحظورين:*\n' + db.settings.banned.map(n => `▫️ ${n}`).join('\n') : '✅ مفيش محظورين.');
    } },

  { name: 'اذاعة', aliases: ['broadcast', 'bc'], desc: 'رسالة لكل الجروبات (بتأخير لتجنب الحظر)',
    async run({ sock, text, reply }) {
      if (!text) return reply('اكتب نص الإذاعة بعد الأمر.');
      const ids = Object.keys(await sock.groupFetchAllParticipating());
      await reply(`📡 جاري الإرسال لـ ${ids.length} جروب...`);
      let ok = 0;
      for (const id of ids) {
        try { await sock.sendMessage(id, { text: `📢 *إذاعة من ${config.developer}*\n\n${text}` }); ok++; } catch {}
        await sleep(3000);
      }
      reply(`✅ تم الإرسال لـ ${ok}/${ids.length}`);
    } },

  { name: 'الجروبات', aliases: ['groups', 'chats'], desc: 'قائمة الجروبات اللي البوت فيها',
    async run({ sock, reply }) {
      const gs = Object.values(await sock.groupFetchAllParticipating());
      reply(`🏘️ *الجروبات (${gs.length})*\n\n` + gs.slice(0, 40).map((g, i) => `${i + 1}. ${g.subject} — ${g.participants.length} عضو\n   ${g.id}`).join('\n'));
    } },

  { name: 'مغادرة', aliases: ['leave'], desc: 'خروج البوت من جروب (داخل الجروب أو بالـ id)',
    async run({ sock, jid, isGroup, args, reply }) {
      const id = args[0]?.endsWith('@g.us') ? args[0] : (isGroup ? jid : null);
      if (!id) return reply('اكتبها داخل الجروب، أو: /مغادرة <id الجروب>');
      await sock.sendMessage(id, { text: '👋 مع السلامة!' }).catch(() => {});
      await sock.groupLeave(id);
    } },

  { name: 'ايقاف', aliases: ['shutdown', 'stop'], desc: 'ايقاف البوت',
    async run({ reply }) { await reply('🔴 جاري إيقاف البوت...'); saveNow(); setTimeout(() => process.exit(0), 1000); } },

  { name: 'وضع_البوت', aliases: ['mode'], desc: 'عام (للكل) أو خاص (للمطور فقط)',
    async run({ args, reply }) {
      const a = args[0];
      if (['عام', 'public'].includes(a)) db.settings.mode = 'public';
      else if (['خاص', 'private'].includes(a)) db.settings.mode = 'private';
      else return reply(`الوضع الحالي: ${db.settings.mode === 'public' ? 'عام' : 'خاص'}\nاكتب: /وضع_البوت عام  أو  /وضع_البوت خاص`);
      save(); reply(`✅ وضع البوت الآن: ${db.settings.mode === 'public' ? 'عام 🌍' : 'خاص 🔒'}`);
    } },

  { name: 'اضافة_فلوس', aliases: ['addmoney'], desc: 'اضافة فلوس لعضو',
    async run({ target, sender, rest, reply }) {
      const n = amountOf(rest); const t = target || sender;
      if (!n) return reply('مثال: /اضافة_فلوس @user 500');
      user(t).money += n; save(); reply(`✅ تمت إضافة ${money(n)} لـ @${numOf(t)}`, [t]);
    } },

  { name: 'خصم_فلوس', aliases: ['removemoney'], desc: 'خصم فلوس من عضو',
    async run({ target, sender, rest, reply }) {
      const n = amountOf(rest); const t = target || sender;
      if (!n) return reply('مثال: /خصم_فلوس @user 500');
      const u = user(t); u.money = Math.max(0, u.money - n); save();
      reply(`✅ تم خصم ${money(n)} من @${numOf(t)}`, [t]);
    } },

  { name: 'تصفير_مستخدم', aliases: ['resetuser'], desc: 'مسح بيانات مستخدم',
    async run({ target, reply }) {
      if (!target) return reply('منشن الشخص أو اكتب رقمه.');
      delete db.users[numOf(target)]; save(); reply(`🗑️ تم مسح بيانات ${numOf(target)}.`);
    } },

  { name: 'نسخة_احتياطية', aliases: ['backup'], desc: 'ارسال ملف قاعدة البيانات',
    async run({ send }) {
      saveNow();
      await send({ document: fs.readFileSync(dbFile), mimetype: 'application/json', fileName: `backup-${Date.now()}.json` });
    } },

  { name: 'حالة_البوت', aliases: ['setstatus'], desc: 'تغيير حالة (بايو) رقم البوت',
    async run({ sock, text, reply }) {
      if (!text) return reply('اكتب الحالة الجديدة.');
      await sock.updateProfileStatus(text); reply('✅ تم تغيير الحالة.');
    } },

  { name: 'اسم_البوت', aliases: ['setbotname'], desc: 'تغيير اسم رقم البوت',
    async run({ sock, text, reply }) {
      if (!text) return reply('اكتب الاسم الجديد.');
      await sock.updateProfileName(text); reply('✅ تم تغيير الاسم.');
    } },

  { name: 'صورة_البوت', aliases: ['setbotpp'], desc: 'تغيير صورة رقم البوت (ارد على صورة)',
    async run({ sock, getMedia, reply }) {
      const media = await getMedia(['imageMessage']);
      if (!media) return reply('↩️ ارد على صورة أو ابعت صورة مع الأمر.');
      await sock.updateProfilePicture(sock.user.id, media.buffer); reply('✅ تم تغيير صورة البوت.');
    } },

  { name: 'ارسل', aliases: ['sendmsg'], desc: 'ارسال رسالة لرقم: /ارسل 2010... النص',
    async run({ sock, args, reply }) {
      const num = (args[0] || '').replace(/\D/g, '');
      const msg = args.slice(1).join(' ');
      if (!num || !msg) return reply('مثال: /ارسل 201012345678 أهلا');
      await sock.sendMessage(num + '@s.whatsapp.net', { text: msg }); reply('✅ تم الإرسال.');
    } },

  { name: 'زرف', aliases: ['destroy', 'nuke'], desc: 'طرد كل الأعضاء وتغيير كل حاجة في الجروب (خطير! تأكيد مطلوب)', group: true, botAdmin: true,
    async run({ sock, jid, meta, sender, args, reply }) {
      if ((args[0] || '').trim() !== 'تأكيد') {
        return reply('⚠️ *تحذير خطير*\n\nالأمر ده هيطرد *كل* أعضاء الجروب ويغيّر اسمه ووصفه وصورته ويقفله نهائيًا. الفعل ده مينفعش يترجع.\n\nلو متأكد، اكتب:\n*/زرف تأكيد*');
      }
      await reply('💥 جاري التنفيذ...');

      // 1) تغيير هوية الجروب لـ no and no
      try { await sock.groupUpdateSubject(jid, '💀 no and no 💀'); } catch {}
      try { await sock.groupUpdateDescription(jid, 'تم تدمير هذا الجروب بواسطة no and no'); } catch {}
      try {
        const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640"><rect width="640" height="640" fill="#000"/><text x="320" y="340" font-size="64" fill="#fff" text-anchor="middle" font-family="Tahoma">no and no</text></svg>');
        await sock.updateProfilePicture(jid, svg);
      } catch {}

      // 2) طرد كل الأعضاء ماعدا المطور ونفسي
      const me = [sock.user?.id, sock.user?.lid].filter(Boolean).map(x => x.split('@')[0].split(':')[0]);
      const keep = new Set([...me, sender.split('@')[0]]);
      const targets = meta.participants.map(p => p.id).filter(id => !keep.has(id.split('@')[0]));

      let kicked = 0;
      for (let i = 0; i < targets.length; i += 20) {
        const batch = targets.slice(i, i + 20);
        try { await sock.groupParticipantsUpdate(jid, batch, 'remove'); kicked += batch.length; } catch {}
        await new Promise(r => setTimeout(r, 1500));
      }

      // 3) قفل الجروب وبعدها البوت يسيب الجروب
      try { await sock.groupSettingUpdate(jid, 'announcement'); } catch {}
      await reply(`💀 تم طرد ${kicked} عضو وتغيير كل حاجة في الجروب.\n\n*no and no* 👑`);
      setTimeout(() => sock.groupLeave(jid).catch(() => {}), 3000);
    } },
];