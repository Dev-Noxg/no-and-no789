import { rand, randInt, sleep, numOf, normAr } from '../../lib/utils.js';
import { group, save } from '../../lib/db.js';
import { db } from '../../lib/db.js';

const WISDOM = [
  'الوقت كالسيف إن لم تقطعه قطعك.', 'من سار على الدرب وصل.', 'العلم في الصغر كالنقش على الحجر.',
  'لا تؤجل عمل اليوم إلى الغد.', 'النجاح رحلة وليس وجهة.', 'ابدأ، فالبداية هي الأصعب.',
  'الفشل هو النجاح المؤجل.', 'من جدّ وجد، ومن زرع حصد.',
];
const DEV_QUOTES = [
  '"Code never lies, comments sometimes do." — الكود مابيكدبش، التعليقات ممكن.',
  '99 مشكلة في الكود، وكلهم سببهم Semicolon ناقصة 😅',
  'لو الكود شغال من أول مرة، يبقى إنت مش فاهم المشكلة لسه 😂',
  'أحسن كومنت في الكود هو اللي مكتوب فيه: "متلمسش الكود ده، هو شغال وخلاص".',
  'الـ Debugging بقى فن، والفنان هو اللي يلاقي الغلطة في سطر مكتوب هو نفسه.',
];
const SARCASM = [
  'كل واحد بيدور على السعادة، وأنا بدور على الواي فاي اللي مكنش بياخد باسورد 😅',
  'أكبر إنجاز في يوم: صحيت، قفلت المنبه، ونمت تاني بضمير مرتاح.',
  'الحياة حلوة، بس لو في تخفيضات.',
  'مفيش حاجة اسمها "هعمل ده بكرة"، في بس حاجة اسمها "هنساه خالص".',
  'التفاؤل إنك تفتح الفريزر وتلاقي حاجة تاكلها.',
];
const CHALLENGES = [
  'تكلم بالفصحى بس لمدة نص ساعة', 'ممنوع تستخدم حرف الألف في رسايلك التلت الجايين',
  'ابعت ستيكر بدل أي رد لمدة 10 دقايق', 'اكتب كل رسالة بالمقلوب لمدة ربع ساعة',
  'ممنوع تكتب "ههه" أو "😂" لمدة ساعة كاملة', 'رد على أي حد بجملة من فيلم أو مسلسل بس',
  'اكتب رسالتك الجاية وأنت مغمض عينيك وما تصلحش الأخطاء',
];
const SNIPPETS = {
  js: {
    function: 'function name(param) {\n  // الكود هنا\n  return param;\n}',
    for: 'for (let i = 0; i < n; i++) {\n  console.log(i);\n}',
    async: 'async function getData() {\n  const res = await fetch(url);\n  return res.json();\n}',
    class: 'class Person {\n  constructor(name) { this.name = name; }\n  greet() { return `Hi ${this.name}`; }\n}',
  },
  python: {
    function: 'def name(param):\n    # الكود هنا\n    return param',
    for: 'for i in range(n):\n    print(i)',
    class: 'class Person:\n    def __init__(self, name):\n        self.name = name\n    def greet(self):\n        return f"Hi {self.name}"',
    try: 'try:\n    pass\nexcept Exception as e:\n    print(e)',
  },
  java: {
    function: 'public static int name(int param) {\n    return param;\n}',
    for: 'for (int i = 0; i < n; i++) {\n    System.out.println(i);\n}',
    class: 'public class Person {\n    String name;\n    Person(String name) { this.name = name; }\n}',
  },
  cpp: {
    function: 'int name(int param) {\n    return param;\n}',
    for: 'for (int i = 0; i < n; i++) {\n    cout << i << endl;\n}',
  },
};

export default [
  { name: 'حكمة', aliases: ['wisdom'], desc: 'حكمة أو عبارة قوية للمبرمجين (ضيف برمجة)',
    async run({ args, reply }) {
      const list = ['برمجة', 'code', 'programmer'].includes(normAr(args[0] || '')) ? DEV_QUOTES : WISDOM;
      reply(`💡 ${rand(list)}`);
    } },

  { name: 'حكمة_اليوم', aliases: ['dailyquote'], desc: 'خاطرة فلسفية أو قفشة ساخرة من شخصية البوت',
    async run({ reply }) { reply(`🎭 ${rand(SARCASM)}`); } },

  { name: 'تحدي', aliases: ['challenge'], desc: 'تحدي عشوائي للجروب', group: true,
    async run({ meta, reply }) {
      const p = rand(meta.participants).id;
      reply(`🔥 *تحدي النهاردة*\n\nيا @${numOf(p)}، تحديك هو:\n*${rand(CHALLENGES)}*\n\n⏳ بالتوفيق!`, [p]);
    } },

  { name: 'مفتاح', aliases: ['snippet', 'code'], desc: 'قالب كود جاهز: /مفتاح js function',
    async run({ args, reply }) {
      const lang = (args[0] || '').toLowerCase(), key = (args[1] || '').toLowerCase();
      const L = SNIPPETS[lang];
      if (!L) return reply(`اللغات المتاحة: ${Object.keys(SNIPPETS).join(', ')}\nمثال: /مفتاح js function`);
      if (!key || !L[key]) return reply(`القوالب المتاحة لـ ${lang}: ${Object.keys(L).join(', ')}\nمثال: /مفتاح ${lang} ${Object.keys(L)[0]}`);
      reply(`\`\`\`${L[key]}\`\`\``);
    } },

  { name: 'ملاحظة', aliases: ['note', 'notes'], desc: 'دفتر ملاحظات الجروب: اضافة/حذف/مسح', group: true,
    async run({ g, args, restText, pushName, reply }) {
      g.notes ??= [];
      const op = normAr(args[0] || '');
      if (['اضافة', 'add'].includes(op)) {
        if (!restText) return reply('اكتب نص الملاحظة بعد "اضافة".');
        g.notes.push({ text: restText, by: pushName }); save();
        return reply(`✅ اتضافت الملاحظة رقم ${g.notes.length}`);
      }
      if (['حذف', 'del', 'delete'].includes(op)) {
        const i = parseInt(args[1]) - 1;
        if (isNaN(i) || !g.notes[i]) return reply('اكتب رقم ملاحظة صحيح.');
        g.notes.splice(i, 1); save();
        return reply('🗑️ تم الحذف.');
      }
      if (['مسح', 'clear'].includes(op)) { g.notes = []; save(); return reply('🗑️ تم مسح كل الملاحظات.'); }
      if (!g.notes.length) return reply('📝 الدفتر فاضي. أضف ملاحظة: /ملاحظة اضافة <النص>');
      reply('📝 *ملاحظات الجروب*\n\n' + g.notes.map((n, i) => `${i + 1}. ${n.text} — ${n.by}`).join('\n'));
    } },

  { name: 'قرعة', aliases: ['draw', 'lottery'], desc: 'قرعة مشوقة: /قرعة احمد | سارة | محمد (أو فاضي لعضو عشوائي)', group: true,
    async run({ meta, text, reply }) {
      const opts = text ? text.split(/\s*[|،,]\s*/).filter(Boolean) : meta.participants.map(p => '@' + numOf(p.id));
      const mentions = text ? [] : meta.participants.map(p => p.id);
      const m1 = await reply('🎲 جاري السحب');
      await sleep(900); await reply('🎲 جاري السحب..');
      await sleep(900); await reply('🎲 جاري السحب...');
      await sleep(900);
      reply(`🏆 *الفايز هو:*\n\n🎉 ${rand(opts)} 🎉`, mentions);
    } },

  { name: 'رسالة_للمستقبل', aliases: ['future'], desc: 'رسالة سرية تتفتح بعد مدة: /رسالة_للمستقبل 2h النص', group: true,
    async run({ sock, jid, sender, args, reply }) {
      const m = (args[0] || '').match(/^(\d+)(m|h|d|د|س|ي)$/i);
      if (!m) return reply('مثال: /رسالة_للمستقبل 2h هفتكركم بعد ساعتين\nالوحدات: m/د دقيقة، h/س ساعة، d/ي يوم');
      const n = parseInt(m[1]);
      const unit = m[2].toLowerCase();
      const ms = n * (['m', 'د'].includes(unit) ? 60000 : ['h', 'س'].includes(unit) ? 3600000 : 86400000);
      if (ms > 7 * 86400000) return reply('❌ أقصى مدة أسبوع واحد.');
      const text = args.slice(1).join(' ');
      if (!text) return reply('اكتب الرسالة بعد المدة.');
      db.settings.scheduled ??= [];
      const item = { id: Date.now() + Math.random(), jid, sender, text, due: Date.now() + ms };
      db.settings.scheduled.push(item); save();
      reply(`📮 اتسجلت! هتتفتح وتتبعت للجروب بعد ${n}${unit}.`);
      setTimeout(async () => {
        try { await sock.sendMessage(jid, { text: `📬 *رسالة من الماضي من @${numOf(sender)}*\n\n${text}`, mentions: [sender] }); } catch {}
        db.settings.scheduled = db.settings.scheduled.filter(x => x.id !== item.id); save();
      }, ms);
    } },
];
