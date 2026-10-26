import { mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { loadData } from './validate.mjs';

const data = await loadData();
const preface = JSON.parse(await readFile(new URL('../data/preface.json', import.meta.url), 'utf8'));
if (!preface || !['title', 'subtitle', 'note'].every(key => typeof preface[key] === 'string' && preface[key].trim()) || !Array.isArray(preface.paragraphs) || !preface.paragraphs.length || !preface.paragraphs.every(p => typeof p === 'string' && p.trim())) throw new Error('前言必须包含标题、副标题、整理说明和正文段落');
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const statuses = { 'not-started': '尚未开始', 'in-progress': '进行中', paused: '暂时休息', completed: '已完成' };
const kinds = { 'writing-planning': '写作与规划', learning: '学习实践', coding: '编码成果', business: '业务验证' };
const records = [...data.records].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
const projects = data.projects.map((p, i) => {
  const own = records.filter(r => r.projectId === p.id);
  return `<article class="project"><div class="project-top"><span class="eyebrow">PROJECT / 0${i + 1}</span><span class="status">${statuses[p.status]}</span></div><h3>${escape(p.name)}</h3><p>${escape(p.description)}</p><div class="result"><span class="label">最近成果 · ${own.length} 条已验证记录</span><p>${own[0] ? escape(own[0].title) : '尚无已完成的开发或学习成果。'}</p></div><div class="next"><span class="label">下一步 · 建议动作，尚未完成</span><p>${escape(p.nextAction)}</p></div></article>`;
}).join('');
const timeline = records.map(r => `<li id="record-${escape(r.id)}"><time datetime="${r.date}">${r.date}</time><article><div class="tags"><span>${kinds[r.kind]}</span><span>${escape(r.projectId ?? 'Agent Journey')}</span></div><h3>${escape(r.title)}</h3><p>${escape(r.summary)}</p><details><summary>查看验证与证据</summary><p><strong>${escape(r.verification.method)}</strong>：${escape(r.verification.result)}</p>${r.evidence.length ? `<ul>${r.evidence.map(e => `<li><a href="${escape(e.url)}" rel="noopener noreferrer">${escape(e.label)}</a></li>`).join('')}</ul>` : '<p class="muted">未公开附件；验证依据为作者确认。</p>'}</details></article></li>`).join('');
const skills = data.skills.length ? `<ul class="skill-list">${data.skills.map(s => `<li><h3>${escape(s.name)}</h3><p>${escape(s.description)}</p>${s.recordIds.map(id => `<a href="#record-${escape(id)}">查看验证记录</a>`).join(' · ')}</li>`).join('')}</ul>` : '<div class="empty"><span class="empty-mark" aria-hidden="true">↗</span><div><h3>能力，等待实践来证明。</h3><p>目前暂无已验证技能。完成实践并留下验证记录后，再将能力加入这里。</p></div></div>';
let html = await readFile(new URL('../src/index.html', import.meta.url), 'utf8');
for (const [key, value] of Object.entries({ preface: `<article class="preface-copy"><span class="eyebrow">PREFACE / ${escape(preface.subtitle)}</span><h2 id="preface-title">${escape(preface.title)}</h2><p class="preface-note">${escape(preface.note)}</p>${preface.paragraphs.map(p => `<p>${escape(p)}</p>`).join('')}</article>`, projects, timeline: timeline || '<li>暂无已完成记录。</li>', skills, updated: data.updatedAt, count: String(records.length) })) html = html.replaceAll(`{{${key}}}`, value);
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/index.html', import.meta.url), html);
await copyFile(new URL('../src/style.css', import.meta.url), new URL('../dist/style.css', import.meta.url));
console.log(`构建完成：dist/，${records.length} 条成果记录`);

for (const file of ['admin.mjs', 'article-crypto.mjs']) await copyFile(new URL(`../src/${file}`, import.meta.url), new URL(`../dist/${file}`, import.meta.url));
const encrypted = JSON.parse(await readFile(new URL('../data/original.encrypted.json', import.meta.url), 'utf8'));
if (encrypted.version !== 1 || encrypted.iterations !== 600000 || !['salt', 'iv', 'ciphertext'].every(k => typeof encrypted[k] === 'string' && /^[A-Za-z0-9+/]+={0,2}$/.test(encrypted[k]))) throw new Error('原文加密数据无效');
await copyFile(new URL('../data/original.encrypted.json', import.meta.url), new URL('../dist/original.encrypted.json', import.meta.url));

// Remove obsolete pages from prior builds as well as fresh deployments.
for (const file of ['original.html', 'original.mjs']) await rm(new URL(`../dist/${file}`, import.meta.url), { force: true });
