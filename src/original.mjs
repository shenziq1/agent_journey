import { decryptArticle } from './article-crypto.mjs';

const form = document.querySelector('#unlock-form');
const input = document.querySelector('#password');
const status = document.querySelector('#unlock-status');
const gate = document.querySelector('#gate');
const article = document.querySelector('#article');
const body = document.querySelector('#article-body');
const button = form.querySelector('button');
if (!globalThis.crypto?.subtle) {
  status.textContent = '当前环境无法解密，请通过 HTTPS 或本机 localhost 访问。';
  button.disabled = true;
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  button.disabled = true;
  status.textContent = '正在解锁…';
  let plaintext;
  try {
    const response = await fetch('./original.encrypted.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('fetch');
    const payload = await response.json();
    try {
      // Preserve every character, including leading/trailing whitespace.
      plaintext = await decryptArticle(payload, input.value);
    } catch {
      status.textContent = '密码不正确，或原文数据已损坏。请重新输入。';
      input.focus();
      return;
    }
    const paragraphs = JSON.parse(plaintext);
    if (!Array.isArray(paragraphs) || !paragraphs.every(p => typeof p === 'string')) throw new Error('format');
    const fragment = document.createDocumentFragment();
    for (const text of paragraphs) {
      const p = document.createElement('p');
      p.textContent = text;
      fragment.append(p);
    }
    body.replaceChildren(fragment);
    input.value = '';
    status.textContent = '';
    gate.hidden = true;
    article.hidden = false;
    document.querySelector('#article-title').focus();
  } catch {
    status.textContent = '暂时无法读取原文，请稍后刷新重试。';
  } finally {
    plaintext = undefined;
    button.disabled = false;
  }
});
function lockArticle() {
  body.replaceChildren();
  article.hidden = true;
  gate.hidden = false;
  input.value = '';
  status.textContent = '';
}
document.querySelector('#lock').addEventListener('click', () => { lockArticle(); input.focus(); });
window.addEventListener('pagehide', lockArticle);
