// دايرة أخطاء بسيطة في الذاكرة (آخر 50 خطأ)، بتتصفر لما تقفل البوت.
const buf = [];
const MAX = 50;

export function pushError(where, err) {
  buf.push({ time: new Date().toISOString(), where, message: String(err?.message || err), stack: err?.stack || '' });
  if (buf.length > MAX) buf.shift();
}
export function getErrors(n = 10) { return buf.slice(-n).reverse(); }
export function clearErrors() { buf.length = 0; }
