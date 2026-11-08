# no and no — WhatsApp Bot

## التشغيل محليًا
1. `npm install`
2. انسخ `.env.example` لملف اسمه `.env` واملأ القيم (خصوصًا GROQ_API_KEY)
3. `npm start` → ادخل كود الربط في واتساب رقم البوت

## التشغيل على Railway
1. ارفع المشروع (من غير session و node_modules و database) على GitHub
2. Railway → New Project → Deploy from GitHub
3. Settings → Start Command: `node index.js`
4. Variables: ضيف BOT_NUMBER و OWNERS و GROQ_API_KEY
5. أضف Volume وثبّته على مجلدي session و database (وإلا هتفقد الربط عند كل إعادة تشغيل)

## الأقسام
الاعدادات، الادمن، المجموعات، الاعضاء، اسلاميات، المطورين، الادوات، الالعاب،
البنك، افكار_جديدة، الملصقات، التحميل، الذكاء الاصطناعي، امثله

## إضافة أمر
شوف commands/_TEMPLATE.txt
