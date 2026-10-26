const encoder = new TextEncoder();
const bytes = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
const base64 = value => {
  let binary = '';
  for (const byte of new Uint8Array(value)) binary += String.fromCharCode(byte);
  return btoa(binary);
};
const iterations = 600000;
const context = encoder.encode('Agent Journey original article v1');
async function keyFor(password, salt, usage) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, [usage]);
}
export async function encryptArticle(plaintext, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await keyFor(password, salt, 'encrypt');
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: context }, key, encoder.encode(plaintext));
  return { version: 1, iterations, salt: base64(salt), iv: base64(iv), ciphertext: base64(ciphertext) };
}
export async function decryptArticle(payload, password) {
  if (payload?.version !== 1 || payload.iterations !== iterations) throw new Error('不支持的原文格式');
  const salt = bytes(payload.salt);
  const iv = bytes(payload.iv);
  if (salt.length !== 16 || iv.length !== 12) throw new Error('原文数据损坏');
  const key = await keyFor(password, salt, 'decrypt');
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: context }, key, bytes(payload.ciphertext));
  return new TextDecoder('utf-8', { fatal: true }).decode(plaintext);
}
