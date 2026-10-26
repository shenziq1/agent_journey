import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { loadData, validate } from '../scripts/validate.mjs';

const data = await loadData();
test('当前公开数据通过完整校验', () => {
  assert.equal(validate(structuredClone(data)).updatedAt, data.updatedAt);
});
const fixture = {
  updatedAt: '2026-10-26',
  projects: [{ id: 'learnAgent', name: 'learnAgent', description: '学习', status: 'not-started', nextAction: '确认任务' }],
  records: [{ id: 'direction', date: '2026-10-26', projectId: null, kind: 'writing-planning', title: '确定方向', summary: '规划成果', verification: { method: '作者确认', result: '已完成' }, evidence: [] }],
  skills: []
};
for (const [name, mutate] of [
  ['无效日期', d => { d.records[0].date = '2026-02-30'; }],
  ['缺少验证', d => { delete d.records[0].verification; }],
  ['未知项目', d => { d.records[0].projectId = 'unknown'; }],
  ['重复记录', d => { d.records.push(structuredClone(d.records[0])); }],
  ['危险证据链接', d => { d.records[0].evidence.push({ label: 'bad', url: 'javascript:alert(1)' }); }],
  ['无依据技能', d => { d.skills.push({ id: 'test', name: 'test', description: 'test', recordIds: ['missing'] }); }],
  ['零进度矛盾', d => { d.records[0].projectId = 'learnAgent'; }]
]) test(`拒绝${name}`, () => { const copy = structuredClone(fixture); mutate(copy); assert.throws(() => validate(copy)); });
test('构建输出包含项目、成果、能力区及本地样式，无模板残留', async () => {
  const result = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: new URL('../', import.meta.url), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  for (const text of ['learnAgent', 'mealAgent', 'id="projects"', 'id="timeline"', 'id="skills"']) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /\{\{\w+\}\}/);
  assert.ok((await readFile(new URL('../dist/style.css', import.meta.url))).length > 0);
});
