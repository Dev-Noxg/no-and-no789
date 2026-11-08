import 'dotenv/config';

export default {
  botName: 'no and no',
  developer: 'no and no',
  prefix: '/',
  botNumber: process.env.BOT_NUMBER || '201036042537',
  owners: (process.env.OWNERS || '201225622948,201924162879501').split(','),

  // أوامر الذكاء الاصطناعي: المفتاح بيتقرا من متغيرات البيئة (Variables) فقط، أبداً من هنا.
  ai: {
    url: process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  },

  ytdlp: 'yt-dlp',
};
