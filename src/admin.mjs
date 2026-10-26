import { decryptArticle } from './article-crypto.mjs';

const toggle = document.querySelector('#admin-toggle');
const dialog = document.querySelector('#admin-dialog');
const form = document.querySelector('#unlock-form');
const input = document.querySelector('#password');
const status = document.querySelector('#unlock-status');
const submit = form.querySelector('button');
const preface = document.querySelector('#preface');
const publicContent = [...preface.childNodes];
let active = false;
let attempt = 0;
let request;

toggle.hidden = false;
toggle.setAttribute('aria-haspopup', 'dialog');
function cancelAttempt() {
  attempt += 1;
  request?.abort();
  request = undefined;
  input.value = '';
  status.textContent = '';
  submit.disabled = false;
}
function reset() {
  cancelAttempt();
  if (active) preface.replaceChildren(...publicContent);
  active = false;
  toggle.textContent = '管理员模式';
  toggle.setAttribute('aria-haspopup', 'dialog');
  delete document.body.dataset.admin;
  if (dialog.open) dialog.close();
}
toggle.addEventListener('click', () => {
  if (active) {
    reset();
    window.location.reload();
    return;
  }
  dialog.showModal();
  if (!globalThis.crypto?.subtle) {
    status.textContent = '当前环境无法解密，请通过 HTTPS 或本机 localhost 访问。';
    submit.disabled = true;
  }
  input.focus();
});
document.querySelector('#admin-cancel').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', cancelAttempt);
// Invalidate immediately on Escape, including during an in-flight unlock.
dialog.addEventListener('cancel', cancelAttempt);
form.addEventListener('submit', async event => {
  event.preventDefault();
  const currentAttempt = ++attempt;
  request?.abort();
  request = new AbortController();
  submit.disabled = true;
  status.textContent = '正在解锁…';
  let plaintext;
  try {
    const response = await fetch('./original.encrypted.json', { cache: 'no-store', signal: request.signal });
    if (!response.ok) throw new Error('fetch');
    const payload = await response.json();
    if (currentAttempt !== attempt || !dialog.open) return;
    try {
      plaintext = await decryptArticle(payload, input.value);
    } catch {
      if (currentAttempt === attempt && dialog.open) {
        status.textContent = '密码不正确，或原文数据已损坏。请重新输入。';
        input.value = '';
        input.focus();
      }
      return;
    }
    if (currentAttempt !== attempt || !dialog.open) return;
    const paragraphs = JSON.parse(plaintext);
    if (!Array.isArray(paragraphs) || !paragraphs.every(p => typeof p === 'string')) throw new Error('format');
    const article = document.createElement('article');
    article.className = 'preface-copy original-article';
    const label = document.createElement('span');
    label.className = 'eyebrow';
    label.textContent = 'PREFACE / 管理员模式 · 作者原文';
    const title = document.createElement('h2');
    title.id = 'preface-title';
    title.tabIndex = -1;
    title.textContent = '我不知道耶';
    const note = document.createElement('p');
    note.className = 'preface-note';
    note.textContent = '随笔及后记原文，保留作者原有段落与表达。';
    article.append(label, title, note);
    for (const text of paragraphs) {
      const p = document.createElement('p');
      p.textContent = text;
      article.append(p);
    }
    preface.replaceChildren(article);
    active = true;
    document.body.dataset.admin = 'true';
    toggle.textContent = '退出';
    toggle.removeAttribute('aria-haspopup');
    dialog.close();
    title.focus();
  } catch (error) {
    if (currentAttempt === attempt && dialog.open && error.name !== 'AbortError') status.textContent = '暂时无法读取原文，请稍后重试。';
  } finally {
    plaintext = undefined;
    if (currentAttempt === attempt) submit.disabled = false;
  }
});
window.addEventListener('pagehide', reset);
